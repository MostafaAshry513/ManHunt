# ManHunt site — tokens

**Status:** implementation authority for `server/src/app.ts` (the landing/install page).
Derived from — and deliberately identical to — the app redesign tokens
(`design/redesign/tokens.md`) so the site and the product read as one system.
Source of truth for markup: `refs/site-ref.html`; source of truth for fonts/map plates:
`server/public/site/`; regeneration scripts: `tools/`.

---

## 1. Typefaces (self-hosted, OFL 1.1, same three as the app)

| Role | Face | Weight | File served | Licence text |
|---|---|---|---|---|
| Display: H1, section titles, team words, big numerals | **Big Shoulders Display** | 700 | `/media/big-shoulders-700.woff2` | `fonts/BigShoulders-OFL.txt` |
| Text: body, captions, labels, buttons | **Instrument Sans** | 400 / 700 | `/media/instrument-sans-400.woff2`, `/media/instrument-sans-700.woff2` | `fonts/InstrumentSans-OFL.txt` |
| Data: manifest, SHA-256, server URL, state words, demo board | **Red Hat Mono** | 400 | `/media/red-hat-mono-400.woff2` | `fonts/RedHatMono-OFL.txt` |

Why self-hosted and not a system stack: the brand's temperament is a condensed athletic grotesque,
and Android (the device the page is about) ships neither a condensed grotesque nor the same metrics
as Windows/macOS. The redesign spec (`design/redesign/direction.md` §1) already bundles these exact
faces; the site reuses them verbatim. **No remote requests:** the woff2 files live in
`server/public/site/`, are served from the page's own origin by the allowlisted `/media/:file` route,
and the CSP is `font-src 'self'` (`style-src 'unsafe-inline'`; no JS at all).
The TTFs are subset to Latin + punctuation and converted to woff2 — 51 KB total, see
`tools/build-fonts.ps1`. Fallbacks are declared in the stack for when a file fails:
`"Bahnschrift SemiCondensed", "Roboto Condensed", "Arial Narrow", sans-serif`.

---

## 2. Type scale (web)

The app scale is in sp on a 360–430 dp canvas. The site has the same *rhythm* and roles, scaled up
for a poster: same faces, same case rules, same tracking logic. `clamp()` is used so the poster
scale compresses cleanly to 390 px without a mobile-only second system.

| Token | Size / line-height | Face | Use |
|---|---|---|---|
| `hero.title` | `clamp(48px, 9.4vw, 140px)` / **0.85**, tracking `.002em`, uppercase | Big Shoulders 700 | the slogan only — three lines, `nowrap` per line |
| `display.xl` | `clamp(44px, 7vw, 110px)` / 0.86, tracking −.006em | Big Shoulders 700 | section quotes ("The pitch is borrowed.") |
| `display.l` | `clamp(42px, 6vw, 92px)` / 0.92 | Big Shoulders 700 | section titles (h2) |
| `display.m` | `clamp(26px, 2.6vw, 38px)` / 1 | Big Shoulders 700 | round beats, note titles, team headings |
| `board.clock` | `clamp(28px, 3vw, 50px)` / 0.88, tabular | Big Shoulders 700 | demo board clock (hero HUD + field band board) |
| `board.meta` | 12px / 1.5 mono | Red Hat Mono | board gutter data ("Prey 1 / 2", "Zone 240 m") |
| `title` | `clamp(22px, 2.2vw, 30px)` / 1 | Big Shoulders 700 | pass metadata numbers |
| `headline` | 17px / 1.3, 700 | Instrument Sans | ledger row titles |
| `body` | 17px / 1.55, 400 | Instrument Sans | default body copy (mobile 16px) |
| `body.small` | 14.5–15.5px / 1.55 | Instrument Sans | supporting copy, film caption |
| `label` | 13–15px / 1, 700 | Instrument Sans | buttons, links, captions |
| `caption` | 12.5–13.5px / 1.55 | Instrument Sans | hints, privacy notes |
| `data` | 12px / 1.5 mono, tracking +.04em, tabular | Red Hat Mono | manifest meta, server URL, footer fine print |
| `data.small` | 10.5–11px / 1.5 mono | Red Hat Mono | picture captions, attribution |
| `state` | 11px / 1 mono, tracking +.10em, uppercase | Red Hat Mono | true machine state only: `HUNTING`, `LIVE`, `TONIGHT`, `THIS SERVER` |

