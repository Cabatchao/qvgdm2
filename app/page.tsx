import Hero from '@/components/Hero';
import Formats from '@/components/Formats';
import Profile from '@/components/Profile';
import Steps from '@/components/Steps';
import Story from '@/components/Story';
import FAQ from '@/components/FAQ';
import LeadForm from '@/components/LeadForm';
import Footer from '@/components/Footer';
import Immersion from '@/components/Immersion';
import Network from '@/components/Network';
import FranchiseTerms from '@/components/FranchiseTerms';
import Script from 'next/script';
import { cinemaEnabled } from '@/lib/visualPack';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { publicSearchOrigin } from '@/lib/launchSeo';
import { getLeadConfig, isLeadIntakeReady } from '@/lib/leadConfig';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const origin = publicSearchOrigin(getLeadConfig()?.origin, (await headers()).get('host'),
    process.env.LEAD_INDEXING_ENABLED, process.env.VERCEL_ENV);
  if (!origin) return { robots: { index: false, follow: false } };
  return { robots: { index: true, follow: true }, alternates: { canonical: origin + '/' } };
}

export default function Page() {
  const available = isLeadIntakeReady();
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="site-shell">
        <header className="site-header" id="haut">
          <div className="header-inner">
            <a className="brand" href="#haut" aria-label="Pizza Zio, accueil">
              Pizza <span>Zio</span>
              <span aria-hidden="true">.</span>
            </a>
            <nav aria-label="Navigation principale">
              <a href="#concept">La maison</a>
              <a href="#restaurants">Nos restaurants</a>
              <a href="#franchise">La franchise</a>
              <a href="#questions">Vos questions</a>
            </nav>
            <a href="#projet" className="header-cta">
              Votre projet <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>
        <main id="contenu">
          <Hero available={available} film={cinemaEnabled} />
          <Story />
          <Network />
          <Immersion />
          <Formats available={available} />
          <FranchiseTerms />
          <Profile />
          <Steps available={available} />
          <FAQ available={available} />
          <LeadForm available={available} />
        </main>
        <Footer applicationOpen={available} />
      </div>
      {cinemaEnabled && (
        <Script src="/presentation.js" strategy="afterInteractive" />
      )}
    </>
  );
}
