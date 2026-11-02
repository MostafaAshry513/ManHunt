/**
 * ManHunt site redesign — build the install-page renderer for server/src/app.ts from the design
 * reference (design/site-redesign/refs/site-ref.html).
 *
 * The reference is the design source of truth: it is standalone HTML with relative asset paths and
 * literal demo data. This script:
 *   1. extracts the masthead / main / footer / stylesheet from the reference,
 *   2. rewrites asset paths to the server's /media/* route,
 *   3. swaps the dynamic values (version, size, published date, SHA-256, download href, server,
 *      aggregate stats, release-not-published fallback) for template placeholders,
 *   4. wraps the result in the renderInstallPage TypeScript function and splices it into
 *      server/src/app.ts between the two stable markers below.
 *
 * Run from the repo root:  node design/site-redesign/tools/build-page.mjs
 */
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..', '..');
const REF = resolve(root, 'design/site-redesign/refs/site-ref.html');
const APP = resolve(root, 'server/src/app.ts');
const OUT = resolve(root, 'design/site-redesign/impl/render-install-page.generated.ts');

const html = await readFile(REF, 'utf8');

function extract(re, name) {
  const m = html.match(re);
  if (!m) throw new Error(`could not extract ${name}`);
  return m[1];
}

const style = extract(/<style>([\s\S]*?)<\/style>/, 'style');
const masthead = extract(/<header class="masthead">([\s\S]*?)<\/header>/, 'masthead');
const main = extract(/<main id="main">([\s\S]*?)<\/main>/, 'main');
const footer = extract(/<footer class="footer"[^>]*>([\s\S]*?)<\/footer>/, 'footer');

// The extracted sections are embedded inside a TypeScript template literal: a stray backtick or
// interpolation sequence would break the generated file (and would mean the page has logic in it).
for (const [name, section] of Object.entries({ style, masthead, main, footer })) {
  if (section.includes('`') || section.includes('${')) {
    throw new Error(`reference section "${name}" contains a template-literal delimiter`);
  }
}

function swapDynamic(section, name) {
  let out = section;

  // Asset paths -> public /media/* allowlist route.
  out = out.split('../../../server/public/site/').join('/media/');

  // Aggregate community stats (dynamic, aggregate only). A fresh deployment with no accounts shows
  // the licence fact instead of a wall of zeroes.
  out = out.replace(
    /<div class="fixture__stats">[\s\S]*?<div class="fixture__stat"><b>0<\/b><span class="data-sm">ads, ever<\/span><\/div>\s*<\/div>/,
    '${statsBlock}',
  );

  // Hero honesty line: version and size are optional (no manifest yet).
  out = out.replace(
    '<span>Free APK</span><span>v0.15.1</span><span>2.1 MB</span><span>Android 8.0+</span><span>Not on Play Store</span>',
    '${heroMeta}',
  );

  // Pass block: manifest-driven metadata.
  out = out.replace('<dd>v0.15.1</dd>', '<dd>${metaVersion}</dd>');
  out = out.replace('<dd>2.1 MB</dd>', '<dd>${metaSize}</dd>');
  out = out.replace('<dd>2026-11-01</dd>', '<dd>${metaPublished}</dd>');
  out = out.replace(
    '<a class="btn btn--primary" href="/app.apk">Download the APK \u00b7 v0.15.1</a>',
    '<a class="btn btn--primary" href="${escapeHtml(downloadHref)}">${downloadLabel}</a>',
  );
  out = out.replace(
    /<dl class="pass__hash">\s*<dt>SHA-256<\/dt>\s*<code>[^<]*<\/code>\s*<\/dl>/,
    '${hashBlock}',
  );
  out = out.replace(
    /<p class="pass__server">[\s\S]*?<\/p>\s*<p class="pass__hint">[\s\S]*?<\/p>/,
    '${serverBlock}',
  );
  out = out.replace(/(<p class="pass__warn">[\s\S]*?<\/p>)/, '$1\n          ${releaseNote}');

  // Any leftovers are a build bug, not a silent drift.
  const leftovers = out.match(
    /\bv0\.15\.1\b|\b2\.1 MB\b|2026-11-01|3a615051f8fd84932f73968bbd140c6b2d673f47307c16496d6ef7af7d67927b|127\.0\.0\.1:8095|<b>142<\/b>/,
  );
  if (leftovers) throw new Error(`${name}: un-swapped literal "${leftovers[0]}"`);

  return out;
}

