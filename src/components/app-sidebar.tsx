'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Workspace', detail: 'Run orchestration and review payloads', activePath: '/' },
  { href: '/', label: 'Delivery Modes', detail: 'ZIP, new repo, existing repo PR' },
  { href: '/', label: 'Templates', detail: 'Inspect template and profile context' },
  { href: '/help', label: 'Help', detail: 'Operator runbook and troubleshooting', activePath: '/help' }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Product navigation">
      <p className="sidebar-title">Product areas</p>
      <ul>
        {navItems.map((item) => {
          const isActive = item.activePath
            ? pathname === item.activePath || pathname.startsWith(`${item.activePath}/`)
            : false;

          return (
            <li key={`${item.label}-${item.href}`}>
              <Link href={item.href} className={isActive ? 'is-active' : ''}>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </Link>
            </li>
          );
        })}
      </ul>
      <section className="sidebar-footnote">
        <h2>Safety baseline</h2>
        <p>Existing repository updates are branch + pull-request only, never direct default-branch writes.</p>
      </section>
    </aside>
  );
}
