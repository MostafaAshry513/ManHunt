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
# Landscape band is optional; rotation of the live-map screen ANRt on the KVM emulator, so it
# is off by default and the site can crop the 16:9 harvest from the portrait frame instead.
CAPTURE_LANDSCAPE="${CAPTURE_LANDSCAPE:-0}"
# Optional shots the verified build does not have redesigned yet (comma-separated IDs,
# e.g. "s02,s11,s14"). They are skipped - never substituted with old UI - and recorded as
# pending in capture-meta.json / MANIFEST.json at fetch time.
PENDING="${CAPTURE_PENDING:-}"
APP_SERVER_URL=""
SERVER_PID=""
PRESENCE_PID=""
GPS_PID=""
DB_PATH_ARG="$RUNTIME/premium.db"
# Flags for the review metadata: did the app fall back to the emulator dev address, or is a
# dev address visible in-frame (which disqualifies the affected frame)?
DEV_URL_FALLBACK=0
DEV_URL_IN_FRAME=0

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
  "$ADB" logcat -d -t 1500 > "$OUT/_debug/logcat.txt" 2>&1 || true
  # App crash buffer + which activity is actually resumed are the fast way to tell a
  # composition/lifecycle failure from a navigation/selector miss.
  "$ADB" logcat -d -b crash -t 400 > "$OUT/_debug/crash.txt" 2>&1 || true
  "$ADB" shell pidof "$PACKAGE" > "$OUT/_debug/pid.txt" 2>&1 || true
  "$ADB" shell dumpsys activity activities 2>/dev/null | grep -E 'mResumedActivity|topResumedActivity|Hist #' \
    > "$OUT/_debug/activities.txt" 2>&1 || true
  "$ADB" shell dumpsys window 2>/dev/null | grep -E 'mCurrentFocus|mFocusedApp' \
    > "$OUT/_debug/focus.txt" 2>&1 || true
  "$ADB" shell settings get system time_12_24 > "$OUT/_debug/time-format.txt" 2>&1 || true
  "$ADB" shell date > "$OUT/_debug/device-date.txt" 2>&1 || true
  "$ADB" shell getprop persist.sys.timezone > "$OUT/_debug/timezone.txt" 2>&1 || true
  cp "$RUNTIME/network-setup.log" "$OUT/_debug/network-setup.log" 2>/dev/null || true
  cp "$RUNTIME/hosts-setup.log" "$OUT/_debug/hosts-setup.log" 2>/dev/null || true
  cp "$RUNTIME/trust-setup.log" "$OUT/_debug/trust-setup.log" 2>/dev/null || true
  cp "$SERVER_LOG" "$OUT/_debug/server.log" 2>/dev/null || true
  cp "$PRESENCE_LOG" "$OUT/_debug/presence.log" 2>/dev/null || true
  "$ADB" shell wm size > "$OUT/_debug/wm-size.txt" 2>&1 || true
  dump_app_network
}

# App-side network evidence for the map-tile quality gate (osmdroid fetches tiles itself).
dump_app_network() {
  mkdir -p "$OUT/_debug"
  "$ADB" logcat -d 2>/dev/null \
    | grep -iE 'osmdroid|openstreetmap|tile|ssl|unknownhost|network|http|connectexception' \
    | tail -n 400 > "$OUT/_debug/app-network.txt" 2>/dev/null || true
  "$ADB" shell ping -c 1 -W 3 tile.openstreetmap.org > "$OUT/_debug/ping-osm.txt" 2>&1 || true
  "$ADB" shell ping -c 1 -W 3 1.1.1.1 > "$OUT/_debug/ping-internet.txt" 2>&1 || true
  # TCP egress probe (ICMP is not supported by QEMU user networking, so ping alone is not
  # evidence either way; nc exit status proves whether HTTPS to the internet works).
  "$ADB" shell "toybox nc -w 5 tile.openstreetmap.org 443 </dev/null; echo nc_exit=\$?" \
    > "$OUT/_debug/nc-osm.txt" 2>&1 || true
  "$ADB" shell "toybox nc -w 5 1.1.1.1 443 </dev/null; echo nc_exit=\$?" \
    > "$OUT/_debug/nc-internet.txt" 2>&1 || true
  # Full logcat so the exact TLS/Conscrypt reason for any tile failure is preserved.
  "$ADB" logcat -d > "$OUT/_debug/logcat-full.txt" 2>/dev/null || true
  # Runner-side evidence of its own TLS path (chain the CI edge serves vs the device's view).
  cp "$RUNTIME/osm-chain.pem" "$OUT/_debug/osm-chain.pem" 2>/dev/null || true
  cp "$RUNTIME/trust-setup.log" "$OUT/_debug/trust-setup.log" 2>/dev/null || true
  curl -sS -D "$OUT/_debug/runner-curltls-headers.txt" -o /dev/null --max-time 20 \
    "https://tile.openstreetmap.org/0/0/0.png" >> "$OUT/_debug/runner-curltls-headers.txt" 2>&1 || true
}

