# 10 — Dialogs and sheets (every consequential decision)

**Scope:** every modal/dialog in the app: tag target picker, incoming tag claim, disputed tag (admin), leave
room, end hunt, pause hunt, hunt rules, zone picker, sign-out confirm. History and the result are now pages
([`08`](08-result-and-history.md)); update checking is inline in Settings ([`09`](09-settings-and-updates.md)).
**Rule:** every dialog is a **`MatchSheet`** (bottom sheet, full width, shell §5.6) except the zone picker,
which is a full-screen page because a map inside a scrim cannot be panned reliably. No floating `AlertDialog`
cards anywhere in the redesign.

**Generic rules**

- Title = **the consequence** ("Tag Yasmin?", "End the hunt for everyone?", "Omar says he tagged you."), not
  "Confirm"/"Are you sure?".
- Body = one or two sentences: what will happen, then the next move. Errors do not apologise.
- Actions: destructive primary = `error` outline/fill; safe primary = cyan; cancel always available (48 dp ×,
  scrim/back) except on destructive sheets where tap-outside is disabled but `×`/back still cancels.
- One decision per sheet. No sheet contains a form and a destructive action at once.
- Sheets inherit safe-drawing + IME insets; open/close 240/160 ms; reduced motion = instant.
- Semantics: title `heading()`, focus enters the sheet, returns to the trigger; scrim tap dismisses only when
  the action is non-destructive; announce busy state.

---

## 1. Tag target picker — `Tag prey`

| | |
|---|---|
| Trigger | `Tag prey` in the Hunt dock |
| Type | `MatchSheet` (max 70 % height, list scrolls) |
| Title | **Who did you tag?** |
| Body | "Pick the player you physically tagged. They'll confirm it." (one line, `body.small`) |
| Content | List of eligible prey: 56–64 dp rows, avatar 32 + name `title` + status `data` ("Reported 12 s ago", "Stale", "Never reported"). Only eligible (not eliminated, not already in a pending claim) — exactly as the current filter. Empty: "No prey to tag right now." + "Close" (no fake rows, no "nearby" claims). |
| Actions | Rows are the action (one tap sends the request); `CANCEL` secondary 48 at the bottom. No second confirmation — this happens in the field and the rule already requires the Prey's confirmation; an extra tap would slow a physical tag. |
| Tap result | Haptic confirm; sheet closes; dock becomes `Waiting for {name}` (disabled); status "Waiting for them to confirm."; the row/prey stays eligible until the server says otherwise; duplicate taps blocked by the request state (server 409 → show status, not an error dialog). |
| Error | If the request fails: sheet stays open, `ErrorStrip` inside it "Couldn't send the tag. Try again."; the target row is re-enabled. |
| A11y | Each row `contentDescription` "Tag {name}, {status}"; focus first row; list keyboard-navigable; max 8 rows visible then scroll. |
| RTL | Rows mirrored; names right; avatar at start; cancel bottom. |

---

## 2. Incoming tag claim (Prey)

