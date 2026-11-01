# Install-page hero — 1200×600, CSS + SVG, no JavaScript

Self-contained hero for the ManHunt install page (`server/src/app.ts`): the Open Zone mark behaving as a
radar — cyan zone ring with its deliberate gap, a rotating sweep, the coral Prey dot running a closed
route with a growing trail and report pings, violet Hunters fanning behind it — over the chalk block map.
It is **CSS keyframe animation on inline SVG**: no JavaScript, no external images, no external fonts.

| File | What it is |
|---|---|
| [`hero-snippet.html`](hero-snippet.html) | **Paste-ready**: `<style>` block + `<section>` markup for `server/src/app.ts` |
| [`site-hero.html`](site-hero.html) | Standalone preview page (identical markup/CSS; used for screenshots) |
| [`hero.css`](hero.css) | The scoped stylesheet alone, for review |

Posters: `out/site/manhunt-site-hero-1200x600.png` (the loop paused deterministically at t = 0.35 s) and
`out/site/manhunt-site-hero-1200x600-poster.png` (the reduced-motion still), both 1200×600.

## Copy (provisional brand copy v2)

- `<h1>`: **Hide from your friends.** — the short form chosen for the trust-critical install page. The
  flagship hook “Your friends are hunting you.” is used on the social/README banners instead.
- Descriptor: **Real-world GPS hide-and-seek for Android.**
- Legend: **PREY / HUNTERS** (team colour is never the only cue).
- Honest micro-line: **free APK · Android 8+ · not on Play Store**.

No other copy is inside the hero, and the hero contains no CTA — the page's download card stays the
single conversion target. The bottom **15%** of the frame is kept clear (CTA-safe) so a button, scroll
cue or browser chrome never fights the art.

## How to embed in `server/src/app.ts`

1. Copy the `<style>` block from `hero-snippet.html` into the install page's existing `<style>` block.
2. Replace the current hero markup — from `<header class="hero">` through its closing `</header>` —
   with the `<section class="mh-hero"> … </section>` block from the same file.
3. Delete the now-unused install-page rules `.hero`, `.icon`, `.eyebrow` (they only styled the old
   header). Nothing else in the page needs to change; the page-wide `h1` rule is overridden by the
   scoped `.mh-hero__hook` class.
4. `og:image` / `<title>` copy are not in this snippet — the brand-director/Lead owns the head tags.

The snippet is safe inside the TypeScript template literal that renders the install page: it contains
no backticks, no `${` sequences and no `</script>`.

## Sizing and responsive behaviour

The artboard is **1200 × 600** (2:1). The hero renders fluidly:

- Desktop/tablet: the install page column is ~604 px, so the hero is shown at the same 2:1 ratio with
  all type scaled by **container query units** (`cqw`) from the 1200 px design.
- Mobile: at a 390 px viewport the install page hero is ~354 px wide; a `@container (max-width: 560px)`
  rule enlarges the wordmark proportionally, keeps the hook at ≥24 px, and hides the descriptor,
  legend and micro-line (the page repeats all of them below the hero).
- Older browsers without container queries fall back to the px sizes written before each `cqw`
  declaration — still a complete, readable hero (slightly larger type on wide screens).

Tested in headless Chrome at 1200×600 (poster), 640×900 (install column) and 390×844 (phone): no
horizontal overflow, wordmark above its 117 px minimum, one `<h1>`.

## Motion

One **8 s loop**, all CSS, all flat fills (no gradients/glow):

| Cue | Behaviour |
|---|---|
| Sweep | one revolution per loop, constant speed, flat cone + leading edge + tip dot |
| Prey | closed evasion route (one lap per loop) with a two-harmonic radius wobble |
| Hunters | five dots phase-lagged behind the Prey and fanned across the inner arc |
| Trail | the Prey's whole route chalked in coral; marching dashes keep it alive |
| Pings | three coral report rings per loop (2.667 s stagger), expanding and fading |
| Zone ring | 24° Open Zone gap; radius breathes ±3.4 % |
| Outer ring | slow marching dashes |

`@media (prefers-reduced-motion: reduce)` stops **all** animation and hides the ping rings, leaving a
complete composition (that still is `out/site/manhunt-site-hero-1200x600-poster.png`). Nothing about
the game state is lost in the still.

## Provenance / rules

- The MANHUNT wordmark is inlined **verbatim** from
  `design/brand/identity/final/lockup/wordmark-light-on-dark.svg` (7 drawn paths, no font, no
  retyping/letter-spacing). Cyan is the field/referee, coral is Prey, violet is Hunters.
- Only the system font stack is used on this surface — no font file, no external request. (The OFL
  display faces are used only in the rendered banners/GIFs, not in this paste-ready snippet.)
- Regenerate: `node tools/build-site-hero.mjs` (writes these three files from `src/motion-core.js`).
