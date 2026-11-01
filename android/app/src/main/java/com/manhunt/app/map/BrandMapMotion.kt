package com.manhunt.app.map

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Point
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.os.Build
import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.data.ZoneDto
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Overlay
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.min
import kotlin.math.sin

/** One animation tick for the map layer: 30 fps is the ceiling used by the hunt screen. */
internal const val BRAND_MAP_FRAME_MS = 33L

private const val SWEEP_LOOP_MS = 4_200f
private const val ZONE_PULSE_MS = 2_600f
private const val ZONE_SHIMMER_MS = 3_400f
private const val PREY_PULSE_MS = 1_700f
private const val DASH_CYCLE_MS = 1_300f
private const val INTRO_MS = 900f

/**
 * The map is the one place where "more animation" has to earn its frame budget, so the
 * in-game brand motion is a single osmdroid [Overlay] with one reused Canvas state:
 *
 * - a very subtle cyan radar sweep centred on the player's own position (4.2 s turn);
 * - pulsing coral report rings on fresh prey markers (two-phase fade), amber static ring
 *   for stale/flagged reports, nothing for eliminated prey (they are not drawn at all);
 * - a breathing zone boundary plus an occasional shimmer ring;
 * - the coral trails drawn as flowing dashes instead of static polylines;
 * - a quiet asphalt tint, chalk scanlines and a vignette that read as a field radar;
 * - a one-shot scan/fade on open.
 *
 * Everything is a pure function of [clockMs] (or of the static state when motion is off):
 * no per-frame allocations - the projection points, GeoPoint, Paths, RectF, shaders and
 * Paints are all reused, and the size-dependent scanline Path / vignette shader are rebuilt
 * only when the view size changes.
 */
internal class BrandRadarOverlay : Overlay() {

    // Live state pushed from MatchMap's update() lambda (references are swapped, not copied).
    private var ownLocation: LatLng? = null
    private var prey: List<PreyLocationStatus> = emptyList()
    private var zone: ZoneDto? = null
    // Map.values.forEach would allocate a view + iterator per frame; snapshot once per
    // update and index the list in draw() instead.
    private var trailPolylines: List<List<TrailPoint>> = emptyList()
    private var showPrey = false
    private var showOwnMarker = true

    // Theme tokens, converted to ARGB by MatchMap.
    private var primaryColor = 0xFF22D3EE.toInt()
    private var preyColor = 0xFFFF7A59.toInt()
    private var staleColor = 0xFFF0A43A.toInt()
    private var fieldColor = 0xFF0B1220.toInt()
    private var chalkColor = 0xFFE6EDF7.toInt()

    private var motionEnabled = false
    private var clockMs = 0f
    private var intro = 1f

