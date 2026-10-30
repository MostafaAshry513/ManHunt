import type { DatabaseSync } from 'node:sqlite';
import { randomInt } from 'node:crypto';
import { all, get, run, tx } from './db.ts';
import { newId } from './auth.ts';
import { badRequest, conflict, forbidden, notFound } from './errors.ts';
import { computedPhase, canStart, DEFAULT_SETTINGS, mergeSettings, parseSettings, winnerFor } from './domain/match.ts';
import type { MatchRow, Phase, Settings, Team } from './domain/types.ts';
import { haversineMeters, impliedSpeedMps, isFiniteCoord } from './domain/geo.ts';
import type { Hub } from './realtime.ts';

type RoomRow = {
  id: string;
  code: string;
  name: string;
  admin_id: string;
  status: 'lobby' | 'active' | 'closed';
  settings_json: string;
  created_at: number;
  closed_at: number | null;
};

type MemberRow = {
  room_id: string;
  user_id: string;
  username: string;
  team: Team;
  is_ready: number;
  eliminated: number;
  joined_at: number;
};

export type MemberView = {
  userId: string;
  username: string;
  team: Team;
  ready: boolean;
  connected: boolean;
  eliminated: boolean;
  isAdmin: boolean;
};

export type MatchView = {
  id: string;
  phase: Phase;
  status: Phase;
  startedAt: number;
  headStartEndsAt: number;
  endsAt: number;
  now: number;
  winner: 'prey' | 'hunters' | null;
  preyAlive: number;
  preyTotal: number;
  zone: { centerLat: number; centerLng: number; radiusM: number; nextShrinkAt: number | null } | null;
};

/**
 * A tag claim of the current match that is not resolved yet. `disputed === false` means
 * the prey can still confirm/deny it (the countdown to `expiresAt` is running);
 * `disputed === true` means it already became a huntmaster dispute (either the prey
 * disputed it or the confirmation window expired) and waits for an admin decision.
 */
export type PendingTagView = {
  id: string;
  matchId: string;
  hunterId: string;
  hunterUsername: string;
  preyId: string;
  preyUsername: string;
  createdAt: number;
  expiresAt: number;
  disputed: boolean;
};

const TAG_IDEMPOTENCY_MS = 60_000;
/**
 * How long an unresolved tag claim waits for the prey before it becomes a huntmaster
 * dispute. Kept short on purpose: a pocketed phone must not swallow a real-world tag.
 */
