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
            version = "0.15.1",
            date = "2026-11-01",
            changes = listOf(
                "Short Open Zone startup reveal on cold launch.",
                "Reduced-motion launches show a calm static mark.",
            ),
        ),
        ChangelogEntry(
            version = "0.15.0",
            date = "2026-11-01",
            changes = listOf(
                "Animated Open Zone radar hero on Home and sign-in.",
                "The hunting map is now alive with radar, pings and trails.",
                "New animated install-page and README heroes.",
                "Arabic chat placeholder now follows RTL.",
            ),
        ),
        ChangelogEntry(
            version = "0.14.0",
            date = "2026-11-01",
            changes = listOf(
                "New slogan: hide from your friends.",
                "New Open Zone icon system and adaptive launcher icon.",
                "ManHunt is now presented as a free pickup field sport.",
            ),
        ),
        ChangelogEntry(
            version = "0.13.1",
            date = "2026-11-01",
            changes = listOf(
                "Team sides keep their colours with a clear selected outline and badge.",
                "Use my location now requests a fresh fix on every press.",
                "Text-size preview scales only the sample and applies on release.",
                "Predictive back reveals Home while you slide back.",
            ),
        ),
        ChangelogEntry(
            version = "0.13.0",
            date = "2026-10-31",
            changes = listOf(
                "Tactical full-screen map with a bottom hunt sheet.",
                "Deep Teal map palette and a zone/prey fit on open.",
                "Clear stale/live markers, claim banners and huntmaster details.",
            ),
        ),
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
