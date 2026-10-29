# Performance

Measured on the build machine on 2026-10-29 with `server/scripts/load-test.mjs`
against a freshly created SQLite file and a single Node process.

**These are localhost numbers.** Client and server shared the same 12 vCPU VM over
loopback, with no TLS, no reverse proxy and no network in between. They say what
the process can do, not what it can serve over the internet.

## Environment

| Item | Value |
|---|---|
| Host | QEMU/KVM guest, Windows Server 2022, AMD EPYC-Milan, 12 logical cores, 24 GB RAM |
| Runtime | Node.js 24.22.1 (native TypeScript type stripping), one process, no cluster/workers |
| Server | Fastify 5 + `@fastify/websocket`, `node:sqlite` (`DatabaseSync`) |
| Database | New file per run, `PRAGMA journal_mode = WAL`, `busy_timeout = 5000`, single writer connection |
| Network | Loopback only (`127.0.0.1:8099`), HTTP and `ws://`, no TLS, no proxy |
| Client | One Node process on the same host, global `fetch` + `ws`, per-player loopback source addresses |
| Other load | An unrelated idle dev server was running on port 8123 with a different database |

## Workload

`node scripts/load-test.mjs --players N --rooms R` drives R rooms **in parallel**;
`--players` is players per room, including the room admin. Registration is global.

Per room:

1. Admin registers; server hashes the password with `scryptSync` (N=16384, r=8).
2. Admin creates the room and patches settings: `headStartSec: 0`, `durationSec: 600`.
3. Remaining players join by code.
4. Teams split 50/50 (even index prey, odd index hunters; the admin is prey).
5. Every player marks ready; the admin starts the match.
6. Every hunter opens a WebSocket, sends `subscribe`, and waits for the `room` event.
7. Every prey posts one location **as a single burst**; each hunter must receive one
   `prey_location` per prey.
8. 20 chat messages per room, round-robin across senders, 4 in flight per room.

Concurrency is fixed: 8 in-flight registrations, 8 per room for join/team/ready,
8 per room for WebSocket connects, 4 per room for chat. Location posts are not
throttled: all prey in all rooms report at once (20 in flight for A, 80 for B).

Each virtual player uses its own loopback source address (`127.0.0.x`) because
`POST /api/auth/register` is limited to 10 requests/minute **per IP** (`src/app.ts`).
Without that, a 40-player run would measure the rate limiter, not the server. This
also means the test does not exercise the limiter's queueing behaviour; the limit
itself is noted under limits below.

## Reproduce

```powershell
cd C:\dev\ManHunt\server
Remove-Item data\perf.db* -Force -ErrorAction SilentlyContinue

$env:PORT='8099'; $env:HOST='127.0.0.1'; $env:DB_PATH='C:\dev\ManHunt\server\data\perf.db'
node src/server.ts            # leave running in its own terminal

node scripts/load-test.mjs --players 20 --rooms 2     # A
node scripts/load-test.mjs --players 40 --rooms 4     # B
```

Restart the server (fresh empty DB) between measured runs: the in-memory
rate limiter otherwise still holds the previous run's registration hits for 60 s.
The script exits non-zero on any non-2xx response, a missing `prey_location`, or a
missing/duplicate WebSocket event, and closes all sockets before exiting.

Cleanup after measuring:

```powershell
# stop the server (Ctrl+C), then
Remove-Item C:\dev\ManHunt\server\data\perf.db* -Force
```

## Results

### Profiles

| Run | Rooms | Players/room | Total users | WS clients | Prey locations | Chat POSTs | Register phase | Match-path wall | Total measured | Cmd wall | Server RSS | Server CPU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C  | 2 | 10  | 20  | 10  | 10  | 40 | 1.55 s  | 0.77 s | 2.42 s  | 4.22 s  | 89.0 MB | 4.1 s |
| D  | 4 | 10  | 40  | 20  | 20  | 80 | 2.90 s  | 1.58 s | 4.58 s  | 6.42 s  | 95.4 MB | 6.4 s |
| A  | 2 | 20  | 40  | 20  | 20  | 40 | 3.25 s  | 1.45 s | 4.80 s  | 6.61 s  | 95.6 MB | 6.4 s |
| A2 | 2 | 20  | 40  | 20  | 20  | 40 | 3.08 s  | 1.48 s | 4.66 s  | 6.53 s  | 96.4 MB | 6.4 s |
| B  | 4 | 40  | 160 | 80  | 80  | 80 | 12.32 s | 5.32 s | 17.75 s | 19.61 s | 94.2 MB | 18.5 s |
| B2 | 4 | 40  | 160 | 80  | 80  | 80 | 12.48 s | 5.44 s | 18.03 s | 19.87 s | 92.1 MB | 18.8 s |

