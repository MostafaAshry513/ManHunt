package com.manhunt.app.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * ManHunt FieldMarks: the original chalk-geometry icon set for the MATCHDAY BOARD system.
 *
 * Drawn on a 24 x 24 grid with a 2 dp stroke, square terminals and no rounded corners; the
 * grammar is the Open Zone mark (incomplete rings, survey rules, tally strokes) rather than
 * the Material outlined set. One file, one stroke language - the brand mark and wordmark are
 * separate assets and are never used as icons. Colour is applied by `Icon(tint = ...)`.
 */
object FieldMarks {
    // --- Field / game ---------------------------------------------------------------
    val zone: ImageVector = strokeMark("zone") { openRing(12f, 12f, 9f, gapDeg = 24f, centreDeg = -58f) }
    val prey: ImageVector = mark(
        "prey",
        stroke = { openRing(12f, 12f, 8f, gapDeg = 26f, centreDeg = -58f) },
        fill = { circle(12f, 12f, 3.2f) },
    )
    val hunters: ImageVector = strokeMark("hunters") {
        chevron(4f, 6f); chevron(9.5f, 6f); chevron(15f, 6f)
    }
    val trail: ImageVector = mark(
        "trail",
        stroke = { moveTo(4f, 17f); lineTo(9.5f, 11.5f); lineTo(14f, 14f); lineTo(20f, 6.5f) },
        fill = {
            circle(4f, 17f, 2f); circle(9.5f, 11.5f, 1.6f); circle(14f, 14f, 1.6f); circle(20f, 6.5f, 2f)
        },
    )
    val ping: ImageVector = mark(
        "ping",
        stroke = {
            arcFrom(7.5f, 11f, 4.5f, -60f, 120f)
            arcFrom(7.5f, 11f, 8.5f, -60f, 120f)
        },
        fill = { circle(7.5f, 11f, 2f) },
    )
    val tag: ImageVector = mark(
        "tag",
        stroke = { openRing(14.5f, 9f, 5.5f, gapDeg = 70f, centreDeg = -140f) },
        fill = { circle(7f, 16.5f, 2.6f) },
    )
    val clock: ImageVector = mark(
        "clock",
        stroke = {
            circleStroke(12f, 12f, 9f)
            moveTo(12f, 6.5f); lineTo(12f, 12.5f); lineTo(16f, 14.5f)
        },
    )
    val code: ImageVector = strokeMark("code") {
        cell(3.5f, 3.5f); cell(10f, 3.5f); cell(16.5f, 3.5f)
        cell(3.5f, 12f); cell(10f, 12f); cell(16.5f, 12f)
    }
    val roster: ImageVector = strokeMark("roster") {
        moveTo(7f, 4f); lineTo(7f, 20f)
        moveTo(12f, 4f); lineTo(12f, 20f)
        moveTo(17f, 4f); lineTo(17f, 20f)
        moveTo(4f, 18f); lineTo(20f, 6f)
    }
    val chat: ImageVector = strokeMark("chat") {
        moveTo(5f, 17f); lineTo(5f, 5f); lineTo(16f, 5f)
        moveTo(9f, 11f); lineTo(20f, 11f)
        moveTo(9f, 16f); lineTo(20f, 16f)
    }
    val settings: ImageVector = strokeMark("settings") {
        ruleWithNotch(7f, 6.5f)
        ruleWithNotch(12f, 14.5f)
        ruleWithNotch(17f, 10f)
    }
    val history: ImageVector = mark(
        "history",
        stroke = {
            circleStroke(13f, 12f, 8f)
            moveTo(13f, 7.5f); lineTo(13f, 12.5f); lineTo(16.5f, 14.5f)
            moveTo(3.5f, 8f); lineTo(3.5f, 13f); lineTo(8.5f, 13f)
            moveTo(5f, 10.5f); lineTo(3.5f, 13f)
        },
    )
    val update: ImageVector = strokeMark("update") {
        moveTo(12f, 4f); lineTo(12f, 15f)
        moveTo(8f, 11f); lineTo(12f, 15f); lineTo(16f, 11f)
        moveTo(4f, 19.5f); lineTo(20f, 19.5f)
    }
    val share: ImageVector = strokeMark("share") {
        cell(3.5f, 5f, 7f, 7f)
        cell(14f, 12.5f, 7f, 7f)
        moveTo(9f, 10.5f); lineTo(16f, 14.5f)
    }
    val theme: ImageVector = mark(
        "theme",
        stroke = { circleStroke(12f, 12f, 9f) },
        fill = { half(cx = 12f, cy = 12f, r = 9f) },
    )
    val language: ImageVector = strokeMark("language") {
        moveTo(9f, 4.5f); lineTo(3.5f, 12f); lineTo(9f, 19.5f)
        moveTo(15f, 4.5f); lineTo(20.5f, 12f); lineTo(15f, 19.5f)
        moveTo(12f, 6.5f); lineTo(12f, 17.5f)
    }

