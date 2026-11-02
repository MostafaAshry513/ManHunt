package com.manhunt.app

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performSemanticsAction
import com.manhunt.app.ui.BoardScaleSlider
import com.manhunt.app.ui.theme.ManHuntTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Pins the redesigned Settings text-size control: one coherent MATCHDAY slider with a single
 * accessible range/steps model and a SetProgress action (the old Material slider exposed the
 * step dot-rail + thumb as overlapping affordances and drove the capture/audit complaints).
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class BoardScaleSliderTest {

    @get:Rule
    val rule = createComposeRule()

    @Test
    fun sliderExposesOneAccessibleSteppedRange() {
        val changes = mutableIntStateOf(0)
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxWidth()) {
                    BoardScaleSlider(
                        value = 1.0f,
                        onValueChange = { changes.intValue++ },
                        onValueChangeFinished = {},
                        valueRange = 0.85f..1.35f,
                        steps = 9,
                        testTag = "text_scale_slider",
                    )
                }
            }
        }
        rule.waitForIdle()
        val node = rule.onNodeWithTag("text_scale_slider").fetchSemanticsNode()
        // Accessible value + drive action; the visual dot-rail/thumbs no longer exist.
        assertEquals("100%", node.config[SemanticsProperties.StateDescription])
        assertTrue(
            "slider must expose a SetProgress action for TalkBack/automation",
            SemanticsActions.SetProgress in node.config,
        )
    }

    @Test
    fun setProgressSnapsToTheStopsAndCommitsOnRelease() {
        var value by mutableFloatStateOf(1.0f)
        var commits = 0
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxWidth()) {
                    BoardScaleSlider(
                        value = value,
                        onValueChange = { value = it },
                        onValueChangeFinished = { commits++ },
                        valueRange = 0.85f..1.35f,
                        steps = 9,
                        testTag = "text_scale_slider",
                    )
                }
            }
        }
        rule.waitForIdle()
        rule.onNodeWithTag("text_scale_slider").performSemanticsAction(SemanticsActions.SetProgress) {
            it(1.35f)
        }
        rule.waitForIdle()
        assertEquals(1.35f, value, 0.0001f)
        assertTrue("release must commit the docked value", commits >= 1)

        // Out-of-range targets clamp instead of producing an impossible text scale.
        rule.onNodeWithTag("text_scale_slider").performSemanticsAction(SemanticsActions.SetProgress) {
            it(3f)
        }
        rule.waitForIdle()
        assertEquals(1.35f, value, 0.0001f)
    }
}
