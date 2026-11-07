import './globals.css';
import './motion.css';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Devenir franchisé Pizza Zio — Présentez votre projet',
  description: 'Présentez votre projet de franchise Pizza Zio dans le Nord (59). Découvrez les formats à emporter ou avec restaurant, l’enseigne et les étapes de candidature.',
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
