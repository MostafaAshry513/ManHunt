package com.manhunt.app.data

/** A release note entry shown on Settings → Updates. */
data class ChangelogEntry(
    val version: String,
    /** ISO local date, e.g. 2026-10-31. */
    val date: String,
    /** English source keys resolved through t(). */
    val changes: List<String>,
)

/**
 * Bundled fallback changelog. The update manifest's notes are preferred when available;
 * this keeps the Updates page useful offline and for the currently installed build.
 */
object Changelog {
    val recent: List<ChangelogEntry> = listOf(
        ChangelogEntry(
            version = "0.12.4",
            date = "2026-10-31",
            changes = listOf(
                "Predictive back animation when leaving Settings.",
                "Updates page shows the release date and a changelog.",
                "Roles page trimmed to its essentials.",
            ),
        ),
        ChangelogEntry(
            version = "0.12.2",
            date = "2026-10-31",
            changes = listOf(
                "Live text-size scaling with a real themed preview.",
                "Team selection, use-my-location and typed input fixes.",
            ),
        ),
        ChangelogEntry(
            version = "0.12.1",
            date = "2026-10-31",
            changes = listOf(
                "Map tile cache is bounded and can be cleared from Settings.",
            ),
        ),
    )
}
