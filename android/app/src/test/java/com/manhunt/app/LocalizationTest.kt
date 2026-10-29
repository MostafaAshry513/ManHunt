package com.manhunt.app

import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.translate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pins rendered copy to its Arabic entries. A rendered string whose key is missing
 * from the map falls through to English *silently* — invisible on CI-only builds.
 * These tests fail loudly instead (the exact defect class of the 0.8.0 review).
 */
class LocalizationTest {

    /** Same concatenations the SafetyScreen renders. */
    private val safetyParagraphs = listOf(
        "While you are on the Prey team in an active match, your phone sends its position " +
            "to the server at the interval the room admin set (5 minutes by default). " +
            "Only players on the Hunters team can see it, and only during the hunting phase. " +
            "A permanent notification is shown while tracking is active. Tracking stops when " +
            "the match ends.",
        "Precise reports are kept for 30 days by default and then deleted. Match summaries " +
            "are kept without byte-level GPS trails.",
        "• Respect property and local law. Never trespass.\n" +
            "• Stay out of roads, traffic and hazardous ground.\n" +
            "• Never run while looking at your phone.\n" +
            "• Stop immediately if conditions or people make it unsafe.\n" +
            "• Respect people who are not playing.",
        "ManHunt is a game. It is not an emergency, rescue or child-tracking service, and " +
            "GPS can be inaccurate, delayed or missing. Do not rely on it to find a person in danger.",
    )

    /** Copy surfaced by the hunt-rules editor and its dialogs. */
    private val huntRulesCopy = listOf(
        "Applies to the next match. Rules are enforced by the server.",
        "Prey head start (minutes)",
        "Match duration (minutes)",
        "Location report interval (minutes)",
        "Hunters can see trails",
        "Play area",
        "Open",
        "Zone radius (metres)",
        "Tap the map to move the zone centre",
        "Enable GPS or tap the map to place the zone",
        "Place the zone centre on the map first",
        "Shrink over time",
        "Every (min)",
        "By (m)",
        "Save",
    )

    /** Fallback names and one-off dialog/system copy. */
    private val misc = listOf(
        "Try again", "Loading", "Back", "A hunter", "a prey", "Hunt rules",
        "You are abandoning this hunt. It runs without you.",
    )

    @Test
    fun safetyParagraphsAreTranslated() {
        safetyParagraphs.forEach { english ->
            assertTrue("Untranslated: $english", translate(english, AppLanguage.Arabic) != english)
        }
    }

    @Test
    fun huntRulesAndDialogCopyIsTranslated() {
        (huntRulesCopy + misc).forEach { english ->
            assertTrue("Untranslated: $english", translate(english, AppLanguage.Arabic) != english)
        }
    }

    @Test
    fun englishPassesThroughUntouched() {
        assertEquals("Ready", translate("Ready", AppLanguage.English))
    }
}
