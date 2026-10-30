package com.manhunt.app.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.manhunt.app.i18n.t

/**
 * Small radar-sweep loader: a faint ring, a rotating sweep and a pulsing core.
 * Sized by the caller so it never dominates the screen.
 *
 * @param label content description announced by TalkBack; defaults to "Loading".
 */
@Composable
fun ManHuntLoader(
    modifier: Modifier = Modifier,
    size: Dp = 28.dp,
    color: Color = MaterialTheme.colorScheme.primary,
    label: String? = null,
) {
    val transition = rememberInfiniteTransition(label = "manhunt-loader")
    val angle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(1100, easing = LinearEasing)),
        label = "sweep",
    )
    val pulse by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            tween(850, easing = FastOutSlowInEasing),
            RepeatMode.Reverse,
        ),
        label = "core",
    )

    val contentLabel = label ?: t("Loading")

    Canvas(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = contentLabel },
    ) {
        val stroke = this.size.minDimension * 0.10f
        val inset = stroke / 2f
        val ring = this.size.minDimension - stroke

        drawArc(
            color = color.copy(alpha = 0.16f),
            startAngle = 0f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = Offset(inset, inset),
            size = Size(ring, ring),
            style = Stroke(width = stroke),
        )

        rotate(angle) {
            drawArc(
                brush = Brush.sweepGradient(
                    0f to Color.Transparent,
                    0.55f to color.copy(alpha = 0.25f),
                    1f to color,
                ),
                startAngle = 0f,
                sweepAngle = 300f,
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = Size(ring, ring),
                style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
        }

        drawCircle(
            color = color.copy(alpha = pulse),
            radius = stroke * 0.85f,
            center = this.center,
        )
    }
}
