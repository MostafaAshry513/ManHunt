# 07 — Chat (field log)

**Route:** `Route.Room` → Chat tab (`ChatPanel.kt` inside the Room pager).
**Purpose:** the room's talk channel during a hunt and while waiting. It is evidence of a real group playing,
not a messenger clone. It must stay readable mid-run, one-handed, with the keyboard up, in RTL.
**Primary action:** Send.

**Old problem being fixed:** plain Material chat bubbles over a black field, a system pill "Match started.
Hunters are live.", sender names in default blue, huge empty space, a composer with a circle send button, and
no relationship to the game's visual language. New: a **field log** — mono time gutter, team tags, chalk rules
between phases, the same components as the rest of the app.

---

## 1. Hierarchy

1. **Message content** — the talk. Largest readable type on the screen (`body` 15/22, chalk).
2. **Who and when** — team tag/name (`label` in team colour) + mono time gutter (`data.small` muted).
3. **Phase/system separators** — thin ruled lines with a `data` label ("Head start", "Hunting began",
   "Yasmin was tagged", "Match over — Hunters win"). Not pills.
4. **Composer** — pinned bottom, 52 dp input + send; the only cyan fill on the screen when active.
5. **Compact room header** — state tag + room name + "4 in room" (no Board here: the chat *is* the content,
   and the Board would compete; the Room toolbar above carries back/share/history).

No bubbles for system messages; no avatars in the log (names are enough, and avatars add vertical noise);
no day-bubble chrome. Messages of the same sender within 60 s group without repeating the name.

---

## 2. Layout

