export default function HelpPage() {
  return (
    <main className="workspace help-page">
      <section className="panel">
        <header className="panel-header">
          <p className="eyebrow">Operator Documentation</p>
          <h1>Help: Codex Project Orchestration Manager</h1>
          <p>
            This page documents expected operator behavior for deterministic scaffold generation, validation, and
            delivery into local or GitHub-backed targets.
          </p>
        </header>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Introduction</h2>
        </header>
        <div className="panel-body">
          <p>
            The orchestration manager is used by engineers, platform operators, and technical leads who need repeatable
            project setup. It accepts project metadata and template selections, generates scaffold artifacts in a stable
            order, and delivers those artifacts either as a ZIP file or through GitHub workflows.
          </p>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>How the system works</h2>
        </header>
        <div className="panel-body">
          <ol>
            <li>Capture project metadata, delivery mode, and template/category selections in the wizard.</li>
            <li>Resolve the built-in template/profile configuration for the selected project category.</li>
            <li>Generate scaffold files deterministically (stable ordering and consistent payload structure).</li>
            <li>Run validation for path hygiene, collisions, and delivery-mode-specific constraints.</li>
            <li>Deliver artifacts to ZIP output, a new GitHub repo, or an existing repo through a pull request.</li>
          </ol>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Delivery modes</h2>
        </header>
        <div className="panel-body">
          <h3>Download ZIP</h3>
          <ul>
            <li><strong>When to use:</strong> first-pass generation and local quality checks.</li>
            <li><strong>What it does:</strong> produces scaffold artifacts and packages them for download.</li>
            <li><strong>What to expect:</strong> no GitHub sign-in is required; output can be reviewed offline.</li>
          </ul>

          <h3>Create GitHub repository</h3>
          <ul>
            <li><strong>When to use:</strong> provisioning a new repository from an approved template selection.</li>
            <li><strong>What it does:</strong> creates a repository, initializes baseline content, and commits artifacts.</li>
            <li><strong>What to expect:</strong> requires a valid GitHub session with repo-capable token scopes.</li>
          </ul>

          <h3>Update existing repository via pull request</h3>
          <ul>
            <li><strong>When to use:</strong> additive updates to repositories that already exist.</li>
            <li><strong>What it does:</strong> creates an update branch, writes non-colliding files, then opens a PR.</li>
            <li><strong>What to expect:</strong> default branch is untouched until maintainers review and merge.</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Typical workflow</h2>
        </header>
        <div className="panel-body">
          <ol>
            <li>Start with <strong>Download ZIP</strong>.</li>
            <li>Inspect generated files locally and verify repository hygiene.</li>
            <li>Adjust template, category, and profile inputs until outputs are correct.</li>
            <li>Switch to <strong>Create GitHub repository</strong> or <strong>Update existing repository via pull request</strong>.</li>
            <li>Review validation output and job result payload before continuing to downstream steps.</li>
          </ol>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>GitHub authentication</h2>
        </header>
        <div className="panel-body">
          <ul>
            <li>GitHub login is required for repository creation and existing-repository update modes.</li>
            <li>Required scope set: <code>read:user user:email repo</code>.</li>
            <li>Repo listing can fail when installation access is missing, repo scope is revoked, or token is expired.</li>
            <li>Repository creation can fail when <code>repo</code> scope is absent or organization policies block creation.</li>
            <li>Reauthorization is required after token revocation, scope reduction, or account permission changes.</li>
            <li>
              If auth is unavailable or invalid, the UI shows warnings, disables restricted actions, and continues to
              allow ZIP mode.
            </li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Safety guardrails</h2>
        </header>
        <div className="panel-body">
          <ul>
            <li>Existing-repository mode is non-destructive and branch-based.</li>
            <li>No direct writes are made to default branches in PR/update mode.</li>
            <li>File collisions are identified and skipped deterministically.</li>
            <li>Validation blocks unsafe paths and hygiene violations before delivery is finalized.</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Templates and profiles</h2>
        </header>
        <div className="panel-body">
          <p>
            Template selection controls the scaffold baseline (project structure, defaults, and generated artifacts).
            Category/profile values influence prompt packs and output emphasis. Operators should treat these inputs as
            deterministic configuration: keep combinations explicit, review generated changes, and promote only
            validated outputs.
          </p>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Output artifacts</h2>
        </header>
        <div className="panel-body">
          <p>Generated output typically includes:</p>
          <ul>
            <li>project scaffolding files and directory structure</li>
            <li>baseline repository hygiene files (<code>.gitignore</code>, <code>.editorconfig</code>, and license placeholder)</li>
            <li>metadata required by orchestration and delivery status reporting</li>
          </ul>
          <p>
            These artifacts exist to standardize project bootstrap, enforce repeatable setup, and support auditable
            delivery outcomes.
          </p>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Troubleshooting</h2>
        </header>
        <div className="panel-body">
          <h3>GitHub sign-in unavailable</h3>
          <p>
            Check runtime configuration (<code>NEXTAUTH_URL</code>, <code>NEXTAUTH_SECRET</code>,
            <code> GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code>). If missing, GitHub actions are
            disabled by design.
          </p>

          <h3>Repository list is empty</h3>
          <p>
            Confirm account access to target repositories and verify token scopes. Reauthorize if repository listing
            capability is flagged as unavailable.
          </p>

          <h3>Missing environment variables</h3>
          <p>
            Use runtime diagnostics endpoints/logs to identify missing values. Supply values through deployment
            settings, then restart the app.
          </p>

          <h3>Orchestration job failure</h3>
          <p>
            Inspect the job error payload in the results console. Correct invalid inputs or delivery configuration and
            re-run the job.
          </p>

          <h3>Validation/path hygiene errors</h3>
          <p>
            Remove unsafe paths, rename conflicting files, or adjust template inputs to satisfy deterministic hygiene
            checks.
          </p>

          <h3>PR/update mode confusion</h3>
          <p>
            Existing-repository mode always produces a branch and PR. If direct default-branch commits are required,
            use a separate controlled workflow outside this tool.
          </p>
        </div>
      </section>
    </main>
  );
}
