import Image from 'next/image';
import { ProjectWizard } from '@/components/project-wizard';

const operationSnapshots = [
  {
    label: 'Delivery modes',
    value: '3',
    detail: 'ZIP export, new repository, existing repository PR update.'
  },
  {
    label: 'Safety model',
    value: 'Non-destructive',
    detail: 'Existing repository writes stay on a generated branch until PR merge.'
  },
  {
    label: 'Execution model',
    value: 'Deterministic',
    detail: 'Input values map to consistent generated artifacts and payload fields.'
  }
];

const modeSummaries = [
  {
    title: 'ZIP',
    summary: 'Generate and download scaffold files without GitHub login.',
    useCase: 'Template and profile validation before repository delivery.'
  },
  {
    title: 'New Repo',
    summary: 'Create and initialize a new GitHub repository, then commit generated output.',
    useCase: 'Greenfield repository bootstrap with approved defaults.'
  },
  {
    title: 'Existing Repo PR',
    summary: 'Generate branch updates and open a pull request with non-colliding files only.',
    useCase: 'Controlled additive updates to managed repositories.'
  }
];

export default function HomePage() {
  return (
    <section className="ops-page">
      <header className="ops-header">
        <p className="section-kicker">Orchestration workspace</p>
        <h2>Configure delivery, execute jobs, and inspect outputs from one control surface</h2>
      </header>

      <section className="ops-snapshot-grid" aria-label="Operational summary">
        {operationSnapshots.map((snapshot) => (
          <article key={snapshot.label} className="ops-snapshot">
            <p>{snapshot.label}</p>
            <h3>{snapshot.value}</h3>
            <span>{snapshot.detail}</span>
          </article>
        ))}
      </section>

      <section className="ops-workspace-grid">
        <div className="ops-primary-column">
          <ProjectWizard />
        </div>

        <aside className="ops-doc-column" aria-label="Reference materials">
          <section className="doc-panel">
            <header>
              <h3>Delivery quick reference</h3>
            </header>
            <div className="compact-mode-list">
              {modeSummaries.map((mode) => (
                <article key={mode.title}>
                  <h4>{mode.title}</h4>
                  <p>{mode.summary}</p>
                  <span>{mode.useCase}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="doc-panel">
            <header>
              <h3>Workflow diagrams</h3>
            </header>
            <figure>
              <figcaption>Workflow overview</figcaption>
              <Image
                src="/images/workflow-overview.svg"
                alt="Workflow from user inputs through template orchestration and validation to final delivery artifacts"
                width={1200}
                height={420}
              />
            </figure>
            <figure>
              <figcaption>Delivery decision flow</figcaption>
              <Image
                src="/images/delivery-mode-flow.svg"
                alt="Decision tree for choosing ZIP, new GitHub repository, or existing repository PR delivery mode"
                width={1000}
                height={620}
              />
            </figure>
          </section>
        </aside>
      </section>
    </section>
  );
}
