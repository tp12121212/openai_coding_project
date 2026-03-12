# Codex Project Scaffold Manager

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

## Azure deployment (Linux App Service, Basic B1)

Workflow: `.github/workflows/deploy-azure.yml` (trigger: push to `main`)

### Required Azure resources

- Resource group
- App Service plan (`B1` Linux)
- App Service web app

### Authentication options

Preferred: GitHub OIDC + federated identity with service principal.
Fallback: publish profile secret.

### Required GitHub secrets

OIDC route:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_WEBAPP_NAME`

Publish profile route:
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `AZURE_WEBAPP_NAME`

### Deployment notes

- Free tier is intentionally not used for production.
- B1 provides low-cost production-capable hosting.
- Configure app settings: `NODE_ENV=production`, `OUTPUT_ROOT=/home/site/wwwroot/output`.

## Determinism guarantees

- Stable JSON serialization and sorted keys
- Deterministic file ordering and checksums
- No runtime timestamps in generated artifacts
- Explicit `schemaVersion` in `project.scaffold.json`

## Unsupported features

Programmatic creation of internal ChatGPT projects/chats is unsupported and disabled by default.
