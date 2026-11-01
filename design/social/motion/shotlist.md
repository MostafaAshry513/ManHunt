# Shot list — ManHunt vertical social short v4 (1080 × 1920, 30 fps)

All animation is generated in `src/animate.js` from a virtual clock. Nothing is keyframed by hand in a video editor; the times below are the global timings to inspect when tuning. Global entry point: `window.renderAt(t)`; beat table: `window.MH_TIMELINES.MASTER`.
**v4:** the former real-screenshot beat is deleted. Beat 4 is now the same original chalk-field chase in the new slot (6.80–9.40 s). No screenshots, photos or OSM tiles appear anywhere.

| Beat | Shot | In | Out | Dur | Layers / elements | Keyframes (s, global) | Audio |
|---|---|---|---|---|---|---|---|
| 1 | **Chalk sweep + hook** | 0.00 | 1.50 | 1.50 | `#bg` asphalt; `#mapArt` at 55 %; `#hookBrand` (official wordmark inlined SVG); `#hookLine` (chalk line, ghost line, cyan head); `#cap1` | line sweep 0.02 → 1.34 (ease-in-out); caption fully readable at t = 0.00 | chalk scratch |
| 2 | **The field / two teams** | 1.50 | 4.20 | 2.70 | chalk `#touchline`, `#cornerA/B`, `#halfway`; zone `#zoneRing` + `#zoneDash` + centre dot; `#preyDot` + label PREY; `#hunterA/B` + label HUNTERS; `#cap2` | touchline 1.55–2.42; corners 1.77–2.53; halfway 1.82–2.47; zone draw 1.93–3.17; zone dash 2.74–3.39; tokens in 1.82 / 1.99 / 2.08; labels 2.42–2.90; token drift + breathe after 2.7 | low sub pulse |
| 3 | **One clock / pursuit** | 4.20 | 6.80 | 2.60 | everything in beat 2; `#trail` (coral chalk, drawn behind Prey); Prey runs `PREY_PATH`; Hunters converge; `#clock` visible top-right from 4.20 | clock visible 4.20; Prey move 4.41–6.38; trail draws same window; Hunters converge 4.36–6.70; tick flash on every whole second after 4.20 | clock ticks + low pulse |
| 4 | **The chase (replaces screenshot beat)** | 6.80 | 9.40 | 2.60 | world field, fully drawn; zone ring shrinks `#zoneRing` 336 → 246 + dashed `#zoneDash`; Prey continues along `CHASE_TAIL` with `trailDContinue(PREY_PATH, CHASE_TAIL, p)`; Hunters A/B keep converging with dashed `#hunterTraceA/B`; three more Hunters (`#hunterC/D/E`) fade in and close the net (5 violet dots); 3× coral pings `#chasePing1..3` (max r 208, capped before the caption band); `#cap4` | zone shrink 6.88–9.14; Prey run 6.85–9.09; Hunters close 6.90–9.04; labels fade 8.15–8.83; net converge 7.06–9.19; pings start 7.01 / 7.74 / 8.46 (life 0.884 each); one-frame cut to black at 9.3667 | clock ticks + pings |
| 5 | **Tagged** | 9.40 | 11.60 | 2.20 | field geometry (zone hidden); `#preyDot` at frame centre `TAG_PREY`; `#snapRing` / `#snapRing2` closing from r 700 → 54; `#clock`; `#cap5`; coral invert overlay | Prey dot in 9.40–9.50; ring close 9.44–9.80; two-frame coral invert at snap ≈ 9.796 (frames 294–295); ring locks + micro pulse | snap + impact |
| 6 | **End card** | 11.60 | 15.00 | 3.40 | `#endcard`: rules, campaign line, official Open Zone stacked lockup (`#endLockupSvg`, inline SVG), CTA, URL, install microcopy, trust line | rules 11.67–12.35; line 11.74–12.48; lockup wipe 12.08–13.03; CTA 12.62–13.16; URL 12.89–13.44; micro 13.16–13.64; trust 13.37–13.84; hold to 15.00 | silence after 11.60 |

## Cutdown (GIF) shot list — 6.00 s @ 15 fps, 720 × 1280

| Beat | In | Out | Dur | Notes |
|---|---|---|---|---|
| two teams | 0.00 | 1.60 | 1.60 | all chalk/token timings auto-compress (fractions of beat duration) |
| chase | 1.60 | 3.30 | 1.70 | animated field chase (zone shrink, 5 hunters, pings); one-frame black at 3.2333 |
| tagged | 3.30 | 4.40 | 1.10 | ring snap ≈ 3.50, coral invert 2 frames |
| end card | 4.40 | 6.00 | 1.60 | official stacked lockup + campaign line + CTA readable in the loop; 128-colour palette |

## Assets

| File | Use | Source / licence |
|---|---|---|
| `design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg` | end card lockup (inlined verbatim as `#endLockupSvg`) | owner-approved identity package, `LOCKUP.md`; sha256 `BF72BFDF…859B` |
| `design/brand/identity/final/lockup/wordmark-light-on-dark.svg` | cover header + hook brand bug (inlined verbatim as `#coverWordmarkSvg` / `#hookWordmarkSvg`) | owner-approved identity package, `LOCKUP.md`; sha256 `BF6E1493…600D` |
| `assets/fonts/*.ttf` | all type | Big Shoulders, Instrument Sans, Red Hat Mono — SIL OFL, licences kept beside the files |
| `src/map.js` | generated block map + dot grid | original code, seed 20261101 |
| `src/field.js` | ambient "players on the field" traces | original code, seed 1409 |

**No screenshots, photos, map tiles or OSM data are used in v4** — `assets/05-map-crop.png` and `assets/05-hunting-map.png` were deleted from the workstream.

## Regeneration knobs

- `src/index.html` → `#endLockupSvg` / `#coverWordmarkSvg` / `#hookWordmarkSvg`: official identity markup inlined verbatim (per `LOCKUP.md` §1). Swap only by re-inlining the canonical SVG + updating the sha256 map in `MH_LOCKUP`; never retype the wordmark.
- `src/animate.js` → `COPY`: every on-screen string (captions, end line, cover slogan, CTA, URL, microcopy, trust line).
- `src/animate.js` → `MASTER` / `CUT`: beat starts and durations (v4: 1.5 / 4.2 / 6.8 / 9.4 / 11.6).
- `src/animate.js` → `ZC`, `PREY_PATH`, `CHASE_TAIL`, `CHASE_NET`, `TAG_PREY`: field + chase geometry.
- `src/map.js` → `seed`: different block map (re-render all frames).
- `src/field.js` → `count`, `dust`, `seed`: ambient motion density.
- `src/styles.css` → `:root`: palette tokens; `.cap-text` sizes.
- Versioned build: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1 -OutDir out/v4-preview`.
