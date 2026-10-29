#!/usr/bin/env bash
# Runs the in-app Android test on the emulator with a real backend.
# Invoked as a single line by reactivecircus/android-emulator-runner, which
# executes its `script` input line-by-line.
set -euo pipefail

cd "$(dirname "$0")/../.."

cd server
HOST=0.0.0.0 PORT=8080 DB_PATH=./data/ci-emulator.db node src/server.ts > server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

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

cd ../android
./gradlew :app:connectedDebugAndroidTest --console=plain
