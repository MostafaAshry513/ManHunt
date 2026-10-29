package com.manhunt.app.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing

/**
 * Motion language for ManHunt: "Energetic" (see docs/SKILL_MATRIX.md).
 * Fast, decisive, with a slight overshoot only on playful elements.
 */
object Motion {
    /** Micro feedback: press, toggle, selection. */
    const val QUICK = 120

    /** Standard state change: colors, chips, banners. */
    const val STANDARD = 180

    /** Spatial change: screen and card transitions. */
    const val EMPHASIZED = 240

    /** Decelerating curve for entrances; fast start, soft landing. */
    val EaseOutExpo: Easing = CubicBezierEasing(0.16f, 1f, 0.3f, 1f)

    /** Symmetric ease for exits. */
    val EaseInOut: Easing = CubicBezierEasing(0.4f, 0f, 0.2f, 1f)
}
