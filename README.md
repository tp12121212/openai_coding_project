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

## GitHub automation setup (detailed)

This app uses GitHub REST APIs to create repositories and optionally push an initial commit.

### 1) Prepare GitHub-side prerequisites

1. Decide where to create the repository:
   - Personal account repo: owner is your GitHub username.
   - Organization repo: owner is the org name, and your token must be allowed to create repos in that org.
2. If your org has restrictions (SSO required, restricted PAT usage, repo creation policy), enable PAT access for that org first.
3. For initial push (`github.pushInitialContent=true`), ensure the token can write repository contents.

### 2) Create a GitHub token on github.com

You can use either **fine-grained** or **classic** token. Fine-grained is recommended.

#### Option A: Fine-grained personal access token (recommended)

1. Open GitHub in browser.
2. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
3. Click **Generate new token**.
4. Set:
   - **Token name**: e.g., `codex-orchestration-token`
   - **Expiration**: choose per your security policy
   - **Resource owner**: the target user/org where repos will be created
   - **Repository access**:
     - If creating new repos, choose **All repositories** for that owner, or ensure policy allows creation and access to the target repo.
5. Under **Permissions**, grant at least:
   - **Administration: Read and write** (needed for repository variables API)
   - **Contents: Read and write** (needed for optional initial commit push)
   - **Metadata: Read-only** (generally required baseline)
6. Click **Generate token**, then copy it immediately.

#### Option B: Classic personal access token

1. Open **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Grant scopes:
   - `repo` (repo create + push)
   - `admin:repo_hook` is not required for this app
4. Copy token immediately.

> Do not commit tokens to source control. Use env vars, secure vaults, or one-time input.

### 3) What values to enter in this app (important)

The request uses **separate owner/repo fields**. Do **not** pass a full GitHub URL.

- `github.owner`: **only** the user/org name
  - ✅ `acme-security`
  - ❌ `https://github.com/acme-security`
- `github.repo`: **only** the repository name
  - ✅ `purview-dlp-automation`
  - ❌ `acme-security/purview-dlp-automation`
  - ❌ `https://github.com/acme-security/purview-dlp-automation`
- `github.token`: the PAT string you generated
- `github.private`: `true` or `false`
- `github.pushInitialContent`: whether to run `git init`, commit, and push scaffold files

### 4) Example API payload

```json
{
  "projectName": "Purview DLP Automation",
  "description": "SIT builder and deterministic rule-pack scaffolding",
  "localPath": "./output/purview-dlp-automation",
  "templateId": "security-compliance",
  "codexProfile": "strict",
  "promptPackId": "security-compliance-focused",
  "initializeGit": true,
  "createBranch": false,
  "createWorktree": false,
  "github": {
    "enabled": true,
    "owner": "acme-security",
    "repo": "purview-dlp-automation",
    "private": true,
    "pushInitialContent": true,
    "token": "<GITHUB_PAT>",
    "variables": [
      { "name": "AZURE_REGION", "value": "eastus" },
      { "name": "DEPLOY_ENV", "value": "dev" }
    ],
    "secretReferences": [
      { "name": "AZURE_CLIENT_SECRET", "source": "manual-only" }
    ]
  }
}
```

### 5) UI field mapping

When using the web wizard:

- **GitHub Owner (user/org)** → `github.owner`
- **GitHub Repo** → `github.repo`
- **GitHub Token** → `github.token`
- **Push initial scaffold commit** → `github.pushInitialContent`

### 6) Troubleshooting common GitHub failures

- `GitHub token is required when github.enabled=true`
  - Provide `github.token` when GitHub automation is enabled.
- `GitHub API ... failed (403)`
  - Token lacks permission, org blocks PAT, or SSO authorization missing.
- `GitHub API ... failed (404)` when setting variables
  - Repository creation failed, wrong owner/repo values, or token has no admin rights.
- Push fails during initial commit
  - Token missing `Contents: Read and write`, or branch protections block push.

## Determinism guarantees

- Stable JSON serialization and sorted keys
- Deterministic file ordering
- Explicit schema versions for manifest and bundle
- Normalized whitespace in generated markdown/toml
- No hidden non-deterministic generation state in scaffold outputs
