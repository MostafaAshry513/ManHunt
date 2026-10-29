package com.manhunt.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * First genuinely in-app test: runs on an Android emulator in CI, against the
 * real backend started on the runner (10.0.2.2:8080).
 *
 * Flow: safety notice -> register -> home -> create room -> room header.
 */
@RunWith(AndroidJUnit4::class)
class InGameSmokeTest {

    @get:Rule
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun registerAndCreateRoom() {
        val username = "ci_" + System.currentTimeMillis().toString().takeLast(8)

        compose.waitUntil(20_000) {
            compose.onAllNodesWithText("I understand and I'll play safely").fetchSemanticsNodes().isNotEmpty() ||
                compose.onAllNodesWithText("Username").fetchSemanticsNodes().isNotEmpty()
        }

        if (compose.onAllNodesWithText("I understand and I'll play safely").fetchSemanticsNodes().isNotEmpty()) {
            compose.onAllNodesWithText("I understand and I'll play safely")[0].performClick()
        }

        compose.waitUntil(20_000) {
            compose.onAllNodesWithText("Username").fetchSemanticsNodes().isNotEmpty()
        }

        // The sign-in screen uses translated labels; tags are stable.
        compose.onNodeWithTag("auth_username").performTextInput(username)
        compose.onNodeWithTag("auth_password").performTextInput("password123")
        compose.onNodeWithTag("auth_submit").performClick()

        compose.waitUntil(30_000) {
            compose.onAllNodesWithText("Start a game").fetchSemanticsNodes().isNotEmpty()
        }

        compose.onNodeWithTag("home_room_name").performTextInput("CI Room")
        compose.onNodeWithTag("home_create").performClick()

        compose.waitUntil(30_000) {
            compose.onAllNodesWithText("CI Room").fetchSemanticsNodes().isNotEmpty()
        }
    }
}
