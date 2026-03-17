# STARTHERE

Primary operator runbook for customizing the prompt templates in this repository with ChatGPT/Codex in project-folder context.

## Purpose

This repository is an operator-focused scaffold manager for deterministic project setup, validation, and delivery workflows.

The `PROMPTS/` folder (the project’s prompts folder) contains starter prompt templates that are intended to be rewritten for your specific application before operational use.

Treat the prompt files as **initial templates only**. Do not use them as-is for production work. Update each file with your app’s architecture, constraints, module names, data paths, validation criteria, and release requirements.

## Recommended workflow

1. Open ChatGPT/Codex with this repository loaded in **project-folder context**.
2. Provide your app details (name, scope, users, workflows, stack, constraints, security requirements).
3. Rewrite the prompt templates in the defined order below so each file becomes app-specific.
4. Commit the updated prompt files to source control.
5. Use each updated prompt during its corresponding delivery stage (discovery, design, implementation, bugfix, validation, deep review, release readiness).
6. Revisit and refresh prompt files whenever architecture or compliance requirements change.

## Prompt customization order

1. `01-bootstrap-and-inventory.md`
2. `02-design-plan.md`
3. `03-implement-feature.md`
4. `04-fix-bug.md`
5. `05-validate-and-test.md`
6. `06-deep-codebase-review.md`
7. `07-release-readiness.md`

## Prompt file runbook

### 1) `01-bootstrap-and-inventory.md`

**What this file is for**
- Creating a deterministic startup prompt that inventories repository structure, dependencies, runtime constraints, and high-risk modules.

**When to use it**
- First, before design or implementation changes.
- Any time onboarding a new engineer/agent into the codebase.

**Expected output after updating it**
- A structured bootstrap/inventory prompt that asks for module mapping, key interfaces, critical paths, and known risks for your app.

**Copy/paste update prompt**

```text
Use the following information to rewrite PROMPTS/01-bootstrap-and-inventory.md so it becomes a detailed bootstrap and repo-inventory prompt for my app.

Requirements for the rewritten file:
- Focus on deterministic repository discovery before code changes.
- Force the responder to identify architecture boundaries, critical modules, data flows, security-sensitive surfaces, and validation commands.
- Require explicit references to concrete files/directories instead of generic statements.
- Require a final inventory table with risks and unknowns.

App details:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Target users: [INSERT TARGET USERS]
- Primary workflows: [INSERT PRIMARY WORKFLOWS]
- Core features: [INSERT CORE FEATURES]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Data sources: [INSERT DATA SOURCES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

Output format requirements:
- Keep the file practical and operator-ready.
- Include clear step-by-step instructions and expected deliverables.
- Include deterministic success criteria for completion.
```

### 2) `02-design-plan.md`

**What this file is for**
- Building an implementation plan before coding, including sequencing, acceptance criteria, and risk controls.

**When to use it**
- After inventory is complete and before writing/editing code.

**Expected output after updating it**
- A design-planning prompt that produces a deterministic change plan with module-level tasks, test strategy, and rollback considerations.

**Copy/paste update prompt**

```text
Rewrite PROMPTS/02-design-plan.md to be an app-specific deterministic design-planning prompt.

Use these app inputs:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Target users: [INSERT TARGET USERS]
- Primary workflows: [INSERT PRIMARY WORKFLOWS]
- Core features: [INSERT CORE FEATURES]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Data sources: [INSERT DATA SOURCES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Test strategy: [INSERT TEST STRATEGY]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

The rewritten prompt must instruct Codex to:
- Produce a numbered plan before code edits.
- Map each planned change to specific modules/files.
- Define deterministic acceptance criteria and explicit validation commands.
- Call out migration, compatibility, and risk mitigation steps.
- Keep implementation scoped and maintainable.
```

### 3) `03-implement-feature.md`

**What this file is for**
- Driving controlled feature implementation with deterministic edits, tests, and verification.

**When to use it**
- During active feature delivery after design approval.

**Expected output after updating it**
- A feature implementation prompt that enforces repo inspection, scoped edits, and explicit validation.

**Copy/paste update prompt**

```text
Update PROMPTS/03-implement-feature.md with app-specific implementation guidance.

Context to embed:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Primary workflows: [INSERT PRIMARY WORKFLOWS]
- Core features: [INSERT CORE FEATURES]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Data sources: [INSERT DATA SOURCES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Modules/files to focus on: [INSERT MODULE / FILES TO FOCUS ON]
- Test strategy: [INSERT TEST STRATEGY]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

The rewritten prompt must require:
- Inspect-first behavior before implementation.
- Minimal, deterministic, production-minded code changes.
- Updated tests for all new or changed logic.
- Explicit post-change checks and failure-handling instructions.
- A clear final summary of changed files and validation results.
```

### 4) `04-fix-bug.md`

**What this file is for**
- Guiding root-cause analysis and deterministic bug remediation.

**When to use it**
- For regressions, production defects, flaky behavior, or repeatable bug reports.

**Expected output after updating it**
- A bug-fix prompt that requires repro, diagnosis, corrective patch, and regression coverage.

**Copy/paste update prompt**

