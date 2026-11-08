# Second design — notes from @charles.unemployed

**Source:** [TikTok video 7705468598260665618](https://www.tiktok.com/@charles.unemployed/video/7705468598260665618) by Charles Liu (@charles.unemployed), 38 s, auto-generated English captions. Captured to `tiktok-notes.vtt`.

This is a **separate, second landing-page direction** made while the NIGHT SHIFT design is being applied to the app and site. It deliberately chooses the opposite surface — warm paper, one large feature, less chrome — so it can be compared rather than merged.

Credit: the unslop method and notes are by Charles Liu; unslop framework by Damir Sokolovsky (@heydamir), CC BY 4.0.

---

## Notes → decisions

| Time | Note (caption) | What this design does |
|---|---|---|
| 0:00 | Delete filler badges. Drop redundant labels. | No status badges, no “NEW / BETA / LIVE” pills. One meta line and four facts only. |
| 0:02 | Unitalicize the random word in your header. | No italics anywhere. The accent word is coloured, not slanted. |
| 0:05 | Only use mono where necessary. | IBM Plex Mono appears only on times, APK size, step numbers, section indices. Body and headings use Archivo/Bricolage. |
| 0:07 | Use a design system. Show the actual product. | One token set at the top (`--paper`, `--ink`, `--accent`, `--radius`), and real 390 dp app captures, not mockups. |
| 0:10 | Enlarge the main feature group with spacing. | The visibility rule gets a full two-column feature with real hunt capture; the other sections are deliberately quieter. |
| 0:13 | Add specificity to your headline. | “Hide-and-seek for the street you live on.” — names the product, the place and the game in one line. |
| 0:16 | Emphasize the CTA. Add an accent colour. | One large flare CTA in the hero and one at the end; the accent appears nowhere else except live/index marks. |
| 0:19 | Keep icons consistent. Remove unnecessary embellishments. | One 1.6 px line-icon set (download, arrows); no tape stripes, glows, gradients or decorative blobs. |
| 0:23 | Inner quarter radius equals outer quarter radius minus padding. | `.product-frame` is 20 px, padding 6 px, phone screen radius 14 px — explicitly calculated with CSS variables. |
| 0:26 | Improve text contrast. Wrap headline text properly, align by eye. | Ink `#08090A` on paper `#F3EFE6`; muted `#5F5A52`; manual line breaks and optical spacing in the 3-line headline. |
| 0:31 | Tabular numbers. | `font-variant-numeric: tabular-nums` on all mono data, so clocks and counts do not shift. |
| 0:34 | Add loading states, animate useful feedback. | The download CTA changes to “Preparing the APK…” for 650 ms, then “Download ready — 3.1 MB”; hover/press feedback only, no loop. |

---

## Direction

- **Surface:** warm paper, not another dark app screen. A flyer on a wall rather than a dashboard.
- **Type:** Bricolage Grotesque for headlines, Archivo for copy, Plex Mono for data only.
- **One accent:** deep flare `#C63B18` used for the live mark, CTA and one headline word.
- **Composition:** a tall product capture on the right, a short specific argument on the left, then one enlarged feature. No equal-card grid.
- **Density:** lots of space around the main feature; less around the supporting facts.
- **Product proof:** every screen is a real capture from the current app; no redrawn UI.

## Files

```
design/notes-variant/
  index.html              the second landing page
  tiktok-notes.vtt        the captured notes, timestamped
  screens/                real app captures used on the page
  shots/                  desktop/mobile screenshots
  assets/                 self-hosted OFL fonts
```

## What this is not

It is not applied to production. It is a second direction for review, while the other design is being implemented. No app or server code was changed here.
