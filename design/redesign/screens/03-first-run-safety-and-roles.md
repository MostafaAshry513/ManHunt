# 03 — First-run safety + Roles / how it works

**Routes:** `Route.Safety` (first run only) and `Route.Roles` (reference, from Home) → `RolesScreen`
(`ui/RolesScreen.kt`, `GameModes` catalog).
**Purpose:** before the first game, a player must understand that this is a real-world game, that their phone
will report their position when they are Prey, and how a hunt runs. It is the trust surface *and* the rules
screen. It must read like a **field guide plate for a sport**, not a legal interstitial or a marketing page.
**Primary action:** first run — "I understand and I'll play safely" (accept). Reference — "Let's play" /
"Close".

**Old problem being fixed:** a gradient "Roles" hero card with a paw icon, long grey prose in two identical
cards, tiny pager dots, a "Close" button, and marketing half-empty space; the safety notice is the same screen
with a different button, so the most important trust moment looks like a brochure. New: one **"Before you
play" plate** for the first run (rules as a field guide), and a separate **"How the game works"** reference
that teaches the loop with drawn diagrams and a real sequence.

---

## 1. Hierarchy — first run (`Safety`)

1. **"Before you play."** `display.l` chalk. The screen is a briefing; the title says it.
2. **The three-line rule** — what the game is, what the phone does, where you can play. Each line is a
   `ChalkRule` section with a `title` and one/two sentences; the phone-reporting line is the most specific.
3. **The drawn field** — a small `FieldPlate` showing zone, Prey dot, Hunters around it. It explains the game
   faster than the paragraph.
4. **The full safety note** — the existing location paragraph, retention paragraph, five safety bullets, and
   the "not a safety service" paragraph, set as readable `body.small` under a "The full note" rule; trust
   content is not hidden behind a link.
5. **Pinned accept dock** — 56 dp primary, always reachable; the label is the existing honest string.

No cards. No icons-in-tiles. No "I agree to the terms" language; no fake checkbox theatre.

---

## 2. Layout — first run

```
┌───────────────────────────────────────────────┐
│                                               │
│  BEFORE YOU PLAY.                             │  display.l 48/44, 2 lines max
│  ManHunt is a real-world game. Read this once.│  body 15 chalk/muted
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │        FIELD PLATE (3:2, 180 dp)        │  │  zone · prey dot · hunters · trail
│  └─────────────────────────────────────────┘  │
│                                               │
│  This is a game.                              │  title 17
│  Not an emergency, rescue or child-tracking   │  body.small muted
│  service. GPS can be late or wrong.           │
│  ─────────────────────────────────────────── │
│  While you're Prey, your phone reports        │  title 17
│  your position.                               │
│  Every 5 minutes by default, only to the      │  body.small muted
│  Hunters in your room, only while hunting.    │
│  A permanent notification shows while it's    │
│  on. It stops when the match ends.            │
│  ─────────────────────────────────────────── │
│  Play where you're allowed to be.             │  title 17
│  Respect property and local law. Never        │  body.small muted
│  trespass. Stay out of roads and traffic.     │
│  Don't run looking at your phone.             │
│                                               │
│  The full note                                 │  caption + ChalkRule
│  ManHunt is a game. It is not an emergency…   │  body.small (existing full strings)
│  • Respect property and local law…            │
│  • Stay out of roads…                         │
│  • Never run while looking at your phone…     │
│  • Stop immediately if conditions…            │
│  • Respect people who are not playing.        │
│  Precise reports are kept for 30 days…        │
│                                               │
├───────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │  I UNDERSTAND AND I'LL PLAY SAFELY      │  │  56 primary dock (label may wrap to 2 lines)
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- The content scrolls; the dock is pinned. Do **not** require scrolling to the end before accepting (the
  current behaviour must be preserved — the server does not gate on it, and forced scroll is hostile).
- On short phones the plate shrinks to 120 dp; the three-line rule always appears before the full note.
- No back arrow on first run (there is nowhere back to); the accept action is the only exit.
- If the user has accepted before, this screen never shows again (`repo.hasAcceptedSafety()`).

### 2.1 Reference — "How the game works" (`Roles`)

```
┌───────────────────────────────────────────────┐
│ [←]  How the game works                       │  header 56
├───────────────────────────────────────────────┤
│  CLASSIC HUNT                                 │  display.s 28 (mode title)
│  Two teams. One block. One clock.             │  body 15
│  ┌─────────────────────────────────────────┐  │
│  │        MODE DIAGRAM (3:2, drawn)        │  │  zone · prey · hunters per mode
│  └─────────────────────────────────────────┘  │
│                                               │
│  The two sides                                │  title
│  ● Prey — you hide                            │  TeamTag + description (body.small)
│  ◆ Hunters — you chase                        │
│  ─────────────────────────────────────────── │
│  How a hunt runs                              │  title
│  1  Create or join a room, then pick a side.  │  true sequence: numbered steps allowed
│  2  Prey hide while the head start runs.      │
│  3  Hunters track the latest reports.         │
│  4  Touch to tag; the Prey confirms.          │
│  ─────────────────────────────────────────── │
│  Other modes                                  │  title
│  Single Prey        Not playable yet          │  data / muted
│  Shrinking Zone     Not playable yet          │
│  Classic is the only playable mode right now. │  body.small
│                                               │
│  ▪ ▪ ▪                                        │  tick rail pager (3 modes), tappable 48 dp
├───────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │               LET'S PLAY                │  │  primary → returns Home (or closes)
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- Modes are a **pager** (existing `HorizontalPager`, `GameModes` catalog): Classic (playable), Single Prey,
  Shrinking Zone (coming). Keep the existing mode descriptions but restructure type: mode title `display.s`,
  one-line hook `body`, then the two-sides section, then the sequence, then other modes.
