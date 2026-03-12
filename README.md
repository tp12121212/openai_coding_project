## Codex Project Scaffold Manager

Production-ready Next.js + TypeScript application for deterministic scaffolding of ChatGPT/Codex coding projects. It generates project artifacts, Codex config, prompt packs, and a canonical `project.scaffold.json` manifest.

## Features

- Create new AI coding projects from a dashboard wizard
- Deterministic scaffold generation (sorted keys, stable artifact order, normalized whitespace)
- Built-in templates:
  - Full stack SaaS
  - Next.js web app
  - Node API
  - Python CLI
  - Research/docs
  - Security/compliance coding project
- Generates:
  - `README.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`
  - `TASKS/`
  - `PROMPTS/` (7 prompt files)
  - `.codex/config.toml`, `.codex/instructions.md`
  - `project.scaffold.json`
- Optional repo initialization metadata (git/branch/worktree intent captured in manifest)
- Export/import manifest support
- Validation: path safety, zod schema checks, deterministic serialization checks

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build, lint, tests

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Environment variables

Copy `.env.example` to `.env`.

- `OUTPUT_ROOT`: root directory where generated projects are written (default: `./output`)
- `ENABLE_UNSUPPORTED_AUTOMATION`: must remain `false` for safe defaults

## CI pipeline

Workflow: `.github/workflows/ci.yml`

Runs on push/PR:
1. Install dependencies (`npm ci`)
2. Lint
3. Typecheck
4. Tests
5. Build

## Azure deployment

Workflow: `.github/workflows/azure-deploy.yml` (trigger: push to `main` and manual dispatch).

### Authentication paths (explicit)

#### Local/Codex authentication (interactive Azure CLI)

Use bootstrap scripts locally. These are idempotent and only prompt when no active Azure CLI session exists.

```bash
./scripts/azure-bootstrap.sh
```

```powershell
pwsh ./scripts/azure-bootstrap.ps1
```

Both scripts use this sequence when unauthenticated:

```bash
az login --use-device-code
az account set --subscription 6fd92ebe-3092-45b6-83dd-20aeb921b9d0
az account show -o table
```

#### GitHub Actions authentication (non-interactive OIDC)

GitHub-hosted runners use `azure/login@v2` with federated OIDC credentials.

> `az login --use-device-code` is intentionally not used in workflows.

### Deployment target and fallback

1. **Primary:** Azure Container Apps (Consumption) with ACR Basic for image storage.
2. **Fallback:** Azure App Service (Linux B1) if the Container Apps deployment step fails.

The workflow automatically creates missing resources before deployment.

### Required GitHub secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_WEBAPP_NAME` (used by the App Service fallback path)

### Optional GitHub repository variables

If omitted, workflow defaults are used.

- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_CONTAINER_REGISTRY`
- `AZURE_CONTAINERAPPS_ENV`
- `AZURE_CONTAINER_APP_NAME`
- `AZURE_APP_SERVICE_PLAN`

## Determinism guarantees

- Stable JSON serialization and sorted keys
- Deterministic file ordering and checksums
- No runtime timestamps in generated artifacts
- Explicit `schemaVersion` in `project.scaffold.json`

## Unsupported features

Programmatic creation of internal ChatGPT projects/chats is unsupported and disabled by default.
