import Link from 'next/link';

export function AppTopbar() {
  return (
    <header className="topbar">
      <div>
        <p className="topbar-kicker">Classification & DLP automation</p>
        <h1>Operator Workstation</h1>
      </div>
      <nav className="topbar-nav" aria-label="Workspace links">
        <Link href="/">Workspace</Link>
        <Link href="/help">Help</Link>
      </nav>
      <div className="topbar-status" aria-label="Runtime status">
        <span className="status-dot" />
        Deterministic generation active
      </div>
    </header>
  );
}
