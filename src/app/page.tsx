import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <main>
      <h1>Codex Project Orchestration Manager</h1>
      <p>
        Deterministic project scaffolding with optional GitHub repository automation and explicit manual
        bootstrap flow for unsupported ChatGPT internal project creation.
      </p>
      <ProjectWizard />
    </main>
  );
}
