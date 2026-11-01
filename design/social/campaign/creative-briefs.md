# ManHunt — creative briefs (platform assets)

Status: **briefs for handoff, draft for owner approval.** Prepared 2026-11-01 by the growth/ads workstream.
This file does not design the final marks or videos — it specifies what each asset must be, for whom, at
what size, and which workstream delivers it. `design/brand/identity/`, `design/brand/strategy/` and
`design/social/motion/` are owned by their workstreams; the growth workstream owns only
`design/social/campaign/`.

Read with: `launch-playbook.md` (§4 concepts, §5 posting plan, §11 guardrails), `captions-and-hooks.md`
(copy IDs), `design/brand/strategy/visual-direction.md` (§1 palette semantics, §3 typography, §5 motion,
§7 applications), `design/brand/strategy/tone-of-voice.md` (claims ledger, safety), `design/brand/identity/`
(mark in progress), `design/social/motion/` (hero short in progress).

**Brand state:** direction **PICKUP** is provisional and the copy is **copy family v2** — flagship hook
**"Your friends are hunting you."**, permanent short line **"Hide from your friends."**, end-card CTA
**"Create a hunt. Send the code. Hide."** (`design/brand/strategy/slogan-v2.md`). All of it is
*provisional, pending owner approval*; the product name is pending a trademark decision. **The earlier v1
slogan “No gear. No fee. Just players.” was rejected by the owner (2026-11-01) and must not appear in any
asset; only historical decision/QA documents may cite it.** Every asset therefore ships with a
**re-renderable copy end card** and no ™/® marks. The shipped v4 cover still carries the rejected v1 line —
re-render it before use.

---

## 1. Non-negotiables (apply to every asset)

### Colour semantics (from `visual-direction.md` §1 — do not invent a second system)

| Token | Hex | Means | Never |
|---|---|---|---|
| Field | `#0B1220` | the ground / page background | never tinted purple |
| Surface | `#131C2E` | raised surfaces only | never decoration |
| Chalk | `#E6EDF7` | text, rules, markings | — |
| Signal cyan | `#22D3EE` | the game/field/referee, live state, UI chrome | never a team colour |
| Prey coral | `#FF7A59` | Prey (one team) | never the background |
| Hunters violet | `#A79BFF` | Hunters (the other team) | never the background |
| Hairline | `#2A3550` / `#3A4867` | rules, ticks, registration marks | never a glow |
| Muted | `#A7B6CC` | secondary text only | — |

Flat fills only. No gradients, glow, neon bloom, glassmorphism, 3D, or "AI purple". Depth comes from
hairlines and overlap. One hot colour per composition. Team colour is always paired with a label/name, not
colour alone.

### Typography (from `visual-direction.md` §3)

- Display: a condensed DIN-tradition athletic grotesque, OFL/Apache only. The motion workstream already
  fetched **Big Shoulders** (OFL) + **Instrument Sans** (OFL) + **Red Hat Mono** (OFL) into
  `design/social/motion/assets/fonts/` with their OFL licence files. Coordinate: identity and motion should
  use one display family; if identity picks Barlow Condensed/Archivo/Saira Condensed instead, update the
  motion end card too. **Never bundle or ship Microsoft's Bahnschrift** (stand-in only, licence forbids
  redistribution).
- Body: Instrument Sans (OFL) or the system stack; Arabic pairing: IBM Plex Sans Arabic or Noto Kufi Arabic
  (OFL).
- Numerals tabular wherever a clock/score appears. No text below 12 sp for things a player must read.
- Forbidden: one word italicised inside a headline, ALL-CAPS eyebrow labels on every block, "WORD —
  fragment" labels, letterspaced small caps decoration, mono as decoration.

### Motion vocabulary (from `visual-direction.md` §5)

Broadcast graphics, not app animation: clock numerals change without easing; zone ring draws linearly; trail
grows at constant speed; report ping = one cyan ring, 400–600 ms linear; tag snap = 120 ms hard cut with one
frame inverted. **Never** fade-and-slide entrances for everything, springy overshoot, particles, glow pulses.
Every cue has a static equivalent; respect reduced motion.

