# Changelog

All notable changes to ManHunt are recorded here. The release workflow copies the section
for a tag into the GitHub Release body, and the in-app Updates page shows that text plus the
release date.

## [0.13.1] — 2026-11-01

### Added

- Lobby team sides keep their team-colour outlines again, but only the chosen side looks
  active: full-strength 3dp outline, tinted background and a selected check badge; the other
  side gets a thin translucent team-colour outline.
- Predictive back now reveals the actual Home page behind the shrinking Settings/Roles screen
  while the system gesture is in progress, instead of leaving a blank background.

### Changed

- Text-size slider is preview-only while dragging: only the sample line rescales (using the
  same theme scaling as the app) and the whole app applies the size when the slider is released.

### Fixed

- “Use my location” requests a fresh live GPS/network fix on every press (cached fix only as
  a timeout fallback), so placing the zone while moving no longer reuses a stale position.

## [0.13.0] — 2026-10-31

### Added

- **Tactical map-first hunt screen** (layout C): the live-hunt map now fills the whole Game
  page, with a two-chip HUD, floating claim/dispute banners and a bottom hunt sheet for Tag,
  Trails or location actions. Roster, hunt history, rules, pause/end and prey reports live in
  the expandable details area; lobby and chat are unchanged.
- **Deep Teal map palette**: navy/teal raster treatment tuned for the app's dark theme, with
  dark casings under the play zone and trails so they stay readable over bright roads.
- The map now fits the play zone, visible prey reports and own position on first open
  (instead of jumping to own position at max zoom), with hidden prey never included in bounds.
- Stale/unverified prey reports get a hollow amber marker and a small HUD state; live prey
  keep the coral marker. Eliminated prey are no longer drawn.
- OSM attribution stays visible and clickable in the hunt sheet, and huntmaster actions are
  labeled and separated from the primary Tag action.

### Changed

- Hunt sheet expands to a capped, scrollable details panel; no fixed-height map box and no
  duplicated phase card during a live hunt.

## [0.12.4] — 2026-10-31

### Added

- Predictive-back animation when leaving Settings/Roles with the system back gesture:
  the screen now follows the finger (scale/slide) before navigating Home.
- Settings → Updates now shows the release date and a “What’s new” changelog box.
- Bundled recent-changes fallback so the Updates page is useful before/without a network check.

### Changed

- Roles page trimmed to its essentials (removed the extra “What you need” and “Play safe”
  cards per owner direction).

## [0.12.3] — 2026-10-31

### Changed

- Removed the Roles “What you need” and “Play safe” cards.

## [0.12.2] — 2026-10-31

### Added

- Live whole-app text scaling on the text-size slider, with the sample line now using real
  themed text instead of a double-scaled preview.
- Input rules: username grammar, 6-character alphanumeric invite codes, digit-only rule
  fields, coordinate filtering and save-time range validation.
- A real one-shot location fix backs “Use my location” in the zone settings.

### Fixed

- Only the selected team card glows; the unselected side uses a neutral outline.
- Lint-clean `DeviceLocation` permission handling.

## [0.12.1] — 2026-10-31

### Fixed

- Bound the osmdroid map-tile cache (48 MB max / 32 MB trim) and added Settings → Storage
  with cache size and clear action.
- Pruned downloaded update APKs from older versions.

## [0.12.0] — 2026-10-31

### Added

- Robolectric screenshot tour for all primary screens and button-state tests.
- Home “How it works” card, version-free README and brand brief groundwork.

### Changed

- Roles/Settings/Home polish: centered role headings, single Roles entry point, Home
  tagline, Settings Account cleanup.
