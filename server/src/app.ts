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

  app.get('/', async (req, reply) => {
    const raw = await readManifestText(manifestPath);
    const manifest = raw === null ? null : parseManifest(raw);
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-store')
      .send(renderInstallPage(manifest, publicBaseUrl(req)));
  });

  app.get('/join', async (req, reply) => {
    const raw = (req.query as { code?: unknown } | undefined)?.code;
    const code = typeof raw === 'string'
      ? raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
      : '';
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-store')
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
function renderInstallPage(manifest: LatestManifest | null, serverUrl: string): string {
  const version = typeof manifest?.versionName === 'string' ? manifest.versionName.trim() : '';
  const size = formatBytes(manifest?.size);
  const sha = typeof manifest?.sha256 === 'string' ? manifest.sha256.trim() : '';
  const published = formatDate(manifest?.publishedAt);
  const manifestUrl = typeof manifest?.url === 'string' ? manifest.url.trim() : '';
  const downloadHref = /^\/[\w./-]+$/.test(manifestUrl) ? manifestUrl : '/app.apk';

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

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0B1220">
<meta name="description" content="ManHunt — real-world GPS hide-and-seek for Android. Download the signed APK.">
<title>ManHunt — hide, hunt, survive</title>
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
</style>
</head>
<body>
<main class="wrap">
  <header class="hero">
    <svg class="icon" width="68" height="68" viewBox="0 0 108 108" role="img" aria-label="ManHunt icon">
      <rect width="108" height="108" rx="26" fill="#0B1220"/>
      <circle cx="54" cy="54" r="32" fill="#22D3EE" opacity=".18"/>
      <circle cx="54" cy="54" r="26" fill="none" stroke="#22D3EE" stroke-width="4"/>
      <path d="M54 26v56M26 54h56" stroke="#FF7A59" stroke-width="5" stroke-linecap="round"/>
      <circle cx="54" cy="54" r="4" fill="#FFFFFF"/>
    </svg>
    <div>
      <p class="eyebrow">MANHUNT</p>
      <h1>Hide. Hunt. Survive.</h1>
    </div>
  </header>

  <p class="pitch">Real-world hide-and-seek for Android. Prey hide while their phones report
  position; Hunters follow on a live map and tag them in person. One server keeps the timers,
  teams and tag rules fair.</p>

  <section class="card" aria-labelledby="download-heading">
    <h2 id="download-heading">Download for Android</h2>
    <div class="chips">
        ${chips}
    </div>
    <a class="button" href="${escapeHtml(downloadHref)}">Download APK${version ? ` v${escapeHtml(version)}` : ''}</a>
      ${details}
    ${serverBlock}
  </section>

  <section class="card">
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

  <section class="card">
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

  <footer class="footer">
    <p><a href="https://github.com/MostafaAshry513/ManHunt/releases/latest">GitHub release</a> ·
      <a href="https://github.com/MostafaAshry513/ManHunt">source code</a> ·
      <a href="https://github.com/MostafaAshry513/ManHunt/blob/master/docs/DEPLOYMENT.md">self-hosting guide</a></p>
    <p class="fine">MIT licensed · Map data &copy; OpenStreetMap contributors</p>
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

