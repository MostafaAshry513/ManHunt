#!/usr/bin/env node
/**
 * ManHunt premium-screenshot game orchestrator (design/redesign/screenshot-shotlist.md).
 *
 * Drives the real server API to build the shotlist scenario:
 *   "Riverside Run" - Yasmin (host, Prey), Leila (Prey), Omar (capture, Hunter),
 *   Tariq (Hunter), Sara (Hunter). All ready in the lobby; live hunt with 41:12 on the
 *   clock, a fresh Yasmin report + 5-point trail heading north-east, and a 14-minute-old
 *   stale Leila report without a trail. Then tag flows, a Hunters-win result and a
 *   Prey-win rematch result.
 *
 * The Android app is driven separately over adb (scripts/screenshots/capture-premium.sh);
 * this script owns accounts, room, chat, match lifecycle, reports, tags and results.
 *
 * Commands (all take --base and --state; DB-mutating commands need --db-path):
 *   seed                 create users/room/teams/readiness/chat; write state file
 *   presence [--seconds N] hold WebSocket presence for all five players
 *   start-hunt           host starts the match (head start 5 min)
 *   force-hunting        DB: jump the active match from head start to HUNTING immediately
 *   sync-clock           DB: set ends_at so the live clock shows --remaining seconds
 *   set-played           DB: set started_at so the final "played" time is --seconds
 *   report-trails        Yasmin: 5 fresh points (ends 12 s ago); Leila: stale report 14 min ago
 *   tag-prey             hunter tags a prey (--hunter tariq --prey leila [--confirm])
 *   claim-on-yasmin      Tariq claims a tag on Yasmin (pending, Prey view shows the claim)
 *   confirm-claim        Yasmin confirms the pending claim -> eliminated
 *   end-match            host ends the active match
 *   set-ready            set a player's ready flag (--user leila --ready false)
 *   chat                 post one chat line (--user sara --body "...")
 *   chat-clock           DB: re-stamp all chat lines to end at --end HHMM (default 2052)
 *   create-room          create a second empty room (for the empty-chat state)
 *   leave-room           a player leaves the room (--user yasmin)
 *   state                print the room/match summary as JSON
 *   verify --stage ...   assert: lobby | lobby-waiting | hunting | claim | result-hunters | result-prey
 *
 * The state file holds session tokens and must NOT be uploaded as a build artifact.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ---------------------------------------------------------------- shotlist scenario

export const PASSWORD = 'RiversideRun42';
export const APP_USER = 'omar';
export const HOST_USER = 'yasmin';

/** Design shotlist section 2: 2 Prey / 3 Hunters, capture account is Omar (Hunter). */
export const USERS = [
  { key: 'yasmin', username: 'Yasmin', team: 'prey' },
  { key: 'leila', username: 'Leila', team: 'prey' },
  { key: 'omar', username: 'Omar', team: 'hunters' },
  { key: 'tariq', username: 'Tariq', team: 'hunters' },
  { key: 'sara', username: 'Sara', team: 'hunters' },
];

export const ROOM_NAME = 'Riverside Run';

/**
 * Riverside Park, Manhattan: park paths + the Hudson River give the 240 m zone real OSM
 * detail (paths, green, water, street grid) instead of a grey residential blob.
 */
export const ZONE = { centerLat: 40.7995, centerLng: -73.9735, radiusM: 240 };

export const ROOM_SETTINGS = {
  headStartSec: 300,
  durationSec: 3600,
  minPlayers: 2,
  locationIntervalSec: 300,
  trailsEnabled: true,
  mode: 'zone',
  zone: ZONE,
  shrink: { enabled: false, intervalSec: 600, stepM: 50, minRadiusM: 100, warningSec: 30 },
  tagPolicy: 'confirm',
};

/** The live-hunt clock shown on the Board: 41:12 remaining (shotlist S07). */
export const HUNT_REMAINING_SEC = 41 * 60 + 12;

/** The finished match's played time: 18:48 (shotlist S12). 41:12 is remaining, never "played". */
export const HUNT_PLAYED_SEC = 18 * 60 + 48;