"Total measured" is the script's window: health probe through the last chat POST.
"Cmd wall" additionally includes client process startup and socket teardown (up to
1.5 s of close wait). Server RSS and CPU come from `Get-Process` on the server PID
immediately after the run; CPU is total process CPU time, so server CPU / cmd wall
is ≈0.94–1.0 core throughout.

`C`/`D` are the literal "20 players / 2 rooms" and "40 players / 4 rooms" readings
(10 per room). `A`/`B` double the players per room as well, which is the harsher
reading of the same request. `A2`/`B2` are immediate repeats.

### HTTP latency — 40 users, 2 rooms (A)

All values in milliseconds. Latency is measured client-side with `performance.now()`
from request start to the last body byte; `start` has only n=2, so its p95 equals max.

| Operation | n | p50 | p95 | max | mean |
|---|---:|---:|---:|---:|---:|
| register | 40 | 637.90 | 681.03 | 688.84 | 593.86 |
| join | 38 | 94.00 | 102.10 | 102.33 | 78.72 |
| ready | 40 | 96.81 | 105.22 | 105.60 | 86.47 |
| start | 2 | 31.00 | 36.98 | 36.98 | 33.99 |
| location POST | 20 | 91.34 | 163.90 | 170.49 | 95.38 |
| chat POST | 40 | 46.13 | 55.56 | 64.24 | 46.24 |
| *ws subscribe* | 20 | 14.76 | 24.18 | 25.49 | 13.99 |

### HTTP latency — 160 users, 4 rooms (B)

| Operation | n | p50 | p95 | max | mean |
|---|---:|---:|---:|---:|---:|
| register | 160 | 609.00 | 646.57 | 684.68 | 601.92 |
| join | 156 | 181.62 | 223.42 | 225.28 | 171.44 |
| ready | 160 | 191.42 | 218.55 | 229.42 | 193.46 |
| start | 4 | 102.37 | 188.86 | 188.86 | 127.88 |
| location POST | 80 | 473.30 | 867.35 | 916.57 | 480.18 |
| chat POST | 80 | 121.70 | 139.81 | 141.28 | 115.03 |
| *ws subscribe* | 80 | 18.32 | 31.74 | 39.95 | 17.81 |

### WebSocket `prey_location` delivery

`delivery` = client receive time − server `receivedAt` (transport + fan-out only).
`end-to-end` = client receive time − the moment the prey's POST was issued, so it
includes that POST's own latency and queueing. One sample per hunter per prey.
`Date.now()` resolution is 1 ms.

| Run | Samples | delivery p50 | delivery p95 | delivery max | end-to-end p50 | end-to-end p95 | end-to-end max |
|---|---:|---:|---:|---:|---:|---:|---:|
| C  | 50   | 3 | 5  | 5  | 37  | 63  | 64  |
| D  | 100  | 4 | 6  | 16 | 84  | 141 | 147 |
| A  | 200  | 4 | 7  | 8  | 91  | 163 | 170 |
| A2 | 200  | 5 | 7  | 8  | 87  | 164 | 172 |
| B  | 1600 | 6 | 9  | 28 | 473 | 867 | 916 |
| B2 | 1600 | 6 | 10 | 30 | 494 | 874 | 926 |

### Repeatability

Immediate repeats of the two main profiles, p50 in milliseconds:

| Operation | A | A2 | B | B2 |
|---|---:|---:|---:|---:|
| register | 637.90 | 603.10 | 609.00 | 613.28 |
| join | 94.00 | 108.61 | 181.62 | 193.02 |
| ready | 96.81 | 84.72 | 191.42 | 187.77 |
| start | 31.00 | 38.12 | 102.37 | 92.49 |
| location POST | 91.34 | 87.26 | 473.30 | 494.69 |
| chat POST | 46.13 | 45.06 | 121.70 | 121.05 |

The shape is stable; individual p50s move by up to ~15% (join), most by <10%.
Location p95 moved 163.90 → 164.13 (A) and 867.35 → 874.81 (B). Treat a single
number as ±15%, not as a precise constant.

No run failed: every request returned 2xx, every hunter received exactly one
`prey_location` per prey (the script asserts the count and the unique prey ids),
and no server log line of level warn/error was produced. An early draft of the
script failed its own assertions because WebSocket handlers were dispatched for
every message type; that was fixed before any of the numbers above were recorded.

## Interpretation

1. **Registration dominates setup and is CPU-bound, not I/O-bound.** Throughput is
   ~12.3–13.8 registrations/s in every profile (40 / 3.25 s, 160 / 12.32 s,
   20 / 1.55 s, 40 / 2.90 s), i.e. ≈80 ms of server CPU per registration. At the
   fixed client concurrency of 8, p50 stays at ~0.60 s for 20, 40 or 160 users;
   only the phase duration grows, linearly. That is the signature of an 80 ms
   synchronous `scryptSync` call blocking the event loop: eight in-flight requests
   simply queue behind each other. More client concurrency would raise p50, not
   throughput.

