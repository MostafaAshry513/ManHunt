package com.manhunt.app.data

import android.content.Context
import java.io.File
import java.util.Locale

/** Tracks and clears the app's cache (map tiles + downloaded update APKs). */
object AppStorage {

    fun cacheSizeBytes(context: Context): Long =
        context.cacheDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }

    fun clearCache(context: Context) {
        context.cacheDir.listFiles()?.forEach { it.deleteRecursively() }
        // osmdroid expects its tile directory to exist on the next map render.
        File(context.cacheDir, "osmdroid/tiles").mkdirs()
    }

    fun formatBytes(bytes: Long): String = when {
        bytes < 1024 -> "$bytes B"
        bytes < 1024 * 1024 -> String.format(Locale.ROOT, "%.1f KB", bytes / 1024.0)
        else -> String.format(Locale.ROOT, "%.1f MB", bytes / (1024.0 * 1024.0))
    }
}