- Pager indicator: a **tick rail** — three 12 × 2 dp chalk ticks, the active one 2 dp cyan; each tick is a
  48 dp tap target; no dots.
- The footer "ManHunt · Hide from your friends." is removed from this screen (the branded line belongs on
  Auth/Home); the page ends with the action.
- No "Swipe to see all modes · classic is playable today" micro-instruction in the body: the tick rail and
  the visible mode title teach it; keep the honest line "Classic is the only playable mode right now." under
  the modes.

---

## 3. Components

| Element | Spec | Test tag |
|---|---|---|
| Screen shell | no Board; full-bleed field; content within 16 dp margins; dock pinned | — |
| Title | `display.l` (first run) / header 56 + `display.s` (reference) | — |
| Lead | `body` 15 chalk/muted | — |
| Field plate | shell §5.7, 3:2, drawn zone/prey/hunters/trail; static on reference, one loop on first run if motion allowed | `safety_plate` |
| Rule sections | `ChalkRule` + `title` 17 + `body.small` muted; 16/24 spacing | — |
| Full note | `caption` "The full note" + existing paragraph strings in `body.small`; bullets as `•` lines (not a Material list with icons) | — |
| Safety bullets | existing 5 strings, rendered as separate `body.small` lines with a 1 dp `hairline` between? — no, keep compact bullets; respect max line length | — |
| Accept dock | `BoardButton` primary 56, `heightIn` for 2 lines, testTag `safety_accept`; label existing `I understand and I'll play safely` | `safety_accept` |
| Mode title/hook | `display.s` + `body` | — |
| Two sides | `TeamTag` + team name + one-sentence `body.small`; Prey and Hunters; use the existing descriptions trimmed to fit (full paragraphs remain in the mode body if needed) | — |
| Steps | 4 true-sequence steps: 24 dp step number in `board.meta` + text `body.small`; no circles, no icons | — |
| Mode tick rail | 3 × (12 × 2 dp) ticks, 48 dp tap, active cyan; pager sync | `roles_pager` |
| Primary action | `BoardButton` primary 56 "Let's play" / "Close" for reference | keep existing `safety_accept` on accept only |
| Back | header `back` 48 on reference only | — |

Removed: the gradient hero `HeroBanner`, paw icon, "Roles" marketing header, `ScreenCard` prose blocks,
`SecondaryButton` "Close" duplicate, footer slogan, dots.

---

## 4. Copy intent

