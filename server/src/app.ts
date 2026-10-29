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
};

type Authed = FastifyRequest & { auth: User };

const registerBody = z.object({ username: z.string(), password: z.string() });
const roomBody = z.object({ name: z.string() });
const joinBody = z.object({ code: z.string() });
const teamBody = z.object({ team: z.enum(['prey', 'hunters']) });
const readyBody = z.object({ ready: z.boolean() });
const tagBody = z.object({ preyId: z.string().min(1) });
const resolveBody = z.object({ decision: z.enum(['confirmed', 'rejected']) });
const messageBody = z.object({ body: z.string() });
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
    return { ok: true, now: clock(), service: 'manhunt', version: '0.1.0' };
  });

  // Update channel: written by scripts/ci/pull-latest-apk.ps1 after a CI build.
  app.get('/api/app/latest', async (_req, reply) => {
    try {
      // Strip a UTF-8 BOM if the manifest was written by Windows PowerShell:
      // strict JSON clients (including kotlinx.serialization) reject it.
      const manifest = (await readFile(resolve(process.cwd(), 'data', 'app-latest.json'), 'utf8'))
        .replace(/^\uFEFF/, '');
      return reply.type('application/json').send(manifest);
    } catch {
      return reply.code(404).send({
        error: { code: 'no_update_channel', message: 'No update manifest has been published yet' },
      });
    }
  });

  // Simple install page + APK download for testers.
  const apkPath = process.env.APK_PATH ?? resolve(
    process.cwd(), '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk',
  );

  app.get('/', async (_req, reply) => {
    return reply.type('text/html').send(
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
       <title>ManHunt</title>
       <body style="font-family:system-ui;background:#0B1220;color:#E6EDF7;padding:32px">
       <h1 style="margin:0 0 8px">ManHunt</h1>
       <p style="color:#93A4BF">Server: ${escapeHtml(process.env.PUBLIC_URL ?? '')}</p>
       <p><a style="color:#22D3EE" href="/app.apk">Download the Android APK</a></p>
       <p style="color:#93A4BF;font-size:14px">On the sign-in screen, set the server to the address you used to open this page.</p>
       </body>`,
    );
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
    return deps.rooms.messages((req as Authed).auth.id, req.params.id);
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
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
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
