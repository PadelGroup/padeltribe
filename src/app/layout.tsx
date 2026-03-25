import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoPadel — Your Padel Community',
  description: 'Create and manage your padel community, organize tournaments, and track rankings.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
