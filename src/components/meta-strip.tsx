import type { ReactNode } from 'react';

export function MetaStrip({ items }: { items: ReactNode[] }) {
  return (
    <div className="meta-strip">
      {items.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </div>
  );
}
