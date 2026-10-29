import { z } from 'zod';
import type { Phase, Settings, Team } from './types.ts';

export const DEFAULT_SETTINGS: Settings = {
  headStartSec: 300,
  durationSec: 3600,
  minPlayers: 2,
  locationIntervalSec: 300,
  trailsEnabled: true,
  mode: 'open',
  zone: null,
  shrink: { enabled: false, intervalSec: 120, stepM: 25, minRadiusM: 100, warningSec: 30 },
  tagPolicy: 'confirm',
};

const zoneSchema = z.object({
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusM: z.number().min(50).max(20_000),
});

const shrinkSchema = z.object({
  enabled: z.boolean().default(false),
  intervalSec: z.number().int().min(30).max(3600).default(120),
  stepM: z.number().min(5).max(5000).default(25),
  minRadiusM: z.number().min(25).max(5000).default(100),
  warningSec: z.number().int().min(0).max(300).default(30),
});

const settingsSchema = z.object({
  headStartSec: z.number().int().min(0).max(1800).default(300),
  durationSec: z.number().int().min(300).max(14_400).default(3600),
  minPlayers: z.number().int().min(2).max(50).default(2),
  locationIntervalSec: z.number().int().min(30).max(3600).default(300),
  trailsEnabled: z.boolean().default(true),
  mode: z.enum(['open', 'zone']).default('open'),
  zone: zoneSchema.nullable().default(null),
  shrink: shrinkSchema.default({ enabled: false, intervalSec: 120, stepM: 25, minRadiusM: 100, warningSec: 30 }),
  tagPolicy: z.enum(['confirm', 'instant']).default('confirm'),
});

export type SettingsPatch = Partial<Omit<Settings, 'shrink'>> & { shrink?: Partial<Settings['shrink']> };

export function parseSettings(input: unknown): { ok: true; settings: Settings } | { ok: false; errors: string[] } {
  const result = settingsSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => `${i.path.join('.') || 'settings'}: ${i.message}`) };
  }
  const s = result.data as Settings;
  const errors: string[] = [];
  if (s.mode === 'zone' && !s.zone) errors.push('mode: zone mode requires a zone');
  if (s.mode === 'zone' && s.zone && s.shrink.enabled && s.shrink.minRadiusM >= s.zone.radiusM) {
    errors.push('shrink.minRadiusM: must be smaller than the starting radius');
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, settings: s };
}

export function mergeSettings(current: Settings, patch: SettingsPatch): Settings {
  const merged: Settings = {
    ...current,
    ...patch,
    shrink: { ...current.shrink, ...(patch.shrink ?? {}) },
  } as Settings;
  return merged;
}

export type StartCheck = { ok: boolean; reasons: string[] };

export function canStart(
  members: Array<{ team: Team; is_ready: number | boolean; eliminated?: number | boolean }>,
  settings: Settings,
): StartCheck {
  const active = members.filter((m) => !m.eliminated);
  const reasons: string[] = [];

  if (active.length < settings.minPlayers) {
    reasons.push(`Need at least ${settings.minPlayers} players (currently ${active.length})`);
  }
  const prey = active.filter((m) => m.team === 'prey').length;
  const hunters = active.filter((m) => m.team === 'hunters').length;
  if (prey === 0) reasons.push('At least one player must be on Prey');
  if (hunters === 0) reasons.push('At least one player must be on Hunters');

  const notReady = active.filter((m) => !m.is_ready);
  if (notReady.length > 0) reasons.push(`${notReady.length} player(s) are not ready`);

  return { ok: reasons.length === 0, reasons };
}

/** Derives the live phase from persisted timestamps. Server is the source of truth. */
export function computedPhase(
  match: { status: Phase; head_start_ends_at: number; ends_at: number; ended_at: number | null },
  now: number,
): Phase {
  if (match.status === 'finished' || match.status === 'cancelled' || match.status === 'paused') {
    return match.status;
  }
  if (match.status === 'head_start') {
    if (now >= match.ends_at) return 'finished';
    return now >= match.head_start_ends_at ? 'hunting' : 'head_start';
  }
  if (match.status === 'hunting') {
    return now >= match.ends_at ? 'finished' : 'hunting';
  }
  return match.status;
}

export function winnerFor(preyAlive: number, preyTotal: number): 'prey' | 'hunters' {
  return preyAlive > 0 && preyTotal > 0 ? 'prey' : 'hunters';
}
