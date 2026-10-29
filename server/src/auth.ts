import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { get, run } from './db.ts';
import { badRequest, unauthorized } from './errors.ts';

const N = 16_384;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

export type User = { id: string; username: string; created_at: number };

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64!, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64!, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validateCredentials(username: unknown, password: unknown): { username: string; password: string } {
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    throw badRequest('Username must be 3-24 characters: letters, numbers or underscore', 'invalid_username');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    throw badRequest('Password must be 8-200 characters', 'invalid_password');
  }
  return { username, password };
}

export function registerUser(db: DatabaseSync, username: string, password: string, now: number): User {
  const existing = get<{ id: string }>(db, 'SELECT id FROM users WHERE username = ?', username);
  if (existing) throw badRequest('Username already taken', 'username_taken');

  const user: User = { id: newId('usr'), username, created_at: now };
  run(db, 'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
    user.id, username, hashPassword(password), now);
  return user;
}

export function loginUser(db: DatabaseSync, username: string, password: string): User {
  const row = get<{ id: string; username: string; password_hash: string; created_at: number }>(
    db, 'SELECT id, username, password_hash, created_at FROM users WHERE username = ?', username,
  );
  // Always run a hash comparison to keep timing uniform for unknown users.
  const stored = row?.password_hash ?? hashPassword('not-a-real-password');
  const ok = verifyPassword(password, stored) && !!row;
  if (!ok) throw unauthorized('Invalid username or password');
  return { id: row!.id, username: row!.username, created_at: row!.created_at };
}

export function createSession(db: DatabaseSync, userId: string, now: number, days: number): string {
  const token = newToken();
  run(db, 'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    sha256(token), userId, now + days * 86_400_000, now);
  return token;
}

export function userForToken(db: DatabaseSync, token: string | undefined, now: number): User | null {
  if (!token) return null;
  const row = get<{ id: string; username: string; created_at: number; expires_at: number }>(
    db,
    `SELECT u.id, u.username, u.created_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
    sha256(token),
  );
  if (!row || row.expires_at <= now) return null;
  return { id: row.id, username: row.username, created_at: row.created_at };
}

export function revokeSession(db: DatabaseSync, token: string): void {
  run(db, 'DELETE FROM sessions WHERE token_hash = ?', sha256(token));
}
