import type { ReactNode } from 'react';

export function MetricChip({ children }: { children: ReactNode }) {
  return <span className="summary-chip">{children}</span>;
}
