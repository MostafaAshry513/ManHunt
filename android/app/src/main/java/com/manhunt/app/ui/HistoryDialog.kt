package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.manhunt.app.data.MatchHistoryEntry
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntType
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Full-screen Hunt history (screens/08-result-and-history.md Â§3). Keeps the public
 * `HistoryDialog(matches, loading, error, onDismiss)` contract so the caller does not change,
 * but renders a rule-led page instead of the old AlertDialog: 72 dp hairline rows, mono
 * time/duration, result word in the winner team colour, honest loading/empty/error states -
 * a failed load never masquerades as "no hunts".
 */
@Composable
fun HistoryDialog(
    matches: List<MatchHistoryEntry>,
    loading: Boolean = false,
    /** Non-null when loading the history failed; shown instead of the empty state. */
    error: String? = null,
    onDismiss: () -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .testTag("history_dialog"),
            color = MaterialTheme.colorScheme.background,
            contentColor = MaterialTheme.colorScheme.onBackground,
        ) {
            Column(Modifier.fillMaxSize()) {
                BoardHeader(title = t("Hunt history"), onBack = onDismiss)
                Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = BoardSpace.screen),
                ) {
                    when {
                        loading -> {
                            Spacer(Modifier.height(BoardSpace.s6))
                            repeat(3) {
                                Box(
                                    Modifier
                                        .fillMaxWidth()
                                        .height(72.dp)
                                        .padding(vertical = BoardSpace.s3),
                                ) {
                                    Box(
                                        Modifier
                                            .fillMaxWidth()
                                            .height(10.dp)
                                            .background(
                                                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f),
                                                RoundedCornerShape(2.dp),
                                            ),
                                    )
                                }
                            }
                        }
                        error != null -> {
                            Spacer(Modifier.height(BoardSpace.s6))
                            ErrorStrip(message = error)
                        }
                        matches.isEmpty() -> {
                            Spacer(Modifier.height(BoardSpace.s9))
                            Text(
                                t("No hunts in this room yet."),
                                style = ManHuntType.title(),
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.semantics { heading() },
                            )
                            Spacer(Modifier.height(BoardSpace.s3))
                            Text(
                                t("Hunts appear here once they finish."),
                                style = ManHuntType.bodySmall(),
                                color = BoardTheme.muted(),
                            )
                        }
                        else -> {
                            Spacer(Modifier.height(BoardSpace.s5))
                            var lastDate: LocalDate? = null
                            matches.forEach { match ->
                                val date = localDate(match.startedAt)
                                if (date != lastDate) {
                                    lastDate = date
                                    Spacer(Modifier.height(BoardSpace.s5))
                                    Text(
                                        formatDate(match.startedAt),
                                        style = ManHuntType.data(),
                                        color = BoardTheme.muted(),
                                    )
                                    Spacer(Modifier.height(BoardSpace.s2))
                                    Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
                                }
                                HistoryRow(match)
                            }
                            Spacer(Modifier.height(BoardSpace.s10))
                        }
                    }
                }
            }
        }
    }
}

/** One 72 dp history row: mono time/duration, result word in the winner colour, no chevron. */
@Composable
private fun HistoryRow(match: MatchHistoryEntry) {
    val accent = when {
        match.cancelled -> BoardTheme.muted()
        match.winner == Teams.HUNTERS -> teamColor(Teams.HUNTERS)
        match.winner == Teams.PREY -> teamColor(Teams.PREY)
        else -> MaterialTheme.colorScheme.primary
    }
    val result = when {
        match.cancelled -> t("Hunt cancelled")
        match.winner == Teams.HUNTERS -> t("Hunters won")
        match.winner == Teams.PREY -> t("Prey won")
        else -> t("In progress")
    }
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 72.dp)
            .padding(vertical = BoardSpace.s4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            formatTime(match.startedAt),
            style = ManHuntType.data(),
            color = BoardTheme.muted(),
            maxLines = 1,
            modifier = Modifier.width(64.dp),
        )
        Text(
            match.durationSec?.let { formatDuration(it) } ?: "â€”",
            style = ManHuntType.data(),
            color = BoardTheme.muted(),
            maxLines = 1,
            modifier = Modifier.width(52.dp),
        )
        Spacer(Modifier.width(BoardSpace.s3))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.width(6.dp).height(6.dp).background(accent))
                Spacer(Modifier.width(BoardSpace.s3))
                Text(
                    result,
                    style = ManHuntType.label(),
                    color = accent,
                    maxLines = 1,
                )
            }
            if (match.prey.isNotEmpty() || match.hunters.isNotEmpty()) {
                Spacer(Modifier.height(BoardSpace.s2))
                Text(
                    buildString {
                        if (match.prey.isNotEmpty()) {
                            append("${t("Prey")}: ${match.prey.joinToString(", ")}")
                        }
                        if (match.prey.isNotEmpty() && match.hunters.isNotEmpty()) append("  Â·  ")
                        if (match.hunters.isNotEmpty()) {
                            append("${t("Hunters")}: ${match.hunters.joinToString(", ")}")
                        }
                    },
                    style = ManHuntType.dataSmall(),
                    color = BoardTheme.muted(),
                    maxLines = 2,
                )
            }
        }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(BoardTheme.hairline()))
}

private val HISTORY_TIME_FORMATTER =
    DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault())
private val HISTORY_DATE_FORMATTER =
    DateTimeFormatter.ofPattern("d MMM yyyy", Locale.getDefault())

private fun formatTime(epochMs: Long): String {
    if (epochMs <= 0) return "â€”"
    return Instant.ofEpochMilli(epochMs)
        .atZone(ZoneId.systemDefault())
        .format(HISTORY_TIME_FORMATTER)
}

private fun formatDate(epochMs: Long): String {
    if (epochMs <= 0) return "â€”"
    return Instant.ofEpochMilli(epochMs)
        .atZone(ZoneId.systemDefault())
        .format(HISTORY_DATE_FORMATTER)
}

private fun localDate(epochMs: Long): LocalDate? {
    if (epochMs <= 0) return null
    return Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()).toLocalDate()
}

private fun formatDuration(durationSec: Double): String {
    val total = durationSec.toLong().coerceAtLeast(0)
    val minutes = total / 60
    val seconds = total % 60
    return "%d:%02d".format(minutes, seconds)
}
