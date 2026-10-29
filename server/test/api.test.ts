import assert from 'node:assert/strict';
import test from 'node:test';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';

async function setupRoom(opts: { settings?: Record<string, unknown> } = {}) {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');

  const created = await createRoom(ctx.app, alice.token, 'Park Run');
  const roomId: string = created.room.id;
  const code: string = created.room.code;

  await joinRoom(ctx.app, bob.token, code);

  if (opts.settings) {
    const res = await ctx.app.inject({
      method: 'PATCH', url: `/api/rooms/${roomId}/settings`, headers: bearer(alice.token), payload: opts.settings,
    });
    assert.equal(res.statusCode, 200, res.body);
  }

  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' },
  });
  for (const p of [alice, bob]) {
    await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(p.token), payload: { ready: true },
    });
  }

  return { ...ctx, alice, bob, roomId, code };
}

test('register, login, me and duplicate username', async () => {
  const ctx = await makeApp();

  const res = await ctx.app.inject({
    method: 'POST', url: '/api/auth/register', payload: { username: 'runner_1', password: 'password123' },
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as { token: string; user: { username: string } };
  assert.ok(body.token.length > 20);
  assert.equal(body.user.username, 'runner_1');

  const dup = await ctx.app.inject({
    method: 'POST', url: '/api/auth/register', payload: { username: 'runner_1', password: 'password123' },
  });
  assert.equal(dup.statusCode, 400);

  const badPw = await ctx.app.inject({
    method: 'POST', url: '/api/auth/login', payload: { username: 'runner_1', password: 'wrong-password' },
  });
  assert.equal(badPw.statusCode, 401);

  const login = await ctx.app.inject({
    method: 'POST', url: '/api/auth/login', payload: { username: 'runner_1', password: 'password123' },
  });
  assert.equal(login.statusCode, 200);

  const me = await ctx.app.inject({ method: 'GET', url: '/api/me', headers: bearer(body.token) });
  assert.equal(me.statusCode, 200);
  assert.equal((me.json() as any).user.username, 'runner_1');

  const anon = await ctx.app.inject({ method: 'GET', url: '/api/me' });
  assert.equal(anon.statusCode, 401);
});

test('create room and join by code', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');

  const created = await createRoom(ctx.app, alice.token, 'Night Hunt');
  assert.equal(created.room.code.length, 6);
  assert.equal(created.room.adminId, alice.id);
  assert.equal(created.members.length, 1);
  assert.equal(created.members[0].team, 'prey');

  const joined = await joinRoom(ctx.app, bob.token, created.room.code.toLowerCase());
  assert.equal(joined.members.length, 2);

  const wrong = await ctx.app.inject({
    method: 'POST', url: '/api/rooms/join', headers: bearer(bob.token), payload: { code: 'ZZZZZZ' },
  });
  assert.equal(wrong.statusCode, 404);
});

test('non-admin cannot start; unready players block the start', async () => {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  const roomId = created.room.id;

  await joinRoom(ctx.app, bob.token, created.room.code);
  await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(bob.token), payload: { team: 'hunters' },
  });

  const nonAdmin = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(bob.token),
  });
  assert.equal(nonAdmin.statusCode, 403);

  const unready = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token),
  });
  assert.equal(unready.statusCode, 409);
  assert.match(unready.body, /not ready/);
});

test('start locks teams and enters head start; the timer advances to hunting', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  assert.equal(start.statusCode, 200, start.body);
  const state = start.json() as any;
  assert.equal(state.match.phase, 'head_start');
  assert.equal(state.room.status, 'active');

  const teamChange = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/team`, headers: bearer(ctx.alice.token), payload: { team: 'hunters' },
  });
  assert.equal(teamChange.statusCode, 409);
  assert.match(teamChange.body, /locked/i);

  ctx.advance(300_000);
  const later = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}`, headers: bearer(ctx.alice.token),
  });
  assert.equal((later.json() as any).match.phase, 'hunting');
});