fail() {
  printf '\n!! CAPTURE FAILED: %s\n' "$*" >&2
  debug_dump
  exit 1
}

cleanup() {
  local status=$?
  # Restore the system bars even on failure; the demo status bar is not needed for delivery.
  "$ADB" shell settings put global policy_control "" >/dev/null 2>&1 || true
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
# `|| true` matters: with set -e, a missing optional control must never abort the capture.
ui_try_tap() { ui tap "$1" "${2:-8}" >/dev/null 2>&1 || true; }

# Tap a labelled form field: the label sits above the input box, so tap just below it; fall
# back to the Nth EditText node (Compose exposes BasicTextField as android.widget.EditText).
# Avoids matching an icon whose description contains the label (e.g. "Show password").
tap_field() {
  local label="$1" index="$2"
  if ui tap-near "text=$label" 0 80 20 >/dev/null 2>&1; then
    return 0
  fi
  note "$label label not tappable; falling back to text field #$index"
  ui tap-edit "$index" 20 >/dev/null 2>&1
}

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
  # 24-hour format so the demo clock reads 21:04 (not 9:04) as in the shotlist.
  "$ADB" shell settings put system time_12_24 24 || true
  "$ADB" shell settings put global sysui_demo_allowed 1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm "$CLOCK" >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false >/dev/null 2>&1 || true
  # Wi-Fi in demo mode renders a "no internet" warning badge on this image; show a clean
  # full cellular signal instead (still a real, connected-looking status bar, no warning).
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command network -e wifi hide -e mobile show -e datatype 5g -e level 4 >/dev/null 2>&1 || true
  "$ADB" shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false >/dev/null 2>&1 || true
}

hide_status_bar_for_delivery() {
  # Clean page captures: hide the OS status bar entirely while the app keeps its edge-to-edge
  # layout. This is applied after the demo status bar is configured; cleanup resets it.
  log "hiding status bar for delivery captures (immersive.status)"
  "$ADB" shell settings put global policy_control "immersive.status=com.manhunt.app" || true
  "$ADB" shell settings put global policy_control "immersive.status=*" || true
}

setup_timezone() {
  "$ADB" shell settings put global auto_time_zone 0 || true
  "$ADB" shell setprop persist.sys.timezone UTC || true
}

# Pin the device wall clock to the capture moment (21:04 UTC) so the MATCHDAY masthead time,
# the demo status-bar clock and the normalised chat bubbles agree. Best effort: needs the
# rooted (adb root) userdebug image; if it fails the set is still captured and the
# diagnostics record the real device time.
setup_device_clock() {
  log "pinning the device clock to the capture moment (best effort)"
  "$ADB" shell settings put global auto_time 0 >/dev/null 2>&1 || true
  if "$ADB" shell "date 110221042026.00" >/dev/null 2>&1; then
    local actual
    actual="$("$ADB" shell date 2>/dev/null | tr -d '\r')"
    note "device clock set: $actual"
  else
    note "could not set the device clock (needs root); masthead will show the real time"
  fi
}

