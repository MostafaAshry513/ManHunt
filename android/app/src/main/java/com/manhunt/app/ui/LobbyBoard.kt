package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manhunt.app.data.MemberDto
import com.manhunt.app.data.RoomState
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardColors
import com.manhunt.app.ui.theme.BoardMetrics
import com.manhunt.app.ui.theme.BoardShape
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntType

/**
 * Lobby surfaces for the MATCHDAY BOARD system (screens/05-lobby.md).
 * The Board variant carries room + ready state; TeamSheet is the two-column team list; the
 * dock owns the one primary action (Ready / Stand down / Begin the hunt).
 */

/** `MatchBoard` Lobby variant: state + room name + invite code + ready segments + n/n READY. */
@Composable
fun LobbyBoard(
    roomName: String,
    readyCount: Int,
    totalPlayers: Int,
    modifier: Modifier = Modifier,
    roomCode: String? = null,
    onCopyCode: (() -> Unit)? = null,
) {
    Column(
        modifier
            .fillMaxWidth()
            .background(BoardTheme.board())
            .testTag("board"),
    ) {
        Box(Modifier.fillMaxWidth().height(1.dp).background(boardRuleColor()))
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = BoardMetrics.boardPaddingH, vertical = BoardMetrics.boardPaddingV),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                StateTag(text = "Lobby", tone = BoardColors.chalkMuted, live = false)
                Spacer(Modifier.height(BoardSpace.s1))
                Text(
                    roomName,
                    style = ManHuntType.title(),
                    color = BoardColors.chalk,
                    maxLines = 1,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "$readyCount / $totalPlayers " + t("Ready").uppercase(),
                    style = ManHuntType.data(),
                    color = BoardColors.chalkMuted,
                    maxLines = 1,
                )
                if (roomCode != null) {
                    Spacer(Modifier.height(BoardSpace.s1))
                    Text(
                        roomCode,
                        style = ManHuntType.data(18.sp),
                        color = BoardColors.cyan,
                        maxLines = 1,
                        modifier = Modifier
                            .testTag("room_code")
                            .then(if (onCopyCode != null) Modifier.clickable(onClick = onCopyCode) else Modifier),
                    )
                }
            }
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = BoardMetrics.boardPaddingH),
            horizontalArrangement = Arrangement.spacedBy(BoardSpace.s2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            repeat(minOf(totalPlayers.coerceAtLeast(1), 8)) { index ->
                Box(
                    Modifier
                        .size(width = 14.dp, height = 4.dp)
                        .background(
                            if (index < readyCount) BoardColors.cyan else BoardColors.chalk.copy(alpha = 0.16f),
                        ),
                )
            }
        }
        Spacer(Modifier.height(BoardSpace.s2))
        Box(Modifier.fillMaxWidth().height(1.dp).background(boardRuleColor()))
    }
}

@Composable
private fun boardRuleColor() =
    if (BoardTheme.isDark()) BoardColors.chalk.copy(alpha = 0.20f) else BoardTheme.hairline()

/**
 * Two-column TeamSheet (Prey then Hunters; stacks below 340 dp). Columns: team glyph + name +
 * count, 2 dp team rule, 56 dp rows (avatar initial, name, status data, HOST/YOU data labels,
 * ready check), then the join/selected tag. Rows are not buttons; only the tag acts.
 */
@Composable
fun TeamSheet(
    state: RoomState,
    me: MemberDto?,
    busy: Boolean,
    onSetTeam: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val prey = state.members.filter { it.team == Teams.PREY }
    val hunters = state.members.filter { it.team == Teams.HUNTERS }
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val stacked = maxWidth < 340.dp
        if (stacked) {
            Column(verticalArrangement = Arrangement.spacedBy(BoardSpace.s6)) {
                TeamColumn(Teams.PREY, prey, me, busy, onSetTeam)
                TeamColumn(Teams.HUNTERS, hunters, me, busy, onSetTeam)
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(BoardSpace.s5)) {
                Column(Modifier.weight(1f)) { TeamColumn(Teams.PREY, prey, me, busy, onSetTeam) }
                Column(Modifier.weight(1f)) { TeamColumn(Teams.HUNTERS, hunters, me, busy, onSetTeam) }
            }
        }
    }
}

@Composable
private fun TeamColumn(
    team: String,
    members: List<MemberDto>,
    me: MemberDto?,
    busy: Boolean,
    onSetTeam: (String) -> Unit,
) {
    val color = teamColor(team)
    val glyph = if (team == Teams.PREY) FieldMarks.prey else FieldMarks.hunters
    val sorted = members.sortedWith(
        compareByDescending<MemberDto> { it.isAdmin }
            .thenByDescending { it.ready }
            .thenBy { it.username.lowercase() },
    )
    Column(Modifier.fillMaxWidth().testTag(if (team == Teams.PREY) "team_sheet_prey" else "team_sheet_hunters")) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.material3.Icon(
                glyph,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = color,
            )
            Spacer(Modifier.width(BoardSpace.s3))
            Text(teamLabel(team).uppercase(), style = ManHuntType.label(), color = color)
            Spacer(Modifier.weight(1f))
            Text(
                members.size.toString(),
                style = ManHuntType.boardMeta(),
                color = color,
            )
        }
        Spacer(Modifier.height(BoardSpace.s2))
        Box(Modifier.fillMaxWidth().height(2.dp).background(color.copy(alpha = 0.55f)))
        if (sorted.isEmpty()) {
            Text(
                "â€”",
                style = ManHuntType.bodySmall(),
                color = BoardTheme.muted(),
                modifier = Modifier.padding(vertical = BoardSpace.s5),
            )
        }
        sorted.forEach { member ->
            TeamRow(member = member, me = me, team = team)
            Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
        }
        Spacer(Modifier.height(BoardSpace.s4))
        val selected = me?.team == team
        TeamTag(
            team = team,
            selected = selected,
            onClick = if (!selected && !busy) {
                { onSetTeam(team) }
            } else {
                null
            },
            modifier = Modifier
                .fillMaxWidth()
                .testTag(if (team == Teams.PREY) "team_prey" else "team_hunters"),
        )
    }
}

