package com.manhunt.app

import com.manhunt.app.map.DARK_TILE_MATRIX
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.roundToInt

/**
 * Pins the dark-tile ColorMatrix (see DarkPalette.kt).
 *
 * Crucially it pins the OFFSET SLOTS to the 0..255-scale values (225/238/252).
 * android.graphics.ColorMatrix applies its matrix to 0..255-scaled channels —
 * the platform docs' invert sample uses offset 255 and still inverts — so a
 * "normalized" rewrite (offsets divided by 255) clamps every tile pixel to
 * black, and a double-negative misreading of the transform clamps to white.
 * Both failure modes pass silently otherwise; here they fail loudly.
 */
class DarkPaletteTest {

    /** Applies the 4x5 matrix the same way the platform does (0..255 scale, clamped). */
    private fun apply(r: Int, g: Int, b: Int): Triple<Int, Int, Int> {
        fun channel(row: Int, input: Int): Int {
            val m = DARK_TILE_MATRIX
            val raw = m[row] * r + m[row + 1] * g + m[row + 2] * b + m[row + 3] * 255 + m[row + 4]
            return raw.roundToInt().coerceIn(0, 255)
        }
        return Triple(channel(0, r), channel(5, g), channel(10, b))
    }

    @Test
    fun offsetsStayOnTheZeroTo255Scale() {
        assertEquals("Offset column must stay 0..255 (225f); dividing by 255 clamps the map to black", 225f, DARK_TILE_MATRIX[4])
        assertEquals(238f, DARK_TILE_MATRIX[9])
        assertEquals(252f, DARK_TILE_MATRIX[14])
        // Alpha row is identity, alpha offsets are zero, no alpha feedback.
        assertEquals(0f, DARK_TILE_MATRIX[3])
        assertEquals(0f, DARK_TILE_MATRIX[8])
        assertEquals(0f, DARK_TILE_MATRIX[13])
        assertEquals(1f, DARK_TILE_MATRIX[18])
        assertEquals(0f, DARK_TILE_MATRIX[19])
    }

    @Test
    fun validatedSamplesLandOnThePalette() {
        // (input RGB) -> expected, with ±2 tolerance for float noise across devices.
        fun assertNear(label: String, expected: Triple<Int, Int, Int>, actual: Triple<Int, Int, Int>, tol: Int = 2) {
            assertTrue(
                "$label: expected ~$expected, got $actual",
                actual.first in (expected.first - tol)..(expected.first + tol) &&
                    actual.second in (expected.second - tol)..(expected.second + tol) &&
                    actual.third in (expected.third - tol)..(expected.third + tol),
            )
        }
        // Pure light tile background -> deep navy, never white nor black.
        assertNear("white", Triple(6, 14, 23), apply(255, 255, 255))
        // OSM land colour #F2EFE9 -> dark navy (the dominant surface).
        assertNear("land", Triple(19, 28, 37), apply(242, 239, 233))
        // OSM water #AAD3DF -> deep blue-grey.
        assertNear("water", Triple(50, 59, 69), apply(170, 211, 223))
        // Grass tone -> muted blue-grey.
        assertNear("grass", Triple(119, 129, 141), apply(78, 142, 74))
        // Dark map-label text #333 -> light grey (labels must stay legible).
        assertNear("label", Triple(181, 193, 206), apply(51, 51, 51), tol = 3)
    }

    @Test
    fun transformPreservesContrast() {
        // A failure mode that collapses the palette (all-white / all-black) makes
        // distinct inputs identical; the validated transform never does that.
        val white = apply(255, 255, 255)
        val water = apply(170, 211, 223)
        val label = apply(51, 51, 51)
        assertNotEquals(white, water)
        assertNotEquals(white, label)
        assertNotEquals(water, label)
    }
}
