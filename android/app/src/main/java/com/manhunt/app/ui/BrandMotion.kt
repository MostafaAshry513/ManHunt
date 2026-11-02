package com.manhunt.app.ui

import android.provider.Settings
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardShape
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntElevation
import com.manhunt.app.ui.theme.ManHuntRadius
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

/**
 * The in-app brand hero: the Open Zone mark behaving as a radar scope, running the approved
 * "Perpetual Pursuit" loop from the brand motion kit (`design/brand/motion-kit/`): the
 * implementation contract is `app/README.md`, the maths are `src/motion-core.js`, and the
 * five reference stills are `out/app/`.
 *
 * The loop: a chalk block map with a survey dot grid; a darkened radar scope with crosshair,
 * bearing ticks, reference rings, the cyan Open Zone ring (24 deg gap, breathing radius) and
 * a rotating sweep; the coral Prey dot runs a closed evasion route with a growing trail and
 * report pings while violet Hunters fan behind it. Copy is ordinary Compose text on the start
 * side of the card (never painted into the canvas, so it localises and scales): the drawn
 * MANHUNT wordmark, the provisional campaign line and the localised Prey/Hunters legend.
 *
 * Performance contract:
 * - one [rememberInfiniteTransition] drives one Float phase, read inside the Canvas draw
 *   phase, so each frame invalidates draw only - no recomposition per frame;
 * - no per-frame allocation: the field (blocks, dot grid, crosshair, bearing ticks) and the
 *   wordmark paths are built once (the field in `drawWithCache` per size, the wordmark at
 *   first use), the trail Path and all Strokes are reused, and every draw call takes inline
 *   geometry/colour values;
 * - motion pauses entirely when the screen is not resumed or the platform animator duration
 *   scale is 0 (reduced motion); the loop then renders its tau = 0 state, which is also the
 *   frame the Compose test framework captures (it cancels infinite animations while idle).
 */
@Composable
fun BrandMotionBanner(
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    animate: Boolean = true,
) {
    val motionEnabled = animate && rememberBrandMotionEnabled()
    val phase = rememberBrandPhase(motionEnabled)
    val hook = t(BRAND_CAMPAIGN_LINE)
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = if (compact) 144.dp else 160.dp)
            .testTag("brand_motion_banner"),
        shape = RoundedCornerShape(ManHuntRadius.xl),
        color = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.30f)),
        tonalElevation = ManHuntElevation.card,
    ) {
        Box(Modifier.fillMaxSize()) {
            BrandMotionArt(phase = phase, modifier = Modifier.matchParentSize())
            Column(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .fillMaxWidth(0.42f)
                    .padding(start = if (compact) 14.dp else 16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                BrandWordmark(
                    modifier = Modifier
                        .fillMaxWidth()
                        .widthIn(max = if (compact) 118.dp else 140.dp)
                        .aspectRatio(5.3f),
                )
                Text(
                    hook,
                    modifier = Modifier.testTag("brand_motion_slogan"),
                    style = if (compact) {
                        MaterialTheme.typography.bodyMedium
                    } else {
                        MaterialTheme.typography.titleSmall
                    },
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                // The dots are never the only cue: the teams are named in text, localised.
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TeamLegendDot(color = MaterialTheme.colorScheme.tertiary, label = t("Prey"))
                    TeamLegendDot(color = MaterialTheme.colorScheme.secondary, label = t("Hunters"))
                }
            }
        }
    }
}

@Composable
private fun TeamLegendDot(color: Color, label: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(7.dp).background(color, CircleShape))
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
        )
    }
}

/**
 * Loop phase in [0,1). With motion off this returns a constant state, so there is no
 * animation coroutine and no frame-clock consumer at all (static first frame).
 */
@Composable
private fun rememberBrandPhase(motionEnabled: Boolean): State<Float> {
    if (!motionEnabled) {
        return remember { mutableFloatStateOf(0f) }
    }
    val transition = rememberInfiniteTransition(label = "brand-motion")
    return transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = BRAND_LOOP_MS, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "brand-phase",
    )
}

