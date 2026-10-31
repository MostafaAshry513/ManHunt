# Changelog

All notable changes to ManHunt are recorded here. The release workflow copies the section
for a tag into the GitHub Release body, and the in-app Updates page shows that text plus the
release date.

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
