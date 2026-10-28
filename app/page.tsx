import Hero from '@/components/Hero';
import Formats from '@/components/Formats';
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
    <aside className="editorial-rail" aria-hidden="true"><span className="rail-monogram">Z.</span><span className="rail-title">Pizza Zio · La franchise</span><span className="rail-line"><span className="reading-progress" /></span><span className="rail-year">{franchiseData.foundingYear}</span></aside>
    <div className="site-shell"><header className="site-header" id="haut"><div className="header-inner"><a className="brand" href="#haut" aria-label="Pizza Zio, accueil">Pizza <span>Zio</span><span aria-hidden="true">.</span></a><nav aria-label="Navigation principale"><a href="#concept">La maison</a><a href="#profil">Votre profil</a><a href="#questions">Les questions</a></nav><a href="#projet" className="header-cta">Votre projet <span aria-hidden="true">↗</span></a></div></header>
    <main id="contenu"><Hero available={isLeadIntakeReady()} /><Story /><Profile /><Formats /><Steps /><FAQ /><LeadForm available={isLeadIntakeReady()} /></main>
    <Footer /></div>
  </>;
}
