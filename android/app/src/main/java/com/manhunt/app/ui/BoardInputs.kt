package com.manhunt.app.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.runtime.remember
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardColors
import com.manhunt.app.ui.theme.BoardMetrics
import com.manhunt.app.ui.theme.BoardShape
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntType
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * MATCHDAY BOARD input and masthead components (screens/01-shell-and-board.md Â§5).
 * One 52 dp plate field, one 48 dp inline action, one error strip, one loading rule.
 */

/**
 * Home masthead: the 01 Open Zone mark, the drawn MANHUNT wordmark at 20 dp cap height, the
 * device local time in the data face and the settings FieldMark. Never an icon tile.
 */
@Composable
fun Masthead(
    clock: String,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth().background(MaterialTheme.colorScheme.background)) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = BoardSpace.screen)
                .heightIn(min = 56.dp)
                .testTag("masthead"),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ZoneMark(Modifier.size(22.dp))
            Spacer(Modifier.width(BoardSpace.s4))
            BrandWordmark(
                modifier = Modifier.height(20.dp).width(106.dp),
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            Text(
                clock,
                style = ManHuntType.data(),
                color = BoardTheme.muted(),
                maxLines = 1,
                modifier = Modifier.testTag("board_clock"),
            )
            IconButton(
                onClick = onOpenSettings,
                modifier = Modifier.size(ManHuntSizes.touchTarget).testTag("home_settings"),
            ) {
                Icon(
                    FieldMarks.settings,
                    contentDescription = t("Settings"),
                    tint = MaterialTheme.colorScheme.onBackground,
                )
            }
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
    }
}

/** The 01 Open Zone mark: incomplete cyan ring with the two team dots inside. Decorative. */
@Composable
fun ZoneMark(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = 2.2.dp.toPx()
        val r = (size.minDimension - stroke) / 2f
        val center = Offset(size.width / 2f, size.height / 2f)
        drawArc(
            color = BoardColors.cyan,
            startAngle = -58f + 12f,
            sweepAngle = 336f,
            useCenter = false,
            topLeft = Offset(center.x - r, center.y - r),
            size = Size(r * 2f, r * 2f),
            style = Stroke(width = stroke),
        )
        drawCircle(
            color = BoardColors.coral,
            radius = r * 0.20f,
            center = Offset(center.x + r * 0.18f, center.y + r * 0.20f),
        )
        val angle = (-58f) * (PI.toFloat() / 180f)
        drawCircle(
            color = BoardColors.violet,
            radius = r * 0.16f,
            center = Offset(center.x + cos(angle) * r * 0.72f, center.y + sin(angle) * r * 0.72f),
        )
    }
}

/**
 * 52 dp plate text field: caption label above the plate (never a floating label), plateRaised
 * fill, 1 dp control border (error border when [error] is set), optional helper/error line
 * below. Autofill content type is wired through semantics.
 */
@Composable
fun PlateTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    helper: String? = null,
    error: String? = null,
    testTag: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    autofillContentType: ContentType? = null,
    trailing: (@Composable () -> Unit)? = null,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    val errorColor = MaterialTheme.colorScheme.error
    val borderColor = if (error != null) errorColor else BoardTheme.hairlineStrong()
    val scheme = MaterialTheme.colorScheme
    Column(modifier.fillMaxWidth()) {
        Text(
            label,
            style = ManHuntType.caption(),
            color = if (error != null) errorColor else BoardTheme.muted(),
            maxLines = 1,
        )
        Spacer(Modifier.height(BoardSpace.s2))
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = BoardMetrics.inputHeight)
                .background(scheme.surfaceVariant, BoardShape.plate)
                .border(1.dp, borderColor, BoardShape.plate),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                enabled = enabled,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = BoardSpace.s5)
                    .then(if (testTag != null) Modifier.testTag(testTag) else Modifier)
                    .then(
                        if (autofillContentType != null) {
                            Modifier.semantics { contentType = autofillContentType }
                        } else {
                            Modifier
                        },
                    ),
                textStyle = ManHuntType.body().copy(color = scheme.onBackground),
                cursorBrush = SolidColor(scheme.primary),
                singleLine = true,
                visualTransformation = visualTransformation,
                keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
                keyboardActions = keyboardActions,
            )
            trailing?.invoke()
        }
        if (error != null || helper != null) {
            Spacer(Modifier.height(BoardSpace.s2))
            Text(
                text = error ?: helper.orEmpty(),
                style = ManHuntType.caption(),
                color = if (error != null) errorColor else BoardTheme.muted(),
                maxLines = 2,
            )
        }
    }
}

/**
 * Error strip: a 1 px error rule + error text on the plate (never a pale rounded card), with
 * an optional inline retry. Announced assertively.
 */
@Composable
fun ErrorStrip(
    message: String?,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
    testTag: String? = null,
) {
    if (message == null) return
    Row(
        modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, BoardShape.plate)
            .border(1.dp, MaterialTheme.colorScheme.error, BoardShape.plate)
            .padding(BoardSpace.s5)
            .semantics(mergeDescendants = true) {
                liveRegion = LiveRegionMode.Assertive
            }
            .then(if (testTag != null) Modifier.testTag(testTag) else Modifier),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            message,
            style = ManHuntType.bodySmall(),
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.weight(1f),
        )
        if (onRetry != null) {
            Spacer(Modifier.width(BoardSpace.s4))
            InlineLink(text = t("Try again"), onClick = onRetry, color = MaterialTheme.colorScheme.error)
        }
    }
}

