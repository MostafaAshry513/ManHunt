package com.manhunt.app.map

import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.data.ZoneDto
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
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var centered by remember { mutableStateOf(false) }

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
            // the interop pipeline — clip at the View level too so the round shape
            // is unconditional on every device.
            clipToOutline = true
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val radius = 20f * view.resources.displayMetrics.density
                    outline.setRoundRect(0, 0, view.width, view.height, radius)
                }
            }
            setTileSource(TileSourceFactory.MAPNIK)
            overlayManager.tilesOverlay.setColorFilter(DarkTileFilter)
            // The built-in +/− buttons are unthemed, draw above all overlays, and
            // consume the taps meant for MapEventsOverlay ("tap to move the zone").
            setBuiltInZoomControls(false)
            setMultiTouchControls(true)
            controller.setZoom(16.0)
            controller.setCenter(GeoPoint(0.0, 0.0))
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
            mapView.onDetach()
        }
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .border(
                1.dp,
                MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
                RoundedCornerShape(20.dp),
            ),
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
                            outlinePaint.color = 0xFF22D3EE.toInt()
                            outlinePaint.strokeWidth = 6f
                            fillPaint.color = 0x2222D3EE
                            title = "Play zone"
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
                                    outlinePaint.color = 0xFFFF7A59.toInt()
                                    outlinePaint.strokeWidth = 6f
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
                                    p.eliminated -> "Tagged"
                                    p.stale -> "Stale report"
                                    p.flagged -> "Unverified report"
                                    else -> "Live report"
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
                                title = "You"
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            },
                        )
                    }
                }

                if (!centered) {
                    // Center on the first thing that will actually be drawn: own
                    // position, else a prey report ONLY when prey are visible on
                    // this map (centering on hidden prey would leak their location),
                    // else the zone centre.
                    val focus = ownLocation?.let { GeoPoint(it.lat, it.lng) }
                        ?: prey.firstOrNull {
                            showPrey && !it.stale && !it.eliminated && it.lat != null && it.lng != null
                        }?.let { GeoPoint(it.lat!!, it.lng!!) }
                        ?: zone?.let { GeoPoint(it.centerLat, it.centerLng) }
                    if (focus != null) {
                        view.controller.setCenter(focus)
                        view.controller.setZoom(17.0)
                        centered = true
                    }
                }

                view.invalidate()
            },
        )

        Text(
            "© OpenStreetMap contributors",
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(6.dp)
                .background(Color(0xAA0B1220), RoundedCornerShape(6.dp))
                .padding(horizontal = 6.dp, vertical = 3.dp),
            color = Color(0xFFE6EDF7),
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
