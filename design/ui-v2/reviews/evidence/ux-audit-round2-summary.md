# UX audit digest (reviewer-ux measurement tool)

Generated 2026-11-04T19:59:32.501Z · canvas 390x844 @3x · stress=true

Read as: hard-text = <11 px text nodes; aux-or-body = 11–13.9 px (11–12 machine metadata is allowed, body role is not);
clipped = text clipped by an overflow-hidden ancestor or nowrap overflow; out-of-canvas = real content outside 390×844;
cyan surfaces = cyan fills with area ≥ 600 px² (one-cyan-surface rule); seed-missing = expected seed tokens absent;
rtl-uniso = Latin/number runs in an RTL page without an LTR isolate. Contrast is computed from DOM colours; verify crops.

## a-matchday-raised

Pages present: 16/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 1 | 44 | — | 0 | 0 |
  - auth CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| chat | 0 | 0 | 0 | 0 | 21 | 0 | 0 | 0 | 0 | 0 | 0 | 42 | — | 0 | 0 |
  - chat CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| history | 0 | 0 | 0 | 0 | 32 | 0 | 0 | 0 | 0 | 0 | 0 | 42 | — | 0 | 0 |
  - history CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| home | 0 | 0 | 1 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| home-light | 0 | 0 | 1 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home-light CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| hunt-eliminated | 0 | 0 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | — | 0 | 0 |
  - hunt-eliminated CSS techniques: boxShadow:5, textShadow:2, clipPath:5
| hunt-hunter | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 1 | 46 | — | 0 | 0 |
  - hunt-hunter CSS techniques: boxShadow:6, textShadow:2, clipPath:5
| hunt-paused | 0 | 0 | 1 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 48 | — | 0 | 0 |
  - hunt-paused CSS techniques: boxShadow:6, textShadow:2, clipPath:5
| hunt-prey | 0 | 1 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 48 | — | 0 | 0 |
  - hunt-prey CSS techniques: boxShadow:5, textShadow:2, clipPath:5
| lobby | 0 | 2 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| lobby-rtl | 0 | 2 | 0 | 0 | 32 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby-rtl CSS techniques: boxShadow:4, textShadow:1, clipPath:5
  - lobby-rtl Arabic nodes 34; latin-display-face 0; tracking 0; uppercase 8; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", \"Segoe UI\", sans-serif":29,"\"Instrument Sans\", \"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", sans-serif":5}
| result | 0 | 0 | 0 | 0 | 26 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - result CSS techniques: boxShadow:4, textShadow:2, clipPath:5
| roles | 0 | 0 | 0 | 0 | 25 | 0 | 0 | 0 | 0 | 0 | 1 | 46 | — | 0 | 0 |
  - roles CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| settings | 0 | 0 | 0 | 0 | 26 | 0 | 2 | 0 | 0 | 0 | 1 | 44 | — | 0 | 0 |
  - settings CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| sheet-room-settings | 0 | 2 | 0 | 0 | 50 | 0 | 0 | 0 | 0 | 0 | 2 | 50 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: boxShadow:4, textShadow:1, clipPath:5
| sheet-tag-claim | 0 | 3 | 0 | 0 | 22 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: boxShadow:5, textShadow:2, clipPath:5
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 4 | 1 | 3 | 18 | 1324px | 21 | 1 |
| chat | 0 | 0 | 0 | 30 | 844px | 12 | 0 |
| history | 4 | 1 | 0 | 23 | 844px | 46 | 1 |
| home | 4 | 1 | 0 | 24 | 1388px | 24 | 1 |
| home-light | 4 | 1 | 0 | 24 | 1388px | 24 | 1 |
| hunt-eliminated | 0 | 0 | 4 | 16 | 844px | 3 | 3 |
| hunt-hunter | 0 | 1 | 4 | 13 | 844px | 3 | 3 |
| hunt-paused | 0 | 1 | 4 | 14 | 852px | 1 | 3 |
| hunt-prey | 0 | 0 | 4 | 11 | 844px | 3 | 2 |
| lobby | 1 | 1 | 0 | 16 | 844px | 9 | 4 |
| lobby-rtl | 41 | 0 | 0 | 16 | 844px | 9 | 8 |
| result | 1 | 2 | 1 | 18 | 1532px | 48 | 1 |
| roles | 4 | 1 | 0 | 27 | 2220px | 38 | 1 |
| settings | 0 | 3 | 11 | 34 | 844px | 34 | 3 |
| sheet-room-settings | 2 | 2 | 5 | 40 | 844px | 33 | 5 |
| sheet-tag-claim | 0 | 0 | 6 | 26 | 1250px | 13 | 2 |

## b-street-signal

Pages present: 15/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | 46 | — | 0 | 0 |
  - auth CSS techniques: clipPath:2
| chat | 0 | 0 | 0 | 0 | 24 | 0 | 0 | 0 | 0 | 0 | 1 | 56 | — | 0 | 0 |
  - chat CSS techniques: boxShadow:2, clipPath:2
| history | 0 | 0 | 0 | 0 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 48 | — | 0 | 0 |
  - history CSS techniques: gradient:1, clipPath:2
| home | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home CSS techniques: clipPath:2
| home-light | 0 | 1 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - home-light CSS techniques: clipPath:2
| hunt-hunter | 0 | 0 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 50 | — | 0 | 0 |
  - hunt-hunter CSS techniques: clipPath:2
| hunt-prey | 0 | 1 | 0 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 52 | — | 0 | 0 |
  - hunt-prey CSS techniques: clipPath:2
| hunt-prey-eliminated | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 52 | — | 0 | 0 |
  - hunt-prey-eliminated CSS techniques: clipPath:2
