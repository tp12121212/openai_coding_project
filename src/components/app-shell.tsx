import type { ReactNode } from 'react';
import { AppTopbar } from '@/components/app-topbar';
import { AppSidebar } from '@/components/app-sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppTopbar />
      <div className="app-frame">
        <AppSidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
