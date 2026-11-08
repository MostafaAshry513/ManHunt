# ManHunt — NIGHT SHIFT (full redesign, v2)

**Status:** design prototype only. Nothing in `android/` or `server/` was edited. This is the
from-zero direction and the eleven app screens plus a new landing page, ready to review before
implementation.

Made with the [unslop](https://github.com/heydamir/unslop) method by Damir Sokolovsky
(@heydamir), CC BY 4.0.

---

## 1. Direction

- **Product.** Real-world GPS hide-and-seek for friend groups: two teams, one code, one server-owned
  clock, played on a street or park at night.
- **Character.** Electric, direct, slightly feral. A game you organise in a group chat, not a
  wellness app that happens to have a map.
- **World.** A late-night street: bitumen, a fluorescent tube, safety tape on a barrier, a flyer
  stapled to a pole. The screen is an instrument you carry, not a card deck.
- **Moments.** The real field map with its live clock, and the split fight card. Those are the only
  places colour is allowed to become rich; everything around them stays quiet.
- **Signature.** The **flare slash** plus the **perforated ticket edge**. It appears in the mark,
  the invite stub, the result receipt and the section rails — never as a background texture.

---

## 2. What was wrong before

This is a **heavy** redesign, so the old direction is not patched.

| Sign | Where it lived | New answer |
|---|---|---|
| One sports-poster grammar for every screen | MATCHDAY app | Each screen gets its own instrument: field map, fight card, radio log, match receipt |
| Single cyan accent used on everything | App + site | One new master: **Flare `#FF5A36`**; Prey lime and Hunter cobalt are semantic, not decoration |
| Condensed display face doing every headline | App + site | Bricolage Grotesque display + Archivo UI + IBM Plex Mono data |
| Cards and hairlines flattening every kind of information | App | Plates only where you act; team split, ticket, receipt and transcript are different objects |
| Huge dead bands on auth/lobby/result | App | Real map moment on auth; match facts on lobby; series receipt on result |
| Wide-tracked uppercase labels doing hierarchy | Site | Sentence-case labels; hierarchy from size and colour |
| Site hero was a text + map split with no new point of view | Site | “The street is the board”: full-height live field + a new hard-working rule set below |
| Unicode glyphs masquerading as icons | App | One 1.5 px line-icon set; typographic arrows only |
| Two hue-tinted card gradients | App | Removed; team meaning is a 1 px colour rail and flat tint |
| No real empty/error/instruction anatomy | App | Manual, Nights and Join are first-class pages, not dialogs |

---

## 3. Design system

### Colour

| Token | Value | Role |
|---|---|---|
| `--ink` | `#08090A` | Field / page |
| `--surface` | `#121416` | Raised instrument |
| `--surface-2` | `#181B1E` | Selected row |
| `--chalk` | `#F3EFE6` | Primary text |
| `--muted` | `#A6A39B` | Secondary text |
| `--dim` | `#717570` | Meta |
| `--flare` | `#FF5A36` | The one accent: action, live, focus, mark |
| `--lime` | `#B8F04A` | Prey |
| `--cobalt` | `#6D8CFF` | Hunters |
| `--mint` | `#3BE3A3` | Confirmed / server verified |
| `--line` | `rgba(243,239,230,.13)` | Hairline |

Contrast: Flare `#FF5A36` on Ink is 5.66:1; Bone on Ink is 15.4:1; Lime and Cobalt pass AA on Ink
and on the flat tinted team rows. No hue gradients, glows, coloured shadows or gradient text.

### Type

| Role | Face | Use |
|---|---|---|
| Display | **Bricolage Grotesque** 600, width 88% | Headlines, score, room name, “Get in.” |
| UI | **Archivo** 400/500/600 | Body, labels, buttons, player names |
| Data | **IBM Plex Mono** 400 | Codes, clocks, reports, receipt, coordinates |

No uppercase tracking as hierarchy. Display is sentence case except the brand mark.

### Form

- 2 px radius on action plates and ticket stubs; 0 px on fields and rows.
- 1 px hairline rules; no shadow except the review-device frame.
- 4 px rhythm with 2 px optical nudges inside mono data.
- One action per screen at most two; no floating pills.
- Icons: one 1.5 px stroke set, 16–18 px, currentColor.

---

## 4. Pages

| # | Page | Job |
|---|---|---|
| 01 | **Auth** | “Hide from your friends.” + real field to prove the product before signup |
| 02 | **Safety** | “The street is not the game.” Three hard rules; consent |
| 03 | **Street / Home** | The one screen before a night: live field, host, join, previous nights |
| 04 | **Room / Lobby** | 2v3 fight card, invite ticket, match facts, ready state, start |
| 05 | **Field / Hunt** | Map-first; report age is the hero; report and tag are the only actions |
| 06 | **Radio / Chat** | Transcript, not bubbles; all/prey/hunters/system channels |
| 07 | **Field manual** | How a night runs: sides, one clock, in-person tag |
| 08 | **Full time** | Server-verified receipt: score, field, series, rematch |
| 09 | **Nights / History** | Previous match receipts, not a feed |
| 10 | **Join** | Six-character code, paste link, no account to look around |
| 11 | **Control room / Settings** | Appearance, field permissions, account, version |

Every screen is in `prototype.html`, reachable by `?screen=<id>`. Rendered captures are in `screens/`.

---

## 5. Site

`site.html` — same system, new page, different job: sell the night to one organiser so they forward
the code to five friends.

- Hero: “Your street is the board.”, live field map with clock, report age, zone.
- “Two sides. One field.” explains the actual visibility rule.
- “How a night runs.” three beats.
- “In the app.” five real new screens.
- “Rules that hold.” four rules with server ownership.
- “Get in.” the APK.
- Desktop 1440 and mobile 390 verified; no JS.

---

## 6. Files

```
design/reset-v2/
  prototype.html          all eleven app pages (interactive)
  site.html               new landing page
  screens/*.png           each app page at 390 × 844
  app-contact-sheet.png   all eleven pages
  site-shots/             desktop + mobile hero/full
  fonts/                  Bricolage Grotesque, Archivo, IBM Plex Mono (OFL)
  assets/map.jpg          real OSM field plate
```

## 7. Next

This is a design review, not a build. If the direction is accepted, the implementation order is:
design tokens → Auth/Home/Room → Field/Radio → Full time/Nights → Control room → site.
