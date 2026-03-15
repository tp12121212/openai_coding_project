import type { ReactNode } from 'react';

export function WorkspacePanel({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="panel workspace-panel">
      <header className="panel-header">
        <h3 className="panel-title">{title}</h3>
        {meta ? <p className="panel-meta">{meta}</p> : null}
      </header>
      {children}
    </section>
  );
}
