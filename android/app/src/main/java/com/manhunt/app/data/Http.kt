package com.manhunt.app.data

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class HttpRequest(
    val method: String,
    val url: String,
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null,
)

data class HttpResponse(val code: Int, val body: String)

/** Seam for tests: the API client never touches OkHttp directly. */
interface HttpTransport {
    fun execute(request: HttpRequest): HttpResponse
}

class OkHttpTransport(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .callTimeout(30, TimeUnit.SECONDS)
        .build(),
) : HttpTransport {

    override fun execute(request: HttpRequest): HttpResponse {
        val builder = Request.Builder().url(request.url)
        request.headers.forEach { (k, v) -> builder.header(k, v) }

        val json = "application/json".toMediaType()
        val needsBody = request.method == "POST" || request.method == "PUT" || request.method == "PATCH"
        val body = when {
            request.body != null -> request.body.toRequestBody(json)
            needsBody -> "{}".toRequestBody(json)
            else -> null
        }
        builder.method(request.method, body)

        client.newCall(builder.build()).execute().use { response ->
            return HttpResponse(response.code, response.body?.string().orEmpty())
        }
    }
}
