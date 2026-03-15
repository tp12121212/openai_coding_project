import { DocsLayout } from '@/components/docs-layout';

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: 'This workstation runs deterministic scaffold orchestration for classification and DLP automation projects. Use it to generate reproducible outputs before promoting changes into GitHub repositories.'
  },
  {
    id: 'how-system-works',
    title: 'How the system works',
    items: [
      'Capture operator inputs for project metadata, template, and delivery mode.',
      'Resolve template and profile data into deterministic scaffold instructions.',
      'Run path-safety and collision checks before any write operation.',
      'Generate output in stable ordering and return structured result payloads.'
    ]
  },
  {
    id: 'delivery-modes',
    title: 'Delivery modes',
    items: [
      'ZIP export: local artifact download with no GitHub requirement.',
      'Create repository: provision a new repo and commit scaffold output.',
      'Existing repository PR: open a branch and pull request without direct default-branch writes.'
    ]
  },
  {
    id: 'typical-workflow',
    title: 'Typical workflow',
    items: [
      'Start in ZIP mode and inspect generated files.',
      'Adjust template, category, and profile values until output is acceptable.',
      'Switch to a GitHub delivery mode and verify repository targeting.',
      'Run orchestration and inspect JSON result payload before promotion.'
    ]
  },
  {
    id: 'github-authentication',
    title: 'GitHub authentication',
    items: [
      'Required OAuth scope: read:user user:email repo.',
      'Use Re-authorize when token scopes or installation permissions change.',
      'GitHub delivery controls are disabled if runtime auth variables are missing.'
    ]
  },
  {
    id: 'safety-guardrails',
    title: 'Safety guardrails',
    items: [
      'Existing repository updates are pull-request only.',
      'Path traversal and unsafe output paths are blocked before generation.',
      'File collisions are skipped rather than overwritten in existing repositories.'
    ]
  },
  {
    id: 'templates-and-profiles',
    title: 'Templates and profiles',
    body: 'Templates define structural scaffolding. Category, profile, and prompt pack selections constrain generated content shape. Keep these settings explicit so run-to-run output stays deterministic.'
  },
  {
    id: 'output-artifacts',
    title: 'Output artifacts',
    items: [
      'Scaffold files returned in stable deterministic ordering.',
      'Repository baseline files (.gitignore, .editorconfig, CI metadata) when applicable.',
      'Execution payload with job state, delivery metadata, and any surfaced errors.'
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      'GitHub controls unavailable: verify runtime auth variables and restart.',
      'Repository list empty: check account access and run Re-authorize.',
      'Execution failed: inspect console payload, correct inputs, and rerun orchestration.'
    ]
  }
] as const;

export default function HelpPage() {
  return (
    <section className="help-page">
      <header className="page-header">
        <p className="kicker">Operator documentation</p>
        <h2>Runbook for deterministic delivery operations</h2>
        <p>Direct technical guidance for session setup, delivery selection, and failure recovery.</p>
      </header>

      <DocsLayout
        aside={
          <section className="panel panel--muted">
            <header className="section-header">
              <h3>Quick reference</h3>
              <p>Use this index to jump to operational topics.</p>
            </header>
            <ol className="toc-list">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </section>
        }
      >
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="doc-section">
            <h3>{section.title}</h3>
            {'body' in section ? <p>{section.body}</p> : null}
            {'items' in section ? (
              <ul className="compact-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </DocsLayout>
    </section>
  );
}
