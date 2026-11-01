# 02 · The Corner

**Strategy:** real place / borrowed pitch — the corner flag is a player.

## Idea

The pitch is borrowed: a car park, a campus quad, six streets. So the mark is the one piece of a field
that proves there is a field at all — a chalk corner. Two thick cyan markings meet at a true 90° angle
and the coral prey dot is held inside the angle. The corner is the place; the dot is the player standing
in it. Nothing is decorative: two rules and a player.

## Construction

108 × 108 dp artboard, centre (54, 54).

| Element | Value |
|---|---|
| Corner vertex | (42, 62) dp, whole mark rotated −9° |
| Vertical marking | 31 dp long, 11.4 dp thick, square chalk ends |
| Horizontal marking | 27 dp long, 11.4 dp thick, square chalk ends |
| Joint | true 90°, mitered outer corner, sharp inner corner |
| Prey dot | r 9.8 dp, on the inner bisector, 2.4 dp clear of both markings |
| Dot centre | ~25.3 dp from the vertex, on the angle's bisector |
| Max mark radius | 28.8 dp (measured) / 33 dp safe radius |

The legs are deliberately unequal so the form reads as *a corner of something larger* rather than as a
bracket or a tick; the −9° rotation makes it a line scored on real ground instead of an axis-aligned UI
corner. The dot is sized larger than the stroke is thick, so the player dominates the rule.

## Why it survives the tests

- **48 px:** two bold bars and a coral disc; the geometry is legible as a corner at any size because it
  is a true right angle.
- **Monochrome:** the two markings flatten into one continuous corner, the dot stands clear inside it.
- **Palette semantics:** cyan = the field's markings; coral = Prey. Correct by construction.
- **"Chase, not navigation":** a corner is a place, not a route; the dot is a player, not a pin. The
  tension comes from the dot being *held* between two rules rather than plotted on a map.

## Risks

- A right angle is also the shape of a crop/video-call marker. The dot, the unequal legs and the
  rotation are the three defences; if a reviewer still reads "corner bracket", this direction is out.
- The fewest "motion" cues of the three concepts — it is the calm, place-led option, not the kinetic one.

## Files

`mark.svg` (adaptive foreground, transparent) · `background.svg` (field layer) ·
`icon-composite.svg` (preview/Play art) · `icon-monochrome.svg` (themed layer) ·
`../previews/02-the-corner/sheet.png` (specimen) · `../previews/02-the-corner/exports/` (rasters).
