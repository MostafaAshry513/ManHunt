# Social banner system

All banners are exported at the platform's exact pixel size from the same deterministic artboard set as
the README hero and the site hero: chalk block map, Open Zone radar, coral Prey dot, violet Hunters,
official MANHUNT lockup. Flat fills only; cyan is the field/referee and never a team colour.

Open the gallery: [`contact-sheet.html`](contact-sheet.html) (rendered PNG:
`../out/social/banners-contact-sheet.png`).

## Files, sizes and safe areas

| Surface | File | Size | Safe area / rules |
|---|---|---|---|
| **GitHub social preview** | `out/social/github-social-1280x640.png` | 1280 × 640 | No overlay. 64 px margins. Used as the repo's Social preview and as the static README fallback. |
| GitHub social — animated post cut | `out/social/github-social-1280x640.gif` | 1280 × 640 | 5.0 s loop, 100 frames, 20 fps, 1.49 MB. For posts/chat embeds; the Social preview upload itself is static. |
| **X / Twitter header** | `out/social/x-header-1500x500.png` | 1500 × 500 | Avatar overlaps the bottom-left (~160 px wide, bottom ~150 px). All copy sits right of x≈190 or right-aligned; the avatar zone is empty. |
| **YouTube channel art** | `out/social/youtube-2560x1440-safe-area.png` | 2560 × 1440 | All text/lockup inside the centred **1546 × 423** safe area; the outer field is decoration and may crop. |
| YouTube — safe-area proof | `out/social/youtube-2560x1440-safe-area-guide.png` | 2560 × 1440 | Same art with the safe box and crop notes drawn on top — use to check the upload, not as the upload. |
| **Discord server banner** | `out/social/discord-960x540.png` | 960 × 540 | 16:9, no overlay. 52 px margins. |
| Discord — animated post cut | `out/social/discord-960x540.gif` | 960 × 540 | 5.0 s loop, 0.91 MB. For announcement posts/embeds; the server banner upload is static. |
| **README / GitHub hero** | `out/readme/manhunt-readme-hero-1280x480.gif` | 1280 × 480 | 5.0 s loop, 100 frames, 20 fps, 1.10 MB — under the 4 MB budget. Inline under the repo title. |
| README hero — static fallback | `out/readme/manhunt-readme-hero-1280x480-static.png` | 1280 × 480 | Same composition, single frame (also useful where GIFs are stripped). |
| **No-slogan fallbacks** | `out/readme/manhunt-readme-hero-noslogan-1280x480.png`<br>`out/readme/manhunt-readme-hero-noslogan-1280x640.png`<br>`out/social/github-social-1280x640-noslogan.png` | 1280 × 480 / 640 | Lockup + descriptor + legend + honest micro-line, **no hook** — use if the provisional copy is pulled. |

Animated variants are only produced for surfaces where motion can actually play (README inline image,
social posts, chat embeds). Platform **header/banner uploads are static** — that is why the GitHub,
X, YouTube and Discord banner files are PNGs.

## Copy on the banners

Provisional brand copy v2, one family, no contradictions:

- Hook (social): **Your friends are hunting you.**
- Descriptor: **Real-world GPS hide-and-seek for Android.**
- Invite CTA line: **Create a hunt. Send the code. Hide.**
- Honest install micro-line: **free APK · Android 8+ · not on Play Store**
- Legend: **PREY / HUNTERS**

The X header, GitHub social, Discord banner and README hero carry the hook; the no-slogan variants carry
no line at all. Nothing promises Play Store distribution, safety, reviews, player counts or a fixed hunt
length.

## Suggested README embed

```md
<p align="center">
  <a href="http://74.208.99.178/">
    <img src="design/brand/motion-kit/out/readme/manhunt-readme-hero-1280x480.gif" width="1280"
      alt="ManHunt — a coral Prey dot evades five violet Hunter dots on an Open Zone radar. Your friends are hunting you.">
  </a>
</p>
```

For GitHub Social preview: repo **Settings → Social preview → Upload** → `github-social-1280x640.png`.
The same image can serve as the install page's `og:image` (1200×630 crop is not needed — social scrapers
scale the 1280×640 card consistently).

## Image alt text (for social posts)

- GitHub social / X: “ManHunt — Your friends are hunting you. An Open Zone radar with a coral Prey dot
  evading violet Hunter dots. Real-world GPS hide-and-seek for Android; free APK, not on Play Store.”
- Discord: “ManHunt — a coral Prey dot running the Open Zone radar while violet Hunters close in.”

## Rebuild

```powershell
node tools/build.mjs            # banners + README hero + GIFs + contact sheets
node tools/verify.mjs           # dimensions, GIF metadata/frame count, palette, HTML checks
```

The lockup is inlined from `design/brand/identity/final/lockup/` by `tools/sync-lockup.mjs`; never retype,
re-track or recolour it. Colours: field `#0B1220`, chalk `#E6EDF7`, cyan `#22D3EE` (field/referee), Prey
`#FF7A59`, Hunters `#A79BFF`.
