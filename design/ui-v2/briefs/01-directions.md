# Direction territories

Three territories, deliberately different so the owner can see a real spread. Each designer owns one and must
apply it consistently to the whole page set. A territory is a starting point: sharpen it, name it, own it — but
do not drift into another territory, and record deviations in `NOTES.md` with a reason.

Shared anchors (all directions): Open Zone mark + wordmark from `design/brand/identity/final/`, the three OFL
faces, and the *meaning* of the palette — cyan = field/rule/time, coral = Prey/exposed, violet = Hunters/closing
in. You may reweight, extend or restyle those colours, but the semantic roles must survive. Dark is the primary
theme; each direction proves light + Arabic RTL on the two proof pages.

---

## A — "Matchday, raised"

**Thesis:** the shipped direction is right; this is its definitive version. The app is match equipment —
scoreboard, team sheet, chalked pitch, field log, match report — executed with enough confidence and craft that
it looks finished rather than stylish.

**Explore:** board/clock as the dominant object (scoreboard scale, tabular numerals, 24h masthead logic);
chalk-rule geometry; plate hierarchy that is unmistakable at a glance; stronger colour blocking using team
colours only where they mean something; a type ladder where display type carries the game and UI text stays
quiet; states (tag claim, full time) as moments, not dialogs.

**Avoid:** adding decoration for its own sake, gradients/glows/bevels, generic card stacks, "dashboard" chrome,
redoing what already works just to differ.

**Risk:** safe — may land too close to v0.16. Push the craft and scale hard enough that the difference is
obvious in a side-by-side.

---

## B — "Street signal"

**Thesis:** this is a game played on borrowed asphalt at night with your friends — loud, physical, social. The
UI should feel like the game's own street poster and kit, not a sports app. Expressive type, flat bold colour
fields, stencil/tape/sticker gestures, celebratory moments.

**Explore:** poster composition (one big idea per screen), oversized display numerals and verbs; flat colour
blocks and contrast panels instead of shadows; diegetic labels (chalk, tape, stencil, kit tags, marker
handwriting as vector); playful but legible interactions; the result and tag moments as *events* (stamp,
whistle, full-time board).

**Avoid:** gradients, glows, glassmorphism, skeuomorphic textures, illegible display type in body roles,
novelty that hurts a dark street at arm's length, gamer-neon cliché, clutter.

**Risk:** highest. Must stay calm and legible under stress (running, dark, one hand). If the poster idea starts
hurting usability, pull back the expression, not the usability.

---

## C — "Field instrument"

**Thesis:** a precision instrument for a real-world hunt — like a rugged GPS/field device built by people who
care about legibility, not decoration. Map-first, information-dense but quiet, monospaced data, near-invisible
chrome. Confidence through precision.

**Explore:** full-bleed map as the product surface; HUD-style overlays with fine rules and mono coordinates/
timers; depth through hairlines and tonal steps, no cards; compact status bands; instrument typography
(Big Shoulders for labels/headlines, Red Hat Mono for data, Instrument Sans for prose); the board as a heads-up
readout; settings/roles as a calibration manual.

**Avoid:** cold enterprise dashboards, eighties "tech" framing, tiny text to look dense, hiding essential
actions behind icon-only chrome, losing the human warmth of the game.

**Risk:** medium — can feel unfriendly. Keep one warm/human moment per key page (result, tag claim) and use
generous type sizes for actions.

---

## What every direction must produce

- The 12 canonical pages + `lobby-rtl` + `home-light`, at 390×844 dp, rendered 1170×2532.
- A one-page visual thesis (`NOTES.md`) with: idea in one paragraph, type/colour/spacing/component decisions,
  per-page intent, what you deliberately rejected, Compose/feasibility notes, known weaknesses.
- A direction contact sheet (env tool) so the owner can judge the whole system at once.
- Honest, realistic copy and states; no placeholder lorem ipsum, no fake metrics.
