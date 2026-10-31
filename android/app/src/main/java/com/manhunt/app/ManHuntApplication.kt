package com.manhunt.app

import android.app.Application
import org.osmdroid.config.Configuration
import java.io.File

class ManHuntApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // OSM tile policy requires a distinct, stable User-Agent identifying the app.
        // One declaration, version read at runtime so it never drifts across releases.
        val versionName = runCatching {
            packageManager.getPackageInfo(packageName, 0).versionName
        }.getOrDefault("dev")
        Configuration.getInstance().apply {
            userAgentValue = "ManHunt/$versionName"
            osmdroidBasePath = File(cacheDir, "osmdroid").apply { mkdirs() }
            osmdroidTileCache = File(osmdroidBasePath, "tiles").apply { mkdirs() }
            // osmdroid defaults to a 600 MB tile cache (trimmed at 500 MB), which is what
            // makes a 2 MB install look like hundreds of MB in Android's storage screen
            // after a few hunts. Keep a useful cache for offline-ish map reuse but bound it.
            tileFileSystemCacheMaxBytes = 48L * 1024 * 1024
            tileFileSystemCacheTrimBytes = 32L * 1024 * 1024
        }
    }
}
