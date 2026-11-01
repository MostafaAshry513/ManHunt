# App motion spec — Compose canvas hero

**Deliverable for:** client-polish / task-42 (implementation) and the motion teammate (video reuse).
**Status:** implemented — `android/app/src/main/java/com/manhunt/app/ui/BrandMotion.kt` ships this loop.
This file is the contract the implementation is checked against; it is not app code.

**Key frames:** `app/keyframes.html` (rendered sheet:
`out/app/manhunt-app-hero-keyframes.png`), five stills at
`out/app/manhunt-app-hero-1080x480-tau-{00,20,40,60,80}.png`.

---

## 1 · Plate and loop

| Property | Value |
|---|---|
| Canvas plate | **360 × 160 dp** (full width of the card, 2.25 : 1) |
| Reference frames | **1080 × 480 px @3x** (`out/app/*.png`) |
| Container | full-bleed inside the card shape (`RoundedCornerShape(ManHuntRadius.xl)`), clipped |
| Loop | **4.0 s**, 60 fps, linear phase τ ∈ [0,1); frame 0 == frame 4000 ms |
| Motion character | broadcast-graphics restraint: constant-speed draws, hard flat geometry, no springs/bounce/overshoot, no glow, no gradients |
| Reduced motion | hold the **τ = 0.0** frame; stop the frame clock entirely (see §6) |

Motion is a pure function of τ — the same seeded algorithm as the README/banner kit
(`src/motion-core.js`, `radarFrame()`). Nothing is keyframed by hand; the loop closes exactly.

## 2 · What moves (and what does not)

| Layer | Behaviour at 4.0 s loop |
|---|---|
| **Block map + survey grid** | static chalk rectangles and cyan survey dots, deterministic seed `20261101`; lives in `drawWithCache` per size |
| **Scope disc** | static darker disc + crosshair hairlines + 60 bearing ticks + inner reference ring |
| **Open Zone ring** | cyan, **24° gap centred at −58°**, stroke 4 px at 3x (~1.3 dp); radius breathes by **−3.4 %** at τ = 0.5 and returns |
| **Sweep** | one revolution per loop: flat 42° cone α 0.042 + flat 104° cone α 0.018 + 1.6 px leading edge α 0.50 + 3 px tip dot |
| **Prey** | coral dot + coral ring (shape difference, so colour is never the only cue); closed orbit `θ = −90° + 360°·τ`, orbit radius `0.60 R`, radius wobble `1 + 0.13 sin(3θ+φ0) + 0.06 sin(5θ+φ1)`, squash 0.94 |
| **Hunters** | violet dot + flat ring; compact plate uses **2** (banner plates use 5). Lag `0.055 + i·0.035` loop behind the Prey, lateral fan `±(6 + i·2.2)°`, radius factor `0.74 + 0.035 sin(i·2.3 + 0.4) + i·0.006 + 0.028 sin(2πτ + i·1.7 + φ2)` — the net opens and closes but never catches |
| **Trail** | coral polyline: the Prey's run over the last **14 %** of the loop (0.56 s), 26 samples, round caps, α 0.58, ~1.3 dp |
| **Pings** | 3 coral report rings per loop (period τ = 1/3); each starts where the Prey *was* when the report was sent, life `0.115` loop (0.46 s), radius `0.09 R → 0.51 R`, opacity 0.55 → 0 |
| **Blips** | a dot brightens/grows for a moment as the sweep crosses its bearing: `exp(−Δbearing/θsharp)`, sharp 24° (Prey) / 20° (Hunters) |
| **Copy / legend** | Compose `Text` on top — never painted into the canvas |

Seed phases (mulberry32 `seedPhases(20261101)`): φ0 = 4.2345554, φ1 = 5.6310668, φ2 = 4.7288246 rad.
At 3x, `R = 168 px` (56 dp): Prey dot 9.5 px (3.2 dp), Prey ring 17 px (5.7 dp), Hunter dot 7 px (2.3 dp),
Hunter ring 13 px (4.3 dp). Keep those relative sizes; tune dot radii only between 2.2–3.4 dp.

## 3 · Layout and copy

Reference composition (`app/keyframes.html` → “Reference layout”):

```
┌──────────────────────────────────────────────────────────────┐
│  copy column  left 42%                     canvas art right  │
│  drawn MANHUNT wordmark (5.30:1)           radar + dots      │
│  hook (short form)                         (decorative,      │
│  localised PREY / HUNTERS legend            text-free)       │
└──────────────────────────────────────────────────────────────┘
```

- Copy is the **short form** “Hide from your friends.” — provisional brand copy v2 — plus the localised
  Prey / Hunters legend; the descriptor can be dropped at compact height.
- The canvas is `Modifier.matchParentSize()` behind the whole card; keep the **left ~42 %** of the art
  free of markers so copy never sits on a dot.
- **No text or numbers inside the canvas**: it must localise (incl. Arabic RTL) and scale with the user's
  font size. Team names are text, so coral/violet are never the only cue.
- RTL: mirror the art horizontally (`withTransform { scale(-1f, 1f, pivot = ...) }`), never the copy.

