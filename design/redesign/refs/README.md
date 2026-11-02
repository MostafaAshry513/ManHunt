# Rendered concept refs — "Matchday Board"

**Status:** concept references for the app redesign (task-48). **Not app code, not screenshots of the app.**
These are rendered design refs to show the direction in [`../direction.md`](../direction.md); the actual app
implementation is task-51 and the premium capture set is [`../screenshot-shotlist.md`](../screenshot-shotlist.md).

---

## What is here

| File | What it shows |
|---|---|
| [`out/direction-board.png`](out/direction-board.png) | The whole direction on one plate: the Board, type, palette, components, FieldMarks, three rendered screens, what we remove. Start here. |
| [`out/home.png`](out/home.png) | Home (dark): masthead + drawn field plate + permanent line + host/code verbs. |
| [`out/home-light.png`](out/home-light.png) | Home in the "daylight chalk" light theme; the drawn field plate is translated, the brand stays. |
| [`out/auth.png`](out/auth.png) | Auth: plate + permanent line + quiet form; server setup demoted to a footer row. |
| [`out/lobby.png`](out/lobby.png) | Lobby (host, all ready): Board + invite code + team sheets + pinned Begin dock. |
| [`out/lobby-rtl.png`](out/lobby-rtl.png) | The same Lobby in Arabic RTL (genuinely mirrored; code/clock stay LTR; status bar not mirrored). |
| [`out/hunt.png`](out/hunt.png) | Live hunt (Hunters): Board clock/zone/prey, full-bleed field, report pings/trail/stale marker, one action, OSM credit. |
| [`out/chat.png`](out/chat.png) | Chat as a field log: mono time gutter, team-coloured names, phase rules, no bubbles. |
| [`out/result.png`](out/result.png) | Result as a full-screen scoreboard: FULL TIME board, winner word, score, trail plate, final team sheets. |
| [`out/settings.png`](out/settings.png) | Settings as a ruled manual page (no icon tabs, no cards): theme, type preview, language, permissions, updates. |

Sources: `*.html` + `app.css` + `parts.js` (all editable; re-render after changes). Render tools:
`tools/browser.mjs` (local HTTP + headless-Chrome CDP, waits for `document.fonts.ready`) and
`tools/render.mjs`. `tools/fix-encoding.mjs` / `tools/tune*.mjs` are one-shot maintenance scripts from the
authoring session — keep or delete, they are not needed to re-render.

```powershell
cd design/redesign/refs
node tools/render.mjs
# -> out/*.png at 822 x 1782 (411 x 891 dp @2x) and the 1600 x 1780 direction board
```

---

## Provenance and rights

- **Mark and wordmark:** the official approved geometry, inlined verbatim from
  `design/brand/identity/final/lockup/` (`mark-light-on-dark.svg` ring + coral dot; the seven drawn wordmark
  paths from `wordmark-light-on-dark.svg`). Not redrawn, re-tracked or recoloured.
- **Fonts:** the three OFL faces the brand motion kit already ships
  (`design/brand/motion-kit/assets/fonts/`): Big Shoulders, Instrument Sans, Red Hat Mono. Licences travel with
  those files (`*-OFL.txt`). No other font is used.
- **Geometry:** all maps, field plates, pings, trails and icons are original vector work drawn for this
  concept; no OSM tiles, no stock, no third-party marks, no AI imagery. "© OpenStreetMap contributors" appears
  where a map is depicted because the implemented app uses OSM tiles; the conic refs themselves are drawn.
- **Copy:** provisional brand copy as approved for the identity ("Hide from your friends."; Arabic
  "اختبئ من أصدقائك.") and invented, clearly fictional seed data ("Riverside Run", K7M2QX, the five players).
  Not claims about the product; no player counts, store references, safety promises or fake urgency.
- **Scope:** no app/server code was edited, nothing was committed or published. These refs exist only under
  `design/redesign/`.

---

## What the refs are for (and what they are not)

**For:** giving the implementation and screenshot teams a concrete, high-fidelity target for the direction —
spacing, type scale, the Board silhouette, the team-sheet layout, the dock hierarchy, the RTL/light behaviour,
and the "field sport, not SaaS" character. Use them as a **visual reference**, then follow the token values and
screen specs (the refs are illustrations; the specs are the contract).

**Not:** pixel-exact handoff files, app screenshots, or evidence that the app currently looks like this. The
refs deliberately bypass device quirks (status bar, real map tiles, real data). The premium capture set must
come from the running app; see `../screenshot-shotlist.md`.

Deviations from the specs in these refs (acceptable for concept boards, to be corrected in implementation):

- Home's local time and the status-bar clock are static in the refs (the real app shows real values).
- The Auth footer shows the public test-server address for honesty; a release build shows the configured server.
- The live hunt ref uses drawn map geometry, not OSM tiles; the implementation keeps real OSM tiles and the
  required attribution (the ref shows the attribution line anyway).
- RTL ref uses Windows Arabic fallback (Segoe UI), not the app's device Arabic face; sizes are indicative.
- The direction board's copy is explanatory ("what we remove"), not app copy.
