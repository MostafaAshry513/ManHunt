# ManHunt — brand motion kit

Real, rendered banners and motion built on the owner-approved **Open Zone** identity, for GitHub/README,
the install site, and the app. Everything here is produced by this workstream only —
`design/brand/motion-kit/` — from a deterministic headless-Chrome render stage; no app or server code was
edited, nothing was committed or posted.

Built for the owner's ask: *banners + motion on GitHub, the install site and in the app — something
memorable, not templated.* Copy is the **provisional brand copy v2 family**; the no-slogan fallbacks are
included so the kit still works if the copy is pulled.

**Recommended primary:** the animated README hero
`out/readme/manhunt-readme-hero-1280x480.gif` (1280×480, 5 s loop, **1.10 MB**) for the repo top, with
`out/social/github-social-1280x640.png` as the GitHub social preview / static fallback, and
`site-hero/hero-snippet.html` for the install page.

---

## 1 · What is in the kit

| Surface | File | Size | Loop / detail |
|---|---|---|---|
| **README / GitHub hero** (animated) | [`out/readme/manhunt-readme-hero-1280x480.gif`](out/readme/manhunt-readme-hero-1280x480.gif) | 1280 × 480 | 5.0 s · 100 frames · 20 fps · 1.10 MB (< 4 MB) |
| README hero — static | [`out/readme/manhunt-readme-hero-1280x480-static.png`](out/readme/manhunt-readme-hero-1280x480-static.png) | 1280 × 480 | single frame |
| **GitHub social preview** (static) | [`out/social/github-social-1280x640.png`](out/social/github-social-1280x640.png) | 1280 × 640 | repo Settings → Social preview; also README static fallback |
| GitHub social — animated post cut | [`out/social/github-social-1280x640.gif`](out/social/github-social-1280x640.gif) | 1280 × 640 | 5.0 s · 1.49 MB · for posts/embeds only |
| **X / Twitter header** | [`out/social/x-header-1500x500.png`](out/social/x-header-1500x500.png) | 1500 × 500 | avatar-safe bottom-left |
| **YouTube channel art** | [`out/social/youtube-2560x1440-safe-area.png`](out/social/youtube-2560x1440-safe-area.png) | 2560 × 1440 | all copy inside 1546 × 423 safe area |
| YouTube safe-area proof | [`out/social/youtube-2560x1440-safe-area-guide.png`](out/social/youtube-2560x1440-safe-area-guide.png) | 2560 × 1440 | dashed safe box + crop notes |
| **Discord server banner** | [`out/social/discord-960x540.png`](out/social/discord-960x540.png) | 960 × 540 | static |
| Discord — animated post cut | [`out/social/discord-960x540.gif`](out/social/discord-960x540.gif) | 960 × 540 | 5.0 s · 0.91 MB |
| Banner contact sheet | [`out/social/banners-contact-sheet.png`](out/social/banners-contact-sheet.png) | 1600 × 3423 | gallery + dimensions + safe areas (`banners/contact-sheet.html`) |
| **No-slogan fallbacks** | `out/readme/manhunt-readme-hero-noslogan-1280x480.png`<br>`out/readme/manhunt-readme-hero-noslogan-1280x640.png`<br>`out/social/github-social-1280x640-noslogan.png` | 1280 × 480 / 640 | lockup + descriptor + legend only, no hook |
| **Install-page hero** (CSS + SVG, no JS) | [`site-hero/hero-snippet.html`](site-hero/hero-snippet.html) | 1200 × 600 (2:1, fluid) | 8 s CSS loop · reduced-motion poster · paste-ready for `server/src/app.ts` |
| Site hero — live still / poster | [`out/site/manhunt-site-hero-1200x600.png`](out/site/manhunt-site-hero-1200x600.png)<br>[`out/site/manhunt-site-hero-1200x600-poster.png`](out/site/manhunt-site-hero-1200x600-poster.png) | 1200 × 600 | poster = `prefers-reduced-motion` composition |
| **App hero motion spec + key frames** | [`app/README.md`](app/README.md) · [`app/keyframes.html`](app/keyframes.html) | 360 × 160 dp (1080 × 480 @3x) | 4 s Compose canvas loop · reduced-motion fallback |
| App key frames (5 stills) | `out/app/manhunt-app-hero-1080x480-tau-{00,20,40,60,80}.png` | 1080 × 480 | τ = 0 / .2 / .4 / .6 / .8 |
| App key-frame sheet | [`out/app/manhunt-app-hero-keyframes.png`](out/app/manhunt-app-hero-keyframes.png) | 1600 × 4278 | timing + layout + palette reference |

Per-surface usage, safe areas and alt text: [`banners/README.md`](banners/README.md),
[`site-hero/README.md`](site-hero/README.md), [`app/README.md`](app/README.md).
Design + algorithm philosophy behind the system: [`PHILOSOPHY.md`](PHILOSOPHY.md).

## 2 · What it looks like

The visual: a **borrowed pitch at night** — navy field, faint chalk block map and survey dot grid — with the
Open Zone mark behaving as a **radar**: cyan zone ring with its deliberate 24° gap, a rotating sweep, a coral
Prey dot running a closed evasion route with a growing chalk trail and report pings, violet Hunters fanning
in behind it but never catching. The drawn MANHUNT lockup sits on the plate; copy is short, sentence case,
honest. Flat fills only — flat cyan is the field/referee, coral is Prey, violet is Hunters.

