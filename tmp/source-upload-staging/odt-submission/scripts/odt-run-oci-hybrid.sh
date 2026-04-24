#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER_FILE="$ROOT_DIR/scripts/odt-oci-local.sh"
STATUS_FILE="$ROOT_DIR/reports/odt/prompts/provider-status.json"

if [[ ! -f "$HELPER_FILE" ]]; then
  echo "Missing local OCI helper: $HELPER_FILE" >&2
  echo "Copy scripts/odt-oci-local.example.sh to scripts/odt-oci-local.sh first." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$HELPER_FILE"

cd "$ROOT_DIR"

node packages/accessibility-ai-shield/bin/a11y-shield.js odt:run \
  --withA11y \
  --profile react-js \
  --target-repo-path ./demo-target-repo \
  --prompt-provider oci \
  --oci-cli-path "${OCI_CLI_PATH:-oci}" \
  --oci-profile "${OCI_CLI_PROFILE:-}" \
  --oci-region "${OCI_REGION:-us-ashburn-1}" \
  --oci-compartment-id "${OCI_COMPARTMENT_OCID:-}" \
  --oci-model-id "${OCI_GENAI_MODEL_ID:-}" \
  "$@"

if [[ -f "$STATUS_FILE" ]]; then
  node - "$STATUS_FILE" <<'EOF'
const fs = require('fs');
const statusPath = process.argv[2];
const payload = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const summary = payload.summary || {};
const oci = payload.oci || {};
console.log(
  `OCI hybrid summary: generated=${summary.generated || 0}, fallback=${summary.fallback || 0}, failed=${summary.failed || 0}, model=${oci.modelId || ''}`
);
EOF
fi
