#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$SubscriptionId = '6fd92ebe-3092-45b6-83dd-20aeb921b9d0'

function Write-Log {
    param([string]$Message)
    Write-Host "[azure-bootstrap] $Message"
}

function Fail {
    param([string]$Message)
    throw "[azure-bootstrap] ERROR: $Message"
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Fail 'Azure CLI (az) is not installed. Install from https://learn.microsoft.com/cli/azure/install-azure-cli'
}

$hasSession = $true
try {
    az account show | Out-Null
}
catch {
    $hasSession = $false
}

if ($hasSession) {
    Write-Log 'Azure CLI session detected; skipping interactive login.'
}
else {
    Write-Log 'No active Azure CLI session detected. Starting device-code login...'
    az login --use-device-code | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Fail 'Azure login failed.'
    }
}

Write-Log "Selecting subscription $SubscriptionId..."
az account set --subscription $SubscriptionId
if ($LASTEXITCODE -ne 0) {
    Fail "Failed to select subscription $SubscriptionId."
}

Write-Log 'Current Azure account context:'
az account show -o table
if ($LASTEXITCODE -ne 0) {
    Fail 'Unable to show Azure account context.'
}

Write-Log 'Azure bootstrap completed successfully.'
