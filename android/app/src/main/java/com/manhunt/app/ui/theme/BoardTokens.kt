package com.manhunt.app.ui.theme

import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.manhunt.app.R

/**
 * MATCHDAY BOARD design tokens (design/redesign/tokens.md).
 *
 * Rules this file exists to enforce:
 * - type is brand structure, not decoration: display face only for loud words / clock / numerals,
 *   mono only for machine data, sentence case everywhere except [ManHuntType.state];
 * - grouping is done with 1 px rules and space; plates (2 dp radius) only where the user acts;
 * - elevation is zero: depth = overlap + hairline + scrim;
 * - the Board strip is always ink, even in the daylight theme.
 */

/** Bundled OFL faces from the approved brand motion kit (licence texts in res/raw). */
object BoardFonts {
    /** Big Shoulders Display - scoreboard/signage display face. */
    val display = FontFamily(
        Font(R.font.big_shoulders_bold, weight = FontWeight.Bold),
        Font(R.font.big_shoulders_regular, weight = FontWeight.Normal),
    )

    /** Instrument Sans - all functional UI and body copy. */
    val sans = FontFamily(
        Font(R.font.instrument_sans_regular, weight = FontWeight.Normal),
        Font(R.font.instrument_sans_bold, weight = FontWeight.Bold),
    )

    /** Red Hat Mono - machine data only (codes, timestamps, coordinates, state words). */
    val mono = FontFamily(Font(R.font.red_hat_mono_regular, weight = FontWeight.Normal))
}

/** Fixed brand colours; the theme translates them into semantic roles. */
object BoardColors {
    // Field / Board ink.
    val ink = Color(0xFF0B1220)
    val inkLift = Color(0xFF101A2C)
    val chalk = Color(0xFFE6EDF7)
    val chalkMuted = Color(0xFFA7B6CC)
    val chalkDim = Color(0xFF7C8DA8)

    // Structural rules.
    val hairlineInk = Color(0xFF2A3550)
    val hairlineStrongInk = Color(0xFF5E7198)
    val hairlineDay = Color(0xFFD3DCE8)
    val hairlineStrongDay = Color(0xFF7C8CA3)

    // Signals. Cyan = referee/field, coral = Prey, violet = Hunters, error = error only.
    val cyan = Color(0xFF22D3EE)
    val onCyanDark = Color(0xFF04222B)
    val onCyanLight = Color(0xFFFFFFFF)
    val coral = Color(0xFFFF7A59)
    val violet = Color(0xFFA79BFF)
    val errorDark = Color(0xFFFF8A8A)
    val errorLight = Color(0xFFB91C1C)
    val amber = Color(0xFFF0A43A)

    // Daylight chalk: ink type, white plates, hairlines, darker signal colours.
    val daylight = Color(0xFFF7F9FC)
    val daylightInk = Color(0xFF0F172A)
    val daylightMuted = Color(0xFF475569)
}

/** Theme-aware semantic roles. The Board itself always uses [board]. */
object BoardTheme {
    @Composable
    fun isDark(): Boolean = MaterialTheme.colorScheme.background.luminance() < 0.5f

    /** 1 px structural rule (never the only border of an interactive control). */
    @Composable
    fun hairline(): Color = if (isDark()) BoardColors.hairlineInk else BoardColors.hairlineDay

    /** Interactive border (inputs, outlined buttons, plates), >= 3:1 non-text. */
    @Composable
    fun hairlineStrong(): Color =
        if (isDark()) BoardColors.hairlineStrongInk else BoardColors.hairlineStrongDay

    /** The Board plate: raised ink in dark, plain ink in light. Chalk text in both. */
    @Composable
    fun board(): Color = if (isDark()) MaterialTheme.colorScheme.surface else BoardColors.ink

    /** Muted text in the current theme. */
    @Composable
    fun muted(): Color = MaterialTheme.colorScheme.onSurfaceVariant
}

/**
 * Spacing scale from tokens.md §4.1. Only these values exist; if you need another number the
 * design system does not cover it yet.
 */
