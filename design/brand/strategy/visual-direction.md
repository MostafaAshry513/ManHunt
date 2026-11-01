# ManHunt — visual direction: "Chalk on Night Asphalt"

**Status:** proposal for the recommended direction (**PICKUP**). This is the *system* brief:
palette logic, type temperament, material, composition, motion and icon-metaphor territory.

**This file does not design the logo, the icon or the wordmark.** That is
`design/brand/identity/` (identity-designer, task-33). What follows is the rulebook the mark has to
live inside, plus the metaphors worth exploring and the tests the mark must pass.

Read with `moodboard.html` / `moodboard.png` (one-page territory plate in this folder).

---

## 1. The palette is already decided — by the product

`ui/theme/Theme.kt` assigns colour *semantically*, and the brand must not invent a second system:

| Token | Hex | Semantic role in the app | Brand role |
|---|---|---|---|
| Field | `#0B1220` | background | **the ground.** Everything sits on it; never tint it toward purple |
| Surface | `#131C2E` | cards/sheets | raised ground only, never decoration |
| Chalk | `#E6EDF7` | onBackground/onSurface, text | **the markings and the voice.** Rules, lines, type |
| Signal cyan | `#22D3EE` | `primary` — app chrome, live state, buttons | **the field and the referee.** Never a team |
| Prey coral | `#FF7A59` | `tertiary` — the PREY label | **one team.** The exposed one |
| Hunters violet | `#A79BFF` | `secondary` — the HUNTERS pill | **the other team.** The ones closing in |
| Hairline | `#2A3550` / `#3A4867` | outline / outlineVariant | rules, ticks, registration marks |
| Muted | `#A7B6CC` | onSurfaceVariant | secondary text only |

**Contrast check** (WCAG 2.1 relative luminance, computed for this document):

| Pair | Ratio | Verdict |
|---|---:|---|
| Chalk on Field | 15.89:1 | AAA |
| Signal cyan on Field | 10.36:1 | AAA |
| Hunters violet on Field | 7.82:1 | AAA |
| Prey coral on Field | 7.29:1 | AAA |
| Muted on Field | 9.10:1 | AAA |
| Field on cyan (button label) | 10.36:1 | AAA |
| Chalk on Surface | 14.45:1 | AAA |
| Cyan on hairline `#2A3550` | 6.74:1 | AA at all sizes |

**Rules.**

1. **Cyan is never a team and coral/violet are never the field.** This is the one systemic
   distinction that makes ManHunt legible: the cyan thing is the game; the coloured thing is a
   player. Any asset that breaks this teaches the wrong thing.
2. **Never rely on team colour alone.** Coral and violet are close in luminance and both shift under
   common colour-vision deficiency. Every team cue is paired with a name, a label or a distinct
   shape — as the app already does with PREY/HUNTERS pills.
3. **No gradients, no glow, no neon bloom, no "AI purple".** Flat fills only. Depth comes from
   hairlines and overlap, not from light. (The install page's subtle radial background is an accepted
   exception — it is a page ground, not brand decoration.)
4. **Light theme is a translation, not a second identity.** The light scheme in `Theme.kt`
   (`#F7F9FC` background, darker teal/orange) is the same system with the ground inverted; the
   brand's hero assets are dark-first because the game is played at night.
5. **One hot colour per composition.** If cyan and coral and violet are all shouting, nothing reads.

---

## 2. Visual philosophy (the one page to keep above the desk)

**Chalk on Night Asphalt.** The pitch is not built; it is borrowed — a car park, a campus quad, six
streets and a stairwell — and at night the only thing that makes it a field is what someone drew on
it. So the brand draws like a player does: chalk lines that are slightly too thick, a circle that
does not quite close, arrows that get shorter as they run out of room. Nothing is rendered; everything
looks *marked*. The ground is the darkest thing in the frame and the markings are the light. Colour
does not decorate the markings — colour is reserved for the two things that move, so a glance tells
you who is a player and who is only the field. A clock is always somewhere in the composition,
because the clock is what makes a game a game. The craftsmanship shows up as restraint: exact
baselines, consistent hairlines, one decisive gesture per surface, and nothing else. It should look
like a plate from a field guide to a sport that does not exist yet.

