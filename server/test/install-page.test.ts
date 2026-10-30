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
  assert.match(res.body, /<title>ManHunt/);
  assert.match(res.body, /Hide\. Hunt\. Survive\./);
  assert.match(res.body, /v0\.9\.0/);
  assert.match(res.body, /13\.2 MB/);
  assert.ok(res.body.includes(SHA), 'page shows the published SHA-256 checksum');
  assert.match(res.body, /Published 2026-10-30/);
  assert.match(res.body, /href="\/app\.apk"/);
  assert.match(res.body, /Android 8\.0\+/);
  assert.ok(res.body.includes('http://example.test'), 'server line is filled from the request host');
  assert.doesNotMatch(res.body, /Server\s*<\/p>/, 'the old blank "Server:" line does not come back');
  assert.match(res.body, /Install in four steps/);
  assert.match(res.body, /Privacy &amp; safety/);
  assert.match(res.body, /github\.com\/MostafaAshry513\/ManHunt/);
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
  assert.match(page.body, /Download APK/);
  assert.match(page.body, /not published on this server yet/);

  const latest = await app.inject({ method: 'GET', url: '/api/app/latest' });
  assert.equal(latest.statusCode, 404);
  assert.equal(latest.json().error.code, 'no_update_channel');
});
