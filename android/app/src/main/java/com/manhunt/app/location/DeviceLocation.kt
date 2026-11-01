package com.manhunt.app.location

import android.Manifest
import android.annotation.SuppressLint
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
 *
 * Callers that must reflect the player's current position (repeated "use my location"
 * presses) pass [current]'s `forceFresh = true`: live GPS/network updates are requested
 * on every call and the cached fix is only the timeout fallback.
 */
object DeviceLocation {

    private const val FRESH_FIX_MS = 5 * 60_000L
    private const val FIX_TIMEOUT_MS = 10_000L

    fun hasPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    @SuppressLint("MissingPermission") // hasPermission() is checked above.
    suspend fun current(context: Context, forceFresh: Boolean = false): LatLng? = withContext(Dispatchers.IO) {
        if (!hasPermission(context)) return@withContext null
        val manager = context.getSystemService(LocationManager::class.java) ?: return@withContext null
        val cached = lastKnown(manager)

        // Fast path for callers that only need "some recent position" (dialog seeding).
        // forceFresh callers skip it on purpose: a player pressing "use my location" again
        // while moving must get a NEW fix, not a cached one from the last few minutes.
        if (!forceFresh && cached != null && System.currentTimeMillis() - cached.time <= FRESH_FIX_MS) {
            return@withContext LatLng(cached.latitude, cached.longitude)
        }

        // Ask for a live fix first; the cached fix is only a timeout fallback. awaitFix()
        // unregisters its listener on first fix AND on cancellation (timeout/dialog close),
        // so repeated presses cannot leak listeners.
        val fresh = withTimeoutOrNull(FIX_TIMEOUT_MS) { awaitFix(manager) }
        fresh ?: cached?.let { LatLng(it.latitude, it.longitude) }
    }

    /** Freshest of the cached fixes, whatever its age; null when none exists. */
    @SuppressLint("MissingPermission") // Only called from current() after the permission check.
    private fun lastKnown(manager: LocationManager): Location? =
        listOf(
            LocationManager.GPS_PROVIDER,
            LocationManager.NETWORK_PROVIDER,
            LocationManager.PASSIVE_PROVIDER,
        ).mapNotNull { provider ->
            runCatching { manager.getLastKnownLocation(provider) }.getOrNull()
        }.maxByOrNull { it.time }

    @SuppressLint("MissingPermission") // Only called from current() after the permission check.
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
