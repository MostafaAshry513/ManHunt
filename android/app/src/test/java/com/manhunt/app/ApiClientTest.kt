package com.manhunt.app

import com.manhunt.app.data.ApiClient
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.HttpRequest
import com.manhunt.app.data.HttpResponse
import com.manhunt.app.data.HttpTransport
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiClientTest {

    private class FakeTransport(
        private val handler: (HttpRequest) -> HttpResponse,
    ) : HttpTransport {
        var last: HttpRequest? = null
        override fun execute(request: HttpRequest): HttpResponse {
            last = request
            return handler(request)
        }
    }

    private fun client(transport: HttpTransport) = ApiClient(transport, { "http://test.local" })

    @Test
    fun loginPostsJsonAndParsesToken() = runBlocking {
        val transport = FakeTransport {
            HttpResponse(200, """{"token":"t-123","user":{"id":"u1","username":"alice"}}""")
        }
        val auth = client(transport).login("alice", "password123")

        assertEquals("t-123", auth.token)
        assertEquals("alice", auth.user.username)
        assertEquals("POST", transport.last?.method)
        assertEquals("http://test.local/api/auth/login", transport.last?.url)
        assertTrue(transport.last?.body?.contains("\"password\":\"password123\"") == true)
    }

    @Test
    fun roomRequestSendsBearerToken() = runBlocking {
        val transport = FakeTransport {
            HttpResponse(200, """{"room":{"id":"r1","code":"ABC123","name":"X","adminId":"u1","status":"lobby"},"members":[]}""")
        }
        val state = client(transport).room("tok", "r1")

        assertEquals("ABC123", state.room.code)
        assertEquals("Bearer tok", transport.last?.headers?.get("Authorization"))
    }

    @Test
    fun serverErrorBecomesApiException() = runBlocking {
        val transport = FakeTransport {
            HttpResponse(409, """{"error":{"code":"cannot_start","message":"2 player(s) are not ready"}}""")
        }
        try {
            client(transport).startMatch("tok", "r1")
            throw AssertionError("expected ApiException")
        } catch (e: ApiException) {
            assertEquals("cannot_start", e.code)
            assertEquals(409, e.status)
            assertTrue(e.message.contains("not ready"))
        }
    }

    @Test
    fun networkFailureIsReportedAsNetworkError() = runBlocking {
        val transport = FakeTransport { throw java.io.IOException("connection refused") }
        try {
            client(transport).room("tok", "r1")
            throw AssertionError("expected ApiException")
        } catch (e: ApiException) {
            assertEquals("network", e.code)
            assertEquals(0, e.status)
        }
    }
}
