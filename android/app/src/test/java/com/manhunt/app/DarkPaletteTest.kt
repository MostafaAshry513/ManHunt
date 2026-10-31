package com.manhunt.app

import com.manhunt.app.map.DARK_TILE_MATRIX
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.roundToInt

/**
 * Pins the Deep Teal tile ColorMatrix (see DarkPalette.kt).
 *
 * Crucially it pins the OFFSET SLOTS to the 0..255-scale values (86.7 / 229.5 / 255).
 * android.graphics.ColorMatrix applies its matrix to 0..255-scaled channels - the
 * platform docs' invert sample uses offset 255 and still inverts - so a "normalized"
 * rewrite (offsets divided by 255) clamps every tile pixel to black, and a
 * double-negative misreading of the transform clamps to white. Both failure modes pass
 * silently otherwise; here they fail loudly.
 */
class DarkPaletteTest {

    /** Applies the 4x5 matrix the same way the platform does (0..255 scale, clamped). */
    private fun apply(r: Int, g: Int, b: Int): Triple<Int, Int, Int> {
        fun channel(row: Int): Int {
            val m = DARK_TILE_MATRIX
            val raw = m[row] * r + m[row + 1] * g + m[row + 2] * b + m[row + 3] * 255 + m[row + 4]
            return raw.roundToInt().coerceIn(0, 255)
        }
        return Triple(channel(0), channel(5), channel(10))
    }

    @Test
    fun offsetsStayOnTheZeroTo255Scale() {
        assertEquals("Red highlight offset must stay on the 0..255 scale", 86.7f, DARK_TILE_MATRIX[4], 0.001f)
        assertEquals(229.5f, DARK_TILE_MATRIX[9], 0.001f)
        assertEquals(255f, DARK_TILE_MATRIX[14], 0f)
        // Alpha row is identity, alpha offsets are zero, no alpha feedback.
        assertEquals(0f, DARK_TILE_MATRIX[3])
        assertEquals(0f, DARK_TILE_MATRIX[8])
        assertEquals(0f, DARK_TILE_MATRIX[13])
        assertEquals(1f, DARK_TILE_MATRIX[18])
        assertEquals(0f, DARK_TILE_MATRIX[19])
    }

    @Test
    fun validatedSamplesLandOnThePalette() {
        fun assertNear(label: String, expected: Triple<Int, Int, Int>, actual: Triple<Int, Int, Int>, tol: Int = 2) {
            assertTrue(
                "$label: expected ~$expected, got $actual",
                actual.first in (expected.first - tol)..(expected.first + tol) &&
                    actual.second in (expected.second - tol)..(expected.second + tol) &&
                    actual.third in (expected.third - tol)..(expected.third + tol),
            )
        }
        // Light tile background -> near-black navy, never white or grey wash.
        assertNear("white", Triple(3, 10, 26), apply(255, 255, 255))
        // OSM land colour #F2EFE9 -> dark navy.
        assertNear("land", Triple(8, 24, 40), apply(242, 239, 233))
        // OSM water #AAD3DF -> deep teal.
        assertNear("water", Triple(21, 57, 75), apply(170, 211, 223))
        // Grass tone -> muted teal.
        assertNear("grass", Triple(49, 131, 151), apply(78, 142, 74))
        // Dark map-label text #333 -> bright cyan-grey (labels must stay legible).
        assertNear("label", Triple(70, 186, 209), apply(51, 51, 51), tol = 3)
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
