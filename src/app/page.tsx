import Image from 'next/image';
import { ProjectWizard } from '@/components/project-wizard';

const deliveryOptions = [
  {
    title: 'Download ZIP',
    detail: 'Run generation without GitHub. Download the artifact bundle and inspect outputs locally before promotion.',
    when: 'Use for template validation, onboarding dry-runs, and local review loops.'
  },
  {
    title: 'Create GitHub Repo',
    detail: 'Create a new repository and push deterministic scaffold output to the resolved default branch.',
    when: 'Use when bootstrapping a greenfield repo with approved template settings.'
  },
  {
    title: 'Update Existing Repo via PR',
    detail: 'Create a dedicated branch, add non-colliding files, and open a pull request for human review.',
    when: 'Use for additive updates to managed repos without direct default-branch writes.'
  }
];

export default function HomePage() {
  return (
    <main className="workspace">
      <section className="panel panel-hero">
        <div>
          <p className="eyebrow">Operator Console</p>
          <h1>Deterministic scaffold orchestration and controlled repository delivery</h1>
          <p>
            Use this workspace to capture project intent, resolve templates/profiles, and execute repeatable scaffold
            generation with explicit safety checks and delivery controls.
          </p>
        </div>
        <dl className="status-grid">
          <div>
            <dt>Execution model</dt>
            <dd>Input → template/profile resolve → validation → delivery</dd>
          </div>
          <div>
            <dt>Branch safety</dt>
            <dd>Existing repository mode is branch + PR only</dd>
          </div>
          <div>
            <dt>Delivery targets</dt>
            <dd>ZIP export, new GitHub repo, existing repo pull request</dd>
          </div>
        </dl>
      </section>

      <section className="workspace-grid">
        <article className="panel reference-panel">
          <header className="panel-header">
            <h2>Delivery mode playbook</h2>
            <p>Choose a mode based on review requirements and repository ownership.</p>
          </header>
          <div className="panel-body delivery-stack">
            {deliveryOptions.map((option) => (
              <article key={option.title} className="mode-row">
                <h3>{option.title}</h3>
                <p>{option.detail}</p>
                <p className="mode-when">{option.when}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel reference-panel">
          <header className="panel-header">
            <h2>Reference diagrams</h2>
            <p>Operational references used during intake and delivery selection.</p>
          </header>
          <div className="panel-body diagram-stack">
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
          </div>
        </article>
      </section>

      <ProjectWizard />
    </main>
  );
}
