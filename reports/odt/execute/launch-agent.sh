#!/bin/bash
set -u
cd '/Users/vn105957/Desktop/lpDev/journey-builder-js/'
PROMPT_FILE='/Users/vn105957/Desktop/odt-submission/reports/odt/execute/prompt.md'
RESPONSE_FILE='/Users/vn105957/Desktop/odt-submission/reports/odt/execute/agent-response.md'
LOG_FILE='/Users/vn105957/Desktop/odt-submission/reports/odt/execute/agent-launch.log'
mkdir -p "$(dirname "$RESPONSE_FILE")"
mkdir -p "$(dirname "$LOG_FILE")"
: > "$LOG_FILE"
echo "[odt] Delegating implementation to Codex (visible terminal session)." | tee -a "$LOG_FILE"
echo "[odt] Workspace: $PWD" | tee -a "$LOG_FILE"
echo "[odt] Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"
echo "[odt] Response: $RESPONSE_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  . "$NVM_DIR/nvm.sh"
fi
set +e
codex exec -C "$PWD" -s workspace-write -o "$RESPONSE_FILE" - < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}
set -e
echo "" | tee -a "$LOG_FILE"
echo "[odt] Agent task finished with exit code $EXIT_CODE" | tee -a "$LOG_FILE"
echo "[odt] Review changed files and diffs directly in your workspace / Git tools." | tee -a "$LOG_FILE"
echo ""
echo "ODT delegation finished. You can return to ODT Workspace to review status."
echo "Response file: $RESPONSE_FILE"
echo "Log file: $LOG_FILE"
exit $EXIT_CODE
