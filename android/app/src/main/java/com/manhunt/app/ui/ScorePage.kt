package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.manhunt.app.data.MemberDto
import com.manhunt.app.data.MatchDto
import com.manhunt.app.data.Phases
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardColors
import com.manhunt.app.ui.theme.BoardMetrics
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntType

/**
 * Full-screen ScorePage (screens/08-result-and-history.md) for a snapshot of the final match
 * state captured before the server finish reset. Honest degradation: the winner is always
 * shown from the server's `winner`; the score line appears only when the final counts are
 * known; per-player final statuses appear only when elimination flags were captured; the
 * duration appears only when the match carried real start/end times.
 */
@Composable
fun ScorePage(
    snapshot: FinishedMatchSnapshot,
    onBackToLobby: () -> Unit,
    onViewHistory: () -> Unit,
) {
    val cancelled = snapshot.cancelled
    val winnerIsHunters = snapshot.winner == Teams.HUNTERS
    val duration = snapshot.durationSeconds?.let(::formatScoreClock)
    // Opaque, full-bleed result surface: nothing from the hunt screen can show through.
    Surface(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
        color = MaterialTheme.colorScheme.background,
        contentColor = MaterialTheme.colorScheme.onBackground,
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
            MatchBoard(
                phase = if (cancelled) "Cancelled" else "Full time",
                clock = duration,
                clockNote = if (duration != null) t("played") else null,
                dataRight = if (snapshot.preyTotal > 0) {
                    "PREY ${snapshot.preyAlive} / ${snapshot.preyTotal}"
                } else {
                    null
                },
                secondaryDataRight = snapshot.winner?.let { winner ->
                    t(if (winner == Teams.HUNTERS) "Hunters" else "Prey").uppercase()
                },
                live = false,
                modifier = Modifier.testTag("board"),
            )
            Column(
                Modifier.padding(horizontal = BoardSpace.screen),
                verticalArrangement = Arrangement.spacedBy(BoardSpace.s6),
            ) {
                Spacer(Modifier.height(BoardSpace.s6))
                Text(
                    text = if (cancelled) {
                        t("Hunt cancelled")
                    } else if (winnerIsHunters) {
                        t("Hunters win!").trimEnd('!') + "."
                    } else {
                        t("Prey win!").trimEnd('!') + "."
                    },
                    style = ManHuntType.displayXl(),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier
                        .semantics { heading() }
                        .testTag("result_winner"),
                )
                if (snapshot.preyTotal > 0) {
                    Text(
                        "${t("Prey remaining")}: ${snapshot.preyAlive} / ${snapshot.preyTotal}",
                        style = ManHuntType.data(),
                        color = BoardTheme.muted(),
                        modifier = Modifier.testTag("result_score"),
                    )
                }
                // Trail plate: the drawn field stands in for a read-only map snapshot this
                // sprint (allowed by the spec); no OSM credit because no tiles are drawn.
                BrandFieldPlate(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .testTag("result_map"),
                    animate = false,
                )
                snapshot.members?.let { members ->
                    ResultTeams(members = members, modifier = Modifier.testTag("result_teams"))
                }
                Spacer(Modifier.height(BoardSpace.s2))
                BoardButton(
                    text = t("Back to lobby"),
                    onClick = onBackToLobby,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("result_back"),
                )
                BoardButton(
                    text = t("View hunt history"),
                    onClick = onViewHistory,
                    tone = BoardButtonTone.Outline,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("result_history"),
                )
                Spacer(Modifier.height(BoardSpace.s10))
            }
        }
    }
}

/** Final team sheets: only the statuses we actually captured, never invented outcomes. */
@Composable
private fun ResultTeams(
    members: List<FinishedMemberSnapshot>,
    modifier: Modifier = Modifier,
) {
    val prey = members.filter { it.team == Teams.PREY }
    val hunters = members.filter { it.team == Teams.HUNTERS }
    Column(modifier.fillMaxWidth()) {
        Text(
            t("Hunt roster"),
            style = ManHuntType.label(),
            color = MaterialTheme.colorScheme.onBackground,
        )
        Spacer(Modifier.height(BoardSpace.s3))
        Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
        Spacer(Modifier.height(BoardSpace.s3))
        Row(horizontalArrangement = Arrangement.spacedBy(BoardSpace.s5)) {
            Column(Modifier.weight(1f)) { ResultTeamColumn(Teams.PREY, prey) }
            Column(Modifier.weight(1f)) { ResultTeamColumn(Teams.HUNTERS, hunters) }
        }
    }
}

@Composable
private fun ResultTeamColumn(team: String, members: List<FinishedMemberSnapshot>) {
    val color = teamColor(team)
    Column(Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                if (team == Teams.PREY) FieldMarks.prey else FieldMarks.hunters,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = color,
            )
            Spacer(Modifier.width(BoardSpace.s2))
            Text(teamLabel(team).uppercase(), style = ManHuntType.dataSmall(), color = color)
            Spacer(Modifier.weight(1f))
            Text(members.size.toString(), style = ManHuntType.boardMeta(), color = color)
        }
        Spacer(Modifier.height(BoardSpace.s2))
        Box(Modifier.fillMaxWidth().height(2.dp).background(color.copy(alpha = 0.55f)))
        members.forEach { member ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = BoardSpace.s3),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    member.username,
                    style = ManHuntType.bodySmall(),
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1,
                    modifier = Modifier.weight(1f),
                )
                if (member.eliminated) {
                    Text(
                        t("TAGGED").uppercase(),
                        style = ManHuntType.dataSmall(),
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
            Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
        }
    }
}

/** MM:SS for the frozen final clock; null when the match carried no real duration. */
private fun formatScoreClock(totalSeconds: Long): String {
    val safe = totalSeconds.coerceAtLeast(0L)
    val minutes = safe / 60
    val seconds = safe % 60
    return "%d:%02d".format(minutes, seconds)
}

/**
 * Fallback snapshot for a finished match that is still present in room state (for example when
 * the socket delivered the finish after a reconnect): uses exactly the data on screen, and
 * never invents the missing elimination flags.
 */
fun finishedSnapshotFromResult(match: MatchDto, members: List<MemberDto>): FinishedMatchSnapshot {
    val hasFlags = members.any { it.eliminated }
    return FinishedMatchSnapshot(
        matchId = match.id,
        phase = match.phase,
        winner = match.winner,
        startedAt = match.startedAt,
        endsAt = match.endsAt,
        endedAt = 0,
        preyAlive = match.preyAlive,
        preyTotal = match.preyTotal,
        zoneRadiusM = match.zone?.radiusM,
        members = if (hasFlags) {
            members.map { FinishedMemberSnapshot(it.userId, it.username, it.team, it.eliminated, it.isAdmin) }
        } else {
            null
        },
        capturedAt = System.currentTimeMillis(),
    )
}

