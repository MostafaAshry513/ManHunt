#!/usr/bin/env bash
# Runs the in-app Android test on the emulator with a real backend.
# Invoked as a single line by reactivecircus/android-emulator-runner, which
# executes its `script` input line-by-line.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/server"
HOST=0.0.0.0 PORT=8080 DB_PATH=./data/ci-emulator.db node src/server.ts > server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  status=$?
  # Pull whatever the instrumentation test captured before the emulator dies.
  local shots="$ROOT/emulator-screenshots"
  rm -rf "$shots"; mkdir -p "$shots"
  echo "==== emulator: screenshot paths ===="
  adb logcat -d -v brief 2>/dev/null | grep 'ManHuntTest.*screenshot' | tail -n 10 || true
  adb shell run-as com.manhunt.app ls files/screenshots 2>&1 || true
  for f in $(adb shell run-as com.manhunt.app ls files/screenshots 2>/dev/null | tr -d '\r'); do
    adb exec-out run-as com.manhunt.app cat "files/screenshots/$f" > "$shots/$f" 2>/dev/null || true
  done
  ls -l "$shots" 2>&1 || true
  if [ "$status" -ne 0 ]; then
    echo "==== emulator: backend log (tail) ===="
    tail -n 200 "$ROOT/server/server.log" || true
    echo "==== emulator: app logcat (tail) ===="
    adb logcat -d -v brief 2>/dev/null | grep -Ei 'manhunt|System\.out|OkHttp|AndroidRuntime|FATAL' | tail -n 400 || true
  fi
  kill "$SERVER_PID" 2>/dev/null || true
  kill "${GPS_PID:-}" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS http://127.0.0.1:8080/health; then
  echo "backend failed to start"
  cat server.log
  exit 1
fi

# Best-effort proof the emulator can route to the host. The backend log records
# the test's own requests with host 10.0.2.2, which covers the HTTP side.
echo "==== emulator -> host ping ===="
adb shell 'ping -c 1 -W 3 10.0.2.2' || true
# Give the app a real land fix so the hunting map/screenshot is meaningful.
adb shell settings put secure location_mode 3 || true
adb shell cmd location set-location-enabled true || true
adb emu geo fix -0.1278 51.5074 || true
(
  for _ in $(seq 1 90); do
    adb emu geo fix -0.1278 51.5074 >/dev/null 2>&1 || true
    sleep 2
  done
) &
GPS_PID=$!
echo

cd ../android
./gradlew :app:connectedDebugAndroidTest \
  -Pandroid.injected.androidTest.leaveApksInstalledAfterRun=true \
  --console=plain
