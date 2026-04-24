#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

TARGET_REPO_PATH="${TARGET_REPO_PATH:-$ROOT_DIR/demo-target-repo}"
ODT_PROFILE="${ODT_PROFILE:-react-js}"
WITH_A11Y="${WITH_A11Y:-1}"
MCP_HOST="${MCP_HOST:-127.0.0.1}"
MCP_PORT="${MCP_PORT:-4310}"
WEB_HOST="${WEB_HOST:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-8080}"
FRESH_RUNTIME="${FRESH_RUNTIME:-1}"

RUNTIME_DIR="$ROOT_DIR/reports/odt/runtime"
MCP_LOG="$RUNTIME_DIR/mcp-local.log"
WEB_LOG="$RUNTIME_DIR/static-server.log"
PID_FILE="$RUNTIME_DIR/pids.env"

mkdir -p "$RUNTIME_DIR"

print_header() {
  printf '\n== %s ==\n' "$1"
}

normalize_path() {
  local p="$1"
  while [ "${#p}" -gt 1 ] && [ "${p%/}" != "$p" ]; do
    p="${p%/}"
  done
  echo "$p"
}

port_in_use() {
  local host="$1"
  local port="$2"
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null | grep -q "${host}:${port}" || \
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
}

list_listen_pids() {
  local port="$1"
  lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
}

kill_pid_if_running() {
  local pid="${1:-}"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
}

stop_recorded_runtime() {
  if [ "$FRESH_RUNTIME" != "1" ] || [ ! -f "$PID_FILE" ]; then
    return
  fi

  # shellcheck disable=SC1090
  source "$PID_FILE"

  kill_pid_if_running "${MCP_PID:-}"
  kill_pid_if_running "${WEB_PID:-}"
}

find_free_port() {
  local host="$1"
  local start_port="$2"
  local port="$start_port"

  while port_in_use "$host" "$port"; do
    port=$((port + 1))
  done

  echo "$port"
}

is_mcp_healthy() {
  local host="$1"
  local port="$2"
  curl -fsS "http://${host}:${port}/health" >/dev/null 2>&1
}

read_mcp_context_field() {
  local host="$1"
  local port="$2"
  local field="$3"
  curl -fsS "http://${host}:${port}/context" 2>/dev/null | node -e "let data='';process.stdin.on('data',c=>data+=c);process.stdin.on('end',()=>{try{const json=JSON.parse(data);process.stdout.write(String(json['$field'] || ''));}catch{}})"
}

mcp_context_matches_expected() {
  local host="$1"
  local port="$2"
  local actual_workspace
  local actual_target
  local expected_workspace
  local expected_target

  actual_workspace="$(read_mcp_context_field "$host" "$port" "workspaceRoot")"
  actual_target="$(read_mcp_context_field "$host" "$port" "targetRepoPath")"
  expected_workspace="$(normalize_path "$ROOT_DIR")"
  expected_target="$(normalize_path "$TARGET_REPO_PATH")"

  if [ -z "$actual_workspace" ] || [ -z "$actual_target" ]; then
    return 1
  fi

  [ "$(normalize_path "$actual_workspace")" = "$expected_workspace" ] && \
  [ "$(normalize_path "$actual_target")" = "$expected_target" ]
}

run_odt_init() {
  print_header "ODT Init"
  node packages/accessibility-ai-shield/bin/a11y-shield.js odt:init --target-repo-path "$TARGET_REPO_PATH"
}

run_odt_pipeline() {
  print_header "ODT Run"
  if [ "$WITH_A11Y" = "1" ]; then
    node packages/accessibility-ai-shield/bin/a11y-shield.js odt:run --profile "$ODT_PROFILE" --withA11y --target-repo-path "$TARGET_REPO_PATH"
  else
    node packages/accessibility-ai-shield/bin/a11y-shield.js odt:run --profile "$ODT_PROFILE" --target-repo-path "$TARGET_REPO_PATH"
  fi
}

