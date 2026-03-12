'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getBuiltInTemplates } from '@/lib/templates/library';

const templates = getBuiltInTemplates();

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
    branchName: 'feature/bootstrap',
    createWorktree: false,
    worktreePath: './worktrees/bootstrap'
  });
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === formState.templateId),
    [formState.templateId]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResponse('Creating scaffold...');

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(formState)
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      setResponse('');
      setError(JSON.stringify(body, null, 2));
      return;
    }

    setResponse(JSON.stringify(body, null, 2));
  }

  return (
    <div className="card-grid">
      <form className="card" onSubmit={submit}>
        <h2>Create Project Wizard</h2>
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
          Codex Profile
          <select
            value={formState.codexProfile}
            onChange={(event) => setFormState((s) => ({ ...s, codexProfile: event.target.value }))}
          >
            <option value="strict">strict</option>
            <option value="balanced">balanced</option>
            <option value="rapid">rapid</option>
          </select>
        </label>
        <label>
          Prompt Pack
          <select
            value={formState.promptPackId}
            onChange={(event) => setFormState((s) => ({ ...s, promptPackId: event.target.value }))}
          >
            <option value="default-engineering">default-engineering</option>
            <option value="security-compliance-focused">security-compliance-focused</option>
          </select>
        </label>
        <button type="submit">Generate Deterministic Scaffold</button>
      </form>

      <section className="card">
        <h2>Template Library</h2>
        {templates.map((template) => (
          <article key={template.id} className={template.id === selectedTemplate?.id ? 'active-template' : ''}>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Artifact / Validation Panel</h2>
        <p>Unsupported automation is hard-disabled by default.</p>
        {response && <pre>{response}</pre>}
        {error && <pre className="error">{error}</pre>}
      </section>
    </div>
  );
}
