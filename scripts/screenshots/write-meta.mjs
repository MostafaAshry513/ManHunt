#!/usr/bin/env node
/**
 * Writes the capture metadata that travels with the premium screenshot artifact and is
 * later folded into docs/screenshots/premium/MANIFEST.json by fetch-premium.ps1.
 * Contains no session tokens: room/user identity, capture settings, timings and the APK hash.
 *
 * Usage: node write-meta.mjs --out DIR --state STATE.json --base URL --clock 2104 \
 *                            --apk path/to/app-debug.apk [--commit <sha>] [--pending s02,s11]
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  return value !== undefined && !value.startsWith('--') ? value : fallback;
}

const outDir = resolve(arg('out', 'scripts/screenshots/out'));
const statePath = resolve(arg('state', '/tmp/manhunt-premium/state.json'));
const base = arg('base', 'http://127.0.0.1:8080');
const clock = arg('clock', '2104');
const apkPath = arg('apk', '');
const commit = arg('commit', 'unknown');

/** Optional shots the verified build does not have redesigned yet; recorded, never faked. */
const pending = arg('pending', '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);
const dataGaps = [];
if (pending.includes('s13')) {
  dataGaps.push('S13 pending: survivor count unavailable (the server resets eliminations at match finish).');
} else {
  dataGaps.push('S13 survivor count unavailable (server resets eliminations at finish); captured as the honest Prey-win state.');
}

const state = JSON.parse(readFileSync(statePath, 'utf8'));
let apkSha256 = 'unknown';
try {
  apkSha256 = createHash('sha256').update(readFileSync(apkPath)).digest('hex');
} catch {
  // The APK hash is advisory metadata only.
}

const clockHhmm = `${clock.slice(0, 2)}:${clock.slice(2)}`;
const meta = {
  capturedAt: new Date().toISOString(),
  shotlist: 'design/redesign/screenshot-shotlist.md',
  base,
  appUsers: {
    hunt: 'Omar',
    host: 'Yasmin',
    note: 'Capture device switches between Omar (Hunter hunt view) and Yasmin (host lobby / Prey claim view).',
  },
  roomName: state.roomName,
  roomCode: state.roomCode,
  players: Object.values(state.users).map((user) => ({ username: user.username, team: user.team })),
  timings: {
    statusBarClock: clockHhmm,
    huntingStarted: '20:45:12',
    remainingAtCapture: '41:12',
    finalPlayedDuration: '18:48',
    chatWindow: '20:46-20:52',
  },
  statusBar: {
    clock: clockHhmm,
    batteryPercent: 100,
    plugged: false,
    network: 'wifi only, full',
    notificationsHidden: true,
  },
  device: { width: 1080, height: 2400, density: 420, theme: 'dark', nav: 'gesture', api: 36 },
  pending,
  dataGaps,
  commit,
  apkSha256,
};
writeFileSync(`${outDir}/capture-meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
console.log(
  `wrote ${outDir}/capture-meta.json (room ${meta.roomName}, code ${meta.roomCode}, ` +
    `commit ${commit.slice(0, 12)}, pending ${pending.length ? pending.join(',') : 'none'})`,
);
