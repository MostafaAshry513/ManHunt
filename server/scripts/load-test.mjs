#!/usr/bin/env node
/**
 * ManHunt load test against a running server.
 *
 *   node scripts/load-test.mjs --players 20 --rooms 2
 *   node scripts/load-test.mjs --players 40 --rooms 4 --base http://127.0.0.1:8099
 *
 * --players is PER ROOM (including the room admin). --rooms rooms are driven in
 * parallel. The number of WebSocket clients is the hunters per room.
 *
 * What it does, per room:
 *   admin registers -> room created -> settings headStartSec=0 -> everyone joins
 *   -> teams split 50/50 -> everyone ready -> admin starts -> hunters subscribe
 *   over WebSocket -> every prey posts one location (burst) -> 20 chat messages.
 *
 * It measures p50/p95/max for register, join, ready, start, location POST and
 * chat POST, plus server->socket delivery latency for prey_location, wall time,
 * and client RSS. Any non-2xx response or missing WebSocket event fails the run.
 *
 * Client transport notes:
 *   - /api/auth/register is rate limited to 10 requests/minute per source IP
 *     (app.ts). A load test from a single address would spend its time waiting
 *     on the limiter instead of measuring the server, so each virtual player
 *     gets its own loopback source address (127.0.0.x). This is what a group of
 *     real devices behind distinct addresses looks like to the server.
 *   - Requests use node:http with a keep-alive agent per virtual player so that
 *     a custom local address can be set; global fetch cannot bind a source
 *     address. Global fetch is still used for the health probe.
 *   - Other limits (per-user chat 10/10s, per-user location 20/min) are left
 *     active; the script stays inside them by spreading chat across senders.
 */
import http from 'node:http';
import WebSocket from 'ws';

// Unexpected failures still have to leave a clean exit code and no hanging sockets.
process.on('unhandledRejection', (err) => {
  console.error('FAIL: unhandled rejection');
  console.error(err);
  process.exit(1);
});

// ------------------------------------------------------------------ args

function argValue(name, fallback) {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === `--${name}`) return argv[i + 1];
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return fallback;
}

function intArg(name, fallback, min, max) {
  const raw = argValue(name, String(fallback));
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`--${name} must be an integer in [${min}, ${max}], got "${raw}"`);
  }
  return n;
}

const base = String(argValue('base', 'http://127.0.0.1:8099')).replace(/\/+$/, '');
const playersPerRoom = intArg('players', 20, 2, 50); // MAX_PLAYERS in rooms.ts is 50
const roomCount = intArg('rooms', 2, 1, 50);
const baseUrl = new URL(base);
const wsBase = base.replace(/^http/, 'ws');
const runId = Date.now().toString(36).slice(-5);

const CHAT_MESSAGES_PER_ROOM = 20;
const SETUP_CONCURRENCY = 8;      // per room, for join / team / ready
const REGISTER_CONCURRENCY = 8;   // global; registration hashes on the server
const WS_CONNECT_CONCURRENCY = 8; // per room
const CHAT_CONCURRENCY = 4;       // per room
const REQUEST_TIMEOUT_MS = 20_000;
const EVENT_TIMEOUT_MS = 20_000;

// ------------------------------------------------------------------ stats

const samples = new Map();
function record(name, ms) {
  let list = samples.get(name);
  if (!list) samples.set(name, (list = []));
  list.push(ms);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return NaN;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank - 1))];
}

function summary(list) {
  const sorted = [...list].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return {
    n: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
    mean,
  };
}

function fmt(ms) {
  return ms.toFixed(2);
}

// ------------------------------------------------------------------ http

const agents = new Map();
function agentFor(localAddress) {
  let agent = agents.get(localAddress);
  if (!agent) {
    agent = new http.Agent({ keepAlive: true, localAddress, maxSockets: 2, maxFreeSockets: 2 });
    agents.set(localAddress, agent);
  }
  return agent;
}

function request(method, path, { token, body, localAddress } = {}) {
  return new Promise((resolve) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const started = performance.now();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = http.request({
      hostname: baseUrl.hostname,
      port: baseUrl.port || 80,
      path,
      method,
      agent: agentFor(localAddress ?? '127.0.0.1'),
      headers: {
        ...(payload !== null
          ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) }
          : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error('request timeout')));
    req.on('error', (err) => finish({ ok: false, status: 0, error: err.message, ms: performance.now() - started }));
    req.on('response', (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { text += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* keep raw text out of the report */ }
        finish({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json,
          ms: performance.now() - started,
        });
      });
      res.on('error', (err) => finish({ ok: false, status: 0, error: err.message, ms: performance.now() - started }));
    });
    if (payload !== null) req.write(payload);
    req.end();
  });
}

