import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';
import { openDb } from '../src/db.ts';

const HEAD_START_MS = 300_000;

async function setupRoom(opts: { settings?: Record<string, unknown>; extraPrey?: boolean } = {}) {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const carol = opts.extraPrey ? await register(ctx.app, 'carol') : null;

  const created = await createRoom(ctx.app, alice.token, 'History Room');
  const roomId: string = created.room.id;
  const code: string = created.room.code;

  await joinRoom(ctx.app, bob.token, code);
  if (carol) await joinRoom(ctx.app, carol.token, code);

  if (opts.settings) {
    const res = await ctx.app.inject({
      method: 'PATCH', url: `/api/rooms/${roomId}/settings`, headers: bearer(alice.token), payload: opts.settings,
    });
    assert.equal(res.statusCode, 200, res.body);
  }

  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' },
  });
  for (const player of [alice, bob, carol].filter((p) => p !== null)) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(player.token), payload: { ready: true },
    });
  }

  return { ...ctx, alice, bob, carol, roomId, code };
}

async function startMatch(ctx: Awaited<ReturnType<typeof setupRoom>>) {
  const res = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  assert.equal(res.statusCode, 200, res.body);
  return res.json() as any;
}

async function roomState(ctx: Awaited<ReturnType<typeof setupRoom>>, token: string) {
  const res = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}`, headers: bearer(token),
  });
  assert.equal(res.statusCode, 200, res.body);
  return res.json() as any;
}

test('history returns a completed match with winner and rosters', async () => {
  const ctx = await setupRoom();
  const started = await startMatch(ctx);
  const startedAt = started.match.startedAt as number;

  ctx.advance(HEAD_START_MS);
  const endedAt = ctx.now();
  const end = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/end`, headers: bearer(ctx.alice.token), payload: {},
  });
  assert.equal(end.statusCode, 200, end.body);

  const res = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}/history`, headers: bearer(ctx.bob.token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const { matches } = res.json() as any;

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, started.match.id);
  assert.equal(matches[0].startedAt, startedAt);
  assert.equal(matches[0].endedAt, endedAt);
  assert.equal(matches[0].winner, 'prey');
  assert.equal(matches[0].cancelled, false);
  assert.equal(matches[0].durationSec, HEAD_START_MS / 1000);
  assert.deepEqual(matches[0].prey, ['alice']);
  assert.deepEqual(matches[0].hunters, ['bob']);
});

test('history reconciles an expired match and is member-only', async () => {
  const ctx = await setupRoom();
  const started = await startMatch(ctx);
  const totalMs = (started.match.endsAt as number) - (started.match.startedAt as number);

  ctx.advance(totalMs + 1_000);
  const res = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}/history`, headers: bearer(ctx.alice.token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const match = (res.json() as any).matches[0];
  assert.equal(match.winner, 'prey');
  assert.notEqual(match.endedAt, null);
  assert.equal(typeof match.durationSec, 'number');

  const mallory = await register(ctx.app, 'mallory');
  const outsider = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}/history`, headers: bearer(mallory.token),
  });
  assert.equal(outsider.statusCode, 403);

  const anon = await ctx.app.inject({ method: 'GET', url: `/api/rooms/${ctx.roomId}/history` });
  assert.equal(anon.statusCode, 401);
});

test('match summary is limited to members of the match room', async () => {
  const ctx = await setupRoom();
  const started = await startMatch(ctx);
  const matchId = started.match.id as string;

  const member = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}`, headers: bearer(ctx.bob.token),
  });
  assert.equal(member.statusCode, 200, member.body);
  const summary = member.json() as any;
  assert.equal(summary.id, matchId);
  assert.equal(summary.phase, 'head_start');
  assert.equal(summary.startedAt, started.match.startedAt);
  assert.equal(summary.headStartEndsAt, started.match.headStartEndsAt);
  assert.equal(summary.endsAt, started.match.endsAt);
  assert.equal(summary.endedAt, null);
  assert.equal(summary.winner, null);
  assert.equal(summary.preyAlive, 1);
  assert.equal(summary.preyTotal, 1);
  assert.equal(summary.zone, null);

  const mallory = await register(ctx.app, 'mallory');
  const outsider = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}`, headers: bearer(mallory.token),
  });
  assert.equal(outsider.statusCode, 403);

  const anon = await ctx.app.inject({ method: 'GET', url: `/api/matches/${matchId}` });
  assert.equal(anon.statusCode, 401);

  const missing = await ctx.app.inject({
    method: 'GET', url: '/api/matches/match_does_not_exist', headers: bearer(ctx.alice.token),
  });
  assert.equal(missing.statusCode, 404);
});

test('pause then resume shifts deadlines and preserves remaining hunting time', async () => {
  const ctx = await setupRoom();
  await startMatch(ctx);
  ctx.advance(HEAD_START_MS);

  const before = await roomState(ctx, ctx.alice.token);
  assert.equal(before.match.phase, 'hunting');
  const endsAt = before.match.endsAt as number;
  const headStartEndsAt = before.match.headStartEndsAt as number;
  const startedAt = before.match.startedAt as number;

  const nonAdmin = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/pause`, headers: bearer(ctx.bob.token),
  });
  assert.equal(nonAdmin.statusCode, 403);

  const pause = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/pause`, headers: bearer(ctx.alice.token),
  });
  assert.equal(pause.statusCode, 200, pause.body);
  const pauseAt = ctx.now();
  const paused = pause.json() as any;
  assert.equal(paused.match.phase, 'paused');
  assert.equal(paused.match.endsAt, endsAt);

  ctx.advance(120_000);
  const duringPause = await roomState(ctx, ctx.alice.token);
  assert.equal(duringPause.match.phase, 'paused');
  assert.equal(duringPause.match.endsAt, endsAt);
  assert.equal(duringPause.match.startedAt, startedAt);

  const resume = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/resume`, headers: bearer(ctx.alice.token),
  });
  assert.equal(resume.statusCode, 200, resume.body);
  const resumed = resume.json() as any;
  assert.equal(resumed.match.phase, 'hunting');
  assert.equal(resumed.match.endsAt, endsAt + 120_000);
  assert.equal(resumed.match.headStartEndsAt, headStartEndsAt + 120_000);
  assert.equal(resumed.match.startedAt, startedAt);
  // Remaining hunting time is the same as it was at the moment of the pause.
  assert.equal(resumed.match.endsAt - ctx.now(), endsAt - pauseAt);
});

