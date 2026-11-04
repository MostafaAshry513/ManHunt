# UX audit digest (reviewer-ux measurement tool)

Generated 2026-11-04T19:47:45.830Z · canvas 390x844 @3x · stress=true

Read as: hard-text = <11 px text nodes; aux-or-body = 11–13.9 px (11–12 machine metadata is allowed, body role is not);
clipped = text clipped by an overflow-hidden ancestor or nowrap overflow; out-of-canvas = real content outside 390×844;
cyan surfaces = cyan fills with area ≥ 600 px² (one-cyan-surface rule); seed-missing = expected seed tokens absent;
rtl-uniso = Latin/number runs in an RTL page without an LTR isolate. Contrast is computed from DOM colours; verify crops.

## a-matchday-raised

Pages present: 14/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 2 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 44 | — | 1 | 0 |
  - auth CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| chat | 0 | 0 | 0 | 10 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 42 | — | 0 | 0 |
  - chat CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| history | 0 | 0 | 0 | 15 | 17 | 0 | 1 | 0 | 0 | 0 | 0 | 42 | — | 0 | 0 |
  - history CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| home | 0 | 0 | 1 | 1 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| home-light | 0 | 0 | 0 | 1 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home-light CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| hunt-hunter | 0 | 4 | 0 | 8 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 46 | — | 0 | 0 |
  - hunt-hunter CSS techniques: boxShadow:6, textShadow:2, clipPath:5
| hunt-prey | 0 | 4 | 0 | 6 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 46 | — | 0 | 0 |
  - hunt-prey CSS techniques: boxShadow:5, textShadow:2, clipPath:5
| lobby | 0 | 6 | 0 | 11 | 18 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| lobby-rtl | 0 | 6 | 0 | 7 | 21 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby-rtl CSS techniques: boxShadow:4, textShadow:1, clipPath:5
  - lobby-rtl Arabic nodes 34; latin-display-face 0; tracking 5; uppercase 9; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", \"Segoe UI\", sans-serif":29,"\"Instrument Sans\", \"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", sans-serif":5}
| result | 0 | 4 | 0 | 8 | 15 | 1 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - result CSS techniques: boxShadow:4, textShadow:2, clipPath:5
| roles | 0 | 0 | 0 | 2 | 23 | 0 | 0 | 0 | 0 | 0 | 1 | 46 | — | 0 | 0 |
  - roles CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| settings | 0 | 0 | 0 | 2 | 24 | 1 | 0 | 0 | 0 | 0 | 1 | 44 | — | 1 | 0 |
  - settings CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| sheet-room-settings | 0 | 6 | 0 | 13 | 38 | 2 | 1 | 0 | 0 | 0 | 2 | 50 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| sheet-tag-claim | 0 | 6 | 0 | 6 | 14 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: boxShadow:5, textShadow:2, clipPath:5
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 3 | 1 | 3 | 18 | 1324px | 21 | 1 |
| chat | 0 | 0 | 0 | 30 | 844px | 12 | 0 |
| history | 6 | 1 | 0 | 23 | 844px | 46 | 1 |
| home | 4 | 1 | 0 | 24 | 1384px | 24 | 1 |
| home-light | 4 | 1 | 0 | 24 | 1384px | 22 | 1 |
| hunt-hunter | 0 | 0 | 3 | 13 | 844px | 3 | 2 |
| hunt-prey | 0 | 0 | 3 | 11 | 844px | 3 | 2 |
| lobby | 2 | 1 | 0 | 16 | 844px | 10 | 4 |
| lobby-rtl | 40 | 0 | 0 | 16 | 844px | 6 | 8 |
| result | 0 | 1 | 1 | 17 | 1444px | 46 | 1 |
| roles | 4 | 1 | 0 | 27 | 2220px | 38 | 1 |
| settings | 0 | 1 | 11 | 34 | 844px | 34 | 1 |
| sheet-room-settings | 2 | 2 | 5 | 40 | 844px | 30 | 5 |
| sheet-tag-claim | 0 | 0 | 6 | 23 | 1123px | 10 | 2 |

## b-street-signal

Pages present: 14/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 0 | 9 | 1 | 0 | 0 | 0 | 0 | 1 | 48 | — | 1 | 0 |
  - auth CSS techniques: clipPath:2
| chat | 0 | 0 | 0 | 1 | 23 | 2 | 0 | 0 | 0 | 0 | 1 | 58 | — | 0 | 0 |
  - chat CSS techniques: boxShadow:2, clipPath:2
| history | 0 | 0 | 0 | 7 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | — | 0 | 0 |
  - history CSS techniques: gradient:1, clipPath:2
| home | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 50 | — | 0 | 0 |
  - home CSS techniques: clipPath:2
| home-light | 0 | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 50 | — | 0 | 0 |
  - home-light CSS techniques: clipPath:2
| hunt-hunter | 0 | 0 | 0 | 1 | 10 | 1 | 0 | 0 | 0 | 0 | 1 | 52 | — | 0 | 0 |
  - hunt-hunter CSS techniques: clipPath:2
| hunt-prey | 0 | 1 | 0 | 1 | 11 | 1 | 0 | 0 | 0 | 0 | 0 | 54 | — | 0 | 0 |
  - hunt-prey CSS techniques: clipPath:2
| lobby | 0 | 0 | 0 | 5 | 21 | 2 | 0 | 0 | 0 | 0 | 1 | 50 | — | 0 | 0 |
  - lobby CSS techniques: clipPath:2