### Honest-content rules (from `tone-of-voice.md` §4 and playbook §11)

- Real UI only: real app screenshots from `docs/screenshots/` or real screen recordings of the app; never
  invent features, screens, testimonials, player counts, review stars, store badges, or fake countdowns.
- Any asset with a download CTA states the honest path: **free signed APK, Android 8.0+, not on Google
  Play, sideload warning expected** — and the install URL `http://74.208.99.178/`.
- First-contact assets (end card, install page, poster) include: "Play with people you trust. It's a game,
  not a safety service."
- Map tiles shown ⇒ **"© OpenStreetMap contributors"** visible (ODbL requirement). The current Robolectric
  map screenshot has a deliberately blank tile layer; say what it is if used ("map renders at runtime") or
  use footage with tiles.
- No safety/privacy/security promises. No "free forever". No iOS. No ™/®.
- Real people only with written consent; blur homes/plates/schools; no minors in marketing; play in
  public/permitted spaces.
- Arabic assets: MSA or Egyptian per asset (never mixed), native review required, Western digits, Latin
  words isolated, timers never mirrored.

### File hygiene

- Naming: `manhunt_{asset}_{platform}_{w}x{h}_{lang}_{variant}.{ext}` (e.g.
  `manhunt_short_tiktok_1080x1920_en_v1.mp4`).
- Keep source files (SVG/AI/HTML/CSS/JS) next to exports; declare licence/ownership (follow
  `design/brand/identity/LICENSE-assets.md` pattern).
- Deliver **clean masters** (no platform UI, no watermark from another app). The operator re-exports per
  platform — never download a TikTok-branded file and reupload it to Reels.
- No app/server code edits from these workstreams; integration into `server/src/app.ts` (OG image, favicon)
  and Android resources is the owner's pass.

---

## 2. Asset index

| ID | Asset | Owner workstream | Deliver to (path) | Format / size | Priority | Depends on |
|---|---|---|---|---|---|---|
| BR-01 | Mark / wordmark master + social exports | identity-designer | `design/brand/identity/exports/` (create) | SVG source + PNG 1024, 400, 48 | P0 | owner mark approval |
| BR-02 | App icon system: adaptive layers, legacy rasters, Play-style 512, monochrome | identity-designer | `design/brand/identity/exports/icons/` | SVG + PNG set (see §3.2) | P0 | BR-01 |
| BR-03 | Social avatar kit (profile pictures) | identity-designer | `design/brand/identity/exports/social/` | 400×400 PNG, 320×320 safe crop | P0 | BR-01 |
| BR-04 | Hero vertical short 12–15 s + A/B slogan end cards | motion-designer | `design/social/motion/out/` | MP4 1080×1920, 9:16 | P0 | copy IDs, owner footage, slogan note |
| BR-05 | GIF cutdown (5–8 s) | motion-designer | `design/social/motion/out/` | GIF 1080×1080, ≤8 MB; alt 800×450 | P1 | BR-04 |
| BR-06 | Covers / thumbnails | motion-designer (+ identity mark) | `design/social/motion/out/covers/` | 1080×1920 (TT/Reels/Shorts), 1280×720 (YT), 1280×640 (GitHub) | P0 | BR-01, BR-04 |
| BR-07 | Feature graphic (README/GitHub-style) | identity-designer or brand-director | `design/brand/identity/exports/` | 1024×500 PNG | P1 | BR-01, slogan |
| BR-08 | Link-preview (Open Graph) image for install page/GitHub | brand-director (design) + owner (integration) | `design/brand/strategy/` or identity exports | 1200×630 PNG | P1 | BR-01, slogan, owner server pass |
| BR-09 | Carousel / stills template (4:5) | growth (compose from real screenshots) | `design/social/campaign/assets/` | 1080×1350 PNGs | P2 | BR-01, brand template; real screenshots |
| BR-10 | QR card + link-in-bio copy/layout | growth (QR + URL), brand-director (copy), owner (hosting integration) | `design/social/campaign/assets/` | QR SVG/PNG 1024 + card PDF/PNG | P0 | UTM links (`launch-playbook.md` §7) |
| BR-11 | Profile banners | identity-designer | `design/brand/identity/exports/social/` | X 1500×500; YouTube 2048×1152 (safe 1546×423) | P2 | BR-01 |
| BR-12 | Install-page hero/slogan A/B copy | brand-director | `design/brand/strategy/` | copy + layout spec | P1 | owner slogan decision; owner integration (server code) |

