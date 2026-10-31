# ManHunt brand brief — icon & slogan team

Status: **open for design** (the next major deliverable). This file is the contract for the
icon/slogan team and the design skills that will produce it. Nothing here ships until the
owner picks a direction.

## 1. Product in one line

Real-world hide-and-seek: **Prey hide, Hunters track them on a live map and tag them by
physically touching them.** Server-authoritative Android game; phones share location during
a timed hunt.

## 2. Current identity (what exists today)

| Asset | Where | Notes |
|---|---|---|
| App name | `android/app/src/main/res/values/strings.xml` → `app_name` = `ManHunt` | Keep the name unless the owner explicitly renames the product. |
| Current slogan | `Hide. Hunt. Survive.` | Used in onboarding, Auth, Home subtitle and README. A new slogan must replace this consistently or be an approved alternate. |
| Launcher icon | `android/app/src/main/res/drawable/ic_launcher.xml` | Single vector (navy square, cyan crosshair circles, coral target cross, white dot). Manifest points **both** `icon` and `roundIcon` at it. **There is no adaptive icon and no monochrome layer yet.** |
| Splash / launch background | `res/drawable/launch_background.xml`, `res/values/themes.xml`, `res/values/colors.xml` (`launch_bg` = `#0B1220`) | Dark first frame; the logo can later replace the plain launch background. |
| Brand colours (dark theme) | `ui/theme/Theme.kt` | Primary cyan `#22D3EE`, Hunters violet `#A79BFF`, Prey coral `#FF7A59`, background navy `#0B1220`, surface `#131C2E`, text `#E6EDF7`. |
| Voice | — | Direct, outdoorsy, a little dangerous-but-safe: “Hunt or be hunted”, but never glorify trespassing or real harm. |

## 3. Deliverables required

### Icon system

- **Adaptive icon** (API 26+):
  - `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml`
  - foreground vector/PNG with the mark inside the **66 dp safe zone** of the 108 dp canvas
  - background: solid `#0B1220` or a subtle approved gradient (no photographs)
  - **monochrome layer** (`android:monochrome`) for Android 13+ themed icons — mark only, no
    background, must read in pure black/white
- **Legacy raster exports**: `mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png` (48, 72, 96, 144, 192 px)
  and matching round icons.
- **Play Store icon**: 512 × 512 PNG, 32-bit, no transparency outside the artwork, no text.
- **Optional feature graphic**: 1024 × 500 PNG for store/README.
- **Web/README mark**: 512 × 512 PNG (transparent allowed) + favicon 32 × 32 PNG for the
  install page (currently no favicon).

### Slogan system

- One primary slogan (short enough to fit a 360 dp-wide screen as a single line in the tagline
  slot) + optionally one 2–4 word product lockup.
- Must work in **English** as the source string; an Arabic translation is welcome but the
  English is authoritative.
- Slogan must pass: not generic (“Play outside” fails), no “AI purple gradient” cliché,
  does not promise safety/rescue, no trademark collisions.
- Keep or replace `Hide. Hunt. Survive.` — the owner decides. If kept, the icon must pair
  with it rather than repeat the words inside the mark.

## 4. Icon design constraints

- Legible at **48 dp** and in a monochrome/themed launcher; silhouette-driven, no fine detail.
- No text inside the icon (hard to read at launcher size and bad for localization).
- Avoid generic map-pin-only, generic crosshair-only and generic “letter M in a circle”.
  ManHunt should feel like a **chase in a real place**: e.g. two opposing marks, a pursuit
  path, predator/prey tension, a zone closing in — the brief is open.
- Works over the dark navy background and as a themed monochrome icon.
- Must not use licensed third-party characters/logos or real people.

## 5. Integration contract (after owner picks)

1. Drop source SVG/AI + exports into `design/brand/` (create it) and the Android resources
   above; update `AndroidManifest.xml` to adaptive `@mipmap/ic_launcher` /
   `@mipmap/ic_launcher_round`.
2. Replace slogan strings in one pass: `Localization.kt`, README, Auth/onboarding, install
   page title/description (`server/src/app.ts`).
3. Keep `launch_bg`/dark first frame; optionally generate a splash mark later.
4. Update README screenshots if the mark appears in them; keep screenshots version-free.
5. Verify: launcher icon normal/round/themed, 48 dp legibility, Play 512 export, no
   missing-density warnings, `./gradlew :app:lintDebug`, emulator smoke test.
6. Ship as a new in-app update (bump `versionCode`/`versionName`), never rewrite old tags.

## 6. Handoff checklist

- [ ] Layered source file (SVG/Figma/AI) + PNG exports + monochrome layer
- [ ] Play 512 PNG, optional feature graphic, README/web mark
- [ ] Primary slogan, short lockup, usage rules (min size, clear space, do/don’t)
- [ ] Palette tokens used (exact hex), dark/light variants
- [ ] Written license/ownership statement for assets
- [ ] Owner approval on the concept before implementation

## 7. What the design agent/skills should read first

- `README.md` screenshots and product pitch
- `docs/UI_REVIEW.md` (current UI/UX state and scores)
- `android/app/src/main/java/com/manhunt/app/ui/theme/Theme.kt` (tokens/typography)
- `android/app/src/main/java/com/manhunt/app/ui/RolesScreen.kt` (tone/copy)
- This brief’s constraints above

Do **not** change the product name, gameplay rules, or existing release history while
shipping brand work.