**Rules**
- Sentence case everywhere except: the drawn wordmark, `state` words, team names (`Prey`, `Hunters`)
  and the hero slogan (poster display type). No tracked-out ALL-CAPS eyebrow above every heading —
  the section marker lives in the margin rail as `01 / THE FIELD`.
- One display moment per block; the hero slogan is the only thing at `hero.title` size.
- No single-word italic/bold accent inside a headline; the whole line is the treatment.
- Data numerals tabular (`font-variant-numeric: tabular-nums`) on every clock, stat, version, size,
  date and hash.
- Reading measure ≤ 68ch for prose; `max-width` declared on the block, not on the window.
- The mono face is only for machine data — never headings, never prose.

---

## 3. Colour (locked by the product — no second system)

| Token | Hex | Role |
|---|---|---|
| `--field` | `#0B1220` | page ground, always the darkest |
| `--plate` | `#131C2E` | raised ground: the download pass plate, screenshot mats |
| `--raised` | `#1D2840` | (reserved: selected/inside-plate states; not used on the marketing page) |
| `--chalk` | `#E6EDF7` | type, rules, markings |
| `--muted` | `#A7B6CC` | secondary type (9.1:1 on field) |
| `--dim` | `#7C8DA8` | tertiary data / fine print (6.6:1 on field) |
| `--hairline` | `#2A3550` | structural rules, dividers |
| `--hairline-strong` | `#5E7198` | plate edges, secondary button border, figure frames (3.4:1) |
| `--cyan` | `#22D3EE` | **the field and the referee** — one CTA fill per view, focus rings, live dot, zone |
| `--on-cyan` | `#04222B` | label on cyan (9.2:1) |
| `--coral` | `#FF7A59` | **Prey only** — prey dot, prey tag, trail |
| `--violet` | `#A79BFF` | **Hunters only** — hunter dots, hunters tag |
| success/error | n/a / `#FF8A8A` | not used on the marketing page; no forms here |

**Rules**
- Cyan is never a team colour and neither team colour is ever the field.
- **One hot cyan surface per viewport**: the hero primary button, later the pass button. The nav
  "Download the APK" is an outline button for exactly this reason. Everything else is chalk/hairline.
- Team colour is always paired with a **glyph + name** (`Prey` / `Hunters` tags), never colour alone.
- Flat fills only. **No gradients, glows, shadows, blur or glass.** Depth comes from overlap,
  hairlines, plate tone steps and the (flat) map imagery. The one "texture" is a 2.4 % asphalt grain
  over the field via an inline SVG noise data-URI — never over text.
- Links are chalk with a 1 px underline rule (hover: full chalk); they are never cyan text.
- The real map plates are filtered through the app's exact **Deep Teal** matrix
  (`DarkPalette.kt`, ported in `tools/make-map.ps1`) so the site's ground *is* the game's map ground.

---

## 4. Layout

- Content max **1360 px**, page gutters `clamp(20px, 4.4vw, 64px)`, 12-column grid,
  `gap: clamp(16px, 2.4vw, 32px)`.
- Desktop body sections use a **96 px margin rail** carrying the programme marker
  (`01 / THE FIELD`) — the running head is a structural device, not an eyebrow above the heading.
- The hero is **asymmetric**: copy on 6 columns, real-map plate on columns 7–12 and **bleeding off
  the right viewport edge**. The field is bigger than the frame.
- Section rhythm: full-bleed poster → ruled fixture strip → map field guide → 4-beat round strip →
  staggered screens → big typographic quote + rules ledger → single download plate → ruled Q&A.
  No section is a rounded card; only the interactive download block gets a `plate` (radius 2).
- Responsive:
  - `>1020 px`: full asymmetric layout, margin rail, absolute map annotations.
  - `641–1020 px`: single column, hero stacks (copy above a full-bleed map band), annotations become
    a ruled 2-column legend under the band, screens 2-up, pass stacks.
  - `≤640 px`: 18 px gutters; poster type `clamp(48px, 15vw, 82px)`; band is 4:3 full-bleed;
    screens become a horizontal snap-scroll rail (78 vw cards with a peek); ledger rows stack.
- Alignment: everything is left-aligned to the common optical margin. No centred prose.
- Spacing scale: 4 px base. Site rhythm uses 4/8/12/16/24/32/40/48/56/64/96/116 px only.

---

## 5. Shape, border, elevation

