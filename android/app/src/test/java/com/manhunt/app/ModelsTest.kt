package com.manhunt.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelsTest {

    // Mirrors a real GET /api/rooms/:id payload, including fields the client ignores.
    private val roomJson = """
        {
          "room": {
            "id": "room_1",
            "code": "ABC123",
            "name": "Park Run",
            "adminId": "usr_1",
            "status": "active",
            "settings": {
              "headStartSec": 300,
              "durationSec": 3600,
              "minPlayers": 2,
              "locationIntervalSec": 300,
              "trailsEnabled": true,
              "mode": "zone",
              "zone": {"centerLat": 51.5, "centerLng": -0.12, "radiusM": 800.0, "nextShrinkAt": null},
              "shrink": {"enabled": false, "intervalSec": 120, "stepM": 25, "minRadiusM": 100, "warningSec": 30},
              "tagPolicy": "confirm"
            },
            "createdAt": 1767225600000
          },
          "members": [
            {"userId": "usr_1", "username": "alice", "team": "prey", "ready": true, "connected": true, "eliminated": false, "isAdmin": true},
            {"userId": "usr_2", "username": "bob", "team": "hunters", "ready": true, "connected": false, "eliminated": false, "isAdmin": false}
          ],
          "match": {
            "id": "match_1", "phase": "hunting", "status": "hunting",
            "startedAt": 1767225600000, "headStartEndsAt": 1767225900000,
            "endsAt": 1767229500000, "now": 1767226000000,
            "winner": null, "preyAlive": 1, "preyTotal": 1,
            "zone": {"centerLat": 51.5, "centerLng": -0.12, "radiusM": 750.0},
            "someFutureField": "ignored"
          },
          "serverNow": 1767226000000,
          "anotherFutureField": true
        }
    """.trimIndent()

    @Test
    fun decodesRoomStateAndIgnoresUnknownFields() {
        val state = ManHuntJson.decodeFromString<RoomState>(roomJson)

        assertEquals("ABC123", state.room.code)
        assertEquals("active", state.room.status)
        assertEquals(2, state.members.size)
        assertEquals(Teams.HUNTERS, state.members[1].team)
        assertEquals(false, state.members[1].connected)
        assertEquals(Phases.HUNTING, state.match?.phase)
        assertEquals(1, state.match?.preyAlive)
        assertEquals(750.0, state.match?.zone?.radiusM ?: 0.0, 0.001)
    }

    @Test
    fun decodesErrorBody() {
        val error = ManHuntJson.decodeFromString<ErrorBody>(
            """{"error":{"code":"cannot_start","message":"2 player(s) are not ready"}}""",
        )
        assertEquals("cannot_start", error.error.code)
        assertTrue(error.error.message.contains("not ready"))
    }

    @Test
    fun decodesMessages() {
        val response = ManHuntJson.decodeFromString<MessagesResponse>(
            """{"messages":[
                 {"id":1,"userId":null,"username":"System","kind":"system","body":"Match started","createdAt":1},
                 {"id":2,"userId":"usr_1","username":"alice","kind":"chat","body":"hi","createdAt":2}
               ]}""",
        )
        assertEquals(2, response.messages.size)
        assertEquals("System", response.messages[0].username)
        assertEquals("alice", response.messages[1].username)
    }

    @Test
    fun decodesAuthResponse() {
        val auth = ManHuntJson.decodeFromString<AuthResponse>(
            """{"token":"abc.def","user":{"id":"usr_1","username":"alice"}}""",
        )
        assertEquals("alice", auth.user.username)
        assertEquals("abc.def", auth.token)
    }
}
