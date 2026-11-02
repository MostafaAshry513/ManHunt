# GitHub landing page v2 — MATCHDAY BOARD

Working folder for the GitHub page redesign. **The concept is complete, the new root `README.md` is
implemented and verified** from the premium capture set (home, lobby, live hunt, result, chat, auth, tag
claim, hunt sheet). Safety and RTL captures are still queued; they are additive and re-added with one
command (see Status).

| Start here | |
|---|---|
| [`concept.md`](concept.md) | the design concept: page architecture, copy deck, what is removed from the old README, asset manifest, capture/update procedure, GitHub constraints |
| [`README.draft.md`](README.draft.md) | the staged source of the README (root `README.md` is generated from it) |
| [`preview/desktop-1012.png`](preview/desktop-1012.png) · light mode [`-light`](preview/desktop-1012-light.png) · [`mobile-390.png`](preview/mobile-390.png) | GitHub-column previews of the implemented page |
| [`VERIFICATION.md`](VERIFICATION.md) | what the automated checks cover and current state (59/59 final) |

New brand assets produced for this page (additive; approved identity files untouched):

- `docs/brand/matchday-hero-1280x560.png` / `.gif` — README poster opening; map plate is the real capture
- `docs/brand/github-social-matchday-1280x640.png` — new GitHub social preview card
- `docs/brand/tag-prey-400x120.png`, `docs/brand/tag-hunters-400x120.png` — kit tags for the “two sides” table
- `docs/brand/matchday-map-band-1080x540.png` — derived crop of the live-hunt capture for the field section

## Status

- **Delivered:** root `README.md` (MATCHDAY BOARD, real premium captures including the result screen),
  hero/social rebuilt from the real `s07-hunt` map area, map band crop, previews,
  `verify.mjs --final` → **59/59 pass, 0 pending**.
- **Remaining (additive):** safety/RTL/auth-state captures (`s02-safety`, `s04-home-rtl`, `s16-lobby-rtl`,
  `s17-empty-chat`, `s18-auth-loading`, `s19-auth-error`). When they land, add them to `README.draft.md` +
  `implement-readme.mjs` and run:
  `node tools/implement-readme.mjs` (rebuilds assets, rewrites `README.md`, runs final verification).
- **Commit dependency:** the README references `docs/screenshots/premium/**` and the new `docs/brand/**`
  files; the Lead must commit them for the page to render on GitHub.

## Rebuild assets / previews / checks

```powershell
cd design/github-redesign
node tools/build-assets.mjs                       # hero PNG+GIF, social card, kit tags, map band crop
node tools/render.mjs page --page design/github-redesign/preview/readme-preview.html --size 1200x1600 --full-page --out design/github-redesign/preview/desktop-1012.png
node tools/render.mjs page --page "design/github-redesign/preview/readme-preview.html?theme=light" --size 1200x1600 --full-page --out design/github-redesign/preview/desktop-1012-light.png
node tools/render.mjs page --page design/github-redesign/preview/readme-preview.html --size 390x900 --full-page --out design/github-redesign/preview/mobile-390.png
node tools/verify.mjs                             # draft mode (staged README)
node tools/verify.mjs --final                     # implemented README.md
```

Requirements: Node 24+, local Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, and the
repo's ffmpeg-static for GIF encode. No npm installs. Render stages are build-only; the README consumes the
baked PNG/GIF assets.

No app or server code in this workstream; no commits or posts.
