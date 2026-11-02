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

  // Small, fixed set of landing-page images and self-hosted OFL fonts. Allowlisted so the public
  // route can never read arbitrary files from the server. Everything is same-origin: the page has
  // no remote assets and no third-party requests.
  const siteMedia: Record<string, string> = {
    'auth.png': 'image/png',
    'home.png': 'image/png',
    'lobby.png': 'image/png',
    'roles.png': 'image/png',
    'chat.png': 'image/png',
    'settings.png': 'image/png',
    'result.png': 'image/png',
    'explainer-cover.png': 'image/png',
    'explainer-cover.webp': 'image/webp',
    'explainer-cover.jpg': 'image/jpeg',
    // Web-optimised premium phone captures (page-size WebP + JPEG fallback).
    'shot-home.webp': 'image/webp',
    'shot-home.jpg': 'image/jpeg',
    'shot-lobby.webp': 'image/webp',
    'shot-lobby.jpg': 'image/jpeg',
    'shot-hunt.webp': 'image/webp',
    'shot-hunt.jpg': 'image/jpeg',
    'shot-extra.webp': 'image/webp',
    'shot-extra.jpg': 'image/jpeg',
    'shot-result.webp': 'image/webp',
    'shot-result.jpg': 'image/jpeg',
    'map-hero.webp': 'image/webp',
    'map-hero.jpg': 'image/jpeg',
    'map-band.webp': 'image/webp',
    'map-band.jpg': 'image/jpeg',
    'big-shoulders-700.woff2': 'font/woff2',
    'instrument-sans-400.woff2': 'font/woff2',
    'instrument-sans-700.woff2': 'font/woff2',
    'red-hat-mono-400.woff2': 'font/woff2',
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
      .header('content-security-policy', "default-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
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
 * The install page: a match-poster landing page for the free sideloaded APK.
 * Metadata (version, size, checksum, download) is read from the update manifest on every request;
 * everything else is static, dependency-free markup so the page works on any phone. No JavaScript.
 * Design source: design/site-redesign/ (concept.md, tokens.md, refs/site-ref.html) - regenerate this
 * function with design/site-redesign/tools/build-page.mjs rather than hand-editing the markup.
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
  const downloadLabel = `Download the APK${version ? ` \u00b7 v${escapeHtml(version)}` : ''}`;
  const metaVersion = version ? `v${escapeHtml(version)}` : '\u2014';
  const metaSize = size ? escapeHtml(size) : '\u2014';
  const metaPublished = published ? escapeHtml(published) : '\u2014';
  const heroMeta = [
    '<span>Free APK</span>',
    version ? `<span>v${escapeHtml(version)}</span>` : '',
    size ? `<span>${escapeHtml(size)}</span>` : '',
    '<span>Android 8.0+</span>',
    '<span>Not on Play Store</span>',
  ].filter(Boolean).join('');

  const hashBlock = sha
    ? `<dl class="pass__hash"><dt>SHA-256</dt><code>${escapeHtml(sha)}</code></dl>`
    : '<p class="pass__hint">No checksum has been published for this build.</p>';

  const serverBlock = serverUrl
    ? `<p class="pass__server"><span class="state"><b></b>This server</span><code>${escapeHtml(serverUrl)}</code></p>
          <p class="pass__hint">The build offered here is already pointed at this server. Self-hosting? Set your own address on the app's sign-in screen after installing.</p>`
    : '<p class="pass__hint">Set the server address on the app\'s sign-in screen after installing.</p>';

  const releaseNote = manifest === null
    ? '<p class="pass__fallback">Release details are not published on this server yet \u2014 the download below is the latest available build.</p>'
    : '';

  const zeroAccountStat = '<div class="fixture__stat"><b>0</b><span class="data-sm">ads, ever</span></div>';
  const statsBlock = stats.totalAccounts > 0
    ? `<div class="fixture__stats">
        <div class="fixture__stat"><b>${stats.totalAccounts}</b><span class="data-sm">accounts started</span></div>
        <div class="fixture__stat"><b class="plus">+${stats.newAccounts}</b><span class="data-sm">new this week</span></div>
        ${zeroAccountStat}
      </div>`
    : `<div class="fixture__stats">
        <div class="fixture__stat"><b>MIT</b><span class="data-sm">licensed source</span></div>
        ${zeroAccountStat}
      </div>`;

  // Real premium captures (design/redesign/screenshot-shotlist.md, captured from the running app).
  // Order = visual order; the hunt screen leads because it is the product's signature surface.
  // PENDING: the result captures (s12/s13) are blocked by an app snapshot bug and must not be shown;
  // add { img: 'result', label: 'Result', caption: 'Who won, and why', ... } here when
  // docs/screenshots/premium/s12-result-hunters.png exists and tools/optimize-assets.ps1 has
  // generated shot-result.webp/.jpg (plus the two allowlist lines in server/src/app.ts).
  const SCREENS = [
    {
      img: 'hunt',
      label: 'Hunt',
      caption: 'The live map — zone, reports, trail',
      w: 900, h: 2000,
      alt: 'Live hunt screen: real OpenStreetMap tiles with the 240 metre zone, a fresh and a stale prey report, a coral trail and the server clock at 41:12.',
    },
    {
      img: 'home',
      label: 'Home',
      caption: 'Host or join in two taps',
      w: 900, h: 2000,
      alt: 'Home screen: the Open Zone brand hero with the host-a-hunt and join-a-hunt actions.',
    },
    {
      img: 'lobby',
      label: 'Lobby',
      caption: 'Pick a side, ready up',
      w: 900, h: 2000,
      alt: 'Lobby screen: Riverside Run with five players split into Prey and Hunters, all ready.',
    },
    {
      img: 'extra',
      label: 'Chat',
      caption: 'The room, in one place',
      w: 900, h: 2000,
      alt: 'Room chat during a live Riverside Run hunt: player messages, match updates and the compose field.',
    },
    {
      img: 'result',
      label: 'Result',
      caption: 'Full time — who won',
      w: 900, h: 2000,
      alt: 'Full-screen hunt result: FULL TIME after 18:48 played, prey 0 of 2 remaining, “Hunters win.”',
    },
  ];
  const screensBlock = SCREENS.map((shot) =>
    '<figure class="screen">' +
    '<span class="screen__frame"><picture><source srcset="/media/shot-' + shot.img + '.webp" type="image/webp">' +
    '<img src="/media/shot-' + shot.img + '.jpg" decoding="async" alt="' + shot.alt +
    '" width="' + shot.w + '" height="' + shot.h + '"></picture></span>' +
    '<figcaption><b>' + shot.label + '</b><span>' + shot.caption + '</span></figcaption>' +
    '</figure>',
  ).join('\n            ');
  const screensClass = 'screens--' + SCREENS.length;

  // og:image must be absolute for social scrapers.
  const ogImageUrl = `${(serverUrl || '').replace(/\/$/, '')}/og-image.png`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0B1220">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preload" href="/media/big-shoulders-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/media/map-hero.webp" as="image" type="image/webp">
<meta name="description" content="Real-world GPS hide-and-seek for Android. Two teams, one street, one clock the players cannot bend. Free APK, Android 8.0+, not on Play Store.">
<meta property="og:type" content="website">
<meta property="og:title" content="ManHunt \u2014 hide from your friends.">
<meta property="og:description" content="Real-world hide-and-seek for Android. Prey hide, Hunters track on a live map and tag in person. Free APK.">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<title>ManHunt \u2014 hide from your friends</title>
<style>
/* ==========================================================================
   ManHunt site — design reference. Same system as the approved app redesign
   (design/redesign/tokens.md): Big Shoulders / Instrument Sans / Red Hat Mono,
   flat fills, hairlines, radius 2, zero elevation, one cyan surface per view.
   ========================================================================== */
@font-face{
  font-family:"Big Shoulders Display";
  src:url("/media/big-shoulders-700.woff2") format("woff2");
  font-weight:700;font-style:normal;font-display:swap;
}
@font-face{
  font-family:"Instrument Sans";
  src:url("/media/instrument-sans-400.woff2") format("woff2");
  font-weight:400;font-style:normal;font-display:swap;
}
@font-face{
  font-family:"Instrument Sans";
  src:url("/media/instrument-sans-700.woff2") format("woff2");
  font-weight:700;font-style:normal;font-display:swap;
}
@font-face{
  font-family:"Red Hat Mono";
  src:url("/media/red-hat-mono-400.woff2") format("woff2");
  font-weight:400;font-style:normal;font-display:swap;
}

:root{
  color-scheme:dark;
  --field:#0B1220;
  --plate:#131C2E;
  --raised:#1D2840;
  --chalk:#E6EDF7;
  --muted:#A7B6CC;
  --dim:#7C8DA8;
  --hairline:#2A3550;
  --hairline-strong:#5E7198;
  --cyan:#22D3EE;
  --on-cyan:#04222B;
  --coral:#FF7A59;
  --violet:#A79BFF;

  --display:"Big Shoulders Display","Bahnschrift SemiCondensed","Roboto Condensed","Arial Narrow",sans-serif;
  --sans:"Instrument Sans","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;
  --mono:"Red Hat Mono",ui-monospace,"Cascadia Mono",Consolas,monospace;

  --gut:clamp(20px,4.4vw,64px);
  --rail:96px;
  --max:1360px;
  --gap:clamp(16px,2.4vw,32px);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;background:var(--field);color:var(--chalk);
  font:400 17px/1.55 var(--sans);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
::selection{background:var(--cyan);color:var(--on-cyan)}
img{max-width:100%;display:block}
a{color:inherit}
h1,h2,h3,h4,p,figure,ul,ol,dl,dd{margin:0}
ul,ol{padding:0}
svg{display:block}
:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
.skip{
  position:absolute;left:-9999px;top:0;z-index:100;background:var(--cyan);color:var(--on-cyan);
  font:700 14px/1 var(--sans);padding:14px 18px;text-decoration:none;
}
.skip:focus{left:12px;top:12px}

/* asphalt grain — the only texture, 2.4% over the field, never over text */
body::before{
  content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.024;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
}
.masthead,.hero,.band,.section,.pass,.footer{position:relative;z-index:1}

/* ------------------------------------------------------------------ primitives */
.rule{height:1px;background:rgba(230,237,247,.18);border:0}
.team{
  display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px 0 9px;
  border:1px solid currentColor;border-radius:2px;
  background:rgba(255,255,255,.04);
  font:700 13px/1 var(--sans);letter-spacing:.01em;
}
.team svg{width:16px;height:16px;flex:none}
.team--prey{color:var(--coral);background:rgba(255,122,89,.12)}
.team--hunters{color:var(--violet);background:rgba(167,155,255,.12)}
.state{
  display:inline-flex;align-items:center;gap:8px;
  font:400 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
}
.state b{width:6px;height:6px;background:var(--cyan);border-radius:50%;display:inline-block}
.state--live{color:var(--cyan)}
.data{font:400 12px/1.5 var(--mono);letter-spacing:.04em;color:var(--muted);font-variant-numeric:tabular-nums}
.data-sm{font:400 11px/1.5 var(--mono);letter-spacing:.04em;color:var(--dim)}
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;
  height:56px;padding:0 26px;border-radius:2px;border:1px solid transparent;
  font:700 15px/1 var(--sans);text-decoration:none;letter-spacing:.01em;
  transition:background-color .12s linear,color .12s linear,border-color .12s linear;
}
.btn--primary{background:var(--cyan);color:var(--on-cyan)}
.btn--primary:hover{background:var(--chalk);color:var(--field)}
.btn--primary:focus-visible{outline-color:var(--chalk)}
.btn--outline{background:transparent;border-color:var(--hairline-strong);color:var(--chalk)}
.btn--outline:hover{border-color:var(--chalk)}
.link{
  display:inline-block;color:var(--chalk);text-decoration:none;
  border-bottom:1px solid var(--hairline-strong);padding-bottom:2px;
  font:700 14px/1.3 var(--sans);
}
.link:hover{border-bottom-color:var(--chalk)}
.link:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
.running{
  display:flex;flex-direction:column;
  font:400 10.5px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim);
}
.running b{color:var(--muted);font-weight:400;margin-bottom:1px}
.running span{display:block;border-top:1px solid var(--hairline-strong);padding-top:7px;white-space:nowrap}

/* ------------------------------------------------------------------ masthead */
.masthead{
  position:sticky;top:0;z-index:40;
  background:var(--field);border-bottom:1px solid rgba(230,237,247,.16);
}
.masthead__in{
  max-width:var(--max);margin:0 auto;padding:0 var(--gut);
  height:62px;display:flex;align-items:center;gap:clamp(16px,3vw,40px);
}
.brand{display:flex;align-items:center;text-decoration:none;color:var(--chalk)}
.brand svg{height:32px;width:auto}
.nav{margin-left:auto;display:flex;align-items:center;gap:clamp(14px,2vw,28px)}
.nav a{
  font:700 14px/1 var(--sans);text-decoration:none;color:var(--chalk);
  padding:10px 0;position:relative;white-space:nowrap;
}
.nav a:not(.nav__cta)::after{
  content:"";position:absolute;left:0;right:0;bottom:4px;height:1px;background:var(--chalk);
  transform:scaleX(0);transform-origin:left;transition:transform .16s linear;
}
.nav a:not(.nav__cta):hover::after,.nav a:not(.nav__cta):focus-visible::after{transform:scaleX(1)}
.nav__cta{
  display:inline-flex;align-items:center;height:44px;padding:0 18px;
  border:1px solid var(--hairline-strong);border-radius:2px;
  font:700 13px/1 var(--sans);
}
.nav__cta:hover{border-color:var(--chalk)}

/* ------------------------------------------------------------------ hero */
.hero{
  max-width:var(--max);margin:0 auto;padding:0 var(--gut);
  display:grid;grid-template-columns:repeat(12,minmax(0,1fr));
  gap:var(--gap);align-items:stretch;
  min-height:clamp(620px,84vh,820px);
  border-bottom:1px solid rgba(230,237,247,.16);
}
.hero__copy{
  grid-column:1/7;display:flex;flex-direction:column;justify-content:center;
  padding:clamp(30px,4.2vw,60px) 0 clamp(24px,3vw,42px);
  position:relative;z-index:2;
}
.hero__kicker{
  display:flex;align-items:center;gap:14px;margin-bottom:clamp(16px,2.2vw,26px);
}
.hero__vs{font:400 11px/1 var(--mono);letter-spacing:.08em;color:var(--dim)}
h1.hero__title{
  font-family:var(--display);font-weight:700;text-transform:uppercase;
  font-size:clamp(58px,9.4vw,140px);line-height:.85;letter-spacing:.002em;
  margin:0 0 clamp(18px,2.6vw,30px);
}
.hero__title span{display:block;overflow:hidden}
.hero__title i{display:block;font-style:normal;transform:translateY(105%);white-space:nowrap;line-height:.85}
.hero__deck{
  max-width:34ch;color:var(--muted);font-size:clamp(17px,1.5vw,20px);line-height:1.55;
  margin-bottom:clamp(22px,2.8vw,34px);
}
.hero__deck b{color:var(--chalk);font-weight:400}
.hero__actions{display:flex;flex-wrap:wrap;align-items:center;gap:20px 26px}
.hero__honest{
  display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:clamp(20px,2.6vw,30px);
  padding-top:14px;border-top:1px solid rgba(230,237,247,.14);
}
.hero__honest span{display:inline-flex;align-items:center;gap:14px}
.hero__honest span+span::before{content:"";width:1px;height:11px;background:var(--hairline)}

.hero__plate{
  grid-column:7/13;position:relative;align-self:stretch;min-height:100%;
  margin-right:calc(var(--gut) * -1);
  border-left:1px solid rgba(230,237,247,.16);
  overflow:hidden;
}
.hero__plate img{
  position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 50%;
  opacity:0;animation:veil-in .6s linear .05s forwards;
}
.hero__plate::after{
  content:"";position:absolute;inset:0;background:rgba(11,18,32,.2);pointer-events:none;
}
.hero__hud{
  position:absolute;left:clamp(14px,1.8vw,24px);top:clamp(14px,1.8vw,22px);z-index:3;
  display:flex;align-items:flex-start;gap:clamp(16px,2.2vw,30px);
  padding:10px 14px 12px;background:rgba(11,18,32,.86);
  border:1px solid rgba(230,237,247,.2);border-radius:2px;
}
.hero__hud-clock{
  font-family:var(--display);font-weight:700;font-size:clamp(34px,3.2vw,50px);line-height:.88;
  font-variant-numeric:tabular-nums;letter-spacing:-.01em;
}
.hero__hud-meta{display:grid;gap:3px;margin-top:2px}
.hero__cap{
  position:absolute;left:clamp(14px,1.8vw,24px);right:clamp(14px,1.8vw,24px);bottom:clamp(12px,1.6vw,20px);z-index:3;
  display:flex;justify-content:space-between;align-items:flex-end;gap:16px;
  padding:8px 10px;background:rgba(11,18,32,.84);
  border:1px solid rgba(230,237,247,.16);border-radius:2px;
}
.hero__cap p{max-width:34ch;color:var(--muted)}
.hero__cap span{flex:none;color:var(--muted);opacity:.8}

@keyframes veil-in{to{opacity:1}}
@keyframes line-rise{to{transform:translateY(0)}}
.hero__title i{animation:line-rise .52s cubic-bezier(.16,1,.3,1) both}
.hero__title span:nth-child(1) i{animation-delay:.08s}
.hero__title span:nth-child(2) i{animation-delay:.16s}
.hero__title span:nth-child(3) i{animation-delay:.24s}

/* ------------------------------------------------------------------ fixture strip */
.fixture{max-width:var(--max);margin:0 auto;padding:0 var(--gut)}
.fixture__in{
  display:flex;align-items:center;flex-wrap:wrap;gap:18px clamp(20px,3vw,40px);
  padding:clamp(16px,2vw,22px) 0;
}
.fixture__in .state b{background:var(--muted)}
.fixture__line{
  font-family:var(--display);font-weight:700;text-transform:uppercase;
  font-size:clamp(21px,2.2vw,30px);line-height:1;letter-spacing:.01em;color:var(--chalk);
}
.fixture__line em{font-style:normal;color:var(--muted)}
.fixture__stats{margin-left:auto;display:flex;align-items:flex-end;gap:clamp(18px,2.6vw,36px)}
.fixture__stat{display:grid;gap:4px}
.fixture__stat b{
  font-family:var(--display);font-weight:700;font-size:clamp(26px,2.4vw,34px);line-height:.9;
  font-variant-numeric:tabular-nums;
}
.fixture__stat b.plus{color:var(--cyan)}

/* ------------------------------------------------------------------ section frame */
.section{
  max-width:var(--max);margin:0 auto;padding:clamp(64px,8vw,116px) var(--gut) 0;
}
.section__grid{display:grid;grid-template-columns:var(--rail) minmax(0,1fr)}
.section__body{min-width:0}
.section__head{
  display:grid;grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:var(--gap);
  align-items:end;margin-bottom:clamp(28px,3.4vw,48px);
}
h2.section__title{
  font-family:var(--display);font-weight:700;font-size:clamp(42px,6vw,92px);
  line-height:.92;letter-spacing:-.004em;max-width:15ch;text-wrap:balance;
}
.section__deck{max-width:40ch;color:var(--muted);font-size:clamp(16px,1.35vw,18px);padding-bottom:6px;text-wrap:pretty}
.section__deck b{color:var(--chalk);font-weight:400}

/* ------------------------------------------------------------------ the field */
.field-figure{display:grid;gap:10px;margin-bottom:clamp(28px,3.6vw,54px)}
.field-band{
  position:relative;overflow:hidden;border-radius:2px;
  border:1px solid rgba(42,53,80,.9);
  aspect-ratio:1520/690;
  background:var(--plate);
}
.field-band img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.band__svg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.field-band::after{content:"";position:absolute;inset:0;background:rgba(11,18,32,.24)}
.band__board{
  position:absolute;left:0;right:0;top:0;z-index:3;
  display:flex;align-items:center;gap:clamp(16px,2.6vw,36px);
  padding:10px clamp(14px,1.8vw,24px);
  background:rgba(11,18,32,.9);
  border-bottom:1px solid rgba(230,237,247,.2);
}
.band__clock{
  font-family:var(--display);font-weight:700;font-size:clamp(28px,3vw,48px);line-height:.88;
  font-variant-numeric:tabular-nums;letter-spacing:-.01em;
}
.band__meta{display:flex;align-items:center;gap:clamp(12px,2vw,26px)}
.band__meta span+span{padding-left:clamp(12px,2vw,26px);border-left:1px solid rgba(230,237,247,.16)}
.band__demo{margin-left:auto;color:var(--muted);opacity:.8}
.band__note{
  position:absolute;z-index:3;display:block;width:clamp(150px,15vw,222px);
  background:rgba(11,18,32,.9);border:1px solid rgba(230,237,247,.22);border-radius:2px;
  padding:10px 12px;
}
.band__note b{
  display:flex;align-items:center;gap:7px;font:400 10.5px/1.3 var(--mono);letter-spacing:.08em;
  text-transform:uppercase;color:var(--cyan);margin-bottom:5px;
}
.band__note b svg{width:14px;height:14px;flex:none}
.band__note span{display:block;font-size:12.5px;line-height:1.45;color:var(--chalk);opacity:.92}
.band__note::after{
  content:"";position:absolute;left:22px;top:100%;width:1px;height:22px;
  background:rgba(230,237,247,.45);
}
.band__note::before{
  content:"";position:absolute;left:18px;top:calc(100% + 22px);width:8px;height:8px;
  border:1px solid rgba(230,237,247,.6);border-radius:50%;background:rgba(11,18,32,.9);
}
.band__note--zone{left:5%;top:22%}
.band__note--report{left:31%;top:50%}
.band__note--trail{left:8%;top:68%}
.band__note--clock{right:4%;top:20%}
.band__cap{
  display:flex;justify-content:space-between;align-items:baseline;gap:16px;
  font:400 10.5px/1.5 var(--mono);letter-spacing:.04em;color:var(--dim);
}
.field-legend{display:none}

.notes{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:var(--gap)}
.note{grid-column:span 4;padding-top:18px;border-top:1px solid rgba(230,237,247,.18)}
.note h3{
  display:flex;align-items:center;gap:10px;margin:14px 0 10px;
  font-family:var(--display);font-weight:700;font-size:clamp(26px,2.4vw,36px);line-height:1;
}
.note h3 svg{width:22px;height:22px;flex:none}
.note p{color:var(--muted);font-size:15.5px;line-height:1.55;max-width:42ch}
.note p b{color:var(--chalk);font-weight:400}
.film{display:grid;grid-template-columns:1fr;gap:14px}
.film__thumb{
  position:relative;display:block;border:1px solid var(--hairline-strong);border-radius:2px;overflow:hidden;
  aspect-ratio:16/9;background:var(--plate);
}
.film__thumb img{width:100%;height:100%;object-fit:cover;object-position:50% 8%}
.film__play{
  position:absolute;left:12px;bottom:12px;display:inline-flex;align-items:center;gap:8px;
  background:rgba(11,18,32,.88);border:1px solid rgba(230,237,247,.3);border-radius:2px;
  padding:7px 10px;font:400 10.5px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--chalk);
}
.film__play svg{width:12px;height:12px}
.film figcaption{display:grid;gap:8px}
.film figcaption p{color:var(--muted);font-size:14px;line-height:1.5;max-width:34ch}

