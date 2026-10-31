# Map design options (chosen: C + 2)

**Status:** the owner chose **Layout C (tactical map-first) + Style 2 (Deep Teal)**. Both are
implemented in v0.13.0: the live-hunt Game page is now full-bleed map with a bottom hunt
sheet, and the raster tiles use the Deep Teal matrix. The samples below are kept as the
design record and as the reference for further additions.

The old hunting map was a fixed **220 dp** card with side margins, so it was boxed in and
left little room for trails. The proposals below use a real OSM tile mosaic around central
London with the same zone/trail/prey/own-position overlays, rendered through
`MapSamplesTest` (Robolectric phone screenshots).

**Nothing here ships until the owner picks.** Once chosen, the production `MatchMap` and the
room layout will be updated to match. The chosen pair is already implemented; future
additions should build on it rather than introducing a second layout.

## Layout options

Open: [`docs/map-samples/layout-options.png`](map-samples/layout-options.png)

| | Layout | What it does |
|---|---|---|
| **A** | **Immersive edge-to-edge** | Map bleeds to the screen edges below the tabs, bottom corners rounded, HUD/timer/prey chips float on top, controls sit top-right. A hunt card with “Tag prey” follows below. Best balance of map size and readable controls. |
| **B** | **16:9 floating card** | Map is a 16:9 rounded card with side margins, floating chips/controls, then the hunt card. Keeps the current card feel but removes the fixed-height letterboxing. |
| **C** | **Tactical map-first** | Map fills the whole content area; a translucent bottom sheet holds the hunt status and Tag/Pause/End actions. Most immersive; least room for chat/roster below. |
| **D** | **Current fixed card** | Baseline: 220 dp card with margins. Shown for comparison only. |

Recommended: **A** for the best fit on normal phones; **C** if map-first is the priority.

## Style options

Open: [`docs/map-samples/style-options.png`](map-samples/style-options.png)

| | Style | Notes |
|---|---|---|
| **1** | **Ink** | The current app filter: inverted OSM tiles with navy/grey tones. Familiar but low colour personality. |
| **2** | **Deep teal** | Navy shadows with teal labels/roads, matching the app's cyan accent. Recommended for the dark UI. |
| **3** | **Slate** | Neutral grayscale dark map; zone/prey colours pop the most. |
| **4** | **Daylight OSM** | Soft raw OSM palette. Works if a light map is wanted even in the dark UI; strongest contrast for streets/labels. |

Recommended: **2 — Deep teal**.

## Notes

- Screenshots use OSM tiles for visual fidelity, but the production app must keep the required
  **© OpenStreetMap contributors** attribution link (already in the map).
- The sample map layers are mock overlays; production would keep server-authoritative
  positions/trails and the same zoom/recenter behaviour, plus “fit the zone and prey” on open.
- Proposed implementation: replace the fixed-height map box with the chosen layout, add the
  chosen tile filter/aspect, frame the zone+prey on entry, and remove attribution/control
  clutter that now competes with the card.

Reply with the layout letter and style number (for example `A + 2`) and I will implement and
ship it through the normal test → CI → release → update-channel flow.
