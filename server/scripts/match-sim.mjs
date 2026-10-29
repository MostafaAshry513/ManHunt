/**
 * Multi-client gameplay simulation against a live server.
 *
 *   node scripts/match-sim.mjs [baseUrl]
 *
 * Exercises the real HTTP + WebSocket stack with three independent players:
 * teams -> ready -> start -> pause/resume -> live location -> tag + confirm ->
 * spectator lockout -> history -> reconnect. Dispute resolution is covered by
 * `npm test` (test/history.test.ts), not by this script.
 */
import WebSocket from 'ws';

const base = process.argv[2] ?? 'http://127.0.0.1:8080';
const suffix = Math.random().toString(36).slice(2, 8);
let checks = 0;

function ok(label) {
  checks += 1;
  console.log(`  ok  ${label}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

async function register(name) {
  const res = await call('POST', '/api/auth/register', { body: { username: name, password: 'password123' } });
  assert(res.status === 200, `register ${name}: ${res.status}`);
  return res.json;
}

function wsConnect(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace('http', 'ws') + `/ws?token=${encodeURIComponent(token)}`);
    const events = [];
    const waiters = [];
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw));
      events.push(msg);
      for (const w of [...waiters]) {
        if (w.match(msg)) {
          waiters.splice(waiters.indexOf(w), 1);
          clearTimeout(w.timer);
          w.resolve(msg);
        }
      }
    });
    ws.on('open', () => resolve({
      ws,
      events,
      wait: (predicate, label, ms = 5000) => new Promise((res, rej) => {
        const hit = events.find(predicate);
        if (hit) return res(hit);
        const timer = setTimeout(() => rej(new Error(`timeout waiting for ${label}`)), ms);
        waiters.push({ match: predicate, resolve: res, timer });
      }),
    }));
    ws.on('error', reject);
  });
}

console.log(`ManHunt match simulation -> ${base}`);

const alice = await register(`alice_${suffix}`);
const bob = await register(`bob_${suffix}`);
const cara = await register(`cara_${suffix}`);
ok('three players registered');

const created = await call('POST', '/api/rooms', { token: alice.token, body: { name: 'Sim Hunt' } });
assert(created.status === 200, 'create room');
const roomId = created.json.room.id;
const code = created.json.room.code;

for (const player of [bob, cara]) {
  const joined = await call('POST', '/api/rooms/join', { token: player.token, body: { code } });
  assert(joined.status === 200, 'join room');
}
ok('room with 3 members');

const patch = await call('PATCH', `/api/rooms/${roomId}/settings`, {
  token: alice.token,
  body: { headStartSec: 0, durationSec: 300, locationIntervalSec: 60, trailsEnabled: true },
});
assert(patch.status === 200, `settings: ${JSON.stringify(patch.json)}`);

for (const player of [bob, cara]) {
  const team = await call('POST', `/api/rooms/${roomId}/team`, { token: player.token, body: { team: 'hunters' } });
  assert(team.status === 200, 'set hunter team');
}
// alice stays prey, so one prey vs two hunters is legal.

for (const player of [alice, bob, cara]) {
  const ready = await call('POST', `/api/rooms/${roomId}/ready`, { token: player.token, body: { ready: true } });
  assert(ready.status === 200, 'ready');
}
ok('teams set and everyone ready');

const hunterWs = await wsConnect(bob.token);
hunterWs.ws.send(JSON.stringify({ type: 'subscribe', roomId }));
await hunterWs.wait((m) => m.type === 'room', 'initial room state');
ok('hunter subscribed over WebSocket');

const started = await call('POST', `/api/rooms/${roomId}/start`, { token: alice.token });
assert(started.status === 200, `start: ${JSON.stringify(started.json)}`);
assert(started.json.match.phase === 'hunting', 'expected hunting with 0s head start');
const matchId = started.json.match.id;
ok('match started (hunting)');

const paused = await call('POST', `/api/rooms/${roomId}/pause`, { token: alice.token });
assert(paused.status === 200, `pause: ${JSON.stringify(paused.json)}`);
assert(paused.json.match.phase === 'paused', 'phase should be paused');

const pausedTag = await call('POST', `/api/rooms/${roomId}/tags`, {
  token: bob.token, body: { preyId: alice.user.id },
});
assert(pausedTag.status === 409, 'tags must be rejected while paused');

await new Promise((r) => setTimeout(r, 1200));
const resumed = await call('POST', `/api/rooms/${roomId}/resume`, { token: alice.token });
assert(resumed.status === 200, `resume: ${JSON.stringify(resumed.json)}`);
assert(resumed.json.match.phase === 'hunting', 'phase should be hunting after resume');
assert(resumed.json.match.endsAt > started.json.match.endsAt, 'resume must extend the end time');
ok('pause/resume preserves remaining time');

const location = await call('POST', `/api/matches/${matchId}/location`, {
  token: alice.token, body: { lat: 51.5007, lng: -0.1246, accuracy: 6 },
});
assert(location.status === 200, `location: ${JSON.stringify(location.json)}`);
await hunterWs.wait((m) => m.type === 'prey_location', 'prey_location push');
ok('hunter received live prey location');

const preyWs = await wsConnect(alice.token);
preyWs.ws.send(JSON.stringify({ type: 'subscribe', roomId }));
await preyWs.wait((m) => m.type === 'room', 'prey room state');

const tag = await call('POST', `/api/rooms/${roomId}/tags`, { token: bob.token, body: { preyId: alice.user.id } });
assert(tag.status === 200, `tag: ${JSON.stringify(tag.json)}`);
const pushed = await preyWs.wait((m) => m.type === 'tag_request', 'tag_request push');
assert(pushed.data.id === tag.json.id, 'same tag id pushed');

const confirm = await call('POST', `/api/tags/${tag.json.id}/confirm`, { token: alice.token });
assert(confirm.status === 200 && confirm.json.status === 'confirmed', 'prey confirms tag');
ok('tag claim delivered and confirmed');

const spectatorReport = await call('POST', `/api/matches/${matchId}/location`, {
  token: alice.token, body: { lat: 51.5, lng: -0.12, accuracy: 5 },
});
assert([403, 409].includes(spectatorReport.status), 'tagged prey must not report');
assert(['spectator', 'no_active_match', 'match_not_running'].includes(spectatorReport.json.error.code), 'expected spectator or match-ended rejection');
ok('tagged prey is locked out of location reporting');

const tag2 = await call('POST', `/api/rooms/${roomId}/tags`, { token: cara.token, body: { preyId: alice.user.id } });
assert(tag2.status === 409, 'cannot tag an eliminated prey');

// There is only one prey (alice) and she is tagged, so the match is already finished.
const finished = await call('GET', `/api/rooms/${roomId}`, { token: bob.token });
assert(finished.json.match.phase === 'finished', 'match should be finished');
assert(finished.json.match.winner === 'hunters', 'hunters should win');
ok('hunters win when every prey is tagged');

const history = await call('GET', `/api/rooms/${roomId}/history`, { token: bob.token });
assert(history.status === 200, 'history status');
const entry = history.json.matches.find((m) => m.id === matchId);
assert(entry, 'finished match present in history');
assert(entry.winner === 'hunters' && entry.cancelled === false, 'history winner correct');
ok('match history persisted');

const summary = await call('GET', `/api/matches/${matchId}`, { token: cara.token });
assert(summary.status === 200 && summary.json.phase === 'finished', 'match summary');

hunterWs.ws.close();
await new Promise((r) => setTimeout(r, 500));
const reconnected = await wsConnect(bob.token);
reconnected.ws.send(JSON.stringify({ type: 'subscribe', roomId }));
const room = await reconnected.wait((m) => m.type === 'room', 'room after reconnect');
assert(room.data.room.id === roomId, 'state restored after reconnect');
ok('WebSocket reconnect restores room state');

const outsider = await call('GET', `/api/rooms/${roomId}`, { token: (await register(`eve_${suffix}`)).token });
assert(outsider.status === 401 || outsider.status === 403, 'outsider must be rejected');
ok('outsider cannot read the room');

reconnected.ws.close();
preyWs.ws.close();

console.log(`\nMATCH SIM PASS (${checks} checks)`);
