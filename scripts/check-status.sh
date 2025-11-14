#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

ADAPTER_PORT="${PORT:-3000}"
CORE_BASE_URL="${CORE_API_BASE_URL:-http://127.0.0.1:8000}"
CORE_HEALTH_ENDPOINT="${CORE_BASE_URL%/}/api/v1/status"
NGROK_API_URL="http://127.0.0.1:4040/api/tunnels"

divider() {
  printf '\n%s\n\n' "----------------------------------------"
}

check_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -i :"$port" | awk 'NR==1 || /LISTEN/'
  elif command -v ss >/dev/null 2>&1; then
    ss -lntp "sport = :$port"
  else
    echo "Neither lsof nor ss is available to inspect ports." >&2
  fi
}

check_endpoint() {
  local name=$1
  local url=$2
  echo "→ $name ($url)"
  if curl -fsS "$url" >/tmp/check-status-last.json 2>/tmp/check-status-last.err; then
    cat /tmp/check-status-last.json
  else
    echo "Failed to reach $url"
    cat /tmp/check-status-last.err
  fi
  rm -f /tmp/check-status-last.json /tmp/check-status-last.err
}

echo "Adapter port: $ADAPTER_PORT"
check_port "$ADAPTER_PORT"
divider

check_endpoint "Adapter health" "http://127.0.0.1:${ADAPTER_PORT}/health"
divider

check_endpoint "Core health" "$CORE_HEALTH_ENDPOINT"
divider

echo "ngrok tunnels (if ngrok is running):"
if curl -fsS "$NGROK_API_URL" >/tmp/check-status-ngrok.json 2>/tmp/check-status-ngrok.err; then
  PYTHON_BIN=$(command -v python3 || command -v python)
  if [ -n "$PYTHON_BIN" ]; then
    "$PYTHON_BIN" - <<'PY'
import json, os
with open("/tmp/check-status-ngrok.json", "r", encoding="utf-8") as fh:
    data = json.load(fh)
tunnels = data.get("tunnels", [])
if not tunnels:
    print("No active tunnels found.")
for tun in tunnels:
    print(f"- {tun.get('public_url')} -> {tun.get('config', {}).get('addr')}")
PY
  else
    echo "Python is not available to parse ngrok output. Raw response:"
    cat /tmp/check-status-ngrok.json
  fi
else
  echo "Could not query ngrok API (maybe ngrok is not running)."
  cat /tmp/check-status-ngrok.err
fi
rm -f /tmp/check-status-ngrok.json /tmp/check-status-ngrok.err