| lobby | 0 | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby CSS techniques: clipPath:2
| lobby-rtl | 0 | 0 | 0 | 0 | 34 | 0 | 0 | 0 | 0 | 0 | 1 | 48 | — | 0 | 0 |
  - lobby-rtl CSS techniques: clipPath:2
  - lobby-rtl Arabic nodes 31; latin-display-face 1; tracking 1; uppercase 0; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", sans-serif":30,"\"Red Hat Mono\", ui-monospace, \"Courier New\", monospace":1}
| result | 0 | 1 | 0 | 0 | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 52 | — | 0 | 0 |
  - result CSS techniques: clipPath:2
| roles | 0 | 0 | 0 | 0 | 23 | 0 | 0 | 0 | 0 | 0 | 1 | 52 | — | 0 | 0 |
  - roles CSS techniques: clipPath:2
| settings | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 59 | — | 0 | 0 |
  - settings CSS techniques: clipPath:2
| sheet-room-settings | 0 | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 1 | 60 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: clipPath:2
| sheet-tag-claim | 0 | 1 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 54 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: clipPath:2
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 21 | 1617px | 23 | 1 |
| chat | 0 | 0 | 0 | 32 | 885px | 23 | 2 |
| history | 0 | 0 | 0 | 11 | 1061px | 12 | 1 |
| home | 0 | 0 | 1 | 23 | 1476px | 14 | 1 |
| home-light | 0 | 0 | 1 | 23 | 1476px | 14 | 1 |
| hunt-hunter | 1 | 0 | 4 | 11 | 854px | 2 | 1 |
| hunt-prey | 0 | 0 | 3 | 14 | 844px | 0 | 0 |
| hunt-prey-eliminated | 0 | 0 | 2 | 13 | 844px | 1 | 0 |
| lobby | 0 | 0 | 1 | 20 | 1105px | 10 | 1 |
| lobby-rtl | 39 | 0 | 1 | 21 | 1179px | 13 | 1 |
| result | 0 | 0 | 2 | 15 | 1025px | 9 | 1 |
| roles | 2 | 1 | 1 | 25 | 3508px | 47 | 1 |
| settings | 0 | 0 | 2 | 31 | 2226px | 36 | 1 |
| sheet-room-settings | 0 | 0 | 4 | 36 | 1476px | 25 | 1 |
| sheet-tag-claim | 1 | 1 | 2 | 21 | 1570px | 12 | 1 |

## c-field-instrument

Pages present: 17/14. Missing canonical: none

| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - auth CSS techniques: animation:1
| chat | 0 | 0 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - chat CSS techniques: animation:1
| history | 0 | 0 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - history CSS techniques: animation:1
| home | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - home CSS techniques: animation:1
| home-light | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - home-light CSS techniques: animation:1
| hunt-hunter | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - hunt-hunter CSS techniques: animation:1
| hunt-prey | 0 | 0 | 0 | 0 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - hunt-prey CSS techniques: animation:1
| lobby | 0 | 0 | 0 | 0 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - lobby CSS techniques: animation:1
| lobby-rtl | 0 | 0 | 0 | 0 | 26 | 0 | 5 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - lobby-rtl CSS techniques: animation:1
  - lobby-rtl Arabic nodes 25; latin-display-face 0; tracking 0; uppercase 0; fonts {"\"IBM Plex Sans Arabic\", \"Noto Sans Arabic\", \"Segoe UI\", sans-serif":25}
| result | 0 | 1 | 0 | 0 | 31 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - result CSS techniques: animation:1
| roles | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - roles CSS techniques: animation:1
| settings | 0 | 0 | 0 | 0 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - settings CSS techniques: animation:1
| sheet-room-settings | 0 | 0 | 0 | 0 | 50 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - sheet-room-settings CSS techniques: animation:1
| sheet-tag-claim | 0 | 0 | 0 | 0 | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - sheet-tag-claim CSS techniques: animation:1
| state-eliminated | 0 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - state-eliminated CSS techniques: animation:1
| state-offline | 0 | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - state-offline CSS techniques: animation:1
| state-paused | 0 | 0 | 0 | 0 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | — | 0 | 0 |
  - state-paused CSS techniques: animation:1
Stress (indicative, not part of the 390 dp canvas contract):

| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |
|---|---|---|---|---|---|---|---|
| auth | 0 | 0 | 3 | 20 | 844px | 0 | 0 |
| chat | 0 | 1 | 1 | 40 | 844px | 38 | 2 |
| history | 1 | 1 | 1 | 22 | 1563px | 39 | 1 |
| home | 2 | 1 | 1 | 25 | 963px | 12 | 1 |
| home-light | 2 | 1 | 1 | 25 | 963px | 12 | 1 |
| hunt-hunter | 0 | 0 | 27 | 17 | 902px | 13 | 3 |
| hunt-prey | 0 | 0 | 25 | 17 | 878px | 14 | 4 |
| lobby | 0 | 1 | 6 | 20 | 1052px | 19 | 1 |
| lobby-rtl | 39 | 5 | 6 | 19 | 1322px | 18 | 6 |
| result | 0 | 0 | 7 | 28 | 1349px | 43 | 4 |
| roles | 0 | 0 | 2 | 28 | 1429px | 23 | 1 |
| settings | 1 | 1 | 1 | 26 | 1707px | 31 | 1 |
| sheet-room-settings | 0 | 1 | 8 | 44 | 1052px | 29 | 2 |
| sheet-tag-claim | 0 | 1 | 27 | 34 | 878px | 21 | 5 |
| state-eliminated | 0 | 0 | 25 | 16 | 844px | 9 | 4 |
| state-offline | 0 | 0 | 28 | 19 | 926px | 13 | 3 |
| state-paused | 0 | 0 | 27 | 16 | 844px | 4 | 2 |
