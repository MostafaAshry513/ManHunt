package com.manhunt.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class ApiClient(
    private val transport: HttpTransport,
    private val baseUrl: () -> String,
    private val json: Json = ManHuntJson,
) {

    suspend fun register(username: String, password: String): AuthResponse =
        post("/api/auth/register", body = credentials(username, password), token = null)

    suspend fun login(username: String, password: String): AuthResponse =
        post("/api/auth/login", body = credentials(username, password), token = null)

    suspend fun me(token: String): UserDto = get<MeResponse>("/api/me", token).user

    suspend fun createRoom(token: String, name: String): RoomState =
        post("/api/rooms", body = buildJsonObject { put("name", name) }.toString(), token = token)

    suspend fun joinRoom(token: String, code: String): RoomState =
        post("/api/rooms/join", body = buildJsonObject { put("code", code) }.toString(), token = token)

    suspend fun room(token: String, roomId: String): RoomState = get("/api/rooms/$roomId", token)

    suspend fun setTeam(token: String, roomId: String, team: String): RoomState =
        post("/api/rooms/$roomId/team", body = buildJsonObject { put("team", team) }.toString(), token = token)

    suspend fun setReady(token: String, roomId: String, ready: Boolean): RoomState =
        post("/api/rooms/$roomId/ready", body = buildJsonObject { put("ready", ready) }.toString(), token = token)

    suspend fun startMatch(token: String, roomId: String): RoomState =
        post("/api/rooms/$roomId/start", body = null, token = token)

    suspend fun leaveRoom(token: String, roomId: String): Unit =
        post<Unit>("/api/rooms/$roomId/leave", body = null, token = token)

    suspend fun messages(token: String, roomId: String): List<ChatMessage> =
        get<MessagesResponse>("/api/rooms/$roomId/messages", token).messages

    suspend fun sendMessage(token: String, roomId: String, body: String): ChatMessage =
        post("/api/rooms/$roomId/messages", body = buildJsonObject { put("body", body) }.toString(), token = token)

    suspend fun updateSettings(token: String, roomId: String, body: String): RoomState =
        request("PATCH", "/api/rooms/$roomId/settings", body, token)

    suspend fun pauseMatch(token: String, roomId: String): RoomState =
        post("/api/rooms/$roomId/pause", body = null, token = token)

    suspend fun resumeMatch(token: String, roomId: String): RoomState =
        post("/api/rooms/$roomId/resume", body = null, token = token)

    suspend fun endMatch(token: String, roomId: String, cancelled: Boolean): RoomState =
        post(
            "/api/rooms/$roomId/end",
            body = buildJsonObject { put("cancelled", cancelled) }.toString(),
            token = token,
        )

    suspend fun history(token: String, roomId: String): MatchHistoryResponse =
        get("/api/rooms/$roomId/history", token)

    suspend fun matchSummary(token: String, matchId: String): MatchSummary =
        get("/api/matches/$matchId", token)

    suspend fun latestLocations(token: String, matchId: String): LatestLocations =
        get("/api/matches/$matchId/locations", token)

    suspend fun trail(token: String, matchId: String, userId: String): TrailResponse =
        get("/api/matches/$matchId/locations/$userId", token)

    suspend fun reportLocation(
        token: String,
        matchId: String,
        lat: Double,
        lng: Double,
        accuracy: Float?,
        recordedAt: Long,
    ): ReportLocationResponse = post(
        "/api/matches/$matchId/location",
        body = buildJsonObject {
            put("lat", lat)
            put("lng", lng)
            if (accuracy != null) put("accuracy", accuracy.toDouble())
            put("recordedAt", recordedAt)
        }.toString(),
        token = token,
    )

    suspend fun requestTag(token: String, roomId: String, preyId: String): TagDto =
        post("/api/rooms/$roomId/tags", body = buildJsonObject { put("preyId", preyId) }.toString(), token = token)

    suspend fun confirmTag(token: String, tagId: String): TagDto =
        post("/api/tags/$tagId/confirm", body = null, token = token)

    suspend fun disputeTag(token: String, tagId: String): TagDto =
        post("/api/tags/$tagId/dispute", body = null, token = token)

    suspend fun resolveTag(token: String, tagId: String, decision: String): TagDto =
        post("/api/tags/$tagId/resolve", body = buildJsonObject { put("decision", decision) }.toString(), token = token)

    // ------------------------------------------------------------ plumbing

    private fun credentials(username: String, password: String) =
        buildJsonObject {
            put("username", username)
            put("password", password)
        }.toString()

    private suspend inline fun <reified T> get(path: String, token: String): T =
        request("GET", path, null, token)

    private suspend inline fun <reified T> post(path: String, body: String?, token: String?): T =
        request("POST", path, body, token)

    private suspend inline fun <reified T> request(
        method: String,
        path: String,
        body: String?,
        token: String?,
    ): T = withContext(Dispatchers.IO) {
        val headers = buildMap {
            if (body != null) put("Content-Type", "application/json")
            if (token != null) put("Authorization", "Bearer $token")
        }
        val response = try {
            transport.execute(HttpRequest(method, baseUrl().trimEnd('/') + path, headers, body))
        } catch (e: Exception) {
            throw ApiException("network", e.message ?: "Cannot reach the server", 0)
        }

        if (response.code !in 200..299) {
            val detail = runCatching {
                json.decodeFromString<ErrorBody>(response.body).error
            }.getOrNull()
            throw ApiException(
                code = detail?.code ?: "http_${response.code}",
                message = detail?.message ?: "Request failed (${response.code})",
                status = response.code,
            )
        }

        if (T::class == Unit::class) {
            @Suppress("UNCHECKED_CAST")
            return@withContext Unit as T
        }
        if (response.body.isBlank()) {
            throw ApiException("invalid_response", "Server returned an empty response", response.code)
        }
        json.decodeFromString<T>(response.body)
    }

    private fun parseUser(raw: String): UserDto =
        json.decodeFromString<MeResponse>(raw).user

    @kotlinx.serialization.Serializable
    internal data class MeResponse(val user: UserDto)
}
