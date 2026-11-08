package com.manhunt.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardColors
import com.manhunt.app.ui.theme.BoardMetrics
import com.manhunt.app.ui.theme.BoardShape
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntType

/**
 * MATCHDAY BOARD components (design/redesign/tokens.md Â§7, screens/01-shell-and-board.md Â§5).
 *
 * Match equipment, not app cards: an ink scoreboard strip, 1 px rules, rectangular action
 * blocks, cut-corner kit tags, six chalk code cells and original FieldMarks. Plates (2 dp)
 * only exist where the user acts inside a bounded object; prose and grouping never get one.
 */

/**
 * The signature full-bleed scoreboard strip: row 1 = state tag (left) + live data (right),
 * row 2 = the clock. Always ink, in both themes. One per screen, at the top of the layout.
 */
@Composable
fun MatchBoard(
    phase: String,
    clock: String? = null,
    modifier: Modifier = Modifier,
    clockNote: String? = null,
    dataRight: String? = null,
    secondaryDataRight: String? = null,
    live: Boolean = true,
    heroClock: Boolean = false,
) {
    val signal = if (live) BoardTheme.master() else BoardColors.chalkMuted
    Column(
        modifier
            .fillMaxWidth()
            .background(BoardTheme.board())
            .testTag("match_board"),
    ) {
        Box(Modifier.fillMaxWidth().height(1.dp).background(boardRuleColor()))
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = BoardMetrics.boardPaddingH, vertical = BoardMetrics.boardPaddingV),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StateTag(text = phase, tone = signal)
            Spacer(Modifier.weight(1f))
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(BoardSpace.s1),
            ) {
                dataRight?.let {
                    Text(it, style = ManHuntType.data(), color = BoardColors.chalkMuted, maxLines = 1)
                }
                secondaryDataRight?.let {
                    Text(it, style = ManHuntType.data(), color = BoardColors.chalkDim, maxLines = 1)
                }
            }
        }
        if (clock != null) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = BoardMetrics.boardPaddingH)
                    .padding(bottom = BoardMetrics.boardPaddingV),
                verticalAlignment = Alignment.Bottom,
            ) {
                Text(
                    text = clock,
                    style = ManHuntType.boardClock(hero = heroClock),
                    color = BoardColors.chalk,
                    maxLines = 1,
                )
                if (clockNote != null) {
                    Spacer(Modifier.width(BoardSpace.s4))
                    Text(
                        text = clockNote,
                        style = ManHuntType.dataSmall(),
                        color = BoardColors.chalkMuted,
                        modifier = Modifier.padding(bottom = BoardSpace.s3),
                        maxLines = 1,
                    )
                }
            }
        } else {
            Spacer(Modifier.height(BoardMetrics.boardPaddingV))
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(boardRuleColor()))
    }
}

@Composable
private fun boardRuleColor(): Color =
    if (BoardTheme.isDark()) BoardColors.chalk.copy(alpha = 0.20f) else BoardTheme.hairline()

/**
 * State word: the only tracked/uppercase text in the system. A 20 dp cut-corner outline marks
 * it as machine state; the live variant adds a cyan dot so colour is not the only cue.
 */
@Composable
fun StateTag(
    text: String,
    modifier: Modifier = Modifier,
    tone: Color? = null,
    live: Boolean = true,
) {
    val resolvedTone = tone ?: BoardTheme.master()
    Row(
        modifier
            .heightIn(min = BoardMetrics.stateTagHeight)
            .then(
                if (live) {
                    Modifier
                } else {
                    Modifier.border(1.dp, BoardTheme.hairlineStrong(), BoardShape.stateTag)
                },
            )
            .padding(horizontal = BoardSpace.s3, vertical = BoardSpace.s1),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(BoardSpace.s2),
    ) {
        if (live) {
            Box(Modifier.size(5.dp).background(resolvedTone))
        }
        Text(
            text = text.uppercase(),
            style = ManHuntType.state(),
            color = resolvedTone,
            maxLines = 1,
        )
    }
}

/**
 * 1 px chalk rule - the grouping device that replaces cards. Optional sentence-case label on
 * the left, three 3 dp survey ticks on the left edge, optional data caption on the right.
 */
