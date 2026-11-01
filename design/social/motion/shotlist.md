# Shot list — ManHunt vertical social short (1080 × 1920, 30 fps)

All animation is generated in `src/animate.js` from a virtual clock. Nothing is keyframed by hand in a video editor; the times below are the timings to inspect when tuning. Global entry point: `window.renderAt(t)`; beat table: `window.MH_TIMELINES.MASTER`.

| Beat | Shot | In | Out | Dur | Layers / elements | Keyframes (s) | Audio |
|---|---|---|---|---|---|---|---|
| 1 | **Chalk sweep + hook** | 0.00 | 1.50 | 1.50 | `#bg` asphalt; `#mapArt` at 55 %; `#hookBrand`; `#hookLine` (chalk line, ghost line, cyan head); `#cap1` | line sweep 0.02 → 0.88 (ease-in-out), caption fully on at t=0.00 | chalk scratch 0.02–0.94 |
| 2 | **The field / two teams** | 1.50 | 4.00 | 2.50 | chalk `#touchline`, `#cornerA/B`, `#halfway`; zone `#zoneRing` + `#zoneDash` + centre dot; `#preyDot` + label PREY; `#hunterA/B` + label HUNTERS; `#cap2` | touchline 0.05–0.85 local; corners 0.25–0.95; zone draw 0.40–1.55; tokens in 0.30 / 0.45 / 0.60; labels 0.85–1.30; token drift + breathe after 1.2 | low sub pulse at 1.5 / 2.5 / 3.5 |
| 3 | **One clock / pursuit** | 4.00 | 7.00 | 3.00 | everything in beat 2; `#trail` (coral chalk, drawn behind Prey); Prey runs `PREY_PATH`; Hunters converge; `#clock` locks top-right | clock lock 4.00 (scale/opacity, 0.22 s); Prey move 4.24–6.52; trail draws same window; Hunters converge 4.18–6.88; tick flash every whole second | ticks 4.0–7.0, pulse bed |
| 4 | **The map already knows** | 7.00 | 10.00 | 3.00 | `#appPanel` (real app render crop + chalk mat + OSM credit); `#stagePings` (3 flat coral rings from the prey marker, capped inside the shot for caption legibility); slow push-in 1.000 → 1.028; `#clock`; `#cap4` | hard cut in at 7.00; ping rings start 7.15 / 7.72 / 8.49, life 0.58; one-frame black at 9.9667 | single ping 7.0 + 8.1 + 9.1; cut dips before skip |
| 5 | **Tagged** | 10.00 | 12.00 | 2.00 | field geometry (no zone); `#preyDot` at frame centre; `#snapRing` / `#snapRing2` closing from r 700 → 54; `#clock`; `#cap5`; coral invert overlay | Prey dot in 10.00–10.10; ring close 10.04–10.36; two-frame coral invert at 10.36 (frames 311–312); ring locks + micro pulse | snap/impact 10.355, tail |
| 6 | **End card** | 12.00 | 15.00 | 3.00 | `#endcard`: rules, slogan, official Open Zone stacked lockup (`#endLockupSvg`, inline SVG), CTA, URL, install microcopy, trust line | rules 12.06–12.66; slogan 12.12–12.78; lockup wipe 12.42–13.26; CTA 12.90–13.38; URL 13.14–13.62; micro 13.38–13.80; trust 13.56–13.98; hold to 15.00 | silence after 12.0 |

## Cutdown (GIF) shot list — 6.00 s @ 15 fps, 720 × 1280

| Beat | In | Out | Dur | Notes |
|---|---|---|---|---|
| two teams | 0.00 | 1.60 | 1.60 | all chalk/token timings auto-compress (fractions of beat duration) |
| the map already knows | 1.60 | 3.30 | 1.70 | app render, pings, one-frame black at 3.2667 |
| tagged | 3.30 | 4.40 | 1.10 | ring snap at ~3.50, coral invert 2 frames |
| end card | 4.40 | 6.00 | 1.60 | official stacked lockup + slogan + CTA readable in the loop; 128-colour palette |

## Assets

| File | Use | Source / licence |
|---|---|---|
| `design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg` | end card lockup (inlined verbatim as `#endLockupSvg`) | owner-approved identity package, `LOCKUP.md`; sha256 `BF72BFDF…859B` |
| `design/brand/identity/final/lockup/wordmark-light-on-dark.svg` | cover header + hook brand bug (inlined verbatim as `#coverWordmarkSvg` / `#hookWordmarkSvg`) | owner-approved identity package, `LOCKUP.md`; sha256 `BF6E1493…600D` |
| `assets/05-map-crop.png` | beat 4 app render | crop of ManHunt-owned `docs/screenshots/05-hunting-map.png` (Robolectric render). OSM attribution carried on screen. |
| `assets/05-hunting-map.png` | full source render, kept for re-crops | ManHunt-owned `docs/screenshots/05-hunting-map.png`, copied unmodified |
| `assets/fonts/*.ttf` | all type | Big Shoulders, Instrument Sans, Red Hat Mono — SIL OFL, licences kept beside the files |
| `src/map.js` | generated block map + dot grid | original code, seed 20261101 |
| `src/field.js` | ambient "players on the field" traces | original code, seed 1409 |

## Regeneration knobs

- `src/index.html` → `#endLockupSvg` / `#coverWordmarkSvg` / `#hookWordmarkSvg`: official identity markup inlined verbatim (per `LOCKUP.md` §1). Swap only by re-inlining the canonical SVG + updating the sha256 map in `MH_LOCKUP`; never retype the wordmark.
- `src/animate.js` → `COPY`: every on-screen string (captions, slogan, CTA, URL, microcopy, trust line).
- `src/animate.js` → `MASTER` / `CUT`: beat starts and durations.
- `src/animate.js` → `ZC`, `PREY_PATH`, `HUNTER_A0/B0`, `TAG_PREY`: field geometry.
- `src/map.js` → `seed`: different block map (re-render all frames).
- `src/field.js` → `count`, `dust`, `seed`: ambient motion density.
- `src/styles.css` → `:root`: palette tokens.
