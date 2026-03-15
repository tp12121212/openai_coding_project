'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChapterRail } from '@/components/chapter-rail';

const frameChapters = [
  { href: '/', label: 'Live dossier', note: 'Guided scaffold procedure' },
  { href: '/help', label: 'Operating manual', note: 'Reference and troubleshooting' }
];

export function DossierFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dossier-frame">
      <header className="masthead">
        <div>
          <p className="masthead__kicker">Deterministic Scaffold Atlas</p>
          <h1>Delivery Dossier</h1>
        </div>
        <nav aria-label="Global navigation">
          <Link href="/">Dossier</Link>
          <Link href="/help">Help</Link>
        </nav>
        <p className="masthead__meta">branch-safe · review-first · deterministic</p>
      </header>

      <div className="dossier-frame__body">
        <ChapterRail title="Publication index" items={frameChapters} activeHref={pathname === '/help' ? '/help' : '/'} />
        <main className="document-stage">{children}</main>
      </div>
    </div>
  );
}
