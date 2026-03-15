import { MetaStrip } from '@/components/meta-strip';
import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <section>
      <header className="intro-sheet">
        <p className="intro-sheet__kicker">Operating dossier</p>
        <h2>Deterministic scaffold delivery, authored as a guided procedural atlas.</h2>
        <p>
          Configure session state, define project intent, and execute branch-safe delivery from a structured handbook
          surface.
        </p>
        <MetaStrip
          items={[
            'Deterministic generation',
            'Branch-safe delivery',
            'Review-first workflow'
          ]}
        />
      </header>

      <ProjectWizard />
    </section>
  );
}
