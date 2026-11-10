# ManHunt icon workbench

The `app-icon` skill is installed and this workbench is running the icon round.

- Skill source: https://github.com/euzharkov/app-design-skills (MIT, see `LICENSE-app-design-skills.txt`)
- Installed at: `.agents/skills/app-icon`
- Workbench: `design/icon/icon.html`
- Run: `python -m http.server 4681 --directory design/icon`
- Open: `http://127.0.0.1:4681/icon.html?solo=concepts`

The workbench renders one SVG master on a 1024 grid into real contexts: 60 / 40 / 29 / 16 px, squint and one-color tests, the competitor shelf, iOS home screen, Android 108/72/66 layers with masks and themed icons, macOS, favicons, and wallpapers. Exports go through `export-icons.sh` only after a concept is chosen.

## Round 05 - use the approved ManHunt mark

Round 04 invented new marks. Round 05 starts from the approved identity in `design/brand/identity`: the Open Zone mark. The ring is the field, the break is the hunt, the dot is the report. That is the recognition, not another new metaphor.

| id | What it is | Why |
|---|---|---|
| `openzone` | Approved Open Zone geometry, bone ring, lime report point, bitumen ground | Recommended. The mark people already see in the app header and lockup |
| `openflare` | Same geometry, flare ring, lime point | More energy at 16 px, but the ring competes with its own point |
| `m` | Rounded M monogram | The initials route; generic until the brand is known |
| `hide` | One hooded silhouette | The human route; not ManHunt-specific without the mark |

The mark is scaled from `design/brand/identity/final/lockup/mark-light-on-dark.svg` onto the 1024 master. Rounded caps replace the old butt caps so the ring feels drawn, not cut. Open Zone and Open Flare were both judged at 60 / 40 / 29 / 16 and through the Android adaptive layers.

### Terminal bead correction

The first pass of Open Zone had a large dot sitting on the ring, then a separated dot that collapsed at 16 px. The final mark is one object: a **205-radius ring**, **84 stroke**, with a **64-radius point** attached to the outer rim at the break. The point is the terminal bead, not a second floating object. It keeps the ring hole clear and survives the 16 px strip.

Final master: [open-zone-mark.svg](open-zone-mark.svg)  
Preview: [open-zone-preview.png](open-zone-preview.png)

## Evidence

- [Concepts](shots/concepts.png)
- [Small-size legibility](shots/sizes.png)
- [Android adaptive layers](shots/android.png)
- [Competitor shelf](shots/shelf.png)

## Status

Open Zone is the recommendation and is now applied to the Android launcher resources in version **0.17.2 (47)**: foreground, monochrome, legacy and round mipmaps, splash background, site favicon. The workbench remains the source for the next round.