@Composable
fun ChalkRule(
    modifier: Modifier = Modifier,
    label: String? = null,
    caption: String? = null,
    ticks: Boolean = true,
) {
    val hairline = BoardTheme.hairline()
    Row(
        modifier.fillMaxWidth().padding(vertical = BoardSpace.s5),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (ticks) {
            Row(horizontalArrangement = Arrangement.spacedBy(BoardSpace.s1)) {
                repeat(3) { Box(Modifier.width(1.dp).height(3.dp).background(hairline)) }
            }
            Spacer(Modifier.width(BoardSpace.s4))
        }
        if (label != null) {
            Text(
                label,
                style = ManHuntType.bodySmall(),
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 1,
            )
            Spacer(Modifier.width(BoardSpace.s4))
        }
        Box(Modifier.weight(1f).height(1.dp).background(hairline))
        if (caption != null) {
            Spacer(Modifier.width(BoardSpace.s4))
            Text(caption, style = ManHuntType.dataSmall(), color = BoardTheme.muted(), maxLines = 1)
        }
    }
}

enum class BoardButtonTone { Primary, Outline, Destructive }

/**
 * Rectangular action block: solid cyan 56 dp primary, hairline-strong 48 dp secondary, error
 * 48 dp destructive. Disabled keeps the plate at full strength and dims only label/icon to 38 %.
 */
@Composable
fun BoardButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tone: BoardButtonTone = BoardButtonTone.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
    testTag: String? = null,
    leadingMark: ImageVector? = null,
) {
    val scheme = MaterialTheme.colorScheme
    val interactive = enabled && !loading
    val container: Color
    val content: Color
    val border: BorderStroke?
    val height: androidx.compose.ui.unit.Dp
    when (tone) {
        BoardButtonTone.Primary -> {
            container = scheme.primary
            content = scheme.onPrimary
            border = null
            height = BoardMetrics.buttonPrimaryHeight
        }
        BoardButtonTone.Outline -> {
            container = Color.Transparent
            content = scheme.onBackground
            border = BorderStroke(1.dp, BoardTheme.hairlineStrong())
            height = BoardMetrics.buttonSecondaryHeight
        }
        BoardButtonTone.Destructive -> {
            container = Color.Transparent
            content = scheme.error
            border = BorderStroke(1.dp, scheme.error)
            height = BoardMetrics.buttonSecondaryHeight
        }
    }
    val labelColor = content.copy(alpha = if (interactive) 1f else 0.38f)
    Surface(
        onClick = onClick,
        enabled = interactive,
        modifier = modifier
            .heightIn(min = height)
            .then(if (testTag != null) Modifier.testTag(testTag) else Modifier),
        shape = BoardShape.plate,
        color = container,
        contentColor = labelColor,
        border = border,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = BoardSpace.s5, vertical = BoardSpace.s4),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (loading) {
                ManHuntLoader(size = 18.dp, color = labelColor)
            } else {
                if (leadingMark != null) {
                    Icon(leadingMark, contentDescription = null, modifier = Modifier.size(18.dp), tint = labelColor)
                    Spacer(Modifier.width(BoardSpace.s4))
                }
                Text(text, style = ManHuntType.label(), color = labelColor, maxLines = 2)
            }
        }
    }
}

/**
 * Cut-corner kit tag: team colour + team FieldMark + sentence-case name (+ optional data
 * badge). Colour is never the only team cue. Used for role choice, roster rows, team chips.
 */
