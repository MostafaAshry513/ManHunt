package com.manhunt.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.LocalLanguage


/**
 * ManHunt design tokens.
 *
 * Screens should compose from these scales instead of ad-hoc numbers so cards,
 * dialogs and empty states stay visually consistent between screens.
 */

/** 4 dp-based spacing scale. */
object ManHuntSpacing {
    val xxs: Dp = 2.dp
    val xs: Dp = 4.dp
    val sm: Dp = 8.dp
    val md: Dp = 12.dp
    val lg: Dp = 16.dp
    val xl: Dp = 20.dp
    val xxl: Dp = 28.dp
    val section: Dp = 32.dp

    /** Standard screen edge padding. */
    val screen: Dp = 20.dp

    /** Internal padding of a card/box surface. */
    val card: Dp = 18.dp
}

/** Corner radius scale, aligned with [ManHuntShapes]. */
object ManHuntRadius {
    val xs: Dp = 8.dp
    val sm: Dp = 12.dp
    val md: Dp = 16.dp
    val lg: Dp = 20.dp
    val xl: Dp = 28.dp
    val pill: Dp = 999.dp
}

/** Elevation scale; ManHunt is a flat, border-led design, so most surfaces stay at 0. */
object ManHuntElevation {
    val flat: Dp = 0.dp
    val card: Dp = 1.dp
    val raised: Dp = 3.dp
    val floating: Dp = 6.dp
}

/** Minimum interaction sizes, kept at or above the 48 dp touch-target guidance. */
object ManHuntSizes {
    val touchTarget: Dp = 48.dp
    val button: Dp = 52.dp
    val chip: Dp = 36.dp
    val mapHeight: Dp = 220.dp
}

// Dark: deep navy, electric teal, coral prey, violet hunters.
private val DarkColors = darkColorScheme(
    primary = Color(0xFF22D3EE),
    onPrimary = Color(0xFF04222B),
    primaryContainer = Color(0xFF0E3B47),
    onPrimaryContainer = Color(0xFFB7F3FF),
    // #A79BFF keeps the HUNTERS pill above WCAG AA (4.5:1) on its tinted background.
    secondary = Color(0xFFA79BFF),
    onSecondary = Color(0xFF14102E),
    secondaryContainer = Color(0xFF241E4A),
    onSecondaryContainer = Color(0xFFDAD1FF),
    tertiary = Color(0xFFFF7A59),
    onTertiary = Color(0xFF2A0D05),
    tertiaryContainer = Color(0xFF442114),
    onTertiaryContainer = Color(0xFFFFD9CE),
    background = Color(0xFF0B1220),
    onBackground = Color(0xFFE6EDF7),
    surface = Color(0xFF131C2E),
    onSurface = Color(0xFFE6EDF7),
    surfaceVariant = Color(0xFF1D2840),
    onSurfaceVariant = Color(0xFFA7B6CC),
    outline = Color(0xFF3A4867),
    outlineVariant = Color(0xFF2A3550),
    error = Color(0xFFFF8A8A),
    onError = Color(0xFF2A0808),
    errorContainer = Color(0xFF44232A),
    onErrorContainer = Color(0xFFFFD9DC),
    inverseSurface = Color(0xFFE6EDF7),
    inverseOnSurface = Color(0xFF131C2E),
    inversePrimary = Color(0xFF0E7490),
)

// Light: soft neutral, darker teal/orange/violet that keep AA contrast.
private val LightColors = lightColorScheme(
    primary = Color(0xFF0C6B84),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFCDEFF7),
    onPrimaryContainer = Color(0xFF062E38),
    secondary = Color(0xFF5B21B6),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFEDE8FF),
    onSecondaryContainer = Color(0xFF2A1660),
    // Darker orange so PREY labels keep AA contrast on their tinted pill (light theme).
    tertiary = Color(0xFFB33A0F),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFFE4D8),
    onTertiaryContainer = Color(0xFF3F1404),
    background = Color(0xFFF7F9FC),
    onBackground = Color(0xFF0F172A),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFE6ECF5),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFB6C2D4),
    outlineVariant = Color(0xFFD3DCE8),
    error = Color(0xFFB91C1C),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = Color(0xFF5F1212),
    inverseSurface = Color(0xFF0F172A),
    inverseOnSurface = Color(0xFFF7F9FC),
    inversePrimary = Color(0xFF22D3EE),
)


/**
 * MATCHDAY BOARD typography, Latin set (tokens.md §2.2). Big Shoulders Display carries loud
 * words and the clock, Instrument Sans carries all UI, Red Hat Mono carries machine data.
 */
