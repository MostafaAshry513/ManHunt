package com.manhunt.app

import android.graphics.Bitmap
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.data.ChatMessage
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.LocalLanguage
import com.manhunt.app.i18n.LocalStrings
import com.manhunt.app.i18n.arabicStrings
import com.manhunt.app.ui.AuthScreen
import com.manhunt.app.ui.ChatPanel
import com.manhunt.app.ui.HomeScreen
import com.manhunt.app.ui.RolesScreen
import com.manhunt.app.ui.SettingsScreen
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
    fun captureRegister() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { AuthScreen() } }
        rule.waitForIdle()
        rule.onNodeWithText("New here? Create an account").performClick()
        rule.waitForIdle()
        save("01b-auth-register.png")
    }

    @Test
    fun captureHome() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { HomeScreen({}, {}, {}) } }
        rule.waitForIdle()
        save("10-home.png")
    }

    @Test
    fun captureHomeFilled() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { HomeScreen({}, {}, {}) } }
        rule.waitForIdle()
        rule.onNodeWithTag("home_join_code").performTextInput("ABC123")
        rule.waitForIdle()
        save("10b-home-filled.png")
    }

    @Test
    fun captureRolesClassic() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                RolesScreen(firstRun = false, onClose = {}, initialPage = 0)
            }
        }
        rule.waitForIdle()
        save("11-roles-classic.png")
    }

    @Test
    fun captureRolesSinglePrey() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                RolesScreen(firstRun = false, onClose = {}, initialPage = 1)
            }
        }
        rule.waitForIdle()
        save("12-roles-single-prey.png")
    }

    @Test
    fun captureRolesShrinkingZone() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                RolesScreen(firstRun = false, onClose = {}, initialPage = 2)
            }
        }
        rule.waitForIdle()
        save("13-roles-shrinking-zone.png")
    }

    @Test
    fun captureSettingsTabs() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { SettingsScreen(onBack = {}) } }
        rule.waitForIdle()
        val names = listOf("appearance", "language", "permissions", "updates", "account")
        names.forEachIndexed { index, name ->
            rule.onNodeWithTag("settings_tab_$index").performClick()
            rule.waitForIdle()
            save("20-settings-$name.png")
        }
    }

    @Test
    fun captureAppearanceAt135Percent() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        Graph.install(context)
        val repo = Graph.container.repository
        repo.setTextScale(1.35f)
        try {
            rule.setContent {
                val scale by repo.textScale.collectAsState()
                ManHuntTheme(darkTheme = true, fontScale = scale) {
                    SettingsScreen(onBack = {})
                }
            }
            rule.waitForIdle()
            save("21-settings-appearance-135.png")
        } finally {
            repo.setTextScale(1f)
        }
    }

    @Test
    fun captureChatDark() {
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    ChatPanel(messages = sample, myUserId = "u1", draft = "", onDraftChange = {}, sending = false, onSend = {})
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
                        ChatPanel(messages = arabicSample, myUserId = "u1", draft = "", onDraftChange = {}, sending = false, onSend = {})
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