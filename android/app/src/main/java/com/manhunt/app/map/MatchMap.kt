package com.manhunt.app.map

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.view.View
import android.view.ViewOutlineProvider
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSizes
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sqrt

/** 30 fps is the ceiling for the in-game brand motion. */

/**
 * Dark-tile color filter. The raw matrix and its 0..255-scale contract live in
 * [DARK_TILE_MATRIX]; apply it through [ColorMatrixColorFilter] only.
 */
private val DarkTileFilter = ColorMatrixColorFilter(ColorMatrix(DARK_TILE_MATRIX))

private const val OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright"

@Composable
fun MatchMap(
    modifier: Modifier = Modifier,
    ownLocation: LatLng?,
    prey: List<PreyLocationStatus>,
    zone: ZoneDto?,
    showPrey: Boolean,
    trails: Map<String, List<TrailPoint>> = emptyMap(),
    onTap: (LatLng) -> Unit = {},
    showOwnMarker: Boolean = true,
    fallbackCenter: LatLng = LatLng(0.0, 0.0),
    fallbackZoom: Double = 16.0,
    showAttribution: Boolean = true,
    roundedCorners: Boolean = true,
    /** Extra map-pixel padding for the initial fit; tactical layouts pass a larger value
     *  so prey markers do not open underneath the bottom action sheet. */
    fitPadding: Dp = 40.dp,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uriHandler = LocalUriHandler.current
    val density = LocalDensity.current
    var centered by remember { mutableStateOf(false) }

    // Theme-aware tiles: infer dark mode from the Material color scheme so callers do
    // not need to pass a flag (MatchMap's signature stays source-compatible).
    val darkTiles = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val zoneColor = MaterialTheme.colorScheme.primary.toArgb()
    val zoneFill = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f).toArgb()
    val preyLiveColor = MaterialTheme.colorScheme.tertiary.toArgb()
    // Amber deliberately differs from the coral live marker: stale/flagged reports are
    // the map's primary safety signal and must not look identical to a fresh one.
    val preyStaleColor = 0xFFF0A43A.toInt()
    val ownColor = MaterialTheme.colorScheme.primary.toArgb()
    val fieldColor = MaterialTheme.colorScheme.background.toArgb()
    val chalkColor = MaterialTheme.colorScheme.onSurface.toArgb()
    val strokePx = with(density) { 3.dp.toPx() }
    val casingPx = with(density) { 2.dp.toPx() }
    val fitPaddingPx = with(density) { fitPadding.roundToPx() }

    // Localized strings are read in composition and captured for the AndroidView update lambda.
    val staleLabel = t("Stale report")
    val flaggedLabel = t("Unverified report")
    val liveLabel = t("Live report")
    val youLabel = t("You")
    val zoneLabel = t("Play zone")
    val mapLabel = t("Map")
    val zoomInLabel = t("Zoom in")
    val zoomOutLabel = t("Zoom out")
    val recenterLabel = t("Recenter")
    val attribution = "© OpenStreetMap contributors"

    // Known trade-offs, kept deliberately:
    // 1) The room screen hosts this map OUTSIDE its scrolling list (moved out in 0.8.3)
    //    at a fixed height, so osmdroid owns the vertical drag gesture instead of the
    //    LazyColumn and the MapView survives list scrolling (disposing it would destroy
    //    its tile providers). The cost is a fixed-height viewport: the map cannot grow
    //    with its content, and leaving the room screen still tears the MapView down.
    // 2) update() below rebuilds every overlay on each recomposition/location tick.
    //    Cheap at current overlay counts; add a data-signature guard if trails grow.

    val mapView = remember {
        // The osmdroid User-Agent is set once in ManHuntApplication.onCreate.
        MapView(context).apply {
            // The Compose Box clips its corners, but the embedded View is drawn by
            // the interop pipeline - clip at the View level too so the round shape
            // is unconditional on every device.
            clipToOutline = true
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val radius = if (roundedCorners) 20f * view.resources.displayMetrics.density else 0f
                    outline.setRoundRect(0, 0, view.width, view.height, radius)
                }
            }
            setTileSource(TileSourceFactory.MAPNIK)
            overlayManager.tilesOverlay.setColorFilter(if (darkTiles) DarkTileFilter else null)
            // The built-in +/- buttons are unthemed, draw above all overlays, and
            // consume the taps meant for MapEventsOverlay ("tap to move the zone").
            setBuiltInZoomControls(false)
            setMultiTouchControls(true)
            controller.setZoom(fallbackZoom)
            controller.setCenter(GeoPoint(fallbackCenter.lat, fallbackCenter.lng))
        }
    }

    // Animated brand layer (radar sweep, report rings, zone pulse, flowing trails, vignette).
    // It is a plain osmdroid overlay, so it follows pan/zoom natively and only repaints when
    // the driver ticks at 30 fps or the map invalidates for another reason.
    val motionOverlay = remember { BrandRadarOverlay() }
    val mapMotionEnabled = rememberBrandMapMotionEnabled()

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        mapView.onResume()
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView.onPause()
            mapView.onDetach()
        }
    }

    // The tile colour filter is a once-per-theme-change concern: mutating the tile
    // overlay from inside AndroidView.update() on every recomposition invalidates the
    // tile provider in the middle of the frame (and in headless Robolectric it can
    // sample a frame where the map overlays have not been redrawn yet). Apply it here
    // only when the dark/light choice actually changes, then force a deterministic
    // redraw of the whole MapView.
    LaunchedEffect(darkTiles) {
        mapView.overlayManager.tilesOverlay.setColorFilter(if (darkTiles) DarkTileFilter else null)
        mapView.invalidate()
    }

    // Overlays are (re)built inside update(). Post an invalidate so a frame is
    // guaranteed after the map has been laid out and the tiles are ready, instead of
    // relying on an implicit redraw that may have already happened.
    LaunchedEffect(ownLocation, prey, zone, trails, showPrey, showOwnMarker) {
        mapView.post { mapView.invalidate() }
    }

    // 30 fps driver for the brand layer: one tick per frame budget, paused automatically
    // with the screen (repeatOnLifecycle RESUMED) and switched off entirely for reduced
    // motion / previews / Robolectric stills (rememberBrandMapMotionEnabled).
    LaunchedEffect(mapMotionEnabled, mapView, lifecycleOwner) {
        motionOverlay.setMotion(mapMotionEnabled)
        if (!mapMotionEnabled) {
            mapView.invalidate()
            return@LaunchedEffect
        }
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (isActive) {
                delay(BRAND_MAP_FRAME_MS)
                motionOverlay.tick(BRAND_MAP_FRAME_MS.toFloat())
                mapView.invalidate()
            }
        }
    }

    Box(
        modifier = modifier
            .clip(if (roundedCorners) RoundedCornerShape(ManHuntRadius.lg) else RoundedCornerShape(0.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .then(
                if (roundedCorners) {
                    Modifier.border(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
                        RoundedCornerShape(ManHuntRadius.lg),
                    )
                } else {
                    Modifier
                },
            )
            .semantics { contentDescription = mapLabel },
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { mapView },
            update = { view ->
                view.overlays.clear()
                view.overlays.add(
                    MapEventsOverlay(object : MapEventsReceiver {
                        override fun singleTapConfirmedHelper(p: GeoPoint): Boolean {
                            onTap(LatLng(p.latitude, p.longitude))
                            return true
                        }

                        override fun longPressHelper(p: GeoPoint): Boolean = false
                    }),
                )

                zone?.let { z ->
                    val zonePoints = MapMath.circle(z)
                    // Dark casing under the cyan outline keeps the zone readable on
                    // bright teal roads/labels where a 2px cyan line is only ~2:1.
                    view.overlays.add(
                        Polygon(view).apply {
                            points = zonePoints
                            outlinePaint.color = android.graphics.Color.argb(150, 0, 0, 0)
                            outlinePaint.strokeWidth = strokePx + casingPx
                            fillPaint.color = android.graphics.Color.TRANSPARENT
                            title = null
                        },
                    )
                    view.overlays.add(
                        Polygon(view).apply {
                            points = zonePoints
                            outlinePaint.color = zoneColor
                            outlinePaint.strokeWidth = strokePx
                            fillPaint.color = zoneFill
                            title = zoneLabel
                        },
                    )
                }

                // Brand motion layer: added after the static zone fill so its animated
                // boundary sits on top of the fill, and before the markers so report rings
                // draw under the dots. All state is pushed here; the driver only ticks time.
                motionOverlay.update(
                    ownLocation = ownLocation,
                    prey = prey,
                    zone = zone,
                    trails = trails,
                    showPrey = showPrey,
                    showOwnMarker = showOwnMarker,
                )
                motionOverlay.setColors(
                    primary = zoneColor,
                    prey = preyLiveColor,
                    stale = preyStaleColor,
                    field = fieldColor,
                    chalk = chalkColor,
                )
                view.overlays.add(motionOverlay)

                if (showPrey) {
                    // Stale/live reports use different marker colours instead of the
                    // library's identical default pin; eliminated prey stay off the map.
                    prey.filter { it.hasReport && !it.eliminated && it.lat != null && it.lng != null }.forEach { p ->
                        val stale = p.stale || p.flagged
                        view.overlays.add(
                            Marker(view).apply {
                                position = GeoPoint(p.lat!!, p.lng!!)
                                title = p.username
                                snippet = when {
                                    p.stale -> staleLabel
                                    p.flagged -> flaggedLabel
                                    else -> liveLabel
                                }
                                icon = dotMarkerIcon(
                                    context = context,
                                    fillColor = if (stale) preyStaleColor else preyLiveColor,
                                    ringColor = android.graphics.Color.WHITE,
                                    radiusDp = if (stale) 12f else 13f,
                                    hollow = stale,
                                )
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            },
                        )
                    }
                }

                if (showOwnMarker) {
                    ownLocation?.let { me ->
                        view.overlays.add(
                            Marker(view).apply {
                                position = GeoPoint(me.lat, me.lng)
                                title = youLabel
                                icon = dotMarkerIcon(
                                    context = context,
                                    fillColor = ownColor,
                                    ringColor = android.graphics.Color.WHITE,
                                    radiusDp = 10f,
                                )
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            },
                        )
                    }
                }

                if (!centered) {
                    centered = true
                    // Fit the first view to the live hunt, not just to the player's own
                    // dot: zone + visible prey reports (including stale ones) + own
                    // position when it is plausibly inside the play area. Hidden prey are
                    // excluded even when they exist in state (showPrey == false).
                    val zoneRadiusM = zone?.radiusM ?: 0.0
                    val ownInPlay = ownLocation?.let { own ->
                        zone == null || distanceMeters(
                            own.lat, own.lng, zone.centerLat, zone.centerLng,
                        ) <= zoneRadiusM * 1.25
                    } == true
                    val visiblePrey = if (showPrey) {
                        prey.filter { it.hasReport && !it.eliminated && it.lat != null && it.lng != null }
                    } else {
                        emptyList()
                    }
                    val fitPoints = buildList {
                        if (ownInPlay) {
                            ownLocation?.let { add(GeoPoint(it.lat, it.lng)) }
                        }
                        visiblePrey.forEach { add(GeoPoint(it.lat!!, it.lng!!)) }
                        zone?.let { z ->
                            val dLat = z.radiusM / 111_320.0
                            val dLng = z.radiusM /
                                (111_320.0 * cos(Math.toRadians(z.centerLat)).coerceAtLeast(0.2))
                            add(GeoPoint(z.centerLat, z.centerLng))
                            add(GeoPoint(z.centerLat + dLat, z.centerLng + dLng))
                            add(GeoPoint(z.centerLat + dLat, z.centerLng - dLng))
                            add(GeoPoint(z.centerLat - dLat, z.centerLng + dLng))
                            add(GeoPoint(z.centerLat - dLat, z.centerLng - dLng))
                        }
                    }
                    val focus = fitPoints.firstOrNull()
                    when {
                        fitPoints.size >= 2 -> {
                            val box = BoundingBox.fromGeoPoints(fitPoints)
                            // Wait for a real layout size before fitting: a fit at 0x0 is
                            // discarded. The caller-supplied padding keeps markers above
                            // the tactical sheet.
                            var attempts = 0
                            view.post(object : Runnable {
                                override fun run() {
                                    if ((view.width <= 0 || view.height <= 0) && attempts++ < 10) {
                                        view.postDelayed(this, 32)
                                        return
                                    }
                                    view.zoomToBoundingBox(box, false, fitPaddingPx)
                                    if (view.zoomLevelDouble > 17.0) view.controller.setZoom(17.0)
                                    view.invalidate()
                                }
                            })
                        }
                        focus != null -> {
                            view.controller.setCenter(focus)
                            view.controller.setZoom(17.0)
                        }
                        else -> {
                            view.controller.setCenter(GeoPoint(fallbackCenter.lat, fallbackCenter.lng))
                            view.controller.setZoom(fallbackZoom)
                        }
                    }
                }

                // Invalidate twice: immediately, and once posted after the current layout
                // pass. The posted pass is what makes the overlay layer deterministic on a
                // freshly attached/laid-out MapView (headless renders and first frames).
                view.invalidate()
                view.post { view.invalidate() }
            },
        )

        // Accessibility/UX map controls: the built-in osmdroid buttons are unthemed,
        // so provide 48 dp targets that follow the app theme (zoom in/out and recenter).
        Column(
            modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MapControlButton(onClick = { mapView.controller.zoomIn() }, label = zoomInLabel) {
                Icon(Icons.Outlined.Add, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
            MapControlButton(onClick = { mapView.controller.zoomOut() }, label = zoomOutLabel) {
                Icon(Icons.Outlined.Remove, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
            MapControlButton(
                onClick = {
                    // Recovery when GPS, tiles or the camera leave the player lost: jump
                    // back to own position, else to the play-zone centre. Neither known
                    // yet (no fix and an open zone) means the button is a no-op.
                    val focus = ownLocation?.let { GeoPoint(it.lat, it.lng) }
                        ?: zone?.let { GeoPoint(it.centerLat, it.centerLng) }
                    if (focus != null) {
                        mapView.controller.animateTo(focus)
                        mapView.controller.setZoom(17.0)
                    }
                },
                label = recenterLabel,
            ) {
                Icon(
                    Icons.Outlined.MyLocation,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
        }

        if (showAttribution) {
            Surface(
                onClick = { uriHandler.openUri(OSM_COPYRIGHT_URL) },
                modifier = Modifier.align(Alignment.BottomEnd).padding(6.dp),
                shape = RoundedCornerShape(ManHuntRadius.xs),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
                contentColor = MaterialTheme.colorScheme.onSurface,
            ) {
                Text(
                    attribution,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}

/**
 * Small circular marker bitmap. Live prey use a filled coral dot; stale/flagged reports
 * use a hollow amber ring so the two states are distinguishable on the tactical map.
 */
private fun dotMarkerIcon(
    context: android.content.Context,
    fillColor: Int,
    ringColor: Int,
    radiusDp: Float,
    hollow: Boolean = false,
): BitmapDrawable {
    val density = context.resources.displayMetrics.density
    val radiusPx = radiusDp * density
    val ringPx = 2f * density
    val size = ((radiusPx + ringPx) * 2f).roundToInt().coerceAtLeast(2)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val center = size / 2f
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = ringColor
    canvas.drawCircle(center, center, radiusPx + ringPx, paint)
    if (hollow) {
        paint.color = fillColor
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = ringPx
        canvas.drawCircle(center, center, radiusPx - ringPx / 2f, paint)
    } else {
        paint.color = fillColor
        paint.style = Paint.Style.FILL
        canvas.drawCircle(center, center, radiusPx, paint)
    }
    return BitmapDrawable(context.resources, bitmap)
}

private fun distanceMeters(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
    val dLat = Math.toRadians(lat2 - lat1)
    val dLng = Math.toRadians(lng2 - lng1)
    val meanLat = Math.toRadians((lat1 + lat2) / 2.0)
    val x = dLng * cos(meanLat)
    return sqrt(dLat * dLat + x * x) * 6_371_008.8
}

@Composable
private fun MapControlButton(
    onClick: () -> Unit,
    label: String,
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(ManHuntRadius.sm),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        contentColor = MaterialTheme.colorScheme.primary,
        tonalElevation = 1.dp,
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(ManHuntSizes.touchTarget)
                .semantics { contentDescription = label },
        ) { content() }
    }
}
