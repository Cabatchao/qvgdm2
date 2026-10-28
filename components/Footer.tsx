import Link from 'next/link';
import { franchiseData } from '@/data/franchiseData';

export default function Footer() {
  return <footer className="site-footer"><div className="section footer-top"><a href="#haut" className="footer-wordmark" aria-label="Pizza Zio, retour en haut">Pizza <span>Zio</span><span className="wordmark-dot" aria-hidden="true">.</span></a><p>Racines italiennes.<br />Esprit du Nord.<br /><span>Depuis {franchiseData.foundingYear}.</span></p></div><div className="section footer-bottom"><span>Franchise Pizza Zio</span><nav aria-label="Liens utiles"><Link href="/confidentialite">Données personnelles</Link><Link href="/mentions-legales">Mentions légales</Link><a href="#haut">Retour en haut ↑</a></nav></div></footer>;
}
