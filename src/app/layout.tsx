import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Codex Orchestration Console',
  description: 'Deterministic scaffold orchestration and controlled GitHub delivery'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="console-root">
          <header className="console-topbar">
            <div className="console-brand">
              <p>Engineering Control Plane</p>
              <h1>Codex Orchestration Console</h1>
            </div>
            <nav className="console-utility-nav" aria-label="Utility navigation">
              <Link href="/">Workspace</Link>
              <Link href="/help">Help</Link>
            </nav>
          </header>

          <div className="console-frame">
            <aside className="console-rail" aria-label="Primary sections">
              <Link href="/">Orchestration Workspace</Link>
              <Link href="/help">Operator Help</Link>
              <div className="rail-note">
                <h2>Execution policy</h2>
                <p>Deterministic scaffold generation with ZIP, new repo, and existing repo PR delivery paths.</p>
              </div>
            </aside>

            <main className="console-main">{children}</main>

            <aside className="console-reference" aria-label="Reference context">
              <h2>Operational baseline</h2>
              <dl>
                <div>
                  <dt>Branch safety</dt>
                  <dd>Existing repository mode is PR-only.</dd>
                </div>
                <div>
                  <dt>Execution sequence</dt>
                  <dd>Configure → Validate → Deliver → Review.</dd>
                </div>
                <div>
                  <dt>Artifact behavior</dt>
                  <dd>Outputs are stable and reusable across runs.</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </body>
    </html>
  );
}
