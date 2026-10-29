import assert from 'node:assert/strict';
import test from 'node:test';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';

async function playToHuntersWin(ctx: Awaited<ReturnType<typeof makeApp>>) {
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;
  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' },
  });
  for (const p of [alice, bob]) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(p.token), payload: { ready: true },
    });
  }
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token),
  });
  assert.equal(start.statusCode, 200, start.body);
  ctx.advance(300_000);

  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/tags`, headers: bearer(bob.token),
    payload: { preyId: alice.id },
  });
  await ctx.app.inject({
    method: 'POST', url: `/api/tags/${(tag.json() as any).id}/confirm`, headers: bearer(alice.token),
  });

  const finished = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${roomId}`, headers: bearer(alice.token),
  });
  assert.equal((finished.json() as any).match.phase, 'finished');
  assert.equal((finished.json() as any).match.winner, 'hunters');
  assert.equal((finished.json() as any).match.preyAlive, 0, 'finished match keeps its outcome');

  return { ...ctx, alice, bob, roomId };
}

test('a room can start a rematch after every prey was tagged', async () => {
  const ctx = await playToHuntersWin(await makeApp());

  // Lobby keeps the previous result visible (tagged players stay marked), but the next
  // match must still be startable; that reset happens atomically in startMatch.
  const lobby = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}`, headers: bearer(ctx.alice.token),
  });
  assert.equal((lobby.json() as any).match.winner, 'hunters');

  for (const p of [ctx.alice, ctx.bob]) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${ctx.roomId}/ready`, headers: bearer(p.token), payload: { ready: true },
    });
  }
  const restart = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  assert.equal(restart.statusCode, 200, restart.body);
  assert.equal((restart.json() as any).match.phase, 'head_start');
});

test('a jump with a non-increasing timestamp is flagged, not silently ignored', async () => {
  const ctx = await playToHuntersWin(await makeApp());
  // Start a fresh match so the prey can report again.
  for (const p of [ctx.alice, ctx.bob]) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${ctx.roomId}/ready`, headers: bearer(p.token), payload: { ready: true },
    });
  }
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  const matchId = (start.json() as any).match.id as string;
  ctx.advance(300_000);

  const t = ctx.now();
  await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(ctx.alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 5, recordedAt: t },
  });
  const jumped = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(ctx.alice.token),
    payload: { lat: 40.0, lng: -3.0, accuracy: 5, recordedAt: t },
  });
  assert.equal(jumped.statusCode, 200);
  assert.equal((jumped.json() as any).flagged, true, 'same-timestamp teleport must be flagged');
});
