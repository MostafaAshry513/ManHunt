package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.manhunt.app.i18n.t

/**
 * First-run notice. Two things must be explicit before anyone plays:
 * how location is shared, and the physical-world safety rules.
 */
@Composable
fun SafetyScreen(onAccept: () -> Unit) {
    Surface(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(t("Before you play"), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
            Text(
                "ManHunt is a real-world game. Read this once.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(4.dp))
            SectionLabel(t("Your location"))
            Text(
                "While you are on the Prey team in an active match, your phone sends its position " +
                    "to the server at the interval the room admin set (5 minutes by default). " +
                    "Only players on the Hunters team can see it, and only during the hunting phase. " +
                    "A permanent notification is shown while tracking is active. Tracking stops when " +
                    "the match ends.",
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(
                "Precise reports are kept for 30 days by default and then deleted. Match summaries " +
                    "are kept without byte-level GPS trails.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(4.dp))
            SectionLabel(t("Stay safe"))
            Text(
                "• Respect property and local law. Never trespass.\n" +
                    "• Stay out of roads, traffic and hazardous ground.\n" +
                    "• Never run while looking at your phone.\n" +
                    "• Stop immediately if conditions or people make it unsafe.\n" +
                    "• Respect people who are not playing.",
                style = MaterialTheme.typography.bodyMedium,
            )

            Spacer(Modifier.height(4.dp))
            SectionLabel(t("Not a safety service"))
            Text(
                "ManHunt is a game. It is not an emergency, rescue or child-tracking service, and " +
                    "GPS can be inaccurate, delayed or missing. Do not rely on it to find a person in danger.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onAccept,
                modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp),
            ) {
                Text(t("I understand and I'll play safely"))
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}