P0 = needed before day 1 posts; P1 = needed by day 5–7; P2 = nice-to-have after the first week.

---

## 3. Briefs

### BR-01 — Mark / wordmark master + social exports
**Owner:** identity-designer · **Destination:** `design/brand/identity/exports/`

- **Job:** a single silhouette-driven mark that reads as a *chase in a real place* at 48 dp, works on the
  brand field, passes monochrome, and pairs with (not repeats) the slogan. Explore the visual-direction
  metaphor territory (`visual-direction.md` §6) and pick one; deliver the recommendation to the owner.
- **Deliverables:** layered SVG source; wordmark drawing (or explicit "mark + type" lockup spec); PNG
  exports 1024×1024 transparent, 400×400 (avatar), 48×48 (launcher legibility proof); clear-space/min-size
  rules; "chase not navigation" test note; original-work licence statement.
- **Constraints:** no text inside the mark; no map pin/crosshair-only/M-in-circle; must work on `#0B1220`;
  mark must be inside the 66 dp safe zone of the 108 dp adaptive canvas; one hot colour max (cyan field or a
  single team accent — never three).
- **Acceptance:** silhouette test at 16 px; monochrome black + white; 48 px launcher test; reads as pursuit
  to five strangers; owner approval recorded.
- **Fallback until approved:** the current vector launcher (`android/app/src/main/res/drawable/ic_launcher.xml`
  — navy square, cyan crosshair rings, coral cross, white dot) may be used in internal/campaign documents
  only, clearly labelled "current icon, replacement pending".

### BR-02 — App icon system (Adaptive / legacy / Play-style / monochrome)
**Owner:** identity-designer · **Destination:** `design/brand/identity/exports/icons/`

Per `docs/BRAND_BRIEF.md` §3 and `visual-direction.md`:

| Deliverable | Spec |
|---|---|
| Adaptive icon layers | `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml`; foreground SVG/PNG inside 66 dp safe zone of 108 dp canvas; background solid `#0B1220` (or approved subtle flat; no photo, no gradient) |
| Monochrome layer | mark only, `android:monochrome`, pure black/white, no background |
| Legacy rasters | `mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png` at 48/72/96/144/192 px + round variants |
| Play-style icon | 512×512 PNG, 32-bit, no transparency outside artwork, no text |
| Web/favicon | 512×512 PNG (transparent allowed) + 32×32 favicon PNG |
| Proof sheet | normal/round/themed-monochrome render + 48 dp legibility + dark/light background comparison |

