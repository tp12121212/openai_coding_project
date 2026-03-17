import './globals.css';
import type { Metadata } from 'next';
import { DossierFrame } from '@/components/dossier-frame';

export const metadata: Metadata = {
  title: 'Project Scaffold Delivery Console',
  description: 'Generate structured project files, delivery bundles, and repository-safe outputs.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DossierFrame>{children}</DossierFrame>
      </body>
    </html>
  );
}
