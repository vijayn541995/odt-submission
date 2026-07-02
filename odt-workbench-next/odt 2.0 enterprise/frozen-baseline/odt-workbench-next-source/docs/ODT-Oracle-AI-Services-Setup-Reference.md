# ODT Oracle AI Services Setup Reference

Source: user-provided Oracle AI setup notes captured on 2026-06-05.

This document is intentionally kept separate from the main roadmap. It preserves concrete setup details for using OCI AI, OCI GenAI, and related Oracle services in ODT 2.0.

## Key Position

OCI Generative AI is the core LLM/agent reasoning service for ODT, but it should be treated as trial-credit, paid, or internal-tenancy quota usage. It is not the same as an unlimited free model API.

Several OCI AI services can still be useful with free-tier allowances or limited trial usage:

- OCI Document Understanding for documents, OCR, forms, and tables.
- OCI Vision for screenshots, UI images, diagrams, image analysis, and OCR-like enrichment.
- OCI Speech for voice intake, meeting notes, and transcription.
- OCI Language, Data Labeling, and AI Database ML may also have free-tier positioning, but they are not first-priority for ODT.

ODT should enforce its differentiator regardless of model/provider:

- no write delegation without approval
- no unapproved dependency install
- no frontend secrets
- no destructive actions
- no external writes without approval
- every override becomes audit evidence
- every worker run gets captured
- every PR Ready package links to standards, tests, risks, approvals, and rollback notes

## Best ODT Service Choices

```text
ODT Orchestrator:
  OCI GenAI Responses API

Context/RAG:
  OCI GenAI Files API
  OCI GenAI Vector Stores API
  embeddings + rerank

Intake:
  OCI Document Understanding for PDFs/docs/tables/OCR
  OCI Vision for screenshots/images/diagrams
  OCI Speech for audio-to-text

Governance:
  OCI IAM policies
  GenAI guardrails
  ODT standards config: server/standards/odt-standards.json

Execution evidence:
  Object Storage
  Database table / JSON run log
  optional memory-service for internal Codex/MCP workflows
```

## Recommended Region

For India-based development, start with:

```text
ap-hyderabad-1
```

The OCI GenAI API key must be created in the same region as the model. Public Oracle docs currently list these OpenAI SDK/API-key supported regions:

```text
eu-frankfurt-1
ap-hyderabad-1
ap-osaka-1
us-ashburn-1
us-chicago-1
us-phoenix-1
```

Always confirm model availability in the chosen region before configuring a model name.

## Compartment

Create a development compartment separate from production:

```text
Compartment: odt-dev
```

Keep Files, Vector Stores, Object Storage, and worker evidence in this dev compartment until enterprise controls are ready.

## Sandbox IAM Policy

For development sandbox only:

```text
allow group ODTDevelopers to manage generative-ai-family in compartment odt-dev
allow group ODTDevelopers to manage object-family in compartment odt-dev
allow group ODTDevelopers to use ai-service-family in compartment odt-dev
```

For production, narrow to the specific resource types and actions ODT needs, such as chat, embeddings, rerank, files, vector stores, containers, and Object Storage evidence buckets.

## OCI GenAI API Key

OCI GenAI API keys are service-specific bearer tokens. They are different from normal OCI IAM API keys.

Console path:

```text
Generative AI
  -> API Keys
  -> Create API Key
  -> choose region
  -> set expiration
  -> copy secret immediately
```

Secrets must stay backend-side and should be stored in an approved secrets manager or launch environment. They must never be committed or exposed in the frontend.

Environment variables accepted by ODT:

```bash
export GENAI_PROVIDER=oci
export OCI_GENAI_REGION="ap-hyderabad-1"
export OCI_GENAI_API_KEY="sk-..."
export OCI_GENAI_BASE_URL="https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com/openai/v1"
export OCI_COMPARTMENT_OCID="<compartment-ocid>"
export GENAI_MODEL="openai.gpt-oss-120b"
export OCI_GENAI_OPENAI_COMPATIBLE=true
```

ODT also accepts these aliases:

```bash
export OCI_GENAI_OPENAI_BASE_URL="https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com/openai/v1"
export OCI_GENAI_BEARER_TOKEN="sk-..."
```

## Model Adapter Shape

Keep provider/model configuration outside frontend code:

```json
{
  "provider": "oci-genai",
  "region": "ap-hyderabad-1",
  "baseUrl": "https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com/openai/v1",
  "defaultModels": {
    "planner": "openai.gpt-oss-120b",
    "standards": "openai.gpt-oss-120b",
    "reviewer": "openai.gpt-oss-120b",
    "summarizer": "cohere.command-a",
    "embedding": "cohere.embed-v4.0",
    "rerank": "cohere.rerank-v4.0"
  },
  "features": {
    "responsesApi": true,
    "filesApi": true,
    "vectorStores": true,
    "mcpCalling": true,
    "codeInterpreter": false
  }
}
```

