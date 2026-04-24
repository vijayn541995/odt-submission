#!/usr/bin/env bash

# Source this file from your shell for this repo only:
#   source scripts/odt-oci-local.sh
#
# Safe setup pattern:
# 1. Copy this file to scripts/odt-oci-local.sh
# 2. Adjust model/profile values only if needed
# 3. Source it only when working on ODT/OCI locally
#
# Recommended hackathon path:
# - Use the CS4I AI Lab compartment
# - Let ODT run in hybrid mode: OCI first, template fallback if OCI is unavailable

export OCI_CLI_PROFILE="CS4I_AI_LAB"
export OCI_CLI_PATH="/opt/homebrew/bin/oci"

# Keep region project-scoped so you do not have to change ~/.oci/config defaults.
export OCI_REGION="us-ashburn-1"

# ODT prompt provider wiring
export ODT_PROMPT_PROVIDER="oci"
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1..aaaaaaaa4nedctdt7xy3tbik4p6uv4yodznguqqu3sygnoskwnayd23zx6ma"

# On-demand model mode
export OCI_GENAI_MODEL_ID="openai.gpt-4o-mini"

# Dedicated endpoint mode (only if your tenancy has a hosted endpoint)
# export OCI_GENAI_SERVING_TYPE="DEDICATED"
# export OCI_GENAI_ENDPOINT_ID="ocid1.generativeaiendpoint.oc1..replace_me"

# Prompt tuning defaults
export ODT_OCI_TIMEOUT_MS="120000"
export ODT_OCI_MAX_TOKENS="1200"
export ODT_OCI_TEMPERATURE="0.2"
export ODT_OCI_TOP_P="0.8"
export SUPPRESS_LABEL_WARNING="True"

echo "ODT OCI local environment loaded."
echo "OCI_CLI_PROFILE=$OCI_CLI_PROFILE"
echo "OCI_REGION=$OCI_REGION"
echo "ODT_PROMPT_PROVIDER=$ODT_PROMPT_PROVIDER"
echo "OCI_COMPARTMENT_OCID=${OCI_COMPARTMENT_OCID:0:24}..."
echo "OCI_GENAI_MODEL_ID=$OCI_GENAI_MODEL_ID"
