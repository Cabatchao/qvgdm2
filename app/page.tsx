import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import WhyZio from '@/components/WhyZio';
import Formats from '@/components/Formats';
import Zones from '@/components/Zones';
import Profile from '@/components/Profile';
import Steps from '@/components/Steps';
import Story from '@/components/Story';
import FAQ from '@/components/FAQ';
import LeadForm from '@/components/LeadForm';
import Footer from '@/components/Footer';
import { franchiseData } from '@/data/franchiseData';
import { isLeadIntakeReady } from '@/lib/leadConfig';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <header className="site-header" id="haut"><div className="header-inner"><a className="brand" href="#haut">pizza <strong>zio</strong>{' '}<span>Depuis {franchiseData.foundingYear}</span></a><nav aria-label="Navigation principale"><a href="#concept">L’enseigne</a><a href="#profil">Votre profil</a><a href="#questions">Questions</a></nav><a href="#projet" className="cta header-cta">Votre projet <span aria-hidden="true">↗</span></a></div></header>
    <main id="contenu"><Hero /><WhyZio /><Profile /><Formats /><div className="section financial-section"><Stats /></div><Story /><Zones /><Steps /><FAQ /><LeadForm available={isLeadIntakeReady()} /></main>
    <Footer />
  </>;
}
