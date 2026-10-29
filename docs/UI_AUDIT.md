# Android UI audit — accessibility, adaptive layout, edge-to-edge

Read-only audit of the Android client UI. No production code was modified; the only
file written is this document. No Gradle build or test was executed.

The UI files changed while the audit was running (a motion layer landed at 04:29), so
every `file:line` below was re-verified against the current on-disk state, including
`ui/theme/Motion.kt` and the `AnimatedContent`/`animateContentSize`/`animateColorAsState`
additions.

**Scope**

| File | Lines |
|---|---|
| `android/app/src/main/java/com/manhunt/app/ui/AppRoot.kt` | 82 |
| `android/app/src/main/java/com/manhunt/app/ui/AuthScreen.kt` | 189 |
| `android/app/src/main/java/com/manhunt/app/ui/HomeScreen.kt` | 183 |
| `android/app/src/main/java/com/manhunt/app/ui/RoomScreen.kt` | 951 |
| `android/app/src/main/java/com/manhunt/app/ui/RoomSettingsDialog.kt` | 188 |
| `android/app/src/main/java/com/manhunt/app/ui/HistoryDialog.kt` | 85 |
| `android/app/src/main/java/com/manhunt/app/ui/SafetyScreen.kt` | 89 |
| `android/app/src/main/java/com/manhunt/app/ui/ManHuntLoader.kt` | 96 |
| `android/app/src/main/java/com/manhunt/app/ui/Components.kt` | 132 |
| `android/app/src/main/java/com/manhunt/app/ui/theme/Theme.kt` | 103 |
| `android/app/src/main/java/com/manhunt/app/ui/theme/Motion.kt` | 25 |
| `android/app/src/main/java/com/manhunt/app/map/MatchMap.kt` (referenced by the UI) | 166 |
| `android/app/src/main/res/values/themes.xml` | 4 |
| `android/app/src/main/AndroidManifest.xml` | 37 |

**Versions that the findings depend on** (from `android/gradle/libs.versions.toml` and
the resolved Gradle cache): Compose BOM `2026.09.00` → compose-ui/ui-foundation
**1.12.1**, material3 **1.4.0**; `compileSdk = 37`, `targetSdk = 37`, `minSdk = 26`.
Two library-level claims below were verified by extracting the resolved AARs and
inspecting the class files with `javap` (noted inline). Contrast ratios were computed
with the WCAG 2.x relative-luminance formula, not eyeballed.

---

## Verdict

**The lead's insets change is right in principle and correct for all five screens, but it
is not sufficient on its own.** `safeDrawingPadding()` at `AppRoot.kt:56` is the correct
place for it: one Activity, one `Surface` that paints behind the bars, every screen a child
of that `Box` (now via `AnimatedContent` at `:57-78`, which is *inside* the padded box), so
status bar / cutout / navigation bar / IME are covered for `AuthScreen`, `HomeScreen`,
`RoomScreen`, `SafetyScreen` and the first-run notice. Nothing calls `Scaffold`, so nothing
else competes for insets.

It is insufficient for three separate reasons:

1. **Dialogs are separate windows.** `AlertDialog` (4 call sites in `RoomScreen.kt`, plus
   `RoomSettingsDialog` and `HistoryDialog`) is hosted in its own `Dialog` window and never
   sees the root `Box`'s padding. material3 1.4.0's `AlertDialog` applies **no** window
   insets of its own (verified: no `WindowInsetsPadding` / `getSafeDrawing` references in
   the `AlertDialogKt` / `AlertDialog*` classes of the resolved AAR); it relies on
   `DialogProperties.decorFitsSystemWindows = true`, which Compose wires to
   `WindowCompat.setDecorFitsSystemWindows(window, true)`. That call is deprecated and a
   **no-op for apps targeting SDK 35+ on Android 15+**, and this app targets 37.
2. **On API 26–29 the IME inset is only delivered with `adjustResize`.** `minSdk` is 26 and
   the manifest sets no `windowSoftInputMode`, so the root IME padding can silently do
   nothing on Android 8–10.
3. **Root padding only helps if the child layout can actually shrink**, and the room body
   currently cannot: the chat composer is starved to zero height by
   `LazyColumn(Modifier.fillMaxSize())` sitting before it in the same `Column`
   (`RoomScreen.kt:580-581` vs `:836-851`). That is the most severe finding in this audit
   and it is independent of insets — the composer is at 0 dp even with the keyboard
   closed, and `imePadding` could never have fixed it.

Beyond insets: the light theme's hardcoded team colours fail WCAG AA by a wide margin
(2.2–3.3:1), the map has no semantic representation at all, dialog and route state are
lost on rotation, one `ui` read at the top of `RoomScreen` plus a non-memoised
`AndroidView.update` means every chat keystroke rebuilds the whole screen *and* every
osmdroid overlay, and the new motion layer animates card sizes inside the lazy list.

Severity split: **3 High, 10 Medium, 11 Low.**

---

## Findings

