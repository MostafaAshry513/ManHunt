export type Team = 'prey' | 'hunters';

export type Phase = 'lobby' | 'head_start' | 'hunting' | 'paused' | 'finished' | 'cancelled';

export type TagStatus = 'pending' | 'confirmed' | 'disputed' | 'rejected';

export type ZoneConfig = {
  centerLat: number;
  centerLng: number;
  radiusM: number;
};

export type ShrinkConfig = {
  enabled: boolean;
  intervalSec: number;
  stepM: number;
  minRadiusM: number;
  warningSec: number;
};

export type Settings = {
  headStartSec: number;
  durationSec: number;
  minPlayers: number;
  locationIntervalSec: number;
  trailsEnabled: boolean;
  mode: 'open' | 'zone';
  zone: ZoneConfig | null;
  shrink: ShrinkConfig;
  tagPolicy: 'confirm' | 'instant';
};

export type MatchRow = {
  id: string;
  room_id: string;
  status: Exclude<Phase, 'lobby'>;
  started_at: number;
  head_start_ends_at: number;
  ends_at: number;
  paused_at: number | null;
  ended_at: number | null;
  winner: 'prey' | 'hunters' | null;
  settings_json: string;
};

export type MemberRow = {
  room_id: string;
  user_id: string;
  team: Team;
  is_ready: number;
  eliminated: number;
  joined_at: number;
  last_seen_at: number;
};
