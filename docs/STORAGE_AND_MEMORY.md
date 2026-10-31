# Storage and memory notes

## Why a 2 MB install showed ~150 MB of storage

Android reports **app + app data + cache** as one number. ManHunt's PNG/Compose APK is
~2.1 MB, but it embeds osmdroid for the live map. osmdroid's defaults are:

- `tileFileSystemCacheMaxBytes = 600 MB`
- `tileFileSystemCacheTrimBytes = 500 MB`

The map caches every viewed tile in `cacheDir/osmdroid/tiles`, so a few hunts can easily
reach hundreds of MB. This is cache, not the installed package — Android can clear it
under storage pressure, but it is still visible to players.

A second, smaller contributor was the in-app updater: each downloaded update APK was
stored in `cacheDir/updates/` and older versions were not pruned.

## Fixes (v0.12.1)

- The osmdroid tile cache is capped at **48 MB** and trimmed at **32 MB** at app start
  (`ManHuntApplication`). Existing oversized caches are trimmed by osmdroid on startup.
- **Settings → Account → Storage** now shows the current cache size and offers
  **Clear cache** (map tiles + update APKs). It recreates the tile directory so the map
  keeps working after clearing.
- The updater deletes older downloaded APKs and prunes APKs whose version is already
  installed (`UpdateManager`).
- Clear cache is covered by `StorageCacheTest`.

## Memory/leak audit

Static review of the lifecycle boundaries:

- `MatchMap` pauses and calls `onDetach()` on the osmdroid `MapView` in `DisposableEffect`
  when the composable leaves composition — no leaked `MapView`/tile provider.
- `TrackingService.onDestroy()` removes location updates, cancels its scope and clears
  `LiveLocation`; the room screen stops it on dispose and when tracking is not applicable.
- `RoomViewModel.stop()` cancels polling/refresh jobs and closes the WebSocket; it runs on
  lifecycle STOP and on composable dispose, and from `onCleared()`.
- Flows that drive UI use lifecycle-aware collection (`collectAsStateWithLifecycle` for
  GPS); no per-item collectors in lazy rows.
- The only long-lived holders are app-scoped singletons (`Graph`, `LiveLocation`,
  `UpdateManager`) holding application context / in-memory state — no Activity or View
  references.
- The chat list uses stable keys and cached formatters; map overlays are rebuilt but the
  `MapView` itself is detached on exit.

Limitation: this environment has no physical device/heap profiler, so this is a code and
lifecycle audit plus unit/instrumentation coverage, not a captured heap dump. If storage
still grows after 0.12.1, Settings → Account → Storage now shows the exact cache number to
report, and the cap keeps it bounded.
