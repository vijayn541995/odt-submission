# CS4I AI Lab Hybrid Setup

This repo is now wired to use the CS4I AI Lab compartment for Oracle Developer Twin stage prompt generation.

## Why this path

- The `CS4I-CROSS-LAB-AI` compartment already allows Generative AI usage.
- No compute instance is required for local ODT prompt generation.
- Hybrid mode is already built into ODT:
  - OCI prompt generation is attempted first.
  - If OCI fails or is unavailable, ODT falls back to template prompts automatically.

## Verified working compartment

- Compartment name: `CS4I-CROSS-LAB-AI`
- Compartment OCID: `ocid1.compartment.oc1..aaaaaaaa4nedctdt7xy3tbik4p6uv4yodznguqqu3sygnoskwnayd23zx6ma`
- Recommended region: `us-ashburn-1`
- Verified model: `openai.gpt-4o-mini`

## One-time local setup

1. Add a dedicated OCI profile in `~/.oci/config`:

```ini
[CS4I_AI_LAB]
user=...
fingerprint=...
tenancy=...
region=us-ashburn-1
key_file=/Users/<you>/.oci/<your-private-key>.pem
```

2. Copy the local helper:

```bash
cp scripts/odt-oci-local.example.sh scripts/odt-oci-local.sh
```

3. Source the helper:

```bash
source scripts/odt-oci-local.sh
```

## Recommended run command

```bash
npm run odt:run:oci-hybrid
```

This command:

- loads your project-local OCI settings
- runs ODT with OCI prompt generation enabled
- keeps template fallback in place
- prints a short provider summary at the end

## Manual sanity checks

List chat models:

```bash
/opt/homebrew/bin/oci generative-ai model-collection list-models \
  --compartment-id "$OCI_COMPARTMENT_OCID" \
  --region "$OCI_REGION" \
  --all \
  --capability CHAT \
  --output table
```

Quick inference test:

```bash
/opt/homebrew/bin/oci generative-ai-inference chat-result chat-on-demand-serving-mode \
  --compartment-id "$OCI_COMPARTMENT_OCID" \
  --region "$OCI_REGION" \
  --serving-mode-model-id "$OCI_GENAI_MODEL_ID" \
  --chat-request '{"apiFormat":"GENERIC","messages":[{"role":"USER","content":[{"type":"TEXT","text":"Reply with only OK."}]}],"maxTokens":16,"temperature":0}'
```

## Verification artifacts

- `reports/odt/prompts/provider-status.json`
- `reports/odt/prompts/provider-audit.jsonl`

Expected success shape:

- `provider: "oci"`
- `summary.fallback: 0`
- all 7 stages generated
