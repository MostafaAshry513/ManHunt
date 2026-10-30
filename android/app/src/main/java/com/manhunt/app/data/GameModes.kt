package com.manhunt.app.data

/**
 * Game-mode catalog.
 *
 * Only [classic] is playable today. The catalog + the Roles screen are the client-side
 * seam for adding more modes later: the room flow and the server contract stay the same,
 * and a mode becomes playable once a server-side ruleset for it exists (the next step is
 * an additive `gameMode` field on room settings, validated server-side).
 */
data class GameModeInfo(
    /** Stable id that will be sent to the server once more modes are playable. */
    val id: String,
    /** English source keys for t(). */
    val name: String,
    val tagline: String,
    val summary: String,
    val available: Boolean,
)

object GameModes {
    val classic = GameModeInfo(
        id = "classic",
        name = "Classic hunt",
        tagline = "Hide. Hunt. Survive.",
        summary = "The original real-world game: Prey hide and share their position, Hunters track them down and tag them in person.",
        available = true,
    )

    val relay = GameModeInfo(
        id = "tag_relay",
        name = "Tag Relay",
        tagline = "Swap sides, keep score.",
        summary = "Planned: teams alternate between Prey and Hunters each round, scoring tags and survival time.",
        available = false,
    )

    val zoneLock = GameModeInfo(
        id = "zone_lock",
        name = "Zone Lock",
        tagline = "The walls close in.",
        summary = "Planned: a shrinking play area with trails off — stay inside the zone and survive as long as you can.",
        available = false,
    )

    /** Everything the Roles screen shows, in page order. */
    val all: List<GameModeInfo> = listOf(classic, relay, zoneLock)

    /** Modes a room can actually start today. */
    val playable: List<GameModeInfo> = all.filter { it.available }
}
