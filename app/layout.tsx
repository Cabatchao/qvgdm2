import './globals.css';
import './motion.css';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Devenir franchisé Pizza Zio — Présentez votre projet',
  description: 'Découvrez Pizza Zio, enseigne née à Roubaix en 1983, et présentez votre projet de pizzeria : parcours, implantation et préparation de votre financement.',
  applicationName: 'Pizza Zio Franchise',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Votre projet de franchise Pizza Zio',
    description: 'Une histoire italienne, née à Roubaix. Découvrez l’enseigne et préparez votre projet de pizzeria.',
    locale: 'fr_FR',
    type: 'website',
    siteName: 'Pizza Zio Franchise',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