| Slot | English | Notes |
|---|---|---|
| First-run title | **Before you play.** | period, sentence case; existing key "Before you play" |
| Lead | ManHunt is a real-world game. Read this once. | existing |
| Rule 1 title | This is a game. | new; body uses the existing "not a safety service" paragraph (split, keep meaning) |
| Rule 2 title | While you're Prey, your phone reports your position. | new; body uses the existing location paragraph (must keep: interval, only Hunters, only hunting phase, permanent notification, stops at end) |
| Rule 3 title | Play where you're allowed to be. | new; body uses the existing property/traffic bullets (keep all five in the full note) |
| Full note label | The full note | plain; no "Privacy policy" (there isn't one) |
| Accept | I understand and I'll play safely | existing key; do not shorten without copy owner |
| Reference title | How the game works | replaces "Roles" as the visible title; keep route/tag |
| Mode title | Classic hunt | existing `Classic hunt` |
| Hook | Two teams. One block. One clock. | existing |
| Prey line | Prey — you hide. | existing; sentence case with full stop |
| Hunters line | Hunters — you chase. | existing |
| Steps | 1 Create or join a room, then pick a side. / 2 Prey hide while the head start runs. / 3 Hunters track the latest reports. / 4 Touch to tag; the Prey confirms. | derive from existing rules copy; no new claims |
| Other modes | Single Prey · Shrinking Zone · Not playable yet · Classic is the only playable mode right now. | existing content; no fake dates |
| Action | Let's play / Close | existing keys |

Rules: no "safe", "protect", "survive" in new copy; the game's danger is a clock, not a threat. Arabic: the
existing Arabic safety paragraphs must be reused verbatim (they are the approved MSA adaptation); new
headings need copy-language review; no mixed register.

---

## 5. States

| State | Design |
|---|---|
| First run | As above; no back; accept always enabled (no checkbox). |
| Accepted | Screen never shown again; Home. |
| Reference from Home | Header with back; primary "Let's play" returns Home; if opened pre-room from Home only, no room context. |
| Long content | Scrolls; dock pinned; full note is long → typography keeps it readable; no "show more" hiding of the trust note (the three-line rule is the summary, the full note is below). |
| Loading | None (static content; no network). |
| Error | None. |
| 200 % text | Title wraps 2 lines; sections stack; accept label wraps; dock grows to 72–84; no clipping. |
| 320 dp | Plate 120; step numbers inline; bullets wrap. |
| RTL | Everything mirrors; plate canvas mirrored; team glyphs not mirrored (they are physical shapes? — prey dot/ring is symmetric; hunters chevrons can mirror with layout; keep glyphs as designed, the chevrons are direction-neutral converging); numbers LTR; bullets `•` on the right. |
| Light | Chalk ground, ink type, plate light variant, header rule; accept cyan light. |
| Reduced motion | Static plate. |

---

## 6. Compose implementation notes

- Keep the `RolesScreen(firstRun, onClose, initialPage)` signature and the `GameModes` catalog; the first-run
  branch renders the new "Before you play" content and accept action (existing `onClose` calls
  `repo.acceptSafety()` in `AppRoot` — unchanged).
- The reference screen keeps `HorizontalPager` with `initialPage` and the `roles_pager` semantics; replace
  `ModeDots` with the tick rail (tappable 48 dp; content descriptions "Mode 1 of 3: Classic hunt" etc.).
- Keep all existing safety strings by key from `Localization.kt` (they are approved Arabic); visual
  restructuring only. If a paragraph needs splitting for the three-line rule, **do not change the strings** —
  show the same string in the relevant section (it is acceptable to repeat the "not a safety service" line in
  the full note).
- Long-string handling: use `Text` with `body.small` and `lineHeight` from tokens; no `maxLines` on trust
  content; no ellipsis.
- Dock: `WindowInsets.navigationBars` padding; label `heightIn`; testTag `safety_accept` preserved.
- Accessibility: title `heading()`; rule titles `heading()`; accept button `contentDescription` = visible
  label; full note is normal readable text (not a `collapsed` region); focus order top→bottom→dock.
- No animation except the field plate (first run, one loop); no entrance animations per section.

---

## 7. Premium screenshot brief

- **Shot A (first run):** dark, 1080 × 2400. Title "Before you play.", field plate, three rule sections, start
  of the full note, accept dock. Status 21:04. The screen must look like a briefing card from a field guide —
  type-led, flat, calm.
- **Shot B (reference, Classic):** mode title, diagram, two sides with team tags, four steps, tick rail,
  "Let's play" dock.
- **Shot C (Arabic RTL first run):** mirrored, existing Arabic safety strings, plate mirrored.
- **Reject:** gradient hero, paw, "Roles" marketing header, grey wall of text without hierarchy, tiny dots.

---

## 8. A11y / RTL / adaptive checklist

- Contrast: chalk 15.9; muted 9.1; body.small 13 sp ≥4.5; bullets same; accept 9.2.
- Touch: accept 56; tick rail 48 each; back 48.
- The trust content must be readable at 200 % without horizontal scroll; test the long Arabic strings.
- RTL: plate mirrored; text right; bullets `•` right; numbers LTR; team glyphs + names right.
- Tablet ≥600: max reading width 560 dp, start-aligned, centred; plate capped at 560; dock button capped 560.
- No forced scroll-to-accept; no checkbox; no legal wall as the first thing.
