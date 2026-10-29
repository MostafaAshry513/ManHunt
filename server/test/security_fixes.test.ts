import assert from 'node:assert/strict';
import test from 'node:test';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';
import { canSeePreyLocations } from '../src/rooms.ts';

async function startedMatch() {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${created.room.id}/team`, headers: bearer(bob.token), payload: { team: 'hunters' },
  });
  for (const p of [alice, bob]) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${created.room.id}/ready`, headers: bearer(p.token), payload: { ready: true },
    });
  }
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${created.room.id}/start`, headers: bearer(alice.token),
  });
  ctx.advance(300_000);
  return { ...ctx, alice, bob, roomId: created.room.id, matchId: (start.json() as any).match.id as string };
}

test('location visibility is role-based, never admin-based', () => {
  assert.equal(canSeePreyLocations('hunters'), true);
  assert.equal(canSeePreyLocations('prey'), false);
  assert.equal(canSeePreyLocations(undefined), false);
  assert.equal(canSeePreyLocations(''), false);
});

test('an admin who is prey cannot read locations', async () => {
  const ctx = await startedMatch();
  // alice is the admin AND on the prey team.
  await ctx.app.inject({
    method: 'POST', url: `/api/matches/${ctx.matchId}/location`, headers: bearer(ctx.alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 5 },
  });

  const res = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${ctx.matchId}/locations`, headers: bearer(ctx.alice.token),
  });
  assert.equal(res.statusCode, 403);
});

test('admins cannot skip prey confirmation on a pending tag', async () => {
  const ctx = await startedMatch();
  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  const tagId = (tag.json() as any).id as string;

  const resolve = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagId}/resolve`, headers: bearer(ctx.alice.token),
    payload: { decision: 'confirmed' },
  });
  assert.equal(resolve.statusCode, 409);
  assert.match(resolve.body, /disputed/i);

  // The legitimate path still works.
  const confirm = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagId}/confirm`, headers: bearer(ctx.alice.token),
  });
  assert.equal(confirm.statusCode, 200);
});

test('location retention purge removes only expired reports', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const created = await createRoom(ctx.app, alice.token);
  const state = created as any;
  const roomId = state.room.id as string;

  // A completed match is not required for the purge itself.
  ctx.db.prepare(
    `INSERT INTO matches (id, room_id, status, started_at, head_start_ends_at, ends_at, settings_json)
     VALUES ('m1', ?, 'hunting', 0, 0, 9999999999999, '{}')`,
  ).run(roomId);

  const insert = ctx.db.prepare(
    `INSERT INTO location_reports (match_id, user_id, lat, lng, accuracy, recorded_at, received_at, flagged)
     VALUES ('m1', ?, 1, 1, 5, ?, ?, 0)`,
  );
  insert.run(alice.id, ctx.now() - 40 * 86_400_000, ctx.now() - 40 * 86_400_000); // expired
  insert.run(alice.id, ctx.now() - 1_000, ctx.now() - 1_000); // fresh

  const removed = ctx.rooms.purgeOldLocations(30 * 86_400_000);
  assert.equal(removed, 1);

  const remaining = ctx.db.prepare('SELECT COUNT(*) AS n FROM location_reports').get() as { n: number };
  assert.equal(remaining.n, 1);
});
