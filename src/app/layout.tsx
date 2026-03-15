import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Codex Project Scaffold Manager',
  description: 'Deterministic scaffolding for ChatGPT/Codex coding projects'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-brand">
              <p className="eyebrow">Engineering Platform</p>
              <p className="product-name">Codex Project Orchestration Manager</p>
            </div>
            <nav className="topbar-nav" aria-label="Primary">
              <Link href="/">Workspace</Link>
              <Link href="/help">Help</Link>
            </nav>
          </header>
          <div className="shell-body">{children}</div>
        </div>
      </body>
    </html>
  );
}