/* ------------------------------------------------------------------ round strip */
.round{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid rgba(230,237,247,.18)}
.round__beat{padding:22px clamp(14px,2vw,26px) 26px 0;border-right:1px solid rgba(230,237,247,.14)}
.round__beat:last-child{border-right:0;padding-right:0}
.round__num{
  display:flex;align-items:center;gap:10px;
  font:400 11px/1 var(--mono);letter-spacing:.1em;color:var(--cyan);
}
.round__num::after{content:"";height:1px;flex:1;background:var(--hairline)}
.round__beat h3{
  font-family:var(--display);font-weight:700;text-transform:uppercase;
  font-size:clamp(26px,2.6vw,38px);line-height:1;margin:14px 0 10px;
}
.round__beat p{color:var(--muted);font-size:15px;line-height:1.55;max-width:32ch}
.round__beat p b{color:var(--chalk);font-weight:400}

/* ------------------------------------------------------------------ screens */
.screens{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  gap:var(--gap);align-items:start;
}
.screens__rail{display:contents}
.screens--3{grid-template-columns:repeat(3,minmax(0,1fr))}
.screens--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.screens--5{grid-template-columns:repeat(5,minmax(0,1fr))}
.screen{margin:0}
.screens__rail > .screen:nth-child(2){margin-top:clamp(32px,5vw,72px)}
.screens__rail > .screen:nth-child(3){margin-top:clamp(10px,1.6vw,22px)}
.screens__rail > .screen:nth-child(4){margin-top:clamp(48px,7.4vw,108px)}
.screens__rail > .screen:nth-child(5){margin-top:clamp(20px,3vw,48px)}
.screen__frame{
  position:relative;display:block;border:1px solid var(--hairline-strong);border-radius:2px;
  overflow:hidden;background:var(--plate);
}
.screen__frame img{width:100%;height:auto;display:block}
.screen figcaption{
  display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  margin-top:10px;padding-top:10px;border-top:1px solid rgba(230,237,247,.14);
}
.screen figcaption b{font:400 10.5px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--chalk);flex:none}
.screen figcaption span{font-size:12.5px;color:var(--muted);text-align:right}
.screen__aside{
  grid-column:1/-1;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));
  gap:var(--gap);align-items:start;
  margin-top:clamp(40px,5vw,64px);padding-top:clamp(22px,2.6vw,32px);
  border-top:1px solid rgba(230,237,247,.18);
}
.screen__aside h3{
  grid-column:1/5;font-family:var(--display);font-weight:700;
  font-size:clamp(28px,3vw,44px);line-height:.98;text-wrap:balance;
}
.screen__aside p{grid-column:5/9;color:var(--muted);font-size:14.5px;line-height:1.55;max-width:36ch}
.screen__aside ul{grid-column:9/13;list-style:none;display:grid;gap:0}
.screen__aside li{
  display:flex;align-items:baseline;gap:12px;padding:9px 0;border-top:1px solid rgba(230,237,247,.14);
  font-size:13px;color:var(--muted);
}
.screen__aside li:first-child{border-top:0;padding-top:0}
.screen__aside li b{font:400 10.5px/1.4 var(--mono);letter-spacing:.06em;color:var(--cyan);flex:none}

