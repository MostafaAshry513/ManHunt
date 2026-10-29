package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.manhunt.app.i18n.t
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.map.MatchMap
import com.manhunt.app.i18n.t
import com.manhunt.app.data.RoomState
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject

/**
 * Admin-only match settings. Values are validated again on the server; this dialog only
 * provides a sane editing surface and never decides game rules.
 */
@Composable
fun RoomSettingsDialog(
    state: RoomState,
    currentLocation: LatLng?,
    onSave: (JsonObject) -> Unit,
    onDismiss: () -> Unit,
) {
    val settings = state.room.settings

    var headStart by remember { mutableStateOf((settings.headStartSec / 60).toString()) }
    var duration by remember { mutableStateOf((settings.durationSec / 60).toString()) }
    var interval by remember { mutableStateOf((settings.locationIntervalSec / 60).toString()) }
    var trails by remember { mutableStateOf(settings.trailsEnabled) }
    var mode by remember { mutableStateOf(settings.mode) }
    var radius by remember { mutableStateOf((settings.zone?.radiusM ?: 800.0).toInt().toString()) }
    var centerLat by remember { mutableStateOf(settings.zone?.centerLat ?: currentLocation?.lat) }
    var centerLng by remember { mutableStateOf(settings.zone?.centerLng ?: currentLocation?.lng) }
    var shrink by remember { mutableStateOf(settings.shrink.enabled) }
    var shrinkInterval by remember { mutableStateOf((settings.shrink.intervalSec / 60).toString()) }
    var shrinkStep by remember { mutableStateOf(settings.shrink.stepM.toInt().toString()) }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(t("Match settings")) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 460.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(t("Applies to the next match. Rules are enforced by the server."), style = MaterialTheme.typography.bodySmall)

                OutlinedTextField(
                    value = headStart,
                    onValueChange = { headStart = it.filter(Char::isDigit) },
                    label = { Text(t("Prey head start (minutes)")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it.filter(Char::isDigit) },
                    label = { Text(t("Match duration (minutes)")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = interval,
                    onValueChange = { interval = it.filter(Char::isDigit) },
                    label = { Text(t("Location report interval (minutes)")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(t("Hunters can see trails"), Modifier.weight(1f))
                    Switch(checked = trails, onCheckedChange = { trails = it })
                }

                Text(t("Play area"), style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = mode == "open", onClick = { mode = "open" }, label = { Text(t("Open")) })
                    FilterChip(selected = mode == "zone", onClick = { mode = "zone" }, label = { Text(t("Zone")) })
                }

                if (mode == "zone") {
                    OutlinedTextField(
                        value = radius,
                        onValueChange = { radius = it.filter(Char::isDigit) },
                        label = { Text(t("Zone radius (metres)")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (centerLat != null && centerLng != null) {
                        MatchMap(
                            modifier = Modifier.fillMaxWidth().height(200.dp),
                            ownLocation = LatLng(centerLat!!, centerLng!!),
                            prey = emptyList(),
                            zone = ZoneDto(
                                centerLat = centerLat!!,
                                centerLng = centerLng!!,
                                radiusM = radius.toDoubleOrNull() ?: 800.0,
                            ),
                            showPrey = false,
                            onTap = {
                                centerLat = it.lat
                                centerLng = it.lng
                            },
                        )
                        Text(
                            "Tap the map to move the zone centre",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    } else {
                        Text(
                            "Enable GPS or tap the map to place the zone",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(t("Shrink over time"), Modifier.weight(1f))
                        Switch(checked = shrink, onCheckedChange = { shrink = it })
                    }
                    if (shrink) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = shrinkInterval,
                                onValueChange = { shrinkInterval = it.filter(Char::isDigit) },
                                label = { Text(t("Every (min)")) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                            )
                            OutlinedTextField(
                                value = shrinkStep,
                                onValueChange = { shrinkStep = it.filter(Char::isDigit) },
                                label = { Text(t("By (m)")) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val headStartSec = (headStart.toIntOrNull() ?: 5) * 60
                val durationSec = (duration.toIntOrNull() ?: 60) * 60
                val intervalSec = (interval.toIntOrNull() ?: 5) * 60

                if (mode == "zone" && (centerLat == null || centerLng == null)) {
                    error = "Place the zone centre on the map first"
                    return@TextButton
                }

                val payload = buildJsonObject {
                    put("headStartSec", headStartSec)
                    put("durationSec", durationSec)
                    put("locationIntervalSec", intervalSec)
                    put("trailsEnabled", trails)
                    put("mode", mode)
                    if (mode == "zone") {
                        putJsonObject("zone") {
                            put("centerLat", centerLat!!)
                            put("centerLng", centerLng!!)
                            put("radiusM", (radius.toDoubleOrNull() ?: 800.0))
                        }
                        putJsonObject("shrink") {
                            put("enabled", shrink)
                            put("intervalSec", (shrinkInterval.toIntOrNull() ?: 2) * 60)
                            put("stepM", shrinkStep.toDoubleOrNull() ?: 25.0)
                            put("minRadiusM", settings.shrink.minRadiusM)
                            put("warningSec", settings.shrink.warningSec)
                        }
                    }
                }
                onSave(payload)
            }) { Text(t("Save")) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(t("Cancel")) } },
    )
}
