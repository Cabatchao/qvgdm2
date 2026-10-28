import { franchiseData } from '@/data/franchiseData';
import EditorialPhoto from './EditorialPhoto';

export default function Hero({ available = false }: { available?: boolean }) {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy-column">
      <p className="eyebrow" data-hero-reveal>La carte des futurs franchisés <span aria-hidden="true">✳</span></p>
      <h1 id="hero-title" data-hero-reveal="2">L’Italie{' '}<br />en héritage.<br /><em>L’envie<br className="hero-title-break" /> d’entreprendre.</em></h1>
      <div className="hero-introduction" data-hero-reveal="3">
        <p>Une enseigne née à {franchiseData.firstCity}.<br />Découvrez Pizza Zio et préparez<br className="desktop-break" /> votre projet de pizzeria.</p>
        <a className="cta hero-cta" href="#projet">{available ? 'Présenter mon projet' : 'Préparer mon projet'}<span aria-hidden="true">↗</span></a>
        <a className="hero-discover" href="#concept">L’histoire commence ici <span aria-hidden="true">↓</span></a>
      </div>
    </div>
    <figure className="hero-visual" data-hero-reveal="2">
      <EditorialPhoto name="pizza" priority alt="Une pizza garnie et une assiette de pâtes sur une table en bois." />
      <figcaption><span>À la table de Pizza Zio</span><span>Depuis {franchiseData.foundingYear}</span></figcaption>
      <span className="hero-photo-label" aria-hidden="true">Buon appetito.</span>
    </figure>
    <div className="cover-foot"><span>Racines italiennes. Esprit du Nord.</span><span>La carte · Franchise Pizza Zio</span></div>
  </section>;
}
