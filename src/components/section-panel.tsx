import type { ReactNode } from 'react';

interface SectionPanelProps {
  title: string;
  description?: string;
  tone?: 'default' | 'muted' | 'raised';
  children: ReactNode;
}

export function SectionPanel({ title, description, tone = 'default', children }: SectionPanelProps) {
  const toneClass = tone === 'muted' ? 'panel--muted' : tone === 'raised' ? 'panel--raised' : '';

  return (
    <section className={`panel ${toneClass}`.trim()}>
      <header className="section-header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
