import type { ReactNode } from 'react';

export function MarginNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="margin-note">
      <h4>{title}</h4>
      <div>{children}</div>
    </article>
  );
}