/* ------------------------------------------------------------------ rules */
.pitch{
  display:grid;grid-template-columns:minmax(0,8fr) minmax(0,4fr);gap:var(--gap);
  align-items:end;margin-bottom:clamp(30px,3.6vw,50px);
}
.pitch h2{
  font-family:var(--display);font-weight:700;
  font-size:clamp(44px,7vw,110px);line-height:.86;letter-spacing:-.006em;
}
.pitch h2 span{display:block;color:var(--muted)}
.pitch .section__deck{padding-bottom:6px}
.ledger{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 clamp(28px,4vw,64px);border-top:1px solid rgba(230,237,247,.18)}
.ledger__row{
  display:grid;grid-template-columns:clamp(62px,6.4vw,88px) minmax(0,1fr);
  gap:10px 18px;padding:20px 0 22px;border-bottom:1px solid rgba(230,237,247,.14);
}
.ledger__row dt{font:400 10.5px/1.5 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);padding-top:3px}
.ledger__row dd{margin:0}
.ledger__row h3{font:700 17px/1.3 var(--sans);margin-bottom:6px}
.ledger__row p{color:var(--muted);font-size:14.5px;line-height:1.55;max-width:44ch}
.ledger__row a{color:var(--chalk);text-decoration:underline;text-decoration-color:var(--hairline-strong);text-underline-offset:3px}
.ledger__row a:hover{text-decoration-color:var(--chalk)}
.privacy{
  margin-top:clamp(44px,5.4vw,76px);
  display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:var(--gap);
  padding-top:clamp(26px,3vw,40px);border-top:1px solid rgba(230,237,247,.18);
}
.privacy h3{
  font-family:var(--display);font-weight:700;font-size:clamp(28px,3vw,42px);line-height:.98;max-width:12ch;
}
.privacy h3 span{display:block;color:var(--muted)}
.privacy ul{list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 clamp(24px,3vw,48px)}
.privacy li{
  position:relative;padding:14px 0 16px 22px;border-top:1px solid rgba(230,237,247,.12);
  font-size:13.5px;line-height:1.55;color:var(--muted);
}
.privacy li::before{
  content:"";position:absolute;left:2px;top:20px;width:6px;height:6px;background:var(--cyan);border-radius:50%;
}
.privacy li b{color:var(--chalk);font-weight:400}

