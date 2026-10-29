package com.manhunt.app.data

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.IOException
import java.security.MessageDigest

/**
 * In-app update channel.
 *
 * Android does not allow silent self-updates for normal apps; the flow is:
 * check manifest -> download APK -> verify SHA-256 -> hand it to the system
 * installer. The user confirms one update prompt instead of reinstalling.
 * Updates only install over the same signing key, which CI now keeps stable.
 */
class UpdateManager(
    private val context: Context,
    private val client: OkHttpClient,
    private val baseUrl: () -> String,
) {

    suspend fun download(update: AppUpdate): File = withContext(Dispatchers.IO) {
        val url = if (update.url.startsWith("http")) update.url else baseUrl().trimEnd('/') + update.url
        val response = client.newCall(Request.Builder().url(url).build()).execute()
        if (!response.isSuccessful) {
            response.close()
            throw IOException("Download failed (${response.code})")
        }
        val body = response.body ?: throw IOException("Empty response")
        val dir = File(context.cacheDir, "updates").apply { mkdirs() }
        val file = File(dir, "manhunt-${update.versionName.ifBlank { "latest" }}.apk")

        body.byteStream().use { input ->
            file.outputStream().use { output -> input.copyTo(output) }
        }
        response.close()

        if (update.sha256.isNotBlank()) {
            val actual = sha256(file)
            if (!actual.equals(update.sha256, ignoreCase = true)) {
                file.delete()
                throw IOException("Checksum mismatch: the download was corrupted")
            }
        }
        file
    }

    fun install(file: File) {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
