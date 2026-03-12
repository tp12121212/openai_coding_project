## Codex Project Orchestration Manager

Production-oriented Next.js + TypeScript orchestration app for deterministic project bootstrap with explicit support boundaries.

## Product scope

### Supported automation (public APIs)

1. Phase 1: deterministic scaffold generation
2. Phase 2: GitHub repository creation (optional) and optional initial commit push
3. Phase 2: GitHub repository variable configuration (supported)
4. Phase 3: bootstrap export pack generation for ChatGPT/Codex manual finalization
5. Job/result tracking in API + UI with persisted job records

### Unsupported/internal-only (disabled by default)

- Direct creation of internal ChatGPT projects/workspaces/chats
- Direct seeding of prompts/tasks into ChatGPT internal project state

These are represented as explicit `manual_required`/`disabled` steps in orchestration results. No fake success states.

## Key outputs

- Deterministic scaffold files (`README.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`)
- Prompt pack and task files
- `project.scaffold.json` (`schemaVersion: 2.0.0`)
- `BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md`
- `BOOTSTRAP/MANUAL_FINALIZATION.md`
- `scaffold.bundle.json` export artifact
- Persisted orchestration job record under `.orchestration/jobs/<job-id>.json`

## API overview

- `POST /api/projects` → runs orchestration workflow and returns job + result payload
- `GET /api/jobs/:jobId` → fetch in-memory job status
- `POST /api/manifests/export` → deterministic manifest export
- `POST /api/manifests/import` → manifest import validation

## Environment variables

- `OUTPUT_ROOT`: root directory where generated projects and job records are written (default: `./output`)
- `ENABLE_UNSUPPORTED_AUTOMATION`: keep `false` for production-safe behavior (default expected)

## GitHub automation requirements

Provide in request payload when enabling GitHub:

- `github.enabled = true`
- `github.owner`
- `github.repo`
- `github.token`
- `github.pushInitialContent` (optional)
- `github.variables` (optional)

Secrets are intentionally `manual-only` in-app; variable automation is implemented.

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Determinism guarantees

- Stable JSON serialization and sorted keys
- Deterministic file ordering
- Explicit schema versions for manifest and bundle
- Normalized whitespace in generated markdown/toml
- No hidden non-deterministic generation state in scaffold outputs
