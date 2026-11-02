#!/usr/bin/env node
/**
 * Verifies a premium capture set and writes captures.json.
 *
 * Checks, per image:
 *   - the file exists and is a real PNG (signature bytes),
 *   - exact dimensions (1080x2400 portrait, 2400x1080 for the landscape band),
 *   - a minimum byte size so a blank/solid frame is rejected (a live OSM map is large),
 *   - when ImageMagick is available, a minimum pixel standard deviation so a flat
 *     "nothing rendered" frame is rejected even if the file is not tiny.
 *
 * The expected list follows design/redesign/screenshot-shotlist.md (S01-S15 required,
 * S16-S19 + wide/alternate map optional).
 *
 * Usage: node scripts/screenshots/verify-captures.mjs [dir]   (default scripts/screenshots/out)
 * Exit code: 0 when every required image passes, 1 otherwise.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WIDTH = 1080;
const HEIGHT = 2400;

/** Required premium set (shotlist S01-S15). */
const EXPECTED = [
  { file: 's01-auth.png', role: 'S01-auth', minBytes: 40_000, minStdDev: 0.012, scenario: 'Auth, dark, fields empty, keyboard closed, real server row' },
  { file: 's02-safety.png', role: 'S02-safety', minBytes: 40_000, minStdDev: 0.012, scenario: 'First-run safety / before you play' },
  { file: 's03-home.png', role: 'S03-home', minBytes: 45_000, minStdDev: 0.012, scenario: 'Home dark: masthead, permanent line, host block with "Riverside Run" typed, join block, playing as Omar' },
  { file: 's04-home-rtl.png', role: 'S04-home-rtl', minBytes: 45_000, minStdDev: 0.012, scenario: 'Home Arabic RTL, dark' },
  { file: 's05-lobby-host.png', role: 'S05-lobby', minBytes: 45_000, minStdDev: 0.012, scenario: 'Lobby host view: Riverside Run, 5 players (2 Prey / 3 Hunters), all ready, real code' },
  { file: 's06-lobby-player.png', role: 'S06-lobby-player', minBytes: 45_000, minStdDev: 0.012, scenario: 'Lobby player view: Omar ready, Leila not ready, waiting status' },
  { file: 's07-hunt.png', role: 'S07-hunt-hero', minBytes: 150_000, minStdDev: 0.02, scenario: 'Live hunt hero: real OSM tiles, 240 m zone ring, fresh + stale prey markers, trail, clock 41:12, Tag dock' },
  { file: 's08-hunt-claim.png', role: 'S08-hunt-claim', minBytes: 100_000, minStdDev: 0.015, scenario: 'Prey view: tag claim from Tariq with review/confirm action' },
  { file: 's09-tag-target-sheet.png', role: 'S09-tag-target', minBytes: 100_000, minStdDev: 0.015, scenario: 'Tag target sheet over the map, eligible prey list' },
  { file: 's10-hunt-sheet.png', role: 'S10-hunt-sheet', minBytes: 120_000, minStdDev: 0.015, scenario: 'Hunt sheet expanded: prey reports/ages, trails toggle, attribution visible' },
  { file: 's11-chat.png', role: 'S11-chat', minBytes: 40_000, minStdDev: 0.012, scenario: 'Field log chat: seeded hunt messages, phase separator, composer empty, keyboard closed' },
  { file: 's12-result-hunters.png', role: 'S12-result-hunters', minBytes: 45_000, minStdDev: 0.012, scenario: 'Result: Hunters win, both prey tagged, full-time score' },
  { file: 's13-result-prey.png', role: 'S13-result-prey', minBytes: 45_000, minStdDev: 0.012, scenario: 'Result: Prey win variant, one prey survived' },
  { file: 's14-settings.png', role: 'S14-settings', minBytes: 40_000, minStdDev: 0.012, scenario: 'Settings: appearance (dark, text size), language, manual page' },
  { file: 's15-home-light.png', role: 'S15-home-light', minBytes: 45_000, minStdDev: 0.012, scenario: 'Home light theme' },
];

/** Optional extras; verified when present, not required for a passing set. */
const OPTIONAL = [
  { file: 's16-lobby-rtl.png', role: 'S16-lobby-rtl', minBytes: 45_000, minStdDev: 0.012, scenario: 'Lobby Arabic RTL' },
  { file: 's17-empty-chat.png', role: 'S17-empty-chat', minBytes: 40_000, minStdDev: 0.012, scenario: 'Empty chat state ("No messages yet")' },
  { file: 's18-auth-loading.png', role: 'S18-auth-loading', minBytes: 40_000, minStdDev: 0.012, scenario: 'Auth submit loading state' },
  { file: 's19-auth-error.png', role: 'S19-auth-error', minBytes: 40_000, minStdDev: 0.012, scenario: 'Auth server-error state' },
  { file: 's07-hunt-wide.png', role: 'S07-hunt-wide', width: 2400, height: 1080, minBytes: 150_000, minStdDev: 0.02, scenario: 'Landscape live-hunt map band (2400x1080)' },
  { file: 's07-hunt-alt.png', role: 'S07-hunt-alt', minBytes: 150_000, minStdDev: 0.02, scenario: 'Alternate hero frame for selection' },
];

