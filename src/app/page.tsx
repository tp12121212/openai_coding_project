import { MetaStrip } from '@/components/meta-strip';
import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <section>
      <header className="intro-sheet">
        <p className="intro-sheet__kicker">Project delivery workspace</p>
        <h2>Project Scaffold Delivery Console</h2>
        <p>
          Generate structured project files, delivery bundles, and repository-safe outputs for build execution in ChatGPT,
          Codex, and GitHub workflows.
        </p>
        <MetaStrip
          items={[
            'Deterministic file generation',
            'Delivery-mode specific safeguards',
            'Repository-safe existing-repo updates'
          ]}
        />
      </header>

      <ProjectWizard />
    </section>
  );
}
