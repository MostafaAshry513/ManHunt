package com.manhunt.app.testing

import com.manhunt.app.data.HttpRequest
import com.manhunt.app.data.HttpResponse
import com.manhunt.app.data.HttpTransport
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

/**
 * In-memory stand-in for the backend. The UI tests run the real screens,
 * ViewModels and repository against this transport, so navigation and state
 * are exercised end-to-end without a device or network.
 */
class FakeServer : HttpTransport {

    private val token = "test-token"
    var username: String = "alice"
    var roomCode: String = "ABC123"
    var matchPhase: String = "lobby"
    var messages = CopyOnWriteArrayList<JSONObject>()
    var roomStarted = false
    var languageRequests = 0

    private data class Member(var username: String, var team: String = "prey", var ready: Boolean = false, var admin: Boolean = false)

    private val members = linkedMapOf("u1" to Member("alice", admin = true))

    override fun execute(request: HttpRequest): HttpResponse {
        val path = request.url.substringAfter("://").substringAfter("/", "")
        val bare = "/" + path.substringAfter("/")
        val method = request.method

        return when {
            bare == "/api/auth/register" || bare == "/api/auth/login" -> {
                val body = JSONObject(request.body ?: "{}")
                username = body.optString("username", username)
                members["u1"]?.username = username
                json(200, authJson())
            }

            bare == "/api/me" -> json(200, JSONObject().put("user", userJson()))

            bare == "/api/rooms" && method == "POST" -> {
                val name = JSONObject(request.body ?: "{}").optString("name", "Test Room")
                json(200, roomState(name))
            }

            bare == "/api/rooms/join" -> json(200, roomState("Test Room"))

            bare.matches(Regex("/api/rooms/[^/]+")) && method == "GET" -> json(200, roomState("Test Room"))

            bare.endsWith("/leave") -> json(200, JSONObject().put("ok", true))

            bare.endsWith("/team") -> {
                val team = JSONObject(request.body ?: "{}").optString("team", "prey")
                members["u1"]?.team = team
                json(200, roomState("Test Room"))
            }

            bare.endsWith("/ready") -> {
                members["u1"]?.ready = JSONObject(request.body ?: "{}").optBoolean("ready", false)
                json(200, roomState("Test Room"))
            }

            bare.endsWith("/start") -> {
                roomStarted = true
                matchPhase = "head_start"
                json(200, roomState("Test Room", withMatch = true))
            }

            bare.endsWith("/end") -> {
                matchPhase = "finished"
                json(200, roomState("Test Room", withMatch = true))
            }

            bare.endsWith("/pause") || bare.endsWith("/resume") -> {
                matchPhase = if (bare.endsWith("/pause")) "paused" else "hunting"
                json(200, roomState("Test Room", withMatch = true))
            }

            bare.endsWith("/messages") && method == "GET" -> {
                val arr = JSONArray()
                messages.forEach { arr.put(it) }
                json(200, JSONObject().put("messages", arr))
            }

            bare.endsWith("/messages") && method == "POST" -> {
                val text = JSONObject(request.body ?: "{}").optString("body", "")
                val message = JSONObject()
                    .put("id", messages.size + 1)
                    .put("userId", "u1")
                    .put("username", username)
                    .put("kind", "chat")
                    .put("body", text)
                    .put("createdAt", 1_700_000_000_000L + messages.size * 1000)
                messages.add(message)
                json(200, message)
            }

            bare.contains("/locations") -> json(200, JSONObject().put("prey", JSONArray()))

            bare.matches(Regex("/api/matches/[^/]+")) -> json(200, JSONObject().put("phase", matchPhase))

            else -> HttpResponse(404, """{"error":{"code":"not_found","message":"$bare"}}""")
        }
    }

    private fun authJson() = JSONObject().put("token", token).put("user", userJson())

    private fun userJson() = JSONObject().put("id", "u1").put("username", username)

    private fun roomState(name: String, withMatch: Boolean = false): JSONObject {
        val membersArray = JSONArray()
        members.forEach { (id, member) ->
            membersArray.put(
                JSONObject()
                    .put("userId", id)
                    .put("username", member.username)
                    .put("team", member.team)
                    .put("ready", member.ready)
                    .put("connected", true)
                    .put("eliminated", false)
                    .put("isAdmin", member.admin),
            )
        }

        val state = JSONObject()
            .put(
                "room",
                JSONObject()
                    .put("id", "r1")
                    .put("code", roomCode)
                    .put("name", name)
                    .put("adminId", "u1")
                    .put("status", if (roomStarted) "active" else "lobby")
                    .put(
                        "settings",
                        JSONObject()
                            .put("headStartSec", 300)
                            .put("durationSec", 3600)
                            .put("minPlayers", 2)
                            .put("locationIntervalSec", 300)
                            .put("trailsEnabled", true)
                            .put("mode", "open")
                            .put("tagPolicy", "confirm"),
                    ),
            )
            .put("members", membersArray)
            .put("serverNow", 1_700_000_000_000L)

        if (withMatch) {
            state.put(
                "match",
                JSONObject()
                    .put("id", "m1")
                    .put("phase", matchPhase)
                    .put("status", matchPhase)
                    .put("startedAt", 1_700_000_000_000L)
                    .put("headStartEndsAt", 1_700_000_300_000L)
                    .put("endsAt", 1_700_003_900_000L)
                    .put("now", 1_700_000_010_000L)
                    .put("preyAlive", 1)
                    .put("preyTotal", 1),
            )
        }
        return state
    }

    private fun json(code: Int, body: JSONObject) = HttpResponse(code, body.toString())
}