/** 6-8 hunt-relevant chat lines (shotlist S11); times are normalised to the capture clock. */
export const CHAT_LINES = [
  { user: 'yasmin', body: "I'm near the north gate." },
  { user: 'omar', body: "Two minutes. I'm crossing the field." },
  { user: 'leila', body: "Take the path by the water, they're on the east side." },
  { user: 'tariq', body: 'I can see the trail heading east.' },
  { user: 'sara', body: 'Trail is clear up to the terrace. Keep moving.' },
  { user: 'yasmin', body: "Copy that. I'll take the lower path." },
];

/**
 * Yasmin: five points heading north-east, 90 s apart, last report 12 s ago (fresh),
 * accuracy ~6 m. Leila: one report 14 minutes ago (stale: staleAfter = 600 s here),
 * accuracy 22 m, no trail. All points are inside the 240 m zone.
 */
export const YASMIN_TRAIL = [
  { lat: 40.7981, lng: -73.9751 },
  { lat: 40.7986, lng: -73.9747 },
  { lat: 40.7991, lng: -73.9742 },
  { lat: 40.7996, lng: -73.9737 },
  { lat: 40.8001, lng: -73.9732 },
];
export const YASMIN_TRAIL_STEP_MS = 90_000;
export const YASMIN_LAST_REPORT_AGE_MS = 12_000;
export const YASMIN_ACCURACY_M = 6;

export const LEILA_STALE_REPORT = { lat: 40.8008, lng: -73.9722 };
export const LEILA_STALE_AGE_MS = 14 * 60_000;
export const LEILA_ACCURACY_M = 22;

/** The capture phone's own position (emulator geo fix): inside the zone, east of centre. */
export const APP_USER_LOCATION = { lat: 40.799, lng: -73.9725 };

// ---------------------------------------------------------------- CLI plumbing

const argv = process.argv.slice(2);
const command = argv[0] ?? 'help';

function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  // Bare flags (`--confirm` followed by another `--flag`) fall back to their default.
  return value !== undefined && !value.startsWith('--') ? value : fallback;
}

const base = String(arg('base', process.env.MANHUNT_BASE ?? 'http://127.0.0.1:8080')).replace(/\/+$/, '');
const statePath = resolve(arg('state', process.env.MANHUNT_STATE ?? '.runtime/premium-state.json'));
const databasePath = arg('db-path', '');

const log = (...parts) => console.log('[game]', ...parts);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function readState() {
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    throw new Error(`No state file at ${statePath}; run the seed command first.`);
  }
}

function writeState(state) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function api(method, path, token, body) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const message = parsed?.error?.message ?? text.slice(0, 300);
    const error = new Error(`${method} ${path} -> HTTP ${response.status}: ${message}`);
    error.status = response.status;
    error.code = parsed?.error?.code;
    throw error;
  }
  return parsed;
}

function user(state, key) {
  const found = state.users[key];
  if (!found?.token) throw new Error(`State has no token for ${key}`);
  return found;
}

function requireDb() {
  if (!databasePath) throw new Error('This command needs --db-path pointing at the isolated server DB.');
  return databasePath;
}

async function withDb(fn) {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(requireDb());
  db.exec('PRAGMA busy_timeout = 5000');
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

async function roomState(state, as = HOST_USER) {
  return api('GET', `/api/rooms/${state.roomId}`, user(state, as).token);
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
  log(`ok - ${message}`);
}

/** Fixed capture-clock date: today's UTC date at 20:52, used to normalise visible chat times. */
function captureClockBase(hour = 20, minute = 52) {
  const now = new Date();
  return { base: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0) };
}

// ---------------------------------------------------------------- chat timing

/**
 * Re-stamp the player chat lines into a fixed window ending at the status-bar clock
 * (21:04) so the Chat screenshot reads as one coherent moment. Newest line = 21:04.
 */
async function applyChatClockTo(db, roomId, endHour = 20, endMinute = 52) {
  const rows = db.prepare("SELECT id FROM messages WHERE room_id = ? AND kind = 'chat' ORDER BY id").all(roomId);
  if (rows.length === 0) return 0;
  const { base } = captureClockBase(endHour, endMinute);
  const start = base - (rows.length - 1) * 60_000;
  const update = db.prepare('UPDATE messages SET created_at = ? WHERE id = ?');
  rows.forEach((row, index) => update.run(start + index * 60_000, row.id));
  return rows.length;
}