start_mcp_server() {
  print_header "Local Context Server"

  local requested_port="$MCP_PORT"
  local actual_port="$requested_port"

  if is_mcp_healthy "$MCP_HOST" "$requested_port"; then
    if mcp_context_matches_expected "$MCP_HOST" "$requested_port"; then
      if [ "$FRESH_RUNTIME" = "1" ]; then
        echo "Refreshing existing MCP server on http://${MCP_HOST}:${requested_port} so the latest code is active."
        for pid in $(list_listen_pids "$requested_port"); do
          kill_pid_if_running "$pid"
        done
      else
        echo "Reusing existing MCP server at http://${MCP_HOST}:${requested_port}"
        MCP_PORT="$requested_port"
        MCP_PID=""
        return
      fi
    fi
    if port_in_use "$MCP_HOST" "$requested_port"; then
      echo "Port ${requested_port} has an MCP server for a different workspace/target repo; starting an isolated server."
    fi
  fi

  if port_in_use "$MCP_HOST" "$requested_port"; then
    actual_port="$(find_free_port "$MCP_HOST" "$requested_port")"
    echo "Port ${requested_port} already in use; switching MCP server to port ${actual_port}."
  fi

  nohup node packages/delivery-copilot/bin/delivery-copilot.js mcp:local serve --host "$MCP_HOST" --port "$actual_port" --target-repo-path "$TARGET_REPO_PATH" >"$MCP_LOG" 2>&1 &
  MCP_PID=$!

  local attempts=0
  until is_mcp_healthy "$MCP_HOST" "$actual_port"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 20 ]; then
      echo "MCP server did not become healthy. Check log: $MCP_LOG"
      exit 1
    fi
    sleep 0.5
  done

  MCP_PORT="$actual_port"
  echo "MCP server is running at http://${MCP_HOST}:${MCP_PORT}"
}

start_static_server() {
  print_header "Static Report Server"

  local requested_port="$WEB_PORT"
  local actual_port="$requested_port"

  if port_in_use "$WEB_HOST" "$requested_port"; then
    if [ "$FRESH_RUNTIME" = "1" ]; then
      local reusable="1"
      for pid in $(list_listen_pids "$requested_port"); do
        local cmd
        cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
        if printf '%s' "$cmd" | grep -q "http.server"; then
          kill_pid_if_running "$pid"
        else
          reusable="0"
        fi
      done
      if port_in_use "$WEB_HOST" "$requested_port"; then
        reusable="0"
      fi
      if [ "$reusable" = "0" ] && port_in_use "$WEB_HOST" "$requested_port"; then
        actual_port="$(find_free_port "$WEB_HOST" "$requested_port")"
        echo "Port ${requested_port} is occupied by a different service; switching static server to port ${actual_port}."
      else
        echo "Refreshing static report server on http://${WEB_HOST}:${requested_port} so the latest dashboard files are served."
      fi
    else
      actual_port="$(find_free_port "$WEB_HOST" "$requested_port")"
      echo "Port ${requested_port} already in use; switching static server to port ${actual_port}."
    fi
  fi

  nohup python3 -m http.server "$actual_port" --bind "$WEB_HOST" >"$WEB_LOG" 2>&1 &
  WEB_PID=$!
  WEB_PORT="$actual_port"

  echo "Static server is running at http://${WEB_HOST}:${WEB_PORT}"
}

persist_runtime_state() {
  cat >"$PID_FILE" <<STATE
# Generated by run-local.sh
MCP_PID=${MCP_PID:-}
WEB_PID=${WEB_PID:-}
MCP_HOST=${MCP_HOST}
MCP_PORT=${MCP_PORT}
WEB_HOST=${WEB_HOST}
WEB_PORT=${WEB_PORT}
TARGET_REPO_PATH=${TARGET_REPO_PATH}
STATE
}

print_summary() {
  print_header "Hackathon Ready"
  echo "Workspace: $ROOT_DIR"
  echo "Target Repo: $TARGET_REPO_PATH"
  echo "ODT Status Command:"
  echo "  node packages/accessibility-ai-shield/bin/a11y-shield.js odt:status --target-repo-path \"$TARGET_REPO_PATH\""
  echo ""
  echo "ODT Workspace Dashboard:"
  echo "  http://${WEB_HOST}:${WEB_PORT}/reports/odt/fedit.html"
  echo "ODT Review Dashboard:"
  echo "  http://${WEB_HOST}:${WEB_PORT}/reports/odt/index.html"
  echo "MCP Health:"
  echo "  http://${MCP_HOST}:${MCP_PORT}/health"
  echo ""
  echo "Logs:"
  echo "  $MCP_LOG"
  echo "  $WEB_LOG"
  echo "Runtime state:"
  echo "  $PID_FILE"
}

stop_recorded_runtime
run_odt_init
run_odt_pipeline
start_mcp_server
start_static_server
persist_runtime_state
print_summary