**Material:** chalk dust on asphalt, printed registration marks, a stadium scoreboard, a map
screenshot at night. **Not:** glassmorphism, neon HUDs, 3D bevels, grain-for-texture's-sake.

---

## 3. Typography

**Temperament:** a condensed or semi-condensed athletic grotesque in the DIN tradition — the letter
shapes of kit numbers, stadium signage and racket-sport scoreboards. Display type is wide-tracked
nothing, tight-leading, heavy; small type is the same family at book weight. This is *not* the
default SaaS geometric sans and not a serif.

**Licensing is a hard constraint.** The app currently bundles **no custom font** — it uses the system
default with `FontWeight.Black` and negative letter-spacing at 40 sp (`Theme.kt`). `Bahnschrift` is
the best visual match on Windows and is used only inside this folder's moodboard as a **stand-in**;
it is Microsoft-licensed and **must not be bundled or redistributed**. For anything that ships,
choose an OFL/Apache face and record the licence:

| Use | Candidate (verify licence before shipping) | Why |
|---|---|---|
| Display / numerals | Barlow Condensed (OFL), Archivo (OFL), Saira Condensed (OFL) | DIN-adjacent, athletic, free to embed |
| UI body (Android) | Roboto (already on device) | zero bytes added to a 2 MB APK |
| Micro-labels / telemetry | a mono already on device, or none | only where it *is* data — never as decoration |
| Arabic pairing | IBM Plex Sans Arabic (OFL) or Noto Kufi Arabic (OFL) | same squared, technical temperament as the Latin |

**Scale rules.** Keep the existing app scale (`Theme.kt`) for UI; the brand's display voice may go
much larger and much tighter, but never below 12 sp for anything a player must read. Numerals are
**tabular** wherever a clock or a score appears so digits do not dance as they change.

**Forbidden type moves:** a single word in italic/bold inside a headline, ALL-CAPS eyebrow labels on
every block, "WORD — fragment" label patterns, letterspaced small caps as decoration, a mono face
for anything that is not data.

---

## 4. Composition and material

- **Borrowed-pitch geometry:** touchline corners (two hairlines meeting at 90°), a centre circle that
  the mark can sit on, a tally/scoreboard row, an edge marking. Used as *structure*, not pattern.
- **Chalk:** an irregular, slightly dusty stroke edge (≤ 2 px of hand-wobble), never a perfect vector
  circle pretending to be chalk.
- **Registration marks / crop ticks** at the plate edge for print-feeling surfaces only.
- **Asphalt grain:** a very low-contrast noise over the field colour (2–4% opacity, never a texture
  overlay on text).
- **Margins are a rule, not a taste:** all content inside a margin; nothing bleeds off a plate except
  deliberately in a photograph-less poster, and never on an install page or a store asset.
- **One decisive gesture per surface.** The board, the poster, the end card each get one bold move;
  everything else is hairlines and space.

---

## 5. Motion vocabulary

The brand's motion is **broadcast graphics, not app animation**.

| Cue | Behaviour | Where |
|---|---|---|
| **Clock** | numerals change without easing; a 1 px tick line advances each second | any stream/short, timer surfaces |
| **Zone draw** | cyan ring draws at constant speed (linear, never springy) with the tail slightly thicker | hunting map, video beats |
| **Trail draw** | coral path grows from the tail at constant speed; never bounces | hunting map, video beats |
| **Report ping** | one cyan ring expands from a dot and fades; 400–600 ms, linear | position-report beat |
| **Tag snap** | the violet ring closes the last few pixels in 120 ms, hard cut, one frame of inverted colour | the tag beat, end card transition |
| **Lower third** | caption enters on the same hard cut, no slide, holds, leaves on the next cut | captions in the short |

