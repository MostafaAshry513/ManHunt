import assert from 'node:assert/strict';
import test from 'node:test';
import {
  circlePolygon, destination, haversineMeters, impliedSpeedMps, isFiniteCoord,
  pointInCircle, pointInPolygon, polygonAreaM2, shrinkRadius,
} from '../src/domain/geo.ts';
import { canStart, computedPhase, DEFAULT_SETTINGS, parseSettings, winnerFor } from '../src/domain/match.ts';

test('haversine is accurate for known distances', () => {
  // 1 degree of latitude is ~111.2 km
  const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
  assert.ok(Math.abs(d - 111_195) < 500, `got ${d}`);

  const london = { lat: 51.5074, lng: -0.1278 };
  const paris = { lat: 48.8566, lng: 2.3522 };
  const ld = haversineMeters(london, paris);
  assert.ok(Math.abs(ld - 343_500) < 2000, `got ${ld}`);
});

test('destination and circlePolygon stay at the requested radius', () => {
  const center = { lat: 51.5, lng: -0.12 };
  for (const bearing of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const p = destination(center, bearing, 1000);
    const d = haversineMeters(center, p);
    assert.ok(Math.abs(d - 1000) < 2, `bearing ${bearing} -> ${d}`);
  }

  const poly = circlePolygon(center, 500, 32);
  assert.equal(poly.length, 32);
  for (const p of poly) assert.ok(pointInCircle(p, center, 501));
  assert.ok(!pointInCircle({ lat: 51.6, lng: -0.12 }, center, 500));
});

test('pointInPolygon handles inside, outside and degenerate input', () => {
  const square = [
    { lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }, { lat: 1, lng: 0 },
  ];
  assert.equal(pointInPolygon({ lat: 0.5, lng: 0.5 }, square), true);
  assert.equal(pointInPolygon({ lat: 1.5, lng: 0.5 }, square), false);
  assert.equal(pointInPolygon({ lat: 0.5, lng: -0.5 }, square), false);
  assert.equal(pointInPolygon({ lat: 0.5, lng: 0.5 }, []), false);
});

test('polygonAreaM2 is in the right ballpark', () => {
  // ~1km x 1km square near the equator
  const poly = [
    { lat: 0, lng: 0 }, { lat: 0, lng: 0.009 }, { lat: 0.009, lng: 0.009 }, { lat: 0.009, lng: 0 },
  ];
  const area = polygonAreaM2(poly);
  assert.ok(area > 900_000 && area < 1_050_000, `got ${area}`);
});

test('shrinkRadius never goes below the minimum', () => {
  assert.equal(shrinkRadius(500, 100, 100), 400);
  assert.equal(shrinkRadius(150, 100, 100), 100);
  assert.equal(shrinkRadius(100, 100, 100), 100);
  assert.equal(shrinkRadius(500, -50, 100), 500);
});

test('impliedSpeedMps detects teleportation', () => {
  const a = { p: { lat: 0, lng: 0 }, t: 0 };
  const b = { p: { lat: 0, lng: 1 }, t: 60_000 }; // ~111km in a minute
  assert.ok(impliedSpeedMps(a, b) > 1000);
  const walking = { p: { lat: 0, lng: 0.0001 }, t: 60_000 }; // ~11m/min
  assert.ok(impliedSpeedMps(a, walking) < 1);
  assert.equal(impliedSpeedMps(a, { p: b.p, t: 0 }), Number.POSITIVE_INFINITY);
});

test('isFiniteCoord rejects out of range values', () => {
  assert.equal(isFiniteCoord({ lat: 10, lng: 20 }), true);
  assert.equal(isFiniteCoord({ lat: 91, lng: 20 }), false);
  assert.equal(isFiniteCoord({ lat: 10, lng: 181 }), false);
  assert.equal(isFiniteCoord({ lat: Number.NaN, lng: 0 }), false);
  assert.equal(isFiniteCoord(null), false);
});

test('canStart requires balance, minimum players and readiness', () => {
  const ok = canStart([
    { team: 'prey', is_ready: 1 },
    { team: 'hunters', is_ready: true },
  ], DEFAULT_SETTINGS);
  assert.equal(ok.ok, true, ok.reasons.join(','));

  const single = canStart([{ team: 'prey', is_ready: 1 }], DEFAULT_SETTINGS);
  assert.equal(single.ok, false);
  assert.ok(single.reasons.some((r) => r.includes('at least 2')));

  const oneTeam = canStart([
    { team: 'prey', is_ready: 1 }, { team: 'prey', is_ready: 1 },
  ], DEFAULT_SETTINGS);
  assert.equal(oneTeam.ok, false);
  assert.ok(oneTeam.reasons.some((r) => r.includes('Hunters')));

  const unready = canStart([
    { team: 'prey', is_ready: 1 }, { team: 'hunters', is_ready: 0 },
  ], DEFAULT_SETTINGS);
  assert.equal(unready.ok, false);
  assert.ok(unready.reasons.some((r) => r.includes('not ready')));
});

test('computedPhase derives transitions from timestamps only', () => {
  const m = { status: 'head_start' as const, head_start_ends_at: 1000, ends_at: 5000, ended_at: null };
  assert.equal(computedPhase(m, 0), 'head_start');
  assert.equal(computedPhase(m, 999), 'head_start');
  assert.equal(computedPhase(m, 1000), 'hunting');
  assert.equal(computedPhase(m, 4999), 'hunting');
  assert.equal(computedPhase(m, 5000), 'finished');

  assert.equal(computedPhase({ ...m, status: 'paused' }, 9999), 'paused');
  assert.equal(computedPhase({ ...m, status: 'cancelled' }, 9999), 'cancelled');
});

test('winnerFor: hunters win only when no prey remain', () => {
  assert.equal(winnerFor(1, 2), 'prey');
  assert.equal(winnerFor(2, 2), 'prey');
  assert.equal(winnerFor(0, 2), 'hunters');
  assert.equal(winnerFor(0, 0), 'hunters');
});

test('parseSettings applies defaults and rejects invalid combos', () => {
  const defaults = parseSettings({});
  assert.equal(defaults.ok, true);
  if (defaults.ok) {
    assert.equal(defaults.settings.headStartSec, 300);
    assert.equal(defaults.settings.locationIntervalSec, 300);
    assert.equal(defaults.settings.mode, 'open');
  }

  const zoneWithoutArea = parseSettings({ mode: 'zone' });
  assert.equal(zoneWithoutArea.ok, false);

  const badDuration = parseSettings({ durationSec: 10 });
  assert.equal(badDuration.ok, false);

  const goodZone = parseSettings({
    mode: 'zone',
    zone: { centerLat: 51.5, centerLng: -0.12, radiusM: 800 },
  });
  assert.equal(goodZone.ok, true);
});