async function commandChatClock() {
  const state = readState();
  const end = String(arg('end', '2052')).padStart(4, '0');
  const count = await withDb((db) => applyChatClockTo(db, state.roomId, Number(end.slice(0, 2)), Number(end.slice(2))));
  log(`chat clock: ${count} lines stamped up to ${end.slice(0, 2)}:${end.slice(2)} UTC`);
}

/**
 * Remove capture-only chat noise (the clock-refresh trigger lines posted while waiting for map
 * tiles) so the S11 field log reads like a real hunt conversation. Matches by body substring.
 */
async function commandPruneChat() {
  const state = readState();
  const needle = arg('body-contains', 'Clock is running');
  const removed = await withDb((db) =>
    db.prepare('DELETE FROM messages WHERE room_id = ? AND body LIKE ?').run(state.roomId, `%${needle}%`).changes,
  );
  log(`pruned ${removed} chat line(s) matching "${needle}"`);
}

// ---------------------------------------------------------------- commands

async function commandSeed() {
  const state = {
    base,
    createdAt: Date.now(),
    roomId: null,
    roomCode: null,
    roomName: ROOM_NAME,
    matchId: null,
    claimTagId: null,
    extraRoomId: null,
    extraRoomCode: null,
    users: {},
  };

  for (const spec of USERS) {
    let auth;
    try {
      auth = await api('POST', '/api/auth/register', null, { username: spec.username, password: PASSWORD });
    } catch (error) {
      if (error.status !== 400 || !/already taken/i.test(error.message)) throw error;
      auth = await api('POST', '/api/auth/login', null, { username: spec.username, password: PASSWORD });
    }
    state.users[spec.key] = {
      id: auth.user.id,
      username: auth.user.username,
      token: auth.token,
      team: spec.team,
      password: PASSWORD,
    };
  }
  log(`accounts: ${USERS.map((u) => u.username).join(', ')}`);

  // Host Yasmin creates the room; rules match the shotlist (5 min head start, 60 min hunt,
  // 5 min reports, trails on, 240 m zone, no shrink).
  const created = await api('POST', '/api/rooms', state.users[HOST_USER].token, { name: ROOM_NAME });
  state.roomId = created.room.id;
  state.roomCode = created.room.code;
  log(`room "${created.room.name}" code ${created.room.code}`);
  await api('PATCH', `/api/rooms/${state.roomId}/settings`, state.users[HOST_USER].token, ROOM_SETTINGS);

  for (const spec of USERS.filter((u) => u.key !== HOST_USER)) {
    await api('POST', '/api/rooms/join', state.users[spec.key].token, { code: state.roomCode });
    await sleep(120);
  }
  for (const spec of USERS) {
    await api('POST', `/api/rooms/${state.roomId}/team`, state.users[spec.key].token, { team: spec.team });
  }
  for (const spec of USERS) {
    await api('POST', `/api/rooms/${state.roomId}/ready`, state.users[spec.key].token, { ready: true });
  }
  for (const line of CHAT_LINES) {
    await api('POST', `/api/rooms/${state.roomId}/messages`, state.users[line.user].token, { body: line.body });
    await sleep(350);
  }
  if (databasePath) {
    const count = await withDb((db) => applyChatClockTo(db, state.roomId));
    log(`chat clock: ${count} lines stamped up to 20:52 UTC`);
  }

  writeState(state);
  log(`seed written to ${statePath}`);
  console.log(
    JSON.stringify({
      roomCode: state.roomCode,
      roomId: state.roomId,
      users: Object.fromEntries(Object.entries(state.users).map(([key, value]) => [key, value.username])),
    }),
  );
}

/**
 * Hold a WebSocket for every seeded player, including the capture account: a real open
 * socket is genuine presence, and it keeps real-looking teammates (and the app user while
 * switching accounts) from being labelled "Offline" in the captured roster.
 */
