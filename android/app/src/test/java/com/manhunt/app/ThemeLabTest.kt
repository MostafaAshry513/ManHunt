package com.manhunt.app

import android.graphics.Bitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.ui.HomeScreen
import com.manhunt.app.ui.theme.ManHuntTheme
import com.manhunt.app.ui.theme.MasterTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Theme lab: the same real Home screen rendered at 390 dp under every candidate master colour.
 * These are evidence for choosing the next brand accent, not a separate mockup system.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w390dp-h844dp-xxhdpi")
class ThemeLabTest {

    @get:Rule
    val rule = createComposeRule()

    private fun capture(theme: MasterTheme) {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent {
            ManHuntTheme(darkTheme = true, master = theme) {
                HomeScreen({}, {}, {})
            }
        }
        rule.waitForIdle()
        val bitmap = rule.onRoot().captureToImage().asAndroidBitmap()
        val out = File("build/theme-lab/${theme.id}-home.png")
        out.parentFile?.mkdirs()
        out.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun floodlight() = capture(MasterTheme.Floodlight)
    @Test fun sodium() = capture(MasterTheme.Sodium)
    @Test fun highVis() = capture(MasterTheme.HighVis)
    @Test fun chalk() = capture(MasterTheme.Chalk)
    @Test fun pitch() = capture(MasterTheme.Pitch)
}