/* ------------------------------------------------------------------ pass */
.pass{max-width:var(--max);margin:0 auto;padding:clamp(64px,8vw,116px) var(--gut) 0}
.pass__plate{
  border:1px solid var(--hairline-strong);border-radius:2px;background:var(--plate);
  padding:clamp(22px,3.4vw,52px);
  display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);
  gap:clamp(28px,4vw,64px);position:relative;
}
.pass__plate::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:rgba(230,237,247,.22)}
.pass__plate::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(230,237,247,.22)}
.pass__head .running{margin-bottom:20px}
.pass h2{
  font-family:var(--display);font-weight:700;font-size:clamp(46px,6.4vw,100px);
  line-height:.86;letter-spacing:-.004em;margin-bottom:clamp(20px,2.4vw,32px);
}
.pass__meta{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  margin-bottom:clamp(22px,2.6vw,32px);border-top:1px solid rgba(230,237,247,.16);
}
.pass__meta div{padding:12px 12px 13px 0;border-right:1px solid rgba(230,237,247,.12)}
.pass__meta div:last-child{border-right:0}
.pass__meta dt{font:400 10px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:6px}
.pass__meta dd{font-family:var(--display);font-weight:700;font-size:clamp(22px,2.2vw,30px);line-height:1;font-variant-numeric:tabular-nums}
.pass .btn--primary{width:100%;height:60px;font-size:16px}
.pass__dl{display:grid;gap:14px}
.pass__hash dt{font:400 10px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:6px}
.pass__hash code{
  display:block;padding:10px 12px;background:var(--field);border:1px solid var(--hairline);border-radius:2px;
  font:400 11.5px/1.5 var(--mono);letter-spacing:.02em;color:var(--muted);word-break:break-all;
}
.pass__server{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:13px;color:var(--muted)}
.pass__server code{
  font:400 12px/1.5 var(--mono);letter-spacing:.02em;color:var(--chalk);
  background:var(--field);border:1px solid var(--hairline);border-radius:2px;padding:3px 8px;
}
.pass__hint{font-size:12.5px;line-height:1.55;color:var(--dim);max-width:52ch;margin-top:8px}
.pass__warn{
  margin-top:4px;padding:2px 0 2px 14px;border-left:2px solid var(--cyan);
  font-size:12.5px;line-height:1.6;color:var(--muted);max-width:54ch;
}
.pass__warn b{color:var(--chalk);font-weight:400}
.pass__steps{border-top:1px solid rgba(230,237,247,.18)}
.pass__steps .running{margin-top:20px}
.pass__steps h3{font-family:var(--display);font-weight:700;font-size:clamp(26px,2.8vw,38px);line-height:1;margin:16px 0 18px}
.pass__steps ol{list-style:none;display:grid}
.pass__steps li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;padding:14px 0 16px;border-top:1px solid rgba(230,237,247,.12)}
.pass__steps li:first-child{border-top:0;padding-top:0}
.pass__steps .n{font:400 11px/1.5 var(--mono);letter-spacing:.08em;color:var(--cyan);padding-top:2px}
.pass__steps b{display:block;font:700 15px/1.35 var(--sans);margin-bottom:4px}
.pass__steps p{font-size:13.5px;line-height:1.55;color:var(--muted)}
.pass__fallback{
  grid-column:1/-1;margin-top:18px;padding-top:16px;border-top:1px solid rgba(230,237,247,.16);
  font-size:13px;line-height:1.55;color:var(--muted);
}

