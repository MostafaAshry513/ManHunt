package com.manhunt.app

import android.graphics.Bitmap
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.data.ChatMessage
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.LocalLanguage
import com.manhunt.app.i18n.LocalStrings
import com.manhunt.app.i18n.arabicStrings
import com.manhunt.app.ui.AuthScreen
import com.manhunt.app.ui.ChatPanel
import com.manhunt.app.ui.theme.ManHuntTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Renders real Compose screens to PNG on the JVM (no device).
 * These images are the repository screenshots.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class ScreenshotTest {

    @get:Rule
    val rule = createComposeRule()

    private val sample = listOf(
        ChatMessage(id = 1, userId = null, username = "System", kind = "system", body = "Match started. Hunters are live.", createdAt = 1_700_000_000_000),
        ChatMessage(id = 2, userId = "u2", username = "bob", kind = "chat", body = "I'm near the north gate", createdAt = 1_700_000_060_000),
        ChatMessage(id = 3, userId = "u1", username = "alice", kind = "chat", body = "Give me two minutes, I'm hiding", createdAt = 1_700_000_120_000),
        ChatMessage(id = 4, userId = "u2", username = "bob", kind = "chat", body = "I can see the trail heading east", createdAt = 1_700_000_180_000),
    )

    @Test
    fun captureAuth() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { AuthScreen() } }
        rule.waitForIdle()
        save("01-auth.png")
    }

    @Test
    fun captureChatDark() {
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    ChatPanel(messages = sample, myUserId = "u1", sending = false, onSend = {})
                }
            }
        }
        rule.waitForIdle()
        save("02-chat-dark.png")
    }

    @Test
    fun captureChatArabic() {
        val arabicSample = listOf(
            ChatMessage(id = 1, userId = null, username = "النظام", kind = "system", body = "بدأت المباراة. الصيادون نشطون.", createdAt = 1700000000000),
            ChatMessage(id = 2, userId = "u2", username = "بدر", kind = "chat", body = "أنا قرب البوابة الشمالية", createdAt = 1700000060000),
            ChatMessage(id = 3, userId = "u1", username = "سارة", kind = "chat", body = "أعطني دقيقتين، أنا أختبئ", createdAt = 1700000120000),
            ChatMessage(id = 4, userId = "u2", username = "بدر", kind = "chat", body = "أرى المسار يتجه شرقًا", createdAt = 1700000180000),
        )
        rule.setContent {
            CompositionLocalProvider(
                LocalLanguage provides AppLanguage.Arabic,
                LocalStrings provides arabicStrings(),
                LocalLayoutDirection provides LayoutDirection.Rtl,
            ) {
                ManHuntTheme(darkTheme = true) {
                    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        ChatPanel(messages = arabicSample, myUserId = "u1", sending = false, onSend = {})
                    }
                }
            }
        }
        rule.waitForIdle()
        save("03-chat-arabic-rtl.png")
    }

    private fun save(name: String) {
        val bitmap = rule.onRoot().captureToImage().asAndroidBitmap()
        val out = File("build/screenshots/$name")
        out.parentFile?.mkdirs()
        out.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}