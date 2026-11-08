# Unslop pass — ManHunt app + site

Run against the MATCHDAY BOARD app and the NIGHT FIXTURE landing page. This was a **light-slop**
run: the structure, type and product truth were already deliberate, so the work was a polish pass
plus a real design decision — a master-colour system with five candidates — not a new skin.

Credit: unslop by Damir Sokolovsky ([@heydamir](https://github.com/heydamir/unslop)), CC BY 4.0.

## Direction

- **Product.** Real-world GPS hide-and-seek for friend groups: two teams, one code, one server-owned
  clock, played on a street or a park at night.
- **Character.** Chalked, athletic, a little conspiratorial. A pickup sport with a printed fixture
  sheet, not a social app with a map tab.
- **World.** A borrowed field under floodlights: chalk lines, safety tape, printed matchday
  programmes, the dark blue between streetlights.
- **Moments.** The live field map (real map, real trails, real reports) and the two-sided team
  sheet. Those stay the richest things on screen.
- **Signature.** The halfway line: a 1 px rule that splits Prey from Hunters, repeated as the
  ready-check rule, the section rail and the site's fixture divider.

## Audit (what was actually wrong)

| Sign | Where | Decision |
|---|---|---|
| One accent hardcoded to cyan | App theme, site `--cyan` | Replace with a selectable master colour; keep team semantics fixed |
| Master colour mixed into surfaces as well as chrome | App theme/site | Keep surfaces neutral graphite/navy; master only on action, selection and live signal |
| 13 wide-tracked uppercase labels on the site | `site-ref.html` eyebrows, stats, ledger | Keep the matchday programme voice, but treat these as editorial labels; no new ones, no emoji |
| Two neutral gradients in the site | field/map overlays only | Keep — they are one-neutral tone shifts, not hue gradients |
| No glows, gradient text, emoji icons, looping motion | App + site | Confirmed absent; do not add them |
| Home's map band can look decorative at first glance | App Home | It is the product's real live map; keep it, do not replace with a generated hero |
| Theme previews could contradict the chosen accent | Site screenshots | The site now themes its chrome; embedded product captures stay real app captures |

**Verdict:** no heavy slop. No layout rewrite. The useful redesign was the colour system and the
choice it creates.

## Master colours

All five keep the same neutral ramp and the fixed Prey coral / Hunters violet. Their only job is
the accent: primary action, selection, live signal, logo mark, focus and the site's action/links.

| Id | Name | Dark accent | Light accent | Character | Use when |
|---|---|---|---|---|---|
| `floodlight` | Floodlight | `#22D3EE` | `#0C6B84` | Cool, digital, current | You want continuity with the existing captures |
| `sodium` | Sodium | `#FFB454` | `#A85A00` | Streetlight warmth | You want the night-game feeling without going neon |
| `highvis` | High-vis | `#C9F25C` | `#5E7A00` | Safety-marker sport | You want the loudest, most athletic mark |
| `chalk` | Chalk | `#8FB3FF` | `#2F5AA8` | Calm field blue | You want a quieter, more premium system |
| `pitch` | Pitch | `#59D98C` | `#1F7A45` | Turf and club green | You want friendly, grounded, less nocturnal |

**Recommendation: Sodium.** It is the only candidate that changes the *world* of the app from
"technical dashboard" to "night game on a borrowed street" without touching the semantic team
colours. High-vis is the strongest poster accent but fatiguing as a button across every screen.
Floodlight is the safe incumbent. Chalk is the quietest. Pitch is the most friendly but loses the
night edge.

## Nine passes applied

1. **Spacing.** Existing 2/4/8/12/16/20/24/32 scale kept; the theme picker uses the same rhythm.
2. **Colour.** Five master palettes; one accent per screen; team semantics fixed; no hue gradients,
   glows, coloured shadows or gradient text added.
3. **Icons.** FieldMarks unchanged; no emoji; the swatch row is a control, not decoration.
4. **Copy.** No hype, no exclamation marks, no invented claims. The existing product copy survived;
   the new strings are "Master color" and one plain description.
5. **Type.** Big Shoulders / Instrument Sans / Red Hat Mono kept. No new weights or tracking.
6. **Layout.** No structure change; the master picker sits under the Theme control in Settings.
7. **Details.** One selected state, 2 dp plates, hairline borders, no pill.
8. **Visuals.** Real app captures and the real OSM field; no generated filler.
9. **Motion.** No new loops or spring entrances.

## Where to choose

- **App:** Settings → Appearance → **Master color** (five swatches).
- **Site:** `/?master=sodium` (or `highvis`, `chalk`, `pitch`; default is `floodlight`).
- **Comparison:** `theme-lab.png` — real Home renders and real site heroes side by side.

The app's choice is stored locally. The site query is a preview; it does not change the default
until the winner is promoted in code.
