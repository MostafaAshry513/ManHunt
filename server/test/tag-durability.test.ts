import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';
import { PENDING_TAG_TTL_MS } from '../src/rooms.ts';

const HEAD_START_MS = 300_000;

type TestCtx = Awaited<ReturnType<typeof makeApp>>;

/**
 * Two (or three) players in a hunting match: alice = admin + the only prey,
 * bob = hunter, optional dave = second hunter.
 */
async function setupHunting(opts: { dbPath?: string; secondHunter?: boolean } = {}) {
  const ctx = await makeApp(opts.dbPath);
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token, 'Tag Durability');
  const roomId = created.room.id as string;
  const code = created.room.code as string;
  assert.deepEqual(created.pendingTags, [], 'lobby state reports an empty pendingTags list');

  await joinRoom(ctx.app, bob.token, code);

  const dave = opts.secondHunter ? await register(ctx.app, 'dave') : null;
  if (dave) {
    await joinRoom(ctx.app, dave.token, code);
    const team = await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${roomId}/team`, headers: bearer(dave.token), payload: { team: 'hunters' },
    });
    assert.equal(team.statusCode, 200, team.body);
  }

  for (const player of [alice, bob, ...(dave ? [dave] : [])]) {
    const ready = await ctx.app.inject({
      method: 'POST', url: `/api/rooms/${roomId}/ready`, headers: bearer(player.token), payload: { ready: true },
    });
    assert.equal(ready.statusCode, 200, ready.body);
  }

  const start = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${roomId}/start`, headers: bearer(alice.token),
  });
  assert.equal(start.statusCode, 200, start.body);
  const started = start.json() as any;
  assert.deepEqual(started.pendingTags, [], 'no pending tags at kick-off');

  ctx.advance(HEAD_START_MS);
  return { ...ctx, alice, bob, dave, roomId, matchId: started.match.id as string };
}

type Setup = Awaited<ReturnType<typeof setupHunting>>;

async function getState(app: TestCtx['app'], roomId: string, token: string) {
  const res = await app.inject({ method: 'GET', url: `/api/rooms/${roomId}`, headers: bearer(token) });
  assert.equal(res.statusCode, 200, res.body);
  return res.json() as any;
}

async function getMessages(app: TestCtx['app'], roomId: string, token: string) {
  const res = await app.inject({ method: 'GET', url: `/api/rooms/${roomId}/messages`, headers: bearer(token) });
  assert.equal(res.statusCode, 200, res.body);
  return (res.json() as any).messages as Array<{ kind: string; body: string }>;
}