async function commandPresence() {
  const state = readState();
  const seconds = Number(arg('seconds', '0'));
  const sockets = [];

  for (const spec of USERS) {
    const token = user(state, spec.key).token;
    const url = `${base.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
    await new Promise((resolvePromise, rejectPromise) => {
      const socket = new WebSocket(url);
      sockets.push(socket);
      const timer = setTimeout(() => rejectPromise(new Error(`presence socket for ${spec.key} timed out`)), 15_000);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        socket.send(JSON.stringify({ type: 'subscribe', roomId: state.roomId }));
        log(`presence: ${spec.username} subscribed`);
        resolvePromise();
      });
      socket.addEventListener('error', () => {
        clearTimeout(timer);
        rejectPromise(new Error(`presence socket for ${spec.key} failed`));
      });
    });
    await sleep(100);
  }

  const keepAlive = setInterval(() => {
    for (const socket of sockets) {
      if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'ping' }));
    }
  }, 20_000);

  const stop = () => {
    clearInterval(keepAlive);
    for (const socket of sockets) {
      try {
        socket.close();
      } catch {
        // already closed
      }
    }
    log('presence stopped');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  if (seconds > 0) {
    await sleep(seconds * 1000);
    stop();
  } else {
    log('presence: holding connections until terminated');
    await new Promise(() => {});
  }
}

async function commandStartHunt() {
  const state = readState();
  const response = await api('POST', `/api/rooms/${state.roomId}/start`, user(state, HOST_USER).token);
  state.matchId = response.match?.id ?? state.matchId;
  writeState(state);
  const current = await roomState(state);
  assert(current.match?.phase === 'head_start', `match started in head start (phase=${current.match?.phase})`);
  assert(current.room.settings.zone?.radiusM === ZONE.radiusM, 'zone radius is 240 m');
  log(`match ${state.matchId} started; head start ends ${new Date(current.match.headStartEndsAt).toISOString()}`);
}

/** Jump the active match to HUNTING without waiting the 5-minute head start. */
async function commandForceHunting() {
  const state = readState();
  await withDb((db) => {
    const match = db
      .prepare("SELECT id FROM matches WHERE room_id = ? AND status IN ('head_start','hunting') ORDER BY started_at DESC LIMIT 1")
      .get(state.roomId);
    if (!match) throw new Error('No active match to force into hunting.');
    const now = Date.now();
    db.prepare("UPDATE matches SET status = 'hunting', head_start_ends_at = ?, ends_at = ? WHERE id = ?").run(
      now - 60_000,
      now + HUNT_REMAINING_SEC * 1000,
      match.id,
    );
    state.matchId = match.id;
  });
  writeState(state);
  // Any room read reconciles the phase and broadcasts it to the app over the socket.
  const current = await roomState(state);
  assert(current.match?.phase === 'hunting', `match phase jumped to hunting (phase=${current.match?.phase})`);
  log(`hunting; ends at ${new Date(current.match.endsAt).toISOString()}`);
}

/** Freeze the match timeline at the shotlist moment: 41:12 remaining, 18:48 played. */
async function commandSyncClock() {
  const state = readState();
  const remaining = Number(arg('remaining', String(HUNT_REMAINING_SEC)));
  const triggerUser = arg('trigger-user', '');
  const now = Date.now();
  const startedAt = now - HUNT_PLAYED_SEC * 1000;
  await withDb((db) => {
    // started_at / head_start_ends_at / ends_at are kept consistent so the derived
    // "played" duration is exactly 18:48 while the live clock shows 41:12 remaining.
    db.prepare(
      'UPDATE matches SET started_at = ?, head_start_ends_at = ?, ends_at = ? WHERE id = ?',
    ).run(startedAt, startedAt + 300_000, now + remaining * 1000, state.matchId);
  });
  if (triggerUser) {
    // A peer chat line broadcasts, which makes the app refetch room state + countdown.
    const body = arg('trigger-body', 'Clock is running. Stay sharp.');
    await api('POST', `/api/rooms/${state.roomId}/messages`, user(state, triggerUser).token, { body });
  }
  log(`clock synced: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} remaining`);
}

/** Make the finished match's "played" time equal --seconds (default 18:48). */
async function commandSetPlayed() {
  const state = readState();
  const seconds = Number(arg('seconds', String(HUNT_PLAYED_SEC)));
  // Once the match is finished the result Board derives its "played" clock from the match
  // timeline; a stale planned ends_at renders a full-hour duration. --sync-ends keeps
  // started_at/ends_at exactly `seconds` apart so the finished board reads 18:48.
  const syncEnds = argv.includes('--sync-ends');
  const now = Date.now();
  const startedAt = now - seconds * 1000;
  await withDb((db) => {
    if (syncEnds) {
      db.prepare('UPDATE matches SET started_at = ?, ends_at = ? WHERE id = ?').run(
        startedAt,
        startedAt + seconds * 1000,
        state.matchId,
      );
    } else {
      db.prepare('UPDATE matches SET started_at = ? WHERE id = ?').run(startedAt, state.matchId);
    }
  });
  log(`played time set to ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  // A peer chat line broadcasts a room-state refresh, so an already-open result page updates.
  const triggerUser = arg('trigger-user', '');
  if (triggerUser) {
    const body = arg('trigger-body', 'Good hunt.');
    await api('POST', `/api/rooms/${state.roomId}/messages`, user(state, triggerUser).token, { body });
  }
}

