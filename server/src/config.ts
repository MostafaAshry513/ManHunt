import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int('PORT', 8080),
  host: process.env.HOST ?? '127.0.0.1',
  dbPath: process.env.DB_PATH ?? resolve(here, '..', 'data', 'manhunt.db'),
  sessionDays: int('SESSION_DAYS', 30),
  /** How often the server reconciles match timers, in ms. */
  tickMs: int('TICK_MS', 1000),
  /** Public base URL used in invite links, if known. */
  publicUrl: process.env.PUBLIC_URL ?? '',
  /** Precise location reports older than this are deleted. */
  locationRetentionDays: int('LOCATION_RETENTION_DAYS', 30),
  isTest: process.env.NODE_ENV === 'test',
};
