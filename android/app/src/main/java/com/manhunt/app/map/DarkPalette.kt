package com.manhunt.app.map

/**
 * Maps light OSM raster tiles into the app's navy/cyan dark palette.
 *
 * android.graphics.ColorMatrix channels AND its offset column (the 5th value of
 * each row) are on the 0..255 scale: the platform documentation's own invert
 * sample uses offset 255 and still inverts every pixel, and osmdroid's built-in
 * INVERT_COLORS ships the same shape. Offsets 225/238/252 were derived and
 * validated against real London tiles (dark navy background, light labels).
 *
 * Do NOT "normalize" these offsets to 0..1 (e.g. writing 225/255): with the
 * platform's semantics that clamps every tile pixel to black. The matrix is
 * pinned by DarkPaletteTest — change only alongside a re-validated tile preview.
 */
internal val DARK_TILE_MATRIX = floatArrayOf(
    -0.1828f, -0.6151f, -0.0621f, 0f, 225f,
    -0.1871f, -0.6294f, -0.0635f, 0f, 238f,
    -0.1913f, -0.6437f, -0.0650f, 0f, 252f,
    0f, 0f, 0f, 1f, 0f,
)
