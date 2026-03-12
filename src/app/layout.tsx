import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codex Project Scaffold Manager',
  description: 'Deterministic scaffolding for ChatGPT/Codex coding projects'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
