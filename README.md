### Codex Project Orchestration Manager

Deterministic scaffold generator with GitHub-aware delivery workflows.

## Delivery modes

1. **Download zipped bundle**
   - No GitHub login required.
   - Generates deterministic scaffold files and returns a `.zip` download artifact.

2. **Create new GitHub repo**
   - Requires GitHub OAuth login.
   - Creates repository (public/private), commits scaffold directly to default branch (`main` or repo default), and returns repo URL.

3. **Update existing GitHub repo (safe PR flow)**
   - Requires GitHub OAuth login.
   - Lists accessible repositories.
   - Creates deterministic update branch, adds only non-colliding files, opens PR for manual approval/merge.

## Guardrails and non-destructive behavior

- Existing-repo mode never pushes directly to default branch.
- File collisions are detected deterministically and skipped.
- Structured status includes branch name, PR URL, files added, files skipped, collisions.
- Hygiene checks exclude dangerous paths (e.g., `.env`, `*.pem`, `id_rsa`) and oversized artifacts.
- Baseline files are scaffolded: `.gitignore`, `.editorconfig`, `LICENSE` placeholder.

## GitHub authentication

Authentication is powered by NextAuth GitHub OAuth.

Required environment variables:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (production: `https://codex.killercloud.com.au`)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `OUTPUT_ROOT` (optional, defaults to `./output`)

Tokens remain server-side in session callbacks and are never sent in client payloads.

## API overview

- `POST /api/projects` — run orchestration for selected delivery mode.
- `POST /api/scaffold/zip` — direct deterministic zip export endpoint.
- `GET /api/auth/session` — auth/session status for UI.
- `GET /api/github/repos` — authenticated repository listing with pagination/search params.
- `GET|POST /api/auth/[...nextauth]` — NextAuth handlers.

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```


## Azure hostname/SSL note

Set App Service application setting `NEXTAUTH_URL=https://codex.killercloud.com.au` and keep TLS termination at Azure (certificate already provisioned).
