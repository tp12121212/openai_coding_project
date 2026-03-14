import Image from 'next/image';
import { ProjectWizard } from '@/components/project-wizard';

const deliveryOptions = [
  {
    title: 'Download ZIP',
    description: 'Generate a deterministic scaffold locally without GitHub authentication.',
    bestWhen: 'Best when you want a fast local review loop before publishing anywhere.'
  },
  {
    title: 'Create GitHub Repo',
    description: 'Create a new repository and commit scaffold files to the repository default branch.',
    bestWhen: 'Best when starting a brand-new project repository from this scaffold.'
  },
  {
    title: 'Update Existing Repo via PR',
    description:
      'Create a safe update branch, add only non-colliding files, and open a pull request for manual approval.',
    bestWhen: 'Best when your repository already exists and you need non-destructive additive changes.'
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero card">
        <h1>Codex Project Orchestration Manager</h1>
        <p>
          Build deterministic scaffold outputs for engineering teams that need repeatable project setup, reviewable
          artifacts, and safe GitHub delivery controls.
        </p>
        <p>
          This workflow is designed for operators, platform engineers, and technical leads who need a predictable way
          to move from template inputs to usable project artifacts.
        </p>
      </section>

      <section className="card">
        <h2>Choose a delivery mode</h2>
        <p>All modes use the same deterministic scaffold generation; only delivery target and GitHub interaction change.</p>
        <div className="card-grid option-grid">
          {deliveryOptions.map((option) => (
            <article key={option.title} className="card option-card">
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              <p className="best-when">{option.bestWhen}</p>
            </article>
          ))}
        </div>
        <p className="safe-note">
          Safety boundary: existing repository updates never write directly to the default branch. The app always opens a
          pull request so a human can review and merge.
        </p>
      </section>

      <section className="card flow-grid">
        <article>
          <h2>Workflow overview</h2>
          <Image src="/images/workflow-overview.svg" alt="Workflow from user inputs through template orchestration and validation to final delivery artifacts" width={1200} height={420} />
        </article>
        <article>
          <h2>Delivery decision flow</h2>
          <Image src="/images/delivery-mode-flow.svg" alt="Decision tree for choosing ZIP, new GitHub repository, or existing repository PR delivery mode" width={1000} height={620} />
        </article>
      </section>

      <ProjectWizard />
    </main>
  );
}