private val LatinTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = BoardFonts.display,
        fontSize = 64.sp,
        lineHeight = 58.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-0.01).em,
    ),
    displayMedium = TextStyle(
        fontFamily = BoardFonts.display,
        fontSize = 48.sp,
        lineHeight = 44.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-0.01).em,
    ),
    displaySmall = TextStyle(
        fontFamily = BoardFonts.display,
        fontSize = 36.sp,
        lineHeight = 34.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-0.005).em,
    ),
    headlineLarge = TextStyle(
        fontFamily = BoardFonts.display,
        fontSize = 28.sp,
        lineHeight = 30.sp,
        fontWeight = FontWeight.Bold,
    ),
    headlineMedium = TextStyle(
        fontFamily = BoardFonts.display,
        fontSize = 28.sp,
        lineHeight = 30.sp,
        fontWeight = FontWeight.Bold,
    ),
    headlineSmall = TextStyle(
        fontFamily = BoardFonts.sans,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        fontWeight = FontWeight.Bold,
    ),
    titleLarge = TextStyle(
        fontFamily = BoardFonts.sans,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        fontWeight = FontWeight.Bold,
    ),
    titleMedium = TextStyle(
        fontFamily = BoardFonts.sans,
        fontSize = 17.sp,
        lineHeight = 22.sp,
        fontWeight = FontWeight.Bold,
    ),
    titleSmall = TextStyle(
        fontFamily = BoardFonts.sans,
        fontSize = 13.sp,
        lineHeight = 16.sp,
        fontWeight = FontWeight.Bold,
    ),
    bodyLarge = TextStyle(fontFamily = BoardFonts.sans, fontSize = 15.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontFamily = BoardFonts.sans, fontSize = 13.sp, lineHeight = 19.sp),
    bodySmall = TextStyle(fontFamily = BoardFonts.sans, fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(
        fontFamily = BoardFonts.sans,
        fontSize = 13.sp,
        lineHeight = 16.sp,
        fontWeight = FontWeight.Bold,
    ),
    // state / dataSmall: the only mono slots. Uppercase is applied by the component, not here.
    labelMedium = TextStyle(
        fontFamily = BoardFonts.mono,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.10.em,
    ),
    labelSmall = TextStyle(
        fontFamily = BoardFonts.mono,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.04.em,
    ),
)

/**
 * Arabic set (tokens.md §2.3): platform Arabic sans, no tracking, larger line heights and the
 * display face replaced. Digits that are machine data stay Latin/tabular (see ManHuntType).
 */
private val ArabicTypography = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 56.sp, lineHeight = 64.sp, fontWeight = FontWeight.Bold),
    displayMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 42.sp, lineHeight = 52.sp, fontWeight = FontWeight.Bold),
    displaySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 32.sp, lineHeight = 42.sp, fontWeight = FontWeight.Bold),
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 26.sp, lineHeight = 34.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 26.sp, lineHeight = 34.sp, fontWeight = FontWeight.Bold),
    headlineSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 22.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 22.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 17.sp, lineHeight = 26.sp, fontWeight = FontWeight.Bold),
    titleSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 13.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 15.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 13.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 19.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 13.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 11.sp, lineHeight = 16.sp, fontWeight = FontWeight.Bold),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 18.sp),
)

/** Plates are 2 dp; pills and 20-28 dp default card radii are banned by the redesign. */
private val ManHuntShapes = Shapes(
    extraSmall = RoundedCornerShape(2.dp),
    small = RoundedCornerShape(2.dp),
    medium = RoundedCornerShape(2.dp),
    large = RoundedCornerShape(2.dp),
    extraLarge = RoundedCornerShape(2.dp),
)

@Composable
fun ManHuntTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    fontScale: Float = 1f,
    content: @Composable () -> Unit,
) {
    // enableEdgeToEdge() derives icon colors from the system theme, but ManHunt can override
    // the theme in-app. Keep the status/navigation bar icons legible for the app's theme.
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }
    val language = LocalLanguage.current
    val arabic = language == AppLanguage.Arabic
    val typography = remember(fontScale, arabic) {
        (if (arabic) ArabicTypography else LatinTypography).scaledFor(fontScale)
    }
    CompositionLocalProvider(LocalBoardArabic provides arabic) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColors else LightColors,
            typography = typography,
            shapes = ManHuntShapes,
            content = content,
        )
    }
}

/**
 * Text scaling: body/UI/data at the user's full scale; display faces at half rate capped at
 * 1.25x so a 200 % text setting cannot turn the scoreboard into wallpaper (tokens.md §2).
 */
private fun Typography.scaledFor(fontScale: Float): Typography {
    val displayScale = (1f + (fontScale - 1f).coerceAtLeast(0f) * 0.5f).coerceAtMost(1.25f)
    return Typography(
        displayLarge = displayLarge.scaledBy(displayScale),
        displayMedium = displayMedium.scaledBy(displayScale),
        displaySmall = displaySmall.scaledBy(displayScale),
        headlineLarge = headlineLarge.scaledBy(displayScale),
        headlineMedium = headlineMedium.scaledBy(displayScale),
        headlineSmall = headlineSmall.scaledBy(fontScale),
        titleLarge = titleLarge.scaledBy(fontScale),
        titleMedium = titleMedium.scaledBy(fontScale),
        titleSmall = titleSmall.scaledBy(fontScale),
        bodyLarge = bodyLarge.scaledBy(fontScale),
        bodyMedium = bodyMedium.scaledBy(fontScale),
        bodySmall = bodySmall.scaledBy(fontScale),
        labelLarge = labelLarge.scaledBy(fontScale),
        labelMedium = labelMedium.scaledBy(fontScale),
        labelSmall = labelSmall.scaledBy(fontScale),
    )
}

private fun TextStyle.scaledBy(scale: Float): TextStyle = copy(
    fontSize = fontSize * scale,
    lineHeight = lineHeight * scale,
)