test('prey reports are visible to hunters only, and only while hunting', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  const matchId = (start.json() as any).match.id as string;

  const report = await ctx.app.inject({
    method: 'POST',
    url: `/api/matches/${matchId}/location`,
    headers: bearer(ctx.alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 8 },
  });
  assert.equal(report.statusCode, 200, report.body);

  const hunterDuringHeadStart = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations`, headers: bearer(ctx.bob.token),
  });
  assert.equal(hunterDuringHeadStart.statusCode, 403);

  ctx.advance(300_000);
  const hunter = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations`, headers: bearer(ctx.bob.token),
  });
  assert.equal(hunter.statusCode, 200, hunter.body);
  const prey = (hunter.json() as any).prey as any[];
  assert.equal(prey.length, 1);
  assert.equal(prey[0].userId, ctx.alice.id);
  assert.equal(prey[0].hasReport, true);
  assert.equal(prey[0].stale, false);

  const preyView = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations`, headers: bearer(ctx.alice.token),
  });
  assert.equal(preyView.statusCode, 403);
});

test('trails setting is enforced server-side', async () => {
  const ctx = await setupRoom({ settings: { trailsEnabled: false } });
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  const matchId = (start.json() as any).match.id as string;
  ctx.advance(300_000);

  await ctx.app.inject({
    method: 'POST', url: `/api/matches/${matchId}/location`, headers: bearer(ctx.alice.token),
    payload: { lat: 51.5, lng: -0.12, accuracy: 10 },
  });

  const history = await ctx.app.inject({
    method: 'GET', url: `/api/matches/${matchId}/locations/${ctx.alice.id}`, headers: bearer(ctx.bob.token),
  });
  assert.equal(history.statusCode, 403);
  assert.match(history.body, /disabled/i);
});

test('tag must be confirmed by the prey, then eliminates and can end the match', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  const matchId = (start.json() as any).match.id as string;
  ctx.advance(300_000);

  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  assert.equal(tag.statusCode, 200, tag.body);
  const tagBody = tag.json() as any;
  assert.equal(tagBody.status, 'pending');

  // Hunters cannot confirm their own claim.
  const wrongConfirm = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagBody.id}/confirm`, headers: bearer(ctx.bob.token),
  });
  assert.equal(wrongConfirm.statusCode, 403);

  const confirm = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagBody.id}/confirm`, headers: bearer(ctx.alice.token),
  });
  assert.equal(confirm.statusCode, 200);

  const state = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}`, headers: bearer(ctx.alice.token),
  });
  const s = state.json() as any;
  assert.equal(s.match.phase, 'finished');
  assert.equal(s.match.winner, 'hunters');
  // The room is back in the lobby, so per-match elimination flags must be cleared.
  assert.equal(s.members.find((m: any) => m.userId === ctx.alice.id).eliminated, false);
});

test('disputed tags require an admin decision', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  ctx.advance(300_000);

  const tag = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  const tagId = (tag.json() as any).id as string;

  const dispute = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagId}/dispute`, headers: bearer(ctx.alice.token),
  });
  assert.equal(dispute.statusCode, 200);
  assert.equal((dispute.json() as any).status, 'disputed');

  const resolve = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${tagId}/resolve`, headers: bearer(ctx.alice.token),
    payload: { decision: 'confirmed' },
  });
  assert.equal(resolve.statusCode, 200);
  assert.equal((resolve.json() as any).status, 'confirmed');
});

test('duplicate tag requests are idempotent', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  ctx.advance(300_000);

  const first = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  const second = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`, headers: bearer(ctx.bob.token),
    payload: { preyId: ctx.alice.id },
  });
  assert.equal((first.json() as any).id, (second.json() as any).id);
});

test('prey win when the match timer expires with prey still alive', async () => {
  const ctx = await setupRoom();
  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/start`, headers: bearer(ctx.alice.token),
  });
  const match = (start.json() as any).match;
  const totalMs = match.endsAt - match.startedAt;

  ctx.advance(totalMs + 1000);
  const state = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}`, headers: bearer(ctx.alice.token),
  });
  const s = state.json() as any;
  assert.equal(s.match.phase, 'finished');
  assert.equal(s.match.winner, 'prey');
  assert.equal(s.room.status, 'lobby');
});

test('chat is stored and returned in order', async () => {
  const ctx = await setupRoom();
  const post = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/messages`, headers: bearer(ctx.alice.token),
    payload: { body: 'Meet at the north gate' },
  });
  assert.equal(post.statusCode, 200);

  const list = await ctx.app.inject({
    method: 'GET', url: `/api/rooms/${ctx.roomId}/messages`, headers: bearer(ctx.bob.token),
  });
  const messages = (list.json() as any).messages as any[];
  assert.ok(messages.some((m) => m.body === 'Meet at the north gate'));
  assert.ok(messages.some((m) => m.kind === 'system'));

  const tooLong = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/messages`, headers: bearer(ctx.alice.token),
    payload: { body: 'x'.repeat(501) },
  });
  assert.equal(tooLong.statusCode, 400);
});

test('state survives a server restart (same database file)', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');

  const dir = mkdtempSync(join(tmpdir(), 'manhunt-'));
  const dbPath = join(dir, 'test.db');

  try {
    const first = await makeApp(dbPath);
    const alice = await register(first.app, 'alice');
    const created = await createRoom(first.app, alice.token, 'Persisted');
    const roomId = created.room.id;
    await first.app.close();
    first.db.close();

    const second = await makeApp(dbPath);
    const state = await second.app.inject({
      method: 'GET', url: `/api/rooms/${roomId}`, headers: bearer(alice.token),
    });
    assert.equal(state.statusCode, 200, state.body);
    assert.equal((state.json() as any).room.name, 'Persisted');
    await second.app.close();
    second.db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