| Token | Value | Use |
|---|---|---|
| `radius.plate` | `2px` | buttons, team tags, plates, HUD panels, image frames |
| `radius.field` | `0` | rules, bands, full-bleed imagery, dividers |
| pills / 16–24 px radii | **banned** | the old page's 14–22 px card radii are removed |
| `border.hairline` | 1px `#2A3550` or chalk 14–18 % | rules, dividers |
| `border.control` | 1px `#5E7198` | outline buttons, image frames, plate edge |
| `border.focus` | 2px `--cyan`, 2px offset | every focusable element (chalk ring on cyan fills) |
| elevation | **zero** | no box-shadows anywhere; the pass plate uses a 1px edge + tone step |

No nested plates. Plates never contain prose. The download pass is the only large bordered plate.

---

## 6. Motion

One orchestrated page-load moment in the hero, then stillness. All CSS, all disabled under
`prefers-reduced-motion: reduce` with the complete static frame left behind.

| Cue | Behaviour | Timing |
|---|---|---|
| Hero veil | map plate fades in from the field colour | 600 ms linear, 50 ms delay |
| Hero headline | each line rises out of an overflow mask (no fade), one after another | 520 ms `cubic-bezier(.16,1,.3,1)`, 80/160/240 ms delays |
| Zone arc | Open Zone ring draws from its gap, constant speed | 1100 ms linear, 250 ms delay |
| Prey trail | coral dashed trail marches slowly | 1600 ms linear, infinite |
| Dots | hunters + prey appear after the ring lands | 300 ms linear, 900/1050 ms delays |
| Report ping | three expanding coral rings from the prey dot, then stop | 2600 ms, 3 iterations |
| Hover/focus | colour/border swaps only — no lift, scale or shadow | 120–160 ms linear |

No scroll-triggered reveals, no stagger-per-section, no parallax, no autoplay video, no sound.
The hero is the only animated surface; everything below it is quiet.

---

## 7. Accessibility

- Contrast: body/muted/dim all ≥ 4.5:1 on field (muted 9.1:1, dim 6.6:1); cyan on field 10.4:1;
  on-cyan on cyan 9.2:1; team text on its 12 % tint ≥ 6.3:1. Large display type ≥ 3:1.
- One `<h1>` (the slogan), one `<h2>` per section, `<h3>` for sub-items; no heading skipped.
- Skip link; visible 2 px cyan focus rings with 2 px offset on every link/button/`summary`.
- All images have alt text; the map plates are `figure`s with captions that carry the OSM attribution.
- The demo board (`HUNTING 42:17`) is `aria-hidden` decoration and labelled "Illustration" in plain
  text, so no one mistakes it for live state.
- `<details>` for the questions — native, keyboard accessible, no JS.
- Reduced motion: all animation off; the still hero keeps every piece of information.
- Type is `rem`-independent? (the page uses px clamps by design — a poster's layout is fixed); all
  copy reflows without clipping at 200 % browser zoom (verified in Chrome).

---

## 8. Component inventory (site-specific, built from the tokens)

| Component | Description |
|---|---|
| `masthead` | sticky, 62 px, hairline bottom, drawn horizontal lockup, 4 nav links, outline APK button (mobile: lockup + button) |
| `hero` | 12-col asymmetric poster: team-tag kicker, 3-line slogan, deck, primary CTA + film link, data honesty line; real-map plate with HUD, zone arc, prey/hunter dots, trail, ping; caption strip |
| `fixture strip` | ruled line: `TONIGHT`, "One street. One clock.", aggregate stats (dynamic) |
| `running head` | margin-rail programme marker: number, rule, section name |
| `field band` | full-width real-map plate (Deep Teal) + top board strip + 4 annotated notes with connector ticks + caption/attribution |
| `field legend` | the same four annotations as a ruled list on tablet/mobile |
| `team tag` | 28 px, 1 px team border, 12 % tint, glyph + name — Prey coral, Hunters violet |
| `round strip` | 4 ruled beats (`01 ROOM` … `04 RESULT`) with tick rules; true sequence |
| `screen figure` | hairline-framed phone capture + ruled caption (name + one line) |
| `rules ledger` | label/title/copy rows separated by hairlines, two columns desktop, one mobile |
| `quote` | the brand sentence in `display.xl`, second line muted |
| `pass plate` | the only plate: pass title, manifest meta grid, primary download, SHA block, server line, warning rule, install steps |
| `questions` | native `<details>` rows with hairline dividers and a +/× marker |
| `footer` | hairline, lockup, three link columns, fine print (MIT, OSM, honest install line, "not a safety service") |
