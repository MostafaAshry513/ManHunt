package com.manhunt.app.data

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.net.URLEncoder

sealed interface SocketEvent {
    data class Room(val state: RoomState) : SocketEvent
    data class Chat(val message: ChatMessage) : SocketEvent
    data class PreyLocation(val report: LocationReportDto) : SocketEvent
    data class TagRequest(val tag: TagDto) : SocketEvent
    data class TagDisputed(val tag: TagDto) : SocketEvent
    data class Connection(val connected: Boolean, val reason: String? = null) : SocketEvent
}

/**
 * Authenticated room socket with bounded exponential backoff.
 * Purely an accelerator: the server is authoritative and the UI still polls as a fallback.
 */
class RoomSocket(
    private val http: OkHttpClient,
    private val onEvent: (SocketEvent) -> Unit,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var socket: WebSocket? = null
    private var token: String? = null
    private var roomId: String? = null
    private var baseUrl: String = ""
    private var wanted = false
    private var attempt = 0
    private var reconnectJob: Job? = null

    fun connect(baseUrl: String, token: String, roomId: String) {
        close()
        this.baseUrl = baseUrl
        this.token = token
        this.roomId = roomId
        this.wanted = true
        this.attempt = 0
        open()
    }

    fun close() {
        wanted = false
        reconnectJob?.cancel()
        socket?.close(1000, "client closed")
        socket = null
    }

    private fun open() {
        if (!wanted) return
        val currentToken = token ?: return
        val url = baseUrl.trimEnd('/').replaceFirst("http", "ws") +
            "/ws?token=" + URLEncoder.encode(currentToken, "UTF-8")
        socket = http.newWebSocket(Request.Builder().url(url).build(), listener)
    }

    private val listener = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            attempt = 0
            onEvent(SocketEvent.Connection(true))
            roomId?.let { webSocket.send("""{"type":"subscribe","roomId":"$it"}""") }
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            SocketPayloadParser.parse(text)?.let(onEvent)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            onEvent(SocketEvent.Connection(false, t.message))
            scheduleReconnect()
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            if (wanted) {
                onEvent(SocketEvent.Connection(false, reason))
                scheduleReconnect()
            }
        }
    }

    private fun scheduleReconnect() {
        if (!wanted) return
        reconnectJob?.cancel()
        val delayMs = minOf(15_000L, 1_000L shl minOf(attempt, 4))
        attempt += 1
        reconnectJob = scope.launch {
            delay(delayMs)
            if (wanted) open()
        }
    }
}

/** Decodes server frames. Extracted so the wire contract is unit-testable without a socket. */
internal object SocketPayloadParser {
    fun parse(text: String): SocketEvent? = runCatching {
        val root = ManHuntJson.parseToJsonElement(text).jsonObject
        val type = root["type"]?.jsonPrimitive?.content ?: return null
        val data = root["data"] ?: return null
        when (type) {
            "room" -> SocketEvent.Room(ManHuntJson.decodeFromJsonElement(RoomState.serializer(), data))
            "chat" -> SocketEvent.Chat(ManHuntJson.decodeFromJsonElement(ChatMessage.serializer(), data))
            "prey_location" -> SocketEvent.PreyLocation(
                ManHuntJson.decodeFromJsonElement(LocationReportDto.serializer(), data),
            )
            "tag_request" -> SocketEvent.TagRequest(ManHuntJson.decodeFromJsonElement(TagDto.serializer(), data))
            "tag_disputed" -> SocketEvent.TagDisputed(ManHuntJson.decodeFromJsonElement(TagDto.serializer(), data))
            else -> null
        }
    }.getOrNull()
}
