# Install-page handoff — favicons, app icon, OG card

For the install page served at `http://74.208.99.178/`. Copy these files to the page's static root
(next to `index.html` / whatever `server/src/app.ts` serves) and add the tags below. **No server code was
edited in this workstream.**

> **Copy status: PROVISIONAL — owner approval pending.** The rejected slogan “No gear. No fee. Just
> players.” must not appear on the page. Use the provisional family:
> permanent line **“Hide from your friends.”**, campaign hook **“Your friends are hunting you.”**,
> CTA **“Create a hunt. Send the code. Hide.”** (see `../../LOCKUP.md` §5).

| File | Size | Use |
|---|---|---|
| `favicon-32.png` | 32×32 | browser tab (`rel="icon"`), primary favicon |
| `favicon-48.png` | 48×48 | higher-density favicon / Android home-screen shortcut |
| `install-page-icon-192.png` | 192×192 | web app manifest icon / `apple-touch-icon` / install prompt icon |
| `app-icon.svg` | 108×108 dp vector | inline SVG in the page hero, or any `<img>` — field `#0B1220` + approved mark |
| `og-image-1200x630.png` | 1200×630 | Open Graph / Twitter card image — headline is the **permanent line** |

All are the **approved** identity assets: Open Zone mark, brand field `#0B1220`, cyan field ring
`#22D3EE`, coral prey dot `#FF7A59`. No text is inside the icon. The OG card headline is the provisional
permanent line “Hide from your friends.”; page `<h1>`/meta copy should use the same family.

## Suggested HTML (head)

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/install-page-icon-192.png" />
<link rel="manifest" href="/site.webmanifest" />

<!-- Open Graph / Twitter: the card is the approved brand plate with the provisional copy -->
<meta property="og:type" content="website" />
<meta property="og:title" content="ManHunt — Hide from your friends." />
<meta property="og:description" content="Real-world GPS hide-and-seek. Your friends are hunting you. Free on Android." />
<meta property="og:image" content="http://74.208.99.178/og-image-1200x630.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="ManHunt — Hide from your friends. Real-world GPS hide-and-seek." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="ManHunt — Hide from your friends." />
<meta name="twitter:description" content="Real-world GPS hide-and-seek. Your friends are hunting you. Free on Android." />
<meta name="twitter:image" content="http://74.208.99.178/og-image-1200x630.png" />
```

`og:image` **must be an absolute URL** that the scraper can reach; the deployment is plain HTTP at a bare
IP today, so use `http://74.208.99.178/og-image-1200x630.png` (and update it if the URL changes later).
Re-scrape caches (X/Twitter card validator, Facebook debugger, Slack/Telegram unfurl) after replacing the
file, otherwise the old slogan card can persist in previews.

## OG card spec

| Property | Value |
|---|---|
| File | `og-image-1200x630.png` |
| Size | 1200 × 630 px, 32-bit, opaque |
| Headline (permanent line) | **“Hide from your friends.”** — chalk `#E6EDF7` on line 1, coral `#FF7A59` on “your friends.” |
| Descriptor | “Real-world GPS hide-and-seek” — muted `#A7B6CC` |
| Wordmark | drawn MANHUNT wordmark, chalk — no font dependency |
| Mark | Open Zone ring + prey dot, right side |
| Footer | `MANHUNT · ANDROID · FREE APK` |
| Copy status | provisional, owner approval pending |

## Inline app icon (optional)

`app-icon.svg` is self-contained (no external refs, no text, fixed hex colours), so it can be pasted
inline next to the install button:

```html
<!-- paste the contents of app-icon.svg; give it a size via CSS -->
<svg class="mh-app-icon" viewBox="0 0 108 108" width="64" height="64" role="img" aria-label="ManHunt app icon">…</svg>
```
```css
.mh-app-icon{width:64px;height:64px;border-radius:14px;display:block}
```

Do not add a shadow/glow, do not round the corners heavier than the launcher does (~22 % radius), and do
not place text inside the icon.

## Suggested web manifest (optional)

```json
{"icons":[{"src":"/install-page-icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"/install-page-icon-192.png","sizes":"192x192","type":"image/png","purpose":"maskable"}]}
```

The 192 px icon uses the full 108 dp art (mark at ~59 %), so it is safe under `maskable` circular masks.

## Page look

The brand direction is “Chalk on Night Asphalt”. The page `<h1>` should use the provisional permanent line
**Hide from your friends.** with **Real-world GPS hide-and-seek** as the descriptor, and the CTA button
copy **Create a hunt. Send the code. Hide.** The OG card follows the same register: navy field, chalk
MANHUNT wordmark, cyan hairline, chalk + coral headline. Keep the page dark-first: one cyan accent, no
gradients/glows, no fake claims or safety promises.
