package com.manhunt.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.data.ChatMessage
import com.manhunt.app.ui.AuthScreen
import com.manhunt.app.ui.ChatPanel
import com.manhunt.app.ui.HomeScreen
import com.manhunt.app.ui.theme.ManHuntTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Verifies the disabled/enabled contract of the primary actions players press. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class ButtonStateTest {

    @get:Rule
    val rule = createComposeRule()

    @Test
    fun authSubmitRequiresUsernameAndEightCharacterPassword() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { AuthScreen() } }
        rule.onNodeWithTag("auth_submit").assertIsNotEnabled()

        rule.onNodeWithTag("auth_username").performTextInput("alice")
        rule.onNodeWithTag("auth_submit").assertIsNotEnabled()

        rule.onNodeWithTag("auth_password").performTextInput("short")
        rule.onNodeWithTag("auth_submit").assertIsNotEnabled()

        rule.onNodeWithTag("auth_password").performTextInput("er123")
        rule.onNodeWithTag("auth_submit").assertIsEnabled()
    }

    @Test
    fun homeJoinRequiresSixCharacterCode() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent { ManHuntTheme(darkTheme = true) { HomeScreen({}, {}, {}) } }
        rule.onNodeWithTag("home_join").assertIsNotEnabled()

        rule.onNodeWithTag("home_join_code").performTextInput("ABC")
        rule.onNodeWithTag("home_join").assertIsNotEnabled()

        rule.onNodeWithTag("home_join_code").performTextInput("123")
        rule.onNodeWithTag("home_join").assertIsEnabled()
    }

    @Test
    fun chatSendIsDisabledUntilThereIsText() {
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    ChatPanel(
                        messages = listOf(
                            ChatMessage(
                                id = 1,
                                userId = null,
                                username = "System",
                                kind = "system",
                                body = "Match started.",
                                createdAt = 1_700_000_000_000,
                            ),
                        ),
                        myUserId = "u1",
                        sending = false,
                        onSend = {},
                    )
                }
            }
        }
        rule.onNodeWithTag("chat_send").assertIsNotEnabled()
        rule.onNodeWithTag("chat_input").performTextInput("hello")
        rule.onNodeWithTag("chat_send").assertIsEnabled()
    }
}
