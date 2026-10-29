package com.manhunt.app

import com.manhunt.app.data.SocketEvent
import com.manhunt.app.data.SocketPayloadParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Verifies the Android side of the WebSocket contract without opening a socket. */
class SocketPayloadParserTest {

    @Test
    fun parsesRoomSnapshot() {
        val frame = """
            {"type":"room","data":{
              "room":{"id":"r1","code":"ABC123","name":"Park","adminId":"u1","status":"lobby",
                      "settings":{"headStartSec":300,"durationSec":3600}},
              "members":[{"userId":"u1","username":"alice","team":"prey","ready":true,"connected":true,"eliminated":false,"isAdmin":true}],
              "match":null,"serverNow":123
            }}
        """.trimIndent()

        val event = SocketPayloadParser.parse(frame)
        assertTrue(event is SocketEvent.Room)
        val state = (event as SocketEvent.Room).state
        assertEquals("ABC123", state.room.code)
        assertEquals(1, state.members.size)
        assertEquals(true, state.members[0].isAdmin)
    }

    @Test
    fun parsesChat() {
        val frame = """
            {"type":"chat","data":{"id":7,"userId":"u2","username":"bob","kind":"chat","body":"north gate","createdAt":99}}
        """.trimIndent()

        val event = SocketPayloadParser.parse(frame) as SocketEvent.Chat
        assertEquals("bob", event.message.username)
        assertEquals("north gate", event.message.body)
    }

    @Test
    fun parsesPreyLocation() {
        val frame = """
            {"type":"prey_location","data":{"matchId":"m1","userId":"u1","username":"alice",
             "lat":51.5,"lng":-0.12,"accuracy":8.5,"recordedAt":1000,"receivedAt":1100,"flagged":false}}
        """.trimIndent()

        val event = SocketPayloadParser.parse(frame) as SocketEvent.PreyLocation
        assertEquals(51.5, event.report.lat, 0.0001)
        assertEquals("alice", event.report.username)
    }

    @Test
    fun parsesTagRequest() {
        val frame = """
            {"type":"tag_request","data":{"id":"t1","matchId":"m1","hunterId":"u2","preyId":"u1","status":"pending","createdAt":5}}
        """.trimIndent()

        val event = SocketPayloadParser.parse(frame) as SocketEvent.TagRequest
        assertEquals("u1", event.tag.preyId)
        assertEquals("pending", event.tag.status)
    }

    @Test
    fun parsesTagDisputed() {
        val frame = """
            {"type":"tag_disputed","data":{"id":"t2","matchId":"m1","hunterId":"u2","preyId":"u1","status":"disputed","createdAt":6}}
        """.trimIndent()

        val event = SocketPayloadParser.parse(frame) as SocketEvent.TagDisputed
        assertEquals("t2", event.tag.id)
        assertEquals("disputed", event.tag.status)
    }

    @Test
    fun ignoresUnknownAndMalformedFrames() {
        assertNull(SocketPayloadParser.parse("""{"type":"presence","data":{}}"""))
        assertNull(SocketPayloadParser.parse("not json"))
        assertNull(SocketPayloadParser.parse("""{"type":"room"}"""))
        assertNull(SocketPayloadParser.parse(""))
    }
}