## 4 · Colour and contrast

All values are app tokens (`ui/theme/Theme.kt`), not ad-hoc hex:

| Role | Token | Hex | Contrast on field |
|---|---|---|---|
| Field (canvas ground) | background | `#0B1220` | — |
| Chalk (block outlines, text) | onSurface | `#E6EDF7` | 15.9 : 1 |
| Field / referee (zone, sweep, crosshair) | primary | `#22D3EE` | 10.4 : 1 |
| Prey | tertiary | `#FF7A59` | 7.3 : 1 |
| Hunters | secondary | `#A79BFF` | 7.8 : 1 |

Flat fills only — no gradient brushes, no `BlurMaskFilter`/glow, no drop shadows. Team cues pair colour
with a distinct shape (Prey carries the outer ring) and with the text legend.

## 5 · Timing table (4.0 s loop)

| Loop phase | Time | Beat |
|---|---|---|
| 0.00 | 0.0 s | sweep at bearing 0°, Prey top of its route, Hunters fanned behind |
| 0.20 | 0.8 s | Prey runs clockwise; trail grows; first report ping opens |
| 0.40 | 1.6 s | Hunters cut the corner, fan tightens, zone ring at its tightest |
| 0.60 | 2.4 s | evasion line bends; second ping; Hunters hold the inner arc |
| 0.80 | 3.2 s | zone ring breathes back out, sweep returns to top |
| 1.00 | 4.0 s | loop close — identical to 0.00 |

## 6 · Reduced-motion fallback (required)

- Read `Settings.Global.ANIMATOR_DURATION_SCALE`; when it is `0` (accessibility “Remove animations”),
  draw the **τ = 0.0** frame and do **not** start `rememberInfiniteTransition`/a frame clock at all.
- Also pause while the screen is not `RESUMED` (lifecycle observer) and skip animation under
  `LocalInspectionMode` (previews/tests capture the still frame).
- The still is complete information — zone, gap, both teams, trail, sweep bearing — so nothing is lost.
  Never substitute a shimmer/spinner for the fallback.

## 7 · Suggested Compose approach

The reference implementation already does this; keep new work on the same pattern:

```kotlin
@Composable
fun HuntRadarHero(modifier: Modifier = Modifier) {
    val animate = rememberBrandMotionEnabled()          // lifecycle + ANIMATOR_DURATION_SCALE
    val phase = rememberBrandPhase(animate)             // State<Float>, constant 0f when off
    Box(modifier.fillMaxWidth().heightIn(min = 160.dp)) {
        Spacer(Modifier.matchParentSize().drawWithCache {
            // static field, ticks, grid, strokes, Paths built once per size
            onDrawBehind { drawHuntRadar(phase.value, /* geometry */) }
        })
        Column(Modifier.align(Alignment.CenterStart).fillMaxWidth(0.42f)) { /* Text */ }
    }
}
```

- **One phase state**, read inside the draw scope (`phase.value` in `onDrawBehind`/`Canvas`) so a frame
  invalidates **draw only** — no recomposition per frame.
- Static art in `drawWithCache`; reuse one `Path` for the trail (`reset()` + `lineTo`), reuse `Stroke`
  objects and a `FloatArray` scratch buffer for pose maths — zero allocation in the draw loop.
- Cheap per-frame maths only: ~2 orbit evaluations for hunters, 26 trail samples, 3 pings.
  Budget < 1 ms/frame on the low end; no `Brush`, no `Blur`, no per-dot `drawCircle` allocations.
- Optional: `Modifier.semantics { contentDescription = null }` on the canvas (decorative) — the copy is
  the accessible content; add a `testTag("brand_motion_banner")` for screenshot tests.

## 8 · Implementation status and the one delta to sync

`android/app/src/main/java/com/manhunt/app/ui/BrandMotion.kt` (task-42) implements this spec: 4 s loop,
`rememberInfiniteTransition` phase read in the draw phase, cached static field, reused trail `Path`,
`ANIMATOR_DURATION_SCALE` + lifecycle gating, 2 Hunters on the compact plate, drawn wordmark paths inlined
verbatim, localised text outside the canvas — and `BrandMotionTest.kt` covers it.

**One sync item:** that port was taken from an earlier revision of `motion-core.js`. It still carries the
original Hunter constants (`lag = 0.085 + i·0.031`, `close = 0.80 − i·0.013`, no lateral fan) and trail
span `0.20`. The canonical kit (and these key frames) uses the **fanned Hunter net** in §2
(`lag = 0.055 + i·0.035`, lateral fan `±(6 + i·2.2)°`, `close = 0.74 + …`) and trail span `0.14`.
Visually the delta is small, but exact parity with the kit (and with the banners) needs those constants
updated. Everything else in the port already matches.

## 9 · Reuse for the social short

The motion teammate can reuse the same `radarFrame()` maths for video: normalise any loop length to τ
(4 s in-app, 5 s for the GIF/banner loop) — every cue above is already loop-periodic, so no retiming of
individual keys is needed. Frame 0 and the final frame are identical by construction.