test('pause only works while hunting; resume only while paused; paused tagging is rejected', async () => {
  const ctx = await setupRoom();
  const started = await startMatch(ctx);
  const matchId = started.match.id as string;

  const pauseDuringHeadStart = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/pause`, headers: bearer(ctx.alice.token),
  });
  assert.equal(pauseDuringHeadStart.statusCode, 409);
  assert.match(pauseDuringHeadStart.body, /not_hunting/);

  ctx.advance(HEAD_START_MS);
  const resumeWhileHunting = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/resume`, headers: bearer(ctx.alice.token),
  });
  assert.equal(resumeWhileHunting.statusCode, 409);
  assert.match(resumeWhileHunting.body, /not_paused/);

  const pause = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/pause`, headers: bearer(ctx.alice.token),
  });
  assert.equal(pause.statusCode, 200, pause.body);

  const pauseAgain = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/pause`, headers: bearer(ctx.alice.token),
  });
  assert.equal(pauseAgain.statusCode, 409);
  assert.match(pauseAgain.body, /already_paused/);

  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  assert.equal(tag.statusCode, 409, tag.body);
  assert.match(tag.body, /not_hunting/);

  const report = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`,
    headers: bearer(ctx.alice.token), payload: { lat: 51.5, lng: -0.12, accuracy: 8 },
  });
  assert.equal(report.statusCode, 409, report.body);
  assert.match(report.body, /match_not_running/);

  const resume = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/resume`, headers: bearer(ctx.alice.token),
  });
  assert.equal(resume.statusCode, 200, resume.body);

  const tagAfterResume = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  assert.equal(tagAfterResume.statusCode, 200, tagAfterResume.body);
});

