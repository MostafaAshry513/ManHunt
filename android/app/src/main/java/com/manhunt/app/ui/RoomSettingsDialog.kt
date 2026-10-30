package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
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
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.RoomState
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.i18n.t
import com.manhunt.app.map.MatchMap
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntSpacing
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
    var latText by remember {
        mutableStateOf((settings.zone?.centerLat ?: currentLocation?.lat)?.let { formatCoordinate(it) }.orEmpty())
    }
    var lngText by remember {
        mutableStateOf((settings.zone?.centerLng ?: currentLocation?.lng)?.let { formatCoordinate(it) }.orEmpty())
    }
    var shrink by remember { mutableStateOf(settings.shrink.enabled) }
    var shrinkInterval by remember { mutableStateOf((settings.shrink.intervalSec / 60).toString()) }
    var shrinkStep by remember { mutableStateOf(settings.shrink.stepM.toInt().toString()) }
    var error by remember { mutableStateOf<String?>(null) }

    fun applyCenter(lat: Double, lng: Double) {
        centerLat = lat
        centerLng = lng
        latText = formatCoordinate(lat)
        lngText = formatCoordinate(lng)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(t("Hunt rules")) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 480.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm),
            ) {
                Text(
                    t("Applies to the next match. Rules are enforced by the server."),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                SectionLabel(t("Timing"))
                ManHuntTextField(
                    value = headStart,
                    onValueChange = { headStart = it.filter(Char::isDigit) },
                    label = t("Prey head start (minutes)"),
                    keyboardType = KeyboardType.Number,
                )
                ManHuntTextField(
                    value = duration,
                    onValueChange = { duration = it.filter(Char::isDigit) },
                    label = t("Match duration (minutes)"),
                    keyboardType = KeyboardType.Number,
                )
                ManHuntTextField(
                    value = interval,
                    onValueChange = { interval = it.filter(Char::isDigit) },
                    label = t("Location report interval (minutes)"),
                    keyboardType = KeyboardType.Number,
                )

                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(t("Hunters can see trails"), Modifier.weight(1f))
                    Switch(checked = trails, onCheckedChange = { trails = it })
                }

                SectionLabel(t("Play area"))
                Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
                    FilterChip(selected = mode == "open", onClick = { mode = "open" }, label = { Text(t("Open")) })
                    FilterChip(selected = mode == "zone", onClick = { mode = "zone" }, label = { Text(t("Zone")) })
                }

                if (mode == "zone") {
                    ManHuntTextField(
                        value = radius,
                        onValueChange = { radius = it.filter(Char::isDigit) },
                        label = t("Zone radius (metres)"),
                        keyboardType = KeyboardType.Number,
                    )

                    // The map is the primary placement surface and must be visible even
                    // before a centre exists (otherwise zone mode is unusable on a new room).
                    val center = if (centerLat != null && centerLng != null) {
                        LatLng(centerLat!!, centerLng!!)
                    } else {
                        null
                    }
                    val fallback = center ?: currentLocation ?: LatLng(0.0, 0.0)
                    MatchMap(
                        modifier = Modifier.fillMaxWidth().height(ManHuntSizes.mapHeight),
                        ownLocation = center,
                        prey = emptyList(),
                        zone = center?.let {
                            ZoneDto(
                                centerLat = it.lat,
                                centerLng = it.lng,
                                radiusM = radius.toDoubleOrNull() ?: (settings.zone?.radiusM ?: 800.0),
                            )
                        },
                        showPrey = false,
                        // ownLocation is the zone centre candidate here - focus
                        // without drawing a "You" marker on top of it.
                        showOwnMarker = false,
                        onTap = { applyCenter(it.lat, it.lng) },
                        fallbackCenter = fallback,
                        fallbackZoom = if (center != null || currentLocation != null) 15.0 else 2.0,
                    )
                    Text(
                        t("Tap the map to move the zone centre"),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    SectionLabel(t("Zone centre"))
                    Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
                        ManHuntTextField(
                            value = latText,
                            onValueChange = { raw ->
                                latText = raw
                                latText.toDoubleOrNull()?.let { centerLat = it }
                            },
                            label = t("Latitude"),
                            keyboardType = KeyboardType.Number,
                            modifier = Modifier.weight(1f),
                        )
                        ManHuntTextField(
                            value = lngText,
                            onValueChange = { raw ->
                                lngText = raw
                                lngText.toDoubleOrNull()?.let { centerLng = it }
                            },
                            label = t("Longitude"),
                            keyboardType = KeyboardType.Number,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Text(
                        t("Enter coordinates manually"),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(t("Shrink over time"), Modifier.weight(1f))
                        Switch(checked = shrink, onCheckedChange = { shrink = it })
                    }
                    if (shrink) {
                        Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
                            ManHuntTextField(
                                value = shrinkInterval,
                                onValueChange = { shrinkInterval = it.filter(Char::isDigit) },
                                label = t("Every (min)"),
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f),
                            )
                            ManHuntTextField(
                                value = shrinkStep,
                                onValueChange = { shrinkStep = it.filter(Char::isDigit) },
                                label = t("By (m)"),
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                error?.let {
                    Text(
                        t(it),
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Spacer(Modifier.height(ManHuntSpacing.xs))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                // A cleared field keeps the room's current value - silently inserting
                // hidden defaults was surprising; the server re-validates everything.
                val headStartSec = (headStart.toIntOrNull() ?: (settings.headStartSec / 60)) * 60
                val durationSec = (duration.toIntOrNull() ?: (settings.durationSec / 60)) * 60
                val intervalSec = (interval.toIntOrNull() ?: (settings.locationIntervalSec / 60)) * 60

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
                            put("radiusM", radius.toDoubleOrNull() ?: (settings.zone?.radiusM ?: 800.0))
                        }
                        putJsonObject("shrink") {
                            put("enabled", shrink)
                            put("intervalSec", (shrinkInterval.toIntOrNull() ?: (settings.shrink.intervalSec / 60)) * 60)
                            put("stepM", shrinkStep.toDoubleOrNull() ?: settings.shrink.stepM)
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

private fun formatCoordinate(value: Double): String =
    String.format(java.util.Locale.ROOT, "%.5f", value)
