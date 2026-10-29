package com.manhunt.app.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    private val prefs = context.getSharedPreferences("manhunt_updates", Context.MODE_PRIVATE)
    private val _progress = MutableStateFlow<Float?>(null)

    /** 0f..1f while downloading, then 1f; null when no download is active. */
    val progress: StateFlow<Float?> = _progress.asStateFlow()

    suspend fun download(update: AppUpdate): File = withContext(Dispatchers.IO) {
        try {
            _progress.value = 0f
            val url = if (update.url.startsWith("http")) update.url else baseUrl().trimEnd('/') + update.url
            val response = client.newCall(Request.Builder().url(url).build()).execute()
            if (!response.isSuccessful) {
                response.close()
                throw IOException("Download failed (${response.code})")
            }
            val body = response.body ?: throw IOException("Empty response")
            val dir = File(context.cacheDir, "updates").apply { mkdirs() }
            val file = File(dir, "manhunt-${update.versionCode}.apk")
            val total = body.contentLength().takeIf { it > 0 } ?: update.size
            var downloaded = 0L
            var lastPercent = -1

            body.byteStream().use { input ->
                file.outputStream().use { output ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        val read = input.read(buffer)
                        if (read <= 0) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        if (total > 0) {
                            val percent = ((downloaded * 100) / total).toInt().coerceIn(0, 100)
                            if (percent != lastPercent) {
                                lastPercent = percent
                                _progress.value = (downloaded.toFloat() / total).coerceIn(0f, 1f)
                            }
                        }
                    }
                }
            }
            response.close()

            if (update.sha256.isNotBlank()) {
                val actual = sha256(file)
                if (!actual.equals(update.sha256, ignoreCase = true)) {
                    file.delete()
                    throw IOException("Checksum mismatch: the download was corrupted")
                }
            }
            _progress.value = 1f
            // Survive activity/process recreation while the installer or the
            // "install unknown apps" settings screen is in front.
            prefs.edit()
                .putString("apk_path", file.absolutePath)
                .putInt("apk_version", update.versionCode)
                .apply()
            file
        } catch (failure: Throwable) {
            _progress.value = null
            throw failure
        }
    }

    /** The verified APK waiting to be installed, if it is newer than this build. */
    fun pendingApk(currentVersionCode: Int): File? {
        val version = prefs.getInt("apk_version", 0)
        if (version <= currentVersionCode) return null
        val path = prefs.getString("apk_path", null) ?: return null
        val file = File(path)
        return file.takeIf { it.exists() && it.length() > 0 }
    }

    fun canInstall(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    /**
     * Returns false when Android still needs the per-app "install unknown apps"
     * permission; in that case the settings screen is opened and the user can
     * retry without downloading again.
     */
    @Suppress("DEPRECATION")
    fun install(file: File): Boolean {
        if (!canInstall()) {
            val intent = Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:${context.packageName}"),
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            return false
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        val intent = Intent(Intent.ACTION_INSTALL_PACKAGE).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        return true
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
