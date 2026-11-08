package com.manhunt.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.manhunt.app.ui.AppRoot
import com.manhunt.app.ui.DeepLink
import com.manhunt.app.ui.StartupBrandScreen
import com.manhunt.app.ui.theme.MasterThemeChoice

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Graph.install(applicationContext)
        MasterThemeChoice.init(applicationContext, intent)
        enableEdgeToEdge()
        // The app paints its own background edge-to-edge; no system scrim is needed behind
        // gesture/3-button navigation. Icon contrast is handled by ManHuntTheme.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        handleDeepLink(intent)
        setContent {
            // Cold-start only: a short Open Zone reveal bridges the system splash and Home.
            // It runs over the already-composing UI, so session restore is never blocked.
            var showStartup by rememberSaveable { mutableStateOf(true) }
            Box(Modifier.fillMaxSize()) {
                AppRoot()
                if (showStartup) {
                    StartupBrandScreen(onFinished = { showStartup = false })
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        MasterThemeChoice.init(applicationContext, intent)
        handleDeepLink(intent)
    }

    /** `manhunt://join?code=ABC123` from a shared invite link. */
    private fun handleDeepLink(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == "manhunt" && data.host == "join") {
            DeepLink.submit(data.getQueryParameter("code"))
        }
    }
}
