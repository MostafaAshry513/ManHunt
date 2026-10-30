package com.manhunt.app.ui

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Holds a room code arriving from an invite deep link (`manhunt://join?code=ABC123`).
 * MainActivity fills it from the intent, AppRoot consumes it once the player is past the
 * welcome screen and signed in, then auto-joins the room.
 */
object DeepLink {
    private val _pendingCode = MutableStateFlow<String?>(null)
    val pendingCode: StateFlow<String?> = _pendingCode.asStateFlow()

    fun submit(code: String?) {
        val cleaned = code?.trim()?.uppercase().orEmpty()
        if (cleaned.isNotEmpty()) _pendingCode.value = cleaned
    }

    fun consume() {
        _pendingCode.value = null
    }
}
