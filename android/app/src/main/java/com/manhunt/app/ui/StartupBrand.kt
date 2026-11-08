package com.manhunt.app.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.MasterThemeChoice
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

private val StartupField = Color(0xFF08090A)
private val StartupChalk = Color(0xFFF3EFE6)
private val StartupCyan: Color get() = MasterThemeChoice.current.accentDark
private val StartupCoral = Color(0xFFB8F04A)

/**
 * Cold-start brand screen: a short (1.4 s) Open Zone reveal that bridges the system splash
 * and the first real screen. The app is already composing behind it; this screen never holds
 * up session restore, and it is skipped after the first composition.
 *
 * The mark is drawn, not a bitmap: ring sweep, the coral Prey dot entering the ring's gap,
 * survey ticks and the approved drawn MANHUNT wordmark. Motion is disabled when the
 * system animator scale is 0; a static mark is shown briefly instead.
 */
@Composable
fun StartupBrandScreen(
    onFinished: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val motionEnabled = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f,
        ) > 0f
    }
    val progress = remember { Animatable(0f) }
    val loadingLabel = t("Loading")

    LaunchedEffect(motionEnabled) {
        if (!motionEnabled) {
            delay(900)
            onFinished()
            return@LaunchedEffect
        }
        progress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1_400, easing = LinearEasing),
        )
        onFinished()
    }

    val p = if (motionEnabled) progress.value else 1f
    val fade = if (motionEnabled) (1f - smoothstep(0.86f, 1f, p)) else 1f
    val ringReveal = smoothstep(0.02f, 0.46f, p)
    val gapReveal = smoothstep(0.22f, 0.62f, p)
    val wordReveal = smoothstep(0.36f, 0.78f, p)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(StartupField)
            .graphicsLayer { alpha = fade }
            .semantics { contentDescription = loadingLabel },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val cx = w / 2f
            val cy = h * 0.36f
            val radius = w.coerceAtMost(h) * 0.185f

            // Faint field survey grid, aligned to the same language as the brand hero.
            val grid = w * 0.115f
            val gridAlpha = 0.035f * ringReveal
            var x = cx % grid
            while (x < w) {
                drawLine(StartupChalk.copy(alpha = gridAlpha), Offset(x, 0f), Offset(x, h), 1f)
                x += grid
            }
            var y = cy % grid
            while (y < h) {
                drawLine(StartupChalk.copy(alpha = gridAlpha), Offset(0f, y), Offset(w, y), 1f)
                y += grid
            }

            // Open Zone ring: 336° of cyan, leaving the mark's 24° opening.
            val start = -90f + 12f
            drawArc(
                color = StartupCyan.copy(alpha = 0.24f * ringReveal),
                startAngle = start,
                sweepAngle = 336f,
                useCenter = false,
                topLeft = Offset(cx - radius, cy - radius),
                size = androidx.compose.ui.geometry.Size(radius * 2f, radius * 2f),
                style = Stroke(width = radius * 0.055f, cap = StrokeCap.Round),
            )
            drawArc(
                color = StartupCyan.copy(alpha = 0.92f * ringReveal),
                startAngle = start,
                sweepAngle = 336f * ringReveal,
                useCenter = false,
                topLeft = Offset(cx - radius, cy - radius),
                size = androidx.compose.ui.geometry.Size(radius * 2f, radius * 2f),
                style = Stroke(width = radius * 0.022f, cap = StrokeCap.Round),
            )

            // Survey ticks around the scope disc.
            val tickAlpha = 0.22f * ringReveal
            for (i in 0 until 24) {
                val a = Math.toRadians(i * 15.0).toFloat()
                val inner = radius * 1.13f
                val outer = radius * 1.19f
                drawLine(
                    StartupChalk.copy(alpha = tickAlpha),
                    Offset(cx + cos(a) * inner, cy + sin(a) * inner),
                    Offset(cx + cos(a) * outer, cy + sin(a) * outer),
                    radius * 0.008f,
                )
            }

            // Coral Prey dot slides into the ring gap as the ring completes.
            if (gapReveal > 0f) {
                val gapAngle = Math.toRadians(-90.0 + 12.0 + 336.0 + 12.0).toFloat()
                val dotX = cx + cos(gapAngle) * radius
                val dotY = cy + sin(gapAngle) * radius
                val dotScale = 0.82f + 0.18f * gapReveal
                val ringPulse = 1f + 0.22f * (1f - gapReveal)
                drawCircle(
                    color = StartupCoral.copy(alpha = 0.24f * gapReveal),
                    radius = radius * 0.135f * ringPulse,
                    center = Offset(dotX, dotY),
                    style = Stroke(width = radius * 0.018f),
                )
                drawCircle(
                    color = StartupCoral.copy(alpha = gapReveal),
                    radius = radius * 0.062f * dotScale,
                    center = Offset(dotX, dotY),
                )
            }

            // Inner reference ring and crosshair.
            drawCircle(
                color = StartupChalk.copy(alpha = 0.10f * ringReveal),
                radius = radius * 0.66f,
                center = Offset(cx, cy),
                style = Stroke(width = radius * 0.009f),
            )
            drawLine(
                StartupCyan.copy(alpha = 0.35f * ringReveal),
                Offset(cx - radius * 0.16f, cy),
                Offset(cx + radius * 0.16f, cy),
                radius * 0.01f,
            )
            drawLine(
                StartupCyan.copy(alpha = 0.35f * ringReveal),
                Offset(cx, cy - radius * 0.16f),
                Offset(cx, cy + radius * 0.16f),
                radius * 0.01f,
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .graphicsLayer {
                    alpha = wordReveal
                    translationY = (1f - wordReveal) * 10f
                },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            BrandWordmark(
                modifier = Modifier
                    .width(196.dp)
                    .aspectRatio(5.30f),
                color = StartupChalk,
            )
            Box(
                Modifier
                    .width(196.dp)
                    .height(2.dp)
                    .graphicsLayer {
                        alpha = wordReveal
                        scaleX = wordReveal
                    }
                    .background(StartupCyan),
            )
        }
    }
}

private fun smoothstep(edge0: Float, edge1: Float, x: Float): Float {
    if (edge0 == edge1) return if (x < edge0) 0f else 1f
    val t = ((x - edge0) / (edge1 - edge0)).coerceIn(0f, 1f)
    return t * t * (3f - 2f * t)
}