| ID | Sev | Area | File:line | Problem |
|----|-----|------|-----------|---------|
| UI-01 | **High** | Layout / IME | `RoomScreen.kt:580-581`, `836-851` | Chat composer is measured with `maxHeight = 0`: `LazyColumn(Modifier.fillMaxSize())` consumes all remaining height before the trailing chat `Row` is measured. Input + Send are invisible. |
| UI-02 | **High** | Contrast | `Components.kt:38-42`, `50-76` | Hardcoded team colours: Prey `#FF7A59` = **2.57:1**, Hunters `#8B7BFF` = **3.29:1** on the light surface (2.16/2.77 on `surfaceVariant`, 2.22/2.79 on the 16 % pill tint). AA needs 4.5:1 at `labelSmall` (11 sp). |
| UI-03 | **High** | Semantics | `MatchMap.kt:75-165` | Map is a raw osmdroid `View` with no semantics; prey positions, zone and own position exist **only** visually. No text alternative on the screen. |
| UI-04 | Medium | Insets / dialogs | `AppRoot.kt:56`; `RoomScreen.kt:458,476,504,515`; `RoomSettingsDialog.kt:58`; `HistoryDialog.kt:30` | Dialog windows bypass the root `safeDrawingPadding()`. m3 1.4.0 adds no insets itself; safety depends on `decorFitsSystemWindows`, a no-op for targetSdk 35+ on API 35+. |
| UI-05 | Medium | Insets / IME | `AndroidManifest.xml:27-29` | No `android:windowSoftInputMode="adjustResize"`; on API 26–29 with `enableEdgeToEdge()` the IME inset is not dispatched, so the root padding cannot lift the composer above the keyboard. |
| UI-06 | Medium | State / rotation | `AppRoot.kt:39-40`; `RoomScreen.kt:452-455` | Route, safety flag and the four dialog flags use plain `remember`. Rotating in a room drops the user back to Home and closes any open dialog. |
| UI-07 | Medium | Recomposition | `RoomScreen.kt:383`, `617-624`; `MatchMap.kt:83-152` | One `val ui = vm.ui` read at the screen root → every field change (each chat keystroke, each `busy` flip, each socket event) recomposes the whole screen and re-runs `AndroidView.update`, which does `overlays.clear()` and re-allocates every `Marker`/`Polyline`. |
| UI-08 | Medium | Colour-only status | `MatchMap.kt:112-126`; `RoomScreen.kt:658-664` | Stale / flagged / eliminated prey render as identical default markers; the only cue is a tap-only snippet plus one aggregate sentence (extends `ANDROID_REVIEW.md` A10 — still open). |
| UI-09 | Medium | Text scaling | `RoomScreen.kt:751,763,770,785,792,800`; `HomeScreen.kt:144,161`; `AuthScreen.kt:141`; `SafetyScreen.kt:82` | Buttons use a fixed `.height(50/52/54.dp)`. At 200 % font scale a wrapped or 2-line label is clipped inside the fixed height. |
| UI-10 | Medium | 320 dp / font scale | `RoomScreen.kt:540-563` | Room header packs Leave + title + code + connection + loader + History in one `Row`; the title column is `weight(1f)` with no `maxLines`, so at 320 dp × 200 % it wraps to several lines and steals the viewport. |
| UI-11 | Medium | Navigation | `AppRoot.kt:67-77`; `RoomScreen.kt:377` | No `BackHandler`. System back / predictive back inside a room finishes the Activity instead of returning to Home. |
| UI-12 | Medium | Landscape | `RoomScreen.kt:618` | Map card is a fixed `.height(320.dp)`; in landscape (≈320 dp tall) it is the entire viewport and pushes the caption, trails/tag buttons and the composer off-screen. |
| UI-13 | Medium | Small screen | `RoomScreen.kt:515-533` | Tag-picker dialog puts every eligible prey `TextButton` in a non-scrollable `Column`; with a full lobby the dialog overflows and Cancel is pushed out of the card. |
| UI-14 | Low | Semantics | `HomeScreen.kt:124-127`; `RoomSettingsDialog.kt:93-96`, `122-125` | `Switch` sits next to a plain `Text` with no shared semantics: TalkBack announces "Switch, off" with no label. |
| UI-15 | Low | Semantics | `Components.kt:99-121`; `RoomScreen.kt:584-597` | `ErrorBanner` and the dismissible notice animate in without a live region, so an error is not announced. |
| UI-16 | Low | Semantics | `ManHuntLoader.kt:55-58`; `AuthScreen.kt:143-147`; `RoomScreen.kt:558` | Loader always exposes `contentDescription = "Loading"`. Inside the sign-in button it *replaces* the label (the button becomes "Loading"), and the room header + centre loader announce "Loading" twice. |
| UI-17 | Low | Recomposition | `RoomScreen.kt:859-865`, `892` | `PhaseCard` ticks once per second in every phase (including lobby/finished) and recomposes the whole card; the tick read is at card scope. |
| UI-18 | Low | Theme / edge-to-edge | `themes.xml:3`; `MainActivity.kt:13`; `Theme.kt:93-103` | Single light-only platform theme, no `values-night`, no `windowBackground`: white flash before Compose draws in dark mode; bar icon appearance follows the system, not the in-app dark toggle. |
| UI-19 | Low | Lazy layout | `RoomScreen.kt:580-833` | `LazyColumn` items have no `key`/`contentType`; item positions shift when `ui.notice`, `me.eliminated` or `match` change the item count. |
| UI-20 | Low | Touch / destructive | `RoomScreen.kt:544` | "Leave" leaves the room on one tap with no confirmation, immediately left of the title in the same touch band. |
| UI-21 | Low | Dialog height | `RoomSettingsDialog.kt:63`, `148` | `heightIn(max = 460.dp)` is safe only while the dialog window is inset-constrained; once UI-04 is fixed the card can exceed the visible area in landscape with the IME open. |
| UI-22 | Low | Lazy layout | `RoomScreen.kt:582`, `584-597` | Both banner items exist even when hidden (the animation makes them zero-height), so `spacedBy(16.dp)` still adds ~32 dp of dead space above the phase card. |
| UI-23 | Low | Recomposition / jank | `Components.kt:84` | `Modifier.animateContentSize()` on *every* `ScreenCard` animates card height on every content change, inside `LazyColumn` items, for the players and chat cards on each 10 s poll. |
| UI-24 | Low | Motion / edge-to-edge | `AppRoot.kt:57-78` | One hard-coded slide direction for every route (back navigation also enters from the right); for 240 ms both screens are composed and the shifted screen is not clipped to the inset area, so it can draw over a side system-bar inset in landscape. |

---

## Finding detail: fix + how to verify without a device

Every fix below is a sketch against the current code, not a patch.

### UI-01 (High) — the chat composer is measured at 0 dp

```kotlin
// RoomScreen.kt:538-854 — Column children are measured in declaration order.
Surface(Modifier.fillMaxSize()) {
    Column(Modifier.fillMaxSize()) {
        RoomHeader(...)                                   // wrap-content

        if (state == null) { ConnectingState(); return@Surface }

        LazyColumn(
            modifier = Modifier.weight(1f).padding(horizontal = 16.dp),  // was fillMaxSize()
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) { ... }

        ChatComposer(                                     // extracted, wrap-content
            draft = ui.chatDraft,
            busy = ui.busy,
            onDraftChange = vm::onChatDraft,
            onSend = vm::sendChat,
        )
    }
}
```

Why: in `foundation-layout` 1.12.1 (`RowColumnMeasurePolicyKt`), each non-weighted child is
measured with `mainAxisMax = (mainAxisMax - fixedSpace).coerceAtLeast(0)` and then
`fixedSpace += height` (verified in the class file). `Modifier.fillMaxSize()` pins
`minHeight = maxHeight = remaining`, so the `LazyColumn` consumes 100 % of the remainder and
the composer `Row` is measured with `maxHeight = 0` — field and Send collapse into a ~24 dp
strip of padding. `weight(1f)` lets the list take only the space left after the composer.

**Verify without a device** (Robolectric + Compose is already declared in
`app/build.gradle.kts:88-94`):

```kotlin
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w320dp-h640dp-xhdpi")
class RoomComposerTest {
    @get:Rule val rule = createComposeRule()

    @Test fun composerIsVisible() {
        // RoomScreen with a stub repository, or the extracted ChatComposer in a fillMaxSize Column
        rule.onNode(hasSetTextAction()).assertIsDisplayed()   // the message field
        rule.onNodeWithText("Send").assertIsDisplayed()
        val send = rule.onNodeWithText("Send").getUnclippedBoundsInRoot()
        val root = rule.onRoot().getBoundsInRoot()
        assertTrue(send.bottom <= root.bottom)                 // 0 dp / clipped before the fix
    }
}
```

