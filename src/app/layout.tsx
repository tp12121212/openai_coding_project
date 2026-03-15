import './globals.css';
import type { Metadata } from 'next';
import { DossierFrame } from '@/components/dossier-frame';

export const metadata: Metadata = {
  title: 'Deterministic Delivery Dossier',
  description: 'Handbook-driven scaffold orchestration and controlled GitHub delivery'
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
