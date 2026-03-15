import type { ReactNode } from 'react';

export function ManualLayout({ rail, children, quickRef }: { rail: ReactNode; children: ReactNode; quickRef?: ReactNode }) {
  return (
    <section className="manual-layout">
      <aside>{rail}</aside>
      <div className="reading-column">{children}</div>
      <aside className="quick-reference">{quickRef}</aside>
    </section>
  );
}
