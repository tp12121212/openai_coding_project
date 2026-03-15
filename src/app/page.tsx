import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <section className="workspace-page">
      <header className="workspace-header">
        <p className="section-kicker">Orchestration workspace</p>
        <h2>Run deterministic scaffold jobs from a zoned operator workspace</h2>
        <p>
          Configure project inputs, choose delivery behavior, inspect template constraints, then execute and review
          structured output in a separate console surface.
        </p>
        <div className="status-chips">
          <span className="summary-chip">Execution model: deterministic</span>
          <span className="summary-chip">Branch safety: PR-only for existing repos</span>
          <span className="summary-chip">Delivery: ZIP | New Repo | Existing Repo PR</span>
        </div>
      </header>

      <ProjectWizard />
    </section>
  );
}