Only use model names after confirming model availability in the selected region.

## Responses API Direction

Base endpoint:

```text
https://inference.generativeai.${region}.oci.oraclecloud.com/openai/v1
```

Relevant paths:

```text
/responses
/conversations
/chat/completions
/files
/vector_stores/{id}/files
/vector_stores/{id}/file_batches
/vector_stores/{id}/search
/containers
/containers/{id}/files
```

ODT Stage A uses Chat Completions for Guide/provider foundation. Future managed agentic stages should use Responses API for tools, conversation state, files, vector stores, and containers.

## Files And Vector Stores

Use Files and Vector Stores for durable retrieval over:

```text
requirements
Jira text exports
design docs
standards markdown
repo summaries
dependency decisions
worker logs
PR evidence
```

Suggested flow:

```text
Upload file
  -> attach to vector store
  -> search vector store
  -> feed selected evidence into Responses API
  -> store retrieved source ids with ODT evidence
```

Suggested standards vector store:

```text
vector_store: odt-standards-dev
```

## Document Understanding Pipeline

Use for:

```text
PDF
scanned document
forms
tables
document OCR
document key-value extraction
```

Suggested ODT setup:

```text
Object Storage bucket: odt-intake-raw
Object Storage bucket: odt-intake-extracted
Service: Document Understanding
Output: normalized text + tables + source page references
```

Suggested ODT pipeline:

```text
Upload PDF
  -> Object Storage
  -> Document Understanding OCR/extraction
  -> store extracted JSON
  -> summarize with OCI GenAI
  -> attach source evidence to ODT Intake run
```

## Vision Pipeline

Use for:

```text
screenshots
UI images
architecture diagrams
image OCR
object/scene analysis
```

Suggested ODT setup:

```text
Object Storage bucket: odt-image-assets
Service: OCI Vision
Output: extracted text / labels / detected regions
```

## Speech Pipeline

Use for:

```text
voice notes
meeting recordings
review calls
requirement walkthroughs
```

Suggested ODT setup:

```text
Object Storage bucket: odt-audio-raw
Object Storage bucket: odt-audio-transcripts
Service: OCI Speech
Output: JSON + SRT transcript
```

Design around these Speech limits from the provided notes:

```text
max file size: 2 GB
max file duration: 4 hours
max tasks per job: 100
jobs retained: 90 days
```

## Suggested ODT Config Files

Future production ODT should add:

```text
server/config/oci-genai.json
server/config/oci-ai-services.json
server/standards/odt-standards.json
server/standards/*.md
server/policies/model-adapters.json
server/policies/worker-lanes.json
server/policies/pr-readiness.json
```

Example:

```json
{
  "odt": {
    "traceability": {
      "requireApprovalBeforeWrite": true,
      "recordStandardsResults": true,
      "recordDependencyDecisions": true,
      "recordWorkerLogs": true,
      "recordOverrides": true
    },
    "oci": {
      "region": "ap-hyderabad-1",
      "genaiBaseUrl": "https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com/openai/v1",
      "objectStorage": {
        "rawBucket": "odt-raw-assets",
        "evidenceBucket": "odt-run-evidence"
      },
      "vectorStores": {
        "standards": "odt-standards-dev",
        "projectContext": "odt-project-context-dev",
        "runEvidence": "odt-run-evidence-dev"
      }
    }
  }
}
```

## Practical MVP Recommendation

Use free-tier services where possible:

```text
Document Understanding -> intake PDFs/docs
Vision -> screenshots/images
Speech -> voice intake
```

Use OCI GenAI carefully under trial credits/internal quota:

```text
Responses API -> Planner, Standards, Review, PR Ready
Files + Vector Stores -> standards and evidence RAG
Embeddings/Rerank -> context retrieval
```

## Reference Links

- Oracle AI overview/free-tier page: https://www.oracle.com/artificial-intelligence/
- OCI Generative AI overview: https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- OCI GenAI API keys: https://docs.oracle.com/en-us/iaas/Content/generative-ai/api-keys.htm
- OCI GenAI IAM policies: https://docs.oracle.com/en-us/iaas/Content/generative-ai/iam-policies.htm
- OCI pretrained models: https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm
- OCI OpenAI-compatible endpoints: https://docs.oracle.com/en-us/iaas/Content/generative-ai/openai-compatible-api.htm
- OCI Vision overview: https://docs.oracle.com/en-us/iaas/Content/vision/using/overview.htm
- OCI Speech overview: https://docs.oracle.com/iaas/Content/speech/using/speech.htm
- Oracle Cloud price list: https://www.oracle.com/cloud/price-list/