The same test with `qualifiers = "w640dp-h360dp-land-xhdpi"` catches UI-12 as well.

### UI-02 (High) — light-theme team colours fail AA

`teamColor()` (`Components.kt:38-42`) hardcodes the dark-theme accents and is used for both
themes: `TeamPill` text at `:69-74` and the 16 % background at `:59`. Measured: Prey
2.57:1 / Hunters 3.29:1 on `#FFFFFF`; 2.16 / 2.77 on `surfaceVariant`; 2.22 / 2.79 on the
pill's own tint.

```kotlin
// Components.kt:38-42 — take the accents from the theme, which already has AA-safe
// light values (tertiary #C2410C = 5.18:1, secondary #5B21B6 = 8.98:1 on white).
@Composable
fun teamColor(team: String): Color = when (team) {
    Teams.PREY -> MaterialTheme.colorScheme.tertiary      // #C2410C light / #FF7A59 dark
    Teams.HUNTERS -> MaterialTheme.colorScheme.secondary  // #5B21B6 light / #8B7BFF dark
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}

// Components.kt:52-75 — keep the accent for the dot, move the *text* to onSurface so the
// 11 sp label is 15.0:1 (light) / 12.5:1 (dark) independent of team tint. Also drop the
// colour animation: the team does not change per frame.
Row(modifier.background(teamColor(team).copy(alpha = 0.16f), RoundedCornerShape(999.dp))...) {
    Box(Modifier.size(8.dp).background(teamColor(team), CircleShape))
    Text(
        teamLabel(team).uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurface,   // was the team accent
        fontWeight = FontWeight.SemiBold,
    )
}
```

Keep `MatchMap.kt:105` (trail colour, literal `0xFFFF7A59`) in sync by passing the resolved
colours into `MatchMap`; the coral is also wrong on a light basemap.

**Verify without a device** — pure JVM test, no Android:

```kotlin
private fun lin(c: Float) = if (c <= 0.04045f) c / 12.92f else ((c + 0.055f) / 1.055f).pow(2.4f)
private fun luminance(c: Color) = 0.2126f * lin(c.red) + 0.7152f * lin(c.green) + 0.0722f * lin(c.blue)
fun contrast(a: Color, b: Color): Float {
    val (hi, lo) = listOf(luminance(a), luminance(b)).sortedDescending()
    return (hi + 0.05f) / (lo + 0.05f)
}

@Test fun teamColoursMeetAaOnBothSchemes() {
    listOf(LightColors, DarkColors).forEach { scheme ->
        assertTrue(contrast(scheme.tertiary, scheme.surface) >= 4.5f)
        assertTrue(contrast(scheme.secondary, scheme.surface) >= 4.5f)
    }
}
```

(`LightColors`/`DarkColors` are `private` in `theme/Theme.kt:17,38`; widen to `internal`
for the test or assert against the literals.)

### UI-03 (High) — the map has no semantics and no text alternative

`MatchMap` is `AndroidView` + `Box` + an attribution `Text`. osmdroid markers, the zone
polygon and the user's own position are invisible to TalkBack, and prey positions are not
rendered anywhere else, so a screen-reader user cannot play as a hunter
(`ANDROID_REVIEW.md` A11 logged this as Low; raised here because it is the only carrier of
core match information, not decoration).

```kotlin
// MatchMap.kt:75-153
val summary = buildString {
    append("Map. ")
    ownLocation?.let { append("Your position is shown. ") }
    if (showPrey) {
        val reported = prey.count { it.hasReport }
        val stale = prey.count { it.hasReport && it.stale }
        append("$reported prey reports, $stale stale. ")
    }
    zone?.let { append("Play zone radius ${it.radiusM.toInt()} metres. ") }
}

Box(
    modifier = modifier
        .clip(RoundedCornerShape(20.dp))
        .background(MaterialTheme.colorScheme.surfaceVariant)
        .semantics(mergeDescendants = true) { contentDescription = summary },
) {
    AndroidView(
        modifier = Modifier.fillMaxSize().clearAndSetSemantics { }, // drop the empty node
        factory = { mapView },
        update = { ... },
    )
    ...
}

// RoomScreen.kt:614-667 — companion list so the positions are usable, in the
// same status order/strings as the marker snippets:
if (me?.team == Teams.HUNTERS && ui.locations?.prey?.isNotEmpty() == true) {
    Column(Modifier.semantics(mergeDescendants = true) { }) {
        ui.locations.prey.filter { it.hasReport }.forEach { p ->
            Text(
                buildString {
                    append(p.username)
                    append(if (p.eliminated) " - tagged" else if (p.stale) " - stale report"
                           else if (p.flagged) " - unverified" else " - live")
                    p.recordedAt?.let { append(", ${ageMinutes(it, state.match?.now)} min ago") }
                },
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
```

**Verify without a device:** Robolectric cannot rasterise osmdroid tiles, but semantics are
testable:

```kotlin
rule.onNodeWithContentDescription("Map. 1 prey reports, 0 stale. Play zone radius 800 metres.")
    .assertExists()
rule.onNodeWithText("Alice - stale report, 12 min ago").assertExists()
```

### UI-04 (Medium) — dialogs bypass the root insets

Root padding at `AppRoot.kt:56` is applied to the Activity's content `Box`; a `Dialog` gets
a **new window** and its own `DecorView`, so it inherits nothing. In the resolved
material3 1.4.0 AAR the `AlertDialog`/`AlertDialogContent` classes contain no
`windowInsetsPadding`/`WindowInsets` reference at all, and `DialogProperties` defaults
`decorFitsSystemWindows = true` (`DialogWrapper` calls
`WindowCompat.setDecorFitsSystemWindows(window, true)` plus `setSoftInputMode(0)`).
`setDecorFitsSystemWindows` is a documented no-op for apps targeting SDK 35+ on Android 15+,
so `RoomSettingsDialog` (five text fields) and `HistoryDialog` can draw under the status bar
and under the IME, and the Save/Cancel row can be unreachable.

```kotlin
// One helper, reused by all six dialogs (4 in RoomScreen + the 2 dialog files).
@Composable
fun SafeAlertDialog(
    onDismissRequest: () -> Unit,
    title: @Composable () -> Unit,
    text: @Composable () -> Unit,
    confirmButton: @Composable () -> Unit,
    dismissButton: (@Composable () -> Unit)? = null,
) {
    AlertDialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(decorFitsSystemWindows = false), // Compose owns insets
        modifier = Modifier
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .imePadding(),
        title = title,
        text = text,
        confirmButton = confirmButton,
        dismissButton = dismissButton,
    )
}
```

Apply at `RoomScreen.kt:458,476,504,515`, `RoomSettingsDialog.kt:58`,
`HistoryDialog.kt:30`. `RoomSettingsDialog` already scrolls its body
(`RoomSettingsDialog.kt:63`), so it degrades gracefully once it gets the inset.

