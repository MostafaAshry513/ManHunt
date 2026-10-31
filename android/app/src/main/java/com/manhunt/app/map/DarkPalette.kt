package com.manhunt.app.map

/**
 * Maps light OSM raster tiles into the app's Deep Teal night palette.
 *
 * Derivation: treat the tile luminance L (0..255) as the input and map it onto a
 * two-colour ramp from a navy shadow to a cyan highlight:
 *
 *   output = shadow * 255 + (1 - L / 255) * (highlight - shadow) * 255
 *          = highlight * 255 - (highlight - shadow) * L
 *
 * with shadow = (.01, .04, .10) and highlight = (.34, .90, 1.0). That keeps light map
 * backgrounds almost black/navy while roads and labels stay bright cyan.
 *
 * android.graphics.ColorMatrix channels AND its offset column (the 5th value of
 * each row) are on the 0..255 scale: the platform documentation's own invert
 * sample uses offset 255 and still inverts every pixel, and osmdroid's built-in
 * INVERT_COLORS ships the same shape. Offsets here are the highlight * 255 values.
 *
 * Do NOT "normalize" these offsets to 0..1: with the platform's semantics that
 * clamps every tile pixel to black. The matrix is pinned by DarkPaletteTest -
 * change only alongside a re-validated tile preview.
 */
internal val DARK_TILE_MATRIX = floatArrayOf(
    -0.09867f, -0.19371f, -0.03762f, 0f, 86.7f,
    -0.25714f, -0.50482f, -0.09804f, 0f, 229.5f,
    -0.26910f, -0.52830f, -0.10260f, 0f, 255f,
    0f, 0f, 0f, 1f, 0f,
)