| | |
|---|---|
| Trigger | Server `pendingTags` for the current Prey, or the persistent coral strip |
| Type | `MatchSheet` (destructive-adjacent: it can end the player's hunt) |
| Title | **{Hunter} tagged you.** |
| Body | "Confirm it if it happened. Dispute it if it didn't — the huntmaster decides." |
| Actions | Primary (cyan): `Confirm tag`; secondary (48): `DISPUTE`. A `×`/back dismisses the sheet **without answering**; the coral strip remains until answered (existing rule — a dismissed decision is never lost). |
| Busy | On confirm/dispute: primary shows `LoadingRule`; both disabled; sheet cannot dismiss. |
| Error | `ErrorStrip` inside the sheet: "Couldn't send your answer. Try again." |
| Copy note | Neutral: "they tagged you", never gendered assumptions. Arabic neutral/masculine plural forms per copy rules. |
| A11y | Announced assertively when it appears (live region on the strip, not a raw dialog); title heading; focus confirm. |
| RTL | Mirrored; names right; actions full width. |

---

## 3. Disputed tag (Huntmaster)

| | |
|---|---|
| Trigger | A pending tag with `disputed == true`, or the violet strip |
| Type | `MatchSheet` (destructive: it decides someone's elimination) |
| Title | **{Hunter} says they tagged {Prey}.** |
| Body | "The tag is disputed. Confirming ends {Prey}'s hunt; rejecting keeps them in it." |
| Actions | Primary: `Confirm tag` (error/destructive style? — the outcome is destructive to the Prey, so use the `error` outlined destructive button, not cyan); secondary: `Reject tag` (chalk outline). `×`/back dismisses; the violet strip persists. |
| Busy/error | As §2; resolution failure leaves the claim pending. |
| Honesty | No "fair play" lecture; the facts only. |
| A11y/RTL | As §2; state the consequence in `stateDescription`. |

---

## 4. Leave the room / hunt

| Context | Title | Body | Actions |
|---|---|---|---|
| Lobby | **Leave the room?** | "You'll lose your spot in the lobby. You can rejoin with the code." | destruct `LEAVE` 48 / `STAY` 48 |
| Live hunt | **Leave this hunt?** | "The hunt runs without you. Your team keeps playing and you can't rejoin this match." | destruct `Leave the hunt` / `STAY` |
| Host in lobby (if leaving ends the room) | **End the room for everyone?** | "You're the host. Leaving ends the room for every player." | destruct `End the room` / `STAY` |

- Replaces the current one-tap back-arrow leave (audit UI-20) and the old `AlertDialog` with a plain "Leave"
  confirm. Overlay the room toolbar's back and the system back with this sheet when in a room.
- If the server does not end a host's room on leave, use the normal lobby copy — do not invent an "end room"
  action (check the current behaviour; the redesign does not change it).
- A11y: focus `STAY` by default? — focus the sheet title; actions in order; destructive is visually distinct,
  not colour-only (error icon + label).
- RTL: mirrored.

---

## 5. End the hunt (host)

| | |
|---|---|
| Title | **End the hunt for everyone?** |
| Body | "The current result is final. Players can't rejoin this hunt." |
| Actions | destruct primary `End the hunt` 56; secondary `Keep playing` 48. |
| Note | The old copy "This ends the hunt for everyone and returns the room to the lobby." is replaced by the consequence (final result) — same behaviour. |
| Busy/error | `Ending…` + rule; failure → strip "Couldn't end the hunt. Try again." and sheet stays. |

---

## 6. Pause the hunt (host)

| | |
|---|---|
| Title | **Pause the hunt?** |
| Body | "The clock stops for everyone until you resume." |
| Actions | primary `Pause the hunt` (cyan; not destructive — pausing is safe/reversible); secondary `Keep playing`. |
| After | Board `PAUSED` + a persistent full-width chalk strip "Hunt paused. Clock stopped." with `RESUME` inline (host) — the resume action does not need another dialog. |
| Note | The current UI has pause/resume as plain buttons without confirmation in the sheet; keep the confirmation only for pause (it affects everyone); resume is immediate. |

---

## 7. Hunt rules (host) — `RoomSettingsDialog`

Full-height `MatchSheet` (max 85 %, scroll inside) or a dedicated rules page on small screens; **not** an
`AlertDialog` and **not** a scroll column that fights a map gesture.

Title: **Hunt rules.** Body/lead: "Applies to the next hunt. The server enforces these." Sections:

```
TIMING
  Prey head start            0 min      ← numeric field with unit in the label
  Hunt duration             60 min
  Location report interval   5 min
FIELD
  Play area                 [ OPEN ][ ZONE ]     ← segmented, not chips
  (zone) Zone radius        240 m
         Use my location    [ Use my location ] ← 48 secondary, always fresh fix
         Zone centre        [ PICK ON MAP ]       ← opens full-screen zone picker
         Latitude / Longitude                       ← data entry, LTR
         Shrink over time   [ on ]                  ← switch row with description
         Every 10 min / By 50 m                     ← numeric
VISIBILITY
  Hunters can see trails    [ on ]                 ← switch row with description
```

- **Behaviour preserved:** same fields, same validation ranges, same save patch; the existing validation
  messages stay. "Applies to the next match. Rules are enforced by the server." is required honesty.
- **Switches:** each is a full-row `selectable` with label + description + `Switch` (or chalk toggle); one
  merged semantics node; 48 dp; fix audit UI-14. No bare `Switch` next to a plain `Text`.
- **Segmented play area:** 2-cell chalk segmented control; selecting Zone reveals zone fields with a 240 ms
  height animation (or instant under reduced motion).
- **Zone picker** (§8) opens full screen, never inside the sheet; returning carries the chosen centre back.
- **Use my location:** force a fresh fix on every press (existing fix); busy `Locating…`; permission/service
  errors inline in `body.small` error text; no dialog.
- **Save:** primary `Save rules` 56, secondary `CANCEL` 48; while saving, disable and show `LoadingRule`;
  save failure `ErrorStrip` in the sheet + keep all edits. Unsaved changes on back/`×`: a small confirm
  ("Discard changes?" / `DISCARD` / `KEEP EDITING`) — no silent loss.
- **Read-only for non-hosts:** the rules are visible in the expanded Hunt sheet as a summary; this sheet is
  host-only (guard with `me.isAdmin`).
- **RTL:** all rows mirrored; numeric fields LTR; segmented order mirrored; lat/lng labels LTR values; map
  picker not mirrored.
- **A11y:** section labels `heading()`; switches labelled; numeric fields announced with unit; error inline
  with live region; focus order top-to-bottom.

---

## 8. Zone picker (host)

Full-screen page (not a dialog) over the map:

```
┌───────────────────────────────────────────────┐
│ [←]  Pick the zone centre                     │  header 56
├───────────────────────────────────────────────┤
│                                               │
│              MAP (full-bleed)                 │  Deep Teal, OSM attribution bottom
│           ┌─────────────┐                     │
│           │  zone circle│  ← fixed centre pin │  radius from the rules sheet, preview ring
│           └─────────────┘                     │
│                                               │
├───────────────────────────────────────────────┤
│  Centre: 51.5007, -0.1246                     │  data LTR
│  ┌─────────────────────────────────────────┐  │
│  │            USE THIS POINT               │  │  primary 56
│  └─────────────────────────────────────────┘  │
│  © OpenStreetMap contributors                 │  data.small, clickable
└───────────────────────────────────────────────┘
```

- Pan/zoom the map with one fixed crosshair/zone circle in the centre; `USE THIS POINT` returns the centre to
  the rules sheet (no save until the rules sheet is saved).
- Initial centre = current zone centre or current location if available; if neither, city-scale default from
  the current implementation (do not invent).
- Radius preview uses the value currently typed in the rules sheet; if it changes after the picker opens, the
  preview is stale — read the value once at open (documented), or pass it and don't allow editing while open.
- OSM attribution is required and clickable; no "© Mapbox", no third-party tile source.
- Back returns without changing the centre; `USE THIS POINT` is the only commit.
- A11y: map has a text alternative with current centre + radius; the button is the accessible action; no need
  to interact with the map by touch (the coordinates can be typed).
- RTL: header/actions mirror; map not mirrored.

---

## 9. Sign out confirm

| | |
|---|---|
| Trigger | Settings → Sign out |
| Title | **Sign out of this phone?** |
| Body | "You'll need your username and password to sign in again." |
| Actions | destruct `SIGN OUT` 48; secondary `STAY` 48. |
| Busy/error | `Signing out…`; failure strip "Couldn't sign out. Try again." (there is no local-only fallback — do not pretend). |

---

## 10. Sheets removed or converted

| Old | New |
|---|---|
| Result `AlertDialog` (crosshair icon) | full-screen **ScorePage** ([`08`](08-result-and-history.md)) |
| `HistoryDialog` `AlertDialog` | full-screen **Hunt history** page ([`08`](08-result-and-history.md)) |
| Update "sheet"/card | inline **Updates** section ([`09`](09-settings-and-updates.md)) |
| Tag claim / dispute `AlertDialog` | `MatchSheet` (§2, §3) |
| Leave / end `AlertDialog` | `MatchSheet` (§4, §5) |
| Room rules `AlertDialog` | `MatchSheet`/page (§7) + zone picker page (§8) |
| Tag picker `AlertDialog` with text buttons | `MatchSheet` target list (§1) |
| First-run safety | full page ([`03`](03-first-run-safety-and-roles.md)) |

---

## 11. Sheet acceptance checklist

1. No `AlertDialog` remains in the redesigned app; every decision is a `MatchSheet` or a page.
2. Every sheet title states the consequence; no "Are you sure?".
3. Destructive sheets require an explicit action (tap-outside disabled); `×`/back still cancels.
4. Every sheet applies safe-drawing + IME insets and works on API 26–29; no clipped action in landscape.
5. A dismissed tag claim/dispute never loses the decision — the persistent strip remains.
6. No sheet contains a map; the zone picker is a page.
7. Every sheet has busy and error states with the next move.
8. All strings reuse existing i18n keys where available; new strings are flagged for copy review, English
   provisional, Arabic not machine-invented.
9. RTL: mirror layout, never mirror the map/wordmark/numerals; long Arabic titles wrap and grow the sheet.
10. Reduced motion: sheets appear/disappear instantly; no bounce.
