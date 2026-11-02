// Small visual refinements to the concept refs (UTF-8 safe).
import { readFile, writeFile } from 'node:fs/promises';
const refs = 'C:/dev/ManHunt/design/redesign/refs/';

let css = await readFile(refs + 'app.css', 'utf8');
css = css.replace('.hero-plate { height: 136px;', '.hero-plate { height: 124px;');
css = css.replace(".home-line { font-family: var(--disp); font-weight: 700; font-size: 52px; line-height: 0.87; letter-spacing: -0.01em; margin: 16px 0 0; }",
  ".home-line { font-family: var(--disp); font-weight: 700; font-size: 50px; line-height: 0.87; letter-spacing: -0.01em; margin: 14px 0 0; }");
css = css.replace('.host-block { margin-top: 16px;', '.host-block { margin-top: 14px;');
css += `
/* RTL system chrome: the status bar and back arrow follow the platform, not the layout. */
.phone[dir='rtl'] .sb { direction: ltr; }
.phone[dir='rtl'] .hicon.back-mirror svg { transform: scaleX(-1); }
`;
await writeFile(refs + 'app.css', css, 'utf8');

let settings = await readFile(refs + 'settings.html', 'utf8');
settings = settings.replace('<div class="stateword" style="color:var(--cyan)">THE HUNT STARTS IN</div>',
  '<div class="caption" style="color:var(--cyan)">The hunt starts in</div>');
await writeFile(refs + 'settings.html', settings, 'utf8');

let rtl = await readFile(refs + 'lobby-rtl.html', 'utf8');
rtl = rtl.replace('<span class="hicon" id="back"></span>', '<span class="hicon back-mirror" id="back"></span>');
await writeFile(refs + 'lobby-rtl.html', rtl, 'utf8');

let board = await readFile(refs + 'direction-board.html', 'utf8');
board = board.replace('<div class="board-page">', '<div class="board-page" style="min-height:1760px;height:1760px">');
board = board.replace(`        <div class="caption" style="margin-top:10px">One cyan surface per screen. Team colour is never the only cue: glyph + name.
        No gradients, glow, shadow, glass. Depth = overlap + hairlines.</div>
      </div>`,
`        <div class="caption" style="margin-top:10px">One cyan surface per screen. Team colour is never the only cue: glyph + name.
        No gradients, glow, shadow, glass. Depth = overlap + hairlines.</div>
      </div>

      <div class="bp-panel" style="margin-top:22px">
        <div class="bp-h">00 · the brief, in the owner's words</div>
        <div class="quote-bar" style="border-left:2px solid var(--cyan);padding-left:16px">
          <div class="display" style="font-size:38px;line-height:0.95">"It looks like generic dark cards."</div>
          <div class="body-s" style="margin-top:8px">So the redesign removes the card system entirely and replaces it with the
          objects the game actually uses: a scoreboard, a team sheet, a code, a chalk rule, a match report. The brand stops being
          wallpaper and becomes the layout.</div>
        </div>
      </div>`);
await writeFile(refs + 'direction-board.html', board, 'utf8');
console.log('refinements applied');
