import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../src/db.ts';
import { Hub } from '../src/realtime.ts';
import { RoomService } from '../src/rooms.ts';
import { buildApp } from '../src/app.ts';

const SHA = '4b4e376bd46a58c91721471230f111a8a415355f08f89c478e970c9b7647047f';

async function makeApp(manifestPath?: string) {
  const db = openDb(':memory:');
  const hub = new Hub();
  const rooms = new RoomService(db, hub);
  const app = await buildApp({ db, hub, rooms, clock: () => Date.UTC(2026, 9, 30, 12), logger: false, manifestPath });
  return app;
}

test('install page renders version, size, checksum and server from the update manifest', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'manhunt-install-page-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const manifestPath = join(dir, 'app-latest.json');
  await writeFile(manifestPath, JSON.stringify({
    versionCode: 18,
    versionName: '0.9.0',
    url: '/app.apk',
    sha256: SHA,
    size: 13_857_093,
    publishedAt: '2026-10-30T07:12:54Z',
    notes: 'Signed release from GitHub Actions (v0.9.0)',
  }));

  const app = await makeApp(manifestPath);
  t.after(() => app.close());

  const res = await app.inject({ method: 'GET', url: '/', headers: { host: 'example.test' } });
  assert.equal(res.statusCode, 200);
  assert.match(String(res.headers['content-type']), /text\/html/);

  // The poster hero: one h1, the permanent line, the descriptor and the install honesty line.
  assert.match(res.body, /<title>ManHunt/);
  assert.match(res.body, /class="hero__title"/);
  assert.match(res.body, /<i>Hide<\/i>/);
  assert.match(res.body, /<i>from your<\/i>/);
  assert.match(res.body, /<i>friends\.<\/i>/);
  assert.match(res.body, /Real-world hide-and-seek for Android/);
  assert.match(res.body, /class="hero__honest/);
  assert.match(res.body, /Not on Play Store/);
  assert.match(res.body, /class="hero__plate"/);
  assert.match(res.body, /\/media\/map-hero\.webp/);

  // Manifest data appears in the hero and in the download pass.
  assert.match(res.body, /v0\.9\.0/);
  assert.match(res.body, /13\.2 MB/);
  assert.ok(res.body.includes(SHA), 'page shows the published SHA-256 checksum');
  assert.match(res.body, /2026-10-30/);
  assert.match(res.body, /href="\/app\.apk"/);
  assert.match(res.body, /Android 8\.0\+/);
  assert.ok(res.body.includes('http://example.test'), 'server line is filled from the request host');

  // The page's new information architecture: the field, the round, the screens, the rules, the pass
  // and the honest answers.
  assert.match(res.body, /id="field"/);
  assert.match(res.body, /id="round"/);
  assert.match(res.body, /id="screens"/);
  assert.match(res.body, /id="rules"/);
  assert.match(res.body, /id="privacy"/);
  assert.match(res.body, /id="download"/);
  assert.match(res.body, /id="questions"/);
  assert.match(res.body, /Install in four steps/);
  assert.match(res.body, /Privacy <span>and safety<\/span>/);

  // The design system: self-hosted OFL faces, real map plate, drawn wordmark, team roles.
  assert.match(res.body, /@font-face/);
  assert.match(res.body, /\/media\/big-shoulders-700\.woff2/);
  assert.match(res.body, /\/media\/instrument-sans-400\.woff2/);
  assert.match(res.body, /\/media\/map-band\.webp/);
  assert.match(res.body, /team--prey/);
  assert.match(res.body, /team--hunters/);
  assert.match(res.body, /OpenStreetMap contributors/);
  assert.match(res.body, /href="\/favicon\.png"/);
  assert.match(res.body, /og-image\.png/);
  assert.match(res.body, /<picture>/);
  // The screens grid is built from the accepted premium capture set: hunt (signature), home,
  // lobby, chat and the full-time result.
  assert.match(res.body, /class="screens screens--5"/);
  assert.match(res.body, /\/media\/shot-hunt\.webp/);
  assert.match(res.body, /\/media\/shot-home\.webp/);
  assert.match(res.body, /\/media\/shot-lobby\.webp/);
  assert.match(res.body, /\/media\/shot-extra\.webp/);
  assert.match(res.body, /\/media\/shot-result\.webp/);
  assert.equal((res.body.match(/class="screen"/g) ?? []).length, 5, 'five real captures in the rail');
  assert.match(res.body, /github\.com\/MostafaAshry513\/ManHunt/);
});

test('install page has no scripts and no remote assets (CSP-safe, self-contained)', async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  const res = await app.inject({ method: 'GET', url: '/' });
  assert.equal(res.statusCode, 200);
  assert.doesNotMatch(res.body, /<script/i, 'no scripts on the page');
  assert.doesNotMatch(res.body, /<link[^>]+href="https?:/i, 'no remote stylesheets/preloads');
  assert.doesNotMatch(res.body, /<(?:img|source)[^>]+src="https?:/i, 'no remote images');
  for (const match of res.body.matchAll(/url\(["']?(https?:[^"')]+)/gi)) {
    assert.fail(`remote CSS asset: ${match[1]}`);
  }
  assert.doesNotMatch(res.body, /@import/i);
});

test('install page shows aggregate account count and weekly growth', async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  for (const username of ['alpha', 'bravo']) {
    const registered = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username, password: 'password123' },
    });
    assert.equal(registered.statusCode, 200, registered.body);
  }

  const page = await app.inject({ method: 'GET', url: '/' });
  assert.match(page.body, /<b>2<\/b><span class="data-sm">accounts started<\/span>/);
  assert.match(page.body, /<b class="plus">\+2<\/b><span class="data-sm">new this week<\/span>/);
});

