package com.manhunt.app.map

import androidx.compose.foundation.background
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

@Composable
fun MatchMap(
    modifier: Modifier = Modifier,
    ownLocation: LatLng?,
    prey: List<PreyLocationStatus>,
    zone: ZoneDto?,
    showPrey: Boolean,
    trails: Map<String, List<TrailPoint>> = emptyMap(),
    onTap: (LatLng) -> Unit = {},
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var centered by remember { mutableStateOf(false) }

    val mapView = remember {
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
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
            .background(MaterialTheme.colorScheme.surfaceVariant),
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

                ownLocation?.let { me ->
                    view.overlays.add(
                        Marker(view).apply {
                            position = GeoPoint(me.lat, me.lng)
                            title = "You"
                            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                        },
                    )
                }

                if (!centered) {
                    val focus = ownLocation?.let { GeoPoint(it.lat, it.lng) }
                        ?: prey.firstOrNull { it.lat != null && it.lng != null }
                            ?.let { GeoPoint(it.lat!!, it.lng!!) }
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