async function requestTag(ctx: Setup, hunterToken: string, preyId: string) {
  const res = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`,
    headers: bearer(hunterToken), payload: { preyId },
  });
  assert.equal(res.statusCode, 200, res.body);
  return res.json() as any;
}

test('a tag claim is replayed in GET room state for prey and hunter', async () => {
  const ctx = await setupHunting();
  const claim = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  // The prey may have missed the `tag_request` socket event (pocketed phone): the claim
  // must still be visible in the state snapshot, which is also what a reconnect uses.
  const preyState = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.equal(preyState.pendingTags.length, 1);
  const pending = preyState.pendingTags[0];
  assert.equal(pending.id, claim.id);
  assert.equal(pending.matchId, ctx.matchId);
  assert.equal(pending.hunterId, ctx.bob.id);
  assert.equal(pending.hunterUsername, 'bob');
  assert.equal(pending.preyId, ctx.alice.id);
  assert.equal(pending.preyUsername, 'alice');
  assert.equal(pending.createdAt, ctx.now());
  assert.equal(pending.expiresAt, ctx.now() + PENDING_TAG_TTL_MS);
  assert.equal(pending.disputed, false, 'a fresh claim is confirmable, not disputed');

  // Hunters/admins see the same claim "awaiting confirmation".
  const hunterState = await getState(ctx.app, ctx.roomId, ctx.bob.token);
  assert.deepEqual(hunterState.pendingTags, preyState.pendingTags);

  // Polling/reconnecting later in the 90 s window replays the same claim, unconsumed.
  ctx.advance(30_000);
  const later = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.equal(later.pendingTags.length, 1);
  assert.equal(later.pendingTags[0].id, claim.id);
  assert.equal(later.pendingTags[0].disputed, false);
});

test('a pending claim survives a server restart (SQLite replay)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'manhunt-tag-'));
  const dbPath = join(dir, 'test.db');
  try {
    const first = await setupHunting({ dbPath });
    const claim = await requestTag(first, first.bob.token, first.alice.id);
    const before = (await getState(first.app, first.roomId, first.alice.token)).pendingTags[0];
    assert.equal(before.id, claim.id);

    await first.app.close();
    first.db.close();

    // New process, same database: the physical tag must not be lost on a restart.
    const second = await makeApp(dbPath);
    try {
      const replay = (await getState(second.app, first.roomId, first.alice.token)).pendingTags;
      assert.equal(replay.length, 1);
      assert.equal(replay[0].id, claim.id);
      assert.equal(replay[0].createdAt, before.createdAt);
      assert.equal(replay[0].expiresAt, before.expiresAt);
      assert.equal(replay[0].disputed, false);

      // Expiry is derived from the persisted created_at, not from in-memory timers.
      const target = before.createdAt + PENDING_TAG_TTL_MS + 1_000;
      second.advance(target - second.now());
      const expired = (await getState(second.app, first.roomId, first.alice.token)).pendingTags;
      assert.equal(expired.length, 1);
      assert.equal(expired[0].id, claim.id);
      assert.equal(expired[0].disputed, true);
    } finally {
      await second.app.close();
      second.db.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a second hunter cannot double-claim a prey with an unresolved claim', async () => {
  const ctx = await setupHunting({ secondHunter: true });
  assert.ok(ctx.dave);
  const first = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  const second = await ctx.app.inject({
    method: 'POST', url: `/api/rooms/${ctx.roomId}/tags`,
    headers: bearer(ctx.dave!.token), payload: { preyId: ctx.alice.id },
  });
  assert.equal(second.statusCode, 409, second.body);
  const error = (second.json() as any).error;
  assert.equal(error.code, 'tag_pending');
  assert.match(error.message, /awaiting/i);

  const count = ctx.db.prepare(
    'SELECT COUNT(*) AS n FROM tags WHERE match_id = ? AND prey_id = ?',
  ).get(ctx.matchId, ctx.alice.id) as { n: number };
  assert.equal(count.n, 1, 'the rejected duplicate must not create a second tag');

  // A retry by the original hunter stays idempotent (pre-existing double-tap behaviour).
  const retry = await requestTag(ctx, ctx.bob.token, ctx.alice.id);
  assert.equal(retry.id, first.id);

  // The rejected duplicate must not break the original claim.
  const confirm = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${first.id}/confirm`, headers: bearer(ctx.alice.token),
  });
  assert.equal(confirm.statusCode, 200, confirm.body);
});