| lobby-rtl | 0 | 0 | 0 | 0 | 28 | 2 | 0 | 0 | 0 | 0 | 1 | 50 | — | 0 | 3 |
  - lobby-rtl CSS techniques: clipPath:2
  - lobby-rtl Arabic nodes 27; latin-display-face 5; tracking 5; uppercase 0; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", sans-serif":22,"\"Red Hat Mono\", ui-monospace, \"Courier New\", monospace":5}
| result | 0 | 1 | 0 | 0 | 22 | 2 | 0 | 0 | 0 | 0 | 0 | 54 | — | 0 | 0 |
  - result CSS techniques: clipPath:2
| roles | 0 | 2 | 0 | 2 | 23 | 1 | 0 | 0 | 0 | 0 | 1 | 54 | — | 0 | 0 |
  - roles CSS techniques: clipPath:2
| settings | 0 | 0 | 0 | 0 | 14 | 3 | 1 | 0 | 1 | 0 | 0 | 61 | — | 2 | 0 |
  - settings CSS techniques: clipPath:2
| sheet-room-settings | 0 | 0 | 0 | 0 | 24 | 1 | 0 | 0 | 0 | 0 | 1 | 64 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: clipPath:2
| sheet-tag-claim | 0 | 1 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 58 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: clipPath:2
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 21 | 1616px | 23 | 1 |
| chat | 0 | 0 | 0 | 32 | 885px | 23 | 2 |
| history | 0 | 0 | 0 | 12 | 1179px | 17 | 1 |
| home | 0 | 0 | 1 | 23 | 1475px | 14 | 1 |
| home-light | 0 | 0 | 1 | 23 | 1475px | 14 | 1 |
| hunt-hunter | 1 | 0 | 3 | 11 | 854px | 2 | 1 |
| hunt-prey | 0 | 0 | 3 | 14 | 844px | 0 | 1 |
| lobby | 0 | 1 | 1 | 22 | 1178px | 15 | 1 |
| lobby-rtl | 34 | 0 | 1 | 21 | 1164px | 15 | 1 |
| result | 0 | 0 | 2 | 15 | 1025px | 10 | 1 |
| roles | 0 | 1 | 1 | 25 | 3483px | 51 | 1 |
| settings | 4 | 1 | 2 | 30 | 2351px | 37 | 1 |
| sheet-room-settings | 0 | 0 | 2 | 36 | 1288px | 16 | 1 |
| sheet-tag-claim | 0 | 0 | 3 | 20 | 957px | 8 | 2 |

## c-field-instrument

Pages present: 14/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 2 | 0 |
  - auth CSS techniques: animation:1
| chat | 0 | 0 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - chat CSS techniques: animation:1
| history | 0 | 0 | 0 | 0 | 35 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - history CSS techniques: animation:1
| home | 0 | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - home CSS techniques: animation:1
| home-light | 0 | 0 | 0 | 0 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - home-light CSS techniques: animation:1
| hunt-hunter | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - hunt-hunter CSS techniques: animation:1
| hunt-prey | 0 | 0 | 0 | 0 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - hunt-prey CSS techniques: animation:1
| lobby | 0 | 0 | 0 | 0 | 29 | 0 | 2 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - lobby CSS techniques: animation:1
| lobby-rtl | 0 | 0 | 0 | 0 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 7 |
  - lobby-rtl CSS techniques: animation:1
  - lobby-rtl Arabic nodes 24; latin-display-face 20; tracking 4; uppercase 1; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", \"Segoe UI\", sans-serif":4,"\"Red Hat Mono\", ui-monospace, \"Courier New\", monospace":8,"\"Instrument Sans\", \"Segoe UI\", sans-serif":12}
| result | 0 | 1 | 0 | 0 | 35 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - result CSS techniques: animation:1
| roles | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - roles CSS techniques: animation:1
| settings | 0 | 0 | 0 | 0 | 30 | 2 | 0 | 0 | 0 | 0 | 0 | 70 | — | 3 | 0 |
  - settings CSS techniques: animation:1
| sheet-room-settings | 0 | 0 | 0 | 1 | 51 | 10 | 2 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: animation:1
| sheet-tag-claim | 0 | 0 | 0 | 0 | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 70 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: animation:1
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 3 | 19 | 844px | 2 | 1 |
| chat | 0 | 1 | 1 | 40 | 844px | 38 | 2 |
| history | 1 | 1 | 1 | 23 | 1558px | 39 | 1 |
| home | 2 | 1 | 1 | 25 | 1007px | 14 | 1 |
| home-light | 2 | 1 | 1 | 25 | 1007px | 14 | 1 |
| hunt-hunter | 0 | 0 | 27 | 17 | 902px | 13 | 3 |
| hunt-prey | 0 | 0 | 25 | 17 | 878px | 14 | 4 |
| lobby | 0 | 1 | 6 | 20 | 1052px | 22 | 2 |
| lobby-rtl | 40 | 1 | 6 | 19 | 1046px | 19 | 2 |
| result | 0 | 0 | 7 | 28 | 1349px | 48 | 4 |
| roles | 0 | 0 | 2 | 28 | 1389px | 23 | 1 |
| settings | 1 | 1 | 1 | 26 | 1644px | 28 | 1 |
| sheet-room-settings | 0 | 1 | 8 | 46 | 1052px | 26 | 3 |
| sheet-tag-claim | 0 | 1 | 27 | 34 | 878px | 21 | 5 |