async function commandReportTrails() {
  const state = readState();
  const now = Date.now();

  // Yasmin: fresh 5-point trail heading north-east, last report 12 s ago.
  const yasmin = user(state, 'yasmin');
  for (let index = 0; index < YASMIN_TRAIL.length; index += 1) {
    const point = YASMIN_TRAIL[index];
    const age = YASMIN_LAST_REPORT_AGE_MS + (YASMIN_TRAIL.length - 1 - index) * YASMIN_TRAIL_STEP_MS;
    const result = await api('POST', `/api/matches/${state.matchId}/location`, yasmin.token, {
      lat: point.lat,
      lng: point.lng,
      accuracy: YASMIN_ACCURACY_M,
      recordedAt: now - age,
    });
    if (result.flagged) throw new Error('Yasmin report was flagged by the server speed check');
  }
  log(`trails: Yasmin -> ${YASMIN_TRAIL.length} reports (fresh, ${YASMIN_LAST_REPORT_AGE_MS / 1000} s old)`);

  // Leila: one stale report 14 minutes ago, no trail.
  const leila = user(state, 'leila');
  const stale = await api('POST', `/api/matches/${state.matchId}/location`, leila.token, {
    lat: LEILA_STALE_REPORT.lat,
    lng: LEILA_STALE_REPORT.lng,
    accuracy: LEILA_ACCURACY_M,
    recordedAt: now - LEILA_STALE_AGE_MS,
  });
  if (stale.flagged) throw new Error('Leila report was flagged by the server speed check');
  log('trails: Leila -> 1 stale report (14 min old, no trail)');
}

async function commandTagPrey() {
  const state = readState();
  const hunterKey = arg('hunter', 'tariq');
  const preyKey = arg('prey', 'leila');
  const confirm = arg('confirm', 'true') === 'true';
  const tag = await api('POST', `/api/rooms/${state.roomId}/tags`, user(state, hunterKey).token, {
    preyId: user(state, preyKey).id,
  });
  if (confirm) await api('POST', `/api/tags/${tag.id}/confirm`, user(state, preyKey).token);
  log(`${user(state, hunterKey).username} tagged ${user(state, preyKey).username}${confirm ? ' (confirmed)' : ' (pending)'}`);
  writeState(state);
}

async function commandClaimOnYasmin() {
  const state = readState();
  const tag = await api('POST', `/api/rooms/${state.roomId}/tags`, user(state, 'tariq').token, {
    preyId: user(state, 'yasmin').id,
  });
  state.claimTagId = tag.id;
  writeState(state);
  log(`claim: Tariq claims a tag on Yasmin (tag ${tag.id})`);
}

async function commandConfirmClaim() {
  const state = readState();
  if (!state.claimTagId) throw new Error('Run claim-on-yasmin first.');
  await api('POST', `/api/tags/${state.claimTagId}/confirm`, user(state, 'yasmin').token);
  log('claim confirmed by Yasmin');
}

async function commandEndMatch() {
  const state = readState();
  await api('POST', `/api/rooms/${state.roomId}/end`, user(state, HOST_USER).token, {
    cancelled: arg('cancelled', 'false') === 'true',
  });
  log('match ended by the host');
}

async function commandSetReady() {
  const state = readState();
  const key = arg('user', 'leila');
  const ready = arg('ready', 'false') === 'true';
  await api('POST', `/api/rooms/${state.roomId}/ready`, user(state, key).token, { ready });
  log(`${user(state, key).username} ready=${ready}`);
}

async function commandRematchReady() {
  const state = readState();
  for (const spec of USERS) {
    await api('POST', `/api/rooms/${state.roomId}/ready`, user(state, spec.key).token, { ready: true });
  }
  log('all five players ready for the next match');
}

async function commandChat() {
  const state = readState();
  const key = arg('user', 'sara');
  const body = arg('body', '');
  if (!body) throw new Error('--body is required');
  await api('POST', `/api/rooms/${state.roomId}/messages`, user(state, key).token, { body });
  log(`chat: ${user(state, key).username}: ${body}`);
}

