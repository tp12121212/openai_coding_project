import type { ReactNode } from 'react';

export function StatusStrip({ children }: { children: ReactNode }) {
  return <section className="status-strip">{children}</section>;
}
