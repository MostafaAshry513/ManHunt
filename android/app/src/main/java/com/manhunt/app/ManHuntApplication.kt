package com.manhunt.app

import android.app.Application
import org.osmdroid.config.Configuration

class ManHuntApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // OSM tile policy requires a distinct, stable User-Agent identifying the app.
        // One declaration, version read at runtime so it never drifts across releases.
        val versionName = runCatching {
            packageManager.getPackageInfo(packageName, 0).versionName
        }.getOrDefault("dev")
        Configuration.getInstance().userAgentValue = "ManHunt/$versionName"
        Configuration.getInstance().osmdroidBasePath =
            java.io.File(cacheDir, "osmdroid").apply { mkdirs() }
        Configuration.getInstance().osmdroidTileCache =
            java.io.File(Configuration.getInstance().osmdroidBasePath, "tiles").apply { mkdirs() }
    }
}