setup_hostname() {
  # The app's Auth screen shows the configured server. Point it at a self-hosted looking
  # hostname that actually resolves *inside the app's mount/network namespace*: a public
  # loopback wildcard DNS name (lvh.me family -> 127.0.0.1) forwarded to the isolated server
  # over `adb reverse`. /system/etc/hosts edits are only a last resort: a shell-namespace bind
  # mount is computed by the shell but invisible to app processes (learned the hard way).
  local report="$RUNTIME/network-setup.log"
  : >"$report"
  log "setting up the in-app server URL (adb reverse + loopback DNS name)"

  if ! "$ADB" root >/dev/null 2>&1; then
    echo "adb root unavailable (clock/locale/hosts best-effort only)" >>"$report"
  fi
  sleep 2
  "$ADB" wait-for-device || true
  echo "adb root uid: $("$ADB" shell id -u 2>/dev/null | tr -d '\r')" >>"$report"

  # Reverse from the device loopback to the isolated server on the runner (works without root).
  echo "--- adb reverse ---" >>"$report"
  "$ADB" reverse tcp:8080 tcp:8080 >>"$report" 2>&1 || true
  # A root adbd can also bind device port 80, which lets the URL read without ":8080".
  if "$ADB" reverse tcp:80 tcp:8080 >>"$report" 2>&1; then
    local portless=1
  else
    local portless=0
  fi
  echo "portless reverse: $portless" >>"$report"

  local host="" candidate
  for candidate in manhunt.lvh.me manhunt.localhost.direct manhunt.127.0.0.1.nip.io; do
    echo "--- resolving $candidate from the device ---" >>"$report"
    if "$ADB" shell "ping -c 1 -W 3 $candidate" >>"$report" 2>&1; then
      host="$candidate"
      break
    fi
  done

  if [ -n "$host" ]; then
    if [ "$portless" = "1" ]; then
      APP_SERVER_URL="http://$host"
    else
      APP_SERVER_URL="http://$host:8080"
    fi
    # Positive end-to-end probe when toybox has wget; harmless if unavailable.
    echo "--- http probe ---" >>"$report"
    "$ADB" shell "toybox wget -qO- '$APP_SERVER_URL/health'" >>"$report" 2>&1 || true
    note "server row will read $APP_SERVER_URL (reverse + $host)"
    return 0
  fi

  # Last resort: /system hosts edit (only useful to shell-namespace clients on this image).
  echo "--- no loopback DNS name resolved; trying /system/etc/hosts ---" >>"$report"
  {
    "$ADB" remount 2>&1 || true
    "$ADB" shell "echo '10.0.2.2 manhunt.local' >> /system/etc/hosts" 2>&1 || true
    "$ADB" shell "cat /system/etc/hosts" 2>&1 || true
  } >>"$report" 2>&1
  if "$ADB" shell "grep -q 'manhunt.local' /system/etc/hosts" >/dev/null 2>&1; then
    APP_SERVER_URL="http://manhunt.local:8080"
    note "hosts fallback only; server row will read $APP_SERVER_URL"
    return 0
  fi

  note "no friendly server URL available; keeping the app default (see $report)"
}