const failures = [];

/** Records latency for successful calls; any failure is collected and fails the run. */
async function api(label, method, path, opts = {}) {
  const res = await request(method, path, opts);
  if (res.ok) {
    record(label, res.ms);
  } else {
    failures.push(`${label}: ${method} ${path} -> ${res.status} ${res.error ?? JSON.stringify(res.json)}`);
  }
  return res;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(check, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (check()) return;
    if (Date.now() > deadline) throw new Error(`timeout: ${label}`);
    await sleep(10);
  }
}

// ------------------------------------------------------------------ ws

const sockets = [];

/** One WebSocket client with persistent typed handlers and one-shot waiters. */
function openSocket(user) {
  const ws = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(user.token)}`);
  const handlers = [];
  const waiters = [];
  const client = {
    ws,
    user,
    closed: new Promise((resolve) => ws.once('close', resolve)),
    on(type, fn) { handlers.push({ type, fn }); },
    waitFor(type, timeoutMs = EVENT_TIMEOUT_MS) {
      return new Promise((resolve, reject) => {
        const waiter = { type, resolve, reject };
        waiter.timer = setTimeout(() => {
          const at = waiters.indexOf(waiter);
          if (at >= 0) waiters.splice(at, 1);
          reject(new Error(`timeout waiting for ws ${type}`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
  };

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    for (const { type, fn } of [...handlers]) {
      if (type === msg.type) fn(msg);
    }
    for (const waiter of [...waiters]) {
      if (waiter.type !== msg.type) continue;
      waiters.splice(waiters.indexOf(waiter), 1);
      clearTimeout(waiter.timer);
      waiter.resolve(msg);
    }
  });
  ws.on('error', () => { /* surfaced via close/timeouts */ });

  const opened = new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  client.opened = opened;
  sockets.push(client);
  return client;
}

// ------------------------------------------------------------------ setup

const tRunStart = performance.now();
const phases = [];
async function phase(name, fn) {
  const started = performance.now();
  const value = await fn();
  phases.push({ name, ms: performance.now() - started });
  return value;
}

function loopbackFor(index) {
  // 127.0.0.0/8 is loopback; keep away from 127.0.0.1 which the server runs on.
  return `127.0.${Math.floor(index / 250)}.${(index % 250) + 2}`;
}

/** Registers a virtual player. Called once per player, all rooms at once. */
async function registerPlayer(user) {
  const res = await api('register', 'POST', '/api/auth/register', {
    localAddress: user.localAddress,
    body: { username: user.username, password: 'loadtest-pass-123' },
  });
  if (res.ok && res.json?.token) {
    user.token = res.json.token;
    user.userId = res.json.user.id;
  }
  return res;
}

async function setupRoom(room) {
  const admin = room.players[0];

  const created = await api('room_create', 'POST', '/api/rooms', {
    token: admin.token,
    localAddress: admin.localAddress,
    body: { name: `Load ${room.index + 1} ${runId}` },
  });
  if (created.ok) {
    room.roomId = created.json.room.id;
    room.code = created.json.room.code;
  }
  if (!room.roomId) return;

  await api('patch_settings', 'PATCH', `/api/rooms/${room.roomId}/settings`, {
    token: admin.token,
    localAddress: admin.localAddress,
    body: { headStartSec: 0, durationSec: 600 },
  });

  await mapLimit(room.players.slice(1), SETUP_CONCURRENCY, (player) =>
    api('join', 'POST', '/api/rooms/join', {
      token: player.token,
      localAddress: player.localAddress,
      body: { code: room.code },
    }));

  // Split 50/50; the admin (index 0) plays prey.
  await mapLimit(room.players, SETUP_CONCURRENCY, (player, i) => {
    player.team = i % 2 === 0 ? 'prey' : 'hunters';
    return api('team', 'POST', `/api/rooms/${room.roomId}/team`, {
      token: player.token,
      localAddress: player.localAddress,
      body: { team: player.team },
    });
  });

  await mapLimit(room.players, SETUP_CONCURRENCY, (player) =>
    api('ready', 'POST', `/api/rooms/${room.roomId}/ready`, {
      token: player.token,
      localAddress: player.localAddress,
      body: { ready: true },
    }));

  const started = await api('start', 'POST', `/api/rooms/${room.roomId}/start`, {
    token: admin.token,
    localAddress: admin.localAddress,
  });
  if (started.ok) {
    room.matchId = started.json?.match?.id;
    if (started.json?.match?.phase !== 'hunting') {
      failures.push(`room ${room.index + 1}: expected hunting phase, got ${started.json?.match?.phase}`);
    }
  }
}

// ------------------------------------------------------------------ run

const rooms = Array.from({ length: roomCount }, (_, roomIndex) => ({
  index: roomIndex,
  code: null,
  roomId: null,
  matchId: null,
  players: Array.from({ length: playersPerRoom }, (_, playerIndex) => {
    const flatIndex = roomIndex * playersPerRoom + playerIndex;
    return {
      roomIndex,
      index: playerIndex,
      username: `lt_${roomIndex}_${playerIndex}_${runId}`,
      localAddress: loopbackFor(flatIndex),
      token: null,
      userId: null,
      team: null,
      socket: null,
      seenPrey: new Set(),
    };
  }),
}));
const allPlayers = rooms.flatMap((room) => room.players);
const preyPerRoom = Math.ceil(playersPerRoom / 2);

console.log(`ManHunt load test -> ${base}`);
console.log(`  rooms: ${roomCount}   players/room: ${playersPerRoom}   total players: ${allPlayers.length}`);
console.log(`  hunters (WebSocket clients): ${(playersPerRoom - preyPerRoom) * roomCount}   chat messages/room: ${CHAT_MESSAGES_PER_ROOM}\n`);

let health = null;
try {
  const res = await fetch(`${base}/health`);
  health = { status: res.status, json: await res.json() };
} catch (err) {
  health = { status: 0, error: err.message };
}
if (health.status !== 200 || health.json?.ok !== true) {
  console.error(`FAIL: health check -> ${JSON.stringify(health)}`);
  process.exit(1);
}

await phase('register all players', () =>
  mapLimit(allPlayers, REGISTER_CONCURRENCY, registerPlayer));

const registered = allPlayers.filter((p) => p.token && p.userId);
if (registered.length !== allPlayers.length) {
  failures.push(`only ${registered.length}/${allPlayers.length} players registered`);
}

await phase('room setup (create/join/team/ready/start)', () =>
  Promise.all(rooms.map(setupRoom)));

// Match is live (headStartSec 0). Hunters subscribe, then all prey report at once.
const wsLatency = { delivery: [], e2e: [] };
const locationSentAt = new Map(); // prey userId -> Date.now() when the location request was issued

await phase('hunter websocket subscribe', async () => {
  for (const room of rooms) {
    const hunters = room.players.filter((p) => p.team === 'hunters');
    room.hunters = hunters;
    room.preys = room.players.filter((p) => p.team === 'prey');

    await mapLimit(hunters, WS_CONNECT_CONCURRENCY, async (hunter) => {
      const socket = openSocket(hunter);
      hunter.socket = socket;
      try {
        await socket.opened;
        const subscribed = performance.now();
        socket.ws.send(JSON.stringify({ type: 'subscribe', roomId: room.roomId }));
        await socket.waitFor('room');
        record('ws_subscribe', performance.now() - subscribed);

        socket.on('prey_location', (msg) => {
          hunter.locationEvents = (hunter.locationEvents ?? 0) + 1;
          const now = Date.now();
          const preyId = msg.data?.userId;
          const sentAt = locationSentAt.get(preyId);
          const delivery = now - msg.data?.receivedAt;
          if (!Number.isFinite(delivery)) {
            failures.push(`room ${room.index + 1}: malformed prey_location payload ${JSON.stringify(msg).slice(0, 200)}`);
          } else {
            wsLatency.delivery.push(delivery);
          }
          if (sentAt !== undefined) wsLatency.e2e.push(now - sentAt);
          hunter.seenPrey.add(preyId);
        });
      } catch (err) {
        failures.push(`room ${room.index + 1}: hunter ws subscribe failed: ${err.message}`);
      }
    });
  }
});

await phase('location burst', async () => {
  await Promise.all(rooms.map(async (room) => {
    if (!room.matchId) return;
    await Promise.all(room.preys.map(async (prey) => {
      locationSentAt.set(prey.userId, Date.now());
      await api('location', 'POST', `/api/matches/${room.matchId}/location`, {
        token: prey.token,
        localAddress: prey.localAddress,
        body: { lat: 51.5007 + Math.random() * 0.001, lng: -0.1246 + Math.random() * 0.001, accuracy: 6 },
      });
    }));
  }));

  for (const room of rooms) {
    for (const hunter of room.hunters ?? []) {
      try {
        await waitUntil(
          () => room.preys.every((prey) => hunter.seenPrey.has(prey.userId)),
          EVENT_TIMEOUT_MS,
          `room ${room.index + 1}: hunter ${hunter.index} did not receive every prey_location`,
        );
      } catch (err) {
        failures.push(err.message);
      }
      const expected = room.preys.length;
      const actual = hunter.locationEvents ?? 0;
      if (actual !== expected) {
        failures.push(`room ${room.index + 1}: hunter ${hunter.index} received ${actual} prey_location events, expected ${expected}`);
      }
    }
  }
});

await phase('chat burst', async () => {
  await Promise.all(rooms.map((room) => {
    const messages = Array.from({ length: CHAT_MESSAGES_PER_ROOM }, (_, i) => i);
    return mapLimit(messages, CHAT_CONCURRENCY, (i) => {
      const sender = room.players[i % room.players.length];
      return api('chat', 'POST', `/api/rooms/${room.roomId}/messages`, {
        token: sender.token,
        localAddress: sender.localAddress,
        body: { body: `load test message ${i + 1}` },
      });
    });
  }));
});

const totalMs = performance.now() - tRunStart;

// ------------------------------------------------------------------ report

console.log('\nlatency (ms, successful requests only)');
console.log('op'.padEnd(18) + 'n'.padStart(6) + 'p50'.padStart(9) + 'p95'.padStart(9) + 'max'.padStart(9) + 'mean'.padStart(9));
for (const [name, list] of samples) {
  const s = summary(list);
  console.log(name.padEnd(18) + String(s.n).padStart(6) + fmt(s.p50).padStart(9)
    + fmt(s.p95).padStart(9) + fmt(s.max).padStart(9) + fmt(s.mean).padStart(9));
}

console.log('\nWebSocket prey_location delivery (ms)');
console.log('metric'.padEnd(18) + 'n'.padStart(6) + 'p50'.padStart(9) + 'p95'.padStart(9) + 'max'.padStart(9));
for (const [label, list] of [['delivery', wsLatency.delivery], ['end-to-end', wsLatency.e2e]]) {
  if (list.length === 0) { console.log(label.padEnd(18) + String(0).padStart(6)); continue; }
  const s = summary(list);
  console.log(label.padEnd(18) + String(s.n).padStart(6) + fmt(s.p50).padStart(9)
    + fmt(s.p95).padStart(9) + fmt(s.max).padStart(9));
}

console.log('\nwall time');
for (const p of phases) console.log(`  ${p.name.padEnd(44)} ${(p.ms / 1000).toFixed(2)} s`);
console.log(`  ${'total (incl. health check)'.padEnd(44)} ${(totalMs / 1000).toFixed(2)} s`);

const rssMb = process.memoryUsage().rss / 1024 / 1024;
console.log(`  ${'client rss'.padEnd(44)} ${rssMb.toFixed(1)} MB`);
console.log(`  ${'websocket clients'.padEnd(44)} ${sockets.length}`);

// ------------------------------------------------------------------ cleanup

for (const socket of sockets) {
  try { socket.ws.close(); } catch { /* already gone */ }
}
await Promise.race([
  Promise.all(sockets.map((s) => s.closed)),
  sleep(1500),
]);
for (const socket of sockets) {
  try { socket.ws.terminate(); } catch { /* already gone */ }
}
for (const agent of agents.values()) agent.destroy();

if (failures.length > 0) {
  console.error(`\nFAIL (${failures.length} failure(s))`);
  for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`);
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`);
  if (failures.some((failure) => failure.includes('-> 429'))) {
    console.error('\nhint: per-IP rate limits are in memory; restart the server between runs'
      + ' (deleting the database does not reset the register limiter).');
  }
  process.exitCode = 1;
} else {
  console.log('\nLOAD TEST PASS');
  process.exitCode = 0;
}

// Failsafe: every socket and agent is already torn down, but never hang the
// caller if a handle lingers. Unref'd, so it cannot keep the process alive.
setTimeout(() => process.exit(process.exitCode ?? 0), 3000).unref();
