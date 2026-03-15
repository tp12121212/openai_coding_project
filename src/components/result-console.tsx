import type { ReactNode } from 'react';

export function ResultConsole({ title, state, children }: { title: string; state: string; children: ReactNode }) {
  return (
    <section className={`result-console result-console--${state}`}>
      <header>
        <h3>{title}</h3>
        <span>{state.toUpperCase()}</span>
      </header>
      <div className="result-console__body">{children}</div>
    </section>
  );
}