**Verify without a device:** not possible — Robolectric does not synthesise real insets.
See *Needs a device*. The static part is provable from the call graph: a `Dialog` is a
separate window, so `AppRoot.kt:56` cannot reach it.

### UI-05 (Medium) — IME inset is not delivered on API 26–29

`enableEdgeToEdge()` sets `decorFitsSystemWindows = false` for the Activity. On API 29 and
below the IME inset is only reported when the window is resized, which requires
`adjustResize`. `minSdk` is 26 and the activity declares no soft-input mode, so on Android
8–10 `safeDrawingPadding()` never includes the keyboard and the composer sits under it.

```xml
<!-- AndroidManifest.xml:27-29 -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:windowSoftInputMode="adjustResize">
```

**Verify:** API 29 emulator only; Robolectric will not reproduce the platform inset
dispatcher.

### UI-06 (Medium) — rotation loses the route and every open dialog

`AppRoot.kt:39` keeps `route` in `remember`. On recreation it comes back as `Route.Auth`,
then `LaunchedEffect(session, safetyAccepted)` (`:44-51`) rewrites it to `Route.Home`
because the session survives in DataStore — rotating inside a room exits the room. The
same applies to `safetyAccepted` (`:40`, re-read from prefs, so harmless) and to
`showTagPicker/showSettings/showHistory/showEndConfirm` (`RoomScreen.kt:452-455`).

```kotlin
// AppRoot.kt:39 — include the (new) Safety route in the saver.
private val RouteSaver = listSaver<Route, String>(
    save = { listOf(when (it) {
        Route.Safety -> "safety"
        Route.Auth -> "auth"
        Route.Home -> "home"
        is Route.Room -> "room:${it.id}"
    }) },
    restore = { saved ->
        val s = saved.single()
        when {
            s.startsWith("room:") -> Route.Room(s.removePrefix("room:"))
            s == "home" -> Route.Home
            s == "auth" -> Route.Auth
            else -> Route.Safety
        }
    },
)
var route by rememberSaveable(stateSaver = RouteSaver) { mutableStateOf<Route>(Route.Auth) }
var safetyAccepted by rememberSaveable { mutableStateOf(repo.hasAcceptedSafety()) }

// RoomScreen.kt:452-455
var showTagPicker by rememberSaveable { mutableStateOf(false) }
var showSettings by rememberSaveable { mutableStateOf(false) }
var showHistory by rememberSaveable { mutableStateOf(false) }
var showEndConfirm by rememberSaveable { mutableStateOf(false) }
```

Also audit the other `remember`s per the `adaptive` skill: `hasLocation`/`locationDenied`
(`RoomScreen.kt:400-401`) are cheap to recompute; `trackingPermissions` (`:409`) is fine.
Enable predictive back while in the manifest: `android:enableOnBackInvokedCallback="true"`.

**Verify without a device:** Robolectric with `createAndroidComposeRule<MainActivity>()`:

```kotlin
@Test fun stateSurvivesRecreation() {
    composeRule.activityRule.scenario.recreate()
    composeRule.onNodeWithText("Room").assertExists()          // still in the room
    composeRule.onNodeWithText("Join a game").assertDoesNotExist()
}
```

Use `RuntimeEnvironment.setQualifiers("+land")` for the rotation path specifically.

### UI-07 (Medium) — one state read recomposes everything, and rebuilds the map

```kotlin
val ui = vm.ui          // RoomScreen.kt:383 — snapshot read of the whole RoomUi
```

Every mutation of `RoomUi` (draft keystroke, `busy`, `connected`, `notice`, socket event,
10 s poll) invalidates `RoomScreen`, therefore the map `item` recomposes, therefore
`AndroidView(update = …)` runs, therefore `MatchMap.kt:84` (`overlays.clear()`) plus
`:112-137` (new `Polygon`, one new `Polyline` per trail, one new `Marker` per prey, another
for self) run again. Typing "hello" rebuilds the overlay set five times.

```kotlin
// 1. Take the draft out of the screen-sized object so keystrokes touch one node.
class RoomViewModel(...) : ViewModel() {
    var ui by mutableStateOf(RoomUi())      // remove chatDraft from RoomUi
        private set
    var draft by mutableStateOf("")         // only ChatComposer reads this
        private set
    fun onChatDraft(v: String) { draft = v }
}

// 2. Read per section, not once at the root.
@Composable fun RoomScreen(...) {
    val state = vm.ui.state                 // header/phase/members listen to this
    val messages = vm.ui.messages           // chat card listens to this
    ...
}

// 3. Rebuild overlays only when their inputs change.
val spec = remember(prey, zone, trails, ownLocation, showPrey) { buildOverlaySpec(...) }
AndroidView(
    factory = { mapView },
    update = { view ->
        if (view.tag !== spec) {            // identity check, not structural
            rebuildOverlays(view, spec)
            view.tag = spec
        }
        view.invalidate()
    },
)

// 4. Do not virtualise the map: keep it out of the LazyColumn (fixed header), or give it
//    item(key = "map") so scrolling does not dispose/recreate the MapView.
```

Step 4 also removes the `MapView(context)` construction cost on every scroll
(`MatchMap.kt:50-57`) and the `onDetach()` at `:69-72` that throws the tile cache away.

**Verify without a device:** mechanical part testable with a recomposition counter around
a pure child:

```kotlin
var mapRecompositions = 0
rule.setContent {
    ManHuntTheme {
        SideEffect { mapRecompositions++ }     // test-only wrapper around MapSection()
        MapSection(...)
    }
}
rule.onNode(hasSetTextAction()).performTextInput("hello")
rule.waitForIdle()
assertEquals(0, mapRecompositions)             // was 5
```

Definitive frame timing needs Macrobenchmark (see *Needs a device*).

### UI-08 (Medium) — stale / flagged / eliminated prey look identical

`MatchMap.kt:112-126` creates the same default `Marker` for every report; the status lives
in `title`/`snippet`, visible only after a tap. `RoomScreen.kt:658-664` mentions only
staleness, once, as a sentence; `flagged` gets no UI at all. Colour alone would not fix
this — the marker needs a shape/icon, plus a legend.

```kotlin
// MatchMap.kt:112-126
Marker(view).apply {
    position = GeoPoint(p.lat!!, p.lng!!)
    icon = when {
        p.eliminated -> pin(ctx, R.drawable.pin_eliminated)   // grey, struck through
        p.stale      -> pin(ctx, R.drawable.pin_stale)        // hollow outline
        p.flagged    -> pin(ctx, R.drawable.pin_flagged)      // warning triangle
        else         -> pin(ctx, R.drawable.pin_live)         // solid team colour
    }
    subDescription = …            // same text as the companion list (UI-03)
}

// Legend under the map (RoomScreen.kt:625) so the encoding is discoverable:
Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
    LegendItem("solid", "Live"); LegendItem("hollow", "Stale")
    LegendItem("triangle", "Unverified"); LegendItem("grey", "Tagged")
}
```

