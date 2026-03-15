import type { ReactNode } from 'react';

export function DocsLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <section className="docs-layout">
      <div className="docs-main">{children}</div>
      <aside className="docs-side">{aside}</aside>
    </section>
  );
}
