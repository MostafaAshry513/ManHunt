package com.manhunt.app

import com.manhunt.app.data.ZoneDto
import com.manhunt.app.map.MapMath
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MapMathTest {

    /** Distance in metres between two GeoPoints (haversine). */
    private fun distance(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
        val r = 6_371_008.8
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        return 2 * r * Math.asin(Math.min(1.0, Math.sqrt(a)))
    }

    @Test
    fun destinationStaysOnRequestedRadius() {
        val point = MapMath.destination(51.5, -0.12, Math.PI / 2, 500.0)
        val d = distance(51.5, -0.12, point.latitude, point.longitude)
        assertTrue("distance was $d", Math.abs(d - 500.0) < 2.0)
    }

    @Test
    fun circleHasRequestedSegmentsAndRadius() {
        val zone = ZoneDto(centerLat = 51.5, centerLng = -0.12, radiusM = 300.0)
        val points = MapMath.circle(zone, segments = 36)
        assertEquals(36, points.size)
        points.forEach { p ->
            val d = distance(zone.centerLat, zone.centerLng, p.latitude, p.longitude)
            assertTrue("point off radius: $d", Math.abs(d - 300.0) < 2.0)
        }
    }
}