**Verify without a device:** extract `fun markerStyle(p: PreyLocationStatus): MarkerStyle`
and unit-test all four branches; assert the legend strings with
`onNodeWithText("Unverified").assertExists()`. Actual marker rendering is a device or
screenshot check.

### UI-09 (Medium) — fixed button heights clip at 200 % font scale

`.height(50.dp)` (and 52/54) is effectively a maximum: the label gets
`50 dp − contentPadding` and a second line is clipped rather than growing the button. All
10 sites: `RoomScreen.kt:751,763,770,785,792,800`, `HomeScreen.kt:144,161`,
`AuthScreen.kt:141`, `SafetyScreen.kt:82`.

```kotlin
Button(
    onClick = vm::toggleReady,
    enabled = lobby && !ui.busy,
    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),   // no fixed height
    colors = ButtonDefaults.buttonColors(containerColor = readyBg, contentColor = readyFg),
) { Text(if (ready) "Cancel ready" else "I'm ready") }
```

**Verify without a device:**

```kotlin
@Config(sdk = [36], qualifiers = "w320dp-h640dp-xhdpi")
@Test fun buttonsGrowWithFontScale() {
    rule.setContent {
        val d = LocalDensity.current
        CompositionLocalProvider(LocalDensity provides Density(d.density, fontScale = 2f)) {
            ManHuntTheme(darkTheme = true) { HomeScreen(onOpenRoom = {}) }
        }
    }
    val node = rule.onNodeWithText("Create room")
    node.assertIsDisplayed()
    assertTrue(node.getUnclippedBoundsInRoot().height >= 50.dp)
    assertTrue(node.getUnclippedBoundsInRoot().height - node.getBoundsInRoot().height < 1.dp)
}
```

`getUnclippedBoundsInRoot()` vs `getBoundsInRoot()` is the standard "is this clipped"
assertion and needs no device.

### UI-10 (Medium) — room header crowding at 320 dp / 200 %

`RoomScreen.kt:540-563` is a single unbounded `Row`: Leave `TextButton`, a `weight(1f)`
title + code, an inline loader, and a History `TextButton`. With `titleLarge` (22 sp,
`Theme.kt:71`) at 200 % the title takes 3–4 lines, the header grows to ~140 dp and the
already starved list loses the rest.

```kotlin
Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 8.dp, vertical = 4.dp),
    verticalAlignment = Alignment.CenterVertically) {
    IconButton(onClick = { showLeaveConfirm = true }) {       // see UI-20
        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Leave room")
    }
    Column(Modifier.weight(1f)) {
        Text(state?.room?.name ?: "Room",
            style = MaterialTheme.typography.titleMedium,     // smaller role, still bold
            maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(codeText, style = MaterialTheme.typography.labelSmall, maxLines = 1)
    }
    IconButton(onClick = { vm.loadHistory(); showHistory = true }) {
        Icon(Icons.Filled.History, contentDescription = "Match history")
    }
}
```

These become the app's first icon-only controls, so the `contentDescription`s matter;
`IconButton` already enforces a 48 dp target.

**Verify:** same Robolectric harness as UI-09 with `fontScale = 2f`; assert
`onNodeWithText("Room").assertIsDisplayed()` and
`onNodeWithContentDescription("Match history").assertIsDisplayed()`.

### UI-11 (Medium) — back exits the app from a room

No `BackHandler` exists anywhere in `ui/`. Inside a room, system back finishes
`MainActivity`; the room membership is never released (`vm.leave()` is only wired to the
button at `:544`) and the route state dies with the Activity.

```kotlin
// RoomScreen.kt:377 — androidx.activity.compose.BackHandler
BackHandler { onBack() }

// Optional guard while a match is live:
BackHandler(enabled = !activePhase) { onBack() }
```

**Verify without a device:** Robolectric with `createAndroidComposeRule<MainActivity>()` —
`composeRule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }`
then assert Home ("Join a game") is displayed and the room node is gone.

### UI-12 (Medium) — 320 dp fixed map in landscape

```kotlin
// RoomScreen.kt:617-624
MatchMap(
    modifier = Modifier
        .fillMaxWidth()
        .heightIn(min = 160.dp, max = 320.dp)
        .aspectRatio(4f / 3f),       // 240 dp on a 320 dp-wide phone, capped in landscape
    ...
)
```

**Verify:** Robolectric with `qualifiers = "w640dp-h360dp-land-xhdpi"`, then
`onNodeWithText("Tag prey").assertIsDisplayed()` and the composer assertion from UI-01
(they are off-screen today).

### UI-13 (Medium) — unbounded tag-picker list

```kotlin
// RoomScreen.kt:518-532
text = {
    Column(
        Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) { ... }
}
```

**Verify:** Robolectric with 8 fake prey in the room state,
`onNodeWithText("Cancel").assertIsDisplayed()`.

### UI-14 (Low) — switches have no accessible label

```kotlin
Row(
    Modifier.fillMaxWidth().toggleable(
        value = dark, role = Role.Switch, onValueChange = { repo.setDarkTheme(it) },
    ),
    verticalAlignment = Alignment.CenterVertically,
) {
    Text("Dark mode", Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
    Switch(checked = dark, onCheckedChange = null)   // row owns the click and the label
}
```

Same for "Hunters can see trails" and "Shrink over time"
(`RoomSettingsDialog.kt:93-96`, `122-125`).

**Verify:** `rule.onNodeWithText("Dark mode").assertIsToggleable()` (fails today — the
`Text` and `Switch` are separate nodes) and `rule.onNode(isToggleable()).assertIsOn()`.

### UI-15 (Low) — errors are not announced

```kotlin
// Components.kt:99-121
AnimatedVisibility(visible = !message.isNullOrBlank(), enter = …, exit = …) {
    Box(
        Modifier.fillMaxWidth()
            .semantics { liveRegion = LiveRegionMode.Polite }
            .background(MaterialTheme.colorScheme.error.copy(alpha = 0.14f), RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
    ) {
        Text(message.orEmpty(), color = MaterialTheme.colorScheme.error,
             style = MaterialTheme.typography.bodySmall)
    }
}
```

Apply the same `liveRegion` to the dismissible notice (`RoomScreen.kt:585-597`).
**Verify:** `onNodeWithText(message).assertExists()` after a forced failure; the
announcement itself needs TalkBack (*Needs a device*).

### UI-16 (Low) — the loader talks over the UI

