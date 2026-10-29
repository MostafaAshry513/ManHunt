package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.manhunt.app.i18n.t
import com.manhunt.app.data.MatchHistoryEntry
import com.manhunt.app.data.Teams
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun HistoryDialog(
    matches: List<MatchHistoryEntry>,
    loading: Boolean = false,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(t("Match history")) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 420.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (loading) {
                    Text(t("Loading match history..."), style = MaterialTheme.typography.bodySmall)
                } else if (matches.isEmpty()) {
                    Text(t("No matches played in this room yet."), style = MaterialTheme.typography.bodySmall)
                }
                if (!loading) matches.forEach { match ->
                    val title = when {
                        match.cancelled -> "Cancelled"
                        match.winner == Teams.HUNTERS -> "Hunters won"
                        match.winner == Teams.PREY -> "Prey won"
                        else -> "In progress"
                    }
                    Text(title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                    Text(
                        buildString {
                            append(formatTime(match.startedAt))
                            match.durationSec?.let {
                                val mins = (it / 60).toInt()
                                append("  ·  ${mins} min")
                            }
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (match.prey.isNotEmpty() || match.hunters.isNotEmpty()) {
                        Text(
                            "Prey: ${match.prey.joinToString(", ").ifBlank { "-" }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            "Hunters: ${match.hunters.joinToString(", ").ifBlank { "-" }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    HorizontalDivider(Modifier.fillMaxWidth())
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text(t("Close")) } },
    )
}

private fun formatTime(epochMs: Long): String {
    if (epochMs <= 0) return "-"
    return Instant.ofEpochMilli(epochMs)
        .atZone(ZoneId.systemDefault())
        .format(DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.getDefault()))
}