object BoardSpace {
    val s1: Dp = 2.dp
    val s2: Dp = 4.dp
    val s3: Dp = 6.dp
    val s4: Dp = 8.dp
    val s5: Dp = 12.dp
    val s6: Dp = 16.dp
    val s7: Dp = 20.dp
    val s8: Dp = 24.dp
    val s9: Dp = 32.dp
    val s10: Dp = 40.dp
    val s11: Dp = 48.dp
    val s12: Dp = 64.dp

    /** Screen side margin on phones; 24 dp on >= 600 dp windows. */
    val screen: Dp = 16.dp
    val screenWide: Dp = 24.dp

    /** Reading column maximum for prose. */
    val readingMax: Dp = 560.dp
}

/** Shape tokens (tokens.md §5.1). Pill shapes are banned. */
object BoardShape {
    /** Plates, buttons, inputs, code cells, sheet top corners, dialogs. */
    val plate = RoundedCornerShape(2.dp)

    /** Bottom sheet: square shoulders, 2 dp top radius. */
    val sheet = RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp)

    /** Kit/ticket tag silhouette; mirrors automatically in RTL. */
    val tag = CutCornerShape(topEnd = 8.dp)

    /** State word tag: smaller cut. */
    val stateTag = CutCornerShape(topEnd = 4.dp)

    /** Chalk rule / field surfaces. */
    val field = RoundedCornerShape(0.dp)

    val codeCell = RoundedCornerShape(2.dp)
}

/** Stable metadata sizes (tokens.md §4.1/: §7). */
object BoardMetrics {
    val boardMinHeight: Dp = 84.dp
    val boardPaddingH: Dp = 16.dp
    val boardPaddingV: Dp = 10.dp
    val clockSize: TextUnit = 44.sp
    val clockHeroSize: TextUnit = 56.sp
    val buttonPrimaryHeight: Dp = 56.dp
    val buttonSecondaryHeight: Dp = 48.dp
    val touchTarget: Dp = 48.dp
    val inputHeight: Dp = 52.dp
    val codeCellWidth: Dp = 48.dp
    val codeCellHeight: Dp = 56.dp
    val codeCellGap: Dp = 8.dp
    val tagHeight: Dp = 28.dp
    val stateTagHeight: Dp = 20.dp
    val listRow: Dp = 56.dp
    val sheetMaxFraction: Float = 0.60f
}

/**
 * True when the UI language is Arabic. Provided by [ManHuntTheme]: Arabic swaps the display face
 * for the platform Arabic sans and removes all tracking (tokens.md §2.3).
 */
val LocalBoardArabic = androidx.compose.runtime.staticCompositionLocalOf { false }

/**
 * Type styles from tokens.md §2. The Latin set uses the bundled faces; the Arabic set swaps the
 * display face for the platform Arabic sans and removes tracking. M3 slot mapping lives in
 * Theme.kt; these are the extra named styles the Board system needs.
 */
object ManHuntType {
    private val arabic: Boolean
        @Composable get() = LocalBoardArabic.current

    /** display.xl - result winner word only. */
    @Composable
    fun displayXl(): TextStyle =
        displayStyle(if (arabic) 56.sp else 64.sp, if (arabic) 64.sp else 58.sp, trackingEm = -0.01f)

    /** display.l - Auth/Home permanent line. */
    @Composable
    fun displayL(): TextStyle =
        displayStyle(if (arabic) 42.sp else 48.sp, if (arabic) 52.sp else 44.sp, trackingEm = -0.01f)

    /** display.m - rules-plate titles, big score numbers. */
    @Composable
    fun displayM(): TextStyle =
        displayStyle(if (arabic) 32.sp else 36.sp, if (arabic) 42.sp else 34.sp, trackingEm = -0.005f)

    /** display.s - declaration headlines. */
    @Composable
    fun displayS(): TextStyle =
        displayStyle(if (arabic) 26.sp else 28.sp, if (arabic) 34.sp else 30.sp, trackingEm = 0f)