```kotlin
// ManHuntLoader.kt:32-59
@Composable
fun ManHuntLoader(
    modifier: Modifier = Modifier,
    size: Dp = 28.dp,
    color: Color = MaterialTheme.colorScheme.primary,
    contentDescription: String? = null,
) {
    val transition = rememberInfiniteTransition(label = "manhunt-loader")
    ...
    val semantics = if (contentDescription != null) {
        Modifier.semantics {
            this.contentDescription = contentDescription
            progressBarRangeInfo = ProgressBarRangeInfo.Indeterminate
        }
    } else {
        Modifier.clearAndSetSemantics { }        // decorative: no node, no announcement
    }
    Canvas(modifier.size(size).then(semantics)) { ... }
}
```

Call sites: `RoomScreen.kt:558` → decorative (`null`); `:568` → `"Connecting to room"`;
`AuthScreen.kt:144` → keep the label and put the loader beside it, or pass
`"Signing in"`:

```kotlin
Button(onClick = { vm.submit() }, enabled = !ui.loading,
       modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)) {
    if (ui.loading) {
        ManHuntLoader(size = 20.dp, color = MaterialTheme.colorScheme.onPrimary)
        Spacer(Modifier.width(8.dp))
    }
    Text(if (ui.register) "Create account" else "Sign in")   // label always present
}
```

**Verify:** `onNodeWithText("Sign in").assertExists()` while `loading = true` (fails
today) and `onAllNodesWithContentDescription("Loading").assertCountEquals(0)` for the
decorative cases.

### UI-17 (Low) — the phase ticker never stops

```kotlin
// RoomScreen.kt:859-865 — move the tick into the smallest possible reader.
@Composable
private fun CountdownText(target: Long?, offset: Long) {
    var tick by remember { mutableIntStateOf(0) }
    LaunchedEffect(target, offset) {
        if (target != null) while (isActive) { delay(1_000); tick++ }
    }
    Text(remember(tick, target, offset) { remaining(target, offset) })
}
```

Use it for `:904-905` and `:920-926`, and drop the `@Suppress("UNUSED_EXPRESSION") tick`
read at card scope (`:866`). The `offset` calculation at `:892-894` is correct now (it
fixed `ANDROID_REVIEW.md` A4) — keep it, but hoist it above the `phase` computation.

**Verify:** Robolectric with `mainClock.autoAdvance = false`; assert a `SideEffect` counter
in the parent does not increment when the clock advances, and that no ticker is live in
`Phases.LOBBY`.

### UI-18 (Low) — light-only theme → flash and mismatched system bars

`themes.xml:3` is the only theme (`res/` has no `values-night`), so the window background is
the platform light one until the first Compose frame, and `enableEdgeToEdge()`
(`MainActivity.kt:13`) derives bar icon appearance from the **system** night mode, not from
`repo.darkTheme`. Set the app to dark on a light-mode phone and the status-bar icons stay
dark-on-dark. `ManHuntTheme` (`Theme.kt:93-103`) is the right place to override it.

```xml
<!-- values/colors.xml -->
<color name="window_bg_light">#F7F9FC</color>
<color name="window_bg_dark">#0B1220</color>

<!-- values/themes.xml -->
<style name="Theme.ManHunt" parent="android:Theme.Material.Light.NoActionBar">
    <item name="android:windowBackground">@color/window_bg_light</item>
</style>

<!-- values-night/themes.xml -->
<style name="Theme.ManHunt" parent="android:Theme.Material.NoActionBar">
    <item name="android:windowBackground">@color/window_bg_dark</item>
</style>
```

```kotlin
// Theme.kt:93-103
@Composable
fun ManHuntTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }
    MaterialTheme(colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = ManHuntTypography, shapes = ManHuntShapes, content = content)
}
```

**Verify:** Robolectric can read the resolved controller
(`WindowInsetsControllerCompat.isAppearanceLightStatusBars`) after toggling — assert it
flips. The cold-start flash needs a recording.

### UI-19 (Low) — no lazy item keys

```kotlin
LazyColumn(modifier = Modifier.weight(1f).padding(horizontal = 16.dp), ...) {
    item(key = "error", contentType = "banner") { ErrorBanner(ui.error) }
    item(key = "notice", contentType = "banner") { NoticeBanner(ui.notice, vm::clearNotice) }
    item(key = "phase", contentType = "phase") { PhaseCard(state, me?.isAdmin == true) }
    if (me?.eliminated == true && phase == Phases.HUNTING) item(key = "tagged", contentType = "card") { ... }
    if (match != null) item(key = "map", contentType = "map") { ... }
    item(key = "players", contentType = "card") { ... }
    item(key = "setup", contentType = "card") { ... }
    item(key = "chat", contentType = "card") { ... }
}
```

Keys also stop the map item from being reused for a different card when the notice appears.

### UI-20 (Low) — unconfirmed destructive "Leave"

`RoomScreen.kt:544` leaves on a single tap, adjacent to the title, with no undo. Route it
through the existing confirm-dialog pattern (`showEndConfirm`, `:457-470`) or move it into
an overflow; UI-10's sketch already adds a confirm flag.

**Verify:** Robolectric — click Leave, assert the room is still displayed and a
"Leave this room?" dialog is shown.

### UI-21 (Low) — dialog height cap assumes an inset-constrained window

`RoomSettingsDialog.kt:63` caps the body at 460 dp and `HistoryDialog.kt:35` at 420 dp.
Today the framework constrains the dialog window, so the caps are fine; after UI-04
(`decorFitsSystemWindows = false`) the window fills the screen, so the cap must be relative
to the inset area, not absolute:

```kotlin
Column(
    Modifier
        .heightIn(max = 460.dp)          // ceiling inside the safeDrawing area
        .verticalScroll(rememberScrollState()),
)
```

With `.imePadding()` on the dialog (UI-04) the 460 dp becomes a ceiling instead of a size
that can exceed the visible area. **Verify:** API 36 emulator, landscape, keyboard open
(*Needs a device*).

### UI-22 (Low) — hidden banners still consume list spacing

Both banners are always emitted as items (`RoomScreen.kt:584`, `585-597`), and
`AnimatedVisibility` with `visible = false` composes nothing, so each item measures 0 dp —
but `verticalArrangement = Arrangement.spacedBy(16.dp)` (`:582`) still adds 16 dp per empty
item. With no error and no notice the phase card starts ~32 dp lower than intended, and it
jumps by 16 dp each time a banner appears.

```kotlin
// Only emit the item when there is something to show.
if (!ui.error.isNullOrBlank()) item(key = "error", contentType = "banner") { ErrorBanner(ui.error) }
if (ui.notice != null) item(key = "notice", contentType = "banner") { NoticeBanner(...) }

// or keep the items and put the 16 dp inside them:
item(key = "error", contentType = "banner") {
    ErrorBanner(ui.error)                       // already animates its own height
}
// with verticalArrangement = spacedBy(16.dp) replaced by per-card bottom padding
```

**Verify:** Robolectric — measure `onNodeWithText("MATCH")`'s top offset with and without
an error and assert they match.

### UI-23 (Low) — `animateContentSize()` on every card

