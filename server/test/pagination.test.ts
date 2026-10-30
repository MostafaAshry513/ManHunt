import assert from 'node:assert/strict';
import test from 'node:test';
import { bearer, createRoom, joinRoom, makeApp, register } from './helpers.ts';
import type { TestApp } from './helpers.ts';

/**
 * Paging contract for GET /api/rooms/:id/messages.
 *
 * The endpoint is additive: no query string keeps the original "newest 50" response
 * (the extra `hasMore` field is ignored by older clients), while `limit`/`before`
 * page backwards from an exclusive id cursor.
 */

type Seeded = Awaited<ReturnType<typeof makeApp>> & {
  alice: { token: string; id: string };
  bob: { token: string; id: string };
  roomId: string;
};

async function seededRoom(chatCount: number): Promise<Seeded> {
  const ctx = await makeApp();
  const alice = await register(ctx.app, 'alice');
  const bob = await register(ctx.app, 'bob');
  const created = await createRoom(ctx.app, alice.token);
  await joinRoom(ctx.app, bob.token, created.room.code);
  const roomId = created.room.id as string;

  const insert = ctx.db.prepare(
    `INSERT INTO messages (room_id, user_id, kind, team, body, created_at)
     VALUES (?, ?, 'chat', NULL, ?, ?)`,
  );
  for (let i = 1; i <= chatCount; i++) {
    insert.run(roomId, alice.id, `m${i}`, 1_000 + i);
  }
  return { ...ctx, alice, bob, roomId };
}

async function getMessages(ctx: TestApp, token: string, roomId: string, query = '') {
  const res = await ctx.app.inject({
    method: 'GET',
    url: `/api/rooms/${roomId}/messages${query}`,
    headers: bearer(token),
  });
  return res;
}

const bodies = (json: { messages: Array<{ body: string }> }) => json.messages.map((m) => m.body);

test('messages without a query keep the newest 50, ascending, and expose hasMore', async () => {
  const ctx = await seededRoom(60);
  const res = await getMessages(ctx, ctx.alice.token, ctx.roomId);
  assert.equal(res.statusCode, 200, res.body);

  const json = res.json() as { messages: Array<{ id: number; body: string }>; hasMore: boolean };
  assert.equal(json.messages.length, 50);
  assert.equal(json.hasMore, true);
  // Ascending id order is the existing client contract.
  for (let i = 1; i < json.messages.length; i++) {
    assert.ok(json.messages[i]!.id > json.messages[i - 1]!.id, 'messages must be ascending');
  }
  // 60 chat rows + 1 "bob joined" system row: the window is m11..m60.
  assert.equal(json.messages[0]!.body, 'm11');
  assert.equal(json.messages.at(-1)!.body, 'm60');
});

test('limit returns the newest page and hasMore reflects remaining messages', async () => {
  const ctx = await seededRoom(25);
  const res = await getMessages(ctx, ctx.alice.token, ctx.roomId, '?limit=10');
  const json = res.json() as { messages: Array<{ body: string }>; hasMore: boolean };

  assert.equal(res.statusCode, 200, res.body);
  assert.equal(json.messages.length, 10);
  assert.equal(json.hasMore, true);
  assert.deepEqual(bodies(json), ['m16', 'm17', 'm18', 'm19', 'm20', 'm21', 'm22', 'm23', 'm24', 'm25']);

  // A limit that exactly covers the history reports no further pages.
  const all = await getMessages(ctx, ctx.alice.token, ctx.roomId, '?limit=200');
  const allJson = all.json() as { messages: unknown[]; hasMore: boolean };
  assert.equal(allJson.messages.length, 26); // 25 chat + 1 join system message
  assert.equal(allJson.hasMore, false);
});

test('limit above the server cap is clamped to 200', async () => {
  const ctx = await seededRoom(240);
  const res = await getMessages(ctx, ctx.alice.token, ctx.roomId, '?limit=1000');
  const json = res.json() as { messages: Array<{ body: string }>; hasMore: boolean };

  assert.equal(res.statusCode, 200, res.body);
  assert.equal(json.messages.length, 200);
  assert.equal(json.hasMore, true);
  assert.equal(json.messages.at(-1)!.body, 'm240');
});

test('before cursor pages backwards with no overlap and stays oldest-to-newest', async () => {
  const ctx = await seededRoom(30);

  const first = await getMessages(ctx, ctx.alice.token, ctx.roomId, '?limit=10');
  const firstPage = (first.json() as { messages: Array<{ id: number; body: string }> }).messages;
  assert.deepEqual(
    firstPage.map((m) => m.body),
    ['m21', 'm22', 'm23', 'm24', 'm25', 'm26', 'm27', 'm28', 'm29', 'm30'],
  );

  const second = await getMessages(
    ctx, ctx.alice.token, ctx.roomId, `?limit=10&before=${firstPage[0]!.id}`,
  );
  const secondPage = (second.json() as { messages: Array<{ id: number; body: string }> }).messages;
  assert.equal(secondPage.length, 10);
  assert.deepEqual(
    secondPage.map((m) => m.body),
    ['m11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19', 'm20'],
  );
  // Exclusive cursor: the overlap id must not repeat, and ordering must remain ascending.
  assert.ok(secondPage.at(-1)!.id < firstPage[0]!.id);
  for (let i = 1; i < secondPage.length; i++) {
    assert.ok(secondPage[i]!.id > secondPage[i - 1]!.id);
  }
});

test('before cursor past the oldest message returns an empty page', async () => {
  const ctx = await seededRoom(5);
  const res = await getMessages(ctx, ctx.alice.token, ctx.roomId, '?limit=10&before=1');
  const json = res.json() as { messages: unknown[]; hasMore: boolean };
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(json.messages, []);
  assert.equal(json.hasMore, false);
});

test('invalid pagination query is rejected with the standard error shape', async () => {
  const ctx = await seededRoom(3);
  for (const query of ['?limit=0', '?limit=abc', '?before=0', '?before=nope']) {
    const res = await getMessages(ctx, ctx.alice.token, ctx.roomId, query);
    assert.equal(res.statusCode, 400, `${query} -> ${res.statusCode} ${res.body}`);
    assert.equal((res.json() as { error: { code: string } }).error.code, 'invalid_body');
  }
});

test('non-members still cannot page the chat', async () => {
  const ctx = await seededRoom(3);
  const mallory = await register(ctx.app, 'mallory');
  const res = await getMessages(ctx, mallory.token, ctx.roomId, '?limit=10');
  assert.equal(res.statusCode, 403);
});
