import assert from 'node:assert/strict';
import test from 'node:test';
import { computedPhase, winnerFor } from '../src/domain/match.ts';
import { haversineMeters, pointInCircle, shrinkRadius } from '../src/domain/geo.ts';

/**
 * Property-based checks (see .opencode/skills/property-based-testing).
 * A seeded generator hunts counterexamples across the input domain instead of
 * asserting a handful of hand-picked cases. Deterministic: same seed, same run.
 */

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = mulberry32(20261029);
const between = (min: number, max: number) => min + random() * (max - min);

const PHASE_ORDER: Record<string, number> = {
  head_start: 0,
  hunting: 1,
  finished: 2,
  paused: 3,
  cancelled: 4,
};

test('property: a match phase never moves backwards as time advances', () => {
  for (let i = 0; i < 500; i++) {
    const startedAt = between(0, 1e12);
    const headStartEndsAt = startedAt + between(0, 3_600_000);
    const endsAt = headStartEndsAt + between(300_000, 14_400_000);
    const match = {
      status: 'head_start' as const,
      head_start_ends_at: headStartEndsAt,
      ends_at: endsAt,
      ended_at: null,
    };

    let previous = -1;
    const jitter = between(0, 1_000_000);
    for (let step = 0; step < 12; step++) {
      const now = startedAt - jitter + ((endsAt - startedAt + 2_000_000) * step) / 12;
      const phase = computedPhase(match, Math.round(now));
      const order = PHASE_ORDER[phase];
      assert.ok(order !== undefined, `unexpected phase ${phase}`);
      assert.ok(order >= previous, `phase went backwards: ${previous} -> ${order} at t=${now}`);
      previous = order;
    }
  }
});

test('property: shrinking a zone never grows it and never crosses the minimum', () => {
  for (let i = 0; i < 500; i++) {
    const current = between(25, 20_000);
    const min = between(25, current);
    const step = between(0, 5_000);
    const next = shrinkRadius(current, step, min);

    assert.ok(next <= current + 1e-9, `grew from ${current} to ${next}`);
    assert.ok(next >= min - 1e-9, `fell below minimum: ${next} < ${min}`);
  }
});

test('property: haversine is symmetric and zero for identical points', () => {
  for (let i = 0; i < 400; i++) {
    const a = { lat: between(-85, 85), lng: between(-180, 180) };
    const b = { lat: between(-85, 85), lng: between(-180, 180) };

    const forward = haversineMeters(a, b);
    const backward = haversineMeters(b, a);
    assert.ok(Math.abs(forward - backward) < 1e-6, `asymmetric: ${forward} vs ${backward}`);
    assert.ok(forward >= 0, `negative distance ${forward}`);
    assert.ok(haversineMeters(a, a) < 1e-6, 'distance to self must be zero');
  }
});

test('property: pointInCircle agrees with the distance function away from the boundary', () => {
  for (let i = 0; i < 400; i++) {
    const center = { lat: between(-80, 80), lng: between(-180, 180) };
    const point = { lat: between(-85, 85), lng: between(-180, 180) };
    const radius = between(50, 20_000);
    const distance = haversineMeters(center, point);

    if (distance < radius - 1) {
      assert.equal(pointInCircle(point, center, radius), true, `missed inside point (${distance} < ${radius})`);
    } else if (distance > radius + 1) {
      assert.equal(pointInCircle(point, center, radius), false, `accepted outside point (${distance} > ${radius})`);
    }
  }
});

test('property: prey win whenever at least one prey survives', () => {
  for (let i = 0; i < 200; i++) {
    const total = Math.floor(between(0, 51));
    const alive = Math.floor(between(0, total + 1));
    const winner = winnerFor(alive, total);
    assert.equal(winner, alive > 0 ? 'prey' : 'hunters', `alive=${alive} total=${total}`);
  }
});
