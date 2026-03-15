import Link from 'next/link';

export function AppTopbar() {
  return (
    <header className="app-topbar">
      <div className="topbar-brand">
        <p className="topbar-eyebrow">Deterministic delivery control plane</p>
        <h1>Codex Operator Console</h1>
      </div>
      <nav className="topbar-nav" aria-label="Workspace navigation">
        <Link href="/">Workspace</Link>
        <Link href="/help">Help</Link>
      </nav>
      <p className="topbar-status">Template resolve → validate → deliver</p>
    </header>
  );
}
