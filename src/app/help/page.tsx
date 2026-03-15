import type { ReactNode } from 'react';

const helpSections: Array<{ title: string; content: ReactNode }> = [
  {
    title: 'Introduction',
    content: (
      <p>
        This console is for operators who need predictable project scaffolding and controlled GitHub delivery. Every run
        uses explicit input values and returns structured output so you can inspect exactly what was generated and where
        it was delivered.
      </p>
    )
  },
  {
    title: 'How the system works',
    content: (
      <ol>
        <li>Capture project, template, and delivery settings in the workspace.</li>
        <li>Resolve template and profile configuration for the selected category.</li>
        <li>Generate files using deterministic ordering and fixed payload structure.</li>
        <li>Run path, collision, and delivery safety checks.</li>
        <li>Deliver output as ZIP, new repo commit, or existing repo pull request.</li>
      </ol>
    )
  },
  {
    title: 'Delivery modes',
    content: (
      <>
        <h4>Download ZIP</h4>
        <p>Use this when you need an offline review loop. No GitHub authentication is required.</p>
        <h4>Create GitHub repository</h4>
        <p>Use this for approved greenfield repositories. The system creates the repo and commits scaffold output.</p>
        <h4>Update existing repository via pull request</h4>
        <p>Use this for additive updates. The system creates a branch and opens a PR instead of writing to default branch.</p>
      </>
    )
  },
  {
    title: 'Typical workflow',
    content: (
      <ol>
        <li>Start with ZIP mode and inspect generated files.</li>
        <li>Adjust template and category values until output is correct.</li>
        <li>Switch to new repo or existing repo PR delivery.</li>
        <li>Review console payload, branch, and PR metadata before promotion.</li>
      </ol>
    )
  },
  {
    title: 'GitHub authentication',
    content: (
      <ul>
        <li>Required scope: <code>read:user user:email repo</code>.</li>
        <li>Repository operations are disabled when runtime auth variables are missing.</li>
        <li>If scopes are reduced or token access changes, use Re-authorize and run the job again.</li>
      </ul>
    )
  },
  {
    title: 'Safety guardrails',
    content: (
      <ul>
        <li>Existing repository mode is non-destructive and always PR-based.</li>
        <li>Collision checks skip existing files instead of overwriting them.</li>
        <li>Unsafe paths are blocked before delivery starts.</li>
      </ul>
    )
  },
  {
    title: 'Templates and profiles',
    content: (
      <p>
        Templates define initial structure and baseline files. Category and profile selections shape generated content.
        Keep these values explicit in each run so review and troubleshooting stay reproducible.
      </p>
    )
  },
  {
    title: 'Output artifacts',
    content: (
      <ul>
        <li>Scaffolded project files in deterministic order.</li>
        <li>Repository hygiene files such as <code>.gitignore</code> and <code>.editorconfig</code>.</li>
        <li>Structured job payload with state, result metadata, and delivery details.</li>
      </ul>
    )
  },
  {
    title: 'Troubleshooting',
    content: (
      <>
        <h4>GitHub buttons unavailable</h4>
        <p>Check runtime config for NEXTAUTH and GitHub client variables. ZIP mode stays available.</p>
        <h4>Repository list is empty</h4>
        <p>Confirm account access, then re-authorize if repo listing capability is missing.</p>
        <h4>Job failed</h4>
        <p>Read the console payload, correct invalid inputs, and run again.</p>
      </>
    )
  }
];

export default function HelpPage() {
  return (
    <section className="help-layout">
      <header className="help-header">
        <p className="section-kicker">Operator documentation</p>
        <h2>Help and operating guidance</h2>
        <p>Use this page when running scaffold orchestration jobs in production or pre-production environments.</p>
      </header>

      <div className="help-grid">
        {helpSections.map((section) => (
          <section key={section.title} className="help-module">
            <h3>{section.title}</h3>
            {section.content}
          </section>
        ))}
      </div>
    </section>
  );
}
