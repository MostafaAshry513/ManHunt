package com.manhunt.app.map

import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSizes
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import org.osmdroid.views.overlay.Polyline

/**
 * Dark-tile color filter. The raw matrix and its 0..255-scale contract live in
 * [DARK_TILE_MATRIX]; apply it through [ColorMatrixColorFilter] only.
 */
private val DarkTileFilter = ColorMatrixColorFilter(ColorMatrix(DARK_TILE_MATRIX))

private const val OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright"

@Composable
fun MatchMap(
    modifier: Modifier = Modifier,
    ownLocation: LatLng?,
    prey: List<PreyLocationStatus>,
    zone: ZoneDto?,
    showPrey: Boolean,
    trails: Map<String, List<TrailPoint>> = emptyMap(),
    onTap: (LatLng) -> Unit = {},
    showOwnMarker: Boolean = true,
    fallbackCenter: LatLng = LatLng(0.0, 0.0),
    fallbackZoom: Double = 16.0,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uriHandler = LocalUriHandler.current
    val density = LocalDensity.current
    var centered by remember { mutableStateOf(false) }

    // Theme-aware tiles: infer dark mode from the Material color scheme so callers do
    // not need to pass a flag (MatchMap's signature stays source-compatible).
    val darkTiles = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val zoneColor = MaterialTheme.colorScheme.primary.toArgb()
    val zoneFill = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f).toArgb()
    val trailColor = MaterialTheme.colorScheme.tertiary.toArgb()
    val strokePx = with(density) { 3.dp.toPx() }

    // Localized strings are read in composition and captured for the AndroidView update lambda.
    val taggedLabel = t("Tagged")
    val staleLabel = t("Stale report")
    val flaggedLabel = t("Unverified report")
    val liveLabel = t("Live report")
    val youLabel = t("You")
    val zoneLabel = t("Play zone")
    val mapLabel = t("Map")
    val zoomInLabel = t("Zoom in")
    val zoomOutLabel = t("Zoom out")
    val attribution = "© OpenStreetMap contributors"

    // Known trade-offs from the 0.8.1 review pass, deferred to a perf pass:
    // 1) This composable sits in the room screen's LazyColumn - scrolling it out of
    //    the viewport disposes the MapView (osmdroid destroys its tile providers)
    //    and scrolling back rebuilds it from scratch. Acceptable at the current
    //    list size; fix by hoisting the MapView lifetime above the list.
    // 2) update() below rebuilds every overlay on each recomposition/location tick.
    //    Cheap at current overlay counts; add a data-signature guard if trails grow.

    val mapView = remember {
        // The osmdroid User-Agent is set once in ManHuntApplication.onCreate.
        MapView(context).apply {
            // The Compose Box clips its corners, but the embedded View is drawn by
            // the interop pipeline - clip at the View level too so the round shape
            // is unconditional on every device.
            clipToOutline = true
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val radius = 20f * view.resources.displayMetrics.density
                    outline.setRoundRect(0, 0, view.width, view.height, radius)
                }
            }
            setTileSource(TileSourceFactory.MAPNIK)
            overlayManager.tilesOverlay.setColorFilter(if (darkTiles) DarkTileFilter else null)
            // The built-in +/- buttons are unthemed, draw above all overlays, and
            // consume the taps meant for MapEventsOverlay ("tap to move the zone").
            setBuiltInZoomControls(false)
            setMultiTouchControls(true)
            controller.setZoom(fallbackZoom)
            controller.setCenter(GeoPoint(fallbackCenter.lat, fallbackCenter.lng))
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        mapView.onResume()
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView.onPause()
            mapView.onDetach()
        }
    }

    // The tile colour filter is a once-per-theme-change concern: mutating the tile
    // overlay from inside AndroidView.update() on every recomposition invalidates the
    // tile provider in the middle of the frame (and in headless Robolectric it can
    // sample a frame where the map overlays have not been redrawn yet). Apply it here
    // only when the dark/light choice actually changes, then force a deterministic
    // redraw of the whole MapView.
    LaunchedEffect(darkTiles) {
        mapView.overlayManager.tilesOverlay.setColorFilter(if (darkTiles) DarkTileFilter else null)
        mapView.invalidate()
    }

    // Overlays are (re)built inside update(). Post an invalidate so a frame is
    // guaranteed after the map has been laid out and the tiles are ready, instead of
    // relying on an implicit redraw that may have already happened.
    LaunchedEffect(ownLocation, prey, zone, trails, showPrey, showOwnMarker) {
        mapView.post { mapView.invalidate() }
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(ManHuntRadius.lg))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .border(
                1.dp,
                MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
                RoundedCornerShape(ManHuntRadius.lg),
            )
            .semantics { contentDescription = mapLabel },
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { mapView },
            update = { view ->
                view.overlays.clear()
                view.overlays.add(
                    MapEventsOverlay(object : MapEventsReceiver {
                        override fun singleTapConfirmedHelper(p: GeoPoint): Boolean {
                            onTap(LatLng(p.latitude, p.longitude))
                            return true
                        }

                        override fun longPressHelper(p: GeoPoint): Boolean = false
                    }),
                )

                zone?.let { z ->
                    view.overlays.add(
                        Polygon(view).apply {
                            points = MapMath.circle(z)
                            outlinePaint.color = zoneColor
                            outlinePaint.strokeWidth = strokePx
                            fillPaint.color = zoneFill
                            title = zoneLabel
                        },
                    )
                }

                if (showPrey) {
                    // Trails connect real reported points; no interpolation across gaps.
                    trails.values.forEach { points ->
                        if (points.size >= 2) {
                            view.overlays.add(
                                Polyline(view).apply {
                                    setPoints(points.map { GeoPoint(it.lat, it.lng) })
                                    outlinePaint.color = trailColor
                                    outlinePaint.strokeWidth = strokePx
                                },
                            )
                        }
                    }

                    prey.filter { it.hasReport && it.lat != null && it.lng != null }.forEach { p ->
                        view.overlays.add(
                            Marker(view).apply {
                                position = GeoPoint(p.lat!!, p.lng!!)
                                title = p.username
                                snippet = when {
                                    p.eliminated -> taggedLabel
                                    p.stale -> staleLabel
                                    p.flagged -> flaggedLabel
                                    else -> liveLabel
                                }
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            },
                        )
                    }
                }

                if (showOwnMarker) {
                    ownLocation?.let { me ->
                        view.overlays.add(
                            Marker(view).apply {
                                position = GeoPoint(me.lat, me.lng)
                                title = youLabel
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            },
                        )
                    }
                }

                if (!centered) {
                    // Center on the first thing that will actually be drawn: own
                    // position, else a prey report ONLY when prey are visible on
                    // this map (centering on hidden prey would leak their location),
                    // else the zone centre, else the caller's fallback view.
                    val focus = ownLocation?.let { GeoPoint(it.lat, it.lng) }
                        ?: prey.firstOrNull {
                            showPrey && !it.stale && !it.eliminated && it.lat != null && it.lng != null
                        }?.let { GeoPoint(it.lat!!, it.lng!!) }
                        ?: zone?.let { GeoPoint(it.centerLat, it.centerLng) }
                    if (focus != null) {
                        view.controller.setCenter(focus)
                        view.controller.setZoom(17.0)
                        centered = true
                    } else {
                        view.controller.setCenter(GeoPoint(fallbackCenter.lat, fallbackCenter.lng))
                        view.controller.setZoom(fallbackZoom)
                        centered = true
                    }
                }

                // Invalidate twice: immediately, and once posted after the current layout
                // pass. The posted pass is what makes the overlay layer deterministic on a
                // freshly attached/laid-out MapView (headless renders and first frames).
                view.invalidate()
                view.post { view.invalidate() }
            },
        )

        // Accessibility/UX zoom controls: the built-in osmdroid buttons are unthemed,
        // so provide two 48 dp targets that follow the app theme.
        Column(
            modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MapControlButton(onClick = { mapView.controller.zoomIn() }, label = zoomInLabel) {
                Icon(Icons.Outlined.Add, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
            MapControlButton(onClick = { mapView.controller.zoomOut() }, label = zoomOutLabel) {
                Icon(Icons.Outlined.Remove, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
        }

        Surface(
            onClick = { uriHandler.openUri(OSM_COPYRIGHT_URL) },
            modifier = Modifier.align(Alignment.BottomEnd).padding(6.dp),
            shape = RoundedCornerShape(ManHuntRadius.xs),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
            contentColor = MaterialTheme.colorScheme.onSurface,
        ) {
            Text(
                attribution,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelSmall,
            )
        }
    }
}

@Composable
private fun MapControlButton(
    onClick: () -> Unit,
    label: String,
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(ManHuntRadius.sm),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        contentColor = MaterialTheme.colorScheme.primary,
        tonalElevation = 1.dp,
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(ManHuntSizes.touchTarget)
                .semantics { contentDescription = label },
        ) { content() }
    }
}
