package com.manhunt.app

import android.content.Context
import com.manhunt.app.data.ApiClient
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.data.OkHttpTransport
import com.manhunt.app.data.SessionStore
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/** Manual composition root: one instance for the process. */
class AppContainer(context: Context) {
    private val store = SessionStore(context.applicationContext)

    val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .callTimeout(30, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private val api = ApiClient(OkHttpTransport(httpClient), { store.serverUrl })
    val repository = ManHuntRepository(api, store)
    val serverUrl: String get() = store.serverUrl
}

object Graph {
    lateinit var container: AppContainer
        private set

    fun install(context: Context) {
        if (!::container.isInitialized) container = AppContainer(context)
    }
}