```text
Rewrite PROMPTS/04-fix-bug.md for my application so it becomes a structured root-cause-and-fix prompt.

Include these inputs:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Data sources: [INSERT DATA SOURCES]
- Known bug / issue details: [INSERT KNOWN BUG / ISSUE DETAILS]
- Modules/files to focus on: [INSERT MODULE / FILES TO FOCUS ON]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Test strategy: [INSERT TEST STRATEGY]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

The updated prompt must force this sequence:
1) Reproduce bug,
2) Isolate root cause,
3) Implement minimal deterministic fix,
4) Add regression tests,
5) Run validation commands,
6) Summarize residual risks.
```

### 5) `05-validate-and-test.md`

**What this file is for**
- Standardizing validation, lint/type/test/build checks, and release-quality confidence reporting.

**When to use it**
- After implementation or bugfix work and before merge/release decisions.

**Expected output after updating it**
- A validation prompt that enforces deterministic check order, clear pass/fail reporting, and actionable remediation notes.

**Copy/paste update prompt**

```text
Use the details below to rewrite PROMPTS/05-validate-and-test.md into a strict app-specific validation prompt.

App details:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Core features: [INSERT CORE FEATURES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Test strategy: [INSERT TEST STRATEGY]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

Require the rewritten prompt to:
- Define exact validation command order.
- Require deterministic output reporting (pass/fail/warnings).
- Require explicit triage for failures with minimal safe fix recommendations.
- Prohibit skipping checks unless the environment limitation is documented.
- Include acceptance criteria for calling work “validated”.
```

### 6) `06-deep-codebase-review.md`

**What this file is for**
- Running deep architecture, maintainability, and risk reviews across the codebase.

**When to use it**
- For periodic quality reviews, before major refactors, or ahead of release hardening.

**Expected output after updating it**
- A deep-review prompt that produces prioritized findings, impact ratings, and remediation plans tied to concrete modules.

**Copy/paste update prompt**

```text
Rewrite PROMPTS/06-deep-codebase-review.md so it becomes a comprehensive deep-review prompt for my app.

Use this context:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Target users: [INSERT TARGET USERS]
- Primary workflows: [INSERT PRIMARY WORKFLOWS]
- Core features: [INSERT CORE FEATURES]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Data sources: [INSERT DATA SOURCES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Modules/files to focus on: [INSERT MODULE / FILES TO FOCUS ON]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

The rewritten prompt should require:
- Architectural consistency checks and dependency boundary validation.
- Identification of technical debt and deterministic refactor opportunities.
- Security/compliance risk review tied to real code paths.
- Prioritized remediation backlog with severity and effort estimate.
- Explicit references to relevant files.
```

### 7) `07-release-readiness.md`

**What this file is for**
- Determining if a change set is ready for release based on objective gates.

**When to use it**
- At final go/no-go stage before deployment.

**Expected output after updating it**
- A release-readiness prompt with explicit release criteria, blocker checks, rollback readiness, and deployment notes.

**Copy/paste update prompt**

```text
Please rewrite PROMPTS/07-release-readiness.md to be a production release-readiness prompt tailored to my app.

Include this app-specific input:
- App name: [INSERT APP NAME]
- App purpose: [INSERT APP PURPOSE]
- Current repo/project context: [INSERT CURRENT REPO/PROJECT CONTEXT]
- Tech stack: [INSERT TECH STACK]
- Core features: [INSERT CORE FEATURES]
- Data sources: [INSERT DATA SOURCES]
- Security/compliance requirements: [INSERT SECURITY / COMPLIANCE REQUIREMENTS]
- Non-functional requirements: [INSERT NON-FUNCTIONAL REQUIREMENTS]
- Test strategy: [INSERT TEST STRATEGY]
- Release criteria: [INSERT RELEASE CRITERIA]
- Deployment target: [INSERT DEPLOYMENT TARGET]
- Constraints / out-of-scope items: [INSERT CONSTRAINTS / OUT OF SCOPE ITEMS]

Make the updated prompt require:
- A go/no-go recommendation with rationale.
- Explicit blocker list and mitigation actions.
- Verification that validation/test evidence meets release criteria.
- Operational checks for deployment target and rollback path.
- Clear sign-off format suitable for operators.
```

## How to use each updated prompt

After a prompt file is customized, use that prompt content directly in ChatGPT/Codex during the matching stage of work:

- Discovery and inventory: `01-bootstrap-and-inventory.md`
- Design and implementation planning: `02-design-plan.md`
- Feature development: `03-implement-feature.md`
- Bug diagnosis and remediation: `04-fix-bug.md`
- Validation and test execution: `05-validate-and-test.md`
- Deep architecture/quality review: `06-deep-codebase-review.md`
- Release go/no-go and operational readiness: `07-release-readiness.md`

## Practical tips

- Keep prompt files tightly specific to your app, not generic.
- Update prompt files when architecture, workflows, or compliance requirements change.
- Include exact module names, file paths, constraints, and acceptance criteria.
- Avoid vague language such as “improve this” without measurable outcomes.
- Prefer deterministic instructions: explicit command order, explicit pass/fail gates, explicit deliverables.
