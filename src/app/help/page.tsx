const sections = [
  {
    title: 'Introduction',
    body:
      'Use this console when you need deterministic scaffold generation and controlled repository delivery. Every run uses explicit inputs and returns structured metadata for review.'
  },
  {
    title: 'How the system works',
    items: [
      'Capture project inputs and delivery settings.',
      'Resolve template and profile rules.',
      'Generate files in deterministic order.',
      'Run path and collision safety checks.',
      'Deliver via ZIP, new repository, or existing-repository pull request.'
    ]
  },
  {
    title: 'Delivery modes',
    items: [
      'ZIP export: local inspection loop, no GitHub auth required.',
      'Create new repository: creates and initializes a repo, then commits scaffold output.',
      'Update existing repository: creates a branch and PR with non-colliding files only.'
    ]
  },
  {
    title: 'Typical workflow',
    items: [
      'Run ZIP mode first and inspect artifacts.',
      'Adjust template/category/profile until output is acceptable.',
      'Switch to GitHub delivery mode.',
      'Review payload, branch, and PR metadata before promotion.'
    ]
  },
  {
    title: 'GitHub authentication',
    items: [
      'Required scope: read:user user:email repo.',
      'If scopes or token access change, use Re-authorize and rerun.',
      'GitHub operations are disabled when runtime auth variables are missing.'
    ]
  },
  {
    title: 'Safety guardrails',
    items: [
      'Existing repository mode never writes directly to the default branch.',
      'Collision checks skip existing files rather than overwrite.',
      'Unsafe path patterns are blocked before delivery starts.'
    ]
  },
  {
    title: 'Templates and profiles',
    body:
      'Templates define base file structure. Category and profile control generated content shape. Keep selections explicit so run-to-run review stays reproducible.'
  },
  {
    title: 'Output artifacts',
    items: [
      'Generated scaffold files in stable order.',
      'Baseline repository files such as .gitignore and .editorconfig.',
      'Structured execution payload with result and delivery metadata.'
    ]
  },
  {
    title: 'Troubleshooting',
    items: [
      'GitHub controls unavailable: check runtime auth configuration.',
      'Repository list empty: verify account access, then re-authorize.',
      'Execution failure: inspect console payload, correct inputs, rerun.'
    ]
  }
] as const;

export default function HelpPage() {
  return (
    <section className="help-page">
      <header className="workspace-header">
        <p className="section-kicker">Help</p>
        <h2>Operator guide for deterministic scaffold delivery</h2>
        <p>Direct runbook guidance for production and pre-production orchestration workflows.</p>
      </header>

      <div className="help-layout-grid">
        {sections.map((section) => (
          <section key={section.title} className="panel help-section">
            <h3 className="panel-title">{section.title}</h3>
            {'body' in section ? <p>{section.body}</p> : null}
            {'items' in section ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </section>
  );
}
