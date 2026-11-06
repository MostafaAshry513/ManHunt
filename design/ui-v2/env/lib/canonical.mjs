// The canonical page set from briefs/00-workstream.md. Every direction folder is
// expected to contain exactly these 14 page files (<id>.html), and the contact
// sheets use this order so directions line up page-for-page.
export const CANONICAL_PAGES = [
  { id: 'auth', title: 'Sign in / create account', note: 'quiet form, server row demoted, brand line' },
  { id: 'roles', title: 'Sides + mode catalogue', note: 'Prey vs Hunters, Classic playable, planned modes honest' },
  { id: 'home', title: 'Host or join', note: 'host action, join-by-code, profile/settings entry' },
  { id: 'lobby', title: 'Room lobby (host view)', note: 'room code, team sheet, readiness, begin dock' },
  { id: 'hunt-hunter', title: 'Live hunt — Hunter', note: 'map-first, reports + trails + zone, clock, tag action' },
  { id: 'hunt-prey', title: 'Live hunt — Prey', note: 'own position, zone/clock, report cadence, no other prey positions' },
  { id: 'chat', title: 'Room field log', note: 'messages + system events, composer' },
  { id: 'result', title: 'Full time', note: 'winner, final score, duration, rematch/lobby/history' },
  { id: 'history', title: 'Past hunts', note: 'list + one match summary' },
  { id: 'settings', title: 'Settings', note: 'theme, text size, language, permissions, updates, server' },
  { id: 'sheet-tag-claim', title: 'Sheet — tag claim', note: 'confirm/dispute, who/when, consequence copy' },
  { id: 'sheet-room-settings', title: 'Sheet — host edits rules', note: 'timers, zone/shrink, trails, report interval, tag policy' },
  { id: 'lobby-rtl', title: 'Proof — Arabic RTL lobby', note: 'genuinely mirrored lobby, LTR numerals/code' },
  { id: 'home-light', title: 'Proof — Home, light theme', note: 'same Home in daylit chalk theme' },
];

export const PAGE_IDS = CANONICAL_PAGES.map((p) => p.id);
const RANK = new Map(PAGE_IDS.map((id, i) => [id, i]));

export const pageId = (file) => file.replace(/\.html?$/i, '');
export const pageTitle = (file) => {
  const id = pageId(file);
  return CANONICAL_PAGES.find((p) => p.id === id)?.title || id;
};

/** Sort HTML page filenames into canonical order; unknown names alphabetically after. */
export function sortPages(files) {
  return [...files].sort((a, b) => {
    const ai = RANK.get(pageId(a));
    const bi = RANK.get(pageId(b));
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.localeCompare(b, 'en', { numeric: true });
  });
}

/** Canonical order for the matrix: every known page, with present extras appended. */
export function matrixOrder(extraIds = []) {
  const known = new Set(PAGE_IDS);
  // Dedupe extras: two directions may carry the same extra state-page id
  // (e.g. state-paused); the matrix/strips want one row per page, not per direction.
  const extras = [...new Set(extraIds.filter((id) => !known.has(id)))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  return [...PAGE_IDS, ...extras];
}