```
┌───────────────────────────────────────────────┐
│ [←]                                 [share][⏱]│  Room toolbar 56
├───────────────────────────────────────────────┤
│ LIVE · RIVERSIDE RUN                 4 IN ROOM│  compact room strip 44: StateTag + name + count
│ ───────────────────────────────────────────── │
│                                 [ HUNT ] [CHAT]│  two-cell chalk tab rule (Chat active)
├───────────────────────────────────────────────┤
│ ────────────── HUNTING BEGAN ──────────────── │  system separator (data label + rule)
│                                               │
│ 20:46  Yasmin                                 │  sender `label` coral (Prey)
│        I'm near the north gate.               │  body chalk, max 84 % width
│                                               │
│ 20:47  Omar                                   │  sender `label` violet (Hunters)
│        Give me two minutes, I'm hiding.       │
│                                               │
│                          ── You ───────────── │  ← own message: 2 dp chalk start rule + 12 % tint
│                                    20:48      │
│                    Heading east on the trail. │  aligned end (left in RTL), 84 % max
│                                               │
│ ────────────── YASMIN WAS TAGGED ──────────── │
│                                               │
│ 20:50  Tariq                                  │
│        Nice. One left.                        │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ [ Message                             ] [➤]│  composer 52 + 48 send, cyan when text
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- **Time gutter:** 44 dp at start (LTR), `data.small` muted, top-aligned with the first line of the message;
  omitted on grouped consecutive messages but the group's first time is shown.
- **Sender:** `label` 13 Bold in `muted` for normal rooms; in-hunt, Prey senders use coral, Hunter senders
  violet (always paired with the name — colour never alone). The word "You" replaces the name for own
  messages, in `data.small` above the message, end-aligned.
- **Own message:** 2 dp chalk start rule at the message edge + `plateRaised` 12 % overlay; no bubble radius;
  no tail. Aligned to the end in LTR.
- **Grouping:** same sender + < 60 s → 2 dp vertical gap; otherwise 12 dp; sender name repeated only on group
  change; phase separators add 20 dp above/below.
- **Long messages:** wrap, max 84 % width (68 chars at 15 sp on 360 dp), no truncation, URLs allowed but not
  auto-linkified in this sprint (no new behaviour).
- **Composer:** 52 dp `PlateTextField` (multi-line up to 4 lines, grows with `heightIn`), placeholder "Message"
  (existing), send 48 dp square with `send` FieldMark; disabled send when blank or sending; on send success the
  draft clears, on failure it **stays** (existing fix — keep).
- **Scroll behaviour:** opens at newest; new messages only auto-scroll if the reader is within 2 rows of the
  bottom; if scrolled up, show a 48 dp full-width `data` strip "New messages" at the bottom edge (tap to
  scroll); no floating pill.
- **Older messages:** when `hasMore`, the first item is a 48 dp inline "Load older messages" / a 3-tick
  `LoadingRule` while fetching; keeps scroll position (existing behaviour).

---

## 3. Components

| Element | Spec | Test tag |
|---|---|---|
| Room toolbar | shell §3, same as Lobby | keep existing room tags |
| Compact room strip | 44 dp: `StateTag` + room name `title` (one line ellipsis) + `data` "n in room"; 1 dp bottom rule; no Board | `chat_room_strip` |
| Tab rule | shell (2-cell); `CHAT` active | `room_tab_1` |
| System separator | `ChalkRule` + `data` label, 12 dp caps? no caps beyond the data word; 20 dp vertical padding; not tappable, not a bubble | `chat_system` |
| Message row | as layout; `Modifier.semantics(mergeDescendants = true)` announces "Yasmin at 20:46: I'm near the north gate." | `chat_message_{id}` |
| Own message row | "You" label + start rule + tint; aligns end (LTR) / start (RTL) | — |
| Loading older | 48 dp inline + `LoadingRule` | `chat_load_older` |
| New messages strip | 48 dp, `data` text, 1 dp top rule, tap to bottom | `chat_new_messages` |
| Composer | 52+ `PlateTextField`, max 4 lines, always above IME; send 48; error strip above | `chat_input`, `chat_send` (keep existing if present) |
| Send error | `ErrorStrip` above composer: "Message didn't send. Check your connection and try again." + "Try again" keeps the draft | `chat_error` |
| Empty | A `ChalkRule` + title "No messages yet." + body "Say hello, or share where the hunt is starting." + one inline "Say hello" focus action? — just focus the composer on tap; no fake messages. | `chat_empty` |

Removed: bubbles with 20 dp radii, the cyan own-bubble, system message pills, avatars, the circle
`FilledIconButton` send with default Material styling, the "No messages yet. Say hello." centred grey text.

---

## 4. Copy intent

| Slot | English | Arabic |
|---|---|---|
| Placeholder | Message | رسالة (existing) |
| Compact strip | `{STATE} · {room}` | state localised, room name as data; no `·` in Arabic — line break |
| In room | `4 in room` | 4 في الغرفة (copy review) |
| System | `Head start`, `Hunting began`, `Hunt paused`, `Hunt resumed`, `{name} was tagged`, `Tag disputed`, `Match over — {winner}` | reuse the app's existing system message strings where they exist; never invent new game facts |
| Empty | No messages yet. / "Say hello. The room can talk here." | copy review |
| Send error | "Message didn't send. Check your connection and try again." | existing key "Could not send message. Try again." if present — reuse |
| Load older | Load older messages / Loading older messages / No older messages | add keys if missing (perf teammate may have added: "Load older messages", "Loading older messages", "No older messages" — reuse exactly) |
| New messages | New messages | copy review |

Tone: the room's own words; nothing system-generated should sound like a bot. System lines are statements of
fact, no exclamation, no emoji.

---

## 5. States

| State | Design |
|---|---|
| Empty | Rule + title + sentence; composer focused only if the user taps; no skeleton, no fake messages. |
| Loading first page | Composer visible; 3 chalk placeholder rows (8 % bars) above it; no spinner; input usable. |
| Loading older | Inline row at top, keeps scroll anchor (existing logic). |
| Send in flight | Send disabled + 3-tick rule in the button; draft stays until success. |
| Send failed | Error strip above composer; draft preserved; "Try again". |
| Load older failed | Inline row becomes "Couldn't load older messages. Try again." (does not disturb the log). |
| Offline | Compact strip shows a 1 dp `error` rule + `data` "Reconnecting…"; sending disabled with reason; existing messages remain readable. |
| Long thread | LazyColumn with stable keys (existing); no jank; scroll to newest on open; preserve position on rotation (existing saveable list state). |
| 200 % | Composer grows; sender/time wraps; message max width 90 %; no clipping. |
| RTL | Entire log mirrors; time gutter at the right; own messages align start (right→? in RTL own messages are on the left, i.e. end); sender names right; system labels right; send glyph mirrored; digit times LTR. |
| Light | Chalk ground, ink text, white composer; team sender colours use light tokens; own message tint = ink 6 %. |
| Reduced motion | No message entrance animations at all (new messages appear in place). |

---

## 6. Compose implementation notes

- Keep `ChatPanel` signature source-compatible (it is called by `RoomScreen` and screenshot tests with
  `messages`, `myUserId`, `draft`, `onDraftChange`, `sending`, `onSend`, `error`, `hasMore`,
  `loadingOlder`, `onLoadOlder`). Only internal layout changes; keep tests passing.
- Replace bubble Surface with a Row: time gutter (44 dp, `Text` data.small) + Column(header sender, body); own
  messages: Row reversed with a 2 dp Box rule; use `LocalLayoutDirection` for alignment, not hard-coded
  left/right.
- Keep `rememberLazyListState`, scroll anchor logic, stable message keys, draft-clearing-on-success logic —
  they are correct and already tested.
- Timestamps: existing formatter; keep locale-aware time (24 h in Arabic? — follow locale); tabular digits.
- System messages: `kind == "system"` → separator, not row; keep exact bodies from server/localization.
- Sender team lookup: the chat message model has username/userId, not team. Either extend the UI model to
  carry team when available (RoomScreen can pass a `teamForUser: (String?) -> String?` map built from
  `state.members`) or keep sender names muted. **Do not change server payloads.** If members are unavailable
  for old messages, fall back to muted sender. This is a UI-only enrichment.
- Composer: `BasicTextField`/`OutlinedTextField` restyled; `imePadding()` on the bottom container; keep the
  draft state local (`rememberSaveable`) except when hoisted for tests.
- No `Card`, no elevation; hairlines only; no `animateContentSize` on rows; new messages insert without
  animation.
- Accessibility: each message one merged semantics node; system separators `heading()`? — no, they're
  separators; use `semantics { heading() }` false; new-message strip `liveRegion = Polite`; input labelled
  "Message"; send button `contentDescription` "Send message" + enabled/disabled state.
- RTL: use `LayoutDirection`; do not mirror timestamps; the time gutter is at start in both directions (log
  convention), i.e. right in RTL.

---

## 7. Premium screenshot brief

- **Shot A:** dark, active hunt chat, room "Riverside Run", 4 believable players (Yasmin, Omar, Leila,
  Tariq), 6 messages with content that proves the game ("I'm near the north gate.", "Heading east on the
  trail.", "Two left."), a "YASMIN WAS TAGGED" separator, composer empty with placeholder, keyboard closed.
- **Shot B (Arabic RTL):** same thread in Arabic, mirrored, digits LTR, no bidi breakage.
- **Reject:** system-message pills, "Match started. Hunters are live." only, huge empty space, own bubble
  cyan, `alice74354` names.

---

## 8. A11y / RTL / adaptive checklist

- Contrast: body chalk on field 15.9; sender coral 7.3 / violet 7.8 (labels 13 sp → ≥4.5); time `data.small`
  muted 9.1; own tint keeps body ≥12.
- Touch: send 48, load older 48, new-messages strip 48.
- Keyboard: IME opens only on tap; composer stays above IME on API 26–29 (`adjustResize` + `imePadding`);
  Enter sends? — keep current behaviour (IME action Send), no change.
- Tablet: message column max 640 dp centred (start-aligned), composer same width; two-pane not needed for chat
  during a hunt (the map is the other tab).
- Tabletop: composer in the bottom pane; log top.
- Arabic: sender names right; own message on the left (end); time gutter on the right; send glyph mirrored;
  no `·`; digits Latin/LTR.
