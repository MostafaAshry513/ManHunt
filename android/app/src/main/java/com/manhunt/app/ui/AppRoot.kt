package com.manhunt.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import android.widget.Toast
import com.manhunt.app.Graph
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.LocalLanguage
import com.manhunt.app.i18n.LocalStrings
import com.manhunt.app.i18n.arabicStrings
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntTheme
import com.manhunt.app.ui.theme.Motion

sealed interface Route {
    data object Safety : Route
    data object Auth : Route
    data object Home : Route
    data object Roles : Route
    data object Settings : Route
    data class Room(val id: String) : Route
}

@Composable
fun AppRoot() {
    val repo = Graph.container.repository
    val context = LocalContext.current
    val session by repo.session.collectAsState()
    val dark by repo.darkTheme.collectAsState()
    val textScale by repo.textScale.collectAsState()
    val language by repo.language.collectAsState()
    val joinFailedMessage = t("Could not join that room. Check the invite link.")

    // Saveable so rotation keeps the user where they were (audit UI-06).
    var routeKey by rememberSaveable { mutableStateOf("auth") }
    var activeRoomId by rememberSaveable { mutableStateOf("") }
    var safetyAccepted by rememberSaveable { mutableStateOf(repo.hasAcceptedSafety()) }

    val route: Route = when (routeKey) {
        "safety" -> Route.Safety
        "home" -> Route.Home
        "roles" -> Route.Roles
        "settings" -> Route.Settings
        "room" -> Route.Room(activeRoomId)
        else -> Route.Auth
    }

    LaunchedEffect(Unit) { repo.restoreSession() }

    // System back on the settings screen returns Home instead of finishing the Activity.
    BackHandler(enabled = routeKey == "settings") { routeKey = "home" }

    LaunchedEffect(session, safetyAccepted) {
        routeKey = when {
            !safetyAccepted -> "safety"
            session == null -> "auth"
            routeKey == "auth" || routeKey == "safety" -> "home"
            else -> routeKey
        }
    }

    // Invite link: once the player is past the welcome and signed in, join the room
    // automatically instead of making them retype the code.
    val pendingJoin by DeepLink.pendingCode.collectAsState()
    LaunchedEffect(pendingJoin, session, safetyAccepted) {
        val code = pendingJoin ?: return@LaunchedEffect
        if (!safetyAccepted || session == null) return@LaunchedEffect
        DeepLink.consume()
        val joined = runCatching { repo.joinRoom(code) }.getOrNull()
        if (joined != null) {
            activeRoomId = joined.room.id
            routeKey = "room"
        } else {
            routeKey = "home"
            Toast.makeText(context, joinFailedMessage, Toast.LENGTH_LONG).show()
        }
    }

    ManHuntTheme(darkTheme = dark, fontScale = textScale) {
        CompositionLocalProvider(
            LocalLanguage provides language,
            LocalStrings provides if (language == AppLanguage.Arabic) arabicStrings() else emptyMap(),
            LocalLayoutDirection provides if (language.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
        ) {
        // Edge-to-edge: keep every screen inside the status bar, cutout, nav bar and IME.
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Box(modifier = Modifier.fillMaxSize().safeDrawingPadding()) {
                // Screen slides must mirror with the layout, or Arabic navigation animates
                // in the "wrong" direction while the UI itself is fully mirrored.
                val isRtl = LocalLayoutDirection.current == LayoutDirection.Rtl
                AnimatedContent(
                    targetState = route,
                    transitionSpec = {
                        (fadeIn(tween(Motion.EMPHASIZED, easing = Motion.EaseOutExpo)) +
                            slideInHorizontally(tween(Motion.EMPHASIZED, easing = Motion.EaseOutExpo)) {
                                if (isRtl) -(it / 14) else it / 14
                            }) togetherWith
                            (fadeOut(tween(Motion.QUICK, easing = Motion.EaseInOut)) +
                                slideOutHorizontally(tween(Motion.STANDARD, easing = Motion.EaseInOut)) {
                                    if (isRtl) it / 20 else -(it / 20)
                                })
                    },
                    label = "screen",
                ) { current ->
                    when (current) {
                        Route.Safety -> RolesScreen(
                            firstRun = true,
                            onClose = {
                                repo.acceptSafety()
                                safetyAccepted = true
                            },
                        )
                        Route.Roles -> RolesScreen(
                            firstRun = false,
                            onClose = { routeKey = "home" },
                        )
                        Route.Auth -> AuthScreen()
                        Route.Home -> HomeScreen(
                            onOpenRoom = { id ->
                                activeRoomId = id
                                routeKey = "room"
                            },
                            onOpenSettings = { routeKey = "settings" },
                            onOpenRoles = { routeKey = "roles" },
                        )
                        Route.Settings -> SettingsScreen(onBack = { routeKey = "home" })
                        is Route.Room -> RoomScreen(
                            roomId = current.id,
                            onBack = { routeKey = "home" },
                        )
                    }
                }
            }
        }
        }
    }
}