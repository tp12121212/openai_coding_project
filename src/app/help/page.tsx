import { ManualLayout } from '@/components/manual-layout';

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: 'This application provides deterministic scaffold generation for classification and DLP automation projects. It is designed for repeatable output, controlled delivery, and review-first change promotion.'
  },
  {
    id: 'how-system-works',
    title: 'How the system works',
    items: [
      'Capture operator inputs for project metadata, template selection, and delivery mode.',
      'Resolve template and profile settings into deterministic generation instructions.',
      'Run path-safety and repository guards before write operations.',
      'Return a stable execution payload with delivery metadata and errors when present.'
    ]
  },
  {
    id: 'delivery-modes',
    title: 'Delivery modes',
    items: [
      'ZIP export: local artifact download with no GitHub authentication requirement.',
      'Create repository: provision a repository and commit generated scaffold files.',
      'Existing repository PR: open a branch and pull request without direct default-branch writes.'
    ]
  },
  {
    id: 'typical-workflow',
    title: 'Typical workflow',
    items: [
      'Run in ZIP mode first and inspect generated file structure.',
      'Adjust template, category, and profile until outputs match expectations.',
      'Switch to the required GitHub delivery path and validate repository targeting.',
      'Run orchestration and verify the execution ledger before promotion.'
    ]
  },
  {
    id: 'github-authentication',
    title: 'GitHub authentication',
    items: [
      'Required OAuth scope: read:user user:email repo.',
      'Use Re-authorize when token scopes or installation permissions change.',
      'GitHub delivery controls are disabled when runtime auth variables are missing.'
    ]
  },
  {
    id: 'safety-guardrails',
    title: 'Safety guardrails',
    items: [
      'Existing repository updates are pull-request only.',
      'Path traversal and unsafe output paths are blocked before generation.',
      'File collisions in existing repositories are skipped rather than overwritten.'
    ]
  },
  {
    id: 'templates-and-profiles',
    title: 'Templates and profiles',
    body: 'Templates define structural scaffolding. Category, profile, and prompt-pack selections constrain generated content shape and keep output deterministic across runs.'
  },
  {
    id: 'output-artifacts',
    title: 'Output artifacts',
    items: [
      'Scaffold files in stable deterministic ordering.',
      'Baseline repository files when repository delivery modes are selected.',
      'Execution payload with job state, delivery metadata, and surfaced errors.'
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      'GitHub controls unavailable: verify runtime auth variables and restart.',
      'Repository list empty: check account access, then run Re-authorize.',
      'Execution failed: inspect the ledger payload, correct inputs, and rerun.'
    ]
  }
] as const;

export default function HelpPage() {
  return (
    <section>
      <header className="intro-sheet intro-sheet--manual">
        <p className="intro-sheet__kicker">Operating manual</p>
        <h2>Handbook guidance for deterministic delivery operations</h2>
        <p>Direct technical documentation for setup, delivery decisions, safeguards, and failure recovery.</p>
      </header>

      <ManualLayout
        rail={
          <nav className="manual-rail" aria-label="Manual chapters">
            <p>Chapters</p>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        }
        quickRef={
          <div>
            <h3>Quick reference</h3>
            <ul>
              <li>Deterministic output ordering is always enforced.</li>
              <li>Existing repository changes ship via branch + PR only.</li>
              <li>ZIP mode is the fastest path for dry-run verification.</li>
            </ul>
          </div>
        }
      >
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="manual-section">
            <h3>{section.title}</h3>
            {'body' in section ? <p>{section.body}</p> : null}
            {'items' in section ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </ManualLayout>
    </section>
  );
}
