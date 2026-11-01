# ManHunt — social identity kit

One identity for posting ManHunt everywhere: the **Open Zone mark** as the avatar, the drawn **MANHUNT
lockup** on headers, and **editable post templates** that carry the provisional copy family. Built as an
extension of the brand motion kit — same radar algorithm, palette, lockup and OFL fonts, same deterministic
headless-Chrome pipeline.

**Recommended primary:** [`out/avatars/manhunt-avatar-1024.png`](out/avatars/manhunt-avatar-1024.png)
(platform derivatives in the same folder) and the motion-kit YouTube/X/GitHub/Discord banners listed in
§3; for the profile-adjacent surfaces use [`out/headers/instagram-profile-card-1080x1350.png`](out/headers/instagram-profile-card-1080x1350.png)
and [`out/headers/reddit-profile-banner-1600x480.png`](out/headers/reddit-profile-banner-1600x480.png).

Gallery: [`gallery/contact-sheet.html`](gallery/contact-sheet.html) →
[`out/gallery/social-identity-contact-sheet.png`](out/gallery/social-identity-contact-sheet.png).
Verification: [`out/VERIFICATION.md`](out/VERIFICATION.md) (`node tools/verify.mjs`).

> **Copy status:** the hook “Your friends are hunting you.”, the permanent short line “Hide from your
> friends.” and the CTA “Create a hunt. Send the code. Hide.” are the new provisional family
> (**owner-approval-pending**). Edit the marked `COPY` blocks in the templates rather than redrawing; the
> README and PNG previews contain no other marketing claims. The honest install line (“free APK ·
> Android 8+ · not on Play Store”) is on every surface where it fits.

---

## 1 · What is in the kit

| Surface | Files | Upload size | Crop-safe / notes |
|---|---|---|---|
| **Profile avatar** | `out/avatars/manhunt-avatar-{1024,800,512,460,400,320,256,200,128,64,48}.png` | any square | mark + radar; all art inside 43 % of the square, so a **circular crop at 50 %** cannot clip it. 1024 master; use the platform derivative below. |
| **Animated avatar** | `out/avatars/manhunt-avatar-animated-512.gif` · `.webm` | 512 × 512 | 4.0 s loop (80 frames @ 20 fps, GIF 106 KB; silent VP9 WebM 22 KB). GIF is the avatar upload where platforms animate; **WebM is not an avatar upload anywhere** — post asset. |
| **YouTube channel art** | `motion-kit/out/social/youtube-2560x1440-safe-area.png` *(reused)* | 2560 × 1440 | copy inside the centred **1546 × 423** safe area; static upload only. |
| **X / Twitter header** | `motion-kit/out/social/x-header-1500x500.png` *(reused)* | 1500 × 500 | avatar overlaps bottom-left; copy right of x≈190; static. |
| **GitHub social preview** | `motion-kit/out/social/github-social-1280x640.png` *(reused)* | 1280 × 640 | repo Settings → Social preview / OG card; static. |
| **Discord server banner** | `motion-kit/out/social/discord-960x540.png` *(reused)* | 960 × 540 | static; server **icon** = `manhunt-avatar-512.png`. |
| **Reddit profile banner** | `out/headers/reddit-profile-banner-1600x480.png` | 1600 × 480 | no extra crop; static. |
| **Reddit subreddit banner** | `out/headers/reddit-subreddit-banner-1920x384.png` | 1920 × 384 | mobile shows the centre **1280 × 384** — all copy sits inside it; radar bleeds to the sides. |
| **Instagram profile card** | `out/headers/instagram-profile-card-1080x1350.png` | 1080 × 1350 | Instagram **has no header upload**; this is the profile-adjacent 4:5 card (pinned post / grid). |
| **TikTok profile card** | `out/headers/tiktok-profile-card-1080x1080.png` | 1080 × 1080 | TikTok **has no header upload**; profile-adjacent square post / link-in-bio card. |
| **Facebook profile cover** | `out/headers/facebook-profile-cover-851x315.png` | 851 × 315 | avatar overlaps bottom-left — kept clear; copy right of x≈210. |
| **Facebook page cover** | `out/headers/facebook-page-cover-1640x624.png` | 1640 × 624 | key content in the centre; sides crop on mobile. |
| **Link-in-bio / mobile landing background** | `out/headers/link-in-bio-background-1080x1920.png` | 1080 × 1920 | middle band kept clear for link buttons; copy within the top 1200 px; bottom is radar decoration. |
| **Post templates** | `templates/{feed-square-1080x1080,story-1080x1920,carousel-cover-1080x1350,end-card-1080x1350}.html` → `out/templates/*.png` | 1080×1080 / 1080×1920 / 1080×1350 | **editable HTML/CSS** — change copy in the marked blocks, re-render, no redraw. |

## 2 · Avatar derivatives (exact file → platform)

| Platform | Upload | File |
|---|---|---|
| Master | 1024 × 1024 | `manhunt-avatar-1024.png` |
| YouTube | 800 × 800 | `manhunt-avatar-800.png` |
| GitHub (org/user) | 460 × 460 | `manhunt-avatar-460.png` |
| X / Twitter | 400 × 400 | `manhunt-avatar-400.png` |
| Instagram | 320 × 320 | `manhunt-avatar-320.png` |
| Reddit | 256 × 256 | `manhunt-avatar-256.png` |
| TikTok | 200 × 200 | `manhunt-avatar-200.png` |
| Discord | 128 × 128 (min) | `manhunt-avatar-128.png` (or 512 for animated) |
| Derivatives | 64 / 48 | `manhunt-avatar-64.png` / `manhunt-avatar-48.png` |