const styleOut = swapDynamic(style, 'style');
const mastheadOut = swapDynamic(masthead, 'masthead');
let mainOut = swapDynamic(main, 'main');
const footerOut = swapDynamic(footer, 'footer');

// The screens grid is data-driven: the premium capture set lands in stages (the result screen is
// pending a correction run), so the renderer builds the <figure> list from this array. Add/remove
// an entry here to change the set; the rail class follows the count.
mainOut = mainOut.replace('<div class="screens">', '<div class="screens ${screensClass}">');
mainOut = mainOut.replace('<!-- GENERATED:SCREENS -->', '${screensBlock}');
if (!mainOut.includes('${screensBlock}')) {
  throw new Error('screens placeholder missing from the reference markup');
}

// NOTE: this block is a JS template literal that *generates TypeScript source*, so every
// intended interpolation in the generated file is escaped here as \${...}.
const fn = `/**
 * The install page: a match-poster landing page for the free sideloaded APK.
 * Metadata (version, size, checksum, download) is read from the update manifest on every request;
 * everything else is static, dependency-free markup so the page works on any phone. No JavaScript.
 * Design source: design/site-redesign/ (concept.md, tokens.md, refs/site-ref.html) - regenerate this
 * function with design/site-redesign/tools/build-page.mjs rather than hand-editing the markup.
 */
function renderInstallPage(
  manifest: LatestManifest | null,
  serverUrl: string,
  stats: { totalAccounts: number; newAccounts: number },
): string {
  const version = typeof manifest?.versionName === 'string' ? manifest.versionName.trim() : '';
  const size = formatBytes(manifest?.size);
  const sha = typeof manifest?.sha256 === 'string' ? manifest.sha256.trim() : '';
  const published = formatDate(manifest?.publishedAt);
  const manifestUrl = typeof manifest?.url === 'string' ? manifest.url.trim() : '';
  const downloadHref = /^\\/[\\w./-]+$/.test(manifestUrl) ? manifestUrl : '/app.apk';
  const downloadLabel = \`Download the APK\${version ? \` \\u00b7 v\${escapeHtml(version)}\` : ''}\`;
  const metaVersion = version ? \`v\${escapeHtml(version)}\` : '\\u2014';
  const metaSize = size ? escapeHtml(size) : '\\u2014';
  const metaPublished = published ? escapeHtml(published) : '\\u2014';
  const heroMeta = [
    '<span>Free APK</span>',
    version ? \`<span>v\${escapeHtml(version)}</span>\` : '',
    size ? \`<span>\${escapeHtml(size)}</span>\` : '',
    '<span>Android 8.0+</span>',
    '<span>Not on Play Store</span>',
  ].filter(Boolean).join('');

  const hashBlock = sha
    ? \`<dl class="pass__hash"><dt>SHA-256</dt><code>\${escapeHtml(sha)}</code></dl>\`
    : '<p class="pass__hint">No checksum has been published for this build.</p>';

  const serverBlock = serverUrl
    ? \`<p class="pass__server"><span class="state"><b></b>This server</span><code>\${escapeHtml(serverUrl)}</code></p>
          <p class="pass__hint">The build offered here is already pointed at this server. Self-hosting? Set your own address on the app's sign-in screen after installing.</p>\`
    : '<p class="pass__hint">Set the server address on the app\\'s sign-in screen after installing.</p>';

  const releaseNote = manifest === null
    ? '<p class="pass__fallback">Release details are not published on this server yet \\u2014 the download below is the latest available build.</p>'
    : '';

  const zeroAccountStat = '<div class="fixture__stat"><b>0</b><span class="data-sm">ads, ever</span></div>';
  const statsBlock = stats.totalAccounts > 0
    ? \`<div class="fixture__stats">
        <div class="fixture__stat"><b>\${stats.totalAccounts}</b><span class="data-sm">accounts started</span></div>
        <div class="fixture__stat"><b class="plus">+\${stats.newAccounts}</b><span class="data-sm">new this week</span></div>
        \${zeroAccountStat}
      </div>\`
    : \`<div class="fixture__stats">
        <div class="fixture__stat"><b>MIT</b><span class="data-sm">licensed source</span></div>
        \${zeroAccountStat}
      </div>\`;

  // Real premium captures (design/redesign/screenshot-shotlist.md, captured from the running app).
  // Order = visual order; the hunt screen leads because it is the product's signature surface.
  // PENDING: the result captures (s12/s13) are blocked by an app snapshot bug and must not be shown;
  // add { img: 'result', label: 'Result', caption: 'Who won, and why', ... } here when
  // docs/screenshots/premium/s12-result-hunters.png exists and tools/optimize-assets.ps1 has
  // generated shot-result.webp/.jpg (plus the two allowlist lines in server/src/app.ts).
  const SCREENS = [
    {
      img: 'hunt',
      label: 'Hunt',
      caption: 'The live map — zone, reports, trail',
      w: 900, h: 2000,
      alt: 'Live hunt screen: real OpenStreetMap tiles with the 240 metre zone, a fresh and a stale prey report, a coral trail and the server clock at 41:12.',
    },
    {
      img: 'home',
      label: 'Home',
      caption: 'Host or join in two taps',
      w: 900, h: 2000,
      alt: 'Home screen: the Open Zone brand hero with the host-a-hunt and join-a-hunt actions.',
    },
    {
      img: 'lobby',
      label: 'Lobby',
      caption: 'Pick a side, ready up',
      w: 900, h: 2000,
      alt: 'Lobby screen: Riverside Run with five players split into Prey and Hunters, all ready.',
    },
    {
      img: 'extra',
      label: 'Chat',
      caption: 'The room, in one place',
      w: 900, h: 2000,
      alt: 'Room chat during a live Riverside Run hunt: player messages, match updates and the compose field.',
    },
    {
      img: 'result',
      label: 'Result',
      caption: 'Full time — who won',
      w: 900, h: 2000,
      alt: 'Full-screen hunt result: FULL TIME after 18:48 played, prey 0 of 2 remaining, “Hunters win.”',
    },
  ];
  const screensBlock = SCREENS.map((shot) =>
    '<figure class="screen">' +
    '<span class="screen__frame"><picture><source srcset="/media/shot-' + shot.img + '.webp" type="image/webp">' +
    '<img src="/media/shot-' + shot.img + '.jpg" decoding="async" alt="' + shot.alt +
    '" width="' + shot.w + '" height="' + shot.h + '"></picture></span>' +
    '<figcaption><b>' + shot.label + '</b><span>' + shot.caption + '</span></figcaption>' +
    '</figure>',
  ).join('\\n            ');
  const screensClass = 'screens--' + SCREENS.length;

  // og:image must be absolute for social scrapers.
  const ogImageUrl = \`\${(serverUrl || '').replace(/\\/$/, '')}/og-image.png\`;

  return \`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0B1220">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preload" href="/media/big-shoulders-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/media/map-hero.webp" as="image" type="image/webp">
<meta name="description" content="Real-world GPS hide-and-seek for Android. Two teams, one street, one clock the players cannot bend. Free APK, Android 8.0+, not on Play Store.">
<meta property="og:type" content="website">
<meta property="og:title" content="ManHunt \\u2014 hide from your friends.">
<meta property="og:description" content="Real-world hide-and-seek for Android. Prey hide, Hunters track on a live map and tag in person. Free APK.">
<meta property="og:image" content="\${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<title>ManHunt \\u2014 hide from your friends</title>
<style>${styleOut}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">${mastheadOut}</header>
<main id="main">${mainOut}</main>
<footer class="footer" data-shot="footer">${footerOut}</footer>
</body>
</html>\`;
}
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, fn);

// Splice the generated renderer into app.ts between stable markers.
const app = await readFile(APP, 'utf8');
const START_RE =
  /\/\*\*\r?\n \* The install page[^\n]*\n(?: \*[^\n]*\n)+ \*\/\r?\nfunction renderInstallPage\(/;
const END = '/** Landing page for a shared invite link: /join?code=ABC123. */';
const startMatch = START_RE.exec(app);
const startIdx = startMatch ? startMatch.index : -1;
const endIdx = app.indexOf(END);
if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
  throw new Error('could not locate the renderInstallPage block markers in server/src/app.ts');
}
const before = app.slice(0, startIdx);
const after = app.slice(endIdx);
await copyFile(APP, resolve(root, 'design/site-redesign/impl/app.ts.bak'));
await writeFile(APP, `${before}${fn}\n${after}`);

console.log('generated renderer ->', OUT);
console.log('spliced into server/src/app.ts (backup: design/site-redesign/impl/app.ts.bak)');
console.log(`renderer ${fn.split('\n').length} lines`);
