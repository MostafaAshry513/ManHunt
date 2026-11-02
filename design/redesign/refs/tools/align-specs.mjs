// Align the specs with the rendered refs: sentence-case display/button copy, keep state words uppercase.
import { readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';

const root = 'C:/dev/ManHunt/design/redesign/';
const files = [];
for (const f of await readdir(root)) if (f.endsWith('.md')) files.push(root + f);
for (const f of await readdir(root + 'screens')) if (f.endsWith('.md')) files.push(root + 'screens/' + f);
files.push(root + 'refs/README.md');

const replacements = [
  ['HIDE FROM YOUR FRIENDS.', 'Hide from your friends.'],
  ['HIDE FROM', 'Hide from'],
  ['YOUR FRIENDS.', 'your friends.'],
  ['`BEGIN THE HUNT`', '`Begin the hunt`'],
  ['BEGIN THE HUNT', 'Begin the hunt'],
  ['`TAG PREY`', '`Tag prey`'],
  ['TAG PREY', 'Tag prey'],
  ['`READY TO HUNT`', '`Ready to hunt`'],
  ['READY TO HUNT', 'Ready to hunt'],
  ['`STAND DOWN`', '`Stand down`'],
  ['STAND DOWN', 'Stand down'],
  ['`WAITING FOR {NAME}`', '`Waiting for {name}`'],
  ['WAITING FOR {NAME}', 'Waiting for {name}'],
  ['WAITING FOR YASMIN', 'Waiting for Yasmin'],
  ['`BACK TO THE LOBBY`', '`Back to the lobby`'],
  ['BACK TO THE LOBBY', 'Back to the lobby'],
  ['`SHARE THE CODE`', '`Share the code`'],
  ['SHARE THE CODE', 'Share the code'],
  ['`CONFIRM TAG`', '`Confirm tag`'],
  ['CONFIRM TAG', 'Confirm tag'],
  ['`REJECT TAG`', '`Reject tag`'],
  ['REJECT TAG', 'Reject tag'],
  ['`THEY\'RE TAGGED`', '`They\'re tagged`'],
  ['THEY\'RE TAGGED', 'They\'re tagged'],
  ['`NOT YET`', '`Not yet`'],
  ['NOT YET', 'Not yet'],
  ['`KEEP PLAYING`', '`Keep playing`'],
  ['KEEP PLAYING', 'Keep playing'],
  ['`PAUSE THE HUNT`', '`Pause the hunt`'],
  ['PAUSE THE HUNT', 'Pause the hunt'],
  ['`PAUSE HUNT`', '`Pause hunt`'],
  ['PAUSE HUNT', 'Pause hunt'],
  ['`END THE HUNT`', '`End the hunt`'],
  ['END THE HUNT', 'End the hunt'],
  ['`END HUNT`', '`End hunt`'],
  ['`END THE ROOM`', '`End the room`'],
  ['END THE ROOM', 'End the room'],
  ['`LEAVE THE HUNT`', '`Leave the hunt`'],
  ['`SAVE RULES`', '`Save rules`'],
  ['SAVE RULES', 'Save rules'],
  ['`USE MY LOCATION`', '`Use my location`'],
  ['USE MY LOCATION', 'Use my location'],
  ['`OPEN SETTINGS`', '`Open settings`'],
  ['OPEN SETTINGS', 'Open settings'],
  ['`TURN ON LOCATION`', '`Turn on location`'],
  ['TURN ON LOCATION', 'Turn on location'],
  ['`ALLOW LOCATION`', '`Allow location`'],
  ['ALLOW LOCATION', 'Allow location'],
  ['`CHECK FOR UPDATES`', '`Check for updates`'],
  ['CHECK FOR UPDATES', 'Check for updates'],
  ['`DOWNLOAD AND INSTALL`', '`Download and install`'],
  ['DOWNLOAD AND INSTALL', 'Download and install'],
  ['`TRY AGAIN`', '`Try again`'],
  ['`LIVE`', '`LIVE`'], // keep state words
];

for (const f of files) {
  let t = await readFile(f, 'utf8');
  const before = t;
  for (const [a, b] of replacements) t = t.split(a).join(b);
  if (t !== before) {
    await writeFile(f, t, 'utf8');
    console.log('updated', f.replace(root, ''));
  }
}

// tokens.md: allow uppercase mono data labels; keep headings/buttons/prose sentence case.
const tokensPath = root + 'tokens.md';
let tokens = await readFile(tokensPath, 'utf8');
tokens = tokens.replace(
  '1. **Sentence case everywhere.** The only uppercase type is `StateTag` (true machine state) and the data\n   face in `CodePlate`/codes. No all-caps eyebrow labels, no letterspaced small caps for decoration.',
  '1. **Sentence case everywhere except true labels.** Uppercase is allowed only in (a) `StateTag` words\n   (`LIVE`, `HEAD START`, `PAUSED`, `FULL TIME`, `CANCELLED`), (b) mono data labels that are genuinely data\n   (field labels such as `HUNT NAME`, values such as `GRANTED`, team marks such as `HOST`/`YOU`), and (c) the\n   invite code. Never for headings, eyebrows, buttons or prose; never letterspaced small caps as decoration.'
);
tokens = tokens.replace(
  '- ALL-CAPS letterspaced labels except `StateTag`; "01/02/03" decoration; mono for prose.',
  '- ALL-CAPS headings, eyebrow labels or button labels (uppercase is reserved for state words, mono data labels and codes); "01/02/03" decoration; mono for prose.'
);
await writeFile(tokensPath, tokens, 'utf8');
console.log('updated tokens.md');
