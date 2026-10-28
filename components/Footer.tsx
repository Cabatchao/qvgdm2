import Link from 'next/link';
import { franchiseData } from '@/data/franchiseData';

export default function Footer() {
  return <footer className="site-footer"><div className="section footer-grid"><div><a className="brand footer-brand" href="#haut">pizza <strong>zio</strong>{' '}<span>Depuis {franchiseData.foundingYear}</span></a><p>Une histoire italienne,<br />née à {franchiseData.firstCity}.</p></div><nav aria-label="Liens utiles"><a href="#concept">L’enseigne</a><a href="#profil">Votre profil</a><a href="#projet">Votre projet</a><Link href="/confidentialite">Données personnelles</Link><Link href="/mentions-legales">Mentions légales</Link></nav><p className="footer-note">Les conditions d’accès à la franchise, les territoires et les informations financières actuelles sont à confirmer par l’équipe Pizza Zio.</p></div></footer>;
}