    /**
     * board.clock - the live scoreboard clock. Digits stay Latin display/tabular in Arabic too
     * (tokens.md §2.4), so the family is always Big Shoulders.
     */
    @Composable
    fun boardClock(hero: Boolean = false): TextStyle {
        val size = when {
            arabic && hero -> 48.sp
            arabic -> 40.sp
            hero -> 56.sp
            else -> 44.sp
        }
        return TextStyle(
            fontFamily = BoardFonts.display,
            fontWeight = FontWeight.Bold,
            fontSize = size,
            lineHeight = size,
            letterSpacing = 0.em,
            fontFeatureSettings = "tnum",
        )
    }

    /** board.meta - zone radius / prey count numerals in the Board gutter (Latin tabular). */
    @Composable
    fun boardMeta(): TextStyle = TextStyle(
        fontFamily = BoardFonts.display,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 20.sp,
        fontFeatureSettings = "tnum",
    )

    /** data - invite code, timestamps, version, coordinates. Latin mono always. */
    @Composable
    fun data(size: TextUnit = 12.sp): TextStyle =
        monoStyle(if (arabic) 12.sp else size, if (arabic) 18.sp else 16.sp, trackingEm = 0.04f)

    /** data.small - legal/attribution/version only (>= 7:1 contrast required). */
    @Composable
    fun dataSmall(): TextStyle = monoStyle(11.sp, 14.sp, trackingEm = 0.04f)

    /**
     * state - machine state word, uppercase tracked mono in Latin. In Arabic the mono face has
     * no Arabic glyphs, so the UI sans is used with no tracking (honest fallback, no tofu).
     */
    @Composable
    fun state(): TextStyle =
        if (arabic) {
            TextStyle(
                fontFamily = FontFamily.SansSerif,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                letterSpacing = 0.em,
            )
        } else {
            monoStyle(11.sp, 14.sp, trackingEm = 0.10f)
        }

    /** headline - screen titles in the UI face. */
    @Composable
    fun headline(): TextStyle = uiStyle(22.sp, if (arabic) 32.sp else 28.sp)

    /** title - plate/sheet titles, roster names. */
    @Composable
    fun title(): TextStyle = uiStyle(17.sp, if (arabic) 26.sp else 22.sp)

    /** body - default copy. */
    @Composable
    fun body(): TextStyle = uiStyle(15.sp, if (arabic) 24.sp else 22.sp)

    /** body.small - supporting copy. */
    @Composable
    fun bodySmall(): TextStyle = uiStyle(13.sp, if (arabic) 21.sp else 19.sp)

    /** label - button/row labels. */
    @Composable
    fun label(): TextStyle = uiStyle(13.sp, if (arabic) 20.sp else 16.sp)

    /** caption - muted metadata. */
    @Composable
    fun caption(): TextStyle = uiStyle(12.sp, if (arabic) 19.sp else 16.sp)

    @Composable
    private fun displayFamily(): FontFamily =
        if (arabic) FontFamily.SansSerif else BoardFonts.display

    @Composable
    private fun uiFamily(): FontFamily = if (arabic) FontFamily.SansSerif else BoardFonts.sans

    @Composable
    private fun displayStyle(size: TextUnit, lineHeight: TextUnit, trackingEm: Float): TextStyle =
        TextStyle(
            fontFamily = displayFamily(),
            fontWeight = FontWeight.Bold,
            fontSize = size,
            lineHeight = lineHeight,
            letterSpacing = if (arabic) 0.em else trackingEm.em,
        )

    @Composable
    private fun monoStyle(size: TextUnit, lineHeight: TextUnit, trackingEm: Float): TextStyle =
        TextStyle(
            fontFamily = BoardFonts.mono,
            fontWeight = FontWeight.Normal,
            fontSize = size,
            lineHeight = lineHeight,
            letterSpacing = trackingEm.em,
        )

    @Composable
    private fun uiStyle(size: TextUnit, lineHeight: TextUnit): TextStyle =
        TextStyle(
            fontFamily = uiFamily(),
            fontWeight = FontWeight.Normal,
            fontSize = size,
            lineHeight = lineHeight,
            letterSpacing = 0.em,
        )
}