const directory = process.argv[2] ?? 'scripts/screenshots/out';

/**
 * Optional shots the verified build does not have redesigned yet. They are not required:
 * a missing pending shot is recorded in captures.json and does not fail the run. Pass as
 * `--pending s02,s11,s14`.
 */
const pendingIndex = process.argv.indexOf('--pending');
const pendingSet = new Set(
  (pendingIndex >= 0 ? process.argv[pendingIndex + 1] ?? '' : '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);

function isPending(spec) {
  const short = spec.file.replace(/\.png$/, '').slice(0, 3).toLowerCase();
  return pendingSet.has(spec.file.replace(/\.png$/, '').toLowerCase()) ||
    pendingSet.has(spec.role.toLowerCase()) ||
    pendingSet.has(short);
}

function pngSize(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** ImageMagick is preinstalled on GitHub's ubuntu runners; locally it may be missing. */
function standardDeviation(path) {
  for (const binary of ['magick', 'convert']) {
    try {
      const output = execFileSync(
        binary,
        [path, '-colorspace', 'Gray', '-format', '%[fx:standard_deviation]', 'info:'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      const value = Number.parseFloat(output);
      if (Number.isFinite(value)) return value;
    } catch {
      // try the next binary
    }
  }
  return null;
}

function check(spec, required) {
  const path = join(directory, spec.file);
  const expectedWidth = spec.width ?? WIDTH;
  const expectedHeight = spec.height ?? HEIGHT;
  const problems = [];
  const pending = required && isPending(spec);
  if (!existsSync(path)) {
    // A pending shot is allowed to be absent and is recorded as pending, never faked.
    if (required && !pending) problems.push('missing');
    return { spec, path, problems, record: null, pending };
  }
  const buffer = readFileSync(path);
  const size = pngSize(buffer);
  if (!size) problems.push('not a PNG');
  if (size && (size.width !== expectedWidth || size.height !== expectedHeight)) {
    problems.push(`wrong dimensions ${size.width}x${size.height} (expected ${expectedWidth}x${expectedHeight})`);
  }
  const bytes = statSync(path).size;
  if (bytes < spec.minBytes) problems.push(`only ${bytes} bytes (< ${spec.minBytes}); likely blank`);
  const deviation = standardDeviation(path);
  if (deviation !== null && deviation < spec.minStdDev) {
    problems.push(`pixel std-dev ${deviation.toFixed(4)} (< ${spec.minStdDev}); likely a flat/blank frame`);
  }
  const record = {
    file: spec.file,
    role: spec.role,
    scenario: spec.scenario,
    width: size?.width ?? null,
    height: size?.height ?? null,
    bytes,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    pixelStdDev: deviation === null ? null : Number(deviation.toFixed(5)),
    pending,
  };
  return { spec, path, problems, record, pending };
}

const results = EXPECTED.map((spec) => check(spec, true));
const optionalResults = OPTIONAL.map((spec) => check(spec, false));
const failures = results.filter((result) => result.problems.length > 0);
const records = [...results, ...optionalResults].map((result) => result.record).filter(Boolean);

for (const result of [...results, ...optionalResults]) {
  if (!result.record && !result.problems.length) {
    if (result.pending) console.log(`pending ${result.spec.file} (not in this verified build; recorded in MANIFEST)`);
    continue;
  }
  if (result.problems.length) {
    console.error(`FAIL ${result.spec.file}: ${result.problems.join('; ')}`);
  } else {
    const record = result.record;
    console.log(
      `ok   ${record.file}  ${record.width}x${record.height}  ${(record.bytes / 1024).toFixed(0)} KiB  ` +
        `stddev=${record.pixelStdDev ?? 'n/a'}  ${record.sha256.slice(0, 16)}` +
        `${record.pending ? '  (pending)' : ''}`,
    );
  }
}

if (records.length > 0) {
  writeFileSync(
    join(directory, 'captures.json'),
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        shotlist: 'design/redesign/screenshot-shotlist.md',
        pending: [...pendingSet],
        captures: records,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`wrote ${join(directory, 'captures.json')}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} required capture(s) failed verification.`);
  process.exit(1);
}
const pendingCount = results.filter((result) => result.pending && !result.record).length;
console.log(`\nAll ${results.length - pendingCount} required premium captures verified${pendingCount ? `; ${pendingCount} pending` : ''}.`);