    // --- Directional / platform conventions -----------------------------------------
    val back: ImageVector = strokeMark("back", autoMirror = true) {
        moveTo(19f, 12f); lineTo(5f, 12f)
        moveTo(11f, 6f); lineTo(5f, 12f); lineTo(11f, 18f)
    }
    val close: ImageVector = strokeMark("close") {
        moveTo(6f, 6f); lineTo(18f, 18f)
        moveTo(18f, 6f); lineTo(6f, 18f)
    }
    val more: ImageVector = mark(
        "more",
        fill = { circle(5f, 12f, 2f); circle(12f, 12f, 2f); circle(19f, 12f, 2f) },
    )
    val check: ImageVector = strokeMark("check") {
        moveTo(4.5f, 12.5f); lineTo(9.5f, 17.5f); lineTo(19.5f, 6.5f)
    }
    val plus: ImageVector = strokeMark("plus") {
        moveTo(12f, 4.5f); lineTo(12f, 19.5f)
        moveTo(4.5f, 12f); lineTo(19.5f, 12f)
    }
    val send: ImageVector = strokeMark("send") {
        moveTo(3.5f, 11f); lineTo(20.5f, 3.5f); lineTo(14f, 20.5f); lineTo(10.5f, 13.5f); lineTo(3.5f, 11f)
    }
}

// ---------------------------------------------------------------------------------------
// Drawing helpers: one stroke grammar, no rounded caps.
// ---------------------------------------------------------------------------------------

private const val MARK_SIZE = 24f

private fun mark(
    name: String,
    stroke: (PathBuilder.() -> Unit)? = null,
    fill: (PathBuilder.() -> Unit)? = null,
    autoMirror: Boolean = false,
): ImageVector {
    val builder = ImageVector.Builder(
        name = name,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = MARK_SIZE,
        viewportHeight = MARK_SIZE,
        autoMirror = autoMirror,
    )
    if (stroke != null) {
        builder.path(
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 2f,
            strokeLineCap = StrokeCap.Butt,
            strokeLineJoin = StrokeJoin.Miter,
            pathFillType = PathFillType.NonZero,
        ) { stroke() }
    }
    if (fill != null) {
        builder.path(
            fill = SolidColor(Color.Black),
            pathFillType = PathFillType.NonZero,
        ) { fill() }
    }
    return builder.build()
}

private fun strokeMark(
    name: String,
    autoMirror: Boolean = false,
    stroke: PathBuilder.() -> Unit,
): ImageVector = mark(name, stroke, autoMirror = autoMirror)

/** Full circle as two arcs (works for stroke or fill). */
private fun PathBuilder.circleStroke(cx: Float, cy: Float, r: Float) {
    moveTo(cx, cy - r)
    arcTo(r, r, 0f, true, true, cx, cy + r)
    arcTo(r, r, 0f, true, true, cx, cy - r)
}

/** Filled circle. */
private fun PathBuilder.circle(cx: Float, cy: Float, r: Float) {
    circleStroke(cx, cy, r)
}

/** The Open Zone grammar: an incomplete chalk ring (SVG-style arc, gap on the upper right). */
private fun PathBuilder.openRing(cx: Float, cy: Float, r: Float, gapDeg: Float, centreDeg: Float) {
    val startRad = (centreDeg + gapDeg / 2f) * (PI / 180.0)
    val endRad = (centreDeg - gapDeg / 2f) * (PI / 180.0)
    moveTo(cx + r * cos(startRad).toFloat(), cy + r * sin(startRad).toFloat())
    arcTo(
        r,
        r,
        0f,
        true,
        true,
        cx + r * cos(endRad).toFloat(),
        cy + r * sin(endRad).toFloat(),
    )
}

/** Arc centred on (cx, cy) starting at [fromDeg] degrees and sweeping [sweepDeg]. */
private fun PathBuilder.arcFrom(cx: Float, cy: Float, r: Float, fromDeg: Float, sweepDeg: Float) {
    val from = fromDeg * (PI / 180.0)
    val to = (fromDeg + sweepDeg) * (PI / 180.0)
    moveTo(cx + r * cos(from).toFloat(), cy + r * sin(from).toFloat())
    arcTo(
        r,
        r,
        0f,
        sweepDeg > 180f,
        sweepDeg > 0f,
        cx + r * cos(to).toFloat(),
        cy + r * sin(to).toFloat(),
    )
}

/** Converging chevron used by the hunters mark (centred on x, opening left). */
private fun PathBuilder.chevron(x: Float, y: Float) {
    moveTo(x, y)
    lineTo(x + 4.5f, y + 6f)
    lineTo(x, y + 12f)
}

/** Small cut-corner cell (the code mark's six cells). */
private fun PathBuilder.cell(left: Float, top: Float, w: Float = 5f, h: Float = 5f) {
    moveTo(left + 2f, top)
    lineTo(left + w, top)
    lineTo(left + w, top + h - 2f)
    lineTo(left + w - 2f, top + h)
    lineTo(left, top + h)
    lineTo(left, top + 2f)
    close()
}

/** Mixer rule with an offset notch (settings, not a gear). */
private fun PathBuilder.ruleWithNotch(y: Float, notchX: Float) {
    moveTo(4f, y); lineTo(notchX - 2.5f, y)
    moveTo(notchX + 2.5f, y); lineTo(20f, y)
    moveTo(notchX, y - 3f); lineTo(notchX, y + 3f)
}

/** Right half of a filled circle (the system/theme mark reads as half-filled). */
private fun PathBuilder.half(cx: Float, cy: Float, r: Float) {
    moveTo(cx, cy - r)
    arcTo(r, r, 0f, false, true, cx, cy + r)
    close()
}
