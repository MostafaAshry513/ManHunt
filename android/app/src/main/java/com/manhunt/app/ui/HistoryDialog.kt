package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.History
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.manhunt.app.data.MatchHistoryEntry
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSpacing
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun HistoryDialog(
    matches: List<MatchHistoryEntry>,
    loading: Boolean = false,
    /** Non-null when loading the history failed; shown instead of the empty state. */
    error: String? = null,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.History,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.width(ManHuntSpacing.sm))
                Text(t("Hunt history"))
            }
        },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 420.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm),
            ) {
                when {
                    loading -> Row(verticalAlignment = Alignment.CenterVertically) {
                        ManHuntLoader(size = 20.dp)
                        Spacer(Modifier.width(ManHuntSpacing.sm))
                        Text(t("Loading match history..."), style = MaterialTheme.typography.bodySmall)
                    }
                    // A failed load must not masquerade as "No hunts in this room yet.".
                    error != null -> ErrorBanner(error)
                    matches.isEmpty() -> EmptyState(
                        icon = Icons.Outlined.History,
                        title = t("No hunts in this room yet."),
                        message = t("Hunts appear here once they finish."),
                    )
                    else -> matches.forEach { match -> HistoryEntryCard(match) }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text(t("Close")) } },
    )
}

@Composable
private fun HistoryEntryCard(match: MatchHistoryEntry) {
    val result = when {
        match.cancelled -> t("Hunt cancelled")
        match.winner == Teams.HUNTERS -> t("Hunters won")
        match.winner == Teams.PREY -> t("Prey won")
        else -> t("In progress")
    }
    val accent = when {
        match.cancelled -> MaterialTheme.colorScheme.onSurfaceVariant
        match.winner == Teams.HUNTERS -> MaterialTheme.colorScheme.secondary
        match.winner == Teams.PREY -> MaterialTheme.colorScheme.tertiary
        else -> MaterialTheme.colorScheme.primary
    }
    Surface(
        shape = RoundedCornerShape(ManHuntRadius.md),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(ManHuntSpacing.md),
            verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.xs),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .background(accent, RoundedCornerShape(ManHuntRadius.pill))
                        .padding(horizontal = ManHuntSpacing.sm, vertical = 2.dp),
                ) {
                    Text(
                        result,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.surface,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
            Text(
                buildString {
                    append(formatTime(match.startedAt))
                    match.durationSec?.let {
                        val mins = (it / 60).toInt()
                        append("  -  $mins ${t("min")}")
                    }
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (match.prey.isNotEmpty()) {
                Text(
                    "${t("Prey:")} ${match.prey.joinToString(", ")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (match.hunters.isNotEmpty()) {
                Text(
                    "${t("Hunters:")} ${match.hunters.joinToString(", ")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private val HISTORY_TIME_FORMATTER =
    DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.getDefault())

private fun formatTime(epochMs: Long): String {
    if (epochMs <= 0) return "-"
    return Instant.ofEpochMilli(epochMs)
        .atZone(ZoneId.systemDefault())
        .format(HISTORY_TIME_FORMATTER)
}
