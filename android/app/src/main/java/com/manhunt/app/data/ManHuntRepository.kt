package com.manhunt.app.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.manhunt.app.i18n.AppLanguage

data class Session(val token: String, val user: UserDto)

/**
 * Single source of truth for the client. Screens call this, never the ApiClient directly.
 * Room state is refreshed from the server: the client never computes match phases locally.
 */
class ManHuntRepository(
    private val api: ApiClient,
    private val store: SessionStore,
) {
    private val _session = MutableStateFlow(loadSession())
    val session: StateFlow<Session?> = _session.asStateFlow()

    private val _darkTheme = MutableStateFlow(store.darkTheme)
    val darkTheme: StateFlow<Boolean> = _darkTheme.asStateFlow()

    private val _textScale = MutableStateFlow(store.textScale)
    val textScale: StateFlow<Float> = _textScale.asStateFlow()

    private val _language = MutableStateFlow(AppLanguage.fromCode(store.language))
    val language: StateFlow<AppLanguage> = _language.asStateFlow()

    var serverUrl: String = store.serverUrl
        private set

    fun setServerUrl(url: String) {
        store.serverUrl = url
        serverUrl = store.serverUrl
        // A different server means the old token is meaningless.
        logout()
    }

    fun setDarkTheme(enabled: Boolean) {
        store.darkTheme = enabled
        _darkTheme.value = enabled
    }

    fun setTextScale(scale: Float) {
        val clamped = scale.coerceIn(0.85f, 1.35f)
        store.textScale = clamped
        _textScale.value = clamped
    }

    fun setLanguage(language: AppLanguage) {
        store.language = language.code
        _language.value = language
    }

    fun hasAcceptedSafety(): Boolean = store.safetyAccepted

    fun acceptSafety() {
        store.safetyAccepted = true
    }

    suspend fun register(username: String, password: String) {
        val auth = api.register(username.trim(), password)
        persist(auth)
    }

    suspend fun login(username: String, password: String) {
        val auth = api.login(username.trim(), password)
        persist(auth)
    }

    /** Validates a stored token against the server; keeps it on network failure. */
    suspend fun restoreSession() {
        val current = _session.value ?: return
        try {
            val user = api.me(current.token)
            _session.value = current.copy(user = user)
            store.userJson = ManHuntJson.encodeToString(UserDto.serializer(), user)
        } catch (e: ApiException) {
            if (e.status == 401) logout()
        }
    }

    fun logout() {
        store.clearSession()
        _session.value = null
    }

    suspend fun createRoom(name: String): RoomState = api.createRoom(token(), name)

    suspend fun joinRoom(code: String): RoomState = api.joinRoom(token(), code.trim().uppercase())

    suspend fun room(roomId: String): RoomState = api.room(token(), roomId)

    suspend fun setTeam(roomId: String, team: String): RoomState = api.setTeam(token(), roomId, team)

    suspend fun setReady(roomId: String, ready: Boolean): RoomState = api.setReady(token(), roomId, ready)

    suspend fun startMatch(roomId: String): RoomState = api.startMatch(token(), roomId)

    suspend fun leaveRoom(roomId: String) {
        api.leaveRoom(token(), roomId)
    }

    suspend fun messages(roomId: String): List<ChatMessage> = api.messages(token(), roomId)

    suspend fun sendMessage(roomId: String, body: String): ChatMessage = api.sendMessage(token(), roomId, body)

    suspend fun latestLocations(matchId: String): LatestLocations = api.latestLocations(token(), matchId)

    suspend fun trail(matchId: String, userId: String): TrailResponse = api.trail(token(), matchId, userId)

    suspend fun updateSettings(roomId: String, patch: kotlinx.serialization.json.JsonObject): RoomState =
        api.updateSettings(token(), roomId, patch.toString())

    suspend fun pauseMatch(roomId: String): RoomState = api.pauseMatch(token(), roomId)

    suspend fun resumeMatch(roomId: String): RoomState = api.resumeMatch(token(), roomId)

    suspend fun endMatch(roomId: String, cancelled: Boolean = false): RoomState =
        api.endMatch(token(), roomId, cancelled)

    suspend fun history(roomId: String): MatchHistoryResponse = api.history(token(), roomId)

    suspend fun matchSummary(matchId: String): MatchSummary = api.matchSummary(token(), matchId)

    suspend fun reportLocation(matchId: String, lat: Double, lng: Double, accuracy: Float?, recordedAt: Long) {
        api.reportLocation(token(), matchId, lat, lng, accuracy, recordedAt)
    }

    suspend fun requestTag(roomId: String, preyId: String): TagDto = api.requestTag(token(), roomId, preyId)

    suspend fun confirmTag(tagId: String): TagDto = api.confirmTag(token(), tagId)

    suspend fun disputeTag(tagId: String): TagDto = api.disputeTag(token(), tagId)

    suspend fun resolveTag(tagId: String, decision: String): TagDto = api.resolveTag(token(), tagId, decision)

    fun myUserId(): String? = _session.value?.user?.id

    fun currentToken(): String? = _session.value?.token

    private fun token(): String = _session.value?.token
        ?: throw ApiException("unauthorized", "Please sign in again", 401)

    private fun persist(auth: AuthResponse) {
        store.token = auth.token
        store.userJson = ManHuntJson.encodeToString(UserDto.serializer(), auth.user)
        _session.value = Session(auth.token, auth.user)
    }

    private fun loadSession(): Session? {
        val token = store.token ?: return null
        val userJson = store.userJson ?: return null
        val user = runCatching { ManHuntJson.decodeFromString(UserDto.serializer(), userJson) }.getOrNull()
            ?: return null
        return Session(token, user)
    }
}
