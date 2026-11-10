# ManHunt launcher icon — study 01

A from-zero launcher icon study for the NIGHT SHIFT app, run the same way as the page redesign: audit first, direction second, a broad set of starts, then a shortlist tested at launcher sizes. Nothing here is applied to the app yet.

Full sheet: [icon-study-sheet.png](icon-study-sheet.png)  
Individual 512 PNGs: [samples/](samples/)  
Vector sources: [svg/](svg/)

---

## Direction

- **Product.** A live two-team hide-and-seek game played on real streets.
- **Character.** Tense, exact, a little playful. Not tactical, not toy.
- **World.** Night streets, printed tickets, folded field maps, one green report point.
- **Moment.** The moment a report lands: one dot, older rings, a place you were.
- **Signature.** One lime point, in or beside the mark. Every direction keeps it.

## Audit of the old icon

- A thin ring with a coral dot. Reads as a loading wheel or a generic radar, not a street game.
- Cyan and coral no longer exist in NIGHT SHIFT.
- The ring breaks down at 48 px and disappears at 32 px.
- No monochrome story for Android 13 themed icons.
- The mark did not use any of the product's own material: ticket edges, map folds, field plates, report age.

## The eight starts

| # | Name | Idea | Strength | Risk |
|---|---|---|---|---|
| 01 | **Afterimage** | A solid report with older rings falling away | The rule is visible; dot is the product | Rings soften at 24 px |
| 02 | **Stub** | The invite code as a torn ticket | Owns the invitation; very game-like | Six characters are not literal at small size |
| 03 | **Fold** | A field map folded once, flare crease | Material, night-street world | Reads as a book at 24 px |
| 04 | **Cut** | A bone field plate with one clean cut | Strongest silhouette; survives any mask | The most abstract, least narrative |
| 05 | **Block** | A fragment of the street grid, live block lit | Says “street” without a map pin | Busiest at small size |
| 06 | **Mark** | An M built from street plates and a flare hinge | Most brand-led | Could be read as a generic monogram |
| 07 | **Zone** | Three hard edges, one corner gone, live dot | Reads as a boundary; quiet | Close to a generic shield/frame |
| 08 | **Trace** | Three reports getting newer, ending at the live one | Pure product logic, no map | Weakest at 24 px |

## Shortlist

1. **Afterimage** — the most product-true. It says “a report has an age” before it says “game”, and the lime dot is already the app's signature.
2. **Stub** — the most game-like. The ticket explains the six-character code without a letter and owns a shape the category does not use.
3. **Cut** — the boldest launcher mark. One bone plate, one cut, one dot; it survives a circle, squircle and 32 px.

**Recommendation:** start with **Afterimage** for the product story, with **Cut** as the alternate if the icon needs to be a bolder stamp and **Stub** if it should feel like the invite.

## What is tested

- Dark ground at 512, 192, 48, 32 and 24 px
- Circle and squircle adaptive masks for the shortlist
- Monochrome themed-icon treatment for the shortlist
- All marks inside the 66 dp adaptive safe zone
- One accent (flare) plus the single lime report point; no gradients, glows, shadows or multiple hues

## Files

```
design/icon-v2/
  samples.html              the review sheet
  icon-study-sheet.png      full 1600 px sheet
  samples/*.png             512 px dark-ground icon exports
  svg/*.svg                 flat vector sources
  README.md                 this document
```

Process credit: unslop by Damir Sokolovsky (@heydamir), CC BY 4.0.
