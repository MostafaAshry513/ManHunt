# ManHunt icon workbench

The `app-icon` skill is installed and this is its workbench, not another hand-rolled icon sheet.

- Skill source: https://github.com/euzharkov/app-design-skills (MIT, see `LICENSE-app-design-skills.txt`)
- Installed at: `.agents/skills/app-icon`
- Workbench: `design/icon/icon.html`
- Run: `python -m http.server 4681 --directory design/icon`
- Open: `http://127.0.0.1:4681/icon.html?solo=concepts`

The workbench renders one SVG master on a 1024 grid into real contexts: 60 / 40 / 29 / 16 px, squint and one-color tests, the competitor shelf, iOS home screen, Android 108/72/66 layers with masks and themed icons, macOS, favicons, and wallpapers. Exports go through `export-icons.sh` only after a concept is chosen.

## Round 03

Six directions, three families:

| id | Family | Bet | Risk |
|---|---|---|---|
| `m` | letterform | The M is the brand at 29 px | An M is generic on a home screen |
| `peek` | symbol | Hide-and-seek is a human verb | Can become a generic avatar |
| `cut` | abstract | One hard cut survives every mask | Least narrative |
| `flash` | symbol | The hunt has a tool; a searchlight | Beam reads as an arrow at 16 |
| `afterimage` | abstract | Report age is the product rule | Without the ring it is just a dot |
| `stub` | symbol | The invite code is a doorway | Six characters cannot be literal at 16 |

The M was outlined from Bricolage with `outline-text.py`, so the workbench no longer depends on live text for that master. The Hound direction from the previous sheet was rejected: the silhouette read as a cat/owl, not a hound, at launcher size.

## Evidence

- [Concepts](shots/concepts.png)
- [Small-size legibility](shots/sizes.png)
- [Android adaptive layers](shots/android.png)
- [Competitor shelf](shots/shelf.png)

## Status

No winner is marked and nothing is applied to the app. The next decision is a direction, then the workbench exports the Android adaptive background/foreground/monochrome layers and the existing launcher resources get replaced.
