# ManHunt app redesign — motion

**Status:** implementation authority (task-51). Pairs with [`direction.md`](direction.md),
[`tokens.md`](tokens.md) and the existing brand motion contract
`design/brand/motion-kit/app/README.md`. Motion here is **broadcast graphics, not app animation**: constant
speeds, hard cuts, flat geometry, no springs, no glow. Every cue must map to a game event or a state change.

**The one rule:** motion shows **what changed**, never decorates a screen. If a movement does not answer the
question "what just happened in the game?", it is cut.

Current assets to reuse (do not rebuild):
- `ui/BrandMotion.kt` — Home/Auth radar plate (4 s loop, τ function, reduced-motion + lifecycle gating).
- `map/BrandMapMotion.kt` — map sweep/pings/trail/zone motion (Choreographer/ValueAnimator, 30 fps max,
  reduced-motion static).
- `ui/StartupBrand.kt` — cold-start mark reveal (1.4 s).
- `ui/theme/Motion.kt` — durations/easings (values updated below).

---

## 1. Motion principles

1. **Hard cuts over slides.** Screens cut like a broadcast camera, with one short chalk wipe; no fade-and-
   slide-up on every element. A change of state (LOBBY → LIVE) is a cut, not a crossfade.
2. **Constant speed for field drawings.** Zone ring, trail and ping use linear easing; the tail is slightly
   thicker, the head thin — chalk drawn by a hand moving at a steady pace.
3. **Hard cuts for truth moments.** The tag snap closes in 120 ms and lands; the Board digit changes without
   easing; the result appears on the cut, with one frame of inverted team colour (subtle, 1 frame).
4. **Motion never gates information.** The first frame of every animation is already a complete, readable
   composition. Reduced motion renders that frame and stops the clock.
5. **One orchestrated moment per screen.** A screen may have one entrance (≤240 ms) and event motion; it
   may not animate every row, chip and card.
6. **No spring, no overshoot, no bounce, no shimmer, no particles, no parallax.** If the platform's default
   `animate*AsState` spec is a spring, replace it with the tokens below.
7. **The clock is sacred.** The countdown changes at second boundaries, tabular, no easing, no pulse, no
   colour flash each tick. It is a scoreboard digit, not a heartbeat.
8. **Respect reduced motion everywhere** (§7) and pause all loops when the screen is not RESUMED.

---

## 2. Motion tokens (replace `ui/theme/Motion.kt` values)

| Token | Value | Easing | Compose |
|---|---:|---|---|
| `instant` | 0 ms | — | Hard state swap (clock digits, tag final, state word). |
| `tick` | 120 ms | linear | Press overlay (4 % chalk), check mark draw, small state colour change. |
| `snap` | 120 ms | linear | Role selection, ready toggle, tag confirmation. |
| `enter` | 240 ms | `CubicBezier(0.16f, 1f, 0.3f, 1f)` (`EaseOutExpo`) | Sheet/dock rise, screen content entrance. |
| `exit` | 160 ms | `CubicBezier(0.4f, 0f, 1f, 1f)` | Dismiss/out. |
| `wipe` | 200 ms | linear | Screen transition. |
| `draw.fast` | 400 ms | linear | Report ping, marker appear. |
| `draw.slow` | 600 ms | linear | Zone ring draw on first map frame. |
| `draw.trail` | 600 ms | linear | Trail draw-in on first render (then it moves with data, not animation). |
| `clock.tick` | 1000 ms | linear (boundary only) | Tick rule advance, no digit easing. |
| `loop.radar` | 4000 ms | linear | Brand radar hero (existing). |
| `loop.mapSweep` | 4000 ms | linear | Map sweep (existing 3–5 s; standardise 4 s to match). |

Deprecated: `LONG = 320` for dialog expansion (sheets use `enter` 240 + height animation 240), any spring
spec, `animateContentSize` on list cards.

---

## 3. Startup / cold start

**Keep** `StartupBrandScreen` (mark ring draws, coral dot enters the gap, ticks, wordmark + cyan rule) — it is
the strongest existing motion and already reduced-motion aware. Changes:

1. **Shorten to 900 ms** (ring 0–380 ms, gap/dot 160–520 ms, wordmark 320–700 ms, hold 200 ms) and make it
   **skippable on tap** (a full-screen tap finishes immediately; `onFinished()` idempotent). A 1.4 s hold
   before the first screen is long on a low-end phone.
2. **First frame must be the poster**: ring at τ=0, dot in the gap, no blank field. If motion is disabled,
   show the still for 300 ms maximum, not 900 ms.
3. **Launch theme**: window background is field `#0B1220` in dark and chalk `#F7F9FC` in light (no white
   flash), splash → startup → first screen share the same ground. No logo jump: the splash icon is centred
   on the same field colour the startup uses.
4. **Do not replay** on every Activity recreation (rotation, theme toggle, language toggle). Show it once per
   process launch only; use a process-scoped flag (`rememberSaveable` inside `MainActivity` is not enough —
   a simple `var shown` in the application container or a `ViewModel` scoped to the Activity that survives
   config change).
5. Deep link / notification cold start into a room may skip the brand screen after 300 ms.

---

## 4. Screen transitions

Replace the current `fadeIn + slideInHorizontally` (16 dp, 240 ms) with **cut + chalk wipe**:

- **Forward (Auth → Home → Room):** outgoing screen holds its frame and is cut at 80 ms; incoming screen
  enters with a 2 dp cyan/chalk wipe at the leading edge moving across in `wipe` 200 ms linear, while the
  content itself is not translated (hard cut under the wipe). Result: feels like a marking pass, not a
  slideshow.
- **Back / predictive back:** the current predictive-back scale/slide (AppRoot.kt) can stay as the *gesture
  preview* (it is platform behaviour), but on completion use the wipe in the reverse direction; do not add
  a third motion language. RTL: wipe direction and gesture mirror via layout direction.
- **Room tab (Game ↔ Chat):** no slide; the active tab content cuts, the underline rule moves continuously
  with the pager drag (existing PagerTabIndicator can stay, restyled as a 2 dp chalk rule).
- **Result:** no transition — the moment the match is finished the screen cuts to `ScorePage` (one frame of
  invert on the winner word, then settle). The result must never be a dialog that animates over chat.
- **Startup → first screen:** cut with a 200 ms wipe from the mark's gap direction.

Screen transition duration budget: **≤ 240 ms total**, one property (wipe/clip), no per-element stagger.

---

## 5. The Board (signature motion)

1. **Clock:** value changes at the second boundary, no animation (`instant`). Digits are tabular; no
   crossfade, no slide, no scale. A 1 dp chalk tick rule under the Board advances one notch per second
   (`clock.tick`) — linear, 0 ms draw (it can step), and pauses with the hunt.
2. **State change (`LOBBY → HEAD START → LIVE → PAUSED → FULL TIME`):** hard cut on the state word and
   colour; the Board background does not animate; the live dot (cyan, 6 dp) appears at `instant` and is
   static (no pulse). One frame of chalk invert on the rule at the transition (optional, 1 frame only).
3. **Zone shrink warning:** when the zone is about to shrink, the zone datum in the Board's right gutter
   changes to `coral`? **No** — coral is Prey. Use `error`? No: it's not an error. Use chalk + a small
   `clock` glyph and the countdown in `data`; the Board clock remains the only large number. No flash.
4. **Prey remaining change (tag confirmed):** the count updates at `instant`; the Board fires a single
   2 dp chalk rule sweep across the Board bottom rule (200 ms linear, once) as the "tally mark" — the only
   celebratory motion, and it is a rule, not confetti.
5. **ScorePage Board:** frozen full-time value; no ticking.

Board is **not** used as a loading skeleton; it is either real data or the idle/masthead variant.

---

## 6. Map and HUD motion (live hunt)

The map is the field; motion here must be barely perceptible and always report data. Reuse
`BrandMapMotion.kt` (30 fps cap, pause when not RESUMED, no per-frame allocation, reduced-motion static) and
adjust to the brand contract:

| Cue | Motion | Timing | Notes |
|---|---|---|---|
| **Opening fit** | Camera animates from a wide fit to the fitted zone/prey/own position | 400 ms, `EaseOutExpo` | Once per match entry, not on every recomposition; if reduced motion, jump. |
| **Own position** | Chalk dot + 2 dp ring, static; a slow 1 dp bearing tick rotates with heading | 4 s loop, linear | If heading unavailable, no rotation. Never animate position (location updates jump at report cadence; smooth only 200 ms between fixes if already smooth). |
| **Zone ring** | Draws on first frame (`draw.slow` 600 ms linear), then static; on shrink, ring animates from old to new radius in 400 ms linear | — | Shrink is data, not decoration; show the new radius in the Board immediately. |
| **Report ping** | Coral ring expands 8→40 dp, fades 55→0 %, from the reported position | 400–600 ms linear, once per report | Stale reports: no ping; dashed static ring instead. Eliminated: no ping. |
| **Prey marker** | Coral dot 6 dp + ring; on new report a 120 ms scale 1→1.15→1 (hard, no spring) then settle | 120 ms | Shape changes for stale/eliminated, not just colour. |
| **Hunter markers** | Violet dot + ring; position updates animate 200 ms linear between reports | 200 ms | No pulse, no glow. |
| **Trail** | Coral polyline grows from the tail as new points arrive (200 ms linear per segment); on first render draws 600 ms | — | No dash animation loop; the trail is a record, not a loading bar. |
| **Radar sweep** | One 42°/104° flat cyan cone pair, 4 s revolution, α 0.04/0.018, 1.6 dp leading edge | 4 s linear | Only if it doesn't obscure labels; opacity budget ≤4 %. It is the "field signal", not a scanner trope. |
| **Tag snap** | Violet ring closes the last 6 dp onto the coral dot in 120 ms linear; one frame inverted (coral→chalk) then the marker becomes eliminated (chalk 30 % + cross tick) | 120 ms | This is the game's one physical verb; make it land. Haptic + sound (§8). |
| **Eliminated / tagged self** | Screen does not flash red. A full-width chalk strip with "Tagged. You're out." cuts in; the map dims 8 % | 160 ms | The player's status is text + dim, not a colour alarm. |
| **Pending tag claim** | Coral 2 dp strip above the dock cuts in (no slide); persists until answered | instant | Coral because it concerns the Prey; text + action, not colour alone. |
| **Reconnecting** | 1 dp chalk rule under the Board with a 2 s indeterminate slide; the Board state stays the last known with a `data` "Last update 20 s ago" | loop 2 s linear | Do not hide the map's age; no spinner over the map. |

**Map chrome motion:** the bottom dock rises once on entry (240 ms `enter`) and then stays; expanding the
match sheet animates height 240 ms `enter` with content cut in; collapsing 160 ms. The map itself never
"breathes" or zooms with the sheet.

**Do not:** animate map camera on every data update; animate marker colour continuously; use a loading
shimmer on tiles (keep the last tiles + a quiet "Loading map" data line); animate the OSM attribution.

---

## 7. Reduced motion (required, first-class)

Detect once via `Settings.Global.ANIMATOR_DURATION_SCALE == 0` **and** Compose's
`LocalInspectionMode`/`LocalAccessibilityManager` if available; also expose an app-level "Reduce motion"
setting in Settings → Appearance (persist in `SessionStore`/prefs) because some users cannot change system
settings on managed devices. When reduced motion is on:

| Cue | Static equivalent |
|---|---|
| Startup | Mark + wordmark still for 300 ms, then cut. |
| Screen transition | Hard cut (0 ms), no wipe. |
| Radar/sweep/loops | τ = 0 frame, no frame clock scheduled. |
| Zone draw / trail draw | Final geometry immediately. |
| Pings / marker scale | No ping; marker updates in place. |
| Tag snap | Final eliminated marker + full-width "Tagged. You're out." strip, no invert frame. |
| Board tick | Tick rule step only (no motion), or static minute marks. |
| Sheet/dock | Appear/disappear instantly. |
| Camera intro | Final fit immediately. |
| Reconnecting | Static rule + text (no slide). |

