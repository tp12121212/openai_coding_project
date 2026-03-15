import type { ReactNode } from 'react';

export function ProcedureSheet({
  chapter,
  title,
  description,
  children
}: {
  chapter: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="procedure-sheet">
      <header>
        <p>{chapter}</p>
        <h3>{title}</h3>
        <p className="procedure-sheet__description">{description}</p>
      </header>
      {children}
    </section>
  );
}
