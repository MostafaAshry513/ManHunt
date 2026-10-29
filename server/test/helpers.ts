import { openDb } from '../src/db.ts';
import { Hub } from '../src/realtime.ts';
import { RoomService } from '../src/rooms.ts';
import { buildApp } from '../src/app.ts';

export const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);

export async function makeApp(dbPath = ':memory:') {
  const db = openDb(dbPath);
  const hub = new Hub();
  let now = T0;
  const clock = () => now;
  const rooms = new RoomService(db, hub, clock);
  const app = await buildApp({ db, hub, rooms, clock, logger: false });

  return {
    db,
    hub,
    rooms,
    app,
    now: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
}

export type TestApp = Awaited<ReturnType<typeof makeApp>>;

export async function register(app: TestApp['app'], username: string, password = 'password123') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { username, password },
  });
  if (res.statusCode !== 200) throw new Error(`register failed: ${res.body}`);
  const body = res.json() as { token: string; user: { id: string; username: string } };
  return { token: body.token, user: body.user, id: body.user.id };
}

export function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

export async function createRoom(app: TestApp['app'], token: string, name = 'Test Room') {
  const res = await app.inject({ method: 'POST', url: '/api/rooms', headers: bearer(token), payload: { name } });
  if (res.statusCode !== 200) throw new Error(`createRoom failed: ${res.body}`);
  return res.json() as any;
}

export async function joinRoom(app: TestApp['app'], token: string, code: string) {
  const res = await app.inject({ method: 'POST', url: '/api/rooms/join', headers: bearer(token), payload: { code } });
  if (res.statusCode !== 200) throw new Error(`joinRoom failed: ${res.body}`);
  return res.json() as any;
}
