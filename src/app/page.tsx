import { ProjectWizard } from '@/components/project-wizard';

export default function HomePage() {
  return (
    <main>
      <h1>Codex Project Orchestration Manager</h1>
      <p>
        Deterministic scaffold generation with three delivery modes: zip bundle download, new GitHub repository
        creation, and non-destructive existing repository PR updates.
      </p>
      <ProjectWizard />
    </main>
  );
}
