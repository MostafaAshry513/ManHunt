# Install-page handoff — favicons, app icon, OG card

For the install page served at `http://74.208.99.178/`. Copy these files to the page's static root
(next to `index.html` / whatever `server/src/app.ts` serves) and add the tags below. **No server code was
edited in this workstream.**

| File | Size | Use |
|---|---|---|
| `favicon-32.png` | 32×32 | browser tab (`rel="icon"`), primary favicon |
| `favicon-48.png` | 48×48 | higher-density favicon / Android home-screen shortcut |
| `install-page-icon-192.png` | 192×192 | web app manifest icon / `apple-touch-icon` / install prompt icon |
| `app-icon.svg` | 108×108 dp vector | inline SVG in the page hero, or any `<img>` — field `#0B1220` + approved mark |
| `og-image-1200x630.png` | 1200×630 | Open Graph / Twitter card image |

All are the **approved** assets: Open Zone mark, brand field `#0B1220`, cyan field ring `#22D3EE`, coral
prey dot `#FF7A59`. No text is inside the icon. The approved slogan / descriptor copy lives in the page's
own `<h1>`/meta copy — see `design/brand/strategy/brand-platform.md` §“Install page”.

## Suggested HTML (head)

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/install-page-icon-192.png" />
<link rel="manifest" href="/site.webmanifest" />

<!-- Open Graph / Twitter: the card is the approved brand plate -->
<meta property="og:type" content="website" />
<meta property="og:title" content="ManHunt — No gear. No fee. Just players." />
<meta property="og:description" content="Real-world GPS hide-and-seek. Free on Android." />
<meta property="og:image" content="http://74.208.99.178/og-image-1200x630.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="ManHunt — No gear. No fee. Just players. Real-world GPS hide-and-seek." />
<meta name="twitter:card" content="summary_large_image" />
```

`og:image` **must be an absolute URL** that the scraper can reach; the deployment is plain HTTP at a bare
IP today, so use `http://74.208.99.178/og-image-1200x630.png` (and update it if the URL changes later).

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

## Page look (copy hook)

The approved brand direction is “Chalk on Night Asphalt” and the approved slogan is
**No gear. No fee. Just players.** with **Real-world GPS hide-and-seek** as the descriptor. The OG card
already follows it: navy field, chalk MANHUNT wordmark, cyan hairline, chalk + coral slogan. Keep the
page in the same register: dark ground, one cyan accent, no gradients/glows.
