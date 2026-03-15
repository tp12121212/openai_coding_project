'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Orchestration', detail: 'Session, inputs, delivery, execution', activePath: '/' },
  { href: '/', label: 'Templates', detail: 'Profile and prompt-pack context' },
  { href: '/', label: 'Automation boundary', detail: 'Safety, auth, and delivery constraints' },
  { href: '/help', label: 'Operator docs', detail: 'Runbook and troubleshooting', activePath: '/help' }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="Product navigation">
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
      <section className="sidebar-note">
        <h2>Guardrail</h2>
        <p>Existing repository updates always run through branch and pull-request delivery.</p>
      </section>
    </aside>
  );
}
