import assert from 'node:assert/strict';
import test from 'node:test';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';

test('outsiders cannot read a room or its chat', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const mallory = await register(ctx.app, 'mallory');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;

  const read = await ctx.app.inject({ method: 'GET', url: `/api/rooms/${roomId}`, headers: bearer(mallory.token) });
  assert.ok([401, 403].includes(read.statusCode), `got ${read.statusCode}`);

  const chat = await ctx.app.inject({ method: 'GET', url: `/api/rooms/${roomId}/messages`, headers: bearer(mallory.token) });
  assert.equal(chat.statusCode, 403);

  const write = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/messages`, headers: bearer(mallory.token), payload: { body: 'hi' },
  });
  assert.equal(write.statusCode, 403);
});

test('prey cannot report for someone else or read locations', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;
  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' } });
  for (const p of [alice, bob]) {
    await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(p.token), payload: { ready: true } });
  }
  const start = await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token) });
  const matchId = (start.json() as any).match.id as string;
  ctx.advance(300_000);

  const hunterReport = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(bob.token),
    payload: { lat: 1, lng: 1 },
  });
  assert.equal(hunterReport.statusCode, 403);

  const preyRead = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations`, headers: bearer(alice.token),
  });
  assert.equal(preyRead.statusCode, 403);
});

test('invalid coordinates and implausible timestamps are rejected', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;
  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' } });
  for (const p of [alice, bob]) {
    await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(p.token), payload: { ready: true } });
  }
  const start = await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token) });
  const matchId = (start.json() as any).match.id as string;

  const badCoords = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(alice.token),
    payload: { lat: 999, lng: 0 },
  });
  assert.equal(badCoords.statusCode, 400);

  const badTime = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(alice.token),
    payload: { lat: 51.5, lng: -0.1, recordedAt: ctx.now() - 60 * 60 * 1000 },
  });
  assert.equal(badTime.statusCode, 400);

  const badAccuracy = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(alice.token),
    payload: { lat: 51.5, lng: -0.1, accuracy: 99999 },
  });
  assert.equal(badAccuracy.statusCode, 400);
});

test('teleporting reports are stored but flagged', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;
  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' } });
  for (const p of [alice, bob]) {
    await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(p.token), payload: { ready: true } });
  }
  const start = await ctx.app.inject({ method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token) });
  const matchId = (start.json() as any).match.id as string;
  ctx.advance(300_000);

  const first = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 5, recordedAt: ctx.now() },
  });
  assert.equal(first.statusCode, 200);

  ctx.advance(5_000);
  const far = await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(alice.token),
    payload: { lat: 40.0, lng: -3.0, accuracy: 5, recordedAt: ctx.now() },
  });
  assert.equal(far.statusCode, 200);
  assert.equal((far.json() as any).flagged, true);
});

test('login attempts are rate limited', async () => {
  const ctx = await makeApp();
  await register(ctx.app, 'alice');

  let sawLimit = false;
  for (let i = 0; i < 12; i++) {
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/auth/login', payload: { username: 'alice', password: 'nope-nope' },
    });
    if (res.statusCode === 429) {
      sawLimit = true;
      break;
    }
  }
  assert.equal(sawLimit, true, 'expected a 429 after repeated failures');
});

test('only the admin can change settings or end the match', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;
  await joinRoom(ctx.app, bob.token, created.room.code);

  const settings = await ctx.app.inject({
    method: 'PATCH', url: `/api/rooms/${roomId}/settings`, headers: bearer(bob.token),
    payload: { headStartSec: 60 },
  });
  assert.equal(settings.statusCode, 403);

  const end = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/end`, headers: bearer(bob.token), payload: {},
  });
  assert.equal(end.statusCode, 403);
});

test('an unknown bearer token is rejected', async () => {
  const ctx = await makeApp();
  const res = await ctx.app.inject({
    method: 'GET', url: '/api/me', headers: { authorization: 'Bearer not-a-real-token' },
  });
  assert.equal(res.statusCode, 401);
});
