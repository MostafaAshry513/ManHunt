package com.manhunt.app.location

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.annotation.RequiresPermission
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.manhunt.app.Graph
import com.manhunt.app.R
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.LiveLocation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Foreground location service for prey during an active match.
 *
 * A visible, ongoing notification is mandatory and intentional: the game never hides
 * tracking from the player. Updates are best-effort - Android may throttle them.
 */
class TrackingService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var matchId: String? = null
    private var intervalMs: Long = DEFAULT_INTERVAL_SEC * 1000L

    private val listener = LocationListener { location -> onFix(location) }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val id = intent?.getStringExtra(EXTRA_MATCH_ID)
        if (id.isNullOrBlank()) {
            stopSelf()
            return START_NOT_STICKY
        }

        matchId = id
        intervalMs = intent.getIntExtra(EXTRA_INTERVAL_SEC, DEFAULT_INTERVAL_SEC)
            .coerceAtLeast(30)
            .toLong() * 1000L

        createChannel()
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            } else {
                0
            },
        )

        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
        if (fine != PackageManager.PERMISSION_GRANTED && coarse != PackageManager.PERMISSION_GRANTED) {
            stopSelf()
            return START_NOT_STICKY
        }

        startUpdates()
        return START_NOT_STICKY
    }

    @RequiresPermission(anyOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    private fun startUpdates() {
        val manager = getSystemService(LocationManager::class.java)
        if (manager == null) {
            stopSelf()
            return
        }
        // GPS first, network as a fallback for poor sky visibility. Both calls are also
        // guarded: a permission can be revoked between the check and the call.
        runCatching {
            manager.requestLocationUpdates(LocationManager.GPS_PROVIDER, intervalMs, 0f, listener, Looper.getMainLooper())
        }
        runCatching {
            manager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, intervalMs, 0f, listener, Looper.getMainLooper())
        }
        // Seed the map with the last known fix instead of waiting a full interval.
        runCatching {
            manager.getLastKnownLocation(LocationManager.GPS_PROVIDER)?.let { onFix(it) }
        }
    }

    private fun onFix(location: Location) {
        LiveLocation.update(LatLng(location.latitude, location.longitude))
        val id = matchId ?: return
        val accuracy = if (location.hasAccuracy()) location.accuracy else null
        scope.launch {
            runCatching {
                Graph.container.repository.reportLocation(
                    matchId = id,
                    lat = location.latitude,
                    lng = location.longitude,
                    accuracy = accuracy,
                    recordedAt = location.time,
                )
            }
        }
    }

    private fun createChannel() {
        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Match tracking", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Shown while your position is shared during a match"
                    setShowBadge(false)
                },
            )
        }
    }

    private fun buildNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_menu_mylocation)
        .setContentTitle("ManHunt is tracking you")
        .setContentText("Hunters receive your position every ${intervalMs / 1000 / 60} min")
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()

    override fun onDestroy() {
        runCatching {
            getSystemService(LocationManager::class.java)?.removeUpdates(listener)
        }
        scope.cancel()
        LiveLocation.clear()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_MATCH_ID = "match_id"
        const val EXTRA_INTERVAL_SEC = "interval_sec"
        private const val CHANNEL_ID = "match_tracking"
        private const val NOTIFICATION_ID = 4101
        private const val DEFAULT_INTERVAL_SEC = 300

        fun start(context: Context, matchId: String, intervalSec: Int) {
            val intent = Intent(context, TrackingService::class.java)
                .putExtra(EXTRA_MATCH_ID, matchId)
                .putExtra(EXTRA_INTERVAL_SEC, intervalSec)
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, TrackingService::class.java))
        }
    }
}
