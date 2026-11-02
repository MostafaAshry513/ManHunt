#!/usr/bin/env bash
# =============================================================================
# ManHunt premium screenshot capture - design/redesign/screenshot-shotlist.md
# =============================================================================
# Captures the real running app on a real Android emulator. Nothing is mocked:
#   - a private ManHunt server (throwaway SQLite DB) runs on 127.0.0.1:8080,
#   - scripts/screenshots/game-control.mjs seeds the shotlist scenario
#     ("Riverside Run": Yasmin/Leila Prey, Omar/Tariq/Sara Hunters; live hunt with a
#     fresh 5-point trail, a stale report, a 41:12 clock, tag flows, Hunters-win result,
#     Prey-win rematch),
#   - the debug APK is installed and driven through its real UI with adb + uiautomator,
#   - real OpenStreetMap raster tiles are fetched over the network,
#   - PNGs are captured with `adb exec-out screencap` in SystemUI demo mode.
#
# Run from .github/workflows/premium-screenshots.yml (KVM emulator) or against any
# connected device:
#     bash scripts/screenshots/capture-premium.sh
#
# Environment overrides:
#   CAPTURE_OUT      output dir (default scripts/screenshots/out)
#   CAPTURE_RUNTIME  scratch dir (default /tmp/manhunt-premium)
#   CAPTURE_APK      APK path (default android/app/build/outputs/apk/debug/app-debug.apk)
#   ADB              adb binary (default adb)
#   CAPTURE_CLOCK    demo status-bar clock HHMM (default 2104)
#   SHOT_SETTLE      settle seconds before each capture (default 0.9)
#   CAPTURE_EXTRAS   1 = also try the optional state extras (default 1)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS="$ROOT/scripts/screenshots"
OUT="${CAPTURE_OUT:-$SCRIPTS/out}"
RUNTIME="${CAPTURE_RUNTIME:-/tmp/manhunt-premium}"
STATE="$RUNTIME/state.json"
SERVER_DB="$RUNTIME/premium.db"
SERVER_LOG="$RUNTIME/server.log"
PRESENCE_LOG="$RUNTIME/presence.log"
APK="${CAPTURE_APK:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
ADB="${ADB:-adb}"
BASE="http://127.0.0.1:8080"
PACKAGE="com.manhunt.app"
ACTIVITY="$PACKAGE/.MainActivity"
CLOCK="${CAPTURE_CLOCK:-2104}"
SETTLE="${SHOT_SETTLE:-0.9}"
EXTRAS="${CAPTURE_EXTRAS:-1}"
# Optional shots the verified build does not have redesigned yet (comma-separated IDs,
# e.g. "s02,s11,s14"). They are skipped - never substituted with old UI - and recorded as
# pending in capture-meta.json / MANIFEST.json at fetch time.
PENDING="${CAPTURE_PENDING:-}"
APP_SERVER_URL=""
SERVER_PID=""
PRESENCE_PID=""
GPS_PID=""
DB_PATH_ARG="$RUNTIME/premium.db"

# ---------------------------------------------------------------- helpers

log() { printf '\n== %s ==\n' "$*"; }
note() { printf '   %s\n' "$*"; }

pending_shot() {
  case ",$PENDING," in
    *",$1,"*) return 0 ;;
    *) return 1 ;;
  esac
}

debug_dump() {
  mkdir -p "$OUT/_debug"
  "$ADB" exec-out screencap -p > "$OUT/_debug/failure.png" 2>/dev/null || true
  python3 "$SCRIPTS/ui.py" dump > "$OUT/_debug/failure-ui.txt" 2>&1 || true
  "$ADB" logcat -d -t 1000 > "$OUT/_debug/logcat.txt" 2>&1 || true
  cp "$SERVER_LOG" "$OUT/_debug/server.log" 2>/dev/null || true
  cp "$PRESENCE_LOG" "$OUT/_debug/presence.log" 2>/dev/null || true
  "$ADB" shell wm size > "$OUT/_debug/wm-size.txt" 2>&1 || true
}

fail() {
  printf '\n!! CAPTURE FAILED: %s\n' "$*" >&2
  debug_dump
  exit 1
}

