// Shared SVG parts for the ManHunt redesign concept refs (official mark/wordmark, chalk FieldMarks).
const MH_WORDMARK_PATHS = [
  'M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z',
  'M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z',
  'M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z',
  'M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z',
  'M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z',
  'M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z',
  'M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z',
];
const MH_WORDMARK_TRANSFORMS = ['translate(0 0)', 'translate(86 0)', 'translate(164 0)', 'translate(242 0)', 'translate(316 0)', 'translate(394 0)', 'translate(472 0)'];

const mark = (size = 22) => `<svg class="mark" viewBox="0 0 108 108" width="${size}" height="${size}" aria-label="ManHunt mark">
  <path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="#22D3EE" stroke-width="10.4" stroke-linecap="butt"/>
  <circle cx="66.72" cy="33.65" r="8.6" fill="#FF7A59"/></svg>`;

const wordmark = (height = 22) => `<svg class="wordmark" viewBox="0 0 530 100" height="${height}" width="${(height * 5.3).toFixed(1)}" aria-label="MANHUNT" style="color:currentColor">
  ${MH_WORDMARK_PATHS.map((d, i) => `<path transform="${MH_WORDMARK_TRANSFORMS[i]}" d="${d}" fill="currentColor"/>`).join('')}
</svg>`;

const ico = (name) => {
  const s = (paths) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter">${paths}</svg>`;
  const G = {
    settings: '<path d="M3 6h15M3 12h11M3 18h17"/><path d="M20 4v4M16 10v4M22 16v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    share: '<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 11l8-4M8 13l8 4"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
    tag: '<circle cx="12" cy="12" r="7"/><circle cx="18.5" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
    prey: '<circle cx="12" cy="12" r="6.5" stroke-dasharray="30 11"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
    hunters: '<path d="M4 6l5 6-5 6M10 6l5 6-5 6M16 6l5 6-5 6"/>',
    trail: '<path d="M4 19l5-5 4 2 6-9"/><circle cx="4" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="13" cy="16" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="7" r="1.6" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    code: '<rect x="3" y="5" width="7" height="6"/><rect x="14" y="5" width="7" height="6"/><rect x="3" y="13" width="7" height="6"/><rect x="14" y="13" width="7" height="6"/>',
    roster: '<path d="M6 4v16M12 4v16M18 4v16"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    chevronUp: '<path d="M6 15l6-6 6 6"/>',
    send: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    locate: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
    x: '<path d="M5 5l14 14M19 5L5 19"/>',
    zone: '<path d="M12 3a9 9 0 1 1-7.5 4"/>',
    flag: '<path d="M5 21V4M5 4h12l-3 4 3 4H5"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none"/>',
    language: '<path d="M4 6h7M7.5 6v2c0 4-2 6-3.5 7M5 10c1 2.5 3 4.5 5 5"/><path d="M12 20l4-10 4 10M13.5 16.5h5"/>',
    update: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
    trail2: '<path d="M3 17c3-6 7-2 9-6s5-4 9-2"/>',
  };
  return s(G[name] || G.info || '');
};

const statusbar = (time = '21:04') => `<div class="sb"><span>${time}</span><span class="icons">
  <svg width="13" height="11" viewBox="0 0 13 11" fill="#E6EDF7"><rect x="0" y="7" width="2" height="4"/><rect x="3.5" y="5" width="2" height="6"/><rect x="7" y="2.5" width="2" height="8.5"/><rect x="10.5" y="0" width="2" height="11"/></svg>
  <svg width="15" height="12" viewBox="0 0 15 12" fill="none"><path d="M1 8.6c1.8-2.2 3.9-3.3 6.5-3.3s4.7 1.1 6.5 3.3" stroke="#E6EDF7" stroke-width="1.4"/><path d="M3.7 10.4c1.1-1.2 2.3-1.8 3.8-1.8s2.7.6 3.8 1.8" stroke="#E6EDF7" stroke-width="1.4"/><rect x="6.7" y="10" width="1.6" height="1.6" fill="#E6EDF7"/></svg>
  <svg width="21" height="11" viewBox="0 0 21 11" fill="none"><rect x="0.5" y="0.5" width="17" height="10" rx="1.5" stroke="#E6EDF7" stroke-opacity="0.5"/><rect x="2" y="2" width="13" height="7" fill="#E6EDF7"/><rect x="18.5" y="3.5" width="2" height="4" fill="#E6EDF7" fill-opacity="0.6"/></svg>
</span></div>`;

