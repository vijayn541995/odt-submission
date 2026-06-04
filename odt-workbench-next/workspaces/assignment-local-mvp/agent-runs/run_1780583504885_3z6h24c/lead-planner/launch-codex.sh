#!/bin/bash
set -u
cd '/Users/vn105957/Desktop/lpdev/journey-builder-js'
PROMPT_FILE='/Users/vn105957/Desktop/odt-submission/odt-workbench-next/workspaces/assignment-local-mvp/agent-runs/run_1780583504885_3z6h24c/lead-planner/prompt.md'
RESPONSE_FILE='/Users/vn105957/Desktop/odt-submission/odt-workbench-next/workspaces/assignment-local-mvp/agent-runs/run_1780583504885_3z6h24c/lead-planner/codex-response.md'
LOG_FILE='/Users/vn105957/Desktop/odt-submission/odt-workbench-next/workspaces/assignment-local-mvp/agent-runs/run_1780583504885_3z6h24c/lead-planner/codex-launch.log'
SANDBOX_MODE='read-only'
mkdir -p "$(dirname "$RESPONSE_FILE")"
mkdir -p "$(dirname "$LOG_FILE")"
: > "$LOG_FILE"
echo "[odt] Delegating Lead Planner to Codex (visible terminal session)." | tee -a "$LOG_FILE"
echo "[odt] Target repo: $PWD" | tee -a "$LOG_FILE"
echo "[odt] Sandbox: $SANDBOX_MODE" | tee -a "$LOG_FILE"
echo "[odt] Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"
echo "[odt] Response: $RESPONSE_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  . "$NVM_DIR/nvm.sh"
fi
echo "[odt] Node: $(command -v node 2>/dev/null || true) $(node -v 2>/dev/null || true)" | tee -a "$LOG_FILE"
echo "[odt] codex: $(command -v codex 2>/dev/null || true)" | tee -a "$LOG_FILE"
if ! command -v codex >/dev/null 2>&1; then
  echo "[odt] Codex CLI was not found in this terminal environment. Run the manual command from ODT after installing/configuring Codex." | tee -a "$LOG_FILE"
  exit 127
fi
set +e
codex exec -C "$PWD" -s "$SANDBOX_MODE" -o "$RESPONSE_FILE" - < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}
set -e
echo "" | tee -a "$LOG_FILE"
echo "[odt] Agent task finished with exit code $EXIT_CODE" | tee -a "$LOG_FILE"
echo "[odt] Review changed files, tests, and diffs before recording implementation evidence in ODT." | tee -a "$LOG_FILE"
echo ""
echo "ODT Codex worker finished. Return to ODT Workbench to review evidence."
echo "Response file: $RESPONSE_FILE"
echo "Log file: $LOG_FILE"
exit $EXIT_CODE
