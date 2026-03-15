import { MetricChip } from '@/components/metric-chip';
import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <section className="workspace-page">
      <header className="page-header">
        <p className="kicker">Operator workspace</p>
        <h2>Deterministic scaffold orchestration workstation</h2>
        <p>
          Configure project inputs, pin delivery behavior, inspect automation boundaries, and run execution in a
          dedicated console surface.
        </p>
        <div className="status-row">
          <MetricChip>Execution model: deterministic</MetricChip>
          <MetricChip>Existing repo delivery: branch + PR only</MetricChip>
          <MetricChip>Modes: ZIP · New Repo · Existing Repo PR</MetricChip>
        </div>
      </header>

      <ProjectWizard />
    </section>
  );
}
