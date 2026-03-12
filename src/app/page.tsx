import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <main>
      <h1>Codex Project Scaffold Manager</h1>
      <p>
        Create deterministic ChatGPT/Codex project scaffolds with manifest export/import readiness and
        built-in prompt packs.
      </p>
      <ProjectWizard />
    </main>
  );
}
