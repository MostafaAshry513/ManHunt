package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.manhunt.app.data.InputRules
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.RoomState
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.i18n.t
import com.manhunt.app.location.DeviceLocation
import com.manhunt.app.map.MatchMap
import com.manhunt.app.ui.theme.ManHuntSpacing
import kotlinx.coroutines.launch
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
    var showZonePicker by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var locating by remember { mutableStateOf(false) }
    var locationError by remember { mutableStateOf<String?>(null) }

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
                    onValueChange = { headStart = InputRules.digits(it, 3) },
                    label = t("Prey head start (minutes)"),
                    keyboardType = KeyboardType.Number,
                )
                ManHuntTextField(
                    value = duration,
                    onValueChange = { duration = InputRules.digits(it, 3) },
                    label = t("Match duration (minutes)"),
                    keyboardType = KeyboardType.Number,
                )
                ManHuntTextField(
                    value = interval,
                    onValueChange = { interval = InputRules.digits(it, 3) },
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
                        onValueChange = { radius = InputRules.digits(it, 5) },
                        label = t("Zone radius (metres)"),
                        keyboardType = KeyboardType.Number,
                    )

                    // One-tap placement: ask for a real fix on demand. The old code read
                    // LiveLocation, which is only populated by the tracking service during a
                    // match, so this button was dead in the lobby.
                    SecondaryButton(
                        text = if (locating) t("Locating…") else t("Use my location"),
                        onClick = {
                            if (!locating) {
                                locating = true
                                locationError = null
                                scope.launch {
                                    val fix = DeviceLocation.current(context)
                                    locating = false
                                    if (fix != null) {
                                        applyCenter(fix.lat, fix.lng)
                                    } else {
                                        locationError = if (!DeviceLocation.hasPermission(context)) {
                                            "Allow location access to use your position"
                                        } else {
                                            "Could not get your location. Check location services."
                                        }
                                    }
                                }
                            }
                        },
                        enabled = !locating,
                        modifier = Modifier.testTag("zone_use_location"),
                    )
                    locationError?.let {
                        Text(
                            t(it),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }

                    // Zone placement opens a dedicated, non-scrolling full-screen map:
                    // panning a map inside this dialog's scroll column is unusable because
                    // the column's vertical drag detector steals the gesture.
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            t(
                                if (centerLat != null && centerLng != null) "Zone centre set"
                                else "Zone centre not set"
                            ),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                        )
                        TextButton(
                            onClick = { showZonePicker = true },
                            modifier = Modifier.testTag("zone_pick"),
                        ) { Text(t("Pick on map")) }
                    }

                    SectionLabel(t("Zone centre"))
                    Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
                        ManHuntTextField(
                            value = latText,
                            onValueChange = { raw ->
                                latText = InputRules.coordinate(raw)
                                latText.toDoubleOrNull()?.let { centerLat = it }
                            },
                            label = t("Latitude"),
                            keyboardType = KeyboardType.Number,
                            modifier = Modifier.weight(1f),
                        )
                        ManHuntTextField(
                            value = lngText,
                            onValueChange = { raw ->
                                lngText = InputRules.coordinate(raw)
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
                                onValueChange = { shrinkInterval = InputRules.digits(it, 3) },
                                label = t("Every (min)"),
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f),
                            )
                            ManHuntTextField(
                                value = shrinkStep,
                                onValueChange = { shrinkStep = InputRules.digits(it, 4) },
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
                val headStartMin = headStart.toIntOrNull()
                val durationMin = duration.toIntOrNull()
                val intervalMin = interval.toIntOrNull()
                if (headStartMin == null || durationMin == null || intervalMin == null ||
                    headStartMin < 0 || durationMin !in 1..999 || intervalMin !in 1..999
                ) {
                    error = "Enter whole numbers for the timing fields"
                    return@TextButton
                }

                var zoneLat = centerLat
                var zoneLng = centerLng
                val radiusM = radius.toIntOrNull()
                val shrinkMin = shrinkInterval.toIntOrNull()
                val shrinkStepM = shrinkStep.toIntOrNull()
                if (mode == "zone") {
                    val lat = latText.toDoubleOrNull()
                    val lng = lngText.toDoubleOrNull()
                    if (lat == null || lng == null || lat !in -90.0..90.0 || lng !in -180.0..180.0) {
                        error = "Enter a valid latitude and longitude"
                        return@TextButton
                    }
                    if (radiusM == null || radiusM <= 0) {
                        error = "Enter a valid zone radius in metres"
                        return@TextButton
                    }
                    if (shrink && (shrinkMin == null || shrinkMin <= 0 || shrinkStepM == null || shrinkStepM <= 0)) {
                        error = "Enter valid shrink values"
                        return@TextButton
                    }
                    zoneLat = lat
                    zoneLng = lng
                }

                val payload = buildJsonObject {
                    put("headStartSec", headStartMin * 60)
                    put("durationSec", durationMin * 60)
                    put("locationIntervalSec", intervalMin * 60)
                    put("trailsEnabled", trails)
                    put("mode", mode)
                    if (mode == "zone") {
                        putJsonObject("zone") {
                            put("centerLat", zoneLat!!)
                            put("centerLng", zoneLng!!)
                            put("radiusM", radiusM!!.toDouble())
                        }
                        putJsonObject("shrink") {
                            put("enabled", shrink)
                            put("intervalSec", (shrinkMin ?: 0) * 60)
                            put("stepM", (shrinkStepM ?: 0).toDouble())
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

    if (showZonePicker) {
        ZonePickerDialog(
            initialCenter = if (centerLat != null && centerLng != null) {
                LatLng(centerLat!!, centerLng!!)
            } else {
                currentLocation
            },
            radiusM = radius.toDoubleOrNull() ?: (settings.zone?.radiusM ?: 800.0),
            onPicked = { picked ->
                applyCenter(picked.lat, picked.lng)
                showZonePicker = false
            },
            onDismiss = { showZonePicker = false },
        )
    }
}

/**
 * Full-screen, non-scrolling zone placement map. Kept out of the settings dialog's
 * scroll column so osmdroid owns all drag gestures (all directions).
 */
@Composable
private fun ZonePickerDialog(
    initialCenter: LatLng?,
    radiusM: Double,
    onPicked: (LatLng) -> Unit,
    onDismiss: () -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.fillMaxSize().safeDrawingPadding().padding(ManHuntSpacing.md)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        t("Tap the map to place the zone centre"),
                        style = MaterialTheme.typography.titleSmall,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = onDismiss) { Text(t("Close")) }
                }
                MatchMap(
                    modifier = Modifier.fillMaxWidth().weight(1f).testTag("zone_picker_map"),
                    ownLocation = initialCenter,
                    prey = emptyList(),
                    zone = initialCenter?.let {
                        ZoneDto(centerLat = it.lat, centerLng = it.lng, radiusM = radiusM)
                    },
                    showPrey = false,
                    showOwnMarker = false,
                    onTap = onPicked,
                    fallbackCenter = initialCenter ?: LatLng(0.0, 0.0),
                    fallbackZoom = if (initialCenter != null) 15.0 else 2.0,
                )
                Text(
                    t("Drag to move the map, tap to set the centre"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private fun formatCoordinate(value: Double): String =
    String.format(java.util.Locale.ROOT, "%.5f", value)