@Composable
private fun TeamRow(member: MemberDto, me: MemberDto?, team: String) {
    val color = teamColor(team)
    val isMe = member.userId == me?.userId
    val displayName = member.username.trim().ifBlank { "Player" }
    val initial = firstGrapheme(displayName)
    val rowModifier = if (isMe) {
        Modifier
            .fillMaxWidth()
            .background(color.copy(alpha = 0.12f))
    } else {
        Modifier.fillMaxWidth()
    }
    Row(
        rowModifier
            .heightIn(min = BoardMetrics.listRow)
            .padding(horizontal = BoardSpace.s2, vertical = BoardSpace.s3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(32.dp)
                .background(color.copy(alpha = 0.16f), RoundedCornerShape(5.dp))
                .border(1.dp, color, RoundedCornerShape(5.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                initial,
                style = ManHuntType.label().copy(fontFamily = FontFamily.SansSerif),
                color = color,
                maxLines = 1,
                overflow = TextOverflow.Clip,
            )
        }
        Spacer(Modifier.width(BoardSpace.s4))
        Column(Modifier.weight(1f)) {
            Text(
                displayName,
                style = ManHuntType.title().copy(
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 17.sp,
                    lineHeight = 21.sp,
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth(),
            )
            val status = t(
                when {
                    member.eliminated -> "Tagged"
                    !member.connected -> "Offline"
                    member.ready -> "Ready"
                    else -> "Gearing up"
                },
            )
            val tags = buildList {
                add(status)
                if (member.isAdmin) add("HOST")
                if (isMe) add("YOU")
            }.joinToString(" · ")
            Text(
                tags,
                style = ManHuntType.dataSmall(),
                color = BoardTheme.muted(),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (member.ready) {
            androidx.compose.material3.Icon(
                FieldMarks.check,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = BoardColors.chalk,
            )
        }
    }
}

/**
 * First user-perceived character, safe for emoji, combining marks and scripts the bundled
 * display face has no glyphs for. A plain `firstOrNull()` splits surrogate pairs and can
 * render a tofu box on a normal Android device.
 */
private fun firstGrapheme(text: String): String {
    val value = text.trim()
    if (value.isEmpty()) return "?"
    return try {
        val iterator = java.text.BreakIterator.getCharacterInstance(java.util.Locale.ROOT)
        iterator.setText(value)
        val start = iterator.first()
        val end = iterator.next()
        if (start == java.text.BreakIterator.DONE || end == java.text.BreakIterator.DONE || end <= start) {
            value.substring(0, 1)
        } else {
            value.substring(start, end)
        }.uppercase(java.util.Locale.ROOT)
    } catch (_: Exception) {
        value.substring(0, 1).uppercase(java.util.Locale.ROOT)
    }
}

/**
 * Pinned lobby dock: the one primary action in the thumb zone. Host sees Begin the hunt with
 * the localised server blockers as the reason line; players see Ready to hunt / Stand down.
 */
@Composable
fun LobbyDock(
    state: RoomState,
    me: MemberDto?,
    busy: Boolean,
    onToggleReady: () -> Unit,
    onStartMatch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isAdmin = me?.isAdmin == true
    val blockers = startBlockers(state)
    val ready = me?.ready == true
    val status: String? = when {
        isAdmin -> blockers.joinToString(" Â· ").ifBlank { null }
        ready -> t("Ready to hunt")
        else -> null
    }
    Column(
        modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = BoardMetrics.boardPaddingH),
    ) {
        if (status != null) {
            Spacer(Modifier.height(BoardSpace.s5))
            Text(
                status,
                style = ManHuntType.bodySmall(),
                color = BoardTheme.muted(),
                maxLines = 2,
                modifier = Modifier.testTag("dock_status"),
            )
        }
        Spacer(Modifier.height(BoardSpace.s3))
        if (isAdmin) {
            // The host still readies up (they are a player too); it is an inline action so the
            // Begin button remains the only cyan surface in the dock.
            InlineLink(
                text = t(if (ready) "Stand down" else "Ready to hunt"),
                onClick = onToggleReady,
                enabled = !busy,
                modifier = Modifier.testTag("ready_button"),
            )
            Spacer(Modifier.height(BoardSpace.s2))
            BoardButton(
                text = t("Begin the hunt"),
                onClick = onStartMatch,
                enabled = blockers.isEmpty() && !busy,
                loading = busy,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("start_match"),
            )
        } else {
            BoardButton(
                text = t(if (ready) "Stand down" else "Ready to hunt"),
                onClick = onToggleReady,
                tone = if (ready) BoardButtonTone.Outline else BoardButtonTone.Primary,
                enabled = !busy,
                loading = busy,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ready_button"),
            )
        }
        Spacer(Modifier.height(BoardSpace.s5))
    }
}