/** 3-tick loading rule: the Board-system stand-in for a spinner. Decorative; motion-safe. */
@Composable
fun LoadingTicks(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "loading-rule")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 900, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
    )
    val color = MaterialTheme.colorScheme.primary
    Canvas(modifier.size(width = 22.dp, height = 14.dp)) {
        val barWidth = 3.dp.toPx()
        val gap = 4.dp.toPx()
        for (index in 0 until 3) {
            val local = ((phase + index * 0.33f) % 1f)
            val alpha = 0.25f + 0.75f * (1f - kotlin.math.abs(local * 2f - 1f))
            drawRect(
                color = color.copy(alpha = alpha),
                topLeft = Offset(index * (barWidth + gap), (size.height - 12.dp.toPx()) / 2f),
                size = Size(barWidth, 12.dp.toPx()),
            )
        }
    }
}

/**
 * Inline text action: 48 dp hit height, sentence case, chalk text with an underline rule
 * (never cyan, never a pill). The platform-standard navigation affordance.
 */
@Composable
fun InlineLink(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onBackground,
    enabled: Boolean = true,
) {
    Text(
        text = text,
        style = ManHuntType.label(),
        color = color.copy(alpha = if (enabled) 1f else 0.38f),
        textDecoration = TextDecoration.Underline,
        maxLines = 1,
        modifier = modifier
            .heightIn(min = ManHuntSizes.touchTarget)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(vertical = BoardSpace.s5),
    )
}

/** Heading semantics helper for the permanent line. */
@Composable
fun HeadingText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = ManHuntType.displayL(),
    color: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onBackground,
) {
    Text(
        text = text,
        modifier = modifier.semantics { heading() },
        style = style,
        color = color,
        maxLines = 3,
    )
}


/**
 * MATCHDAY text-size slider: one 1 px chalk track, one cyan-filled progress rule and a single
 * 6 x 28 dp chalk thumb - no Material dot rail, no detached halo. The whole 48 dp band is the
 * touch target; platform semantics expose the range/steps and a SetProgress action so tests and
 * TalkBack can drive it. The % label lives in the caller (Settings).
 */
@Composable
fun BoardScaleSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    onValueChangeFinished: () -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    steps: Int,
    modifier: Modifier = Modifier,
    testTag: String? = null,
) {
    val span = (valueRange.endInclusive - valueRange.start)
    val stepSize = if (steps > 0) span / steps else span
    fun snap(raw: Float): Float {
        val clamped = raw.coerceIn(valueRange.start, valueRange.endInclusive)
        if (steps <= 0) return clamped
        val snapped = valueRange.start + kotlin.math.round((clamped - valueRange.start) / stepSize) * stepSize
        return snapped.coerceIn(valueRange.start, valueRange.endInclusive)
    }
    var widthPx by remember { mutableIntStateOf(1) }
    val fraction = ((value - valueRange.start) / span).coerceIn(0f, 1f)
    val trackColor = BoardTheme.hairline()
    val fillColor = MaterialTheme.colorScheme.primary
    val thumbColor = MaterialTheme.colorScheme.onBackground
    Box(
        modifier
            .fillMaxWidth()
            .heightIn(min = ManHuntSizes.touchTarget)
            .then(if (testTag != null) Modifier.testTag(testTag) else Modifier)
            .onSizeChanged { widthPx = it.width.coerceAtLeast(1) }
            .semantics {
                stateDescription = "${(value * 100f).roundToInt()}%"
                setProgress { target ->
                    onValueChange(snap(target))
                    onValueChangeFinished()
                    true
                }
            }
            .pointerInput(valueRange, steps) {
                detectTapGestures { offset ->
                    onValueChange(snap(valueRange.start + (offset.x / widthPx) * span))
                    onValueChangeFinished()
                }
            }
            .pointerInput(valueRange, steps) {
                detectDragGestures(
                    onDragEnd = { onValueChangeFinished() },
                    onDrag = { change, _ ->
                        change.consume()
                        onValueChange(snap(valueRange.start + (change.position.x / widthPx) * span))
                    },
                )
            },
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val centerY = size.height / 2f
            val thumbHalfW = 3.dp.toPx()
            val thumbHalfH = 14.dp.toPx()
            drawRect(
                color = trackColor,
                topLeft = Offset(0f, centerY - 0.5.dp.toPx()),
                size = Size(size.width, 1.dp.toPx()),
            )
            drawRect(
                color = fillColor,
                topLeft = Offset(0f, centerY - 1.dp.toPx()),
                size = Size(size.width * fraction, 2.dp.toPx()),
            )
            val cx = (size.width * fraction).coerceIn(thumbHalfW, size.width - thumbHalfW)
            drawRect(
                color = thumbColor,
                topLeft = Offset(cx - thumbHalfW, centerY - thumbHalfH),
                size = Size(thumbHalfW * 2f, thumbHalfH * 2f),
            )
            drawRect(
                color = fillColor,
                topLeft = Offset(cx - thumbHalfW, centerY - thumbHalfH),
                size = Size(thumbHalfW * 2f, thumbHalfH * 2f),
                style = androidx.compose.ui.graphics.drawscope.Stroke(1.dp.toPx()),
            )
        }
    }
}
