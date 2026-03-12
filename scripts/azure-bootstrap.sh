#!/usr/bin/env bash
set -euo pipefail

SUBSCRIPTION_ID="6fd92ebe-3092-45b6-83dd-20aeb921b9d0"

log() {
  echo "[azure-bootstrap] $*"
}

fail() {
  echo "[azure-bootstrap] ERROR: $*" >&2
  exit 1
}

if ! command -v az >/dev/null 2>&1; then
  fail "Azure CLI (az) is not installed. Install from https://learn.microsoft.com/cli/azure/install-azure-cli"
fi

if az account show >/dev/null 2>&1; then
  log "Azure CLI session detected; skipping interactive login."
else
  log "No active Azure CLI session detected. Starting device-code login..."
  az login --use-device-code >/dev/null || fail "Azure login failed."
fi

log "Selecting subscription ${SUBSCRIPTION_ID}..."
az account set --subscription "${SUBSCRIPTION_ID}" || fail "Failed to select subscription ${SUBSCRIPTION_ID}."

log "Current Azure account context:"
az account show -o table || fail "Unable to show Azure account context."

log "Azure bootstrap completed successfully."
