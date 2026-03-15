import type { ReactNode } from 'react';

export function ExecutionDrawer({ state, children }: { state: string; children: ReactNode }) {
  return (
    <section className={`execution-drawer execution-drawer--${state}`}>
      <header>
        <h3>Execution ledger</h3>
        <span>{state.toUpperCase()}</span>
      </header>
      <div className="execution-drawer__body">{children}</div>
    </section>
  );
}
