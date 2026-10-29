package com.manhunt.app.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class LatLng(val lat: Double, val lng: Double)

/**
 * Latest device fix, published by TrackingService and read by the map.
 * Deliberately in-memory: positions are only live data, the server owns history.
 */
object LiveLocation {
    private val _current = MutableStateFlow<LatLng?>(null)
    val current: StateFlow<LatLng?> = _current.asStateFlow()

    fun update(point: LatLng) {
        _current.value = point
    }

    fun clear() {
        _current.value = null
    }
}
