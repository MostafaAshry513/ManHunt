package com.manhunt.app.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.manhunt.app.data.LatLng
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/**
 * One-shot location lookup for actions that are not in a tracking match (e.g. placing a
 * zone centre from the room settings dialog). Falls back to the freshest cached fix if
 * the device cannot produce a live one.
 */
object DeviceLocation {

    private const val FRESH_FIX_MS = 5 * 60_000L
    private const val FIX_TIMEOUT_MS = 10_000L

    fun hasPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    suspend fun current(context: Context): LatLng? = withContext(Dispatchers.IO) {
        if (!hasPermission(context)) return@withContext null
        val manager = context.getSystemService(LocationManager::class.java) ?: return@withContext null

        val cached = listOf(
            LocationManager.GPS_PROVIDER,
            LocationManager.NETWORK_PROVIDER,
            LocationManager.PASSIVE_PROVIDER,
        ).mapNotNull { provider ->
            runCatching { manager.getLastKnownLocation(provider) }.getOrNull()
        }.maxByOrNull { it.time }

        if (cached != null && System.currentTimeMillis() - cached.time <= FRESH_FIX_MS) {
            return@withContext LatLng(cached.latitude, cached.longitude)
        }

        val fresh = withTimeoutOrNull(FIX_TIMEOUT_MS) { awaitFix(manager) }
        fresh ?: cached?.let { LatLng(it.latitude, it.longitude) }
    }

    private suspend fun awaitFix(manager: LocationManager): LatLng? =
        suspendCancellableCoroutine { continuation ->
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
                .filter { provider -> runCatching { manager.isProviderEnabled(provider) }.getOrDefault(false) }
            if (providers.isEmpty()) {
                continuation.resume(null)
                return@suspendCancellableCoroutine
            }
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    manager.removeUpdates(this)
                    if (continuation.isActive) continuation.resume(LatLng(location.latitude, location.longitude))
                }

                override fun onProviderEnabled(provider: String) = Unit
                override fun onProviderDisabled(provider: String) = Unit
                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
            }
            providers.forEach { provider ->
                manager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
            }
            continuation.invokeOnCancellation { manager.removeUpdates(listener) }
        }
}
