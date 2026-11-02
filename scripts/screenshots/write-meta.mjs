#!/usr/bin/env node
/**
 * Writes the capture metadata file that travels with the premium screenshot artifact
 * (and is later folded into docs/screenshots/premium/MANIFEST.json by fetch-premium.ps1).
 * Contains no session tokens: only room/user identity, capture settings and the APK hash.
 *
 * Usage: node write-meta.mjs --out DIR --state STATE.json --base URL --clock 0941 \
 *                            --apk path/to/app-debug.apk [--commit <sha>]
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : fallback;
}

const outDir = resolve(arg('out', 'scripts/screenshots/out'));
const statePath = resolve(arg('state', '/tmp/manhunt-premium/state.json'));
const base = arg('base', 'http://127.0.0.1:8080');
const clock = arg('clock', '0941');
const apkPath = arg('apk', '');
const commit = arg('commit', 'unknown');

const state = JSON.parse(readFileSync(statePath, 'utf8'));
let apkSha256 = 'unknown';
try {
  apkSha256 = createHash('sha256').update(readFileSync(apkPath)).digest('hex');
} catch {
  // The APK hash is advisory metadata only.
}

const meta = {
  capturedAt: new Date().toISOString(),
  base,
  appUser: 'Maya',
  roomName: state.roomName,
  roomCode: state.roomCode,
  players: Object.values(state.users).map((user) => ({ username: user.username, team: user.team })),
  statusBarClock: `${clock.slice(0, 2)}:${clock.slice(2)}`,
  statusBar: { clock: `${clock.slice(0, 2)}:${clock.slice(2)}`, batteryPercent: 87, wifiLevel: 4, notificationsHidden: true },
  device: { width: 1080, height: 2400, density: 420, theme: 'dark', orientation: 'portrait', nav: 'gesture' },
  commit,
  apkSha256,
};
writeFileSync(`${outDir}/capture-meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
console.log(`wrote ${outDir}/capture-meta.json (room ${meta.roomName}, code ${meta.roomCode}, commit ${commit.slice(0, 12)})`);