const navBar = () => `<div class="navbar"><i></i></div>`;

// Drawn "borrowed pitch" plate used on Auth / Home.
const fieldPlate = (w = 411, h = 148) => `<svg class="map" viewBox="0 0 411 ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="411" height="${h}" fill="#0B1220"/>
  <g class="blk" opacity=".9">
    <rect x="18" y="14" width="58" height="30"/><rect x="86" y="14" width="72" height="30"/>
    <rect x="168" y="14" width="52" height="30"/><rect x="230" y="14" width="66" height="30"/>
    <rect x="306" y="14" width="46" height="30"/><rect x="362" y="14" width="44" height="30"/>
    <rect x="18" y="60" width="58" height="34"/><rect x="86" y="60" width="72" height="34"/>
    <rect x="230" y="60" width="66" height="34"/><rect x="306" y="60" width="46" height="34"/>
    <rect x="18" y="110" width="58" height="30"/><rect x="86" y="110" width="72" height="30"/>
    <rect x="168" y="110" width="52" height="30"/><rect x="230" y="110" width="66" height="30"/>
    <rect x="306" y="110" width="46" height="30"/><rect x="362" y="110" width="44" height="30"/>
  </g>
  <g opacity=".55">
    <path d="M-5 52h421M-5 101h421M0 0v148M82 0v148M164 0v148M226 0v148M302 0v148M358 0v148" stroke="#223049" stroke-width="3"/>
  </g>
  <g opacity=".5">
    <path d="M168 52h58v8h-58zM230 101h66v9h-66z" fill="#0E2A33"/>
  </g>
  <circle cx="286" cy="76" r="58" fill="rgba(34,211,238,.06)" stroke="#22D3EE" stroke-width="1.4" stroke-dasharray="6 4"/>
  <path d="M300 44c-8 4-4 12-12 16s-6 14-14 18" fill="none" stroke="#FF7A59" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
  <circle cx="300" cy="44" r="4" fill="#FF7A59"/><circle cx="300" cy="44" r="8" fill="none" stroke="#FF7A59" stroke-width="1.2" opacity=".7"/>
  <circle cx="274" cy="78" r="5" fill="#FF7A59" opacity=".7"/>
  <circle cx="246" cy="36" r="3.4" fill="#A79BFF"/><circle cx="330" cy="66" r="3.4" fill="#A79BFF"/><circle cx="312" cy="104" r="3.4" fill="#A79BFF"/>
  <g opacity=".4" fill="#E6EDF7"><circle cx="26" cy="48" r="1"/><circle cx="120" cy="58" r="1"/><circle cx="210" cy="52" r="1"/><circle cx="360" cy="52" r="1"/><circle cx="60" cy="106" r="1"/><circle cx="142" cy="112" r="1"/><circle cx="260" cy="104" r="1"/><circle cx="388" cy="112" r="1"/></g>
</svg>`;

