package com.manhunt.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.manhunt.app.ui.AppRoot
import com.manhunt.app.ui.DeepLink

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Graph.install(applicationContext)
        enableEdgeToEdge()
        handleDeepLink(intent)
        setContent {
            AppRoot()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
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