The static frame must contain **all** information the animation had: if the animation was the only way to
know the zone shrank, the Board's zone datum and a `data` line must state it.

Always stop loops in `onStop`/`onPause` (lifecycle observer) and never run an infinite frame clock behind a
dialog or in the background. Prefer `rememberInfiniteTransition` only when the screen is RESUMED; otherwise
freeze the phase.

---

## 8. Haptics and sound (new, small, optional but recommended)

The app is used outdoors, often in a pocket. These are part of the premium feel and are cheap:

| Event | Haptic (`HapticFeedbackConstants`/Compose `HapticFeedbackType`) | Sound (optional, default ON? — no, default off in public builds) |
|---|---|---|
| Report sent (Prey) | `CONFIRM` / light tick, once per report interval | none |
| New prey report received (Hunters) | `KEYBOARD_TAP` (short) | none |
| Tag requested (Hunter) | `CONFIRM` | none |
| Tag confirmed (Prey) | `CONFIRM` + a single low pulse | none |
| You are tagged | `REJECT`/heavy, two pulses, then silence | none |
| Zone shrinks in 60 s | `KEYBOARD_TAP` once | none |
| Clock under 60 s | a soft tick at 10 s marks only if screen is on — optional, off by default | none |
| Error | `REJECT` | none |

Rules: never haptic on every location update; never vibrate a loop; respect system haptics setting; never
make sound a required cue (all information is visual text); no background audio (game is played in public).

---

## 9. Performance and implementation notes

- **One phase state, read in draw/layout lambdas.** Brand loops: `phase.value` inside `onDrawBehind` /
  `graphicsLayer`; never recompose per frame. Reuse paths/strokes; zero allocation in draw loops.
- **No per-second recomposition of a whole screen.** The clock is its own composable reading a
  `LaunchedEffect` loop that sleeps to the next second boundary (existing `CountdownText` pattern — keep it,
  restyle it). Do not drive the clock from `withFrameMillis`.
- **Map motion:** existing `BrandMapMotion` approach (Choreographer/ValueAnimator at 30 fps max); pause when
  `MapView` not resumed; don't animate osmdroid camera per location update; only fit once per match.
- **Animate height only on sheets**, never `animateContentSize()` on list items/cards (current `ScreenCard`
  behaviour is banned; it causes jank and dead space, audit UI-23/UI-22).
- **Transitions:** one `AnimatedContent` at the app root with the wipe; do not nest screen transitions in
  every screen. Predictive back stays as the platform gesture preview.
- **No spring animations** (`animate*AsState` defaults are spring; pass `tween(...)` explicitly). Grep for
  `spring(` and `animateContentSize(` in feature UI and replace.
- **Test hooks:** `testTag`s for Board/clock/dock; Robolectric screenshot tests capture the τ=0 frame
  (`LocalInspectionMode`); add a `reducedMotion = true` preview per screen.
- **Battery:** nothing loops when the hunt is paused, the app is backgrounded, or the screen is not RESUMED;
  map sweep 4 s / 30 fps is the maximum continuous animation budget.

---

## 10. Motion acceptance tests

1. Screen change → cut/wipe ≤240 ms; no slide/fade of the whole screen; RTL mirrors.
2. Clock changes without easing; digits don't jump width (tabular); no pulse.
3. Tag confirmed → snap lands ≤120 ms; haptic fires; eliminated marker replaces prey marker in place; the
   Board prey count updates instantly.
4. Reduced motion ON → every cue above has a complete static frame; no infinite animation; verified by
   `ANIMATOR_DURATION_SCALE=0` and by the in-app toggle.
5. Background → foreground: no animation restarts, no clock jump beyond real elapsed time; map returns to
   the same camera.
6. Low-end profile (e.g. API 26 emulator): map sweep + trail + ping stays ≤30 fps with no jank in the dock;
   no `Choreographer` warnings; memory stable over 10 minutes.
7. Arabic RTL: wipe direction, sheet gesture, back arrow and pager all mirror; clock/code do not; wordmark
   and mark never mirror.
8. Light theme: same motion, no flash; startup poster matches theme ground.