@Composable
fun TeamTag(
    team: String,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    badge: String? = null,
    onClick: (() -> Unit)? = null,
) {
    val color = teamColor(team)
    val mark = if (team == Teams.PREY) FieldMarks.prey else FieldMarks.hunters
    val border = BorderStroke(
        if (selected) 2.dp else 1.dp,
        color.copy(alpha = if (selected) 1f else 0.65f),
    )
    val background = color.copy(alpha = if (selected) 0.20f else 0.12f)
    val content: @Composable () -> Unit = {
        Row(
            Modifier
                .heightIn(min = BoardMetrics.tagHeight)
                .padding(horizontal = BoardSpace.s5, vertical = BoardSpace.s2),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(BoardSpace.s3),
        ) {
            Icon(mark, contentDescription = null, modifier = Modifier.size(16.dp), tint = color)
            Text(teamLabel(team), style = ManHuntType.label(), color = color, maxLines = 1)
            if (badge != null) {
                Text(badge, style = ManHuntType.data(), color = color, maxLines = 1)
            }
        }
    }
    if (onClick != null) {
        Surface(
            onClick = onClick,
            modifier = modifier,
            shape = BoardShape.tag,
            color = background,
            contentColor = color,
            border = border,
            content = content,
        )
    } else {
        Surface(
            modifier = modifier,
            shape = BoardShape.tag,
            color = background,
            contentColor = color,
            border = border,
            content = content,
        )
    }
}

/**
 * Six chalk cells for the invite code (48 x 56 dp, 8 dp gap). The code is a social object, so
 * it gets its own plate, not a generic text field. Editable when [onCodeChange] is supplied:
 * a transparent input overlays the cells so paste, autofill and the IME still work.
 */
@Composable
fun CodePlate(
    code: String,
    modifier: Modifier = Modifier,
    onCodeChange: ((String) -> Unit)? = null,
    testTag: String? = null,
    cells: Int = 6,
) {
    val focusManager = LocalFocusManager.current
    val editable = onCodeChange != null
    val normalized = code.uppercase()
    Box(
        modifier
            .fillMaxWidth()
            .then(if (testTag != null && !editable) Modifier.testTag(testTag) else Modifier),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(BoardMetrics.codeCellGap)) {
            for (index in 0 until cells) {
                val char = normalized.getOrNull(index)?.toString().orEmpty()
                Box(
                    Modifier
                        .weight(1f)
                        .heightIn(min = BoardMetrics.codeCellHeight)
                        .background(MaterialTheme.colorScheme.surfaceVariant, BoardShape.codeCell)
                        .border(1.dp, BoardTheme.hairlineStrong(), BoardShape.codeCell),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = char,
                        style = ManHuntType.data(20.sp),
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                }
            }
        }
        if (editable) {
            val commit: (String) -> Unit = onCodeChange!!
            BasicTextField(
                value = code,
                onValueChange = { raw ->
                    commit(raw.filter { it.isLetterOrDigit() }.uppercase().take(cells))
                },
                modifier = Modifier
                    .matchParentSize()
                    .then(if (testTag != null) Modifier.testTag(testTag) else Modifier),
                textStyle = TextStyle(color = Color.Transparent, fontSize = 1.sp),
                cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters,
                    keyboardType = KeyboardType.Ascii,
                    imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
            )
        }
    }
}

/** Screen shell for the Board system: ground colour, 16 dp margins, airy vertical rhythm. */
@Composable
fun BoardScaffold(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = BoardSpace.screen),
        content = content,
    )
}

/** Screen header: FieldMark back target, headline title, optional trailing actions. */
@Composable
fun BoardHeader(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    actions: (@Composable RowScope.() -> Unit)? = null,
) {
    Row(
        modifier.fillMaxWidth().heightIn(min = 56.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.size(ManHuntSizes.touchTarget),
            ) {
                Icon(
                    FieldMarks.back,
                    contentDescription = t("Back"),
                    tint = MaterialTheme.colorScheme.onBackground,
                )
            }
            Spacer(Modifier.width(BoardSpace.s2))
        }
        Text(
            title,
            style = ManHuntType.headline(),
            color = MaterialTheme.colorScheme.onBackground,
            maxLines = 2,
            modifier = Modifier.weight(1f),
        )
        if (actions != null) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(BoardSpace.s2),
                verticalAlignment = Alignment.CenterVertically,
                content = actions,
            )
        }
    }
}

/**
 * Bottom action dock: the one-hand reach zone, 72 dp tall with a hairline top. The primary
 * action belongs here, not in a scrolling card.
 */
@Composable
fun BoardDock(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    Column(modifier.fillMaxWidth().background(MaterialTheme.colorScheme.background)) {
        Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 72.dp)
                .padding(vertical = BoardSpace.s5),
            horizontalArrangement = Arrangement.spacedBy(BoardSpace.s4),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}
