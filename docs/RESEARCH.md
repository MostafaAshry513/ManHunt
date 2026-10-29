# Research

All sources accessed 2026-10-28. Only conclusions that changed a decision are listed.

## Android platform

| Topic | Source | Conclusion |
|---|---|---|
| Foreground service types (API 34+) | https://developer.android.com/develop/background-work/services/fgs/service-types | A location FGS must declare `android:foregroundServiceType="location"`, hold `FOREGROUND_SERVICE_LOCATION`, and have `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION` at runtime. Starting a location FGS from the background additionally requires `ACCESS_BACKGROUND_LOCATION`. |
| AGP 9.x compatibility | https://developer.android.com/build/releases/agp-9-5-0-release-notes | AGP 9.5 requires Gradle >= 9.6, JDK 17+, Build-Tools 36.0.0, supports max API 37. |
| Built-in Kotlin | https://developer.android.com/build/migrate-to-built-in-kotlin | AGP 9 compiles Kotlin itself; applying `org.jetbrains.kotlin.android` is an error. `kotlin.compilerOptions.jvmTarget` defaults to `compileOptions.targetCompatibility`. |
| AGP 9.0 release notes | https://developer.android.com/build/releases/agp-9-0-0-release-notes | Built-in Kotlin on by default; new DSL only; legacy variant API removed. |

## Maps and tiles

| Topic | Source | Conclusion |
|---|---|---|
| OSM tile usage policy | https://operations.osmfoundation.org/policies/tiles/ | Tiles are free to use but the servers are donation-funded. Mandatory: exact URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, visible attribution, a **distinct** User-Agent naming the app (library defaults such as `okhttp/x.y` are blocked), honour cache headers or cache >= 7 days. Prohibited: bulk/offline prefetching, no-cache headers, HTTP. |
| Renderer | https://github.com/osmdroid/osmdroid (Maven: `org.osmdroid:osmdroid-android:6.1.20`) | Raster OSM tiles, markers, polylines, polygons, circles, offline tile cache. No API key, no vendor account. Chosen for the first version; map access is isolated behind an interface so a vector provider can replace it. |

## Backend, storage, realtime

| Topic | Source | Conclusion |
|---|---|---|
| `node:sqlite` | https://nodejs.org/api/sqlite.html | Built into Node 22.5+/24: `DatabaseSync`, prepared statements, transactions, WAL. No native build step, no server process. Verified working on this host. |
| Fastify 5 | https://fastify.dev/docs/latest/ | Fast schema-based routing, `inject()` for integration tests without a socket, first-class plugin ecosystem. |
| `@fastify/websocket` | https://github.com/fastify/fastify-websocket | WebSocket routes on the same HTTP server and port; handler receives `(socket, request)`. |
| Zod | https://zod.dev | Runtime validation of request bodies and room settings. |
| OWASP password storage | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html | scrypt with N=2^14, r=8, p=1, 16-byte random salt, 32-byte key. Implemented with `node:crypto` (no native deps). |

## Rejected alternatives

- **PostgreSQL + PostGIS**: no Postgres on the host, no Docker. Geospatial needs are modest
  (distance, point-in-polygon, radius shrink) and implemented in tested TypeScript.
- **JWT access tokens**: opaque tokens in SQLite give instant revocation and simpler
  revocation-on-logout, at the cost of one indexed lookup per request.
- **Google Maps / Mapbox**: API keys, accounts and billing; conflicts with "free/open
  source, no paid account required".
- **Firebase / Supabase**: external account, vendor lock-in, and the brief requires a real
  self-hosted backend on this machine.
- **Ktor client**: OkHttp + kotlinx.serialization is smaller and sufficient for Android.
