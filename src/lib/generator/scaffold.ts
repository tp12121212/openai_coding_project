import path from 'node:path';
import { CreateProjectRequest } from './schema';
import { getPromptPack } from './prompts';
import { getTemplateById } from '../templates/library';
import { ScaffoldManifest } from '../types';
import { normalizeWhitespace, sha256 } from '../utils/deterministic';

interface GeneratedFile {
  path: string;
  content: string;
}

export interface ScaffoldResult {
  manifest: ScaffoldManifest;
  files: GeneratedFile[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderMarkdown(title: string, body: string): string {
  return normalizeWhitespace(`# ${title}\n\n${body}\n`) + '\n';
}

function buildReadmeBody(request: CreateProjectRequest, templateName: string): string {
  return normalizeWhitespace([
    request.description,
    `Template: ${templateName}`,
    `Project category: ${request.category}`,
    `Delivery mode: ${request.deliveryMode}`,
    '',
    '## Getting started',
    '1. Review IMPLEMENTATION_PLAN.md',
    '2. Review hygiene baseline files (.gitignore, .editorconfig, LICENSE)',
    '3. Run quality checks before first commit.'
  ].join('\n'));
}


function gitignoreForTemplate(templateId: CreateProjectRequest['templateId']): string {
  const common = ['.DS_Store', '*.log', '.env', '.env.*', 'coverage/', 'dist/', '.next/', 'output/'];
  const node = ['node_modules/', '.npm/', '.pnpm-store/', 'npm-debug.log*'];
  const python = ['.venv/', '__pycache__/', '*.pyc', '.pytest_cache/', '.mypy_cache/'];
  const lines = [...common, ...(templateId === 'python-cli' ? python : node), '.orchestration/'];
  return `${lines.sort((a, b) => a.localeCompare(b)).join('\n')}\n`;
}

function buildBestPracticesGuide(): string {
  return normalizeWhitespace([
    '# Best Practices for Using ChatGPT and Codex in Application Development',
    '',
    '## 1) Choose the right mode for the task',
    '',
    '| Mode / feature | Primary purpose | Strengths | Weaknesses / limitations | Best use cases in application development | When not to use it | Example tasks |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| Standard chat | Fast collaborative reasoning and drafting | Quick iteration, broad knowledge, clear explanations | No direct repo execution context by default | Clarifying requirements, drafting plans, creating prompt scaffolds | When exact repository state is required for safe code changes | Convert product requirements into an implementation checklist |',
    '| Web search / browse mode | Pull in external docs and current references | Access to latest public documentation and release notes | External content may be noisy; still requires verification in codebase | Framework migration research, API behavior checks, dependency deprecations | When local repository evidence already answers the question | Compare official migration guidance between framework versions |',
    '| Deep research | Structured, multi-source analysis over complex topics | Better synthesis for architecture tradeoffs and policy-heavy topics | Slower and more verbose than standard chat | Threat-model support, compliance control mapping, design-option comparison | For simple coding tasks with clear local context | Analyze encryption-at-rest approaches and operational implications |',
    '| Agent mode | End-to-end task execution with planning and tool use | Can inspect files, edit code, run tests, and validate outcomes | Must still be reviewed; can over-scope if prompts are vague | Multi-file implementation, deterministic refactors, test updates | If you only need a quick conceptual answer | Implement feature, run tests, and prepare a focused patch |',
    '| Codex (IDE/editor integration) | In-context code edits and codebase-aware assistance | Tight loop with local files and symbols | Can miss cross-repo context unless explicitly provided | Function-level implementation, incremental refactors, test authoring | For high-level strategic planning without code changes | Add validator logic and update adjacent unit tests |',
    '| Codex CLI | Deterministic repo-local automation from terminal workflows | Excellent for scripted edits, command execution, and reproducible checks | Requires precise instructions; command outputs must be reviewed | Scaffold generation updates, bulk file edits, CI-style validation | For purely conversational ideation | Modify generator pipeline and run focused test suite |',
    '| Local terminal tooling | Authoritative source for builds, tests, linting, and packaging | Ground truth for repo state and reproducibility | Requires toolchain setup and disciplined command usage | Running full validation, packaging artifacts, release hardening checks | As a replacement for design reasoning | Run test/lint/build and verify generated outputs |',
    '',
    '## 2) Prompting strategies by engineering task',
    '',
    '### Exploratory prompts',
    '- **Goal:** Discover constraints, unknowns, and options before coding.',
    '- **Recommended structure:** Context -> objective -> constraints -> questions to answer.',
    '- **Required inputs:** High-level requirement, current stack, constraints (security, performance, timeline).',
    '- **Sample template:** `Given <context>, identify 3 implementation approaches for <goal>. Compare tradeoffs for reliability, complexity, and delivery speed. End with a recommended path.`',
    '- **Common failure modes:** Too broad scope, missing constraints, output not actionable.',
    '- **Improve results:** Add repo-specific boundaries and explicit decision criteria.',
    '',
    '### Implementation prompts',
    '- **Goal:** Produce concrete code changes with minimal ambiguity.',
    '- **Recommended structure:** Files/modules -> exact behavior -> constraints -> required tests.',
    '- **Required inputs:** Target files, acceptance criteria, existing patterns, error-handling expectations.',
    '- **Sample template:** `Update <file paths> to implement <behavior>. Preserve existing architecture and logging style. Add/update tests for <cases>. Return a unified diff summary plus validation commands.`',
    '- **Common failure modes:** Hallucinated files, architecture drift, missing tests.',
    '- **Improve results:** Provide file paths, function signatures, and explicit non-goals.',
    '',
    '### Debugging prompts',
    '- **Goal:** Isolate root cause and produce a verified fix.',
    '- **Recommended structure:** Symptoms -> reproduction -> suspected layers -> required evidence.',
    '- **Required inputs:** Error output, stack traces, recent commits, environment details.',
    '- **Sample template:** `Using this stack trace and reproduction steps, identify likely root causes ranked by confidence. Propose minimal fix options and required verification steps.`',
    '- **Common failure modes:** Premature fixes without reproduction, incomplete hypotheses.',
    '- **Improve results:** Ask for ranked hypotheses and mandatory validation plan.',
    '',
    '### Refactoring prompts',
    '- **Goal:** Improve structure without changing behavior.',
    '- **Recommended structure:** Current pain point -> invariants -> refactor boundary -> tests to preserve.',
    '- **Required inputs:** Existing behavior contract, performance constraints, style requirements.',
    '- **Sample template:** `Refactor <module> for readability and testability while preserving behavior. Keep public interfaces stable and update tests only where strictly necessary.`',
    '- **Common failure modes:** Hidden behavior changes, over-refactor.',
    '- **Improve results:** Require explicit invariants and diff-limited scope.',
    '',
    '### Architecture/design prompts',
    '- **Goal:** Produce implementation-ready technical direction.',
    '- **Recommended structure:** Problem statement -> N options -> decision matrix -> recommended design.',
    '- **Required inputs:** Scale expectations, compliance constraints, operational model.',
    '- **Sample template:** `Design an architecture for <problem> with three alternatives. Include data flow, failure modes, security controls, and migration plan. Recommend one option.`',
    '- **Common failure modes:** Abstract recommendations with no execution path.',
    '- **Improve results:** Require interfaces, sequencing, and rollback strategy.',
    '',
    '### Test-generation prompts',
    '- **Goal:** Create deterministic tests that enforce behavior.',
    '- **Recommended structure:** Target behavior -> test cases -> fixtures -> assertions.',
    '- **Required inputs:** Existing test framework, deterministic rules, edge cases.',
    '- **Sample template:** `Generate tests for <module> covering happy path, edge cases, and failure paths. Keep fixtures deterministic and avoid network dependence.`',
    '- **Common failure modes:** Brittle snapshots, nondeterministic assertions.',
    '- **Improve results:** Require stable ordering and explicit fixture data.',
    '',
    '### Code review prompts',
    '- **Goal:** Evaluate correctness, risk, and maintainability.',
    '- **Recommended structure:** Diff summary -> risk categories -> blocking/non-blocking findings.',
    '- **Required inputs:** Patch diff, coding standards, release context.',
    '- **Sample template:** `Review this diff for correctness, security, determinism, and maintainability. Classify findings as blocker/high/medium/low and suggest precise fixes.`',
    '- **Common failure modes:** Superficial comments, no prioritization.',
    '- **Improve results:** Ask for severity-ranked findings with concrete edits.',
    '',
    '### Documentation prompts',
    '- **Goal:** Produce accurate, operator-friendly documentation.',
    '- **Recommended structure:** Audience -> purpose -> prerequisites -> procedures -> troubleshooting.',
    '- **Required inputs:** Actual commands, file paths, constraints, examples.',
    '- **Sample template:** `Draft docs for <workflow> aimed at <audience>. Include prerequisites, step-by-step commands, expected outputs, and common failure recovery.`',
    '- **Common failure modes:** Generic guidance not matching repo reality.',
    '- **Improve results:** Require citation of actual file paths and commands.',
    '',
    '### Migration prompts',
    '- **Goal:** Transition versions/systems safely and incrementally.',
    '- **Recommended structure:** Current state -> target state -> phased plan -> validation and rollback.',
    '- **Required inputs:** Compatibility matrix, deprecations, data migration requirements.',
    '- **Sample template:** `Create a phased migration plan from <current> to <target>. Include compatibility risks, rollout checkpoints, and rollback criteria.`',
    '- **Common failure modes:** Big-bang changes, no rollback.',
    '- **Improve results:** Require phase gates and backward compatibility checks.',
    '',
    '### Incident / root-cause-analysis prompts',
    '- **Goal:** Explain incident impact and prevent recurrence.',
    '- **Recommended structure:** Timeline -> impact -> root cause -> corrective actions.',
    '- **Required inputs:** Logs, metrics, deployment timeline, blast radius.',
    '- **Sample template:** `Build an RCA from this incident data. Distinguish proximate vs systemic causes and provide corrective actions with owners and verification checks.`',
    '- **Common failure modes:** Blame-oriented narrative, weak corrective actions.',
    '- **Improve results:** Require measurable prevention controls and follow-up tests.',
    '',
    '### Security/compliance prompts',
    '- **Goal:** Identify security and compliance risks before release.',
    '- **Recommended structure:** Asset/data classification -> threats -> controls -> residual risk.',
    '- **Required inputs:** Data flows, trust boundaries, regulatory constraints.',
    '- **Sample template:** `Assess <feature> for security and compliance risk. Identify sensitive data paths, required controls, and tests to validate enforcement.`',
    '- **Common failure modes:** Checklists disconnected from implementation.',
    '- **Improve results:** Ask for code-level controls and validation commands.',
    '',
    '## 3) Where to run each workflow',
    '',
    '| Environment | Best for | Not best for | Tradeoffs | Recommended scenarios |',
    '| --- | --- | --- | --- | --- |',
    '| ChatGPT web | Planning, synthesis, prompt design, architecture discussion | Direct repo edits and command execution | Strong reasoning, weaker repo-grounded execution | Requirement decomposition, architecture tradeoff analysis |',
    '| ChatGPT mobile (iPhone) | Quick triage, notes, draft prompts while away from workstation | Multi-file implementation and full validation loops | High convenience, limited code navigation | On-call triage notes, drafting incident questions |',
    '| Codex (editor integration) | Targeted code edits in active files with fast feedback | Large orchestration tasks spanning tooling and packaging | Great local context, depends on editor workflow | Implementing functions, writing nearby tests |',
    '| Codex CLI | Scripted multi-file edits and deterministic local command execution | Brainstorming broad product strategy | Highly reproducible, requires explicit instructions | Generator updates, repo-wide codemods, focused validation |',
    '| Terminal/local development environment | Authoritative test/build/lint/package execution | High-level ideation without data | Most reliable validation, slower iteration than chat | Pre-merge validation, release hardening checks |',
    '| Browser-based workflows | Research, issue triage, docs comparison, PR discussion | Deterministic local generation checks | Excellent collaboration, weaker direct execution | Comparing framework docs, reviewing upstream API changes |',
    '| Repo-local workflows | Grounded implementation, deterministic generation, production checks | External trend analysis | Best correctness and reproducibility | Multi-file coding, test updates, artifact verification |',
    '',
    '## 4) End-to-end workflows',
    '',
    '### Greenfield feature development',
    '1. Use standard chat or deep research to clarify requirements and constraints.',
    '2. Use agent mode or Codex CLI to implement minimal vertical slice.',
    '3. Use Codex/editor for tight-loop refinements.',
    '4. Validate with terminal tests, lint, and build.',
    '- **Handoff points:** planning -> implementation -> validation.',
    '- **Example prompt:** `Implement feature X in modules A/B with tests. Preserve architecture and deterministic output.`',
    '- **Validation expectation:** New tests for acceptance criteria plus no regressions.',
    '',
    '### Bug investigation and fix',
    '1. Collect reproduction steps and logs in terminal.',
    '2. Use debugging prompt to rank hypotheses.',
    '3. Implement smallest safe fix in Codex/Codex CLI.',
    '4. Add regression test and rerun suite.',
    '- **Handoff points:** evidence collection -> diagnosis -> patch -> regression validation.',
    '- **Example prompt:** `Given this stack trace and repro, isolate root cause and patch with regression test.`',
    '- **Validation expectation:** Repro fails before fix and passes after fix.',
    '',
    '### Refactoring legacy code',
    '1. Use architecture/refactoring prompts to define invariants.',
    '2. Refactor in small commits using Codex CLI.',
    '3. Run deterministic tests after each step.',
    '- **Handoff points:** invariants defined -> staged refactors -> safety checks.',
    '- **Example prompt:** `Refactor module Y for testability; keep public API and behavior unchanged.`',
    '- **Validation expectation:** No behavior drift; all tests pass.',
    '',
    '### Writing tests before implementation',
    '1. Use test-generation prompt for failing tests from requirements.',
    '2. Confirm failures are expected.',
    '3. Implement code until tests pass.',
    '- **Handoff points:** requirements -> tests -> implementation.',
    '- **Example prompt:** `Create deterministic tests for requirement set R before code changes.`',
    '- **Validation expectation:** Red-green cycle documented and reproducible.',
    '',
    '### Security review / threat-oriented review',
    '1. Use deep research or security prompts to model threats.',
    '2. Implement controls and logging updates.',
    '3. Add negative and abuse-case tests.',
    '- **Handoff points:** threat model -> control implementation -> verification.',
    '- **Example prompt:** `Assess sensitive data paths and implement least-privilege controls with tests.`',
    '- **Validation expectation:** Explicit test evidence for control enforcement.',
    '',
    '### Release hardening',
    '1. Run code review prompt on final diff.',
    '2. Execute full lint/test/build/package locally.',
    '3. Verify generated artifacts are deterministic.',
    '- **Handoff points:** review -> full validation -> artifact checks.',
    '- **Example prompt:** `Review this release diff for blockers, then list exact hardening checks.`',
    '- **Validation expectation:** Zero blocker issues; reproducible artifact outputs.',
    '',
    '### Documentation generation',
    '1. Draft docs in standard chat.',
    '2. Ground docs against actual commands/files from repository.',
    '3. Validate all documented commands locally.',
    '- **Handoff points:** draft -> grounding -> command verification.',
    '- **Example prompt:** `Create operator docs from these scripts and command outputs.`',
    '- **Validation expectation:** Every command in docs is executable and accurate.',
    '',
    '### Repo-wide cleanup',
    '1. Define narrow cleanup scope (naming, lint, dead code).',
    '2. Apply scripted edits via Codex CLI.',
    '3. Run broad regression checks.',
    '- **Handoff points:** scope lock -> automated edits -> regression suite.',
    '- **Example prompt:** `Apply consistent naming convention to module family M without behavior changes.`',
    '- **Validation expectation:** Formatting and behavior remain stable.',
    '',
    '### Multi-file changes',
    '1. Use agent mode with explicit file list and non-goals.',
    '2. Request patch summary grouped by subsystem.',
    '3. Run targeted then full tests.',
    '- **Handoff points:** scoped plan -> coordinated edits -> layered validation.',
    '- **Example prompt:** `Update files A, B, C for requirement Z; do not alter public API Q.`',
    '- **Validation expectation:** Cross-file consistency and passing integration checks.',
    '',
    '### Requirements-to-implementation flow',
    '1. Convert requirements into acceptance criteria.',
    '2. Map criteria to modules/tests.',
    '3. Implement incrementally.',
    '4. Validate each criterion with evidence.',
    '- **Handoff points:** requirements -> criteria -> code -> evidence.',
    '- **Example prompt:** `Translate requirements into implementation tasks and tests, then execute in deterministic order.`',
    '- **Validation expectation:** Traceability from requirement to test result.',
    '',
    '## 5) Best practices and guardrails',
    '',
    '- Provide repository context first: relevant files, constraints, and desired outcome.',
    '- Ask for diffs or targeted edits instead of full-file rewrites unless restructuring is required.',
    '- Control scope explicitly with in-scope and out-of-scope lists.',
    '- Require validation commands and expected outcomes for every non-trivial change.',
    '- Request tests for new behavior and regression coverage for bug fixes.',
    '- For large codebases, iterate by subsystem and enforce deterministic ordering.',
    '- If requirements are uncertain, ask for assumptions and decision points before coding.',
    '- Use web search only for external facts; prefer repository sources for implementation decisions.',
    '- Guard against hallucinations by requiring file-path evidence and compile/test verification.',
    '- Keep generated outputs deterministic: stable ordering, normalized whitespace, no timestamps.',
    '- Never include secrets, tokens, private keys, or tenant-specific sensitive identifiers.',
    '- Validate assumptions before implementation; if uncertain, stop and resolve ambiguity first.',
    '',
    '## 6) Decision matrix',
    '',
    '| Task | Recommended mode/tool | Where to run | Prompt style |',
    '| --- | --- | --- | --- |',
    '| Clarify ambiguous requirements | Standard chat | ChatGPT web | Exploratory |',
    '| Research framework/API behavior | Web search / browse mode | Browser-based workflow | Exploratory + architecture |',
    '| Build multi-file feature | Agent mode + Codex CLI | Repo-local workflow | Implementation |',
    '| Diagnose production bug | Standard chat + Codex/Codex CLI | Terminal + repo-local workflow | Debugging + incident RCA |',
    '| Refactor without behavior change | Codex/Codex CLI | Repo-local workflow | Refactoring |',
    '| Generate comprehensive tests | Codex/Codex CLI | Repo-local workflow | Test-generation |',
    '| Security/compliance assessment | Deep research + agent mode | ChatGPT web + repo-local workflow | Security/compliance |',
    '| Prepare release readiness | Codex CLI + terminal tooling | Terminal/local environment | Code review + release hardening |',
    '| Produce operator docs | Standard chat + local verification | ChatGPT web + terminal | Documentation |',
    '| Plan or execute migration | Deep research + Codex CLI | ChatGPT web + repo-local workflow | Migration + architecture |',
    '',
    'Use this guide as an execution aid: pick the smallest capable tool, constrain scope, demand deterministic outputs, and validate every change locally.',
  ].join('\n')) + '\n';
}

export function buildScaffold(request: CreateProjectRequest): ScaffoldResult {
  const template = getTemplateById(request.templateId);
  const slug = slugify(request.projectName);
  const promptFiles = getPromptPack(request.promptPackId);

  const fileMap: GeneratedFile[] = [
    { path: 'README.md', content: renderMarkdown(request.projectName, buildReadmeBody(request, template.name)) },
    {
      path: '.gitignore',
      content: gitignoreForTemplate(request.templateId)
    },
    {
      path: '.editorconfig',
      content: normalizeWhitespace('root = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\ninsert_final_newline = true\nindent_style = space\nindent_size = 2') + '\n'
    },
    {
      path: 'LICENSE',
      content: normalizeWhitespace('SPDX-License-Identifier: UNLICENSED\n\nReplace with your approved license text before distribution.') + '\n'
    },
    {
      path: 'PROJECT_CONTEXT.md',
      content: renderMarkdown('Project Context', `Project slug: ${slug}\nRuntime: ${template.runtime}`)
    },
    {
      path: 'ARCHITECTURE.md',
      content: renderMarkdown('Architecture', `Selected stack: ${template.description}`)
    },
    {
      path: 'IMPLEMENTATION_PLAN.md',
      content: renderMarkdown('Implementation Plan', template.tasks.map((task) => `- ${task}`).join('\n'))
    },
    {
      path: '.codex/config.toml',
      content:
        normalizeWhitespace([`profile = "${request.codexProfile}"`, 'unsupported_automation = false', 'deterministic = true'].join('\n')) + '\n'
    },
    {
      path: '.codex/instructions.md',
      content: renderMarkdown('Codex Instructions', 'Follow existing patterns, inspect modules first, run tests, and explain assumptions.')
    },
    {
      path: 'TASKS/00-initial-backlog.md',
      content: renderMarkdown('Initial Backlog', template.tasks.map((task) => `- [ ] ${task}`).join('\n'))
    },
    {
      path: 'BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md',
      content: renderMarkdown('Project Bootstrap Pack', 'Use this scaffold as a deterministic starting point.')
    },
    {
      path: 'BOOTSTRAP/MANUAL_FINALIZATION.md',
      content: renderMarkdown('Manual Finalization Checklist', '- [ ] Seed prompts\n- [ ] Seed tasks\n- [ ] Run checks')
    },
    {
      path: 'BEST_PRACTICES_CHATGPT_CODEX.md',
      content: buildBestPracticesGuide()
    }
  ];

  for (const prompt of promptFiles) {
    fileMap.push({
      path: path.posix.join('PROMPTS', prompt.fileName),
      content: normalizeWhitespace(prompt.content) + '\n'
    });
  }

  const files = fileMap.sort((a, b) => a.path.localeCompare(b.path));

  const artifactRecords = files
    .map((file) => ({
      path: file.path,
      kind: (file.path.endsWith('.json') ? 'json' : file.path.endsWith('.toml') ? 'toml' : file.path.endsWith('.md') ? 'markdown' : 'text') as 'json' | 'toml' | 'markdown' | 'text',
      checksum: sha256(file.content)
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const manifest: ScaffoldManifest = {
    schemaVersion: '3.0.0',
    project: {
      name: request.projectName,
      slug,
      description: request.description,
      category: request.category
    },
    stack: {
      templateId: request.templateId,
      templateVersion: '1.1.0',
      language: template.language,
      runtime: template.runtime
    },
    delivery: { mode: request.deliveryMode },
    hygiene: {
      checksVersion: '1.0.0',
      baselineFiles: ['.editorconfig', '.gitignore', 'LICENSE']
    },
    prompts: {
      packId: request.promptPackId,
      files: promptFiles.map((p) => path.posix.join('PROMPTS', p.fileName)).sort((a, b) => a.localeCompare(b))
    },
    bootstrapPack: {
      schemaVersion: '1.0.0',
      manualFinalizationRequired: true,
      files: ['BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md', 'BOOTSTRAP/MANUAL_FINALIZATION.md']
    },
    generatedArtifacts: artifactRecords,
    validation: {
      deterministic: true,
      sortedKeys: true,
      normalizedWhitespace: true
    }
  };

  return { manifest, files };
}
