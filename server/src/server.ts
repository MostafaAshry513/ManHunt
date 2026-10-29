import { config } from './config.ts';
import { openDb } from './db.ts';
import { Hub } from './realtime.ts';
import { RoomService } from './rooms.ts';
import { buildApp } from './app.ts';
import { all } from './db.ts';

const db = openDb(config.dbPath);
const hub = new Hub();
const rooms = new RoomService(db, hub);
const app = await buildApp({ db, hub, rooms, sessionDays: config.sessionDays });

const timer = setInterval(() => {
  try {
    const active = all<{ id: string }>(db, "SELECT id FROM rooms WHERE status = 'active'");
    for (const room of active) {
      if (rooms.reconcile(room.id)) rooms.broadcastRoom(room.id);
    }
  } catch (err) {
    app.log.error(err, 'tick failed');
  }
}, config.tickMs);
timer.unref();

// Precise GPS history is pruned on a schedule; match summaries are kept.
const retentionTimer = setInterval(() => {
  try {
    const removed = rooms.purgeOldLocations(config.locationRetentionDays * 86_400_000);
    if (removed > 0) app.log.info({ removed }, 'pruned expired location reports');
  } catch (err) {
    app.log.error(err, 'location retention sweep failed');
  }
}, 6 * 60 * 60 * 1000);
retentionTimer.unref();

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  clearInterval(timer);
  clearInterval(retentionTimer);
  await app.close();
  db.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: config.port, host: config.host });
app.log.info(`ManHunt server listening on http://${config.host}:${config.port} (db: ${config.dbPath})`);