**Never:** fade-and-slide-up entrances for every element, bouncing/overshoot springs on UI,
particles, glow pulses, parallax for its own sake. Respect reduced-motion: every cue above has a
static equivalent (a still frame with the same information).

---

## 6. Icon-metaphor territory (explore here; do not settle it)

Constraints inherited from `docs/BRAND_BRIEF.md` §4: silhouette-driven, legible at 48 dp, works in
monochrome, no text, mark inside the **66 dp safe zone** of the **108 dp** canvas, no licensed
material, works on `#0B1220`. Avoid: generic map pin, crosshair-only, letter M in a circle.

Worth exploring, in priority order:

1. **The unclosed circle.** The hunt zone as a cyan ring with a deliberate gap — someone is out of
   it, or is about to be. Strong, abstract, scales to 48 dp, and reads as "chase" not "map".
2. **The touchline corner.** Two thick hairlines meeting at 90° with a solid dot at the vertex — a
   corner flag, but the dot is a player. Extremely legible at 48 dp and in monochrome; the risk is a
   "video-call/recording" or "crop corner" misread, so the dot must carry it.
3. **The tag instant.** A small filled dot *touching* the outside of a ring — the only verb in the
   game. Distinctive if the contact point is unmistakable; otherwise it reads as a target (the
   current launcher's crosshair problem).
4. **Two kits.** Two opposing wedges/chevrons entering from opposite edges, meeting off-centre,
   coral and violet with cyan only as the ground's rule line. Owns the palette logic instantly; risk
   of reading as a generic "VS" or a payment app.
5. **The pursuit path around a block.** A dashed line turning a corner around a solid rectangle —
   "the neighbourhood is the block". Good story, weakest at 48 dp (the dash count collapses).

**The mark must pass, in order:** (a) the silhouette test at 16 px, (b) the monochrome test on pure
black and pure white, (c) the "is this a chase, not a navigation app?" test with five strangers,
(d) the 66 dp safe-zone test in an adaptive icon, (e) the "no letter, no pin, no crosshair" test.
If a metaphor fails (a) or (c), it is out regardless of how good it looks big.

---

## 7. Applications (what the system looks like when it ships)

| Surface | Rule |
|---|---|
| App icon / adaptive / monochrome | mark only; field colour background; the mark must hold at 48 dp and in themed monochrome |
| Install page hero | eyebrow `MANHUNT` (chalk, small), slogan in display type, descriptor under it, one cyan line as the only decoration, dark ground |
| Video end card | field colour, slogan, honest install line, "© OpenStreetMap contributors" only if tiles were shown |
| README feature graphic (1024×500) | field colour, mark + slogan + one chalk line; no screenshot collage |
| Poster / sticker | one chalk gesture, one slogan, the URL; nothing else |
| Social avatar | the mark at 400 px, cropped to safe area — never the wordmark in a circle |

---

## 8. Do / don't at a glance

| Do | Don't |
|---|---|
| Flat fills, hairlines, chalk edges | gradients, glows, neon, glass, 3D |
| Cyan = field/referee; coral/violet = teams | cyan as a team colour, or three teams of colour |
| One bold gesture, lots of dark space | five elements competing on each surface |
| Condensed DIN-tradition display type | default geometric sans on default grey cards |
| Numerals tabular, clock somewhere | numerals as decoration, fake timers |
| Original vector geometry | stock icons, traced logos, AI-image collage |
| Arabic with an Arabic-designed companion face | Latin face with Arabic bolted on |

---

## 9. Handoff — what identity-designer still owns

Not decided here, on purpose: the final mark, its construction grid, clear space, the wordmark
drawing, the launcher exports (adaptive/monochrome/legacy/Play 512), the lockup proportions, and the
asset licence file. This document supplies: the constraint set (§1, §6), the temperament (§2, §3),
the material and motion vocabulary (§4, §5), and the tests the mark must pass (§6).