test('an unresolved claim expires after 90 s into a huntmaster dispute with a system message', async () => {
  const ctx = await setupHunting();
  const claim = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  // Still inside the window: confirmable and not disputed.
  ctx.advance(PENDING_TAG_TTL_MS - 1_000);
  let state = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.equal(state.pendingTags.length, 1);
  assert.equal(state.pendingTags[0].disputed, false);

  // One second past the window: lazy evaluation on the state read escalates it.
  ctx.advance(1_001);
  state = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.equal(state.pendingTags.length, 1, 'the disputed claim stays visible for the admin queue');
  assert.equal(state.pendingTags[0].id, claim.id);
  assert.equal(state.pendingTags[0].disputed, true);

  const row = ctx.db.prepare('SELECT status FROM tags WHERE id = ?').get(claim.id) as { status: string };
  assert.equal(row.status, 'disputed', 'expiry reuses the existing dispute state');

  const messages = await getMessages(ctx.app, ctx.roomId, ctx.alice.token);
  const expiryMessages = messages.filter((m) => m.kind === 'system' && /expired/i.test(m.body));
  assert.equal(expiryMessages.length, 1, 'expiry announces itself exactly once');
  assert.match(expiryMessages[0]!.body, /bob/i);
  assert.match(expiryMessages[0]!.body, /alice/i);
  assert.match(expiryMessages[0]!.body, /huntmaster/i);

  // The huntmaster resolves it through the pre-existing admin path.
  const resolve = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${claim.id}/resolve`,
    headers: bearer(ctx.alice.token), payload: { decision: 'rejected' },
  });
  assert.equal(resolve.statusCode, 200, resolve.body);
  assert.equal((resolve.json() as any).status, 'rejected');

  state = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.deepEqual(state.pendingTags, [], 'resolved claims leave the pending queue');
  const preyStillAlive = state.members.find((m: any) => m.userId === ctx.alice.id);
  assert.equal(preyStillAlive.eliminated, false);
});

test('a prey-disputed claim stays in pendingTags as disputed until the admin resolves it', async () => {
  const ctx = await setupHunting();
  const claim = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  const dispute = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${claim.id}/dispute`, headers: bearer(ctx.alice.token),
  });
  assert.equal(dispute.statusCode, 200, dispute.body);

  const state = await getState(ctx.app, ctx.roomId, ctx.bob.token);
  assert.equal(state.pendingTags.length, 1);
  assert.equal(state.pendingTags[0].id, claim.id);
  assert.equal(state.pendingTags[0].disputed, true);

  const resolve = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${claim.id}/resolve`,
    headers: bearer(ctx.alice.token), payload: { decision: 'rejected' },
  });
  assert.equal(resolve.statusCode, 200, resolve.body);
  assert.deepEqual((await getState(ctx.app, ctx.roomId, ctx.bob.token)).pendingTags, []);
});

/**
 * Opens a real WebSocket against a listening test server, authenticates and subscribes,
 * then resolves with the first `room` snapshot matching `predicate`.
 */
async function getRoomSnapshotOverSocket(app: TestCtx['app'], token: string, roomId: string, predicate: (data: any) => boolean) {
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address() as { port: number };
  const ws = new WebSocket(`ws://127.0.0.1:${address.port}/ws?token=${encodeURIComponent(token)}`);
  try {
    return await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for room snapshot')), 5_000);
      ws.addEventListener('message', (event: any) => {
        let msg: any;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (msg.type === 'hello') ws.send(JSON.stringify({ type: 'subscribe', roomId }));
        if (msg.type === 'room' && predicate(msg.data)) {
          clearTimeout(timer);
          resolve(msg.data);
        }
      });
      ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('websocket connection failed'));
      });
    });
  } finally {
    ws.close();
    await app.close();
  }
}

test('a pending claim is replayed in the WebSocket room snapshot on (re)subscribe', async () => {
  const ctx = await setupHunting();
  const claim = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  // A prey who reconnects (fresh socket, missed the live `tag_request`) gets the claim in
  // the `room` snapshot sent on subscribe, so the confirm dialog can be restored.
  const snapshot = await getRoomSnapshotOverSocket(
    ctx.app, ctx.alice.token, ctx.roomId,
    (data) => Array.isArray(data.pendingTags) && data.pendingTags.some((t: any) => t.id === claim.id),
  );
  const pending = snapshot.pendingTags.find((t: any) => t.id === claim.id);
  assert.equal(pending.disputed, false);
  assert.equal(pending.expiresAt, pending.createdAt + PENDING_TAG_TTL_MS);
  assert.equal(pending.hunterUsername, 'bob');
  assert.equal(pending.preyUsername, 'alice');
});

test('confirming the tag that ends the match announces the tag before the result', async () => {
  const ctx = await setupHunting();
  const claim = await requestTag(ctx, ctx.bob.token, ctx.alice.id);

  const confirm = await ctx.app.inject({
    method: 'POST', url: `/api/tags/${claim.id}/confirm`, headers: bearer(ctx.alice.token),
  });
  assert.equal(confirm.statusCode, 200, confirm.body);

  const bodies = (await getMessages(ctx.app, ctx.roomId, ctx.alice.token)).map((m) => m.body);
  const confirmedAt = bodies.indexOf('alice confirmed the tag');
  const matchOverAt = bodies.indexOf('Match over - Hunters win!');
  assert.ok(confirmedAt >= 0, `confirmation message missing: ${JSON.stringify(bodies)}`);
  assert.ok(matchOverAt >= 0, `match-over message missing: ${JSON.stringify(bodies)}`);
  assert.ok(
    confirmedAt < matchOverAt,
    `expected "alice confirmed the tag" before "Match over - Hunters win!" (got ${confirmedAt} vs ${matchOverAt}): ` +
    JSON.stringify(bodies),
  );

  // Back in the lobby, the finished match's claims must not leak into the next match queue.
  const state = await getState(ctx.app, ctx.roomId, ctx.alice.token);
  assert.equal(state.room.status, 'lobby');
  assert.equal(state.match.phase, 'finished');
  assert.deepEqual(state.pendingTags, []);
});
