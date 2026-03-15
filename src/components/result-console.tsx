import type { ReactNode } from 'react';

export function ResultConsole({ title, state, children }: { title: string; state: string; children: ReactNode }) {
  return (
    <section className={`execution-console execution-console--${state}`}>
      <header>
        <h3>{title}</h3>
        <span>{state.toUpperCase()}</span>
      </header>
      <div className="execution-console__body">{children}</div>
    </section>
  );
}
