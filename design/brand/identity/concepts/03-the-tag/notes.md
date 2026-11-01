# 03 · The Tag

**Strategy:** predator / prey tension — the tag instant, one frame before it lands.

## Idea

The only verb in the game is a tag: a hunter physically touching a prey. So this direction draws the
instant itself — the hunters' violet ring is closed, and the coral prey dot is at its edge, in contact.
It is the only concept that spends both team colours and no cyan at all: the field is the dark ground,
the players are the two coloured things, exactly as the app's role pills teach it.

## Construction

108 × 108 dp artboard, centre (54, 54).

| Element | Value |
|---|---|
| Hunters' ring radius (centreline) | 18.2 dp |
| Ring weight | 9.8 dp |
| Prey dot | r 8.8 dp, centre at 24.0 dp radius, −36° |
| Contact overlap | 7.9 dp of the dot's diameter lands on the ring's outside |
| Max mark radius | 32.7 dp (measured) / 33 dp safe radius |

The overlap is deliberately generous: a tag is *contact*, not "almost". The dot is not placed dead-centre
on the rim but a little past it, so the composition has a direction — the prey is being pushed out of the
ring rather than balanced on it.

## Why it survives the tests

- **48 px:** a violet ring with a coral bead on its edge; the coral region stays a distinct colour area
  at 48 px even though the two shapes touch, so the story survives where fine geometry cannot.
- **Monochrome:** ring and dot flatten into one silhouette — a ring with a bump at the contact point.
  That is the mark, and it reads as one solid shape in pure black/white (see `VERIFICATION.md`).
- **Palette semantics:** this is the only direction that lets the icon be *about the two teams* rather
  than about the field. Violet = Hunters, coral = Prey, no cyan spent on a team.
- **"Chase, not navigation":** a closed ring with a body at its edge is a capture, not a route; there is
  no path, no pin, no crosshair.

## Risks

- No cyan means the launcher icon carries less of the brand's primary signal; the cyan lives in the app
  chrome and in the wide/splash lockup instead.
- The mono silhouette is inherently one connected shape (contact is the idea), so a themed launcher
  loses the two-role reading — acceptable, but it is the least "two-part" mark of the three.
- Without the story, a ring + bead can read as a planet and moon. The app's UI (role pills, hunting map)
  supplies the missing half immediately.

## Files

`mark.svg` (adaptive foreground, transparent) · `background.svg` (field layer) ·
`icon-composite.svg` (preview/Play art) · `icon-monochrome.svg` (themed layer) ·
`../previews/03-the-tag/sheet.png` (specimen) · `../previews/03-the-tag/exports/` (rasters).