Every loop is a pure function of one phase (τ). Frame 0 equals the last frame, so the loops close exactly
with no visible seam; the same seeded algorithm drives the GIFs, the CSS site hero, the app key frames, and
the Compose implementation.

## 3 · Copy used (provisional)

| Slot | Line |
|---|---|
| Flagship hook (README/social) | **Your friends are hunting you.** |
| Permanent short line (install page, app) | **Hide from your friends.** |
| Invite CTA (social banners) | **Create a hunt. Send the code. Hide.** |
| Descriptor | Real-world GPS hide-and-seek for Android. |
| Honest install line | free APK · Android 8+ · not on Play Store |
| Team legend | PREY / HUNTERS |
| Trust line (owned by page/app, not baked into banners) | Play with people you trust. |

The install page / app surfaces use the short form because they are trust-critical; feed/README surfaces
lead with the hook. No banner promises Play Store distribution, safety, reviews, player counts, urgency or a
fixed hunt length.

## 4 · Brand rules applied

- Lockup: official `design/brand/identity/final/lockup/` SVGs, **inlined verbatim** (`tools/sync-lockup.mjs`
  verifies SHA-256 and path equality) — never retyped, re-tracked, stretched or recoloured. Min sizes respected
  (wordmark ≥ 117 px wide / cap ≥ 22 px; horizontal lockup ≥ 180 px).
- Palette: field `#0B1220`, chalk `#E6EDF7`, signal cyan `#22D3EE` (**field/referee, never a team**), Prey
  `#FF7A59`, Hunters `#A79BFF`. Contrast on field: chalk 15.9:1, cyan 10.4:1, violet 7.8:1, coral 7.3:1.
- Team colour is never the only cue: legends are named and the Prey dot carries its own ring.
- Flat fills only: no gradients, glow, neon, bevels or glass. Chalk texture is deterministic flat dots.
- No screenshots, photos, OSM tiles or people in the art — all original generated geometry.
- Reduce-motion and static fallbacks exist for every animated surface.

## 5 · How it is built (and rebuilt)

```
tools/sync-lockup.mjs     reads assets/lockup (byte-identical official copies), verifies hashes,
                          writes src/generated/lockup.js for inlining
tools/build-site-hero.mjs samples src/motion-core.js into CSS keyframes; writes site-hero/*
tools/capture.mjs         headless-Chrome CDP capture: stills, exact-size frame sequences, pages
tools/build.mjs           full build: stills, 100-frame GIF loops + ffmpeg palette encode, contact sheets
tools/verify.mjs          GIF metadata/frame count/loop/size, PNG dims, palette, HTML + reduced motion,
                          lockup hashes; writes out/verification.json + out/VERIFICATION.md
```

```powershell
cd design/brand/motion-kit
node tools/build.mjs      # renders every asset above
node tools/verify.mjs     # must end: VERIFICATION PASSED
```

Requirements: Node 24+, local Chrome (headless) at `C:\Program Files\Google\Chrome\Application\chrome.exe`,
and the repo's `design/.tools/node_modules/ffmpeg-static/ffmpeg.exe` for GIF encode/metadata. No npm
packages are installed for this kit. The OFL display faces used in renders (Big Shoulders, Instrument Sans,
Red Hat Mono) are copied under `assets/fonts/` with their licences; they are **not** used by the paste-ready
site hero, which is system-font only.

## 6 · Verification

`out/VERIFICATION.md` / `out/verification.json` record the automated checks: GIF 1280×480 · 100 frames ·
20 fps · 5.00 s · infinite loop · < 4 MB; PNG dims for all 19 rendered files; palette presence in every
banner; site hero has zero `<script>` tags and zero network requests, CSS motion runs, `prefers-reduced-motion`
leaves zero animations and a complete poster; install-column and 390 px renders have no overflow; official
lockup byte-identity and verbatim path inlining.

## 7 · Integration notes

1. **README**: embed the hero GIF at the top (snippet in `banners/README.md`). GitHub renders inline GIFs;
   the 1.10 MB file is inside the 4 MB the task allowed.
2. **GitHub social preview**: repo Settings → Social preview → upload `github-social-1280x640.png`.
3. **Install page**: paste `site-hero/hero-snippet.html` into `server/src/app.ts` (exact steps in
   `site-hero/README.md`). This is a prepared snippet only — the install page was not edited in this
   workstream.
4. **App**: `app/README.md` is the motion contract; client-polish's `BrandMotion.kt` (task-42) already
   implements it, with one constants sync called out in `app/README.md` §8.
5. **Motion teammate**: `src/motion-core.js` exports the same `radarFrame()` used everywhere; the 15 s
   short can reuse it directly (normalise any loop to τ).

## 8 · Provenance and ownership

All geometry, layouts and motion are original work for ManHunt created in this workstream. The lockup and
mark are the owner-approved assets from `design/brand/identity/final/` (see `identity/LICENSE-assets.md`:
the owner owns the selected assets and their derivatives, including motion adaptations). The OFL fonts keep
their own licences (`assets/fonts/*-OFL.txt`). No third-party imagery, no AI-image collage, no real people.