async function commandCreateRoom() {
  const state = readState();
  const owner = arg('user', APP_USER);
  const name = arg('name', ROOM_NAME);
  const created = await api('POST', '/api/rooms', user(state, owner).token, { name });
  state.extraRoomId = created.room.id;
  state.extraRoomCode = created.room.code;
  writeState(state);
  console.log(JSON.stringify({ extraRoomId: created.room.id, extraRoomCode: created.room.code }));
}

async function commandLeaveRoom() {
  const state = readState();
  const key = arg('user', HOST_USER);
  await api('POST', `/api/rooms/${state.roomId}/leave`, user(state, key).token);
  log(`${user(state, key).username} left the room`);
}

async function commandState() {
  const state = readState();
  const current = await roomState(state);
  const summary = {
    room: { name: current.room.name, code: current.room.code, status: current.room.status, settings: current.room.settings },
    members: current.members.map((member) => ({
      username: member.username,
      team: member.team,
      ready: member.ready,
      connected: member.connected,
      eliminated: member.eliminated,
      isAdmin: member.isAdmin,
    })),
    match: current.match
      ? {
          id: current.match.id,
          phase: current.match.phase,
          winner: current.match.winner,
          preyAlive: current.match.preyAlive,
          preyTotal: current.match.preyTotal,
          zone: current.match.zone,
        }
      : null,
    pendingTags: current.pendingTags,
  };
  console.log(JSON.stringify(summary, null, 2));
}

// ---------------------------------------------------------------- verification

