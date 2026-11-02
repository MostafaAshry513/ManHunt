import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import type { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { get } from './db.ts';
import { ApiError, badRequest, unauthorized } from './errors.ts';
import { createSession, loginUser, registerUser, revokeSession, userForToken, validateCredentials, type User } from './auth.ts';
import { Hub } from './realtime.ts';
import type { RoomService } from './rooms.ts';

export type AppDeps = {
  db: DatabaseSync;
  hub: Hub;
  rooms: RoomService;
  clock?: () => number;
  sessionDays?: number;
  logger?: boolean;
  /** Override for the published update manifest (tests use a temporary file). */
  manifestPath?: string;
};

type Authed = FastifyRequest & { auth: User };

type LatestManifest = {
  versionCode?: number;
  versionName?: string;
  url?: string;
  sha256?: string;
  size?: number;
  publishedAt?: string;
  notes?: string;
};

const registerBody = z.object({ username: z.string(), password: z.string() });
const roomBody = z.object({ name: z.string() });
const joinBody = z.object({ code: z.string() });
const teamBody = z.object({ team: z.enum(['prey', 'hunters']) });
const readyBody = z.object({ ready: z.boolean() });
const tagBody = z.object({ preyId: z.string().min(1) });
const resolveBody = z.object({ decision: z.enum(['confirmed', 'rejected']) });
const messageBody = z.object({ body: z.string() });
// Pagination query for GET /api/rooms/:id/messages. Both params are optional, so a
// request without a query string keeps the pre-pagination "newest 50" response.
const messagesQuery = z.object({
  limit: z.coerce.number().int().min(1).optional(),
  before: z.coerce.number().int().min(1).optional(),
});
const locationBody = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  recordedAt: z.number().optional(),
});

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw badRequest(result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '), 'invalid_body');
  }
  return result.data;
}

class RateLimiter {
  private hits = new Map<string, { count: number; reset: number }>();
  private readonly clock: () => number;

  constructor(clock: () => number) {
    this.clock = clock;
  }

  check(key: string, limit: number, windowMs: number): void {
    const now = this.clock();
    const entry = this.hits.get(key);
    if (!entry || entry.reset <= now) {
      this.hits.set(key, { count: 1, reset: now + windowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > limit) {
      throw new ApiError(429, 'rate_limited', 'Too many requests, slow down');
    }
  }
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const clock = deps.clock ?? (() => Date.now());
  const sessionDays = deps.sessionDays ?? 30;
  const limiter = new RateLimiter(clock);
  const manifestPath = deps.manifestPath ?? resolve(process.cwd(), 'data', 'app-latest.json');

  const app = Fastify({
    logger: deps.logger === false ? false : { level: process.env.LOG_LEVEL ?? 'info' },
    bodyLimit: 256 * 1024,
    trustProxy: false,
  });

  await app.register(cors, { origin: true });
  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });

  const authenticate = async (req: FastifyRequest & { auth?: User }): Promise<void> => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const user = userForToken(deps.db, token, clock());
    if (!user) throw unauthorized();
    req.auth = user;
  };

  app.setErrorHandler((err, req, reply: FastifyReply) => {
    if (err instanceof ApiError) {
      return reply.status(err.status).send({ error: { code: err.code, message: err.message } });
    }
    if ((err as { statusCode?: number }).statusCode === 413) {
      return reply.status(413).send({ error: { code: 'payload_too_large', message: 'Request body too large' } });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return reply.status(status).send({
        error: { code: (err as { code?: string }).code ?? 'bad_request', message: (err as Error).message },
      });
    }
    req.log.error(err);
    if (process.env.NODE_ENV === 'test') console.error('[server error]', err);
    return reply.status(500).send({ error: { code: 'internal', message: 'Internal server error' } });
  });

  app.get('/health', async () => {
    deps.db.prepare('SELECT 1').get();
    return { ok: true, now: clock(), service: 'manhunt', version: '0.9.0' };
  });

  // Update channel: written by scripts/ci/pull-latest-apk.ps1 after a CI build.
  app.get('/api/app/latest', async (_req, reply) => {
    const manifest = await readManifestText(manifestPath);
    if (manifest === null) {
      return reply.code(404).send({
        error: { code: 'no_update_channel', message: 'No update manifest has been published yet' },
      });
    }
    return reply.type('application/json').send(manifest);
  });

  // Install page + APK download for testers. Version, size and checksum are read from the
  // published update manifest on every request, so the page cannot show stale metadata.
  const apkPath = process.env.APK_PATH ?? resolve(
    process.cwd(), '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk',
  );

  app.get('/favicon.png', async (_req, reply) => {
    try {
      const bytes = await readFile(resolve(process.cwd(), 'public', 'favicon.png'));
      return reply.type('image/png').header('cache-control', 'public, max-age=86400').send(bytes);
    } catch {
      return reply.code(404).send();
    }
  });

  app.get('/og-image.png', async (_req, reply) => {
    try {
      const bytes = await readFile(resolve(process.cwd(), 'public', 'og-image.png'));
      return reply.type('image/png').header('cache-control', 'public, max-age=86400').send(bytes);
    } catch {
      return reply.code(404).send();
    }
  });

  // Small, fixed set of landing-page screenshots/cover art. Allowlisted so the public route
  // can never read arbitrary files from the server.
  const siteMedia: Record<string, string> = {
    'auth.png': 'image/png',
    'home.png': 'image/png',
    'lobby.png': 'image/png',
    'roles.png': 'image/png',
    'chat.png': 'image/png',
    'settings.png': 'image/png',
    'result.png': 'image/png',
    'explainer-cover.png': 'image/png',
  };
  app.get<{ Params: { file: string } }>('/media/:file', async (req, reply) => {
    const type = siteMedia[req.params.file];
    if (!type) return reply.code(404).send();
    try {
      const bytes = await readFile(resolve(process.cwd(), 'public', 'site', req.params.file));
      return reply
        .type(type)
        .header('cache-control', 'public, max-age=86400')
        .header('x-content-type-options', 'nosniff')
        .send(bytes);
    } catch {
      return reply.code(404).send();
    }
  });

  app.get('/', async (req, reply) => {
    const raw = await readManifestText(manifestPath);
    const manifest = raw === null ? null : parseManifest(raw);
    // Aggregate community stats only: never expose account details on a public page.
    const totalAccounts = get<{ n: number }>(deps.db, 'SELECT COUNT(*) AS n FROM users')?.n ?? 0;
    const weekAgo = clock() - 7 * 24 * 60 * 60 * 1000;
    const newAccounts = get<{ n: number }>(
      deps.db,
      'SELECT COUNT(*) AS n FROM users WHERE created_at >= ?',
      weekAgo,
    )?.n ?? 0;
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-store')
      // Static pages only: no scripts, no framing, no referrer leakage.
      .header('x-content-type-options', 'nosniff')
      .header('x-frame-options', 'DENY')
      .header('referrer-policy', 'no-referrer')
      .header('content-security-policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
      .send(renderInstallPage(manifest, publicBaseUrl(req), { totalAccounts, newAccounts }));
  });

  app.get('/join', async (req, reply) => {
    const raw = (req.query as { code?: unknown } | undefined)?.code;
    const code = typeof raw === 'string'
      ? raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
      : '';
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-store')
      .header('x-content-type-options', 'nosniff')
      .header('x-frame-options', 'DENY')
      .header('referrer-policy', 'no-referrer')
      .header('content-security-policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
      .send(renderJoinPage(code, publicBaseUrl(req)));
  });

  app.get('/app.apk', async (_req, reply) => {
    try {
      const data = await readFile(apkPath);
      return reply
        .type('application/vnd.android.package-archive')
        .header('content-disposition', 'attachment; filename="manhunt.apk"')
        .header('content-length', String(data.length))
        .send(data);
    } catch {
      return reply.code(404).send({ error: { code: 'apk_missing', message: 'APK has not been built yet' } });
    }
  });

  // ------------------------------------------------------------ auth

  app.post('/api/auth/register', async (req) => {
    limiter.check(`register:${req.ip}`, 10, 60_000);
    const body = parse(registerBody, req.body);
    const { username, password } = validateCredentials(body.username, body.password);
    const user = registerUser(deps.db, username, password, clock());
    const token = createSession(deps.db, user.id, clock(), sessionDays);
    return { token, user };
  });

  app.post('/api/auth/login', async (req) => {
    limiter.check(`login:${req.ip}`, 10, 60_000);
    const body = parse(registerBody, req.body);
    const user = loginUser(deps.db, String(body.username), String(body.password));
    const token = createSession(deps.db, user.id, clock(), sessionDays);
    return { token, user };
  });

  app.post('/api/auth/logout', { preHandler: authenticate }, async (req) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) revokeSession(deps.db, header.slice(7));
    return { ok: true };
  });

  app.get('/api/me', { preHandler: authenticate }, async (req) => {
    return { user: (req as Authed).auth };
  });

  // ------------------------------------------------------------ rooms

  app.post('/api/rooms', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    const body = parse(roomBody, req.body);
    return deps.rooms.createRoom(auth.id, body.name);
  });

  app.post('/api/rooms/join', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    limiter.check(`join:${auth.id}`, 20, 60_000);
    const body = parse(joinBody, req.body);
    return deps.rooms.joinByCode(auth.id, body.code);
  });

  app.get<{ Params: { id: string } }>('/api/rooms/:id', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    if (!isMember(deps.db, req.params.id, auth.id)) throw unauthorized('Not a member of this room');
    return deps.rooms.state(req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/leave', { preHandler: authenticate }, async (req) => {
    return deps.rooms.leave((req as Authed).auth.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/team', { preHandler: authenticate }, async (req) => {
    const body = parse(teamBody, req.body);
    return deps.rooms.setTeam((req as Authed).auth.id, req.params.id, body.team);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/ready', { preHandler: authenticate }, async (req) => {
    const body = parse(readyBody, req.body);
    return deps.rooms.setReady((req as Authed).auth.id, req.params.id, body.ready);
  });

  app.patch<{ Params: { id: string } }>('/api/rooms/:id/settings', { preHandler: authenticate }, async (req) => {
    return deps.rooms.updateSettings((req as Authed).auth.id, req.params.id, (req.body ?? {}) as Record<string, unknown>);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/start', { preHandler: authenticate }, async (req) => {
    return deps.rooms.startMatch((req as Authed).auth.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/end', { preHandler: authenticate }, async (req) => {
    const body = (req.body ?? {}) as { cancelled?: boolean };
    return deps.rooms.endMatch((req as Authed).auth.id, req.params.id, !!body.cancelled);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/pause', { preHandler: authenticate }, async (req) => {
    return deps.rooms.pauseMatch((req as Authed).auth.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/resume', { preHandler: authenticate }, async (req) => {
    return deps.rooms.resumeMatch((req as Authed).auth.id, req.params.id);
  });

  app.get<{ Params: { id: string } }>('/api/rooms/:id/history', { preHandler: authenticate }, async (req) => {
    return deps.rooms.matchHistory((req as Authed).auth.id, req.params.id);
  });

  app.get<{ Params: { id: string } }>('/api/rooms/:id/messages', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    // Backwards compatible: no query -> newest 50, exactly as before pagination existed.
    const query = parse(messagesQuery, req.query ?? {});
    return deps.rooms.messages(auth.id, req.params.id, query.limit, query.before);
  });

  app.post<{ Params: { id: string } }>('/api/rooms/:id/messages', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    limiter.check(`chat:${auth.id}`, 10, 10_000);
    const body = parse(messageBody, req.body);
    return deps.rooms.postMessage(auth.id, req.params.id, body.body);
  });

  // ------------------------------------------------------------ tags

  app.post<{ Params: { id: string } }>('/api/rooms/:id/tags', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    limiter.check(`tag:${auth.id}`, 10, 60_000);
    const body = parse(tagBody, req.body);
    return deps.rooms.requestTag(auth.id, req.params.id, body.preyId);
  });

  app.post<{ Params: { id: string } }>('/api/tags/:id/confirm', { preHandler: authenticate }, async (req) => {
    return deps.rooms.confirmTag((req as Authed).auth.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/tags/:id/dispute', { preHandler: authenticate }, async (req) => {
    return deps.rooms.disputeTag((req as Authed).auth.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/api/tags/:id/resolve', { preHandler: authenticate }, async (req) => {
    const body = parse(resolveBody, req.body);
    return deps.rooms.resolveTag((req as Authed).auth.id, req.params.id, body.decision);
  });

  // ------------------------------------------------------------ matches

  app.get<{ Params: { id: string } }>('/api/matches/:id', { preHandler: authenticate }, async (req) => {
    return deps.rooms.matchSummary((req as Authed).auth.id, req.params.id);
  });

  // ------------------------------------------------------------ locations

  app.post<{ Params: { id: string } }>('/api/matches/:id/location', { preHandler: authenticate }, async (req) => {
    const { auth } = req as Authed;
    limiter.check(`location:${auth.id}`, 20, 60_000);
    const body = parse(locationBody, req.body);
    return deps.rooms.reportLocation(auth.id, req.params.id, body);
  });

  app.get<{ Params: { id: string } }>('/api/matches/:id/locations', { preHandler: authenticate }, async (req) => {
    return deps.rooms.latestLocations((req as Authed).auth.id, req.params.id);
  });

  app.get<{ Params: { id: string; userId: string } }>(
    '/api/matches/:id/locations/:userId',
    { preHandler: authenticate },
    async (req) => deps.rooms.locationHistory((req as Authed).auth.id, req.params.id, req.params.userId),
  );

  // ------------------------------------------------------------ realtime

  // The session token travels in the query string (common for WS upgrades), so
  // suppress request logging on this route to keep it out of the logs.
  app.get('/ws', { websocket: true, logLevel: 'warn' }, (socket, req) => {
    const url = new URL(req.url, 'http://localhost');
    const user = userForToken(deps.db, url.searchParams.get('token') ?? undefined, clock());
    if (!user) {
      socket.close(4401, 'unauthorized');
      return;
    }

    const client = deps.hub.add(socket, user.id);
    deps.hub.send(client, { type: 'hello', data: { userId: user.id, username: user.username, now: clock() } });

    socket.on('message', (raw: unknown) => {
      let msg: { type?: string; roomId?: string };
      try {
        const parsed: unknown = JSON.parse(String(raw));
        // "null", "42", "[]" are valid JSON but not protocol messages. Dereferencing
        // them used to throw inside the socket handler and could take the process down.
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return;
        msg = parsed as { type?: string; roomId?: string };
      } catch {
        return;
      }
      try {
        if (msg.type === 'ping') {
          deps.hub.send(client, { type: 'pong', data: { now: clock() } });
          return;
        }
        if (msg.type === 'subscribe' && typeof msg.roomId === 'string') {
          if (!isMember(deps.db, msg.roomId, user.id)) {
            deps.hub.send(client, { type: 'error', data: { code: 'forbidden', message: 'Not a room member' } });
            return;
          }
          deps.hub.subscribe(client, msg.roomId);
          deps.hub.send(client, { type: 'room', data: deps.rooms.state(msg.roomId) });
          deps.rooms.broadcastRoom(msg.roomId);
        }
      } catch {
        // One bad frame must never crash the whole server; answer and keep the socket.
        deps.hub.send(client, {
          type: 'error',
          data: { code: 'bad_message', message: 'Could not process that message' },
        });
      }
    });

    socket.on('close', () => {
      if (client.roomId) deps.hub.remove(client), deps.rooms.broadcastRoom(client.roomId!);
      else deps.hub.remove(client);
    });
  });

  return app;
}

function isMember(db: DatabaseSync, roomId: string, userId: string): boolean {
  return !!get(db, 'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?', roomId, userId);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c
  ));
}

