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

export default function Page(){
  return <main><Hero/><section className='section'><h2 className='text-3xl font-bold'>Vous voulez entreprendre dans la restauration avec un concept déjà structuré ?</h2><p className='mt-4'>Ouvrir une pizzeria seul peut être complexe : choix du local, identité de marque, fournisseurs, communication, organisation, acquisition clients et lancement commercial. Avec Pizza Zio, vous rejoignez une enseigne familiale déjà implantée, avec un concept clair, une histoire forte et un accompagnement pensé pour aider les franchisés à ouvrir dans de bonnes conditions.</p></section><WhyZio/><Stats/><Formats/><Zones/><Profile/><Steps/><Story/><FAQ/><LeadForm/><Footer/></main>
}
