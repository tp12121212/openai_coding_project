import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Operator Workstation',
  description: 'Deterministic scaffold orchestration and controlled GitHub delivery'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
