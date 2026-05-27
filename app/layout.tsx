import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pizza Zio Franchise',
  description: 'Landing page de recrutement franchisés Pizza Zio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
