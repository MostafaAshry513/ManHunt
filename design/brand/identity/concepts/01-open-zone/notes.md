# 01 · Open Zone

**Strategy:** chase / pursuit tension — the zone that does not close.

## Idea

The hunt zone is drawn as a cyan chalk ring with a deliberate break, and the coral prey dot is in the
break. Someone is out of the zone, or is about to be: the circle is the game's rule, the break is the
player who has slipped it. The mark reports a *state of the chase*, not a location — there is no pin,
no crosshair, no letter, and the ring is emphatically not a target because the dot sits in the opening
rather than behind concentric rings.

## Construction

108 × 108 dp artboard, centre (54, 54).

| Element | Value |
|---|---|
| Zone arc radius (centreline) | 22.2 dp |
| Zone arc weight | 10.4 dp, butt caps (radial chalk cuts) |
| Arc opening | 72°, centred at −56° (upper right) |
| Arc sweep | 288° |
| Prey dot | r 8.6 dp, centre at 24.0 dp radius, −58° (2° off the opening centre) |
| Max mark radius | 32.6 dp / 33 dp safe radius |
| Minimum gap, ring to dot | 5.4 dp |

The dot is nudged 2° towards the leading cut, so the ring reads as *closing* rather than as a finished
circle. Butt caps are intentional: a chalk stroke is cut square where the hand stopped, and the radial
cut doubles as the direction cue.

## Why it survives the tests

- **48 px:** a thick cyan C with a coral bead in its mouth — two shapes, no fine detail. The 5.4 dp gap
  renders as ~2.4 px at 48 px, so the pieces never fuse.
- **Monochrome:** ring and dot both flatten to one ink; the gap keeps the silhouette readable as an
  open zone with a mark at the break.
- **Palette semantics:** cyan is the field/referee (never a team); coral is Prey. No third colour is
  spent. Works on the navy field without a gradient.
- **Not navigation:** no pin, no route, no two-dot line, no crosshair — the only literal object is a
  zone, and the dot is leaving it.

## Risks

- At 16 px the dot and ring touch in the pixel grid; the favicon should ship at 32 px (see
  `VERIFICATION.md`).
- Anyone who has never opened the app may read "C + dot" before they read "zone". The app context and
  the brand story carry that; the shape itself is not a map or a target.

## Files

`mark.svg` (adaptive foreground, transparent) · `background.svg` (field layer) ·
`icon-composite.svg` (preview/Play art) · `icon-monochrome.svg` (themed layer) ·
`../previews/01-open-zone/sheet.png` (specimen) · `../previews/01-open-zone/exports/` (rasters).
