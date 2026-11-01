# ManHunt design system

Owner-approved identity on 2026-11-01; copy is **provisional pending final owner sign-off**:

- **Name:** ManHunt (keep for now; trademark screening noted in the brand platform)
- **Direction:** **PICKUP** — a free pickup field sport. Borrowed pitch, server-kept rules, no gear.
- **Permanent line:** **“Hide from your friends.”**
- **Social hook:** **“Your friends are hunting you.”** — rejected: “No gear. No fee. Just players.”
- **Logo/icon:** **01 Open Zone** — cyan zone ring that does not close, coral prey dot in the gap.
- **Palette:** field `#0B1220`, chalk `#E6EDF7`, signal cyan `#22D3EE`, prey coral `#FF7A59`,
  hunters violet `#A79BFF`.

Everything here was produced by independent design agents (brand-director, identity-designer,
motion-designer, growth-strategist, brand-animator) using dedicated design skills; the Lead only
coordinated, reviewed and integrated. No design asset in this tree was authored by the Lead.

## Start here

| What | Where |
|---|---|
| Brand strategy, copy v2, tone, visual direction, moodboards | [`brand/strategy/`](brand/strategy/) |
| Approved logo/icon system, final lockup, Android/web exports | [`brand/identity/`](brand/identity/) — final handoff in [`brand/identity/final/`](brand/identity/final/) |
| Motion kit: animated README/GitHub hero, install-page CSS/SVG hero, social headers, app motion spec | [`brand/motion-kit/`](brand/motion-kit/) |
| Full social identity kit: avatars, headers, editable post templates | [`brand/social-identity/`](brand/social-identity/) |
| 60s game explainer + 30s/15s/GIF cuts, storyboard, render source | [`social/motion/`](social/motion/) |
| 14-day launch campaign, platform rollout, captions/hooks, creative briefs | [`social/campaign/`](social/campaign/) |

## Canonical files

- Lockup: `brand/identity/final/lockup/lockup-stacked-light-on-dark.svg` (spec: `final/LOCKUP.md`)
- Play/store icon: `brand/identity/final/android/play-512.png`
- README/GitHub animated hero: `brand/motion-kit/out/readme/manhunt-readme-hero-1280x480.gif`
- Install-page animated hero: `brand/motion-kit/site-hero/hero-snippet.html`
- Social avatars/headers/templates: `brand/social-identity/out/`
- 60s explainer: `social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4`
- Campaign: `social/campaign/launch-playbook.md`

## Reproducing deliverables

- Identity previews: `node brand/identity/tools/build.mjs` then `node brand/identity/tools/verify.mjs`
- Motion: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File social/motion/tools/build.ps1` (~10–12 min; uses `design/.tools/ffmpeg-static`)
- Campaign one-pager: open `social/campaign/campaign-onepager.html` in a browser.

## Integration status

- Android: Open Zone adaptive/monochrome/legacy resources copied to
  `android/app/src/main/res/`; manifest/splash updated; old vector icon removed.
- Install page: Open Zone inline mark, approved slogan, group-chat CTA, favicon + social OG image
  (`server/public/favicon.png`, `og-image.png`).
- Social accounts are **not** created/published; launch copy is staged for the owner.

## Rules that must not be broken

- Cyan is field/referee, coral is Prey, violet is Hunters — never use a team colour for the
  at-rest brand slogan.
- The wordmark is drawn as paths: never retype, re-track or letter-space it.
- Keep OSM attribution wherever map tiles appear; keep “not on Play Store” honest.
- No fake reviews, scores, urgency or safety/rescue claims.
- Min sizes: wordmark cap ≥22 px, horizontal lockup ≥180 px, stacked ≥140 px; clear space
  ≥0.5 cap, baked into the SVGs.