// The live field (map) used on the hunt / result refs.
const fieldMap = (w = 411, h = 560) => `<svg class="map" viewBox="0 0 411 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="411" height="560" fill="#0B1220"/>
  <g class="blk">
    <rect x="6" y="24" width="54" height="72"/><rect x="72" y="24" width="64" height="72"/>
    <rect x="148" y="24" width="44" height="72"/><rect x="204" y="24" width="72" height="72"/>
    <rect x="288" y="24" width="54" height="72"/><rect x="354" y="24" width="44" height="72"/>
    <rect x="6" y="112" width="54" height="86"/><rect x="72" y="112" width="64" height="86"/>
    <rect x="148" y="112" width="44" height="86"/><rect x="354" y="112" width="44" height="86"/>
    <rect x="6" y="214" width="54" height="92"/><rect x="72" y="214" width="64" height="92"/>
    <rect x="148" y="214" width="44" height="92"/><rect x="204" y="214" width="72" height="92"/>
    <rect x="288" y="214" width="54" height="92"/><rect x="354" y="214" width="44" height="92"/>
    <rect x="6" y="322" width="54" height="96"/><rect x="72" y="322" width="64" height="96"/>
    <rect x="204" y="322" width="72" height="96"/><rect x="288" y="322" width="54" height="96"/>
    <rect x="354" y="322" width="44" height="96"/>
    <rect x="6" y="434" width="54" height="100"/><rect x="72" y="434" width="64" height="100"/>
    <rect x="148" y="434" width="44" height="100"/><rect x="204" y="434" width="72" height="100"/>
    <rect x="288" y="434" width="54" height="100"/><rect x="354" y="434" width="44" height="100"/>
  </g>
  <path d="M148 214h44v86h-44z" class="grass"/>
  <path d="M288 112h54v86h-54z" class="grass"/>
  <path d="M0 430c50-18 90 6 132 2s72-28 120-22 100 30 159 20v130H0z" class="water"/>
  <g>
    <path d="M-10 102h431M-10 208h431M-10 316h431M-10 426h431M-10 540h431" class="road" stroke-width="7"/>
    <path d="M64 0v560M142 0v560M200 0v560M282 0v560M348 0v560" class="road" stroke-width="7"/>
    <path d="M-10 102h431M-10 426h431" class="road2" stroke-width="2"/>
    <path d="M64 0v560M348 0v560" class="road2" stroke-width="2"/>
  </g>
  <path d="M0 540L120 430l118-22 96-54 77-78" stroke="#223049" stroke-width="6" fill="none" opacity=".8"/>
  <circle cx="238" cy="262" r="152" fill="rgba(34,211,238,.055)" stroke="#22D3EE" stroke-width="1.6" stroke-dasharray="7 5"/>
  <path d="M192 338l20-33 26-26 22-44 22-22" class="trail"/>
  <circle cx="192" cy="338" r="5.5" class="mk-own"/><circle cx="192" cy="338" r="12" class="mk-own-ring"/>
  <circle cx="282" cy="213" r="5.5" class="mk-prey"/><circle cx="282" cy="213" r="12" class="mk-prey-ring"/><circle cx="282" cy="213" r="26" class="ping"/>
  <circle cx="148" cy="168" r="4.5" class="mk-prey-stale"/><circle cx="148" cy="168" r="10" class="mk-prey-stale-ring"/>
  <g class="map-label"><text x="22" y="18">N</text><text x="372" y="18">N</text></g>
  <g opacity=".35" fill="#E6EDF7"><circle cx="110" cy="52" r="1"/><circle cx="252" cy="62" r="1"/><circle cx="330" cy="200" r="1"/><circle cx="42" cy="298" r="1"/><circle cx="260" cy="392" r="1"/><circle cx="362" cy="470" r="1"/></g>
</svg>`;

const tinyMap = (h = 178) => `<div class="result-map">${fieldMap(411, 560)}<span class="osm">\u00A9 OpenStreetMap contributors</span></div>`;

// Light "daylight chalk" plate for the light-theme ref.
const fieldPlateLight = (w = 411, h = 148) => `<svg class="map" viewBox="0 0 411 ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="411" height="${h}" fill="#EDF1F7"/>
  <g opacity=".9">
    <rect x="18" y="14" width="58" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="86" y="14" width="72" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="168" y="14" width="52" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="230" y="14" width="66" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="306" y="14" width="46" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="362" y="14" width="44" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="18" y="60" width="58" height="34" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="86" y="60" width="72" height="34" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="230" y="60" width="66" height="34" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="306" y="60" width="46" height="34" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="18" y="110" width="58" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="86" y="110" width="72" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="168" y="110" width="52" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="230" y="110" width="66" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="306" y="110" width="46" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
    <rect x="362" y="110" width="44" height="30" fill="#DCE4F0" stroke="#C3D0E2"/>
  </g>
  <g opacity=".8"><path d="M-5 52h421M-5 101h421M0 0v148M82 0v148M164 0v148M226 0v148M302 0v148M358 0v148" stroke="#C3D0E2" stroke-width="2"/></g>
  <circle cx="286" cy="76" r="58" fill="rgba(12,107,132,.06)" stroke="#0C6B84" stroke-width="1.4" stroke-dasharray="6 4"/>
  <path d="M300 44c-8 4-4 12-12 16s-6 14-14 18" fill="none" stroke="#B33A0F" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
  <circle cx="300" cy="44" r="4" fill="#B33A0F"/><circle cx="300" cy="44" r="8" fill="none" stroke="#B33A0F" stroke-width="1.2" opacity=".7"/>
  <circle cx="246" cy="36" r="3.4" fill="#5B21B6"/><circle cx="330" cy="66" r="3.4" fill="#5B21B6"/><circle cx="312" cy="104" r="3.4" fill="#5B21B6"/>
</svg>`;
