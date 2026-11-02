package com.manhunt.app

import android.Manifest
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.GrantPermissionRule
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Regression test for the warm invite intent (`manhunt://join?code=ABC123` while the app is
 * already foregrounded).
 *
 * The bug this pins: AppRoot's deep-link effect used to be keyed on `session`/`safetyAccepted`
 * and consumed the code before the suspending Join, so the key change cancelled the coroutine
 * mid-request. The Join API completed server-side (HTTP 200) but the client never navigated and
 * never requested the room. The capture driver hit exactly this with a warm VIEW intent.
 *
 * Flow: sign in through the real UI (cold app launch) -> another player creates a room over the
 * real HTTP API (same helper approach as InGameSmokeTest) -> deliver the invite VIEW intent to
 * the foregrounded activity with SINGLE_TOP so MainActivity.onNewIntent runs (the warm path) ->
 * assert the MATCHDAY Lobby composes (Board `room_code` + `lobby_list`) with the right code.
 */
@RunWith(AndroidJUnit4::class)
class WarmInviteTest {

    @get:Rule
    val compose = createAndroidComposeRule<MainActivity>()

    @get:Rule
    val permissions: GrantPermissionRule = GrantPermissionRule.grant(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.POST_NOTIFICATIONS,
    )

    private val http = OkHttpClient()
    private val base = "http://10.0.2.2:8080"

    private fun api(method: String, path: String, token: String? = null, body: JSONObject? = null): JSONObject {
        val request = Request.Builder()
            .url(base + path)
            .method(method, body?.toString()?.toRequestBody("application/json".toMediaType()))
            .apply { if (token != null) header("Authorization", "Bearer $token") }
            .build()
        http.newCall(request).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw AssertionError("$method $path failed with HTTP ${response.code}: $raw")
            }
            return JSONObject(raw.ifBlank { "{}" })
        }
    }

    private fun waitForTag(tag: String, timeoutMs: Long = 40_000) {
        compose.waitUntil(timeoutMs) {
            compose.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun waitForText(text: String, timeoutMs: Long = 40_000) {
        compose.waitUntil(timeoutMs) {
            compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun warmInviteIntentJoinsTheRoom() {
        val suffix = (System.currentTimeMillis() % 100_000).toString()
        val hostName = "warmhost$suffix"
        val guestName = "warmguest$suffix"
        val password = "password123"

        // 1) Cold start: accept the safety notice and register the signed-in player through
        //    the real UI (the invite only auto-joins once there is a session).
        compose.waitUntil(40_000) {
            compose.onAllNodesWithTag("safety_accept").fetchSemanticsNodes().isNotEmpty() ||
                compose.onAllNodesWithTag("auth_username").fetchSemanticsNodes().isNotEmpty()
        }
        if (compose.onAllNodesWithTag("safety_accept").fetchSemanticsNodes().isNotEmpty()) {
            compose.onNodeWithTag("safety_accept").performClick()
        }
        waitForTag("auth_username")
        compose.onNodeWithTag("auth_username").performTextInput(guestName)
        compose.onNodeWithTag("auth_password").performTextInput(password)
        waitForText("New here? Create an account")
        compose.onAllNodesWithText("New here? Create an account")[0].performClick()
        waitForText("I already have an account")
        compose.onNodeWithTag("auth_submit").performClick()
        waitForTag("home_room_name")

        // 2) Someone else owns the room we are invited to.
        val hostToken = api(
            "POST",
            "/api/auth/register",
            body = JSONObject().put("username", hostName).put("password", password),
        ).getString("token")
        val joinCode = api(
            "POST",
            "/api/rooms",
            hostToken,
            JSONObject().put("name", "Warm invite room"),
        ).getJSONObject("room").getString("code")

        // 3) Deliver a real VIEW intent to the foregrounded activity. SINGLE_TOP (with
        //    NEW_TASK from an app context) reuses the visible instance, so this exercises
        //    MainActivity.onNewIntent -> DeepLink -> AppRoot auto-join, not a fresh launch.
        compose.activityRule.scenario.onActivity { _ ->
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("manhunt://join?code=$joinCode")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            InstrumentationRegistry.getInstrumentation().targetContext.startActivity(intent)
        }

        // 4) The warm path must navigate to the room and compose the MATCHDAY Lobby.
        waitForTag("room_code")
        waitForTag("lobby_list")
        val shownCode = compose.onNodeWithTag("room_code")
            .fetchSemanticsNode()
            .config[SemanticsProperties.Text]
            .joinToString("") { it.text }
        assertTrue(
            "Warm invite joined room $joinCode but the Lobby shows '$shownCode'",
            shownCode.uppercase().contains(joinCode.uppercase()),
        )
        // And it really replaced Home rather than stacking on top of it (allow the short
        // route transition to finish before asserting Home is gone).
        compose.waitUntil(10_000) {
            compose.onAllNodesWithTag("home_room_name").fetchSemanticsNodes().isEmpty()
        }
    }
}
