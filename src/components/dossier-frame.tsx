'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const topMenuItems = [
  { href: '/', label: 'Create project files', note: 'Configure generation and delivery outputs' },
  { href: '/help', label: 'Operating manual', note: 'Reference, safeguards, and troubleshooting' }
] as const;

export function DossierFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dossier-frame">
      <header className="masthead">
        <div>
          <p className="masthead__kicker">Project scaffold workspace</p>
          <h1>Project Scaffold Delivery Console</h1>
          <p className="masthead__subtitle">
            Generate structured project files, delivery bundles, and repository-safe outputs for ChatGPT, Codex, and GitHub workflows.
          </p>
        </div>
      </header>

      <nav className="floating-top-menu" aria-label="Global navigation">
        {topMenuItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={isActive ? 'is-active' : ''}>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </Link>
          );
        })}
      </nav>

      <div className="dossier-frame__body">
        <main className="document-stage">{children}</main>
      </div>
    </div>
  );
}