/* ------------------------------------------------------------------ questions */
.questions{border-top:1px solid rgba(230,237,247,.18)}
.questions details{border-bottom:1px solid rgba(230,237,247,.14)}
.questions summary{
  display:flex;align-items:center;justify-content:space-between;gap:18px;
  padding:20px 2px;cursor:pointer;list-style:none;
  font:700 clamp(16px,1.6vw,19px)/1.4 var(--sans);color:var(--chalk);
}
.questions summary::-webkit-details-marker{display:none}
.questions summary::after{
  content:"";flex:none;width:12px;height:12px;
  background:
    linear-gradient(var(--muted),var(--muted)) center/12px 1.5px no-repeat,
    linear-gradient(var(--muted),var(--muted)) center/1.5px 12px no-repeat;
  transition:transform .16s linear;
}
.questions details[open] summary::after{transform:rotate(45deg)}
.questions summary:hover{color:var(--cyan)}
.questions details p{max-width:72ch;padding:0 2px 22px;color:var(--muted);font-size:14.5px;line-height:1.6}
.questions details p a{color:var(--chalk);text-decoration-color:var(--hairline-strong);text-underline-offset:3px}

/* ------------------------------------------------------------------ footer */
.footer{max-width:var(--max);margin:clamp(64px,8vw,110px) auto 0;padding:0 var(--gut)}
.footer__in{
  border-top:1px solid rgba(230,237,247,.18);
  padding:clamp(28px,3.4vw,44px) 0 calc(40px + env(safe-area-inset-bottom));
  display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,4vw,64px);
}
.footer__brand{display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.footer__brand svg{height:26px;width:auto}
.footer__brand p{color:var(--dim);font-size:12.5px;line-height:1.6;max-width:36ch}
.footer__cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(20px,3vw,40px);align-content:start}
.footer__cols h4{font:400 10.5px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin:0 0 12px}
.footer__cols ul{list-style:none;display:grid;gap:9px}
.footer__cols a{color:var(--muted);text-decoration:none;font-size:13.5px}
.footer__cols a:hover{color:var(--chalk);text-decoration:underline;text-underline-offset:3px}
.footer__fine{
  grid-column:1/-1;margin-top:clamp(20px,2.6vw,34px);padding-top:18px;
  border-top:1px solid rgba(230,237,247,.12);
  display:flex;flex-wrap:wrap;gap:8px 22px;color:var(--dim);font-size:11.5px;line-height:1.6;
}

