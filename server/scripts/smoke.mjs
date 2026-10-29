/**
 * End-to-end smoke test against a running server.
 * Usage: node scripts/smoke.mjs [baseUrl]
 *
 * Proves the real socket path: HTTP auth, room lifecycle, match start,
 * WebSocket subscription and hunter-only location fan-out.
 */
import WebSocket from 'ws';

const base = process.argv[2] ?? 'http://127.0.0.1:8080';
const suffix = Math.random().toString(36).slice(2, 8);
const aliceName = `alice_${suffix}`;
const bobName = `bob_${suffix}`;

function ok(label) {
  console.log(`  ok  ${label}`);
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
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
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
        if (w.type === msg.type) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
      }
    });
    ws.on('open', () => resolve({ ws, events, wait: (type, ms = 5000) => new Promise((res, rej) => {
      const found = events.find((e) => e.type === type);
      if (found) return res(found);
      const t = setTimeout(() => rej(new Error(`timeout waiting for ${type}`)), ms);
      waiters.push({ type, resolve: (m) => { clearTimeout(t); res(m); } });
    }) }));
    ws.on('error', reject);
  });
}

console.log(`ManHunt smoke test -> ${base}`);

const health = await call('GET', '/health');
if (health.status !== 200 || !health.json.ok) throw new Error(`health failed: ${JSON.stringify(health)}`);
ok('health');

const alice = await call('POST', '/api/auth/register', { body: { username: aliceName, password: 'password123' } });
const bob = await call('POST', '/api/auth/register', { body: { username: bobName, password: 'password123' } });
if (alice.status !== 200 || bob.status !== 200) throw new Error('registration failed');
ok('two players registered');

const created = await call('POST', '/api/rooms', { token: alice.json.token, body: { name: 'Smoke Hunt' } });
if (created.status !== 200) throw new Error(`create room failed: ${created.status}`);
const roomId = created.json.room.id;
const code = created.json.room.code;
ok(`room created (code ${code})`);

const joined = await call('POST', '/api/rooms/join', { token: bob.json.token, body: { code } });
if (joined.status !== 200 || joined.json.members.length !== 2) throw new Error('join failed');
ok('second player joined');

const patch = await call('PATCH', `/api/rooms/${roomId}/settings`, {
  token: alice.json.token,
  body: { headStartSec: 0, durationSec: 600 },
});
if (patch.status !== 200) throw new Error(`settings failed: ${patch.status} ${JSON.stringify(patch.json)}`);
ok('settings updated (head start 0s)');

const team = await call('POST', `/api/rooms/${roomId}/team`, { token: bob.json.token, body: { team: 'hunters' } });
if (team.status !== 200) throw new Error('team change failed');
for (const p of [alice, bob]) {
  const r = await call('POST', `/api/rooms/${roomId}/ready`, { token: p.json.token, body: { ready: true } });
  if (r.status !== 200) throw new Error('ready failed');
}
ok('teams set and both ready');

const hunterWs = await wsConnect(bob.json.token);
await hunterWs.ws.send(JSON.stringify({ type: 'subscribe', roomId }));
await hunterWs.wait('room');
ok('hunter subscribed over WebSocket');

const started = await call('POST', `/api/rooms/${roomId}/start`, { token: alice.json.token });
if (started.status !== 200) throw new Error(`start failed: ${started.status} ${JSON.stringify(started.json)}`);
if (started.json.match.phase !== 'hunting') throw new Error(`expected hunting, got ${started.json.match.phase}`);
ok('match started, hunting phase');

const location = await call('POST', `/api/matches/${started.json.match.id}/location`, {
  token: alice.json.token,
  body: { lat: 51.5007, lng: -0.1246, accuracy: 6 },
});
if (location.status !== 200) throw new Error(`location failed: ${location.status}`);
ok('prey location accepted');

const pushed = await hunterWs.wait('prey_location');
if (pushed.data.userId !== alice.json.user.id) throw new Error('wrong prey pushed');
ok('hunter received prey location over WebSocket');

const chat = await call('POST', `/api/rooms/${roomId}/messages`, {
  token: bob.json.token, body: { body: 'moving to the north gate' },
});
if (chat.status !== 200) throw new Error('chat failed');
await hunterWs.wait('chat');
ok('chat delivered in real time');

hunterWs.ws.close();
console.log('\nSMOKE PASS');
