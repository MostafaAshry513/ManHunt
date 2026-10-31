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

    val singlePrey = GameModeInfo(
        id = "single_prey",
        name = "Single Prey",
        tagline = "One prey. No backup.",
        summary = "Planned: one Prey against a team of Hunters — faster, simpler rounds for small groups.",
        available = false,
    )

    val shrinkingZone = GameModeInfo(
        id = "shrinking_zone",
        name = "Shrinking Zone",
        tagline = "The walls close in.",
        summary = "Planned: a shrinking play area with trails off — stay inside the zone and survive as long as you can.",
        available = false,
    )

    /** Everything the Roles screen shows, in page order. */
    val all: List<GameModeInfo> = listOf(classic, singlePrey, shrinkingZone)

    /** Modes a room can actually start today. */
    val playable: List<GameModeInfo> = all.filter { it.available }
}
