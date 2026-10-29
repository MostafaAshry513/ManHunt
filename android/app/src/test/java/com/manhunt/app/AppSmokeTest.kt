package com.manhunt.app

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import com.manhunt.app.ui.AuthScreen
import com.manhunt.app.ui.theme.ManHuntTheme

/**
 * Safety net for the whole UI stack: real composition through Robolectric,
 * no emulator or device required.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36])
class AppSmokeTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun authScreenRenders() {
        Graph.install(ApplicationProvider.getApplicationContext())
        composeRule.setContent {
            ManHuntTheme(darkTheme = true) { AuthScreen() }
        }
        composeRule.waitForIdle()

        val root = composeRule.onRoot().fetchSemanticsNode()
        assertTrue("Root should have a non-zero size", root.size.width > 0 && root.size.height > 0)
    }
}