`Components.kt:84` adds `animateContentSize()` to `ScreenCard`, so the players card and
the chat card animate their height on every content change — including the 10 s poll and
each incoming message. Inside a `LazyColumn` item this re-measures the item every frame,
clips during the animation, and cancels the benefit of skipping the card's content. It is
also applied to static cards (safety/notice/setup) where nothing ever changes size.

```kotlin
Card(
    modifier = modifier.fillMaxWidth(),     // no animateContentSize in the shared card
    ...
)
// If a specific card really needs a size transition, scope it:
@Composable fun ExpandableCard(expanded: Boolean, content: @Composable () -> Unit) {
    Card(Modifier.animateContentSize(animationSpec = tween(Motion.STANDARD))) { content() }
}
```

**Verify:** Robolectric with `composeRule.mainClock.autoAdvance = false`: drive a state change
that changes a card's height, then compare `onNodeWithText(…).getBoundsInRoot()` before and
after `mainClock.advanceTimeByFrame()`. With `animateContentSize()` the bounds move across
frames; without it they jump in the first frame.

### UI-24 (Low) — the new screen transition ignores direction and clipping

`AppRoot.kt:57-78` animates every route with the same
`slideInHorizontally { it / 14 }` / `slideOutHorizontally { -it / 20 }`, so back navigation
(Room → Home) also enters from the right, which reads as "forward". For the 240 ms
`Motion.EMPHASIZED` duration both screens are composed inside the padded `Box`, and a
padding modifier does not clip its children, so the shifted screen is not confined to the
inset content area: in landscape (or with a cutout / side inset) the ~25 dp slide can draw
over the side system-bar inset. The vertical insets are unaffected because the slide is
horizontal.

```kotlin
AnimatedContent(
    targetState = route,
    transitionSpec = {
        val forward = routeDepth(targetState) > routeDepth(initialState)
        val dir = if (forward) 1 else -1
        (fadeIn(tween(Motion.EMPHASIZED, easing = Motion.EaseOutExpo)) +
            slideInHorizontally(tween(Motion.EMPHASIZED, easing = Motion.EaseOutExpo)) { dir * it / 14 })
            .togetherWith(
                fadeOut(tween(Motion.QUICK, easing = Motion.EaseInOut)) +
                    slideOutHorizontally(tween(Motion.STANDARD, easing = Motion.EaseInOut)) { -dir * it / 20 }
            )
    },
    // keep the sliding content out of the bar area
    modifier = Modifier.fillMaxSize().clipToBounds(),
    label = "screen",
) { current -> ... }

private fun routeDepth(r: Route) = when (r) {
    Route.Safety -> 0; Route.Auth -> 1; Route.Home -> 2; is Route.Room -> 3
}
```

**Verify:** Robolectric with `mainClock.autoAdvance = false`; assert the animated child's
bounds stay inside the root bounds for every frame, and that the transition spec picks the
negative direction for Room → Home.

---

## Verified good

These were checked and do **not** need work.

- **Root insets cover all five screens.** `AppRoot.kt:56` is the only window-level
  container, `MainActivity.kt:13` calls `enableEdgeToEdge()` before `setContent`, and the
  outer `Surface` (`AppRoot.kt:55`) paints the full window, so the bar areas show the theme
  background rather than a letterbox. No `Scaffold`, no `systemBarsPadding`, no competing
  inset consumer; `AnimatedContent` sits inside the padded box, so both the outgoing and
  incoming screens get the inset.
- **Manifest does not opt out of recreation.** No `android:configChanges`, no
  `android:screenOrientation` (`AndroidManifest.xml:27-34`) — exactly what the `adaptive`
  skill's Step 6 forbids; rotation re-reads resources and ViewModels survive (only the
  route is lost, UI-06). `resizeableActivity` is default-on, so split-screen and desktop
  windowing work.
- **The palette itself is AA-compliant**: light primary 5.36:1, tertiary 5.18:1, secondary
  8.98:1, `onSurfaceVariant` 7.58:1 (6.38:1 on `surfaceVariant`), error 6.47:1; dark
  primary 9.42:1, tertiary 6.63:1, `onSurfaceVariant` 8.28:1 (7.14:1), `onSurface` 14.45:1.
  Only the hardcoded `teamColor()` values fall outside the system (UI-02).
- **Typography is fully `sp`-based** (`Theme.kt:58-82`), with `lineHeight` expressed in `sp`
  so it scales with `fontScale`; there is no fixed-height text container anywhere except
  the buttons in UI-09. `labelSmall` is 11 sp, which is why UI-02 needs 4.5:1 rather than
  the 3:1 large-text threshold.
- **Nothing communicates by colour alone at text level**: team (`TeamPill` prints
  "PREY"/"HUNTERS"), ready ("Ready"/"Not ready", `RoomScreen.kt:702-707`), phase
  (`PhaseCard` prints the phase name, `:884-889`), admin ("ADMIN"), eliminated ("TAGGED"),
  connection ("live"/"polling", `:551-556`).
- **`uppercase()` is locale-invariant** (Kotlin uses `Locale.ROOT`), so no Turkish-i bug in
  `TeamPill`/`SectionLabel`.
- **The A4 countdown bug is fixed.** `RoomScreen.kt:892-894` captures `offset` once per
  `match.now`, so `remaining()` (`:932-938`) decreases with elapsed device time instead of
  cancelling. `ANDROID_REVIEW.md` A4 can be closed.
- **Touch targets are ≥ 48 dp.** Every control is a Material3 `TextButton`/`Button`/
  `FilterChip`/`Switch`, which apply `minimumInteractiveComponentSize()`; the 40 dp
  `TextButton` visual still gets a 48 dp target. There are **no icon-only controls today**,
  so no missing `contentDescription` in that category (UI-10 introduces the first ones).
- **MapView lifecycle is correct**: `DisposableEffect` registers `ON_RESUME`/`ON_PAUSE` and
  calls `onDetach()` (`MatchMap.kt:59-73`), so no tile traffic while paused.
- **OSM attribution is present** with a 15.9:1 contrast label (`MatchMap.kt:155-164`).
- **Scrolling dialogs scroll**: `HistoryDialog.kt:35` and `RoomSettingsDialog.kt:63` both use
  `heightIn(max) + verticalScroll`, so long content is reachable (the gap is UI-04/UI-21,
  not clipping).
- **Bounded collections use eager `Column`/`Row` loops**, not lazy layouts (members,
  tag targets, history, chat page) — matches the compose-performance "small and bounded
  lists" rule. The single `LazyColumn` covers the genuinely unbounded room body.
- **Disabled "Start match" explains itself**: `startBlockers()` (`:940-951`) renders the
  reasons under the button (`:772-778`) — a disabled control with a visible explanation,
  which is the pattern the accessibility guidance asks for.
- **`ErrorBanner` and `SectionLabel` use theme roles** (`error`, `onSurfaceVariant`), not
  literals, so UI-18's fix does not need to touch them.
