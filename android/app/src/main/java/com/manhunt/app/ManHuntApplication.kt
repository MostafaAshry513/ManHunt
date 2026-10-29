package com.manhunt.app

import android.app.Application
import org.osmdroid.config.Configuration

class ManHuntApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // OSM tile policy requires a distinct, stable User-Agent identifying the app.
        // Replace the contact with a real address before any public release.
        Configuration.getInstance().userAgentValue = "ManHunt/0.1 (dev build)"
        Configuration.getInstance().osmdroidBasePath =
            java.io.File(cacheDir, "osmdroid").apply { mkdirs() }
        Configuration.getInstance().osmdroidTileCache =
            java.io.File(Configuration.getInstance().osmdroidBasePath, "tiles").apply { mkdirs() }
    }
}
