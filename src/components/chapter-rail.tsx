import Link from 'next/link';

export interface ChapterRailItem {
  href: string;
  label: string;
  note: string;
}

export function ChapterRail({ title, items, activeHref }: { title: string; items: ChapterRailItem[]; activeHref: string }) {
  return (
    <aside className="chapter-rail" aria-label={title}>
      <p className="chapter-rail__title">{title}</p>
      <ol>
        {items.map((item, index) => {
          const isActive = activeHref === item.href;
          return (
            <li key={item.label}>
              <Link href={item.href} className={isActive ? 'is-active' : ''}>
                <span className="chapter-rail__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="chapter-rail__label">{item.label}</span>
                <small>{item.note}</small>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="chapter-rail__footnote">PR-only repository updates are enforced for existing targets.</p>
    </aside>
  );
}
