package com.manhunt.app.map

import com.manhunt.app.data.ZoneDto
import org.osmdroid.util.GeoPoint
import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

/** Small geodesy helpers for drawing zones. Mirrors the server-side math. */
object MapMath {
    private const val EARTH_RADIUS_M = 6_371_008.8

    fun destination(lat: Double, lng: Double, bearingRad: Double, distanceM: Double): GeoPoint {
        val d = distanceM / EARTH_RADIUS_M
        val lat1 = lat * PI / 180
        val lng1 = lng * PI / 180

        val lat2 = asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(bearingRad))
        val lng2 = lng1 + atan2(
            sin(bearingRad) * sin(d) * cos(lat1),
            cos(d) - sin(lat1) * sin(lat2),
        )
        return GeoPoint(lat2 * 180 / PI, ((lng2 * 180 / PI + 540) % 360) - 180)
    }

    fun circle(zone: ZoneDto, segments: Int = 72): List<GeoPoint> =
        (0 until segments).map { i ->
            destination(zone.centerLat, zone.centerLng, (i.toDouble() / segments) * 2 * PI, zone.radiusM)
        }
}
