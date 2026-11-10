# ManHunt icon workbench

The `app-icon` skill is installed and this is its workbench.

- Skill source: https://github.com/euzharkov/app-design-skills (MIT, see `LICENSE-app-design-skills.txt`)
- Installed at: `.agents/skills/app-icon`
- Workbench: `design/icon/icon.html`
- Run: `python -m http.server 4681 --directory design/icon`
- Open: `http://127.0.0.1:4681/icon.html?solo=concepts`

The workbench renders one SVG master on a 1024 grid into real contexts: 60 / 40 / 29 / 16 px, squint and one-color tests, the competitor shelf, iOS home screen, Android 108/72/66 layers with masks and themed icons, macOS, favicons, and wallpapers. Exports go through `export-icons.sh` only after a concept is chosen.

## Round 04 - smoother, fewer elements

Round 03 stacked a wall, a head and an eye. This round is built from one continuous shape plus the lime report point, with rounded joins and no hard corners.

| id | Family | Bet | Risk |
|---|---|---|---|
| `m` | letterform | A rounded M carries the brand and still feels drawn | An M is generic; the dot in the counter has to make it ours |
| `hide` | symbol | A single hooded silhouette makes hiding a body, not a wall plus a head | It can become a generic avatar |
| `leap` | symbol | Movement is one continuous stroke, not a body built from parts | The arc can read as decoration |
| `chase` | abstract | Two opposing curves and one point say pursuit | A pair of arcs can look like a loading glyph |

The M was outlined from Bricolage with `outline-text.py`, so the workbench does not depend on live text for that master. Hound was removed: its silhouette read as a cat/owl at launcher size.

## Evidence

- [Concepts](shots/concepts.png)
- [Small-size legibility](shots/sizes.png)
- [Android adaptive layers](shots/android.png)
- [Competitor shelf](shots/shelf.png)

## Status

No winner is marked and nothing is applied to the app. The next decision is a direction, then the workbench exports the Android adaptive background/foreground/monochrome layers and the existing launcher resources get replaced.
