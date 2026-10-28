import { franchiseData } from '@/data/franchiseData';
import EditorialPhoto from './EditorialPhoto';

export default function Story() {
  return <section id="concept" className="section story-section" aria-labelledby="story-title">
    <div className="section-index"><span>01</span><p>La maison</p><span aria-hidden="true">↘</span></div>
    <div className="story-heading" data-reveal><p className="eyebrow">De la Calabre à Roubaix</p><h2 id="story-title">Une histoire italienne.<br /><em>Une table à partager.</em></h2></div>
    <div className="story-layout">
      <figure className="restaurant-figure" data-reveal><EditorialPhoto name="restaurant" alt="La salle et le comptoir d’un restaurant Pizza Zio." /><figcaption>À l’intérieur de Pizza Zio.</figcaption></figure>
      <div className="story-text" data-reveal><p className="large-copy">Tout commence en {franchiseData.foundingYear}, quand {franchiseData.founder}, originaire de {franchiseData.origin}, ouvre sa première pizzeria à {franchiseData.firstCity}.</p><p>Aujourd’hui, votre projet peut écrire une nouvelle page de cette histoire italienne, ancrée dans le Nord.</p><dl className="menu-facts"><div><dt>Les racines</dt><dd>{franchiseData.origin}</dd></div><div><dt>La première adresse</dt><dd>{franchiseData.firstCity}</dd></div><div><dt>Le début de l’histoire</dt><dd>{franchiseData.foundingYear}</dd></div></dl></div>
    </div>
  </section>;
}
