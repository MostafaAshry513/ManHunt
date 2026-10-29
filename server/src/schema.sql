PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS rooms (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  admin_id      TEXT NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'lobby',
  settings_json TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  closed_at     INTEGER
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id      TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team         TEXT NOT NULL DEFAULT 'prey',
  is_ready     INTEGER NOT NULL DEFAULT 0,
  eliminated   INTEGER NOT NULL DEFAULT 0,
  joined_at    INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id                TEXT PRIMARY KEY,
  room_id           TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  status            TEXT NOT NULL,
  started_at        INTEGER NOT NULL,
  head_start_ends_at INTEGER NOT NULL,
  ends_at           INTEGER NOT NULL,
  paused_at         INTEGER,
  ended_at          INTEGER,
  winner            TEXT,
  settings_json     TEXT NOT NULL,
  zone_center_lat   REAL,
  zone_center_lng   REAL,
  zone_radius_m     REAL
);
CREATE INDEX IF NOT EXISTS idx_matches_room ON matches(room_id, started_at);

CREATE TABLE IF NOT EXISTS location_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id    TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  accuracy    REAL,
  recorded_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  flagged     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_loc_match_user_time ON location_reports(match_id, user_id, recorded_at);

CREATE TABLE IF NOT EXISTS tags (
  id          TEXT PRIMARY KEY,
  match_id    TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  hunter_id   TEXT NOT NULL,
  prey_id     TEXT NOT NULL,
  status      TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_tags_match ON tags(match_id, status);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    TEXT,
  kind       TEXT NOT NULL,
  team       TEXT,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, id);

CREATE TABLE IF NOT EXISTS audit_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    TEXT,
  actor_id   TEXT,
  type       TEXT NOT NULL,
  payload    TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_room ON audit_events(room_id, id);

CREATE TABLE IF NOT EXISTS zone_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id     TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  radius_m     REAL NOT NULL,
  effective_at INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