Every avatar carries only the mark + radar — **no wordmark, no text** (a circular avatar is not a lockup
surface, and text is illegible at 48 px). The mark stays legible at 48 px: the 48 px file is checked for a
visible cyan ring + coral dot.

## 3 · Reused from the motion kit (deliberately not duplicated)

The banner surfaces already delivered in `design/brand/motion-kit/out/social/` are the canonical ones for
those platforms — the same radar, lockup and copy, already verified there:

- YouTube channel art → `motion-kit/out/social/youtube-2560x1440-safe-area.png` (+ safe-area guide)
- X header → `motion-kit/out/social/x-header-1500x500.png`
- GitHub social preview → `motion-kit/out/social/github-social-1280x640.png`
- Discord server banner → `motion-kit/out/social/discord-960x540.png`
- Animated post cuts → `motion-kit/out/readme/manhunt-readme-hero-1280x480.gif`,
  `motion-kit/out/social/github-social-1280x640.gif`, `motion-kit/out/social/discord-960x540.gif`

This kit reuses the motion kit's `src/motion-core.js` radar algorithm and
`src/generated/lockup.js` official lockup directly in its render stage; it copies no fonts, no lockup SVGs
and no radar code.

## 4 · Editing the post templates

Each template is a standalone page at its exact export size; fonts and art resolve from the repo, so open
it in a browser at `design/brand/social-identity/templates/<name>.html` to preview.

1. Edit only the blocks marked `<!-- ✏️ COPY: … -->` — the hook, short line, CTA, install line and pager.
2. Re-render the PNG (no redraw, no design work):

```powershell
cd design/brand
node social-identity/tools/render.mjs page \
  --file social-identity/templates/story-1080x1920.html \
  --size 1080x1920 --out social-identity/out/templates/story-1080x1920.png
```

3. Keep the copy rules: sentence case, full stops, no exclamation marks, no fixed hunt length, no safety
   promises, no Play Store claim. The honest line stays.

The official lockup inside each template is inlined **verbatim** from
`design/brand/identity/final/lockup/` by the generator — never retype, re-track or recolour it. Colours:
field `#0B1220`, chalk `#E6EDF7`, cyan `#22D3EE` (field/referee), coral `#FF7A59` (Prey), violet
`#A79BFF` (Hunters); flat fills only.

## 5 · Upload flags — what cannot be uploaded as-is

- **Animated avatars** are accepted by **Discord** (GIF) and Telegram; X, GitHub, YouTube, TikTok, Reddit
  and Instagram display avatars **statically** — use the PNG there.
- **WebM is not accepted as an avatar anywhere** (including Discord); it is the high-quality animated
  master for posts/embeds. GIF is the avatar-compatible animated file.
- **Instagram and TikTok have no header upload.** Their cards here are profile-adjacent posts, not channel
  banners; do not present them as headers.
- **YouTube channel art and Discord server banners are static uploads** — the animated variants live in
  the motion kit for posts/embeds only.
- **Platforms re-encode and crop uploads.** Files here are pre-upload masters at exact platform sizes; the
  crop-safe areas above are what the platform previews show.
- **Copy is owner-approval-pending.** Replace copy via the template COPY blocks; do not ship new lines
  without sign-off.
- **Test deployment is plain HTTP.** `http://74.208.99.178/` on the end card is the honest current URL; it
  is not a Play Store listing and the install is a free sideloaded APK.

## 6 · Build, verify, requirements

```
design/brand/social-identity/
  src/           stage.html, stage.css, stage.js (artboards), art.js (shared SVG art)
  templates/     editable HTML/CSS post templates (generated from tools/build-templates.mjs)
  gallery/       contact-sheet.html
  tools/         render.mjs (headless Chrome), build-templates.mjs, build.mjs, verify.mjs
  out/           avatars/ headers/ templates/ gallery/ + verification.json / VERIFICATION.md
```

```powershell
cd design/brand/social-identity
node tools/build.mjs      # all avatars (+ GIF/WebM), headers, templates, gallery
node tools/verify.mjs     # dimensions, circular safety, GIF/WebM metadata, source + reuse checks
```

Requirements: Node 24+, local Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, and the
repo's `design/.tools/node_modules/ffmpeg-static/ffmpeg.exe`. No npm packages are installed for this kit.
All renders are deterministic (seeded art + exact viewports); the animated avatar loops seamlessly because
its 4 s loop is a pure function of one phase.

## 7 · Copy used (provisional, owner-approval-pending)

- Hook: **Your friends are hunting you.**
- Permanent short line: **Hide from your friends.**
- End-card CTA: **Create a hunt. Send the code. Hide.**
- Descriptor: Real-world GPS hide-and-seek for Android.
- Honest install line: free APK · Android 8+ · not on Play Store.
- Trust line: Play with people you trust.
- Legend: PREY / HUNTERS.

Edit these in the template `COPY` blocks; the render pipeline stamps them onto the PNGs. Do not add
marketing claims beyond this family without owner sign-off.

## 8 · Provenance and ownership

All layouts and motion are original work for ManHunt created in this workstream; the mark, wordmark and
lockups are the owner-approved assets from `design/brand/identity/final/` (the owner owns the selected
assets and their derivatives, including social adaptations — see `identity/LICENSE-assets.md`). The OFL
display faces are used from the motion kit for rendered images only. No third-party imagery, no AI-image
collage, no real people, no fake reviews or player counts.
