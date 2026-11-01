package com.manhunt.app

import android.graphics.Bitmap
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.LocalLanguage
import com.manhunt.app.i18n.LocalStrings
import com.manhunt.app.i18n.arabicStrings
import com.manhunt.app.ui.AuthScreen
import com.manhunt.app.ui.BrandMotionBanner
import com.manhunt.app.ui.HomeScreen
import com.manhunt.app.ui.theme.ManHuntTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Renders the brand hero's static first frame (the frame the loop starts and ends on).
 *
 * The Compose test framework's InfiniteAnimationPolicy already cancels infinite animations
 * while waiting for idle; `animate = false` makes that explicit here, so these screenshots
 * are deterministic and the running loop's frame 0 is identical to what is captured.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class BrandMotionTest {

    @get:Rule
    val rule = createComposeRule()

    @Test
    fun brandBannerHasStableTags() {
        rule.setContent { BrandHeroPreview(dark = true) }
        rule.waitForIdle()
        rule.onNodeWithTag("brand_motion_banner").assertExists()
        rule.onNodeWithTag("brand_motion_slogan").assertExists()
    }

    @Test
    fun captureBrandHeroDark() = capture("30-brand-hero-dark.png", dark = true)

    @Test
    fun captureBrandHeroLight() = capture("30b-brand-hero-light.png", dark = false)

    @Test
    fun captureBrandHeroArabicRtl() {
        capture("30c-brand-hero-arabic-rtl.png", dark = true, arabic = true)
    }

    @Test
    fun homeShowsTheBrandHero() {
        Graph.install(ApplicationProvider.getApplicationContext())
        // Inspection mode freezes the loop for this structural check; the hero is the same
        // composable in production, just animated.
        rule.setContent {
            CompositionLocalProvider(LocalInspectionMode provides true) {
                ManHuntTheme(darkTheme = true) { HomeScreen({}, {}, {}) }
            }
        }
        rule.waitForIdle()
        rule.onNodeWithTag("brand_motion_banner").assertExists()
    }

    @Test
    fun authShowsTheBrandHero() {
        Graph.install(ApplicationProvider.getApplicationContext())
        rule.setContent {
            CompositionLocalProvider(LocalInspectionMode provides true) {
                ManHuntTheme(darkTheme = true) { AuthScreen() }
            }
        }
        rule.waitForIdle()
        rule.onNodeWithTag("brand_motion_banner").assertExists()
    }

    private fun capture(name: String, dark: Boolean, arabic: Boolean = false) {
        rule.setContent {
            if (arabic) {
                CompositionLocalProvider(
                    LocalLanguage provides AppLanguage.Arabic,
                    LocalStrings provides arabicStrings(),
                    LocalLayoutDirection provides LayoutDirection.Rtl,
                ) {
                    BrandHeroPreview(dark = dark)
                }
            } else {
                BrandHeroPreview(dark = dark)
            }
        }
        rule.waitForIdle()
        val bitmap = rule.onRoot().captureToImage().asAndroidBitmap()
        val out = File("build/screenshots/$name")
        out.parentFile?.mkdirs()
        out.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}

@Composable
private fun BrandHeroPreview(dark: Boolean) {
    ManHuntTheme(darkTheme = dark) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            BrandMotionBanner(
                modifier = Modifier.padding(20.dp),
                compact = false,
                animate = false,
            )
        }
    }
}