- **Motion durations are short** (`Motion.kt:12-18`: 120 / 180 / 240 ms), within the
  400 ms guideline; the concern in UI-23/UI-24 is *how many* things animate, not how long.
- **`ScrollState`s are saveable**: every scrollable uses `rememberScrollState()`
  (`HomeScreen.kt:108`, `AuthScreen.kt:97`, `SafetyScreen.kt:31`, both dialogs) and no
  `remember { LazyListState() }` exists anywhere, so scroll position survives rotation.

---

## Needs a device

Cannot be settled by reading code or by Robolectric; each row names the check.

| # | What | How |
|---|------|-----|
| 1 | Dialog insets + IME on API 35/36 (UI-04, UI-21) | Emulator API 36, cutout profile, open Match settings, focus a field: the dialog must stay inside the status bar and above the keyboard; repeat in landscape with the keyboard open. |
| 2 | IME inset on API 26–29 (UI-05) | Emulator API 29 (3-button nav), type in room chat: composer above the keyboard, status bar not covered by the pan. |
| 3 | TalkBack traversal and announcements (UI-03, UI-14, UI-15, UI-16) | TalkBack on: map summary → prey list → attribution, switch labels, error announcement, exactly one "Loading". |
| 4 | 200 % font scale on a 320 dp device (UI-09, UI-10) | Settings → Display → Font size largest: no clipped labels, header ≤ 2 lines, no clipped `TeamPill`. |
| 5 | Predictive back (UI-06, UI-11) | Gesture nav: back from a room returns Home with a predictive-back preview of Home. |
| 6 | Frame timing while typing and while polling (UI-07, UI-23) | Macrobenchmark `FrameTimingMetric` on a **release** build — `isMinifyEnabled = false` today (`app/build.gradle.kts:26`), which is itself a profiling prerequisite the project does not yet meet. |
| 7 | osmdroid marker styling (UI-08) | Visual check that the four statuses are distinguishable at zoom 17 over light and dark basemaps, with the legend readable. |
| 8 | Cold-start flash / bar icon mismatch (UI-18) | App in dark mode on a light-mode phone: record launch; check icon colour after toggling the in-app switch. |
| 9 | Screen transition drawing over a side inset (UI-24) | Landscape, animator scale 10×, Home → Room → Home: the sliding screen must not paint over the side navigation-bar inset. |
| 10 | Foldable / tablet / multi-window (UI-10, UI-12) | Resize the window: map keeps a sane aspect, header ≤ 2 lines, dialogs stay usable. |

---

## Top 5 fixes, ranked by user impact

1. **UI-01 — `Modifier.fillMaxSize()` → `Modifier.weight(1f)` on the room `LazyColumn`
   (`RoomScreen.kt:581`).** One modifier restores the chat composer that is currently
   measured at 0 dp; it removes the biggest functional defect in the app and is the
   prerequisite for the IME question to even matter.
2. **UI-03 — give the map semantics plus a prey list.** Screen-reader users currently
   cannot play as hunters at all; this is the only finding that fully blocks a use case for
   a user group.
3. **UI-02 — take team colours from `MaterialTheme.colorScheme`.** A one-file change moves
   the light theme from 2.2–3.3:1 to 5.2–9.0:1 and fixes every place team identity is shown
   (member list, map trails) at once.
4. **UI-06 — `rememberSaveable` for `route` and the dialog flags.** Rotation currently
   ejects the user from the room mid-match; this is the most likely bug a tester hits in the
   first five minutes.
5. **UI-07 — stop reading all of `RoomUi` at the screen root and memoise map overlays.**
   Every keystroke currently recomposes the entire room and re-allocates every osmdroid
   overlay; this is the difference between a usable and a janky chat on a mid-range phone.

*(UI-04, dialog insets, is the strongest sixth: it is the direct answer to "did the root
padding fix the dialogs" — it did not, though its user-visible damage is rarer than the
five above.)*

---

## Skills read and how they were applied

Read in this order, as required by `docs/SKILL_MATRIX.md` (the running session cannot
hot-load them, so the files were read directly):

| File | Applied to |
|---|---|
| `docs/SKILL_MATRIX.md` | Established that `adaptive` and `compose-performance` are installed-but-not-hot-loadable and that accessibility was an explicit gap ("audit delegated") — this document closes it. |
| `.opencode/skills/adaptive/SKILL.md` | Step 1 (verify current UI / screenshot coverage → `AppSmokeTest` only renders `AuthScreen`, so findings carry Robolectric recipes); Step 6 (never add `configChanges`/`screenOrientation` — verified absent; the "systematically audit **every** `remember`" instruction produced UI-06); Step 6.2 (scroll state → verified good); Step 2/3 (no navigation rail / multi-pane: the app is a small state router, so no Nav3 recommendation — noted, not applied); Step 4 (bounded lists stay eager, the unbounded room body stays lazy); the skill's explicit-insets requirement drove UI-04/UI-05. |
| `.opencode/skills/compose-performance/SKILL.md` | Category 1 (root-level state reads → UI-07; `remember` keys → UI-17), Category 3 (mandatory `key`/`contentType` → UI-19; small bounded lists → verified good), Category 4 (animation phase deferral → UI-16, UI-23, UI-24), Category 5 (`LaunchedEffect`/timer scope → UI-17; `collectAsState` vs `collectAsStateWithLifecycle` → checked, left as-is), Category 2/6 (no `onGloballyPositioned`, no decorative `Canvas` beyond the loader). |
| `.opencode/skills/compose-performance/references/state-and-stability.md` | Mandatory before flagging state issues: confirmed UI-07 is a legitimate root-level state-read finding (not a backwards write — all writes are in callbacks/ViewModel), and that no `@Stable`/`@Immutable`/`ImmutableList` change should be recommended here. |
| `.opencode/skills/compose-performance/references/lazy-layouts.md` | Mandatory before flagging lazy layouts: confirmed UI-19/UI-22 apply only to the single `LazyColumn`, and its scope guard means the `members`/`targets`/`history` `forEach` loops must **not** be flagged. |
| `.opencode/skills/compose-performance/references/effects-and-threading.md` | Mandatory before flagging effects: validated UI-17 (`LaunchedEffect` + `delay` is the right tool; the problem is its scope/keys) and checked lifecycle-aware collection — these are in-memory `StateFlow`s, so `collectAsState` is correct per the reference's own nuance; no finding raised. |

Deliberately **not** applied, to avoid churn the app does not need: NavigationSuiteScaffold /
Nav3 migration, `Grid`/`FlexBox` (experimental), `BoxWithConstraints`-based layout,
`ImmutableList`, and any recommendation to profile a debug build. The release build still
has `isMinifyEnabled = false`, which is recorded in *Needs a device* #6 as a build-config
prerequisite rather than as a UI finding.
