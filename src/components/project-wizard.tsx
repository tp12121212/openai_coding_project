'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getBuiltInTemplates } from '@/lib/templates/library';

const templates = getBuiltInTemplates();

interface ApiJob {
  id: string;
  state: string;
  result?: {
    steps?: { id: string; status: string; detail: string }[];
    github?: { repoUrl?: string | null };
    bundlePath?: string;
    manifestPath?: string;
  };
  error?: string;
}

export function ProjectWizard() {
  const [formState, setFormState] = useState({
    projectName: '',
    description: '',
    localPath: '',
    templateId: 'nextjs-web-app',
    codexProfile: 'strict',
    promptPackId: 'default-engineering',
    initializeGit: true,
    createBranch: false,
    branchName: 'main',
    createWorktree: false,
    worktreePath: './worktrees/bootstrap',
    githubEnabled: false,
    githubOwner: '',
    githubRepo: '',
    githubPrivate: true,
    githubPushInitialContent: false,
    githubToken: ''
  });
  const [job, setJob] = useState<ApiJob | null>(null);
  const [error, setError] = useState<string>('');

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === formState.templateId),
    [formState.templateId]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const payload = {
      projectName: formState.projectName,
      description: formState.description,
      localPath: formState.localPath,
      templateId: formState.templateId,
      codexProfile: formState.codexProfile,
      promptPackId: formState.promptPackId,
      initializeGit: formState.initializeGit,
      createBranch: formState.createBranch,
      branchName: formState.branchName,
      createWorktree: formState.createWorktree,
      worktreePath: formState.worktreePath,
      github: formState.githubEnabled
        ? {
            enabled: true,
            owner: formState.githubOwner,
            repo: formState.githubRepo,
            private: formState.githubPrivate,
            pushInitialContent: formState.githubPushInitialContent,
            token: formState.githubToken,
            variables: [],
            secretReferences: []
          }
        : undefined
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = (await res.json()) as { job?: ApiJob; error?: unknown };
    if (!res.ok || !body.job) {
      setJob(null);
      setError(JSON.stringify(body.error ?? body, null, 2));
      return;
    }

    setJob(body.job);
  }

  return (
    <div className="card-grid">
      <form className="card" onSubmit={submit}>
        <h2>Project Orchestration Wizard</h2>
        <label>
          Project Name
          <input
            required
            value={formState.projectName}
            onChange={(event) => setFormState((s) => ({ ...s, projectName: event.target.value }))}
          />
        </label>
        <label>
          Description
          <textarea
            required
            value={formState.description}
            onChange={(event) => setFormState((s) => ({ ...s, description: event.target.value }))}
          />
        </label>
        <label>
          Local Path
          <input
            required
            value={formState.localPath}
            onChange={(event) => setFormState((s) => ({ ...s, localPath: event.target.value }))}
          />
        </label>
        <label>
          Stack Template
          <select
            value={formState.templateId}
            onChange={(event) => setFormState((s) => ({ ...s, templateId: event.target.value }))}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={formState.githubEnabled}
            onChange={(event) => setFormState((s) => ({ ...s, githubEnabled: event.target.checked }))}
          />
          Enable GitHub automation (public API)
        </label>

        {formState.githubEnabled && (
          <>
            <label>
              GitHub Owner (user/org)
              <input
                required
                value={formState.githubOwner}
                onChange={(event) => setFormState((s) => ({ ...s, githubOwner: event.target.value }))}
              />
            </label>
            <label>
              GitHub Repo
              <input
                required
                value={formState.githubRepo}
                onChange={(event) => setFormState((s) => ({ ...s, githubRepo: event.target.value }))}
              />
            </label>
            <label>
              GitHub Token
              <input
                type="password"
                value={formState.githubToken}
                onChange={(event) => setFormState((s) => ({ ...s, githubToken: event.target.value }))}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={formState.githubPushInitialContent}
                onChange={(event) =>
                  setFormState((s) => ({ ...s, githubPushInitialContent: event.target.checked }))
                }
              />
              Push initial scaffold commit
            </label>
          </>
        )}

        <button type="submit">Run Orchestration</button>
      </form>

      <section className="card">
        <h2>Automation Boundary</h2>
        <ul>
          <li>✅ Automated: deterministic scaffold generation</li>
          <li>✅ Automated (optional): GitHub repository create + push</li>
          <li>⚠️ Manual: ChatGPT/Codex project/chats finalization</li>
          <li>🚫 Disabled by default: unsupported internal ChatGPT automation</li>
        </ul>
        {templates.map((template) => (
          <article key={template.id} className={template.id === selectedTemplate?.id ? 'active-template' : ''}>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Job / Results</h2>
        {!job && <p>Submit the workflow to view orchestration steps and outputs.</p>}
        {job && (
          <>
            <p>
              <strong>Job:</strong> {job.id} ({job.state})
            </p>
            <ul>
              {(job.result?.steps ?? []).map((step) => (
                <li key={step.id}>
                  <strong>{step.id}</strong>: {step.status} — {step.detail}
                </li>
              ))}
            </ul>
            <p>GitHub repo: {job.result?.github?.repoUrl ?? 'not created'}</p>
            <p>Manifest: {job.result?.manifestPath ?? 'n/a'}</p>
            <p>Bundle: {job.result?.bundlePath ?? 'n/a'}</p>
          </>
        )}
        {error && <pre className="error">{error}</pre>}
      </section>
    </div>
  );
}