async function commandVerify() {
  const stage = arg('stage', 'lobby');
  const state = readState();
  const current = await roomState(state);
  const members = current.members;
  const byName = Object.fromEntries(members.map((member) => [member.username, member]));

  if (stage === 'lobby' || stage === 'lobby-waiting') {
    assert(current.room.name === ROOM_NAME, `room is named "${ROOM_NAME}"`);
    assert(current.room.status === 'lobby', 'room is in the lobby');
    assert(members.length === 5, 'five players in the roster');
    assert(members.filter((member) => member.team === 'prey').length === 2, 'two Prey');
    assert(members.filter((member) => member.team === 'hunters').length === 3, 'three Hunters');
    assert(byName.Yasmin?.isAdmin === true, 'Yasmin is the host');
    assert(current.room.settings.zone?.radiusM === ZONE.radiusM, 'zone radius is 240 m');
    assert(current.room.settings.headStartSec === 300, 'head start is 5 minutes');
    assert(current.room.settings.locationIntervalSec === 300, 'report interval is 5 minutes');
    assert(current.room.settings.trailsEnabled === true, 'trails are enabled');
    const peers = members.filter((member) => member.username !== APP_USER_NAME());
    assert(peers.every((member) => member.connected), 'the other four players show as connected');
    if (stage === 'lobby-waiting') {
      assert(byName.Leila?.ready === false, 'Leila is not ready (waiting state)');
    } else {
      assert(members.every((member) => member.ready), 'all five players are ready');
    }
    const chat = await api('GET', `/api/rooms/${state.roomId}/messages`, user(state, HOST_USER).token);
    const authored = chat.messages.filter((message) => message.kind === 'chat');
    assert(authored.length >= CHAT_LINES.length, `chat has ${authored.length} player lines`);
    const authors = new Set(authored.map((message) => message.username));
    assert(
      ['Yasmin', 'Leila', 'Omar', 'Tariq', 'Sara'].every((name) => authors.has(name)),
      'chat includes all five players',
    );
    if (databasePath) {
      const { DatabaseSync } = await import('node:sqlite');
      const db = new DatabaseSync(databasePath);
      const rows = db.prepare("SELECT created_at FROM messages WHERE room_id = ? AND kind = 'chat' ORDER BY id").all(state.roomId);
      db.close();
      const { base: end } = captureClockBase(20, 52);
      const start = end - (rows.length - 1) * 60_000;
      assert(
        rows.every((row, index) => row.created_at === start + index * 60_000),
        `chat clock: ${rows.length} player lines stamped up to 20:52 UTC`,
      );
    }
  }

  if (stage === 'hunting') {
    assert(current.room.status === 'active', 'room is active');
    assert(current.match?.phase === 'hunting', 'match phase is hunting');
    assert(current.match?.preyAlive === 2 && current.match?.preyTotal === 2, 'both Prey are alive');
    assert(current.match?.zone?.radiusM === ZONE.radiusM, 'zone ring is 240 m');
    const locations = await api('GET', `/api/matches/${state.matchId}/locations`, user(state, 'omar').token);
    const yasmin = locations.prey.find((prey) => prey.username === 'Yasmin');
    const leila = locations.prey.find((prey) => prey.username === 'Leila');
    assert(!!yasmin && yasmin.hasReport && yasmin.stale === false, 'Yasmin has a fresh report');
    assert(!!leila && leila.hasReport && leila.stale === true, 'Leila has a stale report');
    const trail = await api('GET', `/api/matches/${state.matchId}/locations/${yasmin.userId}`, user(state, 'omar').token);
    assert(trail.points.length === YASMIN_TRAIL.length, `Yasmin has a ${trail.points.length}-point trail`);
    const leilaTrail = await api('GET', `/api/matches/${state.matchId}/locations/${leila.userId}`, user(state, 'omar').token);
    assert(leilaTrail.points.length === 1, 'Leila has no trail (single stale report)');
    const remaining = Math.round((current.match.endsAt - current.match.now) / 1000);
    assert(
      remaining > HUNT_REMAINING_SEC - 30 && remaining <= HUNT_REMAINING_SEC,
      `live clock is about 41:12 (${remaining} s remaining)`,
    );
    const played = Math.round((current.match.now - current.match.startedAt) / 1000);
    assert(
      played >= HUNT_PLAYED_SEC - 30 && played <= HUNT_PLAYED_SEC + 30,
      `played time is about 18:48 (${played} s elapsed)`,
    );
  }

  if (stage === 'claim') {
    const pending = (current.pendingTags ?? []).filter((tag) => !tag.disputed);
    assert(pending.length === 1, 'one tag claim is waiting for the Prey player');
    assert(pending[0].hunterUsername === 'Tariq', 'the claim is from Tariq');
    assert(pending[0].preyUsername === 'Yasmin', 'the claim is about Yasmin');
  }

  if (stage === 'result-hunters' || stage === 'result-prey') {
    assert(current.room.status === 'lobby', 'room is back in the lobby');
    assert(current.match?.phase === 'finished', 'match is finished');
    if (stage === 'result-hunters') {
      assert(current.match?.winner === 'hunters', 'Hunters won the match');
      assert(current.match?.preyAlive === 0, 'all Prey were tagged');
    } else {
      assert(current.match?.winner === 'prey', 'Prey won the match');
      // A finished match reports its prey summary as the total roster (the server resets
      // eliminations on finish), so the app shows a Prey-win survival total, not a partial count.
      assert(current.match?.preyAlive === current.match?.preyTotal, 'Prey survival summary is consistent');
    }
  }

  log(`verify ${stage}: PASS`);
}

function APP_USER_NAME() {
  return USERS.find((spec) => spec.key === APP_USER)?.username ?? 'Omar';
}

// ---------------------------------------------------------------- main

const commands = {
  seed: commandSeed,
  presence: commandPresence,
  'start-hunt': commandStartHunt,
  'force-hunting': commandForceHunting,
  'sync-clock': commandSyncClock,
  'set-played': commandSetPlayed,
  'report-trails': commandReportTrails,
  'tag-prey': commandTagPrey,
  'claim-on-yasmin': commandClaimOnYasmin,
  'confirm-claim': commandConfirmClaim,
  'end-match': commandEndMatch,
  'set-ready': commandSetReady,
  'rematch-ready': commandRematchReady,
  chat: commandChat,
  'chat-clock': commandChatClock,
  'prune-chat': commandPruneChat,
  'create-room': commandCreateRoom,
  'leave-room': commandLeaveRoom,
  state: commandState,
  verify: commandVerify,
};

const handler = commands[command];
if (!handler) {
  console.error(`Unknown command "${command}". Known: ${Object.keys(commands).join(', ')}`);
  console.error('Usage: node game-control.mjs <command> --base http://127.0.0.1:8080 --state /tmp/state.json [--db-path /tmp/db]');
  process.exit(2);
}

handler()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[game] FAILED: ${error.stack ?? error.message}`);
    process.exit(1);
  });
