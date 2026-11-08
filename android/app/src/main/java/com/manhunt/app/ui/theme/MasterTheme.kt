package com.manhunt.app.ui.theme

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * A master colour is the one accent the whole app shares: primary actions, selection, the live
 * signal and the brand's chalk marks. Team semantics (Prey coral, Hunters violet) never change.
 *
 * The five candidates are deliberately different worlds rather than five shades of the same
 * colour. The app stores the chosen master locally and accepts a debug/capture override through
 * the `manhunt_master` intent extra.
 */
@Immutable
enum class MasterTheme(
    val id: String,
    val label: String,
    val accentDark: Color,
    val onAccentDark: Color,
    val containerDark: Color,
    val onContainerDark: Color,
    val accentLight: Color,
    val onAccentLight: Color,
    val containerLight: Color,
    val onContainerLight: Color,
    val inverseLight: Color,
) {
    Floodlight(
        id = "floodlight",
        label = "Flare",
        accentDark = Color(0xFFFF5A36),
        onAccentDark = Color(0xFF1A0803),
        containerDark = Color(0xFF3A150B),
        onContainerDark = Color(0xFFFFD9CE),
        accentLight = Color(0xFFC63B18),
        onAccentLight = Color(0xFFFFFFFF),
        containerLight = Color(0xFFF2D4C8),
        onContainerLight = Color(0xFF2A0D05),
        inverseLight = Color(0xFFFF5A36),
    ),
    Sodium(
        id = "sodium",
        label = "Sodium",
        accentDark = Color(0xFFFFB454),
        onAccentDark = Color(0xFF2A1600),
        containerDark = Color(0xFF4A2B08),
        onContainerDark = Color(0xFFFFE0B8),
        accentLight = Color(0xFFA85A00),
        onAccentLight = Color(0xFFFFFFFF),
        containerLight = Color(0xFFFFE6C2),
        onContainerLight = Color(0xFF3A1E00),
        inverseLight = Color(0xFFFFB454),
    ),
    HighVis(
        id = "highvis",
        label = "High-vis",
        accentDark = Color(0xFFC9F25C),
        onAccentDark = Color(0xFF182400),
        containerDark = Color(0xFF2F3A0B),
        onContainerDark = Color(0xFFF0FFC2),
        accentLight = Color(0xFF5E7A00),
        onAccentLight = Color(0xFFFFFFFF),
        containerLight = Color(0xFFEDF9C9),
        onContainerLight = Color(0xFF1C2600),
        inverseLight = Color(0xFFC9F25C),
    ),
    Chalk(
        id = "chalk",
        label = "Chalk",
        accentDark = Color(0xFF8FB3FF),
        onAccentDark = Color(0xFF07142E),
        containerDark = Color(0xFF1B2A4D),
        onContainerDark = Color(0xFFDCE6FF),
        accentLight = Color(0xFF2F5AA8),
        onAccentLight = Color(0xFFFFFFFF),
        containerLight = Color(0xFFDCE6FF),
        onContainerLight = Color(0xFF0B1D3A),
        inverseLight = Color(0xFF8FB3FF),
    ),
    Pitch(
        id = "pitch",
        label = "Pitch",
        accentDark = Color(0xFF59D98C),
        onAccentDark = Color(0xFF042414),
        containerDark = Color(0xFF0E3B23),
        onContainerDark = Color(0xFFC9F7D9),
        accentLight = Color(0xFF1F7A45),
        onAccentLight = Color(0xFFFFFFFF),
        containerLight = Color(0xFFD3F5E1),
        onContainerLight = Color(0xFF062B18),
        inverseLight = Color(0xFF59D98C),
    );

    companion object {
        fun fromId(id: String?): MasterTheme? = entries.firstOrNull { it.id == id }

        fun fromLabel(label: String?): MasterTheme? =
            entries.firstOrNull { it.label.equals(label, ignoreCase = true) }
    }
}

/** The selected master colour for the current composition. */
val LocalMasterTheme = staticCompositionLocalOf { MasterTheme.Floodlight }

/**
 * Process-local selection with a small persisted default. It is snapshot state so changing it
 * recomposes the app without restarting the activity.
 */
object MasterThemeChoice {
    private const val PREFS = "manhunt.ui"
    private const val KEY = "master_theme"

    var current: MasterTheme by mutableStateOf(MasterTheme.Floodlight)
        private set

    /** Load the persisted choice once, then let an intent extra override it for capture runs. */
    fun init(context: Context, intent: Intent? = null) {
        val stored = fromPrefs(context)
        current = fromIntent(intent) ?: stored
        if (fromIntent(intent) != null) save(context, current)
    }

    fun select(context: Context, theme: MasterTheme) {
        current = theme
        save(context, theme)
    }

    private fun fromIntent(intent: Intent?): MasterTheme? {
        val id = intent?.getStringExtra("manhunt_master") ?: return null
        return MasterTheme.fromId(id) ?: MasterTheme.fromLabel(id)
    }

    private fun fromPrefs(context: Context): MasterTheme {
        val id = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
        return MasterTheme.fromId(id) ?: MasterTheme.Floodlight
    }

    private fun save(context: Context, theme: MasterTheme) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, theme.id).apply()
    }
}