cleanup() {
  local status=$?
  [ -n "$GPS_PID" ] && kill "$GPS_PID" 2>/dev/null || true
  [ -n "$PRESENCE_PID" ] && kill "$PRESENCE_PID" 2>/dev/null || true
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT

shot() {
  local name="$1"
  sleep "$SETTLE"
  local path="$OUT/$name.png"
  "$ADB" exec-out screencap -p > "$path" 2>/dev/null || fail "screencap failed for $name"
  local bytes
  bytes=$(stat -c%s "$path" 2>/dev/null || echo 0)
  [ "$bytes" -gt 10000 ] || fail "screenshot $name is only $bytes bytes (blank/corrupt)"
  log "captured $name.png ($bytes bytes) - $(file -b "$path" 2>/dev/null || echo unknown)"
}

ui() { python3 "$SCRIPTS/ui.py" "$@"; }
ui_wait() { ui wait "$1" "${2:-60}" || fail "UI element never appeared: $1"; }
ui_gone() { ui wait-gone "$1" "${2:-30}" || fail "UI element never disappeared: $1"; }
ui_tap() { ui tap "$1" "${2:-60}" || fail "could not tap UI element: $1"; }
# Best-effort variant for optional controls (trail toggle, cancel, sheet expand).
ui_try_tap() { ui tap "$1" "${2:-8}" >/dev/null 2>&1; }

type_text() {
  "$ADB" shell input text "$(printf '%s' "$1" | sed 's/ /%s/g')" || fail "input text failed"
}

hide_ime() {
  if "$ADB" shell dumpsys input_method 2>/dev/null | grep -q 'mInputShown=true'; then
    # ESC (111) is the shotlist's preferred way to dismiss the IME without navigating.
    "$ADB" shell input keyevent 111 || true
    sleep 0.5
    if "$ADB" shell dumpsys input_method 2>/dev/null | grep -q 'mInputShown=true'; then
      "$ADB" shell input keyevent 4 || true
      sleep 0.5
    fi
  fi
}

state_value() {
  node -e 'const s=require(process.argv[1]);const v=process.argv[2].split(".").reduce((a,k)=>a?.[k],s);process.stdout.write(String(v??""))' "$STATE" "$1"
}

game() {
  local args=("$@")
  args+=(--db-path "$DB_PATH_ARG")
  node "$SCRIPTS/game-control.mjs" "${args[@]}" --base "$BASE" --state "$STATE"
}

# ---------------------------------------------------------------- server + seed

start_server() {
  log "starting the isolated ManHunt server on $BASE"
  mkdir -p "$RUNTIME"
  rm -f "$SERVER_DB" "$SERVER_DB"-shm "$SERVER_DB"-wal
  ( cd "$ROOT/server" && HOST=127.0.0.1 PORT=8080 DB_PATH="$SERVER_DB" node src/server.ts >"$SERVER_LOG" 2>&1 & echo $! >"$RUNTIME/server.pid" )
  SERVER_PID="$(cat "$RUNTIME/server.pid")"
  local deadline=$((SECONDS + 60))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if curl -fsS "$BASE/health" >/dev/null 2>&1; then
      note "server healthy (pid $SERVER_PID)"
      return 0
    fi
    sleep 1
  done
  fail "server did not become healthy; see $SERVER_LOG"
}

seed_game() {
  log "seeding the shotlist scenario (Riverside Run, 5 players)"
  game seed || fail "seed failed"
  ROOM_CODE="$(state_value roomCode)"
  HUNT_PASSWORD="$(state_value users.omar.password)"
  note "room code $ROOM_CODE (real server-generated code)"
  note "lobby verification runs after WebSocket presence is live"
}

start_presence() {
  log "holding WebSocket presence for all five players"
  node "$SCRIPTS/game-control.mjs" presence --base "$BASE" --state "$STATE" >"$PRESENCE_LOG" 2>&1 &
  PRESENCE_PID=$!
  local deadline=$((SECONDS + 30))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if grep -q 'holding connections' "$PRESENCE_LOG" 2>/dev/null; then
      note "presence live"
      return 0
    fi
    sleep 1
  done
  fail "presence sockets did not come up; see $PRESENCE_LOG"
}

# ---------------------------------------------------------------- device setup

setup_display() {
  log "setting up deterministic 1080x2400 @ 420 dpi"
  "$ADB" shell wm size 1080x2400 || true
  "$ADB" shell wm density 420 || true
  "$ADB" shell settings put system font_scale 1.0 || true
  "$ADB" shell settings put system accelerometer_rotation 0 || true
  "$ADB" shell settings put system user_rotation 0 || true
  "$ADB" shell cmd overlay enable com.android.internal.systemui.navbar.gestural >/dev/null 2>&1 || true
  for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
    "$ADB" shell settings put global "$scale" 0 || true
  done
  "$ADB" shell svc power stayon true || true
  "$ADB" shell input keyevent KEYCODE_WAKEUP || true
  "$ADB" shell wm dismiss-keyguard || true
}

setup_status_bar() {
  log "status bar demo mode: clock ${CLOCK:0:2}:${CLOCK:2}, battery 100%, wifi only, no notifications"
  "$ADB" shell settings put global sysui_demo_allowed 1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm "$CLOCK" >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e mobile hide >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false >/dev/null 2>&1 || true
}

setup_timezone() {
  "$ADB" shell settings put global auto_time_zone 0 || true
  "$ADB" shell setprop persist.sys.timezone UTC || true
}

setup_hostname() {
  # The app shows the configured server. Map a self-hosted looking hostname so no
  # emulator-local address appears in frame; fall back to the app default when the
  # image refuses a writable /system.
  log "trying a friendly server hostname for the in-app server row"
  if ! "$ADB" root >/dev/null 2>&1; then
    note "adb root unavailable; keeping the app's default server URL"
    return 0
  fi
  sleep 2
  "$ADB" wait-for-device || true
  "$ADB" remount >/dev/null 2>&1 || "$ADB" shell 'mount -o rw,remount /' >/dev/null 2>&1 || true
  if ! "$ADB" shell "grep -q 'manhunt.local' /system/etc/hosts" >/dev/null 2>&1; then
    "$ADB" shell "echo '10.0.2.2 manhunt.local' >> /system/etc/hosts" >/dev/null 2>&1 || true
  fi
  if "$ADB" shell "grep -q 'manhunt.local' /system/etc/hosts" >/dev/null 2>&1 \
    && "$ADB" shell "ping -c 1 -W 2 manhunt.local" >/dev/null 2>&1; then
    APP_SERVER_URL="http://manhunt.local:8080"
    note "server row will read $APP_SERVER_URL"
  else
    note "hosts mapping unavailable; keeping the app's default server URL"
  fi
}

grant_permissions() {
  for permission in android.permission.ACCESS_COARSE_LOCATION android.permission.ACCESS_FINE_LOCATION android.permission.POST_NOTIFICATIONS; do
    "$ADB" shell pm grant "$PACKAGE" "$permission" >/dev/null 2>&1 || true
  done
  "$ADB" shell settings put secure location_mode 3 >/dev/null 2>&1 || true
  "$ADB" shell cmd location set-location-enabled true >/dev/null 2>&1 || true
}

install_app() {
  [ -f "$APK" ] || fail "APK not found at $APK"
  log "installing $APK"
  "$ADB" install -r -d "$APK" >/dev/null 2>&1 || fail "adb install failed"
  "$ADB" shell pm clear "$PACKAGE" >/dev/null 2>&1 || true
  grant_permissions
}

# Writes the debug build SharedPreferences (run-as). Empty token/user means signed out.
# This is how the capture switches accounts between the host (Yasmin) and player (Omar)
# views without leaving/rejoining the room (leaving would change the host mid-set).
# Sessions are real server sessions minted by game-control.mjs, not fake data.
write_app_prefs() {
  local token="${1:-}" userId="${2:-}" username="${3:-}" dark="${4:-true}" language="${5:-en}"
  local xml="$RUNTIME/manhunt-prefs.xml"
  {
    echo "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>"
    echo '<map>'
    [ -n "$token" ] && echo "    <string name=\"token\">$token</string>"
    [ -n "$userId" ] && echo "    <string name=\"user\">{\"id\":\"$userId\",\"username\":\"$username\"}</string>"
    echo "    <boolean name=\"dark_theme\" value=\"$dark\" />"
    echo '    <boolean name="welcome_accepted_v2" value="true" />'
    echo "    <string name=\"language\">$language</string>"
    echo '    <float name="text_scale" value="1.0" />'
    [ -n "$APP_SERVER_URL" ] && echo "    <string name=\"server_url\">$APP_SERVER_URL</string>"
    echo '</map>'
  } >"$xml"
  "$ADB" push "$xml" /data/local/tmp/manhunt-prefs.xml >/dev/null 2>&1 || fail "could not push prefs"
  "$ADB" shell run-as "$PACKAGE" mkdir -p shared_prefs >/dev/null 2>&1 || true
  "$ADB" shell run-as "$PACKAGE" cp /data/local/tmp/manhunt-prefs.xml shared_prefs/manhunt.xml >/dev/null 2>&1 \
    || fail "could not write app preferences (run-as)"
}

launch_app() { "$ADB" shell am start -W -n "$ACTIVITY" >/dev/null 2>&1 || fail "could not launch the app"; }

wait_home() {
  ui_wait "Create the hunt|Host a hunt|Create hunt|home_create|Hide from your friends" 120
}

switch_user() {
  local key="$1" dark="${2:-true}" language="${3:-en}"
  local token userId username
  token="$(state_value "users.$key.token")"
  userId="$(state_value "users.$key.id")"
  username="$(state_value "users.$key.username")"
  [ -n "$token" ] || fail "no session token for $key (seed first)"
  log "switching to $username (dark=$dark, language=$language)"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  write_app_prefs "$token" "$userId" "$username" "$dark" "$language"
  launch_app
  wait_home
  sleep 1.2
}

logout_to_auth() {
  log "signing out to the Auth screen"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  write_app_prefs "" "" "" "true" "en"
  launch_app
  ui_wait "Sign in|Welcome back|Create your account|auth_username" 90
  sleep 1.2
}

join_room() {
  local code="${1:-$ROOM_CODE}"
  log "joining the room through the real invite deep link (code $code)"
  "$ADB" shell am start -a android.intent.action.VIEW -d "manhunt://join?code=$code" -n "$ACTIVITY" >/dev/null 2>&1 \
    || fail "deep link launch failed"
  ui_wait "Riverside Run" 120
}

# ---------------------------------------------------------------- captures

capture_first_run_and_auth() {
  log "capture: S02 first-run safety"
  sleep 2.5 # cold-start Open Zone reveal
  ui_wait "Before you play|Welcome to ManHunt|I understand|Let's play" 150
  if pending_shot s02; then
    note "S02 pending: skipping capture"
  else
    shot "s02-safety"
  fi
  ui_tap "I understand|Let's play|Accept|Get started" 30
  log "capture: S01 Auth"
  ui_wait "Welcome back|Sign in|Create your account" 120
  sleep 1.5
  hide_ime
  if pending_shot s01; then
    note "S01 pending: skipping capture"
  else
    shot "s01-auth"
  fi
}

login_omar() {
  log "signing in as Omar through the real UI"
  ui_tap "text=Username|desc=Username|res=auth_username" 30
  type_text "Omar"
  ui_tap "text=Password|desc=Password|res=auth_password" 30
  type_text "$HUNT_PASSWORD"
  hide_ime
  ui_tap "Sign in|Sign In|res=auth_submit" 30
  wait_home
  sleep 1.8
}

capture_home_dark() {
  if pending_shot s03; then
    log "S03 pending: skipping Home capture"
    return 0
  fi
  log "capture: S03 Home (dark, hunt name typed, playing as Omar)"
  local typed
  typed="$(ui tap "text=Hunt name|desc=Hunt name|res=home_room_name" 20 >/dev/null 2>&1 && echo yes || echo no)"
  if [ "$typed" = "yes" ]; then
    type_text "Riverside Run"
    sleep 0.8
    hide_ime
    sleep 0.8
  else
    note "hunt-name field not found; capturing Home without a typed name"
  fi
  shot "s03-home"
}

capture_lobby_host() {
  log "capture: S05 Lobby (host view, 5 players, all ready)"
  join_room
  game verify --stage lobby || fail "host lobby state verification failed"
  sleep 2.0
  if pending_shot s05; then
    note "S05 pending: skipping capture"
  else
    shot "s05-lobby-host"
  fi
}

capture_lobby_player() {
  log "capture: S06 Lobby (player view, waiting on Leila)"
  game set-ready --user leila --ready false || fail "could not unready Leila"
  switch_user omar
  join_room
  game verify --stage lobby-waiting || fail "waiting lobby state verification failed"
  sleep 2.0
  if pending_shot s06; then
    note "S06 pending: skipping capture"
  else
    shot "s06-lobby-player"
  fi
  game set-ready --user leila --ready true || fail "could not ready Leila"
}

start_live_hunt() {
  log "starting the hunt on the server"
  game start-hunt || fail "could not start the hunt"
  game force-hunting || fail "could not jump to hunting"
  # Keep the timeline consistent before trails are posted; the countdown is re-synced
  # immediately before the S07 capture (see capture_live_hunt) so the Board reads 41:12.
  game sync-clock || fail "could not sync the hunt timeline"
  game report-trails || fail "could not post prey reports"
  game verify --stage hunting || fail "hunting state verification failed"

  log "pushing the capture phone's own GPS fix inside the zone"
  ( for _ in $(seq 1 400); do "$ADB" emu geo fix -73.9725 40.799 >/dev/null 2>&1 || true; sleep 2; done ) &
  GPS_PID=$!
}

capture_live_hunt() {
  log "capture: S07 live hunt map (hero)"
  ui_wait "Tag prey|Tag Prey|TAG PREY|match_map_card" 120
  # Trails may live in the dock (current build) or inside the hunt sheet (redesign).
  if ! ui_try_tap "text=Trails|text=Show trails|text=Trails on"; then
    if ui_try_tap "desc=Details|text=Details|text=DETAILS"; then
      ui_try_tap "text=Trails|text=Show trails|text=Trails on"
      ui_try_tap "desc=Hide details|text=Hide details|text=Close|text=Close details"
    fi
  fi
  sleep 14 # let the real OSM tiles download (cold emulator cache)
  # Freeze the Board clock at 41:12 right before the hero frame; the peer chat line is a
  # real broadcast that makes the app refetch room state (and it is timestamp-normalised
  # with the rest of the chat before S11).
  game sync-clock --trigger-user sara --trigger-body "Clock is running. Stay sharp." || fail "could not sync the Board clock"
  sleep 1.5
  shot "s07-hunt"
  sleep 4
  shot "s07-hunt-alt"

  log "capture: S07 landscape map band (2400x1080)"
  "$ADB" shell settings put system user_rotation 1 >/dev/null 2>&1 || true
  sleep 4
  ui_wait "Tag prey|Tag Prey|TAG PREY" 90 || true
  ui_try_tap "text=Trails|text=Show trails|text=Trails on"
  sleep 6
  shot "s07-hunt-wide"
  "$ADB" shell settings put system user_rotation 0 >/dev/null 2>&1 || true
  sleep 4
  ui_wait "Tag prey|Tag Prey|TAG PREY" 90 || true

  log "capture: S10 hunt sheet expanded"
  ui_tap "desc=Details|text=Details|text=DETAILS" 30
  sleep 1.6
  if pending_shot s10; then
    note "S10 pending: skipping capture"
  else
    shot "s10-hunt-sheet"
  fi
  ui_try_tap "desc=Hide details|text=Hide details|text=Close|text=Close details"

  log "tagging Leila out (result path) and capturing: S09 tag target sheet"
  game tag-prey --hunter tariq --prey leila --confirm || fail "could not tag Leila"
  sleep 2.5
  ui_tap "Tag prey|Tag Prey|TAG PREY" 40
  ui_wait "Who did you tag|Pick the player|tag_picker" 40
  sleep 1.4
  if pending_shot s09; then
    note "S09 pending: skipping capture"
  else
    shot "s09-tag-target-sheet"
  fi
  ui_try_tap "text=Cancel|text=Keep playing|text=Never mind|desc=Cancel"
  sleep 1.2

  if pending_shot s11; then
    log "S11 pending: skipping Chat capture"
    return 0
  fi
  log "capture: S11 Chat (field log during the hunt)"
  game chat --user sara --body "One left. She's not going far." || fail "could not post the chat line"
  game chat-clock --end 2052 || fail "could not normalise the chat clock"
  ui_tap "text=Chat|text=Chat tab" 40
  ui_wait "north gate|Riverside Run|Say hello|No messages yet" 60
  sleep 1.6
  hide_ime
  shot "s11-chat"
  ui_try_tap "text=Game|text=Game tab"
}

capture_claim_and_hunters_result() {
  log "switching to the Prey view (Yasmin) for the claim beat"
  # Freeze the timeline before the app joins again, so the Prey Board also reads 41:12.
  game sync-clock || fail "clock sync failed"
  switch_user yasmin
  join_room
  sleep 2.5
  game claim-on-yasmin || fail "could not create the tag claim"
  game verify --stage claim || fail "claim state verification failed"

  log "capture: S08 live hunt, Prey tag claim"
  ui_wait "tagged|Tag claim|Confirm tag|REVIEW|claim" 90
  sleep 1.8
  if pending_shot s08; then
    note "S08 pending: skipping capture"
  else
    shot "s08-hunt-claim"
  fi

  log "finishing the match: Hunters win (both Prey tagged)"
  game set-played || fail "could not set the played time"
  game confirm-claim || fail "could not confirm the claim"
  ui_wait "HUNTERS WIN|Hunt result|FULL TIME|Back to the lobby|Back to lobby" 90
  game verify --stage result-hunters || fail "Hunters-win result verification failed"
  sleep 1.8
  if pending_shot s12; then
    note "S12 pending: skipping capture"
  else
    shot "s12-result-hunters"
  fi
  ui_try_tap "Back to the lobby|Back to lobby|Back to Lobby"
  sleep 2.0
}

capture_prey_result() {
  log "second match: Prey win (1 of 2 survives on the roster; honest app state)"
  game rematch-ready || fail "could not ready everyone for the rematch"
  game start-hunt || fail "could not start the rematch"
  game force-hunting || fail "could not jump the rematch to hunting"
  game sync-clock || fail "could not sync the rematch timeline"
  game set-played || fail "could not set the played time"
  game tag-prey --hunter tariq --prey leila --confirm || fail "could not tag Leila in the rematch"
  game end-match || fail "could not end the rematch"
  ui_wait "PREY WIN|Hunt result|FULL TIME|Prey win" 90
  game verify --stage result-prey || fail "Prey-win result verification failed"
  sleep 1.8
  if pending_shot s13; then
    note "S13 pending: skipping capture (data-gap: survivor count unavailable)"
  else
    shot "s13-result-prey"
  fi
  ui_try_tap "Back to the lobby|Back to lobby|Back to Lobby"
  sleep 2.0
}

leave_room_to_home() {
  log "leaving the room to reach Home"
  ui_try_tap "desc=Leave|text=Leave|room_leave"
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  sleep 1.0
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  wait_home
}

capture_settings() {
  if pending_shot s14; then
    log "S14 pending: skipping Settings capture"
    return 0
  fi
  log "capture: S14 Settings (Appearance, dark)"
  ui_tap "desc=Settings|text=Settings|home_settings" 40
  ui_wait "Theme|Appearance|Appearance & theme|Settings" 60
  sleep 1.6
  shot "s14-settings"
  ui_try_tap "desc=Back|text=Back|navigate up"
  wait_home
}

capture_light_and_rtl() {
  if pending_shot s15 && pending_shot s04; then
    log "S15/S04 pending: skipping light + RTL Home captures"
  else
    if pending_shot s15; then
      log "S15 pending: skipping Home light capture"
    else
      log "capture: S15 Home (light theme)"
    fi
    if pending_shot s04; then
      log "S04 pending: skipping Home RTL capture"
    fi
    # The host account (Yasmin) is currently signed in; re-inject it with the target theme.
    switch_user yasmin "false" "en"
    sleep 1.2
    if ! pending_shot s15; then shot "s15-home-light"; fi
    switch_user yasmin "true" "ar"
    sleep 2.2
    if ! pending_shot s04; then shot "s04-home-rtl"; fi
  fi

  if pending_shot s16; then
    log "S16 pending: skipping RTL lobby capture"
    return 0
  fi
  log "capture: S16 Lobby (Arabic RTL) - best effort"
  join_room || note "RTL lobby join failed (optional shot)"
  sleep 2.5
  shot "s16-lobby-rtl" || true
  ui_try_tap "desc=Leave|text=Leave|room_leave"
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  sleep 1.0
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  wait_home || true
}

capture_state_extras() {
  if pending_shot s17 && pending_shot s18 && pending_shot s19; then
    log "S17/S18/S19 pending: skipping state extras"
    return 0
  fi
  if ! pending_shot s17; then
    log "capture: S17 empty chat state"
    game create-room --user omar --name "Riverside Run" >/dev/null || return 1
    local extra_code
    extra_code="$(state_value extraRoomCode)"
    switch_user omar "true" "en"
    join_room "$extra_code" || return 1
    sleep 1.5
    ui_tap "text=Chat|text=Chat tab" 40
    ui_wait "No messages yet|Say hello|Start the conversation" 60
    sleep 1.2
    shot "s17-empty-chat"
    # Leave the empty room and head to Auth for the loading/error states.
    ui_try_tap "desc=Leave|text=Leave|room_leave"
    ui_try_tap "text=Leave|text=Leave room|text=Confirm"
    sleep 1.0
    ui_try_tap "text=Leave|text=Leave room|text=Confirm"
    wait_home || return 1
  fi
  if pending_shot s18 && pending_shot s19; then
    log "S18/S19 pending: skipping Auth state extras"
    return 0
  fi

  log "capture: S18/S19 Auth loading + server error (best effort)"
  ui_tap "text=Sign out|desc=Sign out|home_signout" 30
  ui_wait "Sign in|Welcome back|Create your account" 60
  ui_tap "text=Username|desc=Username|res=auth_username" 30
  type_text "Omar"
  ui_tap "text=Password|desc=Password|res=auth_password" 30
  type_text "$HUNT_PASSWORD"
  hide_ime
  # Freeze the server so the submit spinner stays up long enough to capture.
  kill -STOP "$SERVER_PID" 2>/dev/null || return 1
  ui_tap "Sign in|Sign In|auth_submit" 20
  sleep 1.3
  if pending_shot s18; then
    note "S18 pending: skipping capture"
  else
    shot "s18-auth-loading"
  fi
  kill -9 "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
  sleep 7
  if pending_shot s19; then
    note "S19 pending: skipping capture"
  else
    shot "s19-auth-error"
  fi
}

write_meta() {
  log "writing capture metadata"
  local commit=""
  if [ -n "${GITHUB_SHA:-}" ]; then commit="$GITHUB_SHA"; else commit="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"; fi
  node "$SCRIPTS/write-meta.mjs" --out "$OUT" --state "$STATE" --base "$BASE" --clock "$CLOCK" \
    --apk "$APK" --commit "$commit" --pending "$PENDING" || fail "could not write capture metadata"
}

# ---------------------------------------------------------------- main

main() {
  mkdir -p "$OUT"
  rm -f "$OUT"/*.png "$OUT"/captures.json "$OUT"/capture-meta.json 2>/dev/null || true
  rm -rf "$OUT/_debug"

  start_server
  seed_game
  start_presence
  # Presence must be live before asserting the connected roster (and before S05 is shot).
  log "verifying the seeded lobby with live presence"
  game verify --stage lobby || fail "seeded lobby verification failed (presence / WebSocket)"

  wait_for_boot() {
    log "waiting for the device to boot"
    "$ADB" wait-for-device || fail "no device"
    local deadline=$((SECONDS + 240))
    while [ "$SECONDS" -lt "$deadline" ]; do
      if [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; then
        sleep 2
        return 0
      fi
      sleep 2
    done
    fail "device did not finish booting"
  }
  wait_for_boot
  setup_display
  install_app
  setup_hostname
  setup_timezone
  setup_status_bar

  launch_app
  capture_first_run_and_auth
  login_omar
  capture_home_dark

  log "switching to the host view (Yasmin) for the lobby hero"
  switch_user yasmin
  capture_lobby_host
  capture_lobby_player

  start_live_hunt
  capture_live_hunt
  capture_claim_and_hunters_result
  capture_prey_result

  leave_room_to_home
  capture_settings
  capture_light_and_rtl

  if [ "$EXTRAS" = "1" ]; then
    capture_state_extras || note "optional state extras failed; continuing without them"
  fi

  write_meta
  log "capture complete; verifying PNGs"
  node "$SCRIPTS/verify-captures.mjs" "$OUT" --pending "$PENDING" || fail "capture verification failed"
  log "premium captures ready in $OUT"
  ls -lh "$OUT"/*.png
}

main "$@"