# The OSM tile CDN is served by a GlobalSign Atlas chain. The emulator image rejected it with
# "SSLHandshakeException: Chain validation failed" (all tiles blank), so make sure the device
# trust store contains the GlobalSign Root R46. On Android 14+ the store lives in the immutable
# Conscrypt APEX, so this copies that directory, adds the root, and bind-mounts the copy into
# Zygote's mount namespace (new app processes inherit it). Best effort: log everything.
setup_device_trust_for_osm() {
  local report="$RUNTIME/trust-setup.log"
  : >"$report"
  log "preparing a Zygote-bound device trust store for the OSM map-tile chain"
  # Runner-side evidence of the chain the CI edge actually serves (Fastly rotates between
  # RSA/ECDSA anchors by POP, so the emulator image may lack the anchor this runner gets).
  openssl s_client -connect tile.openstreetmap.org:443 -servername tile.openstreetmap.org \
    -showcerts </dev/null > "$RUNTIME/osm-chain.pem" 2>>"$report" || true
  grep -E 'subject=|issuer=' "$RUNTIME/osm-chain.pem" >>"$report" 2>/dev/null || true

  # Split the served chain into individual PEM certs, then add the image trust store's own
  # contents plus the R46 root plus every served cert as an anchor candidate.
  rm -rf "$RUNTIME/chaincerts"
  mkdir -p "$RUNTIME/chaincerts"
  awk -v dir="$RUNTIME/chaincerts" '
    /BEGIN CERTIFICATE/ { n += 1; file = sprintf("%s/%02d.pem", dir, n) }
    n > 0 { print > file }
  ' "$RUNTIME/osm-chain.pem"

  local root_pem="" candidate
  for candidate in /etc/ssl/certs/GlobalSign_Root_R46.pem \
                   /usr/share/ca-certificates/mozilla/GlobalSign_Root_R46.crt; do
    if [ -f "$candidate" ]; then root_pem="$candidate"; break; fi
  done

  {
    echo "--- prepare trust copy ---"
    "$ADB" shell "rm -rf /data/local/tmp/cacerts; mkdir -p /data/local/tmp/cacerts"
    "$ADB" shell "cp /apex/com.android.conscrypt/cacerts/* /data/local/tmp/cacerts/ 2>/dev/null || cp /system/etc/security/cacerts/* /data/local/tmp/cacerts/ 2>/dev/null" || true
  } >>"$report" 2>&1

  local added=0 cert hash
  for cert in "$root_pem" "$RUNTIME"/chaincerts/*.pem; do
    [ -s "$cert" ] || continue
    hash="$(openssl x509 -in "$cert" -subject_hash_old -noout 2>/dev/null | tr -d '\r' || true)"
    [ -n "$hash" ] || continue
    "$ADB" push "$cert" "/data/local/tmp/cacerts/$hash.0" >>"$report" 2>&1 || true
    added=$((added + 1))
  done
  {
    "$ADB" shell "chmod 644 /data/local/tmp/cacerts/*; chown root:root /data/local/tmp/cacerts/*" || true
    echo "anchor candidates added: $added"
    echo "--- bind the copy into Zygote's mount namespace ---"
    local pid
    for pid in $("$ADB" shell pidof zygote64 2>/dev/null | tr -d '\r') $("$ADB" shell pidof zygote 2>/dev/null | tr -d '\r'); do
      [ -n "$pid" ] || continue
      echo "zygote pid $pid"
      "$ADB" shell "nsenter --mount=/proc/$pid/ns/mnt -- mount --bind /data/local/tmp/cacerts /apex/com.android.conscrypt/cacerts" || true
      "$ADB" shell "nsenter --mount=/proc/$pid/ns/mnt -- mount --bind /data/local/tmp/cacerts /system/etc/security/cacerts" || true
    done
    echo "--- verify ---"
    "$ADB" shell "echo apex:; ls /apex/com.android.conscrypt/cacerts | wc -l; echo tmp:; ls /data/local/tmp/cacerts | wc -l"
  } >>"$report" 2>&1
  note "map-tile trust store prepared ($added anchor candidates; see $report)"
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
  local token="${1:-}" userId="${2:-}" username="${3:-}" dark="${4:-true}" language="${5:-en}" welcome="${6:-true}"
  local xml="$RUNTIME/manhunt-prefs.xml"
  {
    echo "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>"
    echo '<map>'
    [ -n "$token" ] && echo "    <string name=\"token\">$token</string>"
    [ -n "$userId" ] && echo "    <string name=\"user\">{\"id\":\"$userId\",\"username\":\"$username\"}</string>"
    echo "    <boolean name=\"dark_theme\" value=\"$dark\" />"
    echo "    <boolean name=\"welcome_accepted_v2\" value=\"$welcome\" />"
    echo "    <string name=\"language\">$language</string>"
    echo '    <float name="text_scale" value="1.0" />'
    [ -n "$APP_SERVER_URL" ] && echo "    <string name=\"server_url\">$APP_SERVER_URL</string>"
    echo '</map>'
  } >"$xml"
  "$ADB" push "$xml" /data/local/tmp/manhunt-prefs.xml >/dev/null 2>&1 || return 1
  "$ADB" shell run-as "$PACKAGE" mkdir -p shared_prefs >/dev/null 2>&1 || true
  "$ADB" shell run-as "$PACKAGE" cp /data/local/tmp/manhunt-prefs.xml shared_prefs/manhunt.xml >/dev/null 2>&1 \
    || return 1
  return 0
}

# Before the very first launch: pin the friendly server URL but keep the welcome unaccepted
# so the S02 first-run surface still appears (and the Auth shot never shows 10.0.2.2).
prime_first_run_prefs() {
  [ -n "$APP_SERVER_URL" ] || return 0
  log "priming first-run preferences with $APP_SERVER_URL"
  if write_app_prefs "" "" "" "true" "en" "false"; then
    note "first-run prefs primed (welcome not yet accepted)"
  else
    note "could not prime prefs; Auth may show the app's default server URL"
  fi
}

launch_app() { "$ADB" shell am start -W -n "$ACTIVITY" >/dev/null 2>&1 || fail "could not launch the app"; }

# Home is only accepted when a Home-only marker is on screen AND no Auth marker is present.
# Includes the Arabic labels used by the RTL captures (S04/S16) so language switching cannot
# false-negative into a failed run.
assert_home() {
  ui_wait "Host a hunt|Create hunt|Join hunt|Playing as|استضف مطاردة|انضم إلى مطاردة|أنشئ مطاردة|انضم إلى المطاردة" 120
  local dump="$RUNTIME/home-assert.txt"
  python3 "$SCRIPTS/ui.py" dump >"$dump" 2>&1 || true
  if grep -qE 'Create your account|Welcome back|New here\?' "$dump"; then
    debug_dump
    fail "Home assertion failed: Auth screen markers present after sign-in"
  fi
  if ! grep -qE 'Host a hunt|Playing as|استضف مطاردة|انضم إلى مطاردة|أنشئ مطاردة|انضم إلى المطاردة' "$dump"; then
    debug_dump
    fail "Home assertion failed: no Home content in the UI tree"
  fi
}

wait_home() { assert_home; }

# OSM raster tiles are fetched by the app itself; if the device cannot resolve/reach the tile
# host, the hero map will show only the app's grid background. Record that evidence early.
check_internet() {
  log "checking device internet access for OSM map tiles"
  if "$ADB" shell "ping -c 1 -W 3 tile.openstreetmap.org" >/dev/null 2>&1; then
    note "tile.openstreetmap.org resolves and answers from the device"
  else
    note "WARNING: device cannot reach tile.openstreetmap.org; map tiles may stay blank"
  fi
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
  write_app_prefs "$token" "$userId" "$username" "$dark" "$language" \
    || fail "could not write session preferences for $username"
  launch_app
  wait_home
  sleep 1.2
}

logout_to_auth() {
  log "signing out to the Auth screen"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  write_app_prefs "" "" "" "true" "en" || fail "could not clear session preferences"
  launch_app
  ui_wait "Sign in|Welcome back|Create your account|auth_username" 90
  sleep 1.2
}

# Marketing captures use the real Home "Join a hunt" flow: focus the CodePlate input, type the
# six-character code, then submit (IME Done; the Join button as fallback). This avoids the
# known warm invite-link bug and is the real user path.
join_room() {
  local code="${1:-$ROOM_CODE}"
  log "joining room $code through the Home CodePlate + Join hunt flow"
  if ! ui wait "Host a hunt|Create hunt|Join hunt|Playing as" 6 >/dev/null 2>&1; then
    launch_app
    wait_home
  fi
  # CodePlate sits just below the "Join a hunt" section title; the fallback targets the hidden
  # EditText directly so the flow still works in RTL (Arabic labels) captures.
  if ! ui tap-near "text=Join a hunt" 0 210 20 >/dev/null 2>&1; then
    ui tap-edit 1 20 >/dev/null 2>&1 || true
  fi
  type_text "$code"
  sleep 0.3
  # The code field's IME action is Done -> vm.joinRoom(); language-independent submit.
  "$ADB" shell input keyevent 66 >/dev/null 2>&1 || true
  sleep 2.5
  if ! ui wait "Riverside Run|OpenStreetMap contributors" 8; then
    hide_ime
    ui_try_tap "text=Join hunt|text=Join Hunt|text=Join"
    if ! ui wait "Riverside Run|OpenStreetMap contributors" 60; then
      debug_dump
      fail "room did not open through the Home join flow (room $code)"
    fi
  fi
  note "joined room $code"
}

# Diagnostic only (never used by the capture): reproduces the invite deep link path, which has
# a known app-side warm-intent bug (Phase 3 is fixing it).
join_room_via_deep_link_diagnostic() {
  local code="${1:-$ROOM_CODE}"
  local deep="manhunt://join?code=$code"
  log "diagnostic: cold-start invite deep link"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  sleep 1
  "$ADB" shell am start -W -a android.intent.action.VIEW -d "$deep" -n "$ACTIVITY" >/dev/null 2>&1 \
    || return 1
  ui wait "Riverside Run|OpenStreetMap contributors" 30
}

# ---------------------------------------------------------------- captures

# Set the app server URL through the real Auth "Change server" editor (the stored value is
# then guaranteed to be what the app shows and uses). Returns non-zero on any failure.
# Store the friendly server URL in the debug build's SharedPreferences (no session), then
# relaunch and accept only if the Auth footer actually renders the URL. This is the primary
# path because the Auth "Change server" editor can sit below the keyboard fold.
set_server_url_via_prefs() {
  local url="$1"
  log "setting the server URL via app preferences: $url"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  APP_SERVER_URL="$url"
  write_app_prefs "" "" "" "true" "en" "true" || return 1
  launch_app
  sleep 8
  hide_ime
  # Normalise scroll to the top so the footer row is on-screen for the check.
  "$ADB" shell input swipe 540 900 540 1900 300 >/dev/null 2>&1 || true
  sleep 1.5
  ui wait "Sign in|Create your account|Welcome back" 25 >/dev/null 2>&1 || true
  local dump
  dump="$(python3 "$SCRIPTS/ui.py" dump 2>/dev/null || true)"
  if printf '%s' "$dump" | grep -qF "$url"; then
    note "Auth server row shows $url (prefs)"
    return 0
  fi
  note "prefs URL not visible on Auth"
  return 1
}

# Fallback: drive the real Auth "Change server" editor (field found by its URL content).
apply_auth_server_url() {
  local url="$1"
  log "setting the app server URL to $url through the Auth editor"
  if ! ui tap "text=Change server" 30 >/dev/null 2>&1; then
    note "Change server control not found"
    return 1
  fi
  ui wait "Server address|Test connection" 30 >/dev/null 2>&1 || true
  if ! ui tap-http 20 >/dev/null 2>&1; then
    note "URL field not found by content; falling back to the third text field"
    ui tap-edit 2 20 >/dev/null 2>&1 || true
  fi
  "$ADB" shell input keyevent KEYCODE_MOVE_END >/dev/null 2>&1 || true
  for _ in $(seq 1 80); do "$ADB" shell input keyevent KEYCODE_DEL >/dev/null 2>&1 || true; done
  type_text "$url"
  hide_ime
  sleep 0.8
  # The Save row can sit below the fold after the editor expands; scroll it into view.
  "$ADB" shell input swipe 540 1800 540 1100 300 >/dev/null 2>&1 || true
  sleep 1.0
  if ! ui tap "text=Save server" 25 >/dev/null 2>&1; then
    note "Save server control not found"
    return 1
  fi
  "$ADB" shell input swipe 540 800 540 1900 300 >/dev/null 2>&1 || true
  sleep 1.0
  if ui wait "$url" 20 >/dev/null 2>&1; then
    note "Auth server row shows $url"
    return 0
  fi
  note "Auth server row did not update to $url"
  return 1
}

# Probe app -> server connectivity with the real Auth "Test connection" action. On failure,
# fall back to the emulator host default (10.0.2.2) so the capture can still complete; the
# fallback is flagged and the Auth-state extras are skipped (they would show the dev address).
verify_server_reachable() {
  [ -n "$APP_SERVER_URL" ] || return 0
  log "checking app -> server connectivity through the configured URL"
  if ! ui tap "text=Test connection" 8 >/dev/null 2>&1; then
    # The editor collapses after Save; reopen it to expose the Test connection action.
    ui_tap "text=Change server" 25 >/dev/null 2>&1 || true
    ui tap "text=Test connection" 20 >/dev/null 2>&1 || { note "Test connection control not found; skipping the probe"; return 1; }
  fi
  local deadline=$((SECONDS + 20)) state=""
  while [ "$SECONDS" -lt "$deadline" ]; do
    local dump
    dump="$(python3 "$SCRIPTS/ui.py" dump 2>/dev/null || true)"
    if printf '%s' "$dump" | grep -qiE 'reachable|server is online|connected to'; then
      state=ok
      break
    fi
    if printf '%s' "$dump" | grep -qiE 'did not respond|could not|failed|unable to'; then
      state=fail
      break
    fi
    sleep 1
  done
  if [ "$state" = "ok" ]; then
    note "server reachable through $APP_SERVER_URL"
    return 0
  fi
  note "server NOT reachable through $APP_SERVER_URL; reverting to the emulator host default"
  DEV_URL_FALLBACK=1
  # Reset the app to its compiled default without the Auth editor (which may be mid-edit).
  APP_SERVER_URL=""
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  write_app_prefs "" "" "" "true" "en" "true" >/dev/null 2>&1 || true
  launch_app
  ui wait "Sign in|Create your account|Welcome back" 30 >/dev/null 2>&1 || true
  hide_ime
  sleep 1.0
  return 1
}

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
  ui_wait "Sign in|Create your account|Welcome back" 120
  sleep 1.2
  hide_ime
  if [ -n "$APP_SERVER_URL" ]; then
    local desired_url="$APP_SERVER_URL"
    if ! set_server_url_via_prefs "$desired_url"; then
      if ! apply_auth_server_url "$desired_url"; then
        note "could not store the friendly server URL; the Auth shot may show the dev address"
        DEV_URL_IN_FRAME=1
        APP_SERVER_URL=""
      fi
    fi
  fi
  sleep 1.0
  if python3 "$SCRIPTS/ui.py" dump 2>/dev/null | grep -qE '10\.0\.2\.2|localhost'; then
    DEV_URL_IN_FRAME=1
    mkdir -p "$OUT/_debug"
    python3 "$SCRIPTS/ui.py" dump > "$OUT/_debug/auth-dev-url-warning.txt" 2>&1 || true
    note "WARNING: Auth server row contains a dev address"
  fi
  if pending_shot s01; then
    note "S01 pending: skipping capture"
  else
    shot "s01-auth"
  fi
  # Capture is clean; now prove the app can actually reach the server before signing in.
  verify_server_reachable || true
  sleep 0.8
}

login_omar() {
  log "signing in as Omar through the real UI"
  fill_login_and_submit
  if ui wait "Host a hunt|Create hunt|Join hunt|Playing as" 35; then
    sleep 1.8
    return 0
  fi
  note "sign-in did not reach Home; retrying from a fresh launch"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  if [ -n "$APP_SERVER_URL" ]; then
    DEV_URL_FALLBACK=1
    apply_auth_server_url "http://10.0.2.2:8080" >/dev/null 2>&1 || true
    APP_SERVER_URL=""
  fi
  launch_app
  ui_wait "Sign in|Create your account|Welcome back" 90
  sleep 1.2
  hide_ime
  fill_login_and_submit
  wait_home
  sleep 1.8
}

fill_login_and_submit() {
  tap_field "Username" 0 || fail "username field not found on Auth"
  type_text "Omar"
  tap_field "Password" 1 || fail "password field not found on Auth"
  type_text "$HUNT_PASSWORD"
  hide_ime
  ui_tap "text=Sign in|text=Sign In|res=auth_submit" 30
}

capture_home_dark() {
  if pending_shot s03; then
    log "S03 pending: skipping Home capture"
    return 0
  fi
  log "capture: S03 Home (dark, hunt name typed, playing as Omar)"
  if tap_field "Hunt name" 0; then
    type_text "Riverside Run"
    sleep 0.8
    hide_ime
    sleep 0.8
  else
    mkdir -p "$OUT/_debug"
    python3 "$SCRIPTS/ui.py" dump > "$OUT/_debug/home-s03-ui.txt" 2>&1 || true
    note "hunt-name field not found; captured Home without a typed name (ui dump kept)"
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
  # Real OSM tiles usually need more than a few seconds on the KVM emulator; poll screenshot
  # size (detail-rich tiles grow the PNG) and keep re-freezing the clock before the hero frame.
  local attempt=0 probe_bytes=0
  while [ "$attempt" -lt 5 ]; do
    game sync-clock --remaining 2475 --trigger-user sara --trigger-body "Clock is running. Stay sharp." || true
    sleep 8
    "$ADB" exec-out screencap -p > "$RUNTIME/map-probe.png" 2>/dev/null || true
    probe_bytes=$(stat -c%s "$RUNTIME/map-probe.png" 2>/dev/null || echo 0)
    mkdir -p "$OUT/_debug"
    cp "$RUNTIME/map-probe.png" "$OUT/_debug/map-probe-$((attempt + 1)).png" 2>/dev/null || true
    note "tile probe $((attempt + 1)): $probe_bytes bytes"
    if [ "$probe_bytes" -gt 360000 ]; then
      break
    fi
    attempt=$((attempt + 1))
  done
  game sync-clock --remaining 2473 --trigger-user sara --trigger-body "Clock is running. Stay sharp." || fail "could not sync the Board clock"
  sleep 1.2
  shot "s07-hunt"
  sleep 4
  shot "s07-hunt-alt"
  dump_app_network

  if [ "$CAPTURE_LANDSCAPE" = "1" ]; then
    log "capture: S07 landscape map band (2400x1080) - optional, may ANR on KVM"
    if ! ( "$ADB" shell settings put system user_rotation 1
           sleep 4
           ui wait "Tag prey|Tag Prey|TAG PREY" 25
           sleep 5
           shot "s07-hunt-wide" ); then
      note "landscape band skipped (rotation ANR/failure)"
    fi
    "$ADB" shell settings put system user_rotation 0 >/dev/null 2>&1 || true
    sleep 3
    ui_try_tap "text=Wait|text=Close app"
    sleep 2
  fi

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
  # The tile-readiness poll posted repeated "Clock is running" trigger lines and the account
  # switches produced "joined" system rows; prune both so the field log reads like the seeded
  # conversation, then restart + rejoin so the app refetches a clean list (chat deletions do
  # not arrive over the socket, an already-open list would keep showing them).
  game prune-chat --body-contains "Clock is running" || note "could not prune the clock-trigger chat lines"
  game prune-chat --body-contains "joined the" || note "could not prune the join notices"
  game chat --user sara --body "One left. She's not going far." || fail "could not post the chat line"
  game chat-clock --end 2052 || fail "could not normalise the chat clock"
  "$ADB" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  launch_app
  wait_home
  join_room
  sleep 2.0
  ui_tap "text=Chat|text=Chat tab" 40
  # New MATCHDAY field log: phase separator + timestamped rows + composer (the old chat-bubble
  # strings no longer exist).
  ui_wait "Message|Match started|One left|Take the path" 60
  sleep 1.8
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
  # Anchor the played clock, then confirm the claim through the REAL app UI so the app receives
  # the authoritative event and renders its result overlay (a DB-only confirmation left the
  # claim sheet open and the result never appeared).
  game set-played --seconds 1127 || fail "could not set the played time"
  ui_tap "text=Confirm|desc=Confirm|tag_confirm" 60
  ui_wait "Hunters win|Prey win|View hunt history|Back to lobby|FULL TIME|Full time" 90
  game verify --stage result-hunters || fail "Hunters-win result verification failed"
  # Re-anchor against the real ended_at so the finished board reads exactly 18:48 played, then
  # broadcast a peer line so the open result page refetches.
  game set-played --seconds 1128 --anchor-ended --trigger-user sara \
    --trigger-body "Good hunt. Same time next week." || note "could not re-anchor the played time"
  sleep 2.5
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
  ui_wait "Prey win|Hunters win|View hunt history|Back to lobby|FULL TIME|Full time" 90
  game verify --stage result-prey || fail "Prey-win result verification failed"
  game set-played --seconds 1128 --anchor-ended --trigger-user sara \
    --trigger-body "Good hunt. Same time next week." || note "could not re-anchor the played time"
  sleep 2.5
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
  # Best effort: the next capture step force-stops and relaunches the app anyway, so a changed
  # leave flow must never abort the run.
  log "leaving the room to reach Home (best effort)"
  ui_try_tap "desc=Leave|text=Leave|room_leave"
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  sleep 1.0
  ui_try_tap "text=Leave|text=Leave room|text=Confirm"
  sleep 1.0
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
  # Optional shot: a failure here must not abort the rest of the set; it is recorded pending.
  if ! ( join_room && sleep 2.5 && shot "s16-lobby-rtl" ); then
    note "S16 RTL lobby capture failed; it will be recorded as pending"
    launch_app >/dev/null 2>&1 || true
    wait_home >/dev/null 2>&1 || true
  fi
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
  if [ "$DEV_URL_FALLBACK" = "1" ] || [ "$DEV_URL_IN_FRAME" = "1" ]; then
    log "skipping S18/S19: the Auth screen would show the emulator/dev server address"
    return 0
  fi

  log "capture: S18/S19 Auth loading + server error (best effort)"
  # The RTL captures leave the app in Arabic; switch back to the English Home so the sign-out
  # and Auth-state selectors below are stable.
  switch_user omar "true" "en"
  ui_tap "text=Sign out|desc=Sign out|home_signout" 30
  ui_wait "Sign in|Welcome back|Create your account" 60
  tap_field "Username" 0 || return 1
  type_text "Omar"
  tap_field "Password" 1 || return 1
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
    --apk "$APK" --commit "$commit" --pending "$EFFECTIVE_PENDING" || fail "could not write capture metadata"
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
  check_internet
  install_app
  setup_hostname
  setup_device_trust_for_osm
  setup_timezone
  setup_device_clock
  setup_status_bar
  hide_status_bar_for_delivery
  "$ADB" logcat -c >/dev/null 2>&1 || true

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

  # Dev-URL fallbacks invalidate the Auth-state extras: record them pending instead.
  EFFECTIVE_PENDING="$PENDING"
  if [ "$DEV_URL_FALLBACK" = "1" ] || [ "$DEV_URL_IN_FRAME" = "1" ]; then
    EFFECTIVE_PENDING="$EFFECTIVE_PENDING,s18,s19"
    note "dev server URL fallback flagged: S18/S19 recorded pending, and S01 flagged for review"
  fi

  write_meta
  log "capture complete; verifying PNGs"
  node "$SCRIPTS/verify-captures.mjs" "$OUT" --pending "$EFFECTIVE_PENDING" || fail "capture verification failed"
  log "premium captures ready in $OUT"
  ls -lh "$OUT"/*.png
}

main "$@"
