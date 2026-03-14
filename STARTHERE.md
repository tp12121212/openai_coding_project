# STARTHERE

Practical operator guide for the **Codex Project Orchestration Manager**.

This app produces deterministic project scaffolds and delivers them in one of three ways:
1. download a ZIP,
2. create a new GitHub repository,
3. update an existing GitHub repository through a safe pull request flow.

Use this file as the default runbook before editing anything else.

## Recommended default workflow

1. Start with **ZIP mode** to validate prompts and template output locally.
2. Move to **Create new GitHub repo** when the scaffold is stable.
3. Use **Existing repo PR mode** only when you need to add scaffold outputs to an active repository without direct branch writes.
4. Keep OpenAI API integration as a **future enhancement** (review in `docs/openai-api-feasibility.md`).

## Suggested execution order

1. Read product intent and current boundaries (`README.md`, `STARTHERE.md`).
2. Confirm runtime configuration for GitHub auth (`.env.example`, `/api/runtime-config-check` behavior).
3. Configure project inputs in the wizard (`src/components/project-wizard.tsx`).
4. Run one deterministic generation cycle (`POST /api/projects` via UI).
5. Validate output mode behavior (ZIP download, new repo, or PR status payload).
6. Run quality checks before commit (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`).

## Step-by-step operator workflow

1. **Objective:** Understand what this app does and what not to expect.
   - **Review/edit files:** `README.md`, `docs/openai-api-feasibility.md`
   - **Use:** ChatGPT web (quick clarifications) or ChatGPT Project (longer product notes)
   - **Store result:** Committed docs in repo
   - **Example prompt pattern:**
     - "Summarize current delivery-mode constraints and non-destructive guarantees from README as operator bullets."

2. **Objective:** Pick the target template/profile and define deterministic input values.
   - **Review/edit files:** `src/components/project-wizard.tsx`, `templates/README.md`, `PROMPTS/*`
   - **Use:** ChatGPT Project for deterministic wording; Codex for concrete code/doc edits
   - **Store result:** Committed input defaults and guidance docs
   - **Example prompt pattern:**
     - "Given existing wizard schema, propose deterministic default values for a security-compliance scaffold."

3. **Objective:** Choose delivery mode safely.
   - **Review/edit files:** `src/components/project-wizard.tsx`, `src/app/api/projects/route.ts`, `README.md`
   - **Use:** ChatGPT web for decision support; Codex CLI for implementation updates
   - **Store result:** Committed code/docs and run logs in PR discussion
   - **Example prompt pattern:**
     - "Map this use case to zip vs github-new-repo vs github-existing-repo with risk notes."

4. **Objective:** Run orchestration and verify deterministic output.
   - **Review/edit files:** output artifacts from `/api/jobs/:jobId/download` and API result payload
   - **Use:** Codex or Codex CLI for validation commands and regression checks
   - **Store result:**
     - ZIP output: local working folder
     - Repo/PR output: GitHub repository and PR
   - **Example prompt pattern:**
     - "Execute lint/typecheck/test/build and summarize failures with minimal remediation patches."

5. **Objective:** Document operational intent and known boundaries.
   - **Review/edit files:** `README.md`, `STARTHERE.md`, `docs/*`
   - **Use:** ChatGPT Project for drafting; Codex for precise edits
   - **Store result:** committed markdown files
   - **Example prompt pattern:**
     - "Rewrite this section to be concise, deterministic, and aligned with current behavior only."

6. **Objective:** Plan future OpenAI API usage without implementation drift.
   - **Review/edit files:** `docs/openai-api-feasibility.md`
   - **Use:** ChatGPT Project for architecture options; Codex CLI for final deterministic doc edits
   - **Store result:** committed feasibility review
   - **Example prompt pattern:**
     - "Compare no-API vs single-shot vs multi-step structured generation with cost and risk tradeoffs."

## OpenAI surface selection guide

- **ChatGPT web**
  - Best for fast brainstorming, copy refinement, and decision framing.
  - Keep outputs transient unless promoted into repo docs.

- **ChatGPT Project**
  - Best for persistent project context, stable prompt packs, and reusable operating notes.
  - Store long-lived planning artifacts and decision logs in project knowledge.

- **Codex**
  - Best for direct repository changes, tests, and safe refactors.
  - Use when you need deterministic file edits and commit-ready patches.

- **Codex CLI**
  - Best for terminal-first execution (lint/typecheck/test/build), scripted updates, and reproducible workflows.
  - Use for CI-like validation loops.

- **OpenAI API integration (future/optional)**
  - Best for server-side structured generation when you need richer automated outputs from form inputs.
  - Keep as optional future phase; API usage is generally paid and must be budgeted.

## Where each artifact belongs

- **Commit in repo (source of truth):**
  - `src/**`, `tests/**`, `templates/**`, `README.md`, `STARTHERE.md`, `docs/**`
  - Deterministic flow diagrams (`public/images/*.svg`)

- **Store in ChatGPT Project knowledge (context memory):**
  - Longer planning memos
  - exploratory prompt experiments
  - non-final draft notes

- **Store in both repo and ChatGPT Project when high value:**
  - Operator runbooks
  - architecture decisions that affect future implementation
  - validated prompt patterns with stable outcomes

## Minimal safe operating rules

1. Never push directly to a default branch for existing-repo updates.
2. Keep existing-repo mode PR-only and non-destructive.
3. Never commit secrets, tokens, tenant IDs, or local machine paths.
4. Keep generated outputs deterministic (stable ordering, no hidden timestamps).
5. Run full validation before merge.
6. Document behavior accurately; do not claim unimplemented features.

## Do not do this

- Do not add new delivery modes without updating schema, UI, API, tests, and docs together.
- Do not enable destructive overwrite behavior for existing repositories.
- Do not claim OpenAI API generation is implemented when it is only proposed.
- Do not store sensitive credentials in committed files.
- Do not skip validation checks before creating a PR.