test('install page media: favicon, social preview, real map plates and self-hosted fonts are served', async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  const favicon = await app.inject({ method: 'GET', url: '/favicon.png' });
  assert.equal(favicon.statusCode, 200);
  assert.equal(favicon.headers['content-type'], 'image/png');
  assert.ok(favicon.rawPayload.length > 100);

  const og = await app.inject({ method: 'GET', url: '/og-image.png' });
  assert.equal(og.statusCode, 200);
  assert.equal(og.headers['content-type'], 'image/png');
  assert.ok(og.rawPayload.length > 1000);

  const home = await app.inject({ method: 'GET', url: '/media/home.png' });
  assert.equal(home.statusCode, 200);
  assert.equal(home.headers['content-type'], 'image/png');
  assert.ok(home.rawPayload.length > 1000);

  for (const [file, type] of [
    ['shot-home.webp', 'image/webp'],
    ['shot-home.jpg', 'image/jpeg'],
    ['shot-lobby.webp', 'image/webp'],
    ['shot-lobby.jpg', 'image/jpeg'],
    ['shot-hunt.webp', 'image/webp'],
    ['shot-hunt.jpg', 'image/jpeg'],
    ['shot-extra.webp', 'image/webp'],
    ['shot-result.webp', 'image/webp'],
    ['shot-result.jpg', 'image/jpeg'],
    ['explainer-cover.webp', 'image/webp'],
    ['map-hero.webp', 'image/webp'],
    ['map-hero.jpg', 'image/jpeg'],
    ['map-band.webp', 'image/webp'],
    ['map-band.jpg', 'image/jpeg'],
    ['big-shoulders-700.woff2', 'font/woff2'],
    ['instrument-sans-400.woff2', 'font/woff2'],
    ['instrument-sans-700.woff2', 'font/woff2'],
    ['red-hat-mono-400.woff2', 'font/woff2'],
  ] as const) {
    const res = await app.inject({ method: 'GET', url: `/media/${file}` });
    assert.equal(res.statusCode, 200, file);
    assert.equal(res.headers['content-type'], type, file);
    assert.ok(res.rawPayload.length > 1000, file);
  }

  // A random file that is not on the allowlist must never be readable.
  const missing = await app.inject({ method: 'GET', url: '/media/not-on-the-list.png' });
  assert.equal(missing.statusCode, 404);

  const fontNotListed = await app.inject({ method: 'GET', url: '/media/comic-sans.woff2' });
  assert.equal(fontNotListed.statusCode, 404);
});

test('/api/app/latest serves the manifest JSON without a PowerShell BOM', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'manhunt-install-page-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const manifestPath = join(dir, 'app-latest.json');
  await writeFile(manifestPath, `\uFEFF${JSON.stringify({
    versionCode: 18,
    versionName: '0.9.0',
    url: '/app.apk',
    sha256: SHA,
    size: 13_857_093,
    publishedAt: '2026-10-30T07:12:54Z',
  })}`);

  const app = await makeApp(manifestPath);
  t.after(() => app.close());

  const res = await app.inject({ method: 'GET', url: '/api/app/latest' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.charCodeAt(0), '{'.charCodeAt(0), 'no leading BOM before JSON');
  const body = res.json() as { versionName: string; sha256: string };
  assert.equal(body.versionName, '0.9.0');
  assert.equal(body.sha256, SHA);
});

test('install page still downloads without a published manifest and the update API returns 404', async (t) => {
  const app = await makeApp('/nonexistent/manhunt-app-latest.json');
  t.after(() => app.close());

  const page = await app.inject({ method: 'GET', url: '/' });
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /Download the APK/);
  assert.match(page.body, /not published on this server yet/);
  assert.match(page.body, /No checksum has been published for this build/);
  // A fresh deployment (no accounts yet) shows the licence fact rather than a wall of zeroes.
  assert.match(page.body, /<b>MIT<\/b><span class="data-sm">licensed source<\/span>/);
  assert.doesNotMatch(page.body, /accounts started/);

  const latest = await app.inject({ method: 'GET', url: '/api/app/latest' });
  assert.equal(latest.statusCode, 404);
  assert.equal(latest.json().error.code, 'no_update_channel');
});

test('html pages send hardening headers and the join page sanitizes the invite code', async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  for (const url of ['/', '/join?code=abc123']) {
    const res = await app.inject({ method: 'GET', url });
    assert.equal(res.statusCode, 200, url);
    assert.equal(res.headers['x-content-type-options'], 'nosniff', url);
    assert.equal(res.headers['x-frame-options'], 'DENY', url);
    assert.equal(res.headers['referrer-policy'], 'no-referrer', url);
    assert.match(String(res.headers['content-security-policy']), /default-src 'none'/, url);
  }

  // The landing page self-hosts its fonts, so the policy allows same-origin font files only.
  const home = await app.inject({ method: 'GET', url: '/' });
  assert.match(String(home.headers['content-security-policy']), /font-src 'self'/);
  assert.doesNotMatch(String(home.headers['content-security-policy']), /script-src/);

  const join = await app.inject({ method: 'GET', url: '/join?code=abc123' });
  assert.match(join.body, /ABC123/);

  const hostile = await app.inject({ method: 'GET', url: '/join?code=%3Cscript%3Ealert(1)%3C%2Fscript%3E' });
  assert.doesNotMatch(hostile.body, /<script>alert/i);
});