export const PENDING_TAG_TTL_MS = 90_000;
const MAX_PLAYERS = 50;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class RoomService {
  private readonly db: DatabaseSync;
  private readonly hub: Hub;
  private readonly clock: () => number;

  constructor(db: DatabaseSync, hub: Hub, clock: () => number = () => Date.now()) {
    this.db = db;
    this.hub = hub;
    this.clock = clock;
  }

  private now(): number {
    return this.clock();
  }

  // ---------------------------------------------------------------- rooms

  createRoom(userId: string, name: string): unknown {
    const now = this.now();
    const cleanName = name.trim().slice(0, 60);
    if (cleanName.length < 2) throw badRequest('Room name is too short', 'invalid_name');

    const room: RoomRow = {
      id: newId('room'),
      code: this.uniqueCode(),
      name: cleanName,
      admin_id: userId,
      status: 'lobby',
      settings_json: JSON.stringify(DEFAULT_SETTINGS),
      created_at: now,
      closed_at: null,
    };

    tx(this.db, () => {
      run(this.db,
        `INSERT INTO rooms (id, code, name, admin_id, status, settings_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        room.id, room.code, room.name, room.admin_id, room.status, room.settings_json, room.created_at);
      run(this.db,
        `INSERT INTO room_members (room_id, user_id, team, is_ready, eliminated, joined_at, last_seen_at)
         VALUES (?, ?, 'prey', 0, 0, ?, ?)`,
        room.id, userId, now, now);
      this.audit(room.id, userId, 'room.created', { code: room.code });
    });

    this.broadcastRoom(room.id);
    return this.state(room.id);
  }

  joinByCode(userId: string, rawCode: string): unknown {
    const code = String(rawCode ?? '').trim().toUpperCase();
    const room = get<RoomRow>(this.db, 'SELECT * FROM rooms WHERE code = ?', code);
    if (!room || room.status === 'closed') throw notFound('No room with that code');

    const existing = get<MemberRow>(this.db,
      'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?', room.id, userId);
    if (existing) return this.state(room.id);

    if (room.status !== 'lobby') throw conflict('That match already started', 'match_in_progress');

    const count = get<{ n: number }>(this.db,
      'SELECT COUNT(*) AS n FROM room_members WHERE room_id = ?', room.id)!.n;
    if (count >= MAX_PLAYERS) throw conflict('Room is full', 'room_full');

    const now = this.now();
    const team = this.balancedTeam(room.id);
    tx(this.db, () => {
      run(this.db,
        `INSERT INTO room_members (room_id, user_id, team, is_ready, eliminated, joined_at, last_seen_at)
         VALUES (?, ?, ?, 0, 0, ?, ?)`,
        room.id, userId, team, now, now);
      this.audit(room.id, userId, 'room.joined', { team });
      this.systemMessage(room.id, `${this.username(userId)} joined the room`);
    });

    this.broadcastRoom(room.id);
    return this.state(room.id);
  }

  leave(userId: string, roomId: string): { ok: true } {
    const room = this.room(roomId);
    const member = this.member(roomId, userId);
    if (!member) throw forbidden('You are not in this room');

    tx(this.db, () => {
      run(this.db, 'DELETE FROM room_members WHERE room_id = ? AND user_id = ?', roomId, userId);
      const remaining = all<MemberRow>(this.db,
        `SELECT m.*, u.username FROM room_members m JOIN users u ON u.id = m.user_id
          WHERE m.room_id = ? ORDER BY m.joined_at`, roomId);
      if (remaining.length === 0) {
        run(this.db, 'UPDATE rooms SET status = ?, closed_at = ? WHERE id = ?', 'closed', this.now(), roomId);
      } else if (room.admin_id === userId) {
        const next = remaining[0]!;
        run(this.db, 'UPDATE rooms SET admin_id = ? WHERE id = ?', next.user_id, roomId);
        this.systemMessage(roomId, `${next.username} is now the room admin`);
      }
      this.systemMessage(roomId, `${member.username} left the room`);
      this.audit(roomId, userId, 'room.left', {});
    });

    this.broadcastRoom(roomId);
    return { ok: true };
  }

  setTeam(userId: string, roomId: string, team: Team): unknown {
    const room = this.room(roomId);
    const member = this.member(roomId, userId);
    if (!member) throw forbidden('You are not in this room');
    if (team !== 'prey' && team !== 'hunters') throw badRequest('Unknown team', 'invalid_team');
    if (room.status !== 'lobby') throw conflict('Teams are locked during a match', 'teams_locked');

    run(this.db, 'UPDATE room_members SET team = ?, is_ready = 0 WHERE room_id = ? AND user_id = ?',
      team, roomId, userId);
    this.audit(roomId, userId, 'team.changed', { team });
    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  setReady(userId: string, roomId: string, ready: boolean): unknown {
    const room = this.room(roomId);
    if (!this.member(roomId, userId)) throw forbidden('You are not in this room');
    if (room.status !== 'lobby') throw conflict('Match already started', 'match_in_progress');

    run(this.db, 'UPDATE room_members SET is_ready = ? WHERE room_id = ? AND user_id = ?',
      ready ? 1 : 0, roomId, userId);
    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  updateSettings(userId: string, roomId: string, patch: Record<string, unknown>): unknown {
    const room = this.room(roomId);
    this.requireAdmin(room, userId);
    if (room.status !== 'lobby') throw conflict('Settings are locked during a match', 'settings_locked');

    const current = JSON.parse(room.settings_json) as Settings;
    const merged = mergeSettings(current, patch as never);
    const parsed = parseSettings(merged);
    if (!parsed.ok) throw badRequest(parsed.errors.join('; '), 'invalid_settings');

    run(this.db, 'UPDATE rooms SET settings_json = ? WHERE id = ?', JSON.stringify(parsed.settings), roomId);
    this.audit(roomId, userId, 'settings.updated', parsed.settings);
    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  // ---------------------------------------------------------------- match lifecycle

  startMatch(userId: string, roomId: string): unknown {
    const room = this.room(roomId);
    this.requireAdmin(room, userId);
    if (room.status !== 'lobby') throw conflict('A match is already running', 'match_in_progress');

    const settings = JSON.parse(room.settings_json) as Settings;
    const members = this.members(roomId);
    // A new match resets eliminations, so readiness checks must ignore the previous
    // match's tag state (otherwise a room could never be replayed).
    const check = canStart(members.map((m) => ({ ...m, eliminated: 0 })), settings);
    if (!check.ok) throw conflict(check.reasons.join('; '), 'cannot_start');

    const now = this.now();
    const matchId = newId('match');
    const headStartEndsAt = now + settings.headStartSec * 1000;
    const endsAt = headStartEndsAt + settings.durationSec * 1000;

    tx(this.db, () => {
      run(this.db,
        `INSERT INTO matches (id, room_id, status, started_at, head_start_ends_at, ends_at, settings_json,
                              zone_center_lat, zone_center_lng, zone_radius_m)
         VALUES (?, ?, 'head_start', ?, ?, ?, ?, ?, ?, ?)`,
        matchId, roomId, now, headStartEndsAt, endsAt, JSON.stringify(settings),
        settings.zone?.centerLat ?? null, settings.zone?.centerLng ?? null, settings.zone?.radiusM ?? null);
      run(this.db, 'UPDATE rooms SET status = ? WHERE id = ?', 'active', roomId);
      run(this.db, 'UPDATE room_members SET eliminated = 0, is_ready = 1 WHERE room_id = ?', roomId);
      this.audit(roomId, userId, 'match.started', { matchId, settings });
      this.systemMessage(roomId, settings.headStartSec > 0
        ? `Match started. Prey have ${Math.round(settings.headStartSec / 60)} min head start.`
        : 'Match started. Hunting is live.');
    });

    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  endMatch(userId: string, roomId: string, cancelled = false): unknown {
    const room = this.room(roomId);
    this.requireAdmin(room, userId);
    const match = this.activeMatch(roomId);
    if (!match) throw conflict('No active match', 'no_active_match');

    this.finishMatch(match, cancelled ? null : winnerFor(this.preyAlive(roomId), this.preyTotal(roomId)),
      cancelled, userId);
    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  /** Freezes the hunting clock. Only valid while the match is actually hunting. */
  pauseMatch(userId: string, roomId: string): unknown {
    const room = this.room(roomId);
    this.requireAdmin(room, userId);
    this.reconcile(roomId);
    const match = this.activeMatch(roomId);
    if (!match) throw conflict('No active match', 'no_active_match');

    const phase = computedPhase(match, this.now());
    if (phase === 'paused') throw conflict('Match is already paused', 'already_paused');
    if (phase !== 'hunting') throw conflict('Only a hunting match can be paused', 'not_hunting');

    tx(this.db, () => {
      run(this.db, "UPDATE matches SET status = 'paused', paused_at = ? WHERE id = ?", this.now(), match.id);
      this.audit(roomId, userId, 'match.paused', { matchId: match.id });
    });

    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  /**
   * Resumes a paused match, shifting both timers by the paused duration so the
   * remaining head start (if any) and hunting time are preserved exactly.
   */
  resumeMatch(userId: string, roomId: string): unknown {
    const room = this.room(roomId);
    this.requireAdmin(room, userId);
    this.reconcile(roomId);
    const match = this.activeMatch(roomId);
    if (!match) throw conflict('No active match', 'no_active_match');

    const now = this.now();
    if (computedPhase(match, now) !== 'paused') throw conflict('Match is not paused', 'not_paused');

    const pausedAt = match.paused_at ?? now;
    const pausedFor = Math.max(0, now - pausedAt);
    tx(this.db, () => {
      run(this.db,
        `UPDATE matches
            SET status = 'hunting', paused_at = NULL,
                head_start_ends_at = head_start_ends_at + ?,
                ends_at = ends_at + ?
          WHERE id = ?`,
        pausedFor, pausedFor, match.id);
      this.audit(roomId, userId, 'match.resumed', { matchId: match.id, pausedFor });
    });

    this.broadcastRoom(roomId);
    return this.state(roomId);
  }

  /** Reconciles timer-driven transitions. Safe to call often; it is idempotent. */
  reconcile(roomId: string): boolean {
    const match = this.activeMatch(roomId);
    if (!match) return false;

    const now = this.now();
    // Lazy tag-claim expiry: no extra timer process, runs on every state read and tick.
    const changed = this.expireStaleTags(match, now);

    const phase = computedPhase(match, now);
    if (phase === match.status) return changed;

    if (phase === 'finished') {
      this.finishMatch(match, winnerFor(this.preyAlive(roomId), this.preyTotal(roomId)), false, null);
      return true;
    }

    run(this.db, 'UPDATE matches SET status = ? WHERE id = ?', phase, match.id);
    this.audit(roomId, null, 'match.phase', { matchId: match.id, phase });
    this.systemMessage(roomId, phase === 'hunting' ? 'Head start over - hunting is live.' : `Match phase: ${phase}`);
    return true;
  }

  /** Schedules the next state change so the tick loop can reconcile precisely. */
  nextTransitionAt(roomId: string): number | null {
    const match = this.activeMatch(roomId);
    if (!match) return null;
    const phase = computedPhase(match, this.now());
    if (phase === 'head_start') return match.head_start_ends_at;
    if (phase === 'hunting') return match.ends_at;
    return null;
  }

  /**
   * Escalates unresolved tag claims older than the confirmation window into huntmaster
   * disputes. Called lazily from `reconcile` (state reads and the 1 s server tick), so a
   * pocketed phone can never silently void a real-world tag. Returns true if anything changed.
   */
  private expireStaleTags(match: MatchRow, now: number): boolean {
    const stale = all<{ id: string; hunter_id: string; prey_id: string }>(this.db,
      `SELECT id, hunter_id, prey_id FROM tags
        WHERE match_id = ? AND status = 'pending' AND created_at <= ?
        ORDER BY created_at ASC, id ASC`,
      match.id, now - PENDING_TAG_TTL_MS);
    if (stale.length === 0) return false;

    const roomId = match.room_id;
    tx(this.db, () => {
      for (const tag of stale) {
        run(this.db, "UPDATE tags SET status = 'disputed', resolved_at = ? WHERE id = ? AND status = 'pending'",
          now, tag.id);
        this.audit(roomId, null, 'tag.expired', { tagId: tag.id, hunterId: tag.hunter_id, preyId: tag.prey_id });
        this.systemMessage(roomId,
          `${this.username(tag.hunter_id)}'s tag claim on ${this.username(tag.prey_id)} expired ` +
          `(${PENDING_TAG_TTL_MS / 1000}s without confirmation) - a huntmaster must decide`);
        // Same event live clients already handle for a manual prey dispute.
        this.hub.broadcast(roomId, { type: 'tag_disputed', data: this.tagView(tag.id) }, () => true);
      }
    });
    return true;
  }

  private finishMatch(match: MatchRow, winner: 'prey' | 'hunters' | null, cancelled: boolean, actorId: string | null): void {
    const now = this.now();
    tx(this.db, () => {
      run(this.db, 'UPDATE matches SET status = ?, ended_at = ?, winner = ?, paused_at = NULL WHERE id = ?',
        cancelled ? 'cancelled' : 'finished', now, winner, match.id);
      run(this.db, 'UPDATE rooms SET status = ? WHERE id = ?', 'lobby', match.room_id);
      run(this.db, 'UPDATE room_members SET is_ready = 0, eliminated = 0 WHERE room_id = ?', match.room_id);
      this.audit(match.room_id, actorId, 'match.finished', { matchId: match.id, winner, cancelled });
      this.systemMessage(match.room_id, cancelled
        ? 'Match cancelled by the admin.'
        : winner === 'hunters' ? 'Match over - Hunters win!' : 'Match over - Prey win!');
    });
  }

  // ---------------------------------------------------------------- tagging

  requestTag(hunterId: string, roomId: string, preyId: string): unknown {
    const room = this.room(roomId);
    // requireHuntingMatch reconciles first, so expired claims have already become disputes.
    const match = this.requireHuntingMatch(roomId);
    const hunter = this.member(roomId, hunterId);
    if (!hunter || hunter.team !== 'hunters') throw forbidden('Only hunters can tag');
    const prey = this.member(roomId, preyId);
    if (!prey || prey.team !== 'prey') throw badRequest('Target is not a prey player', 'invalid_target');
    if (prey.eliminated) throw conflict('That prey is already tagged', 'already_tagged');

    // One unresolved claim per prey: a second hunter must not double-claim. Retrying as the
    // same hunter stays idempotent (pre-existing behaviour) and returns the existing claim.
    const unresolved = get<{ id: string; hunter_id: string; status: string }>(this.db,
      `SELECT id, hunter_id, status FROM tags
        WHERE match_id = ? AND prey_id = ? AND status IN ('pending', 'disputed')
        ORDER BY created_at DESC, id DESC LIMIT 1`,
      match.id, preyId);
    if (unresolved) {
      if (unresolved.hunter_id === hunterId) return this.tagView(unresolved.id);
      throw conflict(
        unresolved.status === 'disputed'
          ? 'That prey already has a disputed tag awaiting a huntmaster decision'
          : 'Another tag claim for that prey is already awaiting confirmation',
        'tag_pending');
    }

    const recent = get<{ id: string; status: string }>(this.db,
      `SELECT id, status FROM tags
        WHERE match_id = ? AND hunter_id = ? AND prey_id = ? AND created_at > ?
        ORDER BY created_at DESC LIMIT 1`,
      match.id, hunterId, preyId, this.now() - TAG_IDEMPOTENCY_MS);
    if (recent) return this.tagView(recent.id);

    const id = newId('tag');
    const instant = room.status === 'active' && this.settings(room).tagPolicy === 'instant';
    run(this.db, 'INSERT INTO tags (id, match_id, hunter_id, prey_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, match.id, hunterId, preyId, instant ? 'confirmed' : 'pending', this.now());

    if (instant) {
      // Announce before eliminating: eliminate() may finish the match and write its own message.
      this.systemMessage(roomId, `${hunter.username} tagged ${prey.username}`);
      this.eliminate(preyId, roomId, match);
    } else {
      this.hub.sendToUser(roomId, preyId, { type: 'tag_request', data: this.tagView(id) });
      this.systemMessage(roomId, `${hunter.username} claims to have tagged ${prey.username} - awaiting confirmation`);
    }

    this.audit(roomId, hunterId, 'tag.requested', { tagId: id, preyId, instant });
    this.broadcastRoom(roomId);
    return this.tagView(id);
  }

  confirmTag(userId: string, tagId: string): unknown {
    const tag = this.tag(tagId);
    if (tag.prey_id !== userId) throw forbidden('Only the tagged prey can confirm');
    if (tag.status !== 'pending') throw conflict('Tag already resolved', 'tag_resolved');

    const roomId = this.roomIdForMatch(tag.match_id);
    const match = this.match(tag.match_id);
    const prey = this.member(roomId, tag.prey_id)!;

    tx(this.db, () => {
      run(this.db, 'UPDATE tags SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?',
        'confirmed', this.now(), userId, tagId);
      // Write the confirmation first: eliminate() may finish the match and write its
      // "Match over" message, which must come after this one in chat order.
      this.systemMessage(roomId, `${prey.username} confirmed the tag`);
      this.eliminate(userId, roomId, match);
      this.audit(roomId, userId, 'tag.confirmed', { tagId });
    });

    this.broadcastRoom(roomId);
    return this.tagView(tagId);
  }

  disputeTag(userId: string, tagId: string): unknown {
    const tag = this.tag(tagId);
    if (tag.prey_id !== userId) throw forbidden('Only the tagged prey can dispute');
    if (tag.status !== 'pending') throw conflict('Tag already resolved', 'tag_resolved');

    const roomId = this.roomIdForMatch(tag.match_id);
    run(this.db, 'UPDATE tags SET status = ?, resolved_at = ? WHERE id = ?', 'disputed', this.now(), tagId);
    this.hub.broadcast(roomId, { type: 'tag_disputed', data: this.tagView(tagId) }, () => true);
    this.audit(roomId, userId, 'tag.disputed', { tagId });
    this.broadcastRoom(roomId);
    return this.tagView(tagId);
  }

  resolveTag(adminId: string, tagId: string, decision: 'confirmed' | 'rejected'): unknown {
    const tag = this.tag(tagId);
    const roomId = this.roomIdForMatch(tag.match_id);
    const room = this.room(roomId);
    this.requireAdmin(room, adminId);
    if (tag.status !== 'disputed') {
      throw conflict('Only disputed tags can be resolved by an admin', 'tag_not_disputed');
    }

    tx(this.db, () => {
      run(this.db, 'UPDATE tags SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?',
        decision, this.now(), adminId, tagId);
      if (decision === 'confirmed') this.eliminate(tag.prey_id, roomId, this.match(tag.match_id));
      this.audit(roomId, adminId, 'tag.resolved', { tagId, decision });
    });

    this.broadcastRoom(roomId);
    return this.tagView(tagId);
  }

  private eliminate(preyId: string, roomId: string, match: MatchRow): void {
    run(this.db, 'UPDATE room_members SET eliminated = 1 WHERE room_id = ? AND user_id = ?', roomId, preyId);
    const alive = this.preyAlive(roomId);
    if (alive === 0 && match.status !== 'finished' && match.status !== 'cancelled') {
      this.finishMatch(match, 'hunters', false, null);
    }
  }

  // ---------------------------------------------------------------- location

  reportLocation(userId: string, matchId: string, input: {
    lat: number; lng: number; accuracy?: number; recordedAt?: number;
  }): { ok: true; flagged: boolean; reportId: number } {
    const match = this.match(matchId);
    const roomId = match.room_id;
    const room = this.room(roomId);
    const member = this.member(roomId, userId);
    if (!member) throw forbidden('You are not in this match');
    if (member.team !== 'prey') throw forbidden('Only prey devices report locations');
    // An eliminated prey is a spectator for the rest of the match: they keep
    // chat and room state, but must not feed the tracker.
    if (member.eliminated) throw forbidden('Eliminated prey cannot report locations', 'spectator');

    this.reconcile(roomId);
    const phase = computedPhase(this.match(matchId), this.now());
    if (phase !== 'head_start' && phase !== 'hunting') {
      throw conflict('Match is not running', 'match_not_running');
    }

    const point = { lat: Number(input.lat), lng: Number(input.lng) };
    if (!isFiniteCoord(point)) throw badRequest('Invalid coordinates', 'invalid_coordinates');

    const now = this.now();
    const recordedAt = Number.isFinite(input.recordedAt) ? Number(input.recordedAt) : now;
    if (recordedAt > now + 60_000 || recordedAt < now - 15 * 60_000) {
      throw badRequest('Report timestamp is implausible', 'invalid_timestamp');
    }
    const accuracy = Number.isFinite(input.accuracy) ? Number(input.accuracy) : null;
    if (accuracy !== null && (accuracy < 0 || accuracy > 2000)) {
      throw badRequest('Accuracy out of range', 'invalid_accuracy');
    }

    const last = get<{ lat: number; lng: number; recorded_at: number }>(this.db,
      `SELECT lat, lng, recorded_at FROM location_reports
        WHERE match_id = ? AND user_id = ? ORDER BY recorded_at DESC LIMIT 1`,
      matchId, userId);

    let flagged = false;
    if (last) {
      const speed = impliedSpeedMps(
        { p: { lat: last.lat, lng: last.lng }, t: last.recorded_at },
        { p: point, t: recordedAt },
      );
      const moved = haversineMeters({ lat: last.lat, lng: last.lng }, point);
      // Non-increasing timestamps yield Infinity; an actual jump with no elapsed time
      // is exactly the case that must be flagged (see docs/API.md known gaps).
      if (moved > 10 && (!Number.isFinite(speed) || speed > 55)) flagged = true;
    }
    if (accuracy !== null && accuracy > 500) flagged = true;

    const info = this.db.prepare(
      `INSERT INTO location_reports (match_id, user_id, lat, lng, accuracy, recorded_at, received_at, flagged)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(matchId, userId, point.lat, point.lng, accuracy, recordedAt, now, flagged ? 1 : 0);

    if (flagged) this.audit(roomId, userId, 'location.flagged', { matchId });

    const payload = {
      matchId,
      userId,
      username: member.username,
      lat: point.lat,
      lng: point.lng,
      accuracy,
      recordedAt,
      receivedAt: now,
      flagged,
    };
    // Location visibility is role-based only. An admin who is playing as prey
    // must not receive coordinates over the socket either (security review F1).
    const allow = (viewerId: string) => {
      const m = this.member(roomId, viewerId);
      return !!m && canSeePreyLocations(m.team);
    };
    if (phase === 'hunting') this.hub.broadcast(roomId, { type: 'prey_location', data: payload }, allow);

    return { ok: true, flagged, reportId: Number(info.lastInsertRowid) };
  }

  latestLocations(viewerId: string, matchId: string): unknown {
    const match = this.match(matchId);
    const roomId = match.room_id;
    const viewer = this.member(roomId, viewerId);
    if (!viewer) throw forbidden('You are not in this match');
    if (viewer.eliminated) throw forbidden('Eliminated prey are spectators', 'spectator');
    // Location privacy is role-based: an admin who is playing as prey must not
    // gain location powers that would let them cheat.
    if (!canSeePreyLocations(viewer.team)) throw forbidden('Only hunters can see prey locations');

    this.reconcile(roomId);
    const phase = computedPhase(this.match(matchId), this.now());
    if (phase !== 'hunting') throw forbidden('Prey locations are hidden during the head start');

    const settings = this.settings(this.room(roomId));
    const rows = all<{
      user_id: string; username: string; lat: number; lng: number; accuracy: number | null;
      recorded_at: number; received_at: number; flagged: number; eliminated: number;
    }>(this.db,
      `SELECT m.user_id, u.username, r.lat, r.lng, r.accuracy, r.recorded_at, r.received_at, r.flagged, m.eliminated
         FROM room_members m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN location_reports r ON r.id = (
              SELECT id FROM location_reports
               WHERE match_id = ? AND user_id = m.user_id
               ORDER BY recorded_at DESC LIMIT 1)
        WHERE m.room_id = ? AND m.team = 'prey'`,
      matchId, roomId);

    const now = this.now();
    const staleAfter = Math.max(60_000, settings.locationIntervalSec * 2 * 1000);
    return {
      now,
      staleAfterMs: staleAfter,
      prey: rows.map((r) => ({
        userId: r.user_id,
        username: r.username,
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy,
        recordedAt: r.recorded_at,
        receivedAt: r.received_at,
        stale: r.recorded_at === null || now - r.recorded_at > staleAfter,
        flagged: !!r.flagged,
        eliminated: !!r.eliminated,
        hasReport: r.lat !== null,
      })),
    };
  }

  locationHistory(viewerId: string, matchId: string, preyId: string): unknown {
    const match = this.match(matchId);
    const roomId = match.room_id;
    const viewer = this.member(roomId, viewerId);
    if (!viewer) throw forbidden('You are not in this match');
    if (viewer.eliminated) throw forbidden('Eliminated prey are spectators', 'spectator');
    if (!canSeePreyLocations(viewer.team)) throw forbidden('Only hunters can see prey history');

    const settings = this.settings(this.room(roomId));
    if (!settings.trailsEnabled) {
      throw forbidden('Location history is disabled for this room', 'trails_disabled');
    }

    const rows = all<{ lat: number; lng: number; accuracy: number | null; recorded_at: number; flagged: number }>(
      this.db,
      `SELECT lat, lng, accuracy, recorded_at, flagged FROM location_reports
        WHERE match_id = ? AND user_id = ? ORDER BY recorded_at ASC LIMIT 500`,
      matchId, preyId);

    return {
      matchId,
      userId: preyId,
      trailEnabled: settings.trailsEnabled,
      points: rows.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy,
        recordedAt: r.recorded_at,
        flagged: !!r.flagged,
      })),
    };
  }

  // ---------------------------------------------------------------- chat

  postMessage(userId: string, roomId: string, body: string): unknown {
    this.room(roomId);
    if (!this.member(roomId, userId)) throw forbidden('You are not in this room');
    const text = String(body ?? '').trim();
    if (text.length === 0) throw badRequest('Message is empty', 'empty_message');
    if (text.length > 500) throw badRequest('Message too long (max 500)', 'message_too_long');

    const now = this.now();
    const info = this.db.prepare(
      'INSERT INTO messages (room_id, user_id, kind, team, body, created_at) VALUES (?, ?, ?, NULL, ?, ?)',
    ).run(roomId, userId, 'chat', text, now);

    const view = {
      id: Number(info.lastInsertRowid),
      userId,
      username: this.username(userId),
      kind: 'chat',
      body: text,
      createdAt: now,
    };
    this.hub.broadcast(roomId, { type: 'chat', data: view });
    return view;
  }

  /**
   * Newest messages first read backwards from an optional id cursor.
   *
   * `before` is exclusive: only messages with `id < before` are returned, which makes
   * the cursor stable while new messages are being appended. The page is always
   * returned oldest-to-newest so the existing client rendering order is unchanged.
   * `hasMore` is additive: older clients that ignore it keep their previous behaviour.
   */
  messages(userId: string, roomId: string, limit = 50, before?: number): unknown {
    this.room(roomId);
    if (!this.member(roomId, userId)) throw forbidden('You are not in this room');
    const pageSize = Math.min(Math.max(Math.trunc(limit) || 50, 1), 200);
    const cursor = typeof before === 'number' && Number.isFinite(before) ? Math.trunc(before) : null;
    const rows = all<{ id: number; user_id: string | null; username: string | null; kind: string; body: string; created_at: number }>(
      this.db,
      `SELECT m.id, m.user_id, u.username, m.kind, m.body, m.created_at
         FROM messages m LEFT JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ?${cursor === null ? '' : ' AND m.id < ?'}
        ORDER BY m.id DESC LIMIT ?`,
      ...(cursor === null ? [roomId, pageSize + 1] : [roomId, cursor, pageSize + 1]));

    // Fetch one extra row to learn whether another (older) page exists without a COUNT(*).
    const hasMore = rows.length > pageSize;
    const page = hasMore ? rows.slice(0, pageSize) : rows;

    return {
      messages: page.reverse().map((r) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username ?? 'System',
        kind: r.kind,
        body: r.body,
        createdAt: r.created_at,
      })),
      hasMore,
    };
  }

  // ---------------------------------------------------------------- history

  /**
   * Recent matches for a room, newest first.
   *
   * Limitation: team rosters are read from the room's CURRENT membership, not
   * from a per-match snapshot. Players who leave or switch teams after a match
   * (team switches are lobby-only) will therefore be reflected in older rows.
   */
  matchHistory(userId: string, roomId: string): unknown {
    this.room(roomId);
    if (!this.member(roomId, userId)) throw forbidden('You are not in this room');
    this.reconcile(roomId);

    const matches = all<MatchRow>(this.db,
      'SELECT * FROM matches WHERE room_id = ? ORDER BY started_at DESC, rowid DESC LIMIT 20', roomId);
    const members = this.members(roomId);
    const prey = members.filter((m) => m.team === 'prey').map((m) => m.username);
    const hunters = members.filter((m) => m.team === 'hunters').map((m) => m.username);

    return {
      matches: matches.map((m) => ({
        id: m.id,
        startedAt: m.started_at,
        endedAt: m.ended_at,
        winner: m.winner,
        cancelled: m.status === 'cancelled',
        durationSec: m.ended_at === null ? null : (m.ended_at - m.started_at) / 1000,
        prey,
        hunters,
      })),
    };
  }

  /** Summary for a single match, readable by members of its room. */
  matchSummary(userId: string, matchId: string): unknown {
    const match = this.match(matchId);
    const roomId = match.room_id;
    if (!this.member(roomId, userId)) throw forbidden('You are not in this match');
    this.reconcile(roomId);

    const current = this.match(matchId);
    const settings = JSON.parse(current.settings_json) as Settings;
    const now = this.now();
    return {
      id: current.id,
      phase: computedPhase(current, now),
      status: current.status,
      startedAt: current.started_at,
      headStartEndsAt: current.head_start_ends_at,
      endsAt: current.ends_at,
      endedAt: current.ended_at,
      winner: current.winner,
      preyAlive: this.preyAlive(roomId),
      preyTotal: this.preyTotal(roomId),
      zone: this.zoneView(current, settings, now),
      now,
    };
  }

  // ---------------------------------------------------------------- views

  state(roomId: string): unknown {
    // Lazy evaluation can change state (expired tag claim -> dispute, timer phase change).
    // Broadcast when it did, so REST pollers and live socket clients agree immediately.
    if (this.reconcile(roomId)) this.broadcastRoom(roomId);
    return this.buildState(roomId);
  }

  private buildState(roomId: string): unknown {
    const room = this.room(roomId);
    const settings = JSON.parse(room.settings_json) as Settings;
    const presence = this.hub.presence(roomId);
    const members = this.members(roomId);
    const activeMatch = this.activeMatch(roomId);
    const match = activeMatch ?? this.latestMatch(roomId);
    const now = this.now();

    let matchView: MatchView | null = null;
    if (match) {
      const phase = computedPhase(match, now);
      const zone = this.zoneView(match, settings, now);
      matchView = {
        id: match.id,
        phase,
        status: match.status,
        startedAt: match.started_at,
        headStartEndsAt: match.head_start_ends_at,
        endsAt: match.ends_at,
        now,
        winner: match.winner,
        // A finished match keeps its historical outcome even though the lobby is reset.
        preyAlive: match.status === 'finished'
          ? (match.winner === 'hunters' ? 0 : this.preyTotal(roomId))
          : this.preyAlive(roomId),
        preyTotal: this.preyTotal(roomId),
        zone,
      };
    }

    return {
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        adminId: room.admin_id,
        status: room.status,
        settings,
        createdAt: room.created_at,
      },
      members: members.map<MemberView>((m) => ({
        userId: m.user_id,
        username: m.username,
        team: m.team,
        ready: !!m.is_ready,
        connected: presence.has(m.user_id),
        eliminated: !!m.eliminated,
        isAdmin: m.user_id === room.admin_id,
      })),
      match: matchView,
      // Unresolved claims of the current match only; the lobby always reports an empty list.
      pendingTags: activeMatch ? this.pendingTags(activeMatch.id, now) : [],
      serverNow: now,
    };
  }

  /**
   * Unresolved tag claims (pending confirmation or already disputed) of one match, joined
   * with usernames. Pending claims past the 90 s window are hidden here even before
   * reconcile escalates them, so no REST/WS reader ever sees a stale countdown.
   */
  private pendingTags(matchId: string, now: number): PendingTagView[] {
    const rows = all<{
      id: string; match_id: string; hunter_id: string; hunter_username: string;
      prey_id: string; prey_username: string; created_at: number; status: string;
    }>(this.db,
      `SELECT t.id, t.match_id, t.hunter_id, hu.username AS hunter_username,
              t.prey_id, pu.username AS prey_username, t.created_at, t.status
         FROM tags t
         JOIN users hu ON hu.id = t.hunter_id
         JOIN users pu ON pu.id = t.prey_id
        WHERE t.match_id = ? AND t.status IN ('pending', 'disputed')
          AND (t.status = 'disputed' OR t.created_at > ?)
        ORDER BY t.created_at ASC, t.id ASC`,
      matchId, now - PENDING_TAG_TTL_MS);

    return rows.map((r) => ({
      id: r.id,
      matchId: r.match_id,
      hunterId: r.hunter_id,
      hunterUsername: r.hunter_username,
      preyId: r.prey_id,
      preyUsername: r.prey_username,
      createdAt: r.created_at,
      expiresAt: r.created_at + PENDING_TAG_TTL_MS,
      disputed: r.status === 'disputed',
    }));
  }

  private zoneView(match: MatchRow, settings: Settings, now: number): MatchView['zone'] {
    if (settings.mode !== 'zone' || !settings.zone) return null;
    const base = settings.zone.radiusM;
    let radius = base;
    let nextShrinkAt: number | null = null;

    if (settings.shrink.enabled) {
      const intervalMs = settings.shrink.intervalSec * 1000;
      const huntingStart = match.head_start_ends_at;
      const elapsed = Math.max(0, now - huntingStart);
      const steps = Math.floor(elapsed / intervalMs);
      radius = Math.max(settings.shrink.minRadiusM, base - steps * settings.shrink.stepM);
      if (radius > settings.shrink.minRadiusM) nextShrinkAt = huntingStart + (steps + 1) * intervalMs;
    }

    return {
      centerLat: settings.zone.centerLat,
      centerLng: settings.zone.centerLng,
      radiusM: radius,
      nextShrinkAt,
    };
  }

  // ---------------------------------------------------------------- internals

  broadcastRoom(roomId: string): void {
    const room = get<RoomRow>(this.db, 'SELECT * FROM rooms WHERE id = ?', roomId);
    if (!room) return;
    this.hub.broadcast(roomId, { type: 'room', data: this.buildState(roomId) });
  }

  private room(roomId: string): RoomRow {
    const room = get<RoomRow>(this.db, 'SELECT * FROM rooms WHERE id = ?', roomId);
    if (!room) throw notFound('Room not found');
    return room;
  }

  private settings(room: RoomRow): Settings {
    return JSON.parse(room.settings_json) as Settings;
  }

  private requireAdmin(room: RoomRow, userId: string): void {
    if (room.admin_id !== userId) throw forbidden('Only the room admin can do that');
  }

  private member(roomId: string, userId: string): MemberRow | undefined {
    return get<MemberRow>(this.db,
      `SELECT m.*, u.username FROM room_members m JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ? AND m.user_id = ?`, roomId, userId);
  }

  /** Fill the side with fewer players; ties go to prey. Keeps 2-team rooms even. */
  private balancedTeam(roomId: string): 'prey' | 'hunters' {
    const row = get<{ prey: number; hunters: number }>(this.db,
      `SELECT
         SUM(CASE WHEN team = 'prey' THEN 1 ELSE 0 END) AS prey,
         SUM(CASE WHEN team = 'hunters' THEN 1 ELSE 0 END) AS hunters
       FROM room_members WHERE room_id = ?`, roomId);
    return (row?.prey ?? 0) <= (row?.hunters ?? 0) ? 'prey' : 'hunters';
  }

  private members(roomId: string): MemberRow[] {
    return all<MemberRow>(this.db,
      `SELECT m.*, u.username FROM room_members m JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ? ORDER BY m.joined_at`, roomId);
  }

  private username(userId: string): string {
    return get<{ username: string }>(this.db, 'SELECT username FROM users WHERE id = ?', userId)?.username ?? 'Unknown';
  }

  private match(matchId: string): MatchRow {
    const match = get<MatchRow>(this.db, 'SELECT * FROM matches WHERE id = ?', matchId);
    if (!match) throw notFound('Match not found');
    return match;
  }

  private activeMatch(roomId: string): MatchRow | undefined {
    return get<MatchRow>(this.db,
      `SELECT * FROM matches WHERE room_id = ? AND status IN ('head_start','hunting','paused')
        ORDER BY started_at DESC LIMIT 1`, roomId);
  }

  private latestMatch(roomId: string): MatchRow | undefined {
    return get<MatchRow>(this.db,
      'SELECT * FROM matches WHERE room_id = ? ORDER BY started_at DESC LIMIT 1', roomId);
  }

  private roomIdForMatch(matchId: string): string {
    return this.match(matchId).room_id;
  }

  private requireHuntingMatch(roomId: string): MatchRow {
    this.reconcile(roomId);
    const match = this.activeMatch(roomId);
    if (!match) throw conflict('No active match', 'no_active_match');
    const phase = computedPhase(match, this.now());
    if (phase !== 'hunting') throw conflict('Hunting has not started', 'not_hunting');
    return match;
  }

  private tag(tagId: string) {
    const tag = get<{ id: string; match_id: string; hunter_id: string; prey_id: string; status: string; created_at: number }>(
      this.db, 'SELECT * FROM tags WHERE id = ?', tagId);
    if (!tag) throw notFound('Tag not found');
    return tag;
  }

  private tagView(tagId: string) {
    const t = this.tag(tagId);
    return {
      id: t.id,
      matchId: t.match_id,
      hunterId: t.hunter_id,
      preyId: t.prey_id,
      status: t.status,
      createdAt: t.created_at,
    };
  }

  private preyTotal(roomId: string): number {
    return get<{ n: number }>(this.db,
      "SELECT COUNT(*) AS n FROM room_members WHERE room_id = ? AND team = 'prey'", roomId)!.n;
  }

  private preyAlive(roomId: string): number {
    return get<{ n: number }>(this.db,
      "SELECT COUNT(*) AS n FROM room_members WHERE room_id = ? AND team = 'prey' AND eliminated = 0", roomId)!.n;
  }

  private systemMessage(roomId: string, body: string): void {
    const now = this.now();
    this.db.prepare(
      'INSERT INTO messages (room_id, user_id, kind, team, body, created_at) VALUES (?, NULL, ?, NULL, ?, ?)',
    ).run(roomId, 'system', body, now);
    this.hub.broadcast(roomId, {
      type: 'chat',
      data: { id: 0, userId: null, username: 'System', kind: 'system', body, createdAt: now },
    });
  }

  private audit(roomId: string | null, actorId: string | null, type: string, payload: unknown): void {
    run(this.db, 'INSERT INTO audit_events (room_id, actor_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)',
      roomId, actorId, type, JSON.stringify(payload ?? {}), this.now());
  }

  private uniqueCode(): string {
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      }
      if (!get(this.db, 'SELECT 1 FROM rooms WHERE code = ?', code)) return code;
    }
    throw new Error('Could not allocate a room code');
  }

  /** Deletes precise location history older than the retention window. */
  purgeOldLocations(olderThanMs: number): number {
    const cutoff = this.now() - olderThanMs;
    const info = this.db.prepare('DELETE FROM location_reports WHERE received_at < ?').run(cutoff);
    return Number(info.changes);
  }
}

/** Single source of truth for location visibility, shared by REST and WebSocket paths. */
export function canSeePreyLocations(team: string | undefined | null): boolean {
  return team === 'hunters';
}

export function distanceBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return haversineMeters(a, b);
}
