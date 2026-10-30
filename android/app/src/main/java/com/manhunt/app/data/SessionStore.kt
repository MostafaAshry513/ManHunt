package com.manhunt.app.data

import android.content.Context
import androidx.core.content.edit
import com.manhunt.app.BuildConfig

/**
 * Small synchronous store for the session token and user preferences.
 * Private app storage only; hardening notes live in docs/SECURITY.md.
 */
class SessionStore(context: Context) {

    private val prefs = context.getSharedPreferences("manhunt", Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit { putString(KEY_TOKEN, value) }

    var userJson: String?
        get() = prefs.getString(KEY_USER, null)
        set(value) = prefs.edit { putString(KEY_USER, value) }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER, null) ?: BuildConfig.DEFAULT_SERVER_URL
        set(value) = prefs.edit { putString(KEY_SERVER, value.trim().trimEnd('/')) }

    var darkTheme: Boolean
        get() = prefs.getBoolean(KEY_DARK, true)
        set(value) = prefs.edit { putBoolean(KEY_DARK, value) }

    var safetyAccepted: Boolean
        get() = prefs.getBoolean(KEY_SAFETY, false)
        set(value) = prefs.edit { putBoolean(KEY_SAFETY, value) }

    /** 0.85 - 1.35, applied to the whole type scale. */
    var textScale: Float
        get() = prefs.getFloat(KEY_TEXT_SCALE, 1f)
        set(value) = prefs.edit { putFloat(KEY_TEXT_SCALE, value.coerceIn(0.85f, 1.35f)) }

    var language: String
        get() = prefs.getString(KEY_LANGUAGE, "en") ?: "en"
        set(value) = prefs.edit { putString(KEY_LANGUAGE, value) }

    fun clearSession() {
        prefs.edit {
            remove(KEY_TOKEN)
            remove(KEY_USER)
        }
    }

    companion object {
        private const val KEY_TOKEN = "token"
        private const val KEY_USER = "user"
        private const val KEY_SERVER = "server_url"
        private const val KEY_DARK = "dark_theme"
        private const val KEY_SAFETY = "welcome_accepted_v2"
        private const val KEY_TEXT_SCALE = "text_scale"
        private const val KEY_LANGUAGE = "language"
    }
}