/** Motion is allowed only while visible and only when the device/OS allows animations. */
@Composable
private fun rememberBrandMotionEnabled(): Boolean {
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
    // Reduced-motion fallback: animator duration scale is 0 when animations are off
    // (accessibility "Remove animations" / developer options).
    val animatorScale = remember(resumed) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            )
        }.getOrDefault(1f)
    }
    return !inspection && resumed && animatorScale > 0f
}

/**
 * Full-bleed radar art. The phase is read in the draw phase and the whole field (block map,
 * survey dots, crosshair, ticks) is cached per size, so a running loop only repaints.
 */
@Composable
private fun BrandMotionArt(phase: State<Float>, modifier: Modifier = Modifier) {
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val primary = MaterialTheme.colorScheme.primary
    val coral = MaterialTheme.colorScheme.tertiary
    val violet = MaterialTheme.colorScheme.secondary
    val chalk = MaterialTheme.colorScheme.onSurface
    val field = MaterialTheme.colorScheme.background
    val trailPath = remember { Path() }
    // Scratch buffers reused every frame so the draw path never allocates.
    val preyPose = remember { FloatArray(3) }
    val hunterPose = remember { FloatArray(3) }
    val pingPose = remember { FloatArray(3) }

    Spacer(
        modifier.drawWithCache {
            // The canvas is a 360 x 160 dp plate on design; keep the same proportions.
            val cx = size.width * 0.69f
            val cy = size.height * 0.50f
            val radius = min(size.height * 0.35f, size.width * 0.19f)
                .coerceAtLeast(24.dp.toPx())

            val outline = 1.dp.toPx()
            val crossStroke = Stroke(width = outline, miter = 4f, cap = StrokeCap.Butt)
            val cornerStroke = Stroke(width = outline, miter = 4f, cap = StrokeCap.Butt)
            val tickStroke = Stroke(width = 1.2.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            val refStroke = Stroke(width = 1.2.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            // Spec: zone ring 4 px at 3x (~1.3 dp), trail ~1.3 dp with round caps.
            val ringStroke = Stroke(width = 1.35.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            val trailStroke = Stroke(width = 1.3.dp.toPx(), miter = 4f, cap = StrokeCap.Round)
            val pingStroke = Stroke(width = 1.2.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            val hunterRingStroke = Stroke(width = 1.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            val preyRingStroke = Stroke(width = 1.15.dp.toPx(), miter = 4f, cap = StrokeCap.Butt)
            val sweepLineWidth = 0.6.dp.toPx()
            val mirrorPivot = Offset(size.width / 2f, 0f)

            // Chalk block map: inset rounded rectangles with a deterministic hand-placed feel,
            // a few tinted blocks and a survey speck inside some of them.
            val blockOutlines = Path()
            val blockFills = Path()
            val dotsMinor = Path()
            val dotsMajor = Path()
            // Same mulberry32(20261101) stream the motion kit's field builder uses.
            var seed = BRAND_FIELD_SEED
            fun nextRandom(): Float {
                seed += 0x6d2b79f5
                var t = seed
                t = (t xor (t ushr 15)) * (1 or t)
                t = (t + ((t xor (t ushr 7)) * (61 or t))) xor t
                t = t xor (t ushr 14)
                return (t.toLong() and 0xFFFF_FFFFL).toFloat() / 4_294_967_296f
            }
            val cellW = 40.dp.toPx()
            val cellH = 50.dp.toPx()
            val blockInset = 5.dp.toPx()
            val minorDotRadius = 1.dp.toPx()
            val majorDotRadius = 1.7.dp.toPx()
            var rowTop = -cellH * 0.35f
            while (rowTop < size.height) {
                var colLeft = -cellW * 0.35f
                while (colLeft < size.width) {
                    val insetX = nextRandom() * 3.dp.toPx()
                    val insetY = nextRandom() * 3.dp.toPx()
                    val rect = Rect(
                        left = colLeft + blockInset + insetX,
                        top = rowTop + blockInset + insetY,
                        right = colLeft + cellW - blockInset - insetX,
                        bottom = rowTop + cellH - blockInset - insetY,
                    )
                    val rounded = RoundRect(rect, CornerRadius(5.dp.toPx()))
                    if (nextRandom() < 0.18f) blockFills.addRoundRect(rounded) else blockOutlines.addRoundRect(rounded)
                    // Survey marks live inside the blocks (the kit's "dot-grid block map"),
                    // but never on the copy side: after the RTL mirror both layout directions
                    // map the copy column to the same canvas region (x < ~42%).
                    repeat(if (nextRandom() < 0.55f) 1 else 2) {
                        val dot = if (nextRandom() < 0.16f) dotsMajor else dotsMinor
                        val dotCenter = Offset(
                            rect.left + rect.width * (0.2f + 0.6f * nextRandom()),
                            rect.top + rect.height * (0.2f + 0.6f * nextRandom()),
                        )
                        if (dotCenter.x >= size.width * 0.42f) {
                            dot.addOval(
                                Rect(
                                    center = dotCenter,
                                    radius = if (dot === dotsMajor) majorDotRadius else minorDotRadius,
                                ),
                            )
                        }
                    }
                    colLeft += cellW
                }
                rowTop += cellH
            }

            // Crosshair hairlines + bearing ticks around the scope, static in the radar.
            val crosshair = Path()
            crosshair.moveTo(cx - radius * 1.17f, cy)
            crosshair.lineTo(cx + radius * 1.17f, cy)
            crosshair.moveTo(cx, cy - radius * 1.17f)
            crosshair.lineTo(cx, cy + radius * 1.17f)
            val bearingTicks = Path()
            for (i in 0 until 60) {
                val angle = (i * 6f) * DEG
                val inner = radius * 1.02f
                val outer = if (i % 5 == 0) radius * 1.10f else radius * 1.06f
                bearingTicks.moveTo(
                    cx + cos(angle) * inner,
                    cy + sin(angle) * inner,
                )
                bearingTicks.lineTo(
                    cx + cos(angle) * outer,
                    cy + sin(angle) * outer,
                )
            }

            val cornerArc = 20.dp.toPx()
            val cornerRectTopLeft = Rect(0f, 0f, cornerArc, cornerArc)
            val cornerRectBottomRight = Rect(
                size.width - cornerArc,
                size.height - cornerArc,
                size.width,
                size.height,
            )

            onDrawBehind {
                val tau = phase.value
                withTransform({
                    // Mirror the art in RTL so the field stays on the end side; the Compose
                    // text above mirrors on its own and never gets mirrored letterforms.
                    if (rtl) scale(-1f, 1f, pivot = mirrorPivot)
                }) {
                    drawPath(blockOutlines, chalk.copy(alpha = 0.055f), style = crossStroke)
                    drawPath(blockFills, primary.copy(alpha = 0.05f))
                    drawPath(dotsMinor, primary.copy(alpha = 0.10f))
                    drawPath(dotsMajor, primary.copy(alpha = 0.17f))
                    // Plate corners: the borrowed-pitch chalk marks from the motion kit.
                    drawArc(
                        color = chalk.copy(alpha = 0.20f),
                        startAngle = 90f,
                        sweepAngle = 90f,
                        useCenter = false,
                        topLeft = cornerRectTopLeft.topLeft,
                        size = cornerRectTopLeft.size,
                        style = cornerStroke,
                    )
                    drawArc(
                        color = chalk.copy(alpha = 0.20f),
                        startAngle = 270f,
                        sweepAngle = 90f,
                        useCenter = false,
                        topLeft = cornerRectBottomRight.topLeft,
                        size = cornerRectBottomRight.size,
                        style = cornerStroke,
                    )

                    // Radar scope: a flat, slightly darker disc with hairlines and rings.
                    drawCircle(
                        color = field.copy(alpha = 0.62f),
                        radius = radius * 1.17f,
                        center = Offset(cx, cy),
                    )
                    drawPath(crosshair, chalk.copy(alpha = 0.10f), style = crossStroke)
                    drawPath(bearingTicks, primary.copy(alpha = 0.26f), style = tickStroke)
                    drawCircle(
                        color = chalk.copy(alpha = 0.08f),
                        radius = radius * 0.72f,
                        center = Offset(cx, cy),
                        style = refStroke,
                    )

                    drawBrandRadar(
                        tau = tau,
                        cx = cx,
                        cy = cy,
                        radius = radius,
                        primary = primary,
                        coral = coral,
                        violet = violet,
                        ringStroke = ringStroke,
                        trailStroke = trailStroke,
                        pingStroke = pingStroke,
                        hunterRingStroke = hunterRingStroke,
                        preyRingStroke = preyRingStroke,
                        sweepLineWidth = sweepLineWidth,
                        trailPath = trailPath,
                        preyPose = preyPose,
                        hunterPose = hunterPose,
                        pingPose = pingPose,
                    )
                }
            }
        },
    )
}

private fun DrawScope.drawBrandRadar(
    tau: Float,
    cx: Float,
    cy: Float,
    radius: Float,
    primary: Color,
    coral: Color,
    violet: Color,
    ringStroke: Stroke,
    trailStroke: Stroke,
    pingStroke: Stroke,
    hunterRingStroke: Stroke,
    preyRingStroke: Stroke,
    sweepLineWidth: Float,
    trailPath: Path,
    preyPose: FloatArray,
    hunterPose: FloatArray,
    pingPose: FloatArray,
) {
    // 1. Open Zone ring: the deliberate gap stays fixed (the mark), the radius breathes 3.4%
    //    and a radar sweep turns once per loop (motion-core.js radarFrame()).
    val zoneRadius = radius * (1f - 0.034f * (0.5f - 0.5f * cos(BRAND_TAU * tau)))
    val ringTopLeft = Offset(cx - zoneRadius, cy - zoneRadius)
    val ringSize = Size(zoneRadius * 2f, zoneRadius * 2f)
    drawArc(
        color = primary,
        startAngle = BRAND_GAP_CENTRE_DEG + BRAND_GAP_DEG / 2f,
        sweepAngle = 360f - BRAND_GAP_DEG,
        useCenter = false,
        topLeft = ringTopLeft,
        size = ringSize,
        style = ringStroke,
    )

    // Sweep: two flat cones (narrow bright + wide faint) plus the leading edge and tip dot.
    val sweep = (tau * 360f) % 360f
    drawArc(
        color = primary.copy(alpha = 0.042f),
        startAngle = sweep - 21f,
        sweepAngle = 42f,
        useCenter = true,
        topLeft = ringTopLeft,
        size = ringSize,
    )
    drawArc(
        color = primary.copy(alpha = 0.018f),
        startAngle = sweep - 52f,
        sweepAngle = 104f,
        useCenter = true,
        topLeft = ringTopLeft,
        size = ringSize,
    )
    val sweepRad = sweep * DEG
    drawLine(
        color = primary.copy(alpha = 0.50f),
        start = Offset(cx, cy),
        end = Offset(cx + cos(sweepRad) * zoneRadius, cy + sin(sweepRad) * zoneRadius),
        strokeWidth = sweepLineWidth,
        cap = StrokeCap.Butt,
    )
    drawCircle(
        color = primary.copy(alpha = 0.90f),
        radius = 1.dp.toPx(),
        center = Offset(
            cx + cos(sweepRad) * zoneRadius * 1.10f,
            cy + sin(sweepRad) * zoneRadius * 1.10f,
        ),
    )

    // 2. Coral trail: the last 14% of the Prey run (preyTrail in the motion kit).
    trailPath.reset()
    for (step in 0..BRAND_TRAIL_STEPS) {
        preyPoseInto(tau - (step.toFloat() / BRAND_TRAIL_STEPS) * BRAND_TRAIL_SPAN, cx, cy, radius, preyPose)
        if (step == 0) trailPath.moveTo(preyPose[0], preyPose[1]) else trailPath.lineTo(preyPose[0], preyPose[1])
    }
    drawPath(trailPath, coral.copy(alpha = 0.58f), style = trailStroke)

    // 3. Coral report pings from where the Prey was when each report was sent.
    for (i in 0 until BRAND_PING_COUNT) {
        val local = fract(tau - i.toFloat() / BRAND_PING_COUNT)
        val age = local / BRAND_PING_LIFE
        if (age >= 1f) continue
        preyPoseInto(tau - local, cx, cy, radius, pingPose)
        val alpha = 0.55f * (1f - age).pow(1.35f)
        drawCircle(
            color = coral.copy(alpha = alpha),
            radius = radius * (0.09f + age * 0.42f),
            center = Offset(pingPose[0], pingPose[1]),
            style = pingStroke,
        )
    }

    // 4. Hunters: violet dot + flat ring + sweep blip; the Prey gets a coral ring as a shape
    //    difference so colour is not the only cue (brand accessibility rule).
    for (i in 0 until BRAND_HUNTER_COUNT) {
        hunterPoseInto(tau, i, cx, cy, radius, hunterPose)
        val blip = blipFor(hunterPose[2], sweep, sharp = 20f)
        drawCircle(
            color = violet,
            radius = 2.3.dp.toPx() * (1f + 0.30f * blip),
            center = Offset(hunterPose[0], hunterPose[1]),
        )
        drawCircle(
            color = violet.copy(alpha = 0.55f),
            radius = 4.3.dp.toPx(),
            center = Offset(hunterPose[0], hunterPose[1]),
            style = hunterRingStroke,
        )
        if (blip > 0.05f) {
            drawCircle(
                color = violet.copy(alpha = 0.35f * blip),
                radius = 4.3.dp.toPx() * (1f + 0.55f * blip),
                center = Offset(hunterPose[0], hunterPose[1]),
                style = hunterRingStroke,
            )
        }
    }
    preyPoseInto(tau, cx, cy, radius, preyPose)
    val preyBlip = blipFor(preyPose[2], sweep, sharp = 24f)
    drawCircle(
        color = coral,
        radius = 3.2.dp.toPx() * (1f + 0.35f * preyBlip),
        center = Offset(preyPose[0], preyPose[1]),
    )
    drawCircle(
        color = coral.copy(alpha = 0.85f),
        radius = 5.7.dp.toPx() * (1f + 0.15f * preyBlip),
        center = Offset(preyPose[0], preyPose[1]),
        style = preyRingStroke,
    )
}

// ---------------------------------------------------------------------------------------
// "Perpetual Pursuit" maths, ported 1:1 from design/brand/motion-kit/src/motion-core.js.
// Same seed, same phases, same wobble harmonics: frame 0 and frame 1 are identical, so the
// loop closes seamlessly. Keep this in sync with the motion kit instead of tuning it here.
// The in-app hero uses two Hunters (task-42); the kit's banner variants use five.
// ---------------------------------------------------------------------------------------

private const val BRAND_LOOP_MS = 4_000

/**
 * Provisional campaign line for the hero (design/brand/strategy/slogan-v2.md). This is the
 * one place to swap the copy: the banner reads it through t(), and the rest of the app keeps
 * its existing slogan until the owner signs off the full copy pass. Add the Arabic entry in
 * Localization.kt for every replacement string.
 */
private const val BRAND_CAMPAIGN_LINE = "Hide from your friends."

/** Field layout seed: the motion kit's deterministic chalk block map seed. */
private const val BRAND_FIELD_SEED = 20261101

private const val BRAND_TAU = (PI * 2.0).toFloat()
private const val DEG = (PI / 180.0).toFloat()
private const val BRAND_GAP_DEG = 24f
private const val BRAND_GAP_CENTRE_DEG = -58f
private const val BRAND_HUNTER_COUNT = 2
private const val BRAND_TRAIL_STEPS = 25
private const val BRAND_TRAIL_SPAN = 0.14f
private const val BRAND_PING_COUNT = 3
private const val BRAND_PING_LIFE = 0.115f
private const val BRAND_SQUASH = 0.94f

// seedPhases(20261101) from the motion kit's mulberry32 PRNG.
private const val SEED_PH0 = 4.2345554f
private const val SEED_PH1 = 5.6310668f
private const val SEED_PH2 = 4.7288246f

private fun fract(value: Float): Float = value - kotlin.math.floor(value)

/** Closed Prey evasion orbit: one revolution per loop plus the kit's 3rd/5th harmonics. */
private fun preyPoseInto(tau: Float, cx: Float, cy: Float, radius: Float, out: FloatArray) {
    val angle = -PI.toFloat() / 2f + BRAND_TAU * tau
    val wobble = 1f + 0.13f * sin(3f * angle + SEED_PH0) + 0.06f * sin(5f * angle + SEED_PH1)
    val orbit = radius * 0.60f * wobble
    val dx = orbit * cos(angle)
    val dy = orbit * sin(angle) * BRAND_SQUASH
    out[0] = cx + dx
    out[1] = cy + dy
    out[2] = atan2(dy, dx)
}

/** Hunters fan out behind the Prey's line - a closing net, not a queue (motion-core.js). */
private fun hunterPoseInto(
    tau: Float,
    hunter: Int,
    cx: Float,
    cy: Float,
    radius: Float,
    out: FloatArray,
) {
    val lag = 0.055f + hunter * 0.035f
    val lateral = (if (hunter % 2 == 0) -1f else 1f) * (6f + hunter * 2.2f) * DEG
    val angle = -PI.toFloat() / 2f + BRAND_TAU * (tau - lag) + lateral
    val wobble = 1f + 0.13f * sin(3f * angle + SEED_PH0) + 0.06f * sin(5f * angle + SEED_PH1)
    val close = 0.74f + 0.035f * sin(hunter * 2.3f + 0.4f) + hunter * 0.006f +
        0.028f * sin(BRAND_TAU * tau + hunter * 1.7f + SEED_PH2)
    val orbit = radius * 0.60f * wobble * close
    val dx = orbit * cos(angle)
    val dy = orbit * sin(angle) * BRAND_SQUASH
    out[0] = cx + dx
    out[1] = cy + dy
    out[2] = atan2(dy, dx)
}

/** Radar sweep brightness for a dot: 1 right after the sweep crosses it, then falls off. */
private fun blipFor(bearingRad: Float, sweepDeg: Float, sharp: Float): Float {
    val bearingDeg = ((bearingRad / DEG) % 360f + 360f) % 360f
    val distance = ((sweepDeg - bearingDeg) % 360f + 360f) % 360f
    return exp(-distance / sharp)
}

// ---------------------------------------------------------------------------------------
// Drawn MANHUNT wordmark.
// ---------------------------------------------------------------------------------------

private data class BrandGlyph(val translateX: Float, val path: Path)

/**
 * The approved wordmark, copied verbatim from
 * `design/brand/identity/final/lockup/wordmark-light-on-dark.svg`: seven drawn glyph paths,
 * cap height 100 units, viewBox 0 0 530 100. Do not retype it in a font, re-space or redraw
 * it - if the lockup changes, re-copy the path data from the canonical SVG.
 */
private val BrandWordmarkGlyphs: List<BrandGlyph> by lazy {
    fun glyph(data: String, translateX: Float, evenOdd: Boolean = false): BrandGlyph {
        val path = PathParser().parsePathString(data).toPath()
        if (evenOdd) path.fillType = PathFillType.EvenOdd
        return BrandGlyph(translateX, path)
    }
    listOf(
        glyph(
            "M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z",
            0f,
        ),
        glyph("M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z", 86f),
        glyph("M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z", 164f),
        glyph("M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z", 242f),
        glyph("M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z", 316f, evenOdd = true),
        glyph("M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z", 394f),
        glyph("M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z", 472f),
    )
}

/** Draws the wordmark into the given box; the box aspect is the lockup's 5.30:1. */
@Composable
internal fun BrandWordmark(
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.onSurface,
) {
    Canvas(modifier) {
        val scale = size.height / 100f
        withTransform({ scale(scale, scale, pivot = Offset.Zero) }) {
            BrandWordmarkGlyphs.forEach { glyph ->
                withTransform({ translate(glyph.translateX, 0f) }) {
                    drawPath(glyph.path, color)
                }
            }
        }
    }
}

/**
 * The FieldPlate: the brand field drawing (radar scope, zone ring, Prey trail/pings, Hunter
 * fan) with no copy, used as the Auth/Home plate. Static first frame with motion disabled;
 * otherwise it runs the same 4 s Perpetual Pursuit loop only while the screen is RESUMED.
 * Decorative: callers apply their own testTag; no semantics are exposed.
 */
@Composable
internal fun BrandFieldPlate(
    modifier: Modifier = Modifier,
    animate: Boolean = false,
) {
    val motionEnabled = animate && rememberBrandMotionEnabled()
    val phase = rememberBrandPhase(motionEnabled)
    Box(
        modifier
            .fillMaxWidth()
            .clip(BoardShape.plate)
            .background(BoardTheme.board()),
    ) {
        BrandMotionArt(phase = phase, modifier = Modifier.matchParentSize())
    }
}