/* ------------------------------------------------------------------ responsive */
@media (max-width:1180px){
  :root{--rail:0px}
  .section__grid{grid-template-columns:1fr;gap:16px}
  .running{flex-direction:row;align-items:center;gap:12px}
  .running span{border-top:0;padding-top:0}
  .running b{margin:0}
  .screen__aside h3{grid-column:1/6}
  .screen__aside p{grid-column:6/13}
  .screen__aside ul{grid-column:1/13;grid-template-columns:1fr 1fr;gap:0 32px;margin-top:14px}
  .screen__aside li:nth-child(2){border-top:0;padding-top:0}
}
@media (max-width:1020px){
  .nav a:not(.nav__cta){display:none}
  .hero{grid-template-columns:1fr;min-height:0;gap:0}
  .hero__copy{grid-column:1/-1;padding:clamp(30px,5vw,54px) 0 clamp(24px,4vw,40px)}
  .hero__plate{grid-column:1/-1;margin-right:calc(var(--gut) * -1);margin-left:calc(var(--gut) * -1);border-left:0;border-top:1px solid rgba(230,237,247,.16);min-height:clamp(380px,54vh,540px)}
  .hero__hud{top:14px}
  .hero__cap{padding:0}
  h1.hero__title{font-size:clamp(58px,12vw,116px)}
  .section__head,.pitch{grid-template-columns:1fr;gap:18px}
  .ledger{grid-template-columns:1fr}
  .privacy{grid-template-columns:1fr}
  .privacy ul{grid-template-columns:1fr}
  .pass__plate{grid-template-columns:1fr}
  .round{grid-template-columns:repeat(2,minmax(0,1fr))}
  .round__beat:nth-child(2){border-right:0}
  .round__beat:nth-child(1),.round__beat:nth-child(2){border-bottom:1px solid rgba(230,237,247,.14)}
  .note{grid-column:span 6}
  .screens{grid-template-columns:repeat(3,minmax(0,1fr))}
  .screens__rail > .screen:nth-child(2){margin-top:40px}
  .screens__rail > .screen:nth-child(3){margin-top:0}
  .screens__rail > .screen:nth-child(4){margin-top:40px}
  .screens__rail > .screen:nth-child(5){margin-top:0}
  .footer__in{grid-template-columns:1fr;gap:32px}
  .pass__meta{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pass__meta div:nth-child(2){border-right:0}
  .pass__meta div:nth-child(1),.pass__meta div:nth-child(2){border-bottom:1px solid rgba(230,237,247,.12)}
  .fixture__stats{margin-left:0;width:100%;justify-content:flex-start}
  .screen__aside h3{grid-column:1/-1}
  .screen__aside p{grid-column:1/8}
  .screen__aside ul{grid-column:8/13;margin-top:0}
  .band__note{display:none}
  .field-legend{
    display:grid;grid-template-columns:1fr 1fr;gap:0 24px;
    border-top:1px solid rgba(230,237,247,.18);
  }
  .field-legend li{
    display:grid;grid-template-columns:104px 1fr;gap:3px 10px;align-items:start;
    padding:12px 0 14px;border-bottom:1px solid rgba(230,237,247,.12);
    font-size:13px;line-height:1.5;color:var(--muted);
  }
  .field-legend b{display:flex;align-items:center;gap:6px;font:400 10px/1.6 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);white-space:nowrap}
  .field-legend b svg{width:13px;height:13px;flex:none}
}
@media (max-width:640px){
  body{font-size:16px}
  .masthead__in{height:56px}
  .brand svg{height:27px}
  .nav__cta{height:38px;padding:0 11px;font-size:11.5px;letter-spacing:0}
  .hero__copy{padding-top:26px}
  h1.hero__title{font-size:clamp(48px,15vw,82px);line-height:.85}
  .hero__deck{font-size:16.5px}
  .hero__actions{gap:14px 18px}
  .hero__actions .btn{width:100%}
  .hero__honest{font-size:11px;gap:7px 10px}
  .hero__honest span{gap:10px}
  .hero__plate{min-height:clamp(330px,48vh,410px)}
  .hero__plate img{object-position:50% 62%}
  .hero__hud{left:12px;right:12px;top:12px;gap:16px;padding:9px 11px}
  .hero__hud-clock{font-size:32px}
  .hero__cap{left:10px;right:10px;bottom:8px;flex-direction:column;align-items:flex-start;gap:2px;padding:6px 8px}
  .hero__cap p{display:block;font-size:9.5px;line-height:1.4;max-width:34ch}
  .hero__cap span{font-size:9.5px}
  .fixture__line{font-size:19px}
  .fixture__stat b{font-size:25px}
  .section{padding-top:56px}
  h2.section__title{font-size:clamp(38px,11.5vw,58px)}
  .pitch h2{font-size:clamp(40px,12.6vw,64px)}
  .field-band{aspect-ratio:4/3;margin-left:calc(var(--gut) * -1);margin-right:calc(var(--gut) * -1);border-radius:0;border-left:0;border-right:0}
  .band__board{left:0;right:0;gap:8px;padding:8px 10px;flex-wrap:wrap;row-gap:3px}
  .band__clock{font-size:28px}
  .band__meta{order:3;width:100%;gap:0}
  .band__meta span{white-space:nowrap}
  .band__meta span+span{padding-left:12px;margin-left:12px;border-left:1px solid rgba(230,237,247,.16)}
  .band__demo{order:2;margin-left:auto;display:block;font-size:9px;letter-spacing:0;opacity:.75}
  .band__cap{flex-direction:column;gap:3px;padding:0 2px}
  .field-legend{grid-template-columns:1fr}
  .notes{gap:26px}
  .note,.note--film{grid-column:1/-1}
  .note h3{font-size:28px}
  .round{grid-template-columns:1fr}
  .round__beat{border-right:0;border-bottom:1px solid rgba(230,237,247,.14);padding-right:0}
  .round__beat:last-child{border-bottom:0}
  .screens{display:block}
  .screens__rail{
    display:flex;gap:16px;overflow-x:auto;overflow-y:hidden;
    scroll-snap-type:x mandatory;margin-right:calc(var(--gut) * -1);
    padding-right:var(--gut);padding-bottom:8px;-webkit-overflow-scrolling:touch;
  }
  .screens__rail > .screen{flex:0 0 78vw;scroll-snap-align:start;margin-top:0 !important}
  .screen figcaption{flex-direction:column;gap:3px;align-items:flex-start}
  .screen figcaption span{text-align:left}
  .screen__aside{display:block;margin-top:30px}
  .screen__aside h3{margin-bottom:12px}
  .screen__aside p{margin-bottom:16px}
  .screen__aside ul{display:grid;grid-template-columns:1fr;gap:0}
  .ledger__row{grid-template-columns:1fr;gap:6px}
  .privacy h3{font-size:31px}
  .pass{padding-top:56px}
  .pass__plate{padding:18px}
  .pass h2{font-size:clamp(42px,12.6vw,62px)}
  .pass__meta{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pass .btn--primary{height:56px;font-size:14.5px}
  .footer__cols{grid-template-columns:1fr 1fr}
  .footer__fine{flex-direction:column;gap:6px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}
  .hero__title i{transform:none}
  .hero__plate img{opacity:1}
}

</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="masthead__in">
    <a class="brand" href="/" aria-label="ManHunt home">
      <svg viewBox="0 0 806 220" role="img" aria-label="ManHunt"><title>ManHunt</title><g transform="translate(9.69 9.69) scale(1.86)"><g transform="rotate(0 54 54)"><path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="#22D3EE" stroke-width="10.4" stroke-linecap="butt"/><circle cx="66.72" cy="33.65" r="8.6" fill="#FF7A59"/></g></g><g transform="translate(226 60)"><path d="M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z" fill="#E6EDF7"/><path transform="translate(86 0)" d="M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z" fill="#E6EDF7"/><path transform="translate(164 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(242 0)" d="M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z" fill="#E6EDF7"/><path transform="translate(316 0)" d="M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z" fill="#E6EDF7" fill-rule="evenodd"/><path transform="translate(394 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(472 0)" d="M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z" fill="#E6EDF7"/></g></svg>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="#field">The field</a>
      <a href="#round">How it runs</a>
      <a href="#screens">In the app</a>
      <a href="#rules">Rules</a>
      <a class="nav__cta" href="#download">Download the APK</a>
    </nav>
  </div>
</header>
<main id="main">
  <!-- ① THE POSTER ============================================================ -->
  <section class="hero" aria-labelledby="hero-title" data-shot="hero">
    <div class="hero__copy">
      <div class="hero__kicker">
        <span class="team team--prey"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.6" fill="currentColor"/><path d="M14.2 8A6.2 6.2 0 1 1 9.7 1.9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Prey</span>
        <span class="hero__vs">v</span>
        <span class="team team--hunters"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.2 7 8l-5 4.8M8 3.2 13 8l-5 4.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Hunters</span>
      </div>
      <h1 class="hero__title" id="hero-title">
        <span><i>Hide</i></span>
        <span><i>from your</i></span>
        <span><i>friends.</i></span>
      </h1>
      <p class="hero__deck">Real-world hide-and-seek for Android. <b>Two teams, one street,</b> one clock the players can't bend.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#download">Download the APK</a>
        <a class="link" href="#film">Watch the 60-second film</a>
      </div>
      <div class="hero__honest data-sm">
        ${heroMeta}
      </div>
    </div>

    <figure class="hero__plate">
      <picture><source srcset="/media/map-hero.webp" type="image/webp"><img src="/media/map-hero.jpg" alt="The live hunt map from the app: real OpenStreetMap tiles over Riverside Park and the Hudson River, with the 240 metre zone, a fresh and a stale prey report and a coral trail." width="900" height="1054"></picture>
      <div class="hero__hud" aria-hidden="true">
        <div class="hero__hud-clock">41:12</div>
        <div class="hero__hud-meta">
          <span class="state state--live"><b></b>Live</span>
          <span class="data">Prey 2 / 2</span>
          <span class="data">Zone 240 m</span>
        </div>
      </div>
      <figcaption class="hero__cap">
        <p class="data-sm">Illustration — the live map. Latest reports, not the whole truth.</p>
        <span class="data-sm">© OpenStreetMap contributors</span>
      </figcaption>
    </figure>
  </section>

  <!-- fixture strip =========================================================== -->
  <div class="fixture" data-shot="fixture">
    <div class="fixture__in">
      <span class="state"><b></b>Tonight</span>
      <span class="fixture__line">One street. <em>One clock.</em></span>
      ${statsBlock}    </div>
  </div>

  <!-- ② THE FIELD ============================================================= -->
  <section class="section" id="field" aria-labelledby="field-title" data-shot="field">
    <div class="section__grid">
      <div class="section__rail"><p class="running"><b>01</b><span>The field</span></p></div>
      <div class="section__body">
        <div class="section__head">
          <h2 class="section__title" id="field-title">The map is the field.</h2>
          <p class="section__deck">Hunters see the <b>latest report</b>, not a perfect live feed. Prey never see the map. The zone and the trails are the host's call — the server keeps the clock.</p>
        </div>

        <figure class="field-figure" aria-labelledby="band-cap">
          <div class="field-band">
            <picture><source srcset="/media/map-band.webp" type="image/webp"><img src="/media/map-band.jpg" alt="Wide real in-app OpenStreetMap night map of Riverside Park and the Hudson River, filtered to the game's Deep Teal palette, with the cyan hunt zone and a coral prey trail." width="1520" height="690" decoding="async"></picture>
            <svg class="band__svg" viewBox="0 0 1520 690" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
              <circle cx="1010" cy="330" r="286" stroke="#22D3EE" stroke-opacity=".2" stroke-width="1.4" stroke-dasharray="2 14"/>
              <circle cx="1010" cy="330" r="275" stroke="#22D3EE" stroke-opacity=".86" stroke-width="2.6"/>
              <path d="M 960 640 L 1012 560 L 1066 486 L 1128 418 L 1188 348 L 1248 278" stroke="#FF7A59" stroke-opacity=".82" stroke-width="2.6" stroke-linecap="butt" stroke-dasharray="7 11"/>
              <circle cx="985" cy="596" r="30" stroke="#22D3EE" stroke-opacity=".28" stroke-width="1.6"/>
              <circle cx="985" cy="596" r="18" stroke="#22D3EE" stroke-opacity=".55" stroke-width="1.8"/>
              <circle cx="1066" cy="486" r="21" stroke="#FF7A59" stroke-opacity=".55" stroke-width="1.8"/>
              <circle cx="1066" cy="486" r="9.8" fill="#FF7A59"/>
              <circle cx="1188" cy="348" r="15" stroke="#FF7A59" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="3 4"/>
              <circle cx="1188" cy="348" r="7.6" fill="#FF7A59" fill-opacity=".42"/>
            </svg>
            <div class="band__board" aria-hidden="true">
              <span class="state state--live"><b></b>Live</span>
              <span class="band__clock">41:12</span>
              <span class="band__meta"><span class="data">Prey 2 / 2</span><span class="data">Zone 240 m</span></span>
              <span class="band__demo data-sm">Illustration</span>
            </div>
            <div class="band__note band__note--zone">
              <b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8A6 6 0 1 1 9.2 2.1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>Zone</b>
              <span>The area the host sets for the round.</span>
            </div>
            <div class="band__note band__note--report">
              <b><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Latest report</b>
              <span>Where a phone last checked in. Not where it is now.</span>
            </div>
            <div class="band__note band__note--trail">
              <b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 13.4 6.4 8.6 9 11.2 14 2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="2" cy="13.4" r="1.3" fill="currentColor"/></svg>Trail</b>
              <span>Movement history. Off unless the host turns it on.</span>
            </div>
            <div class="band__note band__note--clock">
              <b><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.6V8l2.2 1.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>The clock</b>
              <span>Server-timed. Pauses for everyone or nobody.</span>
            </div>
          </div>
          <figcaption class="band__cap">
            <span id="band-cap">Illustration of the hunt screen — zone, latest report, trail and the server's clock.</span>
            <span>© OpenStreetMap contributors</span>
          </figcaption>
          <ul class="field-legend">
            <li><b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8A6 6 0 1 1 9.2 2.1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>Zone</b><span>The area the host sets for the round.</span></li>
            <li><b><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Latest report</b><span>Where a phone last checked in. Not where it is now.</span></li>
            <li><b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 13.4 6.4 8.6 9 11.2 14 2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="2" cy="13.4" r="1.3" fill="currentColor"/></svg>Trail</b><span>Movement history. Off unless the host turns it on.</span></li>
            <li><b><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.6V8l2.2 1.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>The clock</b><span>Server-timed. Pauses for everyone or nobody.</span></li>
          </ul>
        </figure>

        <div class="notes">
          <article class="note">
            <span class="team team--prey"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.6" fill="currentColor"/><path d="M14.2 8A6.2 6.2 0 1 1 9.7 1.9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Prey</span>
            <h3>Hide. Stay free.</h3>
            <p>Your phone reports your position to the Hunters at the room's interval. Stay free until the clock stops — if one Prey is still out, Prey win.</p>
          </article>
          <article class="note">
            <span class="team team--hunters"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.2 7 8l-5 4.8M8 3.2 13 8l-5 4.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Hunters</span>
            <h3>Track. Tag.</h3>
            <p>Follow the latest reports and trails. Find a Prey and tag them in person — they confirm or dispute it, and the server decides what counts.</p>
          </article>
          <figure class="note film" id="film">
            <a class="film__thumb" href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4" aria-label="Watch the 60-second ManHunt explainer film">
              <picture><source srcset="/media/explainer-cover.webp" type="image/webp"><img src="/media/explainer-cover.jpg" decoding="async" alt="Cover of the 60-second ManHunt explainer film" width="720" height="1280"></picture>
              <span class="film__play"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 10 6l-7 4.5Z" fill="currentColor"/></svg>60 sec</span>
            </a>
            <figcaption>
              <p>One minute: the hook, the two sides, how phones report, how tagging works.</p>
              <a class="link" href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4">Watch the film</a>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  </section>

  <!-- ③ HOW A ROUND RUNS ====================================================== -->
  <section class="section" id="round" aria-labelledby="round-title" data-shot="round">
    <div class="section__grid">
      <div class="section__rail"><p class="running"><b>02</b><span>The round</span></p></div>
      <div class="section__body">
        <div class="section__head">
          <h2 class="section__title" id="round-title">Four beats. One organiser.</h2>
          <p class="section__deck">No referee needed. The host starts it, <b>the server keeps it honest</b>, and the street handles the rest.</p>
        </div>
        <div class="round">
          <article class="round__beat">
            <span class="round__num">01</span>
            <h3>Room</h3>
            <p>One phone creates the hunt and shares a <b>6-character code</b> with the group.</p>
          </article>
          <article class="round__beat">
            <span class="round__num">02</span>
            <h3>Sides</h3>
            <p>Everyone joins and picks <b>Prey or Hunters</b>. The host sets the clock, reports and zone.</p>
          </article>
          <article class="round__beat">
            <span class="round__num">03</span>
            <h3>Hunt</h3>
            <p>Prey hide. Phones report. Hunters read the latest report and close in.</p>
          </article>
          <article class="round__beat">
            <span class="round__num">04</span>
            <h3>Result</h3>
            <p>All Prey tagged, or the clock runs out. History is kept; rematch when you want.</p>
          </article>
        </div>
      </div>
    </div>
  </section>

  <!-- ④ IN THE APP ============================================================= -->
  <section class="section" id="screens" aria-labelledby="screens-title" data-shot="screens">
    <div class="section__grid">
      <div class="section__rail"><p class="running"><b>03</b><span>The screens</span></p></div>
      <div class="section__body">
        <div class="section__head">
          <h2 class="section__title" id="screens-title">Built for the street, not a menu.</h2>
          <p class="section__deck">Dark by default. English and Arabic with full RTL. 48 dp targets and a map that reads at arm's length, in the dark.</p>
        </div>
        <div class="screens ${screensClass}">
          <div class="screens__rail">
            ${screensBlock}
          </div>
          <aside class="screen__aside">
            <h3>Everything the round needs.</h3>
            <p>The same map, clock and rules on every phone. No extra gear, no subscription, no sign-up email.</p>
            <ul>
              <li><b>01</b>Map with zone, trails and latest reports</li>
              <li><b>02</b>Server-kept clock and tag confirmations</li>
              <li><b>03</b>Room chat with match updates</li>
              <li><b>04</b>Match history and rematches</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  </section>

  <!-- ⑤ THE RULES ============================================================== -->
  <section class="section" id="rules" aria-labelledby="rules-title" data-shot="rules">
    <div class="section__grid">
      <div class="section__rail"><p class="running"><b>04</b><span>The rules</span></p></div>
      <div class="section__body">
        <div class="pitch">
          <h2 id="rules-title">The pitch is borrowed. <span>The rules are not.</span></h2>
          <p class="section__deck">The chase is exciting. The rules are boring, on purpose. <b>The parts the server owns are not up for argument.</b></p>
        </div>
        <dl class="ledger">
          <div class="ledger__row">
            <dt>Clock</dt>
            <dd><h3>The clock is server-owned.</h3><p>Timers, phases and pause/resume are decided server-side. No phone can run the clock ahead.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Teams</dt>
            <dd><h3>Two sides, counted.</h3><p>Prey and Hunters are assigned in the room and enforced by the server for the whole round.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Tags</dt>
            <dd><h3>A tag needs a witness.</h3><p>A Hunter claims a tag; the Prey confirms or disputes it. Duplicate claims cannot double-apply.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Map</dt>
            <dd><h3>Latest report only.</h3><p>Hunters see the last report and optional trails — not a perfect live feed. Prey never see positions.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Signal</dt>
            <dd><h3>Built to recover.</h3><p>Reconnects, restarts and flaky signal do not break the round. Pause and resume shift the clock correctly.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Hosting</dt>
            <dd><h3>Yours to host.</h3><p>One Node process, one SQLite file, no Docker, no paid map or push service. <a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/DEPLOYMENT.md">Read the deployment guide</a>.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Language</dt>
            <dd><h3>English and Arabic.</h3><p>Full RTL, dark-first UI, adjustable text size and 48 dp controls throughout the app.</p></dd>
          </div>
          <div class="ledger__row">
            <dt>Cost</dt>
            <dd><h3>Free, no ads.</h3><p>MIT-licensed source. No ads, no in-app purchases, no account email required.</p></dd>
          </div>
        </dl>

        <div class="privacy" id="privacy">
          <h3>Privacy <span>and safety</span></h3>
          <ul>
            <li>Your position is shown only to the <b>Hunters in your room</b> while a match is running. Admins get no extra location access.</li>
            <li>Location reports are sent by a foreground service with a visible notification. History is shown to Hunters only when the host turns trails on.</li>
            <li>There is no email address and <b>no password recovery</b> — keep your password safe.</li>
            <li>The hosted server is a <b>test deployment on plain HTTP</b>. Don't use it for sensitive location data; self-host behind HTTPS for that.</li>
            <li>ManHunt is a game, <b>not a safety service</b>. Play in places you're allowed to be, with people you trust.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ⑥ THE PASS =============================================================== -->
  <section class="pass" id="download" aria-labelledby="download-title" data-shot="pass">
    <div class="pass__plate">
      <div class="pass__head">
        <p class="running"><b>05</b><span>The pass</span></p>
        <h2 id="download-title">Get on<br>the field.</h2>
        <dl class="pass__meta">
          <div><dt>Version</dt><dd>${metaVersion}</dd></div>
          <div><dt>Size</dt><dd>${metaSize}</dd></div>
          <div><dt>Published</dt><dd>${metaPublished}</dd></div>
          <div><dt>Android</dt><dd>8.0+</dd></div>
        </dl>
        <div class="pass__dl">
          <a class="btn btn--primary" href="${escapeHtml(downloadHref)}">${downloadLabel}</a>
          ${hashBlock}
          ${serverBlock}
          <p class="pass__warn"><b>Android will warn you about sideloaded apps.</b> That warning is expected — the release is signed and built by the project. Install only if you trust this project.</p>
          ${releaseNote}
        </div>
      </div>
      <div class="pass__steps">
        <p class="running"><b>06</b><span>Install</span></p>
        <h3>Install in four steps.</h3>
        <ol>
          <li><span class="n">01</span><div><b>Download the APK</b><p>On the Android phone you'll play on.</p></div></li>
          <li><span class="n">02</span><div><b>Allow installs from your browser</b><p>When Android asks. If it doesn't: Settings → Apps → Special app access → Install unknown apps.</p></div></li>
          <li><span class="n">03</span><div><b>Open the file and install</b><p>Play Protect may warn about a sideloaded app — choose "Install anyway" only if you trust this project.</p></div></li>
          <li><span class="n">04</span><div><b>Open ManHunt and sign in</b><p>Create a local account — no email needed — and use the server shown on this page.</p></div></li>
        </ol>
      </div>
    </div>
  </section>

  <!-- ⑦ QUESTIONS ============================================================== -->
  <section class="section" id="questions" aria-labelledby="questions-title" data-shot="questions">
    <div class="section__grid">
      <div class="section__rail"><p class="running"><b>07</b><span>The questions</span></p></div>
      <div class="section__body">
        <div class="section__head">
          <h2 class="section__title" id="questions-title">The honest answers.</h2>
          <p class="section__deck">What the page can't show you: the small print, said plainly. Nothing here is a promise the project can't keep.</p>
        </div>
        <div class="questions">
          <details>
            <summary>Is ManHunt free?</summary>
            <p>Yes. The APK is free to download and the server is MIT-licensed. You can play on the hosted test server or run the backend yourself. There are no ads and no in-app purchases.</p>
          </details>
          <details>
            <summary>Why is it not on Google Play?</summary>
            <p>ManHunt is distributed as a signed, sideloaded APK. That means allowing installs from your browser and possibly seeing a Play Protect warning. The release and its SHA-256 are published on GitHub — the same hash is printed on this page.</p>
          </details>
          <details>
            <summary>How many phones do we need?</summary>
            <p>At least two, and everyone should be in the same physical area. One phone hosts the room and shares the 6-character code; the others join and pick a side. Groups of four to ten are where the game works best.</p>
          </details>
          <details>
            <summary>Who can see my location?</summary>
            <p>Only the Hunters in your room, during the hunting phase, see your latest report. Prey never see locations, and admins get no extra location access. Location history is shown only when the host enables trails.</p>
          </details>
          <details>
            <summary>Is the hosted server safe for a real game?</summary>
            <p>It is a plain-HTTP test server with no availability guarantee and no account recovery. Use it for test games; for anything sensitive, self-host behind HTTPS and play with people you trust.</p>
          </details>
          <details>
            <summary>What if a tag is disputed?</summary>
            <p>The Hunter claims the tag, the Prey confirms or disputes it, and the Huntmaster resolves it. Duplicate claims cannot double-apply, so the result can't be argued into existence.</p>
          </details>
        </div>
      </div>
    </div>
  </section>
</main>
<footer class="footer" data-shot="footer">
  <div class="footer__in">
    <div class="footer__brand">
      <svg viewBox="0 0 806 220" role="img" aria-label="ManHunt"><title>ManHunt</title><g transform="translate(9.69 9.69) scale(1.86)"><g transform="rotate(0 54 54)"><path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="#22D3EE" stroke-width="10.4" stroke-linecap="butt"/><circle cx="66.72" cy="33.65" r="8.6" fill="#FF7A59"/></g></g><g transform="translate(226 60)"><path d="M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z" fill="#E6EDF7"/><path transform="translate(86 0)" d="M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z" fill="#E6EDF7"/><path transform="translate(164 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(242 0)" d="M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z" fill="#E6EDF7"/><path transform="translate(316 0)" d="M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z" fill="#E6EDF7" fill-rule="evenodd"/><path transform="translate(394 0)" d="M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z" fill="#E6EDF7"/><path transform="translate(472 0)" d="M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z" fill="#E6EDF7"/></g></svg>
      <p>A free pickup sport for Android: two teams, real streets, and a clock nobody can argue with.</p>
    </div>
    <div class="footer__cols">
      <div>
        <h4>The game</h4>
        <ul>
          <li><a href="https://github.com/MostafaAshry513/ManHunt">Source code</a></li>
          <li><a href="https://github.com/MostafaAshry513/ManHunt/releases/latest">Latest release</a></li>
          <li><a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/DEPLOYMENT.md">Self-hosting guide</a></li>
          <li><a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/brand/README.md">Brand kit</a></li>
        </ul>
      </div>
      <div>
        <h4>The film</h4>
        <ul>
          <li><a href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4">60-second explainer</a></li>
          <li><a href="https://raw.githubusercontent.com/MostafaAshry513/ManHunt/master/design/social/motion/out/v5/manhunt_15s_1080x1920.mp4">15-second hook</a></li>
          <li><a href="https://github.com/MostafaAshry513/ManHunt/tree/master/design/social/campaign">Campaign notes</a></li>
        </ul>
      </div>
      <div>
        <h4>Small print</h4>
        <ul>
          <li><a href="#privacy">Privacy &amp; safety</a></li>
          <li><a href="#questions">Questions</a></li>
          <li><a href="https://github.com/MostafaAshry513/ManHunt/blob/master/LICENSE">MIT licence</a></li>
        </ul>
      </div>
    </div>
    <p class="footer__fine">
      <span>MIT licensed</span>
      <span>Map data © OpenStreetMap contributors</span>
      <span>Free APK · not on Google Play</span>
      <span>ManHunt is a game, not a safety service.</span>
    </p>
  </div>
</footer>
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

