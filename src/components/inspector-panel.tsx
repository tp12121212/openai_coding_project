import type { ReactNode } from 'react';

export function InspectorPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel inspector-panel">
      <h3 className="panel-title">{title}</h3>
      {children}
    </section>
  );
}
