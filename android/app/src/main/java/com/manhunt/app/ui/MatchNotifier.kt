package com.manhunt.app.ui

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.manhunt.app.MainActivity

/**
 * High-priority local notifications for the moments a match is played with the phone in a
 * pocket: a tag claim waiting for confirmation, the hunt starting, the result, and a
 * dispute that needs the huntmaster. TrackingService owns the (low-importance) foreground
 * tracking notification; this channel is only for events the player must act on.
 */
object MatchNotifier {
    private const val CHANNEL_ID = "match_events"
    private const val PREFS = "manhunt_notifications"
    private const val KEY_ENABLED = "match_notifications_enabled"
    private const val KEY_PROMPTED = "notifications_prompted"

    /** Player-facing switch in Settings; defaults on, can be turned off at any time. */
    fun enabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_ENABLED, true)

    fun setEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_ENABLED, enabled)
            .apply()
    }

    /** True after the app asked for notification permission once; never ask again. */
    fun prompted(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_PROMPTED, false)

    fun markPrompted(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_PROMPTED, true)
            .apply()
    }

    private fun ensureChannel(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Hunt events",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = "Tag claims, hunt start and the hunt result"
                    enableVibration(true)
                },
            )
        }
    }

    fun notify(context: Context, id: Int, title: String, body: String) {
        if (!enabled(context)) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        runCatching {
            ensureChannel(context)
            val open = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val pending = PendingIntent.getActivity(
                context,
                id,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pending)
                .build()
            context.getSystemService(NotificationManager::class.java)?.notify(id, notification)
        }
    }
}