    // Reused geometry - zero allocations inside draw().
    private val point = Point()
    private val geo = GeoPoint(0.0, 0.0)
    private val trailPath = Path()
    private val sweepPath = Path()
    private val sweepRect = RectF()
    private val scanPath = Path()
    private var cachedWidth = -1
    private var cachedHeight = -1
    private var cachedDensity = 0f

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.BUTT
        strokeJoin = Paint.Join.MITER
    }
    private val dashPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val scanPaint = Paint().apply { style = Paint.Style.STROKE }
    private val tintPaint = Paint()
    private val vignettePaint = Paint().apply { style = Paint.Style.FILL }
    private var vignetteShader: Shader? = null

    fun update(
        ownLocation: LatLng?,
        prey: List<PreyLocationStatus>,
        zone: ZoneDto?,
        trails: Map<String, List<TrailPoint>>,
        showPrey: Boolean,
        showOwnMarker: Boolean,
    ) {
        this.ownLocation = ownLocation
        this.prey = prey
        this.zone = zone
        this.trailPolylines = if (trails.isEmpty()) emptyList() else trails.values.toList()
        this.showPrey = showPrey
        this.showOwnMarker = showOwnMarker
    }

    fun setColors(primary: Int, prey: Int, stale: Int, field: Int, chalk: Int) {
        primaryColor = primary
        preyColor = prey
        staleColor = stale
        fieldColor = field
        chalkColor = chalk
    }

    /** Enables/disables the clock. Disabling also drops the intro so the still is complete. */
    fun setMotion(enabled: Boolean) {
        motionEnabled = enabled
        if (!enabled) {
            clockMs = 0f
            intro = 0f
        }
    }

    fun tick(deltaMs: Float) {
        if (!motionEnabled) return
        clockMs += deltaMs
        if (intro > 0f) intro = (intro - deltaMs / INTRO_MS).coerceAtLeast(0f)
    }

    override fun draw(canvas: Canvas, mapView: MapView, shadow: Boolean) {
        if (shadow) return
        val width = mapView.width
        val height = mapView.height
        if (width <= 0 || height <= 0) return
        val density = mapView.resources.displayMetrics.density
        ensureCached(width, height, density, mapView)
        val projection = mapView.projection
        val t = if (motionEnabled) clockMs else 0f
        val phase = (t % SWEEP_LOOP_MS) / SWEEP_LOOP_MS

        drawField(canvas, width, height)
        drawZone(canvas, mapView, projection, t)
        // Trails exist only for hunters watching visible prey, so gate on showPrey as well.
        if (showPrey) drawTrails(canvas, projection, density, t)

        if (showOwnMarker) drawOwnPulse(canvas, projection, width, height, density, phase, t)
        if (showPrey) drawPreyRings(canvas, projection, density, t)

        drawVignette(canvas, width, height)
        drawIntro(canvas, width, height, density)
    }

    /** Asphalt tint + chalk scanlines: subtle field-radar texture over the OSM tiles. */
    private fun drawField(canvas: Canvas, width: Int, height: Int) {
        tintPaint.color = fieldColor
        tintPaint.alpha = 16
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), tintPaint)
        scanPaint.color = chalkColor
        scanPaint.alpha = 7
        scanPaint.strokeWidth = 1f
        canvas.drawPath(scanPath, scanPaint)
    }

    /**
     * Zone: breathing boundary over the static polygon fill. Reduced motion keeps a single
     * calm ring, so the information (the zone) is identical.
     */
    private fun drawZone(canvas: Canvas, mapView: MapView, projection: org.osmdroid.views.Projection, t: Float) {
        val z = zone ?: return
        geo.setCoords(z.centerLat, z.centerLng)
        projection.toPixels(geo, point)
        val radiusPx = projection.metersToPixels(z.radiusM.toFloat(), z.centerLat, z.centerLng)
        if (radiusPx <= 0f) return
        val pulse = if (motionEnabled) 0.5f + 0.5f * sin(2f * PI.toFloat() * t / ZONE_PULSE_MS) else 0f
        strokePaint.color = primaryColor
        strokePaint.strokeWidth = 2f * mapView.resources.displayMetrics.density
        strokePaint.alpha = (110 + 70 * pulse).toInt()
        canvas.drawCircle(point.x.toFloat(), point.y.toFloat(), radiusPx, strokePaint)
        if (motionEnabled) {
            // Occasional expanding shimmer: one ring leaving the boundary and fading out.
            val shimmer = (t % ZONE_SHIMMER_MS) / ZONE_SHIMMER_MS
            strokePaint.alpha = ((1f - shimmer) * 55f).toInt()
            strokePaint.strokeWidth = 1.5f * mapView.resources.displayMetrics.density
            canvas.drawCircle(
                point.x.toFloat(),
                point.y.toFloat(),
                radiusPx + shimmer * 12f * mapView.resources.displayMetrics.density,
                strokePaint,
            )
        }
    }

    /** Coral trails as flowing dashes; a dark casing keeps them readable over bright roads. */
    private fun drawTrails(
        canvas: Canvas,
        projection: org.osmdroid.views.Projection,
        density: Float,
        t: Float,
    ) {
        if (trailPolylines.isEmpty()) return
        val onPx = 7f * density
        val offPx = 6f * density
        val period = onPx + offPx
        val phase = if (motionEnabled) (t / DASH_CYCLE_MS * 26f * density) % period else 0f
        dashPaint.color = preyColor
        dashPaint.alpha = 205
        dashPaint.strokeWidth = 2.6f * density
        strokePaint.color = Color.argb(120, 0, 0, 0)
        strokePaint.strokeWidth = 5f * density
        strokePaint.alpha = 120

        var index = 0
        while (index < trailPolylines.size) {
            val points = trailPolylines[index]
            if (points.size < 2) {
                index++
                continue
            }
            // Casing first (one path draw), then the flowing coral dashes.
            trailPath.reset()
            var first = true
            var i = 0
            while (i < points.size) {
                val p = points[i]
                geo.setCoords(p.lat, p.lng)
                projection.toPixels(geo, point)
                if (first) {
                    trailPath.moveTo(point.x.toFloat(), point.y.toFloat())
                    first = false
                } else {
                    trailPath.lineTo(point.x.toFloat(), point.y.toFloat())
                }
                i++
            }
            canvas.drawPath(trailPath, strokePaint)

            var distance = -phase
            var drawing = true
            var remaining = if (drawing) onPx else offPx
            var havePrev = false
            var prevX = 0f
            var prevY = 0f
            i = 0
            while (i < points.size) {
                val p = points[i]
                geo.setCoords(p.lat, p.lng)
                projection.toPixels(geo, point)
                val x = point.x.toFloat()
                val y = point.y.toFloat()
                if (!havePrev) {
                    prevX = x
                    prevY = y
                    havePrev = true
                    i++
                    continue
                }
                val dx = x - prevX
                val dy = y - prevY
                val length = hypot(dx, dy)
                if (length <= 0f) {
                    prevX = x
                    prevY = y
                    i++
                    continue
                }
                val ux = dx / length
                val uy = dy / length
                var consumed = 0f
                while (consumed < length) {
                    // Skip the part before the first dash (the phase offset).
                    if (distance < 0f) {
                        val skip = min(-distance, length - consumed)
                        distance += skip
                        consumed += skip
                        continue
                    }
                    val step = min(remaining, length - consumed)
                    val nx = prevX + ux * (consumed + step)
                    val ny = prevY + uy * (consumed + step)
                    if (drawing) {
                        canvas.drawLine(prevX + ux * consumed, prevY + uy * consumed, nx, ny, dashPaint)
                    }
                    consumed += step
                    remaining -= step
                    if (remaining <= 0f) {
                        drawing = !drawing
                        remaining = if (drawing) onPx else offPx
                    }
                }
                prevX = x
                prevY = y
                i++
            }
            index++
        }
    }

    /** Very subtle radar sweep centred on the player; drawn only when motion is enabled. */
    private fun drawOwnPulse(
        canvas: Canvas,
        projection: org.osmdroid.views.Projection,
        width: Int,
        height: Int,
        density: Float,
        phase: Float,
        t: Float,
    ) {
        val me = ownLocation ?: return
        geo.setCoords(me.lat, me.lng)
        projection.toPixels(geo, point)
        val cx = point.x.toFloat()
        val cy = point.y.toFloat()
        val sweepRadius = min(width, height) * 0.58f
        if (motionEnabled) {
            val angle = phase * 360f
            sweepPath.reset()
            sweepRect.set(cx - sweepRadius, cy - sweepRadius, cx + sweepRadius, cy + sweepRadius)
            sweepPath.moveTo(cx, cy)
            sweepPath.arcTo(sweepRect, angle - 26f, 52f)
            sweepPath.close()
            fillPaint.color = primaryColor
            fillPaint.alpha = 15
            canvas.drawPath(sweepPath, fillPaint)
            strokePaint.color = primaryColor
            strokePaint.alpha = 60
            strokePaint.strokeWidth = 1.4f * density
            val lead = angle * (PI.toFloat() / 180f)
            canvas.drawLine(
                cx,
                cy,
                cx + cos(lead) * sweepRadius,
                cy + sin(lead) * sweepRadius,
                strokePaint,
            )
        }
        // Still frame: a calm cyan halo so the player can find themselves even with motion off.
        strokePaint.color = primaryColor
        strokePaint.alpha = if (motionEnabled) 40 else 90
        strokePaint.strokeWidth = 1.2f * density
        canvas.drawCircle(cx, cy, 16f * density, strokePaint)
    }

    /**
     * Prey report rings. Fresh reports pulse coral; stale/flagged reports keep a static amber
     * ring (same colour as the stale marker). Eliminated reported prey are never drawn.
     */
    private fun drawPreyRings(
        canvas: Canvas,
        projection: org.osmdroid.views.Projection,
        density: Float,
        t: Float,
    ) {
        var index = 0
        while (index < prey.size) {
            val p = prey[index]
            index++
            if (!p.hasReport || p.eliminated || p.lat == null || p.lng == null) continue
            geo.setCoords(p.lat!!, p.lng!!)
            projection.toPixels(geo, point)
            val cx = point.x.toFloat()
            val cy = point.y.toFloat()
            val stale = p.stale || p.flagged
            if (stale) {
                strokePaint.color = staleColor
                strokePaint.alpha = 150
                strokePaint.strokeWidth = 1.8f * density
                canvas.drawCircle(cx, cy, 13f * density, strokePaint)
                continue
            }
            if (!motionEnabled) {
                strokePaint.color = preyColor
                strokePaint.alpha = 140
                strokePaint.strokeWidth = 1.8f * density
                canvas.drawCircle(cx, cy, 15f * density, strokePaint)
                continue
            }
            // Two offset pulse rings per fresh report; both are functions of the same clock.
            var ring = 0
            while (ring < 2) {
                val cycle = ((t / PREY_PULSE_MS) + ring * 0.5f) % 1f
                strokePaint.color = preyColor
                strokePaint.alpha = ((1f - cycle) * 150f).toInt()
                strokePaint.strokeWidth = 1.8f * density
                canvas.drawCircle(cx, cy, (13f + 17f * cycle) * density, strokePaint)
                ring++
            }
        }
    }

    private fun drawVignette(canvas: Canvas, width: Int, height: Int) {
        val shader = vignetteShader ?: return
        vignettePaint.shader = shader
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), vignettePaint)
    }

    /** One-shot open transition: a short fade from asphalt plus a cyan scan line. */
    private fun drawIntro(canvas: Canvas, width: Int, height: Int, density: Float) {
        if (!motionEnabled || intro <= 0f) return
        val eased = intro * intro
        tintPaint.color = fieldColor
        tintPaint.alpha = (eased * 150f).toInt()
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), tintPaint)
        tintPaint.color = primaryColor
        tintPaint.alpha = (intro * 220f).toInt()
        val y = (1f - intro) * height
        canvas.drawRect(0f, y - density, width.toFloat(), y + density, tintPaint)
    }

    /** Rebuilds the size-dependent caches (scanlines + vignette shader) on layout changes. */
    private fun ensureCached(width: Int, height: Int, density: Float, mapView: MapView) {
        if (width == cachedWidth && height == cachedHeight && density == cachedDensity) return
        cachedWidth = width
        cachedHeight = height
        cachedDensity = density
        scanPath.reset()
        val step = 4f * density
        var y = step
        while (y < height) {
            scanPath.moveTo(0f, y)
            scanPath.lineTo(width.toFloat(), y)
            y += step
        }
        val radius = hypot(width.toFloat(), height.toFloat()) * 0.5f
        vignetteShader = RadialGradient(
            width / 2f,
            height / 2f,
            radius,
            intArrayOf(
                Color.TRANSPARENT,
                Color.TRANSPARENT,
                Color.argb(150, Color.red(fieldColor), Color.green(fieldColor), Color.blue(fieldColor)),
            ),
            floatArrayOf(0f, 0.56f, 1f),
            Shader.TileMode.CLAMP,
        )
    }

    override fun onDetach(mapView: MapView) {
        vignetteShader = null
        super.onDetach(mapView)
    }
}

/**
 * Motion gate for the hunt map: only while the screen is RESUMED, only when the platform
 * animator duration scale is not 0 (accessibility "Remove animations"), and not in previews
 * or Robolectric screenshots (which get the deterministic still frame). The same policy is
 * used by the Home/Auth brand hero.
 */
@Composable
internal fun rememberBrandMapMotionEnabled(): Boolean {
    val context = LocalContext.current
    val inspection = LocalInspectionMode.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var resumed by remember {
        mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
    }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, _ ->
            resumed = lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
    val animatorScale = remember(resumed) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            )
        }.getOrDefault(1f)
    }
    val underTest = Build.FINGERPRINT.contains("robolectric", ignoreCase = true)
    return !inspection && !underTest && resumed && animatorScale > 0f
}
