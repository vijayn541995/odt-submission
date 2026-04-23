# OCI GenAI Quick Wiring for 7-Stage ODT Prompts

This guide configures Oracle Developer Twin (ODT) to generate stage prompts with OCI GenAI while keeping safe fallback behavior.

## Safety-First Behavior (Already Wired)

- `template` remains the default provider.
- `oci` provider is optional.
- If OCI call fails or config is incomplete, ODT falls back to template prompts automatically.
- Per-stage prompt artifacts are always written for all 7 stages.

## 1) Upload API Public Key to OCI User

1. In OCI Console, open your user profile.
2. Go to `API Keys` under user resources.
3. Click `Add API Key`.
4. Upload your generated public key (`*.pem`) and save.
5. Copy the generated fingerprint.

## 2) Create `~/.oci/config`

Create file: `~/.oci/config`

```ini
[DEFAULT]
user=ocid1.user.oc1..your_user_ocid
tenancy=ocid1.tenancy.oc1..your_tenancy_ocid
fingerprint=aa:bb:cc:dd:ee:ff:...
region=ap-mumbai-1
key_file=/Users/<you>/.oci/oci_api_key.pem
```

Optional profile:

```ini
[HACKATHON]
user=ocid1.user.oc1..your_user_ocid
tenancy=ocid1.tenancy.oc1..your_tenancy_ocid
fingerprint=aa:bb:cc:dd:ee:ff:...
region=ap-mumbai-1
key_file=/Users/<you>/.oci/oci_api_key.pem
```

## 3) Install and Validate OCI CLI

```bash
oci --version
oci iam region-subscription list --tenancy-id "<YOUR_TENANCY_OCID>"
```

If profile is not `DEFAULT`, set:

```bash
export OCI_CLI_PROFILE=HACKATHON
```

## 4) Set ODT + OCI Environment Variables

Use on-demand model mode first (fastest to demo):

```bash
export ODT_PROMPT_PROVIDER=oci
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1..your_compartment_ocid"
export OCI_GENAI_MODEL_ID="cohere.command-a-03-2025"
export OCI_REGION="ap-mumbai-1"
export ODT_OCI_TIMEOUT_MS=120000
export ODT_OCI_MAX_TOKENS=1200
export ODT_OCI_TEMPERATURE=0.2
```

Optional:

```bash
export OCI_CLI_PROFILE=HACKATHON
export OCI_GENAI_ENDPOINT="https://inference.generativeai.<region>.oci.oraclecloud.com"
```

Dedicated endpoint mode:

```bash
export ODT_PROMPT_PROVIDER=oci
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1..your_compartment_ocid"
export OCI_GENAI_SERVING_TYPE=DEDICATED
export OCI_GENAI_ENDPOINT_ID="ocid1.generativeaiendpoint.oc1..your_endpoint_ocid"
```

## 5) Run ODT with OCI Prompt Provider

```bash
npm run odt:run -- --prompt-provider oci --oci-compartment-id "$OCI_COMPARTMENT_OCID" --oci-model-id "$OCI_GENAI_MODEL_ID"
```

## 6) Verify Per-Stage Prompt Outputs and Audit

Generated per-stage requests and outputs:

- `reports/odt/prompts/generated/01-intake.request.md`
- `reports/odt/prompts/generated/01-intake.generated.md`
- `reports/odt/prompts/generated/...` (all 7 stages)

Audit and provider status:

- `reports/odt/prompts/provider-audit.jsonl`
- `reports/odt/prompts/provider-status.json`

Each audit line includes:

- `stage`
- `provider`
- `model`
- `latencyMs`
- `fallback` and `error` (if OCI fallback happened)

## 7) Model Recommendations for Hackathon

Start with:

- `cohere.command-a-03-2025` for high-quality stage-prompt generation.

Also valid depending region and access:

- Cohere Command R / R+
- Meta Llama family
- Google Gemini family

Use the model OCID/name supported in your region and endpoint mode.

## 8) Fast Troubleshooting

`oci: not found`
- Install OCI CLI and restart terminal.

`Missing OCI config: ...`
- Set missing env vars or pass flags in `odt:run`.

`No generated text in OCI response`
- Keep `template` fallback active (default), and switch to another supported model id.

High latency/timeouts
- Increase `ODT_OCI_TIMEOUT_MS`.
- Keep `ODT_OCI_TEMPERATURE=0.2`.