- **Acceptance:** no missing-density lint warnings after integration; monochrome reads at 48 px; no
  third-party marks; owner approves before Android resource integration (owner's pass, not this workstream).

### BR-03 — Social avatar kit
**Owner:** identity-designer · **Destination:** `design/brand/identity/exports/social/`

- **Job:** profile picture for TikTok/Instagram/YouTube/X/Discord. It is a *mark*, not a poster.
- **Specs:** master 400×400 PNG; safe crop 320×320 (circular masks clip corners); mono/scaled-down check at
  48 px; field background or transparent (transparent only if the mark has enough contrast on both light and
  dark avatar backgrounds — test both).
- **Do not:** put the wordmark in a circle (visual-direction §7); use a screenshot; use text that vanishes
  at feed size.
- **Acceptance:** identifiable at 48×48; no hard edges lost to round crop; original work declared.

### BR-04 — Hero vertical short (12–15 s) + A/B slogan end cards
**Owner:** motion-designer (task-34) · **Destination:** `design/social/motion/out/`

- **Job:** the one clip that explains ManHunt in a scroll: hook (first 1 s) → chase tension → real app/map
  visuals → end card with slogan + honest install line. Must work **muted**: burned-in captions/lower thirds,
  no reliance on music (use original/royalty-free audio only).
- **Specs:** 1080×1920, 9:16, 30 fps, 12–15 s, MP4 H.264 (High profile), AAC 128 kbps stereo, 8–10 Mbps
  target; clean master **without any platform UI/watermark**; safe areas — keep all legible text inside the
  central ~900×1250 px (approximate guidance: ≥160 px from top, ≥380 px from bottom, ≥120 px from right for
  TikTok; Reels reserves the lower ~35% and right ~15%; Shorts reserves the lower ~20% — verify per platform
  at launch because UIs change).
- **Story beats:** 0.0–1.0 s hook (screen text H1/H2/H3 style); 1.0–4 s the map and the hide; 4–9 s the
  chase/tag beat (tag snap per motion vocab); 9–12 s result/group reaction; 12–15 s end card.
- **End card (critical dependency):** the copy family is provisional, so deliver the end card as a
  **separate re-renderable segment/source** with two text variants from copy family v2 —
  **A (flagship): "Your friends are hunting you."** and **B (short line): "Hide from your friends."** —
  each with the end-card CTA **"Create a hunt. Send the code. Hide."** and the descriptor line. Also deliver
  a 3 s standalone end-card MP4 per variant so the campaign can assemble A/B posts without re-rendering the
  whole video.
- **Copy:** caption/lower-third lines from `captions-and-hooks.md` (H1–H10, CAP-02/04/05). End card must
  include: one line from the v2 family, the CTA, honest install line ("Free Android APK · 2 MB · not on the
  Play Store" or shorter "Free Android APK — not on the Play Store"), install URL `74.208.99.178`, "Play
  with people you trust. It's a game, not a safety service." (can be small), and OSM credit if map tiles are
  shown. **Never** the rejected v1 slogan.
- **Footage:** real gameplay footage (owner's consent-cleared session) preferred; original motion graphics
  allowed; app screenshots from `docs/screenshots/` are clean sources. No stock people pretending to play;
  no fake UI; no borrowed game footage.
- **Acceptance:** hook readable at 1× phone size in 1 s; muted comprehension of what the game is by 5 s;
  text not clipped in the safe area; no copyrighted music; no fake claims; file opens in a standard player;
  end card re-renderable.

### BR-05 — GIF cutdown (Discord/Reddit/X/README)
**Owner:** motion-designer · **Destination:** `design/social/motion/out/`

- **Job:** a loopable 5–8 s cutdown for text-heavy communities (Reddit, Discord, GitHub README, X).
- **Specs:** 1080×1080 (1:1) primary GIF, ≤8 MB (safe across Discord free/X/Reddit); alt 800×450 (16:9)
  README GIF, ≤4 MB; loop-friendly (start/end frame match); no tiny text (GIF dithering kills small type —
  use ≥ 48 px type in the 1080 frame); OSM credit if tiles shown.
- **Note:** TikTok/Reels/Shorts do not need GIFs — don't size a GIF for them; if an IG feed post is needed,
  use the MP4 (IG converts GIFs to video and it looks worse).
- **Acceptance:** opens/loops without stutter; legible on a phone at 1/2 size; no watermark; honest end frame
  (not a fake CTA).

### BR-06 — Covers / thumbnails
**Owner:** motion-designer (+ identity mark) · **Destination:** `design/social/motion/out/covers/`

| Platform | Size | Notes |
|---|---|---|
| TikTok cover | 1080×1920 (JPG/PNG) | Text ≤6 words, readable in a 1:1 grid crop too — keep the key text in the center square |
| Reels cover | 1080×1920 | The Reels profile grid crops to 1:1 for some placements — center the subject/text |
| Shorts cover | 1080×1920 | Same center-safe rule |
| YouTube thumbnail (if a long-form version is posted) | 1280×720, ≤2 MB | Readable at 168×94; no more than 4 words; face or map, not both competing |
| GitHub social preview | 1280×640 | Mark + slogan + one chalk line (visual-direction §7); no screenshot collage |

- **Rules:** no fake play buttons/countdowns; don't put text in the bottom-left corner (timestamp overlay);
  no clickbait faces that aren't the real players; no "shocked" stock imagery.
- **Acceptance:** 2 m legibility test (thumbnail viewed at arm's length on a phone); one hot colour max;
  consistent with the end card.

### BR-07 — Feature graphic (README/GitHub/Play-style)
**Owner:** identity-designer (or brand-director supply, identity renders) · **Destination:**
`design/brand/identity/exports/`

- **Spec:** 1024×500 PNG; field colour background; mark + slogan + one chalk line; no screenshot collage;
  no text below 24 px in the 1024-wide frame; safe margins so a 1:1 crop still holds the mark.
- **Use:** README top, GitHub release pages, install page hero if the owner wants an image later.
- **Acceptance:** reads at 400 px wide; includes only approved claims; OSM credit not needed (no tiles).

### BR-08 — Link-preview (Open Graph) image
**Owner:** brand-director (composition) + owner (server integration) · **Destination:** identity/brand exports

- **Job:** a 1200×630 image so links to `http://74.208.99.178/` and the GitHub repo unfurl with the brand,
  not a bare URL. The install page (`server/src/app.ts`) currently has **no og:image** — adding it is an
  owner/server-code pass outside this workstream; the asset is the design deliverable.
- **Spec:** 1200×630 PNG/JPG ≤300 KB; mark + slogan (or provisional B) + "Free Android APK · 2 MB" + the
  URL in readable type; safe zones (title/description overlay may crop edges — keep key content centered).
- **Acceptance:** legible at 600×315; no banned claims; works on both dark and light preview backgrounds.

### BR-09 — Carousel / stills template (4:5 and 1:1)
**Owner:** growth workstream composes from real screenshots + brand rules; identity supplies mark/templates
· **Destination:** `design/social/campaign/assets/`

- **Job:** 5-slide "how a hunt works" carousel for Instagram feed / TikTok photo mode, built from the real
  app screens (`docs/screenshots/`) — no invented screens.
- **Specs:** 1080×1350 (4:5, IG feed) and 1080×1080 (1:1) exports; text ≥ 60 px in the 1080-wide frame; one
  idea per slide; slide 1 is the hook (H7), slide 5 is the CTA (CTA-02 + honest install line).
- **Template:** field background, chalk hairlines, cyan rules; team colours only on Prey/Hunters labels;
  mark small.
- **Acceptance:** each slide legible in a 1/3-size grid preview; no fake UI; OSM credit where the map appears.

### BR-10 — QR card + link-in-bio
**Owner:** growth (QR + URL wiring), brand-director (copy), owner (printing/hosting) · **Destination:**
`design/social/campaign/assets/` for the QR + spec; `design/brand/strategy/` for link-in-bio copy

**QR spec**
- Encode the **tagged** install URL: `http://74.208.99.178/?utm_source=qr&utm_medium=offline&utm_campaign=launch14&utm_content=<venue-or-poster>`.
- Deliver: SVG (vector master) + PNG 1024×1024 at error correction **H**, quiet zone ≥ 4 modules; dark
  modules on a light background for print reliability (invert only if you test it on two phones).
- Print test: scan from 20–30 cm at 3 cm width, on matte paper, with the camera of at least two phones. Keep
  printable minimum ~2.5–3 cm; below that, print larger.
- Put the URL as **plain text under the QR** (the URL is long: a bare IP + UTM string is not human-readable;
  readers should be able to type `74.208.99.178` if the scan fails).
- Card copy (A6): mark, slogan (one variant), "Real-world hide-and-seek. Free Android APK. 2+ players.",
  the URL, "Play with people you trust."; OSM credit not needed; no fake screenshots.

**Link-in-bio spec**
- One link hub (or a single redirect page) with: install link (tagged per platform/source as needed), GitHub
  source, "How it works" 3 lines, "Android only / not on Play Store / test server" disclosure, "Play with
  people you trust."
- Platform reality (verify at launch): TikTok profile link needs a free Business Account or 1,000+ followers;
  Instagram allows up to 5 links with no minimum; YouTube Shorts links are usually not clickable. Plan the
  fallback: plain-text URL + pinned comment + "search ManHunt GitHub".
- **Do not** use link shorteners that hide the destination on a sideload path, and never link an APK mirror.

### BR-11 — Profile banners
**Owner:** identity-designer · **Destination:** `design/brand/identity/exports/social/`

- X/Twitter header 1500×500 (safe content within ~1050×350 centered; profile photo overlaps bottom-left).
- YouTube channel banner 2048×1152 (safe area 1546×423 centred).
- Field background, mark left, one slogan line, optionally "Free Android APK · 2 MB". No screenshots
  collage, no fake player faces.

### BR-12 — Install-page hero copy / copy-family A/B (design only, integration owner)
**Owner:** brand-director · **Destination:** `design/brand/strategy/`

- The install page is the highest-stakes surface and currently says `Hide. Hunt. Survive.` with a plain
  `<h1>` and no OG image. Produce two hero variants for the owner's A/B (once the page is integrated), both
  from the provisional copy family v2 (`slogan-v2.md`):
  - **A (trust-critical / short line):** MANHUNT / **Hide from your friends.** + descriptor "Real-world
    hide-and-seek. Two teams, a live map and a clock the players can't bend. Free, 2 MB, Android 8+."
  - **B (flagship hook):** MANHUNT / **Your friends are hunting you.** + the same descriptor.
- Never pair the flagship hook alone with an APK-download warning (it reads menacing next to a trust
  decision) — A is the recommended install-page default; B is the social/OG variant.
- Both keep the install steps, privacy/safety notes and the plain-HTTP test-server caveat. The owner/server
  integration (`server/src/app.ts`) is **not** part of the design workstream; the rejected v1 slogan is not
  a variant and must not appear.

---

## 4. Platform dimension cheat sheet

Verify current specs at launch — platforms change. These are the working sizes.

| Surface | Asset | Pixels | Ratio | Format / limit | Notes |
|---|---|---|---|---|---|
| TikTok in-feed video | 9:16 master | 1080×1920 | 9:16 | MP4 H.264 + AAC; 15–60 s sweet spot | Safe text zone ≈ central 1080×1250; bottom ~320–420 px and right ~120–180 px are UI-covered; muted-first |
| TikTok cover | 1080×1920 | 1080×1920 | 9:16 | JPG/PNG | Center-square-safe text |
| Instagram Reels | 9:16 master | 1080×1920 | 9:16 | MP4; ≤90 s (keep ≤30 s) | Lower ~35% + right ~15% covered by UI; captions in first 2 lines |
| Instagram feed post | 1080×1350 or 1080×1080 | 4:5 / 1:1 | JPG/PNG | Up to 10 slides; 5 is the working plan |
| Instagram Story | 1080×1920 | 9:16 | PNG/JPG | Optional repost of Reel with link sticker (if available) |
| YouTube Shorts | 1080×1920 | 9:16 | MP4; ≤60 s (keep ≤30 s) | Bottom ~20% covered; description link not reliably clickable |
| YouTube thumbnail (long-form) | 1280×720 | 16:9 | JPG/PNG ≤2 MB | ≤4 words; readable at 168×94 |
| YouTube channel banner | 2048×1152 | 16:9 | JPG/PNG | Safe area 1546×423 |
| X/Twitter header | 1500×500 | 3:1 | JPG/PNG | Profile photo overlaps lower-left |
| GitHub social preview | 1280×640 | 2:1 | PNG/JPG | Repo settings → social preview |
| Open Graph / link preview | 1200×630 | ~1.9:1 | JPG/PNG ≤300 KB | Needs owner/server integration |
| App icon (store-style) | 512×512 | 1:1 | 32-bit PNG | No transparency outside artwork, no text |
| Adaptive icon | 108×108 dp canvas | 1:1 | XML + vector/PNG | Foreground inside 66 dp safe zone; 1 monochrome layer |
| Legacy launcher | 48/72/96/144/192 px | 1:1 | PNG | `mipmap-{m,h,xh,xxh,xxxh}dpi` + round |
| Web mark / favicon | 512×512 / 32×32 | 1:1 | PNG | Favicon currently missing on install page |
| Feature graphic | 1024×500 | ~2:1 | PNG | Mark + slogan + one chalk line; no collage |
| Discord/X GIF | 1080×1080 | 1:1 | GIF ≤8 MB | Loop-friendly; big type |
| README GIF | 800×450 | 16:9 | GIF ≤4 MB | Loads above the fold; keep short |
| QR print | PNG 1024 / SVG | 1:1 | PNG/SVG | ECC H, 4-module quiet zone, min ~2.5–3 cm print, URL as text under |

---

## 5. Acceptance checklist (per asset, before handoff to the operator)

- [ ] Correct dimensions/format/bitrate; file opens on a phone (not just a desktop preview).
- [ ] 1-second hook present; **muted** comprehension of the core idea.
- [ ] Text ≥ the minimum legible size; safe from platform UI; no clipped Arabic (mirrored timers are a bug).
- [ ] One hot colour; flat fills only; palette semantics respected (cyan never a team).
- [ ] Real UI only; no invented features/testimonials/counts; no store badges.
- [ ] Honest install line + "not on Play Store" where there is a download CTA; install URL exact.
- [ ] "Play with people you trust. It's a game, not a safety service." on first-contact assets.
- [ ] OSM attribution wherever map tiles appear.
- [ ] Slogan variant labelled A (incumbent) or B (provisional); one slogan per surface; re-renderable source.
- [ ] Fonts OFL/Apache with licence files; no Bahnschrift bundled.
- [ ] People on camera have written consent; locations blurred; no minors.
- [ ] No ™/®; brand name `ManHunt` in camel case in running text.
- [ ] Arabic assets: single register, native review, Western digits, Latin words isolated.
- [ ] Source file + export + licence line delivered together; naming convention followed.

---

## 6. Dependency map and risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Slogan unapproved** (owner decision) | End cards/bios/covers need re-render if it changes | Two end-card variants + separate 2–3 s re-renderable card; asset brief BR-04 |
| **Mark/icon not final** (identity in progress) | Avatar/covers/OG should not bake a mark that changes | Ship P0 social assets with the *provisional* current icon only if the owner accepts a re-render risk; otherwise delay avatar/OG until mark approval (campaign can start with screen footage + typography only) |
| **Name/trademark pending** (Take-Two mark; same-category app) | Handles, hashtags, printed material could be stranded | Keep first-14-days assets text-light on the wordmark; choose change-tolerant handles; don't print permanent signage before the owner decides (§12 #13 in playbook) |
| **No real gameplay footage yet** | Motion short and Concept 2 cannot show the actual game with real people | Owner runs 2–3 consent-cleared local games this week; motion uses real footage; screen-alone fallback: Concept 1/3 posts |
| **Font licensing** | Shipping a non-OFL face is a legal risk | Use Big Shoulders/Instrument Sans/Red Hat Mono (OFL, licence files present in motion assets) or another OFL face; never bundle Bahnschrift |
| **Install page is plain HTTP + no OG image** | Weaker click trust and bare link unfurls | Owner/server pass: OG image + favicon; keep the honest test-server caveat in all copy |
| **Platform rules change** | Lost reach or removed posts | Verify link-in-bio/music/community rules at launch; keep fallbacks (pinned comment, plain-text URL, QR) |
| **Android-only** | iPhone viewers are dead traffic | Say "Android 8+ only" in caption/bio/first frame when possible; CTA filters them out |

---

## 7. Asset register (operator fills as assets land)

| Asset ID | File path | Status | Rendered/previewed? | Slogan variant | Licence/ownership noted? | Owner approved? |
|---|---|---|---|---|---|---|
| BR-01 mark | | in progress (identity-designer) | | — | | |
| BR-02 icons | | not started | | — | | |
| BR-03 avatar | | not started | | — | | |
| BR-04 short | | in progress (motion-designer) | | A/B | | |
| BR-05 gif | | not started | | A/B | | |
| BR-06 covers | | not started | | A/B | | |
| BR-07 feature graphic | | not started | | A/B | | |
| BR-08 OG image | | not started | | A/B | | |
| BR-09 carousel | | not started | | — | | |
| BR-10 QR/link-in-bio | | growth: in progress | | — | | |
| BR-11 banners | | not started | | A/B | | |
| BR-12 install hero copy | | brand-director | | A/B | | |
