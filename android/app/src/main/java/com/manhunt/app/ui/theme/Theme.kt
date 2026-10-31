package com.manhunt.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

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

private val ManHuntTypography = Typography(
    headlineLarge = TextStyle(
        fontSize = 40.sp,
        lineHeight = 44.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = (-1).sp,
    ),
    headlineMedium = TextStyle(
        fontSize = 30.sp,
        lineHeight = 34.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = (-0.5).sp,
    ),
    headlineSmall = TextStyle(fontSize = 24.sp, lineHeight = 30.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 22.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 17.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold),
    titleSmall = TextStyle(fontSize = 15.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 15.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontSize = 13.sp, lineHeight = 18.sp),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
    labelMedium = TextStyle(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold),
    labelSmall = TextStyle(
        fontSize = 11.sp,
        lineHeight = 14.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.6.sp,
    ),
)

private val ManHuntShapes = Shapes(
    extraSmall = RoundedCornerShape(ManHuntRadius.xs),
    small = RoundedCornerShape(ManHuntRadius.sm),
    medium = RoundedCornerShape(ManHuntRadius.md),
    large = RoundedCornerShape(ManHuntRadius.lg),
    extraLarge = RoundedCornerShape(ManHuntRadius.xl),
)

@Composable
fun ManHuntTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    fontScale: Float = 1f,
    content: @Composable () -> Unit,
) {
    val typography = remember(fontScale) { ManHuntTypography.scaledBy(fontScale) }
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = typography,
        shapes = ManHuntShapes,
        content = content,
    )
}

private fun TextStyle.scaledBy(scale: Float): TextStyle = copy(
    fontSize = fontSize * scale,
    lineHeight = lineHeight * scale,
)

private fun Typography.scaledBy(scale: Float): Typography = Typography(
    displayLarge = displayLarge.scaledBy(scale),
    displayMedium = displayMedium.scaledBy(scale),
    displaySmall = displaySmall.scaledBy(scale),
    headlineLarge = headlineLarge.scaledBy(scale),
    headlineMedium = headlineMedium.scaledBy(scale),
    headlineSmall = headlineSmall.scaledBy(scale),
    titleLarge = titleLarge.scaledBy(scale),
    titleMedium = titleMedium.scaledBy(scale),
    titleSmall = titleSmall.scaledBy(scale),
    bodyLarge = bodyLarge.scaledBy(scale),
    bodyMedium = bodyMedium.scaledBy(scale),
    bodySmall = bodySmall.scaledBy(scale),
    labelLarge = labelLarge.scaledBy(scale),
    labelMedium = labelMedium.scaledBy(scale),
    labelSmall = labelSmall.scaledBy(scale),
)
