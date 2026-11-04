# Round-2 docket checks (reviewer-ux mechanical pass)

Generated 2026-11-04T20:00:47.307Z

## a-matchday-raised

Pages: 16 | extras: hunt-eliminated, hunt-paused

| id | status | check | evidence |
|---|---|---|---|
| G1 | PASS | 14 canonical HTML + rendered PNG at exactly 1170x2532 | html missing: none \| png missing: none \| wrong dims: none \| extras: 2 |
| G2 | PASS | NOTES.md has a Review response section | notes bytes 52182 |
| G3 | PASS | No dev/fake strings across pages | none |
| G4 | PASS | Result seed honest (18:48 + prey 0/2) | FULL TIME Riverside Run PREY 0 / 2 WINNER Hunters 18:48 Played Hunters win. Both prey were tagged before full time. 0 /  |
| G5 | PASS | Canonical pages do not scroll past the 844 canvas | all <=846 |
| G6 | PASS | No invented-data patterns (IP / survival scores / OPEN AREA / GPS±) | none |
| A1 | PASS | Cap lift: unshipped rematch clearly labelled as proposal in the render | proposal=true \| text:Play again PROPOSAL Back to lobby View hunt history Play again needs a server action to restart the room |
| A2 | PASS | home-light shows the same Home state as home (code cells/input values) | code filled dark=1 light=1 \| inputs dark="" light="" |
| A3 | PASS | Zone centre honest (no London/fake coords) | Zone centre Set on the map · 40.8008, -73.9720 Use my location Shrink over time 120 s · 25  |
| A4 | PASS | Claim shows answer-in time | answer-in=1 |
| A5 | PASS | hunt-hunter has hidden per-prey status text |  \| Nadia: fresh report, 12 seconds ago. Rana: stale report, 14 minutes old. Your position: shown in cyan. Other players  |
| A6 | PASS | Extra paused state frame rendered | extras: hunt-eliminated,hunt-paused |
| A7 | PASS | No clipped history / room-rules bodies | history 844 \| rules 844 |

## b-street-signal

Pages: 15 | extras: hunt-prey-eliminated

| id | status | check | evidence |
|---|---|---|---|
| G1 | PASS | 14 canonical HTML + rendered PNG at exactly 1170x2532 | html missing: none \| png missing: none \| wrong dims: none \| extras: 1 |
| G2 | PASS | NOTES.md has a Review response section | notes bytes 80866 |
| G3 | PASS | No dev/fake strings across pages | none |
| G4 | PASS | Result seed honest (18:48 + prey 0/2) | FULL TIME 18:48 played Prey remaining 0 / 2 Hunters win. Prey remaining 0 / 2 Full time PREY 0 / 2 Nadia Tagged Rana Tag |
| G5 | PASS | Canonical pages do not scroll past the 844 canvas | all <=846 |
| G6 | PASS | No invented-data patterns (IP / survival scores / OPEN AREA / GPS±) | none |
| B1 | PASS | hunt-hunter has no invented ally markers (violet only = own YOU) | violet map shapes=1 all=1 |
| B2 | PASS | history has no per-match survival scores |  |
| B3 | PASS | Lobby has host Ready/Stand down + side switch | standDown=true sideSwitch=true |
| B4 | PASS | Room-rules sheet has zone-centre / map-picker / use-my-location | zoneCentre=true |
| B5 | PASS | roles has no live-looking 2/3 counters | [] |
| B6 | PASS | hunt-prey gutter no OPEN AREA contradiction | openArea=false |
| B7 | PASS | Claim: consequence-first + answer-in time | answerIn=1 taggedYou=true |
| B8 | PASS | settings fits the canvas | pageScrollHeight=844 |
| B9 | PASS | Extra eliminated/spectating frame rendered | extras: hunt-prey-eliminated |

## c-field-instrument

Pages: 17 | extras: state-eliminated, state-offline, state-paused

| id | status | check | evidence |
|---|---|---|---|
| G1 | PASS | 14 canonical HTML + rendered PNG at exactly 1170x2532 | html missing: none \| png missing: none \| wrong dims: none \| extras: 3 |
| G2 | PASS | NOTES.md has a Review response section | notes bytes 81346 |
| G3 | PASS | No dev/fake strings across pages | none |
| G4 | PASS | Result seed honest (18:48 + prey 0/2) | FULL TIME Riverside Run PLAYED 18:48 PREY 0 / 2 WINNER Hunters Hunters win. Wed 4 Nov · 20:45–21:04 Riverside Run TIME P |
| G5 | PASS | Canonical pages do not scroll past the 844 canvas | all <=846 |
| G6 | PASS | No invented-data patterns (IP / survival scores / OPEN AREA / GPS±) | none |
| C1 | PASS | Rematch demoted; Back to lobby is the primary | rematchPrimary=false backPrimary=true primaries=["Back to lobby"] |
| C2 | PASS | history has no per-match PREY REMAINING | preyRemaining=0 |
| C3 | PASS | no real public IP anywhere |  |
| C4 | PASS | Home pre-hunt readout has no invented live GPS | gps±=false |
| C5 | PASS | No clipped names/labels in lobby | [] |
| C6 | PASS | Rules/settings steppers + switches >=48 hit boxes | [] |
| C7 | PASS | Three state extras rendered (paused/offline/eliminated) | extras: state-eliminated,state-offline,state-paused |
| C8 | PASS | POV identity consistent (Omar plays; host is Omar) | home:[PLAYING AS Omar] lobby:[HOSTED BY OMAR] rtl has Omar=true |
