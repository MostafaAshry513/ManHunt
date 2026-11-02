package com.manhunt.app

import com.manhunt.app.data.Teams
import com.manhunt.app.data.Phases
import com.manhunt.app.ui.FinishedMatchSnapshot
import com.manhunt.app.ui.finishedResultView
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pins the S12/S13 finished-result data logic. Real assertions from the emulator run:
 * "Hunters win." must never be shown with "PREY 2 / 2" or a not-tagged prey, and the "played"
 * clock must be 18:48 (real `endedAt`), not the planned 59:15 (`endsAt`).
 */
class FinishedResultTest {

    private fun snapshot(
        winner: String? = Teams.HUNTERS,
        phase: String = Phases.FINISHED,
        startedAt: Long = 1_700_000_000_000L,
        endsAt: Long = 1_700_000_000_000L + 59L * 60_000 + 15_000,
        endedAt: Long = 1_700_000_000_000L + 18L * 60_000 + 48_000,
        preyAlive: Int = 2,
        preyTotal: Int = 2,
        members: List<com.manhunt.app.ui.FinishedMemberSnapshot>? = listOf(
            com.manhunt.app.ui.FinishedMemberSnapshot("u1", "Yasmin", Teams.PREY, eliminated = false, isAdmin = false),
            com.manhunt.app.ui.FinishedMemberSnapshot("u2", "Leila", Teams.PREY, eliminated = true, isAdmin = false),
            com.manhunt.app.ui.FinishedMemberSnapshot("u3", "Omar", Teams.HUNTERS, eliminated = false, isAdmin = false),
        ),
    ) = FinishedMatchSnapshot(
        matchId = "m1",
        phase = phase,
        winner = winner,
        startedAt = startedAt,
        endsAt = endsAt,
        endedAt = endedAt,
        preyAlive = preyAlive,
        preyTotal = preyTotal,
        zoneRadiusM = 240.0,
        members = members,
        capturedAt = startedAt + 19L * 60_000,
    )

    @Test
    fun huntersWinNeverShowsRemainingPreyOrUntaggedPrey() {
        // The exact impossible S12 payload: Hunters win but a stale room state still said 2/2
        // and only one prey carried a (reset) elimination flag.
        val view = finishedResultView(snapshot())
        assertEquals(0, view.shownPreyAlive)
        assertTrue(view.scoreVisible)
        assertTrue(view.preyAllTaggedByRule)
        // 18:48 real duration, not the planned 59:15.
        assertEquals(18L * 60 + 48, view.durationSeconds)
        // The snapshot property used by ScorePage agrees.
        assertEquals(18L * 60 + 48, snapshot().durationSeconds)
    }

    @Test
    fun plannedEndIsOnlyAFallbackWhenEndedAtIsMissing() {
        val view = finishedResultView(snapshot(endedAt = 0))
        assertEquals(59L * 60 + 15, view.durationSeconds)
    }

    @Test
    fun preyWinKeepsTheRealRemainingCount() {
        val view = finishedResultView(
            snapshot(winner = Teams.PREY, preyAlive = 1, preyTotal = 2),
        )
        assertEquals(1, view.shownPreyAlive)
        assertTrue(view.scoreVisible)
        assertFalse(view.preyAllTaggedByRule)
    }

    @Test
    fun unknownFinalCountsHideTheScoreInsteadOfInventingIt() {
        val view = finishedResultView(snapshot(winner = null, preyAlive = 0, preyTotal = 0))
        assertNull(view.shownPreyAlive)
        assertFalse(view.scoreVisible)
    }

    @Test
    fun cancelledHuntHasNoWinnerDerivedTagging() {
        val view = finishedResultView(
            snapshot(
                winner = null,
                phase = Phases.CANCELLED,
                preyAlive = 1,
                preyTotal = 2,
            ),
        )
        assertEquals(1, view.shownPreyAlive)
        assertFalse(view.preyAllTaggedByRule)
    }
}