2. **Every room mutation rebuilds and serialises full room state.** `join` p50 goes
   94 ms (20/room) → 182 ms (40/room); `ready` 97 → 191 ms; `start` 31 → 102 ms.
   `joinByCode` and `setReady` each call `broadcastRoom()` and then `state()`, so a
   single join performs two full state builds, and each build reads the room,
   settings, members, active match and presence. During setup nobody is subscribed,
   so this is pure per-request CPU: room setup cost grows with room size, and
   aggregate setup work grows faster than the player count.

3. **The location burst is the worst tail.** p95 is 164 ms at 20 in flight and
   867 ms at 80 in flight, with p50 473 ms in B. That latency is almost entirely
   *before* the socket write: transport delivery is 6 ms p50 / 9 ms p95 with 1600
   samples, while end-to-end equals the POST latency. `reportLocation` does several
   synchronous reads (match, room, member, phase/reconcile, previous report),
   one insert, then `hub.broadcast(..., allow)` where `allow` calls
   `this.member(roomId, viewerId)` **once per subscribed hunter**. With 20 hunters
   that is ~20 extra SQL lookups per report, all on the single `DatabaseSync`
   connection; a 20-prey burst is ~400 lookups plus 20 writes, serialised.

4. **Dropping from 20 to 10 players per room does not make the per-request cost
   constant.** C→D doubles the rooms at 10/room: chat p50 39 → 84 ms, location
   p50 38 → 84 ms, join p50 56 → 118 ms, wall 2.42 → 4.58 s. Adding rooms adds
   independent work but the process has one event loop, so the totals are roughly
   linear and every latency rises.

5. **One core, always.** Server CPU is 94–100% of command wall across all profiles
   (e.g. 18.5 s CPU in 19.61 s wall for B), while 11 of 12 vCPUs sit idle. The
   ceiling is a single Node process, not the VM.

6. **Memory is not the constraint at this scale.** Server RSS stayed at 89–96 MB
   and client RSS at 59–78 MB; nothing suggests a leak over these ~20 s windows.

## Most likely bottleneck

The single-threaded event loop combined with **synchronous** `node:sqlite` calls and
`scryptSync`. Concretely: (a) signup cost is bounded by 80 ms of blocking scrypt per
user on the main thread; (b) live-game fan-out is O(room) and, for locations,
performs one synchronous DB lookup per hunter before each send. The WebSocket
transport itself is cheap (≤10 ms p95 at 1600 deliveries). If this had to serve more
than a few hundred concurrent users, the first fixes would be moving password
hashing off the main thread, removing the per-recipient DB lookup in the location
allow-list, and running multiple processes (one per core) with a real database —
not tuning the socket layer.

## Honest limits

- **Localhost only.** Client and server share one VM, one kernel and the loopback
  interface. There is no TLS handshake, no proxy, no load balancer, no packet loss
  and no WAN RTT. Real remote users add 20–200+ ms of network latency per request
  and a TLS-terminating hop. Do not read these as internet capacity.
- **Synthetic traffic.** No GPS drift, retries, reconnects, app backgrounding,
  offline queues, or mixed read endpoints (`/messages`, `/locations`, history).
  Bodies are tiny and highly compressible, and there is no HSTS/TLS overhead.
- **Phased, not mixed.** Registration, match setup, the location burst and chat run
  one after another. A real deployment has signups, lobby churn and active matches
  at the same time, which will be worse than any single phase here.
- **Single writer.** One `node:sqlite` connection serves every read and write on the
  event loop. WAL helps external readers; it does not parallelise this process.
  There is no connection pool, no clustering, no replication.
- **Fan-out is O(room).** Rounds are capped at 50 players by `MAX_PLAYERS`, and
  broadcast cost grows with sockets per room. 160 users / 80 sockets across 4 rooms
  is the largest tested configuration.
- **Rate limits were worked around, not removed.** Registration is 10/min/IP;
  chat is 10/10 s per user; locations are 20/min per user. The test gives each
  virtual player its own loopback IP so registration is measurable; a real group of
  40 players behind one NAT address cannot register in under four minutes. The
  per-user limits are active and the workload stays inside them, so throttling
  behaviour (429s under abuse) is not characterised here.
- **Single run, small n for `start`.** `start` has n=2 in A and n=4 in B, so its
  p95 is effectively the max of a handful of samples. All percentiles are
  nearest-rank.
- **Client is not free.** The load generator shares the CPU and ran 160 sockets and
  1600 message parses in one Node process; some of the tail may be client-side.
  Client CPU was not sampled.
- **Windows host.** File-system and timer behaviour differ from a Linux container;
  SQLite WAL commit costs are not directly comparable.
