package com.manhunt.app

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.printToString
import android.Manifest
import android.graphics.Bitmap
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
import java.io.File

/**
 * End-to-end match on a real Android emulator in CI.
 *
 * One player is driven through the real UI; the opponent is a real HTTP client.
 * Covers: safety -> register -> create room -> second player joins -> teams ->
 * readiness -> server-authorized start -> live chat sync -> tag request ->
 * confirmation -> elimination.
 */
@RunWith(AndroidJUnit4::class)
class InGameSmokeTest {

    @get:Rule
    val compose = createAndroidComposeRule<MainActivity>()

    // The room requests these permissions on entering a match; granting them up
    // front keeps the system dialogs from covering the Compose hierarchy.
    @get:Rule
    val permissions: GrantPermissionRule = GrantPermissionRule.grant(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.POST_NOTIFICATIONS,
    )

    private val http = OkHttpClient()
    private val base = "http://10.0.2.2:8080"

    /** Full-screen PNGs pulled by scripts/ci/run-emulator-tests.sh for visual review. */
    private fun capture(name: String) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val bitmap = instrumentation.uiAutomation.takeScreenshot()
        val dir = File(instrumentation.targetContext.filesDir, "screenshots")
        dir.mkdirs()
        val file = File(dir, "$name.png")
        file.outputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        android.util.Log.i("ManHuntTest", "screenshot ${file.absolutePath} ${file.length()}")
    }

    private fun api(method: String, path: String, token: String? = null, body: JSONObject? = null): JSONObject {
        val request = Request.Builder()
            .url(base + path)
            .method(
                method,
                body?.toString()?.toRequestBody("application/json".toMediaType()),
            )
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

    private fun waitForText(text: String, timeoutMs: Long = 30_000) {
        compose.waitUntil(timeoutMs) {
            compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun waitForTag(tag: String, timeoutMs: Long = 30_000) {
        compose.waitUntil(timeoutMs) {
            compose.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun playAFullMatch() {
        val suffix = (System.currentTimeMillis() % 100_000).toString()
        val aliceName = "alice$suffix"
        val bobName = "bob$suffix"

        // First run: accept the safety notice. The consent button is pinned at the bottom of
        // the safety screen, so once it is composed it is directly clickable.
        compose.waitUntil(40_000) {
            compose.onAllNodesWithTag("safety_accept").fetchSemanticsNodes().isNotEmpty() ||
                compose.onAllNodesWithTag("auth_username").fetchSemanticsNodes().isNotEmpty()
        }
        if (compose.onAllNodesWithTag("safety_accept").fetchSemanticsNodes().isNotEmpty()) {
            // Capture the first-run Roles page for docs/UI review before leaving it.
            capture("00-roles")
            compose.onNodeWithTag("safety_accept").performClick()
        }

        waitForTag("auth_username", 40_000)
        compose.onNodeWithTag("auth_username").performTextInput(aliceName)
        compose.onNodeWithTag("auth_password").performTextInput("password123")

        // The app opens on "Sign in"; switch to registration first. Without this
        // a brand-new username gets HTTP 401 and never reaches Home.
        waitForText("New here? Create an account")
        compose.onAllNodesWithText("New here? Create an account")[0].performClick()
        waitForText("Create your account")
        compose.onNodeWithTag("auth_submit").performClick()

        try {
            // Section labels are rendered uppercase ("START A GAME"), so wait on
            // the stable tag instead of the transformed text.
            waitForTag("home_room_name", 40_000)
        } catch (failure: Throwable) {
            println("==== SCREEN AFTER REGISTRATION ATTEMPT ====")
            println(compose.onRoot().printToString())
            throw failure
        }

        // Regression: system back from Settings must return Home, not finish the Activity.
        compose.onNodeWithTag("home_settings").performClick()
        waitForTag("settings_tab_0", 20_000)
        compose.activityRule.scenario.onActivity { activity ->
            activity.onBackPressedDispatcher.onBackPressed()
        }
        waitForTag("home_room_name", 20_000)

        compose.onNodeWithTag("home_room_name").performTextInput("CI Room")
        compose.onNodeWithTag("home_create").performClick()
        waitForTag("room_code")

        val code = compose.onNodeWithTag("room_code")
            .fetchSemanticsNode()
            .config[SemanticsProperties.Text]
            .joinToString("") { it.text }

        // Opponent: real client against the same server.
        val bob = api("POST", "/api/auth/register", body = JSONObject().put("username", bobName).put("password", "password123"))
        val bobToken = bob.getString("token")
        val joined = api("POST", "/api/rooms/join", bobToken, JSONObject().put("code", code))
        val roomId = joined.getJSONObject("room").getString("id")

        // Default head start is 5 minutes; the test must reach HUNTING quickly.
        val alice = api("POST", "/api/auth/login", body = JSONObject().put("username", aliceName).put("password", "password123"))
        api("PATCH", "/api/rooms/$roomId/settings", alice.getString("token"), JSONObject().put("headStartSec", 0))

        api("POST", "/api/rooms/$roomId/team", bobToken, JSONObject().put("team", "hunters"))
        api("POST", "/api/rooms/$roomId/ready", bobToken, JSONObject().put("ready", true))

        // Alice readies and starts through the UI.
        compose.onNodeWithTag("lobby_list").performScrollToNode(hasTestTag("ready_button"))
        waitForTag("ready_button")
        capture("01-lobby")
        compose.onNodeWithTag("ready_button").performClick()
        compose.onNodeWithTag("lobby_list").performScrollToNode(hasTestTag("start_match"))
        waitForTag("start_match")
        compose.onNodeWithTag("start_match").performClick()
        waitForText("HUNTING", 40_000)
        Thread.sleep(5_000)
        capture("02-hunting")

        // Chat: UI message must reach the server and the opponent.
        compose.onNodeWithTag("tab_chat").performClick()
        waitForTag("chat_input")
        val chatText = "hello from alice $suffix"
        compose.onNodeWithTag("chat_input").performTextInput(chatText)
        compose.onNodeWithTag("chat_send").performClick()

        var chatSeenByBob = false
        repeat(30) {
            val messages = api("GET", "/api/rooms/$roomId/messages", bobToken)
            val array = messages.optJSONArray("messages")
            for (i in 0 until (array?.length() ?: 0)) {
                if (array!!.getJSONObject(i).optString("body") == chatText) chatSeenByBob = true
            }
            if (!chatSeenByBob) Thread.sleep(1_000)
        }
        assertTrue("chat did not reach the opponent", chatSeenByBob)
        capture("03-chat")

        // Opponent tags Alice; she confirms in the real UI.
        val state = api("GET", "/api/rooms/$roomId", bobToken)
        val members = state.getJSONArray("members")
        var aliceId = ""
        for (i in 0 until members.length()) {
            val member = members.getJSONObject(i)
            if (member.getString("username") == aliceName) aliceId = member.getString("userId")
        }
        assertTrue("alice missing from room state", aliceId.isNotEmpty())

        api("POST", "/api/rooms/$roomId/tags", bobToken, JSONObject().put("preyId", aliceId))
        waitForText("Tag claim", 30_000)
        compose.onAllNodesWithText("Confirm")[0].performClick()
        // v0.9.0 shows a dedicated result dialog. Accept the live system chat line too,
        // because the dialog may not have recomposed yet when this runs.
        compose.waitUntil(30_000) {
            compose.onAllNodesWithText("Hunt result").fetchSemanticsNodes().isNotEmpty() ||
                compose.onAllNodesWithText("You were tagged").fetchSemanticsNodes().isNotEmpty() ||
                compose.onAllNodesWithText("Match over - Hunters win!").fetchSemanticsNodes().isNotEmpty()
        }
        capture("04-result")
    }
}