/** Read the published update manifest, stripping the BOM Windows PowerShell may add. */
async function readManifestText(path: string): Promise<string | null> {
  try {
    return (await readFile(path, 'utf8')).replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
}

function parseManifest(raw: string): LatestManifest | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as LatestManifest) : null;
  } catch {
    return null;
  }
}

/** Public base URL for the install page, from PUBLIC_URL or the request's Host header. */
function publicBaseUrl(req: FastifyRequest): string {
  const configured = (process.env.PUBLIC_URL ?? '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = req.headers.host;
  if (!host) return '';
  return `${req.protocol === 'https' ? 'https' : 'http'}://${host}`;
}

function formatBytes(bytes: number | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | undefined): string {
  if (typeof iso !== 'string') return '';
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : '';
}

/**
 * The install page. Metadata (version, size, checksum) comes from the update manifest on
 * every request; everything else is static and dependency-free so the page works on any phone.
 */
function renderInstallPage(
  manifest: LatestManifest | null,
  serverUrl: string,
  stats: { totalAccounts: number; newAccounts: number },
): string {
  const version = typeof manifest?.versionName === 'string' ? manifest.versionName.trim() : '';
  const size = formatBytes(manifest?.size);
  const sha = typeof manifest?.sha256 === 'string' ? manifest.sha256.trim() : '';
  const published = formatDate(manifest?.publishedAt);
  const manifestUrl = typeof manifest?.url === 'string' ? manifest.url.trim() : '';
  const downloadHref = /^\/[\w./-]+$/.test(manifestUrl) ? manifestUrl : '/app.apk';

  const statsBlock = `<section class="stats" aria-label="Community growth">
    <div class="stat"><b>${stats.totalAccounts}</b><span>accounts created</span></div>
    <div class="stat"><b>+${stats.newAccounts}</b><span>new this week</span></div>
  </section>`;

  const chips = [
    version ? `<span class="chip chip-version">v${escapeHtml(version)}</span>` : '',
    size ? `<span class="chip">${escapeHtml(size)}</span>` : '',
    '<span class="chip">Android 8.0+</span>',
  ].filter(Boolean).join('\n        ');

  const details = manifest === null
    ? '<p class="meta">Release details are not published on this server yet — the download below is the latest available build.</p>'
    : [
      published ? `<p class="meta">Published ${escapeHtml(published)}</p>` : '',
      sha
        ? `<p class="hash">SHA-256<code>${escapeHtml(sha)}</code></p>`
        : '<p class="meta">No checksum has been published for this build.</p>',
    ].filter(Boolean).join('\n      ');

  const serverBlock = serverUrl
    ? `<p class="server"><span class="dot" aria-hidden="true"></span><span>Server <code>${escapeHtml(serverUrl)}</code></span></p>
      <p class="hint">This page is served by that server, and the build offered here is already pointed at it. Self-hosting? Set your own address on the app's sign-in screen after installing.</p>`
    : '<p class="hint">Set the server address on the app\'s sign-in screen after installing.</p>';

  // og:image must be absolute for social scrapers. The page is served from the same
  // public server in production; for a self-hosted deployment this resolves correctly too.
  const ogImageUrl = `${(serverUrl || '').replace(/\/$/, '')}/og-image.png`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0B1220">
<link rel="icon" type="image/png" href="/favicon.png">
<meta name="description" content="ManHunt - real-world GPS hide-and-seek for Android. Hide from your friends. Download the free signed APK.">
<meta property="og:type" content="website">
<meta property="og:title" content="ManHunt - Hide from your friends.">
<meta property="og:description" content="Real-world hide-and-seek for Android. Prey hide, Hunters track on a live map and tag in person. Free APK.">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<title>ManHunt - Hide from your friends.</title>
<style>
  :root{color-scheme:dark;--bg:#0B1220;--card:#111B2E;--line:#1E2B44;--text:#E6EDF7;--muted:#93A4BF;--cyan:#22D3EE}
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:radial-gradient(120% 60% at 50% 0%,#122039 0%,var(--bg) 60%) fixed;color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  .wrap{max-width:640px;margin:0 auto;padding:28px 18px calc(28px + env(safe-area-inset-bottom))}
  .hero{display:flex;align-items:center;gap:14px}
  .icon{flex:none;border-radius:22%}
  .eyebrow{margin:0 0 2px;font-size:12px;letter-spacing:.22em;color:var(--cyan);font-weight:700}
  h1{margin:0;font-size:clamp(24px,6vw,32px);letter-spacing:-.01em}
  h2{margin:0 0 12px;font-size:18px}
  .pitch{color:var(--muted);margin:16px 0 22px}
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 18px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
  .stat b{display:block;font-size:24px;line-height:1.1;color:var(--text)}
  .stat span{display:block;margin-top:4px;font-size:12.5px;color:var(--muted)}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)) var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin:0 0 16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  .chip{border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:13px;color:var(--muted)}
  .chip-version{color:var(--cyan);border-color:rgba(34,211,238,.45)}
  .button{display:block;text-align:center;background:var(--cyan);color:#06121F;text-decoration:none;font-weight:700;padding:14px 18px;border-radius:12px;font-size:17px}
  .button:hover,.button:focus-visible{filter:brightness(1.06)}
  .button:focus-visible{outline:2px solid #E6EDF7;outline-offset:3px}
  .meta{color:var(--muted);font-size:13px;margin:12px 0 0}
  .hash{margin:10px 0 0;font-size:12.5px;color:var(--muted)}
  .hash code{display:block;margin-top:4px;padding:8px 10px;background:#0A1424;border:1px solid var(--line);border-radius:8px;font-size:11.5px;word-break:break-all;color:#B9C8DE}
  .server{display:flex;align-items:center;gap:8px;margin:16px 0 0;font-size:14px;flex-wrap:wrap}
  .server code{font-size:13px;background:#0A1424;border:1px solid var(--line);border-radius:6px;padding:2px 7px;color:var(--cyan)}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 4px rgba(34,211,238,.16);flex:none}
  .hint{color:var(--muted);font-size:13px;margin:8px 0 0}
  .steps{margin:0;padding-left:22px}
  .steps li{margin:0 0 10px;padding-left:4px}
  .notes{margin:0;padding-left:20px;color:#C7D3E5;font-size:14.5px}
  .notes li{margin:0 0 9px}
  .notes b{color:var(--text)}
  .footer{margin-top:26px;color:var(--muted);font-size:13px;text-align:center}
  .footer a{color:var(--cyan)}
  .fine{font-size:12px;opacity:.8}
  @media (min-width:520px){.button{display:inline-block;min-width:280px}}

/* ============================================================================
   ManHunt — install-page hero (self-contained: no JS, no external assets)
   Generated by tools/build-site-hero.mjs from src/motion-core.js.
   Scoped under .mh-hero; safe to paste into server/src/app.ts.
   Brand: Open Zone radar + drawn MANHUNT wordmark. Cyan = field/referee,
   coral = Prey, violet = Hunters. Flat fills only, no gradients or glow.
   ============================================================================ */
.mh-hero {
  --mh-field: #0B1220;
  --mh-chalk: #E6EDF7;
  --mh-muted: #A7B6CC;
  --mh-dim: #7C8DA8;
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--mh-chalk);
}
.mh-hero__frame { position: relative; overflow: hidden; background: var(--mh-field); }
.mh-hero__art { display: block; width: 100%; height: auto; }
.mh-hero__wordmark { position: absolute; left: 5.33%; top: 12%; width: 26.7%; }
.mh-hero__wordmark svg { display: block; width: 100%; height: auto; }
.mh-hero__rule { position: absolute; left: 5.33%; top: 24.6%; width: 10.00%; height: 0.83%; background: var(--mh-chalk); opacity: 0.92; }
.mh-hero__rule::after { content: ""; position: absolute; left: calc(100% + 8px); top: 0; width: 38%; height: 100%; background: #22D3EE; }
.mh-hero__hook {
  position: absolute; left: 5.33%; top: 28.6%; margin: 0; padding: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 700; font-size: 38px; letter-spacing: -0.022em; line-height: 0.99;
  color: var(--mh-chalk); max-width: 50.00%;
}
.mh-hero__desc {
  position: absolute; left: 5.33%; top: 56.5%; margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px; line-height: 1.4; letter-spacing: -0.004em; color: var(--mh-muted);
}
.mh-hero__legend {
  position: absolute; left: 5.33%; top: 66.5%; margin: 0; display: flex; align-items: center; gap: 18px;
  font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 10px; letter-spacing: 0.16em; color: var(--mh-muted);
}
.mh-hero__legend span { display: inline-flex; align-items: center; gap: 7px; }
.mh-hero__legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.mh-hero__micro {
  position: absolute; left: 5.33%; top: 79%; margin: 0;
  font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 10.5px; letter-spacing: 0.055em; color: var(--mh-dim);
}
@supports (font-size: 1cqw) {
  .mh-hero__hook { font-size: 6.33cqw; }
  .mh-hero__desc { font-size: 2.17cqw; }
  .mh-hero__legend { font-size: 1.75cqw; }
  .mh-hero__micro { font-size: 1.8cqw; }
}
@container (max-width: 560px) {
  .mh-hero__wordmark { width: 45%; top: 9%; }
  .mh-hero__rule { top: 23.5%; width: 18%; }
  .mh-hero__hook { font-size: 26px; font-size: 7.6cqw; top: 26.5%; max-width: 72%; }
  .mh-hero__desc, .mh-hero__legend, .mh-hero__micro { display: none; }
}

/* ── motion (all CSS; disabled entirely under reduced motion) ────────────── */
.mh-hero__sweep {
  transform-box: view-box; transform-origin: 900px 310px;
  animation: mh-hero-spin 8s linear infinite;
}
.mh-hero__outer { animation: mh-hero-march-ring 6s linear infinite; }
.mh-hero__trail { animation: mh-hero-march-trail 0.9s linear infinite; }
.mh-hero__dot--prey { transform: translate(900px, 219.4px); animation: mh-hero-prey 8s linear infinite; }
.mh-hero__dot--h1 { transform: translate(868.2px, 248.1px); animation: mh-hero-h1 8s linear infinite; }
.mh-hero__dot--h2 { transform: translate(868.6px, 244.3px); animation: mh-hero-h2 8s linear infinite; }
.mh-hero__dot--h3 { transform: translate(834.5px, 267.5px); animation: mh-hero-h3 8s linear infinite; }
.mh-hero__dot--h4 { transform: translate(842.5px, 256px); animation: mh-hero-h4 8s linear infinite; }
.mh-hero__dot--h5 { transform: translate(810px, 302.6px); animation: mh-hero-h5 8s linear infinite; }
.mh-hero__ping { transform-box: fill-box; transform-origin: center; animation: mh-hero-ping 2.6667s cubic-bezier(0.2, 0.6, 0.4, 1) infinite both; }
.mh-hero__ping--1 { animation-delay: 0.889s; }
.mh-hero__ping--2 { animation-delay: 1.778s; }
@keyframes mh-hero-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes mh-hero-march-trail { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -14; } }
@keyframes mh-hero-march-ring { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -12; } }
@keyframes mh-hero-ping {
  0% { transform: scale(0.5); opacity: 0; }
  12% { opacity: 0.42; }
  65% { opacity: 0.1; }
  100% { transform: scale(3.6); opacity: 0; }
}
@keyframes mh-hero-prey {
  0.00% { transform: translate(900px, 219.4px); }
  4.00% { transform: translate(926.5px, 213px); }
  8.00% { transform: translate(958.7px, 209.6px); }
  12.00% { transform: translate(987.8px, 222.2px); }
  16.00% { transform: translate(999.7px, 250.5px); }
  20.00% { transform: translate(995.8px, 280.7px); }
  24.00% { transform: translate(991.5px, 304.6px); }
  28.00% { transform: translate(994.2px, 326.9px); }
  32.00% { transform: translate(995.1px, 352.1px); }
  36.00% { transform: translate(985.1px, 376.2px); }
  40.00% { transform: translate(966.3px, 395.7px); }
  44.00% { transform: translate(943px, 412px); }
  48.00% { transform: translate(915.1px, 422.3px); }
  52.00% { transform: translate(885.5px, 418.1px); }
  56.00% { transform: translate(862.6px, 398.8px); }
  60.00% { transform: translate(847.7px, 377.7px); }
  64.00% { transform: translate(829.9px, 364.5px); }
  68.00% { transform: translate(803.5px, 352.7px); }
  72.00% { transform: translate(780.6px, 331.4px); }
  76.00% { transform: translate(776.6px, 302.7px); }
  80.00% { transform: translate(790.2px, 276.5px); }
  84.00% { transform: translate(809.2px, 255.8px); }
  88.00% { transform: translate(828.6px, 238.5px); }
  92.00% { transform: translate(851px, 226.3px); }
  96.00% { transform: translate(875.9px, 221.8px); }
  100% { transform: translate(900px, 219.4px); }
}
@keyframes mh-hero-h1 {
  0.00% { transform: translate(868.2px, 248.1px); }
  4.00% { transform: translate(886.2px, 245.6px); }
  8.00% { transform: translate(903.7px, 243.2px); }
  12.00% { transform: translate(924.1px, 237.8px); }
  16.00% { transform: translate(948.5px, 236.5px); }
  20.00% { transform: translate(968.5px, 248.2px); }
  24.00% { transform: translate(975.1px, 270.2px); }
  28.00% { transform: translate(971.7px, 291.9px); }
  32.00% { transform: translate(970.1px, 309.3px); }
  36.00% { transform: translate(973.3px, 326.9px); }
  40.00% { transform: translate(973px, 346.8px); }
  44.00% { transform: translate(963.7px, 365.1px); }
  48.00% { transform: translate(948.2px, 379.8px); }
  52.00% { transform: translate(929.3px, 392px); }
  56.00% { transform: translate(906.9px, 398px); }
  60.00% { transform: translate(884.4px, 391.5px); }
  64.00% { transform: translate(868.4px, 374.8px); }
  68.00% { transform: translate(857.6px, 359.2px); }
  72.00% { transform: translate(843.1px, 349.7px); }
  76.00% { transform: translate(823.2px, 339.5px); }
  80.00% { transform: translate(809.1px, 321.7px); }
  84.00% { transform: translate(810.2px, 300.2px); }
  88.00% { transform: translate(822.4px, 282px); }
  92.00% { transform: translate(836.7px, 267.7px); }
  96.00% { transform: translate(851.3px, 255.8px); }
  100% { transform: translate(868.2px, 248.1px); }
}
@keyframes mh-hero-h2 {
  0.00% { transform: translate(868.6px, 244.3px); }
  4.00% { transform: translate(887.4px, 241.5px); }
  8.00% { transform: translate(906.1px, 238.3px); }
  12.00% { transform: translate(928.4px, 232.4px); }
  16.00% { transform: translate(954.4px, 232.5px); }
  20.00% { transform: translate(974px, 246.9px); }
  24.00% { transform: translate(978.6px, 271.1px); }
  28.00% { transform: translate(973.8px, 293.5px); }
  32.00% { transform: translate(971.9px, 311.2px); }
  36.00% { transform: translate(974.3px, 329.2px); }
  40.00% { transform: translate(972.2px, 348.8px); }
  44.00% { transform: translate(961.2px, 366px); }
  48.00% { transform: translate(945px, 379.4px); }
  52.00% { transform: translate(926.1px, 390.1px); }
  56.00% { transform: translate(904.1px, 394.3px); }
  60.00% { transform: translate(883px, 386.4px); }
  64.00% { transform: translate(868.6px, 370.1px); }
  68.00% { transform: translate(858.1px, 356px); }
  72.00% { transform: translate(842.9px, 347.6px); }
  76.00% { transform: translate(822.9px, 337.3px); }
  80.00% { transform: translate(809.4px, 319.2px); }
  84.00% { transform: translate(811px, 297.9px); }
  88.00% { transform: translate(822.7px, 279.7px); }
  92.00% { transform: translate(836.4px, 264.9px); }
  96.00% { transform: translate(851px, 252.2px); }
  100% { transform: translate(868.6px, 244.3px); }
}
@keyframes mh-hero-h3 {
  0.00% { transform: translate(834.5px, 267.5px); }
  4.00% { transform: translate(849.3px, 255.2px); }
  8.00% { transform: translate(866.6px, 247.3px); }
  12.00% { transform: translate(885.1px, 245.1px); }
  16.00% { transform: translate(902.7px, 243.7px); }
  20.00% { transform: translate(922.4px, 239.5px); }
  24.00% { transform: translate(945.4px, 238.9px); }
  28.00% { transform: translate(964.2px, 250.5px); }
  32.00% { transform: translate(969.9px, 271.8px); }
  36.00% { transform: translate(965.9px, 292.5px); }
  40.00% { transform: translate(963.3px, 308.5px); }
  44.00% { transform: translate(965.4px, 324.2px); }
  48.00% { transform: translate(965.2px, 341.8px); }
  52.00% { transform: translate(957.3px, 358.1px); }
  56.00% { transform: translate(943.8px, 371.5px); }
  60.00% { transform: translate(927.4px, 383px); }
  64.00% { transform: translate(907.4px, 389.8px); }
  68.00% { transform: translate(886.7px, 385.6px); }
  72.00% { transform: translate(871.1px, 371.5px); }
  76.00% { transform: translate(860.3px, 357.4px); }
  80.00% { transform: translate(845.9px, 348.9px); }
  84.00% { transform: translate(825.5px, 339.7px); }
  88.00% { transform: translate(809.7px, 322.8px); }
  92.00% { transform: translate(808.9px, 301.3px); }
  96.00% { transform: translate(820.2px, 282.4px); }
  100% { transform: translate(834.5px, 267.5px); }
}
@keyframes mh-hero-h4 {
  0.00% { transform: translate(842.5px, 256px); }
  4.00% { transform: translate(859.9px, 246.3px); }
  8.00% { transform: translate(879.2px, 242.6px); }
  12.00% { transform: translate(897.7px, 241.3px); }
  16.00% { transform: translate(917.4px, 237px); }
  20.00% { transform: translate(941.5px, 233.5px); }
  24.00% { transform: translate(964.6px, 241.1px); }
  28.00% { transform: translate(975.9px, 261.5px); }
  32.00% { transform: translate(974.4px, 284.8px); }
  36.00% { transform: translate(971px, 303.7px); }
  40.00% { transform: translate(973.2px, 320.9px); }
  44.00% { transform: translate(975.3px, 340.6px); }
  48.00% { transform: translate(969.2px, 360.5px); }
  52.00% { transform: translate(955.2px, 377px); }
  56.00% { transform: translate(937.2px, 390.9px); }
  60.00% { transform: translate(915.3px, 400.7px); }
  64.00% { transform: translate(891px, 399.3px); }
  68.00% { transform: translate(871.4px, 384.8px); }
  72.00% { transform: translate(858.8px, 367px); }
  76.00% { transform: translate(845.2px, 355.4px); }
  80.00% { transform: translate(824.7px, 346px); }
  84.00% { transform: translate(805.7px, 329.8px); }
  88.00% { transform: translate(801.1px, 307.1px); }
  92.00% { transform: translate(811.5px, 285.8px); }
  96.00% { transform: translate(827px, 269.4px); }
  100% { transform: translate(842.5px, 256px); }
}
@keyframes mh-hero-h5 {
  0.00% { transform: translate(810px, 302.6px); }
  4.00% { transform: translate(820.3px, 283.6px); }
  8.00% { transform: translate(833.9px, 268.4px); }
  12.00% { transform: translate(847.9px, 255.2px); }
  16.00% { transform: translate(864.7px, 246.1px); }
  20.00% { transform: translate(883.4px, 242.5px); }
  24.00% { transform: translate(901.8px, 239.8px); }
  28.00% { transform: translate(922.8px, 234.2px); }
  32.00% { transform: translate(948.4px, 231.9px); }
  36.00% { transform: translate(970.4px, 242.9px); }
  40.00% { transform: translate(978.5px, 265.7px); }
  44.00% { transform: translate(974.7px, 289.1px); }
  48.00% { transform: translate(971.7px, 307.4px); }
  52.00% { transform: translate(973.8px, 325px); }
  56.00% { transform: translate(973.4px, 344.5px); }
  60.00% { transform: translate(964.3px, 362.5px); }
  64.00% { transform: translate(948.9px, 376.6px); }
  68.00% { transform: translate(930.6px, 388.1px); }
  72.00% { transform: translate(909.1px, 394.3px); }
  76.00% { transform: translate(887.3px, 389.2px); }
  80.00% { transform: translate(871.2px, 373.8px); }
  84.00% { transform: translate(860.6px, 358.4px); }
  88.00% { transform: translate(847.1px, 349.1px); }
  92.00% { transform: translate(827.6px, 340px); }
  96.00% { transform: translate(811.7px, 323.7px); }
  100% { transform: translate(810px, 302.6px); }
}
@media (prefers-reduced-motion: reduce) {
  .mh-hero *, .mh-hero *::before, .mh-hero *::after { animation: none !important; transition: none !important; }
  .mh-hero__ping { display: none; }
}


/* ============================================================================
   Game-site layer over the install page. Same Open Zone system, wider canvas.
   CSS only: no scripts, no remote assets. Images are served from /media/*.
   ============================================================================ */
:root{--surface:#101A2C;--surface-2:#0C1524;--coral:#FF7A59;--violet:#A79BFF;--line-strong:#2B3B57}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px calc(48px + env(safe-area-inset-bottom))}
.site-nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:24px;max-width:1120px;margin:0 auto;padding:14px 20px;background:rgba(11,18,32,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(30,43,68,.8)}
.site-brand{display:flex;align-items:center;gap:9px;color:var(--text);text-decoration:none;font-weight:800;letter-spacing:-.02em;font-size:18px}
.site-brand img{width:28px;height:28px;border-radius:8px;display:block}
.site-links{display:flex;align-items:center;gap:22px;margin-left:auto}
.site-links a{color:var(--muted);text-decoration:none;font-size:14px}
.site-links a:hover,.site-links a:focus-visible{color:var(--text)}
.nav-cta{border:1px solid rgba(34,211,238,.5);border-radius:999px;padding:9px 14px;background:var(--cyan);color:#06121F;text-decoration:none;font-size:13px;font-weight:800;white-space:nowrap}
.nav-cta:hover,.nav-cta:focus-visible{filter:brightness(1.06)}
.mh-hero{margin-top:18px;border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.3)}
.lead{display:grid;grid-template-columns:1.15fr .85fr;gap:28px;align-items:start;margin:30px 0 18px}
.lead-title{margin:6px 0 14px;font-size:clamp(28px,4.2vw,46px);line-height:1.02;letter-spacing:-.035em}
.lead .pitch{font-size:16px;line-height:1.6;margin:0 0 8px;max-width:620px}
.lead-actions{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 10px}
.lead .button{display:inline-block;width:auto;min-width:0;padding:13px 20px}
.button-ghost{background:transparent;color:var(--text);border:1px solid var(--line-strong);text-decoration:none;font-weight:700}
.button-ghost:hover,.button-ghost:focus-visible{border-color:var(--cyan);color:var(--cyan)}
.lead-panel{background:linear-gradient(180deg,rgba(34,211,238,.07),rgba(255,255,255,.015)) var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px}
.panel-kicker{display:block;font-family:ui-monospace,"Cascadia Mono","Segoe UI Mono",Consolas,monospace;font-size:10.5px;letter-spacing:.16em;color:var(--cyan)}
.field-notes{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:12px}
.field-notes li{display:grid;grid-template-columns:76px 1fr;gap:10px;align-items:baseline;border-top:1px solid rgba(30,43,68,.8);padding-top:10px}
.field-notes li:first-child{border-top:0;padding-top:0}
.field-notes b{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}
.field-notes span{font-size:13.5px;color:var(--muted)}
.section{margin:64px 0;scroll-margin-top:82px}
.section-head{max-width:660px;margin:0 0 22px}
.section h2{margin:4px 0 10px;font-size:clamp(24px,3.4vw,38px);line-height:1.08;letter-spacing:-.03em}
.section-head p,.section-copy p{margin:0;color:var(--muted);font-size:15px}
.eyebrow{display:block;margin:0;font-family:ui-monospace,"Cascadia Mono","Segoe UI Mono",Consolas,monospace;font-size:10.5px;letter-spacing:.16em;color:var(--cyan)}
.split{display:grid;grid-template-columns:.9fr 1.1fr;gap:36px;align-items:center}
.media-cover{display:block;border-radius:20px;overflow:hidden;border:1px solid var(--line-strong);background:var(--surface);box-shadow:0 18px 50px rgba(0,0,0,.3)}
.media-cover img{display:block;width:100%;height:auto;max-height:520px;object-fit:cover;object-position:top center}
.section-copy h2{font-size:clamp(24px,3.4vw,38px)}
.section-copy p{margin:0 0 10px;line-height:1.6}
.inline-links{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center;margin-top:16px}
.inline-links a{color:var(--cyan);font-weight:700;text-decoration:none;font-size:14px}
.inline-links a:hover,.inline-links a:focus-visible{text-decoration:underline}
.screen-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.screen-grid figure{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.screen-grid img{display:block;width:100%;height:auto;max-height:420px;object-fit:cover;object-position:top center}
.screen-grid figcaption{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:12px 14px}
.screen-grid b{font-size:14px}
.screen-grid span{color:var(--muted);font-size:12px}
.side-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0 24px}
.side-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px}
.side-card.prey{border-color:rgba(255,122,89,.42)}
.side-card.hunters{border-color:rgba(167,155,255,.42)}
.side-tag{display:inline-block;border-radius:999px;padding:4px 9px;font:700 11px/1.4 ui-monospace,"Cascadia Mono","Segoe UI Mono",Consolas,monospace;letter-spacing:.12em;margin-bottom:10px}
.side-card.prey .side-tag{color:var(--coral);border:1px solid rgba(255,122,89,.45);background:rgba(255,122,89,.08)}
.side-card.hunters .side-tag{color:var(--violet);border:1px solid rgba(167,155,255,.45);background:rgba(167,155,255,.08)}
.side-card h3{margin:0 0 8px;font-size:20px}
.side-card p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}
.flow{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.flow li{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:16px}
.flow b{display:block;color:var(--cyan);font:700 11px/1.4 ui-monospace,"Cascadia Mono","Segoe UI Mono",Consolas,monospace;letter-spacing:.12em;margin-bottom:8px}
.flow span{display:block;color:var(--text);font-size:13.5px;line-height:1.45}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.feature{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px}
.feature h3{margin:0 0 6px;font-size:15px}
.feature p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.55}
.card{scroll-margin-top:82px}
#download,#install,#privacy,#faq{scroll-margin-top:82px}
.faq{display:grid;gap:10px}
.faq details{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.faq summary{cursor:pointer;font-weight:700;font-size:14px;color:var(--text)}
.faq summary::marker{color:var(--cyan)}
.faq details p{margin:10px 0 0;color:var(--muted);font-size:13.5px;line-height:1.6}
.footer{border-top:1px solid var(--line);margin-top:54px;padding-top:22px}
.footer a{color:var(--cyan)}
@media (max-width:820px){
  .site-links{display:none}
  .lead,.split{grid-template-columns:1fr;gap:20px}
  .screen-grid,.feature-grid{grid-template-columns:repeat(2,1fr)}
  .flow{grid-template-columns:repeat(2,1fr)}
  .media-cover img{max-height:420px}
}
@media (max-width:560px){
  .wrap{padding-left:14px;padding-right:14px}
  .site-nav{padding-left:14px;padding-right:14px}
  .lead-title{font-size:30px}
  .screen-grid,.feature-grid,.side-grid,.flow{grid-template-columns:1fr}
  .screen-grid img{max-height:260px;object-fit:cover;object-position:top center}
  .media-cover img{max-height:360px}
  .field-notes li{grid-template-columns:68px 1fr}
  .card{padding:16px}
  .footer{text-align:left}
}
</style>
</head>
<body>
<header class="site-nav">
  <a class="site-brand" href="/"><img src="/favicon.png" alt="" width="28" height="28">ManHunt</a>
  <nav class="site-links" aria-label="Primary">
    <a href="#watch">Watch</a>
    <a href="#screens">Screens</a>
    <a href="#how">How it works</a>
    <a href="#download">Download</a>
  </nav>
  <a class="nav-cta" href="#download">Get the APK</a>
</header>
<main class="wrap">
  <section class="mh-hero" aria-labelledby="mh-hero-title">
  <div class="mh-hero__frame">
    <svg class="mh-hero__art" viewBox="0 0 1200 600" role="img" aria-label="An Open Zone radar: the coral Prey dot runs as violet Hunter dots close in.">
  <rect width="1200" height="600" fill="#0B1220"/>
  <g class="mh-hero__blocks"><rect x="-60.3" y="-61.4" width="150.3" height="94.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="-56.6" y="59.5" width="138.6" height="115" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="-55.2" y="197" width="129.2" height="113.4" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="-53.8" y="335.6" width="146.4" height="70" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="-61.1" y="428.9" width="149.5" height="91.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="113.8" y="-64.8" width="152.9" height="102.6" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="113" y="56.4" width="140.9" height="119.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="116.4" y="192.2" width="139.2" height="117" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="113.3" y="331.6" width="132.5" height="73.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="113.3" y="428.5" width="137.9" height="82.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="116.4" y="548" width="133.1" height="83.4" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="279.1" y="-59.5" width="132.6" height="83.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="279.2" y="53.8" width="149.2" height="117.7" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="275.6" y="331.5" width="141.2" height="79.4" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="284.4" y="435.8" width="136.6" height="85" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="285.2" y="548.6" width="136" height="78" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="447.9" y="-60" width="90.8" height="95.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="439.7" y="57.4" width="104.9" height="112.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="439.2" y="188.4" width="103.6" height="122.2" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="446.5" y="335.9" width="98.9" height="70.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="444.6" y="435.9" width="82.5" height="80.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="444.8" y="545.3" width="103.8" height="85" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="566.5" y="-64.7" width="86.9" height="95.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="565.5" y="57.3" width="91.9" height="110.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="565.1" y="199.7" width="91.1" height="106.5" rx="7" fill="#0C2026" fill-opacity="0.9" stroke="#22D3EE" stroke-opacity="0.15" stroke-width="1.5"/><rect x="570.8" y="335.6" width="88.9" height="64.9" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="564" y="545.7" width="97.6" height="94.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="689.6" y="61.4" width="103.7" height="108.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="687.6" y="334" width="115.7" height="70.3" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="692.6" y="439.4" width="105.3" height="80.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="689.4" y="543.7" width="99.9" height="82.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="827" y="-61.6" width="101" height="90.2" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="823.7" y="55.3" width="114.7" height="120.1" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="826.2" y="192.7" width="102.6" height="124.2" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="828.4" y="335.9" width="101.4" height="67.3" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="825.1" y="428.3" width="114.1" height="90.9" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="955.2" y="-64.8" width="129.2" height="84.2" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="954.4" y="50.8" width="134" height="121.4" rx="7" fill="#0C2026" fill-opacity="0.9" stroke="#22D3EE" stroke-opacity="0.15" stroke-width="1.5"/><rect x="955.5" y="196.5" width="134.8" height="112.4" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="958.2" y="335.2" width="130.5" height="68.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="949.4" y="545.8" width="124.5" height="93.3" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="1114.5" y="-58.8" width="110.3" height="86.8" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="1110.4" y="52.5" width="122.5" height="121" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="1107.4" y="192.1" width="110.8" height="108.2" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="1107.7" y="328.7" width="128.6" height="78.5" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/><rect x="1112.5" y="437.6" width="109" height="82.3" rx="7" fill="#0E1727" fill-opacity="0.7" stroke="#E6EDF7" stroke-opacity="0.065" stroke-width="1.5"/></g>
  <defs>
    <pattern id="mhHeroDots" width="50" height="50" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="1.4" fill="#22D3EE" fill-opacity="0.1"/>
    </pattern>
    <pattern id="mhHeroDotsMajor" width="250" height="250" patternUnits="userSpaceOnUse">
      <circle cx="125" cy="125" r="2.4" fill="#22D3EE" fill-opacity="0.17"/>
    </pattern>
  </defs>
  <rect width="1200" height="600" fill="url(#mhHeroDots)"/>
  <rect width="1200" height="600" fill="url(#mhHeroDotsMajor)"/>
  <g><circle cx="24.6" cy="402.8" r="1.1" fill="#E6EDF7" fill-opacity="0.073"/><circle cx="578.4" cy="461.9" r="1.4" fill="#E6EDF7" fill-opacity="0.078"/><circle cx="40.6" cy="176.7" r="1.1" fill="#E6EDF7" fill-opacity="0.072"/><circle cx="1131.2" cy="89.2" r="0.6" fill="#E6EDF7" fill-opacity="0.082"/><circle cx="120.1" cy="581.2" r="0.8" fill="#E6EDF7" fill-opacity="0.052"/><circle cx="472.8" cy="82.2" r="0.5" fill="#E6EDF7" fill-opacity="0.037"/><circle cx="164.5" cy="222.3" r="1.4" fill="#E6EDF7" fill-opacity="0.052"/><circle cx="363.2" cy="266.6" r="1.9" fill="#E6EDF7" fill-opacity="0.037"/><circle cx="895.6" cy="24.3" r="1.6" fill="#E6EDF7" fill-opacity="0.059"/><circle cx="658.9" cy="538.9" r="1.1" fill="#E6EDF7" fill-opacity="0.064"/><circle cx="1100.3" cy="268.8" r="1.5" fill="#E6EDF7" fill-opacity="0.080"/><circle cx="126.3" cy="464.9" r="0.6" fill="#E6EDF7" fill-opacity="0.067"/><circle cx="155.9" cy="411.9" r="1.9" fill="#E6EDF7" fill-opacity="0.054"/><circle cx="572.5" cy="440.4" r="1.2" fill="#E6EDF7" fill-opacity="0.051"/><circle cx="88.7" cy="450.2" r="1.5" fill="#E6EDF7" fill-opacity="0.051"/><circle cx="109.9" cy="5.4" r="1.5" fill="#E6EDF7" fill-opacity="0.032"/><circle cx="938.8" cy="364" r="1.8" fill="#E6EDF7" fill-opacity="0.061"/><circle cx="46.1" cy="1.9" r="0.8" fill="#E6EDF7" fill-opacity="0.041"/><circle cx="312.5" cy="502.3" r="0.5" fill="#E6EDF7" fill-opacity="0.070"/><circle cx="873.6" cy="531.1" r="1.8" fill="#E6EDF7" fill-opacity="0.067"/><circle cx="829" cy="310.6" r="1.7" fill="#E6EDF7" fill-opacity="0.050"/><circle cx="1034.6" cy="281.2" r="1.9" fill="#E6EDF7" fill-opacity="0.042"/><circle cx="182.3" cy="191.9" r="1.9" fill="#E6EDF7" fill-opacity="0.060"/><circle cx="712.5" cy="286.8" r="0.9" fill="#E6EDF7" fill-opacity="0.075"/><circle cx="818.8" cy="490.2" r="0.8" fill="#E6EDF7" fill-opacity="0.034"/><circle cx="954.5" cy="434.2" r="1" fill="#E6EDF7" fill-opacity="0.041"/><circle cx="97.6" cy="508.3" r="1.7" fill="#E6EDF7" fill-opacity="0.062"/><circle cx="519.8" cy="7.6" r="0.9" fill="#E6EDF7" fill-opacity="0.042"/><circle cx="581.3" cy="200" r="1.5" fill="#E6EDF7" fill-opacity="0.036"/><circle cx="612.3" cy="580.3" r="1.2" fill="#E6EDF7" fill-opacity="0.074"/><circle cx="302.1" cy="139.6" r="1.6" fill="#E6EDF7" fill-opacity="0.060"/><circle cx="1115.6" cy="334.1" r="1.7" fill="#E6EDF7" fill-opacity="0.075"/><circle cx="786.4" cy="365.6" r="0.7" fill="#E6EDF7" fill-opacity="0.061"/><circle cx="562.1" cy="66.7" r="1.1" fill="#E6EDF7" fill-opacity="0.046"/><circle cx="813.2" cy="472.2" r="0.6" fill="#E6EDF7" fill-opacity="0.068"/><circle cx="267" cy="68.3" r="0.5" fill="#E6EDF7" fill-opacity="0.040"/><circle cx="637.5" cy="125.1" r="0.5" fill="#E6EDF7" fill-opacity="0.079"/><circle cx="1106.6" cy="388.3" r="1.2" fill="#E6EDF7" fill-opacity="0.042"/><circle cx="421.1" cy="325.1" r="1.3" fill="#E6EDF7" fill-opacity="0.037"/><circle cx="1142.9" cy="409.5" r="1.1" fill="#E6EDF7" fill-opacity="0.064"/><circle cx="600.1" cy="190" r="1.1" fill="#E6EDF7" fill-opacity="0.046"/><circle cx="28.4" cy="154.2" r="0.7" fill="#E6EDF7" fill-opacity="0.076"/><circle cx="635.1" cy="235.5" r="0.8" fill="#E6EDF7" fill-opacity="0.065"/><circle cx="744.4" cy="465.8" r="1.5" fill="#E6EDF7" fill-opacity="0.063"/><circle cx="1077.4" cy="417.8" r="1.6" fill="#E6EDF7" fill-opacity="0.063"/><circle cx="1078.8" cy="444" r="0.8" fill="#E6EDF7" fill-opacity="0.079"/><circle cx="1104.9" cy="142.6" r="1.7" fill="#E6EDF7" fill-opacity="0.059"/><circle cx="106.6" cy="132.2" r="1.9" fill="#E6EDF7" fill-opacity="0.075"/><circle cx="982.3" cy="406.7" r="1.3" fill="#E6EDF7" fill-opacity="0.037"/><circle cx="985.9" cy="28.4" r="1.1" fill="#E6EDF7" fill-opacity="0.067"/><circle cx="819.2" cy="496.3" r="1" fill="#E6EDF7" fill-opacity="0.055"/><circle cx="758" cy="482.8" r="1.9" fill="#E6EDF7" fill-opacity="0.057"/><circle cx="631.5" cy="260.4" r="0.7" fill="#E6EDF7" fill-opacity="0.047"/><circle cx="84.3" cy="58.3" r="1.5" fill="#E6EDF7" fill-opacity="0.079"/><circle cx="1195.4" cy="425.8" r="1.5" fill="#E6EDF7" fill-opacity="0.069"/><circle cx="671" cy="111.2" r="0.7" fill="#E6EDF7" fill-opacity="0.069"/><circle cx="778.9" cy="330.2" r="1.3" fill="#E6EDF7" fill-opacity="0.062"/><circle cx="1181" cy="275.4" r="1.7" fill="#E6EDF7" fill-opacity="0.040"/><circle cx="331.9" cy="575.3" r="1.1" fill="#E6EDF7" fill-opacity="0.076"/><circle cx="940.9" cy="392.7" r="1" fill="#E6EDF7" fill-opacity="0.080"/><circle cx="434.7" cy="558.2" r="1.8" fill="#E6EDF7" fill-opacity="0.039"/><circle cx="286" cy="127.3" r="1.3" fill="#E6EDF7" fill-opacity="0.073"/><circle cx="757.3" cy="540.7" r="1" fill="#E6EDF7" fill-opacity="0.060"/><circle cx="271.1" cy="364.2" r="0.6" fill="#E6EDF7" fill-opacity="0.069"/><circle cx="861.5" cy="230.3" r="1.3" fill="#E6EDF7" fill-opacity="0.071"/><circle cx="992.4" cy="200.3" r="0.9" fill="#E6EDF7" fill-opacity="0.072"/><circle cx="1158.9" cy="290.7" r="1.3" fill="#E6EDF7" fill-opacity="0.059"/><circle cx="90.6" cy="414.4" r="0.5" fill="#E6EDF7" fill-opacity="0.044"/><circle cx="439" cy="165.1" r="1" fill="#E6EDF7" fill-opacity="0.068"/><circle cx="1110.9" cy="580.6" r="1.1" fill="#E6EDF7" fill-opacity="0.066"/><circle cx="712.6" cy="44.7" r="1.1" fill="#E6EDF7" fill-opacity="0.053"/><circle cx="915" cy="423.6" r="1.6" fill="#E6EDF7" fill-opacity="0.075"/><circle cx="521.9" cy="512.6" r="0.9" fill="#E6EDF7" fill-opacity="0.051"/><circle cx="995.1" cy="8.5" r="1.7" fill="#E6EDF7" fill-opacity="0.076"/><circle cx="457.6" cy="267.2" r="0.8" fill="#E6EDF7" fill-opacity="0.054"/><circle cx="288.9" cy="557.9" r="1.2" fill="#E6EDF7" fill-opacity="0.071"/><circle cx="1151.1" cy="181.1" r="1" fill="#E6EDF7" fill-opacity="0.065"/><circle cx="137.6" cy="57.2" r="1.9" fill="#E6EDF7" fill-opacity="0.068"/><circle cx="180.6" cy="425.8" r="1.3" fill="#E6EDF7" fill-opacity="0.066"/><circle cx="506.1" cy="546.7" r="0.6" fill="#E6EDF7" fill-opacity="0.053"/></g>
  <g fill="none" stroke="#E6EDF7" stroke-linecap="round">
    <rect x="22" y="22" width="1156" height="556" stroke-opacity="0.3" stroke-width="2.5"/>
    <g stroke-opacity="0.22" stroke-width="2.5"><path d="M24,68 A46,46 0 0 1 68,24"/><path d="M1176,68 A46,46 0 0 0 1132,24"/><path d="M24,532 A46,46 0 0 0 68,576"/><path d="M1176,532 A46,46 0 0 1 1132,576"/></g>
    <g stroke-opacity="0.26" stroke-width="2">
      <path d="M8,24 L8,8 L24,8"/><path d="M1176,8 L1192,8 L1192,24"/>
      <path d="M8,576 L8,592 L24,592"/><path d="M1176,592 L1192,592 L1192,576"/>
    </g>
  </g>
  <g class="mh-hero__radar">
    <circle cx="900" cy="310" r="210.6" fill="#07101C" fill-opacity="0.62"/>
    <g stroke="#22D3EE" stroke-opacity="0.09" stroke-width="1">
      <line x1="689.4" y1="310" x2="1110.6" y2="310"/>
      <line x1="900" y1="99.4" x2="900" y2="520.6"/>
    </g>
    <g stroke="#22D3EE" stroke-opacity="0.26" stroke-width="1.4"><line x1="1098.9" y1="310" x2="1107.9" y2="310"/><line x1="1095.9" y1="344.5" x2="1100.3" y2="345.3"/><line x1="1086.9" y1="378" x2="1091.1" y2="379.6"/><line x1="1072.3" y1="409.5" x2="1076.1" y2="411.7"/><line x1="1052.4" y1="437.9" x2="1055.8" y2="440.7"/><line x1="1027.9" y1="462.4" x2="1030.7" y2="465.8"/><line x1="999.5" y1="482.3" x2="1001.7" y2="486.1"/><line x1="968" y1="496.9" x2="969.6" y2="501.1"/><line x1="934.5" y1="505.9" x2="935.3" y2="510.3"/><line x1="900" y1="508.9" x2="900" y2="517.9"/><line x1="865.5" y1="505.9" x2="864.7" y2="510.3"/><line x1="832" y1="496.9" x2="830.4" y2="501.1"/><line x1="800.6" y1="482.3" x2="798.3" y2="486.1"/><line x1="772.1" y1="462.4" x2="769.3" y2="465.8"/><line x1="747.6" y1="437.9" x2="744.2" y2="440.7"/><line x1="727.7" y1="409.5" x2="723.9" y2="411.7"/><line x1="713.1" y1="378" x2="708.9" y2="379.6"/><line x1="704.1" y1="344.5" x2="699.7" y2="345.3"/><line x1="701.1" y1="310" x2="692.1" y2="310"/><line x1="704.1" y1="275.5" x2="699.7" y2="274.7"/><line x1="713.1" y1="242" x2="708.9" y2="240.4"/><line x1="727.7" y1="210.5" x2="723.9" y2="208.3"/><line x1="747.6" y1="182.1" x2="744.2" y2="179.3"/><line x1="772.1" y1="157.6" x2="769.3" y2="154.2"/><line x1="800.6" y1="137.7" x2="798.3" y2="133.9"/><line x1="832" y1="123.1" x2="830.4" y2="118.9"/><line x1="865.5" y1="114.1" x2="864.7" y2="109.7"/><line x1="900" y1="111.1" x2="900" y2="102.1"/><line x1="934.5" y1="114.1" x2="935.3" y2="109.7"/><line x1="968" y1="123.1" x2="969.6" y2="118.9"/><line x1="999.5" y1="137.7" x2="1001.7" y2="133.9"/><line x1="1027.9" y1="157.6" x2="1030.7" y2="154.2"/><line x1="1052.4" y1="182.1" x2="1055.8" y2="179.3"/><line x1="1072.3" y1="210.5" x2="1076.1" y2="208.3"/><line x1="1086.9" y1="242" x2="1091.1" y2="240.4"/><line x1="1095.9" y1="275.5" x2="1100.3" y2="274.7"/></g>
    <circle class="mh-hero__outer" cx="900" cy="310" r="200.7" fill="none" stroke="#22D3EE" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="2 10"/>
    <circle cx="900" cy="310" r="122.4" fill="none" stroke="#22D3EE" stroke-opacity="0.1" stroke-width="1" stroke-dasharray="2 12"/>
    <path d="M1080.3,310L1081.9,325.7L1080,341.3L1075,356.2L1070.4,371.1L1063.6,385.1L1054.5,397.9L1045.5,410.4L1036.9,423.2L1026.5,434.6L1014.7,444.6L1002.5,454.2L989.6,462.9L975.6,469.8L961.2,475.6L946.5,480.8L931,483.3L915.6,485.9L900,486.5L884.4,485.5L868.5,486.1L852.9,483.3L837.7,478.6L822.9,472.9L809.4,464.6L796.3,455.9L784.6,445.5L773.2,434.9L762.4,423.7L752.4,411.8L744,398.7L737.5,384.6L730.2,370.9L726.8,355.7L723.2,340.7L721.7,325.4L720.6,310L721.7,294.6L724.9,279.6L726.4,264.2L730.8,249.4L737.1,235.2L742.6,220.5L752.3,208.2L760.9,195.1L772.4,184.3L784.1,174L796.7,164.7L809.5,155.5L823.9,149.2L838,142.2L853,137.3L868.5,133.8L884.3,133.4L900,132.1L915.6,134.1L931.2,136L946,141L961.1,144.6L975.3,150.9L989.7,156.9L1003.2,164.8L1015.1,174.9L1026.9,185L1038,195.9L1047.9,208L1057.1,220.6L1064.3,234.5L1068.1,249.7L1072.8,264.4L1076.8,279.3L1081.3,294.4Z" fill="none" stroke="#E6EDF7" stroke-opacity="0.19" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M1025.04,180.52A180.00,180.00 0 1 1 961.56,140.86" fill="none" stroke="#22D3EE" stroke-width="4"/>
    <g class="mh-hero__sweep">
      <path d="M0,0L161,-78.5A179.1,179.1 0 0 1 161,78.5Z" fill="#22D3EE" fill-opacity="0.042"/>
      <line x1="0" y1="0" x2="198" y2="0" stroke="#22D3EE" stroke-opacity="0.5" stroke-width="1.6"/>
      <circle cx="198" cy="0" r="3" fill="#22D3EE" fill-opacity="0.9"/>
    </g>
    <path class="mh-hero__trail" d="M900,219.4L906.4,218.1L913.1,216.5L920.2,214.6L927.7,212.7L935.7,211L944.2,209.8L952.8,209.3L961.5,209.9L969.9,211.7L977.7,214.8L984.6,219.3L990.4,225.1L994.8,231.8L997.8,239.4L999.5,247.5L999.8,255.8L999.2,264L997.9,271.9L996.2,279.3L994.4,286.2L992.9,292.6L991.9,298.6L991.5,304.4L991.6,310L992.2,315.7L993.2,321.5L994.3,327.6L995.2,334L995.7,340.5L995.6,347.2L994.8,353.9L993.1,360.5L990.6,366.9L987.3,373L983.3,378.7L978.8,384L973.8,389.1L968.5,393.9L962.9,398.4L957,402.8L950.9,407.1L944.5,411.1L937.8,414.8L930.8,418L923.4,420.5L915.7,422.2L907.9,422.9L900,422.4L892.3,420.7L884.9,417.8L878,413.8L871.8,408.9L866.3,403.3L861.5,397.4L857.3,391.4L853.5,385.7L849.9,380.5L846.2,375.9L842.2,372L837.6,368.6L832.4,365.7L826.5,363L819.9,360.3L812.8,357.3L805.5,353.8L798.3,349.6L791.6,344.6L785.8,338.8L781.1,332.2L777.8,325.1L775.9,317.6L775.6,310L776.7,302.4L779.1,295L782.4,288L786.6,281.4L791.2,275.3L796.1,269.5L801.1,264.1L806.1,259L811,254.1L815.9,249.4L820.9,244.8L826,240.5L831.4,236.4L837,232.8L842.9,229.6L849,227L855.4,225L861.9,223.5L868.4,222.5L874.9,221.9L881.2,221.4L887.5,220.9L893.7,220.3L900,219.4Z" fill="none" stroke="#FF7A59" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.22" stroke-dasharray="3 11"/>
    <g transform="translate(900 219.4)"><circle class="mh-hero__ping mh-hero__ping--0" cx="0" cy="0" r="14" fill="none" stroke="#FF7A59" stroke-opacity="0" stroke-width="2.6"/></g>
    <g transform="translate(993.1 360.5)"><circle class="mh-hero__ping mh-hero__ping--1" cx="0" cy="0" r="14" fill="none" stroke="#FF7A59" stroke-opacity="0" stroke-width="2.6"/></g>
    <g transform="translate(812.8 357.3)"><circle class="mh-hero__ping mh-hero__ping--2" cx="0" cy="0" r="14" fill="none" stroke="#FF7A59" stroke-opacity="0" stroke-width="2.6"/></g>
    <g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h1" transform="translate(868.2 248.1)">
      <circle r="13" fill="none" stroke="#A79BFF" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="#A79BFF"/>
    </g>
    <g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h2" transform="translate(868.6 244.3)">
      <circle r="13" fill="none" stroke="#A79BFF" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="#A79BFF"/>
    </g>
    <g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h3" transform="translate(834.5 267.5)">
      <circle r="13" fill="none" stroke="#A79BFF" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="#A79BFF"/>
    </g>
    <g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h4" transform="translate(842.5 256)">
      <circle r="13" fill="none" stroke="#A79BFF" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="#A79BFF"/>
    </g>
    <g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h5" transform="translate(810 302.6)">
      <circle r="13" fill="none" stroke="#A79BFF" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="#A79BFF"/>
    </g>
    <g class="mh-hero__dot mh-hero__dot--prey" transform="translate(900 219.4)">
      <circle r="17" fill="none" stroke="#FF7A59" stroke-opacity="0.5" stroke-width="2"/>
      <circle r="9.5" fill="#FF7A59"/>
    </g>
  </g>
</svg>
    <span class="mh-hero__wordmark" role="img" aria-label="ManHunt">
      <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 100"><title>MANHUNT</title><path transform="translate(0 0)" d="M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z" fill="#E6EDF7"/><path transform="translate(86 0)" d="M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z" fill="#E6EDF7"/><path transform="translate(164 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(242 0)" d="M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z" fill="#E6EDF7"/><path transform="translate(316 0)" d="M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z" fill="#E6EDF7" fill-rule="evenodd"/><path transform="translate(394 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(472 0)" d="M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z" fill="#E6EDF7"/></svg>
    </span>
    <span class="mh-hero__rule" aria-hidden="true"></span>
    <h1 class="mh-hero__hook" id="mh-hero-title">Hide from <br>your friends.</h1>
    <p class="mh-hero__desc">Real-world GPS hide-and-seek for Android.</p>
    <p class="mh-hero__legend" aria-hidden="true"><span><i style="background:#FF7A59"></i>PREY</span><span><i style="background:#A79BFF"></i>HUNTERS</span></p>
    <p class="mh-hero__micro">free APK · Android 8+ · not on Play Store</p>
  </div>
</section>

<section class="lead" aria-labelledby="lead-title">
  <div class="lead-copy">
    <span class="eyebrow">REAL-WORLD HIDE-AND-SEEK</span>
    <h2 class="lead-title" id="lead-title">Two sides.<br>One street.<br>No place to hide forever.</h2>
    <p class="pitch">Prey hide while their phones report position. Hunters follow the latest reports
    on a live map and tag them in person. One server keeps the clock, the teams and the tag rules
    fair.</p>
    <div class="lead-actions">
      <a class="button" href="#download">Download free APK</a>
      <a class="button button-ghost" href="#watch">Watch 60s</a>
    </div>
    <p class="hint">ManHunt needs at least two Android phones in one place. Send this page to the
    group chat, then pick sides.</p>
  </div>
  <aside class="lead-panel" aria-label="Field notes">
    <span class="panel-kicker">OPEN ZONE / FIELD NOTES</span>
    <ul class="field-notes">
      <li><b>Prey</b><span>Hide in the real world and survive the clock.</span></li>
      <li><b>Hunters</b><span>Read the latest reports, move, and tag in person.</span></li>
      <li><b>Server</b><span>Owns timers, tag claims and who can see what.</span></li>
    </ul>
  </aside>
</section>

${statsBlock}

<section class="section split" id="watch" aria-labelledby="watch-title">
  <a class="media-cover" href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4" title="Watch the 60-second ManHunt explainer">
    <img src="/media/explainer-cover.png" alt="ManHunt 60-second explainer cover — Hide from your friends" loading="lazy">
  </a>
  <div class="section-copy">
    <span class="eyebrow">THE 60-SECOND VERSION</span>
    <h2 id="watch-title">See the whole hunt.</h2>
    <p>The hook, the two sides, how phones report position, how Hunters read the last report, how
    tagging works, and the two-phone setup — explained in one minute.</p>
    <div class="inline-links">
      <a href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4">Watch the 60s film ↗</a>
      <a href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_15s_1080x1920.mp4">15s hook</a>
      <a href="https://github.com/MostafaAshry513/ManHunt">Source &amp; releases</a>
    </div>
    <p class="fine">Fully animated. Original geometry and score; no stock footage or real people.</p>
  </div>
</section>

<section class="section" id="screens" aria-labelledby="screens-title">
  <div class="section-head">
    <span class="eyebrow">IN THE APP</span>
    <h2 id="screens-title">Built for the street, not a menu.</h2>
    <p>Dark by default, Arabic and English, 48dp targets and a moving map that reads like a field radar.</p>
  </div>
  <div class="screen-grid">
    <figure><img src="/media/home.png" alt="Home: full-width Open Zone hero and host/join cards" loading="lazy"><figcaption><b>Home</b><span>Host or join</span></figcaption></figure>
    <figure><img src="/media/lobby.png" alt="Lobby: choose Prey or Hunters and ready up" loading="lazy"><figcaption><b>Lobby</b><span>Pick a side</span></figcaption></figure>
    <figure><img src="/media/roles.png" alt="Roles: how Prey and Hunters play" loading="lazy"><figcaption><b>Roles</b><span>Know the rules</span></figcaption></figure>
    <figure><img src="/media/chat.png" alt="Room chat with match updates" loading="lazy"><figcaption><b>Chat</b><span>Stay in touch</span></figcaption></figure>
    <figure><img src="/media/settings.png" alt="Settings: account, appearance, language, permissions and updates" loading="lazy"><figcaption><b>Settings</b><span>Your setup</span></figcaption></figure>
    <figure><img src="/media/result.png" alt="Hunt result dialog" loading="lazy"><figcaption><b>Result</b><span>Who won</span></figcaption></figure>
  </div>
</section>

<section class="section" id="how" aria-labelledby="how-title">
  <div class="section-head">
    <span class="eyebrow">HOW A HUNT RUNS</span>
    <h2 id="how-title">Two sides. One clock.</h2>
    <p>No gear, no fee, no referee required. The server handles the rules; the street handles the tension.</p>
  </div>
  <div class="side-grid">
    <article class="side-card prey">
      <span class="side-tag">PREY</span>
      <h3>Hide. Survive.</h3>
      <p>Your phone reports position to the Hunters at the interval the room set. Stay hidden until
      the clock stops — if at least one Prey is still free, Prey win.</p>
    </article>
    <article class="side-card hunters">
      <span class="side-tag">HUNTERS</span>
      <h3>Track. Tag.</h3>
      <p>Follow the latest reports and trails on the map. Find a Prey in the real world and tag
      them in person; the Prey confirms or disputes. Tag every Prey to win.</p>
    </article>
  </div>
  <ol class="flow">
    <li><b>01 / ROOM</b><span>Host creates a room, or everyone joins with a 6-character code.</span></li>
    <li><b>02 / SIDES</b><span>Pick Prey or Hunters. The host sets the clock, reports, trails and zone.</span></li>
    <li><b>03 / HUNT</b><span>Prey hide. Hunters chase reports. The server keeps the clock honest.</span></li>
    <li><b>04 / RESULT</b><span>All Prey tagged, or time runs out. History is kept; rematch when ready.</span></li>
  </ol>
</section>

<section class="section" id="features" aria-labelledby="features-title">
  <div class="section-head">
    <span class="eyebrow">WHY IT WORKS</span>
    <h2 id="features-title">Small rules. Real tension.</h2>
  </div>
  <div class="feature-grid">
    <article class="feature"><h3>Server-authoritative</h3><p>Timers, phases, tag outcomes and victory are decided and stored on the server. The app sends intents, never the truth.</p></article>
    <article class="feature"><h3>Latest-report map</h3><p>Hunters see the last report and optional trails, not a perfect live feed. Positions stay hidden from Prey.</p></article>
    <article class="feature"><h3>Fair tag flow</h3><p>Hunter claims, Prey confirms or disputes, Huntmaster resolves. Duplicate claims cannot double-apply.</p></article>
    <article class="feature"><h3>Built to recover</h3><p>Reconnects, restarts and flaky signal do not break the round. Pause/resume shifts the clock correctly.</p></article>
    <article class="feature"><h3>Yours to host</h3><p>One Node process, one SQLite file, no Docker, no paid map or push service. Read the deployment guide and run it yourself.</p></article>
    <article class="feature"><h3>Made for everyone</h3><p>English and Arabic with full RTL, dark-first UI, adjustable text size and 48dp controls.</p></article>
  </div>
</section>

  <section class="card" id="download" aria-labelledby="download-heading">
    <h2 id="download-heading">Download for Android</h2>
    <div class="chips">
        ${chips}
    </div>
    <a class="button" href="${escapeHtml(downloadHref)}">Download APK${version ? ` v${escapeHtml(version)}` : ''}</a>
      ${details}
    ${serverBlock}
  </section>

  <section class="card" id="install">
    <h2>Install in four steps</h2>
    <ol class="steps">
      <li><b>Download</b> the APK on the Android phone you will play on.</li>
      <li><b>Allow unknown sources</b> when Android asks. If it does not ask: Settings &rarr;
        Apps &rarr; Special app access &rarr; Install unknown apps, then allow your browser.</li>
      <li><b>Open the file and install.</b> Play Protect may warn about a sideloaded app — choose
        &ldquo;Install anyway&rdquo; only if you trust this project.</li>
      <li><b>Open ManHunt and sign in.</b> Create a local account (no email needed) and use the
        server shown above.</li>
    </ol>
  </section>

  <section class="card" id="privacy">
    <h2>Privacy &amp; safety</h2>
    <ul class="notes">
      <li>Your position is shown only to the <b>Hunters in your room</b> while a match is running.
        Admins get no extra location access.</li>
      <li>Location reports are sent by a foreground service with a visible notification. Movement
        history is available to Hunters only when the host turns trails on.</li>
      <li>There is no email address and <b>no password recovery</b> — keep your password safe.</li>
      <li>This is a <b>test server on plain HTTP</b>: traffic is not encrypted. Do not use it for
        real sensitive location data; self-host behind HTTPS for that.</li>
      <li>ManHunt is a game, not a safety or tracking service. Play with people you trust.</li>
    </ul>
  </section>

  <section class="section" id="faq" aria-labelledby="faq-title">
  <div class="section-head">
    <span class="eyebrow">BEFORE YOU PLAY</span>
    <h2 id="faq-title">The honest answers.</h2>
  </div>
  <div class="faq">
    <details>
      <summary>Is ManHunt free?</summary>
      <p>Yes. The APK is free to download and the server is MIT-licensed. You can play on the hosted test server or run the backend yourself.</p>
    </details>
    <details>
      <summary>Why is it not on Google Play?</summary>
      <p>ManHunt is distributed as a signed, sideloaded APK. That means allowing installs from your browser and possibly seeing a Play Protect warning. The release and its SHA-256 are published on GitHub.</p>
    </details>
    <details>
      <summary>How many phones do we need?</summary>
      <p>At least two, and everyone should be in the same physical area. One device hosts the room and shares the 6-character code; the others join and pick a side.</p>
    </details>
    <details>
      <summary>Who can see my location?</summary>
      <p>Only the Hunters in your room, during the hunting phase, see your latest report. Prey never see locations, and admins get no extra location access. Location history is shown only when the host enables trails.</p>
    </details>
    <details>
      <summary>Is the hosted server safe for real games?</summary>
      <p>It is a plain-HTTP test server with no availability guarantee and no account recovery. Use it for test games; for anything sensitive, self-host behind HTTPS and play with people you trust.</p>
    </details>
  </div>
</section>
<footer class="footer">
    <p><a href="https://github.com/MostafaAshry513/ManHunt/releases/latest">GitHub release</a> ·
      <a href="https://github.com/MostafaAshry513/ManHunt">source code</a> ·
      <a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/DEPLOYMENT.md">self-hosting guide</a> ·
      <a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/brand/README.md">brand kit</a></p>
    <p class="fine">MIT licensed · Map data &copy; OpenStreetMap contributors · free APK, not on Google Play</p>
  </footer>
</main>
</body>
</html>`;
}

/** Landing page for a shared invite link: /join?code=ABC123. */
function renderJoinPage(code: string, serverUrl: string): string {
  const safeCode = escapeHtml(code || '—');
  const hash = code ? `code=${encodeURIComponent(code)}` : 'code=';
  const intent = `intent://join?${hash}#Intent;scheme=manhunt;package=com.manhunt.app;S.browser_fallback_url=${encodeURIComponent(
    `${serverUrl}/app.apk`,
  )};end`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Join a ManHunt room</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1220;color:#e6edf7}
  main{max-width:560px;margin:0 auto;padding:40px 22px 64px}
  .badge{display:inline-block;font-weight:700;letter-spacing:.12em;font-size:12px;color:#22d3ee;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:4px 10px}
  h1{font-size:34px;line-height:1.15;margin:16px 0 8px}
  p{color:#9fb0c9}
  .code{margin:26px 0;padding:18px;border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.08);border-radius:16px;text-align:center}
  .code b{display:block;font-size:34px;letter-spacing:.28em;color:#67e8f9;margin-top:6px}
  a.button{display:block;text-align:center;text-decoration:none;font-weight:700;color:#04121a;background:#22d3ee;border-radius:14px;padding:15px 20px;margin:14px 0}
  a.ghost{display:block;text-align:center;text-decoration:none;font-weight:600;color:#67e8f9;border:1px solid rgba(34,211,238,.4);border-radius:14px;padding:13px 20px;margin:10px 0}
  .fine{font-size:12px;color:#7f90a8;margin-top:26px;text-align:center}
</style>
</head>
<body>
<main>
  <span class="badge">MANHUNT</span>
  <h1>You're invited to a hunt</h1>
  <p>Open the app to join the room automatically, or install ManHunt first and enter the code.</p>
  <div class="code">Room code<b>${safeCode}</b></div>
  <a class="button" href="${escapeHtml(intent)}">Open ManHunt</a>
  <a class="ghost" href="/app.apk">Download ManHunt APK</a>
  <a class="ghost" href="https://github.com/MostafaAshry513/ManHunt">GitHub / source</a>
  <p class="fine">Or open ManHunt and join with the code above. The game server is ${escapeHtml(serverUrl)}.</p>
</main>
</body>
</html>`;
}