test('eliminated prey are spectators: no reports, trails or team changes, but chat works', async () => {
  const ctx = await setupRoom({ extraPrey: true, settings: { tagPolicy: 'instant' } });
  const started = await startMatch(ctx);
  const matchId = started.match.id as string;
  ctx.advance(HEAD_START_MS);

  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  assert.equal(tag.statusCode, 200, tag.body);
  assert.equal((tag.json() as any).status, 'confirmed');

  // Carol is still alive, so the match keeps running and Alice stays a spectator.
  const state = await roomState(ctx, ctx.alice.token);
  assert.equal(state.match.phase, 'hunting');
  assert.equal(state.members.find((m: any) => m.userId === ctx.alice.id).eliminated, true);
  assert.equal(state.members.find((m: any) => m.userId === ctx.carol!.id).eliminated, false);

  const report = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(ctx.alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 8 },
  });
  assert.equal(report.statusCode, 403, report.body);
  assert.equal((report.json() as any).error.code, 'spectator');

  const locations = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations`, headers: bearer(ctx.alice.token),
  });
  assert.equal(locations.statusCode, 403);
  assert.equal((locations.json() as any).error.code, 'spectator');

  const trail = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations/${ctx.carol!.id}`, headers: bearer(ctx.alice.token),
  });
  assert.equal(trail.statusCode, 403);
  assert.equal((trail.json() as any).error.code, 'spectator');

  const chat = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/messages`, headers: bearer(ctx.alice.token),
    payload: { body: 'Good luck, hunters' },
  });
  assert.equal(chat.statusCode, 200, chat.body);

  const teamChange = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/team`, headers: bearer(ctx.alice.token),
    payload: { team: 'hunters' },
  });
  assert.equal(teamChange.statusCode, 409, teamChange.body);
  assert.match(teamChange.body, /teams_locked/);
});

test('cancelled matches appear in history without a winner', async () => {
  const ctx = await setupRoom();
  await startMatch(ctx);
  ctx.advance(1_000);
  const endedAt = ctx.now();

  const end = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/end`, headers: bearer(ctx.alice.token),
    payload: { cancelled: true },
  });
  assert.equal(end.statusCode, 200, end.body);

  const res = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}/history`, headers: bearer(ctx.alice.token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const match = (res.json() as any).matches[0];
  assert.equal(match.cancelled, true);
  assert.equal(match.winner, null);
  assert.equal(match.endedAt, endedAt);
  assert.equal(match.durationSec, 1);
});

test('history is scoped to the requested room', async () => {
  const ctx = await setupRoom();
  await startMatch(ctx);
  ctx.advance(HEAD_START_MS);
  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/end`, headers: bearer(ctx.alice.token), payload: {},
  });

  const dave = await register(ctx.app, 'dave');
  const other = await createRoom(ctx.app, dave.token, 'Other Room');
  const res = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${other.room.id}/history`, headers: bearer(dave.token),
  });
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual((res.json() as any).matches, []);
});

test('migration adds paused_at to a pre-existing matches table', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'manhunt-migrate-'));
  const dbPath = join(dir, 'old.db');

  try {
    const old = new DatabaseSync(dbPath);
    old.exec(`CREATE TABLE matches (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      head_start_ends_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      ended_at INTEGER,
      winner TEXT,
      settings_json TEXT NOT NULL,
      zone_center_lat REAL,
      zone_center_lng REAL,
      zone_radius_m REAL
    )`);
    old.close();

    const migrated = openDb(dbPath);
    const columns = migrated.prepare('PRAGMA table_info(matches)').all() as Array<{ name: string }>;
    assert.ok(columns.some((c) => c.name === 'paused_at'), 'paused_at should be added');
    migrated.close();

    // Opening again must be a no-op rather than a duplicate-column error.
    const reopened = openDb(dbPath);
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
