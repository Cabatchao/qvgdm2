import { franchiseData } from '@/data/franchiseData';

export default function WhyZio() {
  return <section id="concept" className="section" aria-labelledby="concept-title">
    <div className="section-heading"><p className="eyebrow">L’enseigne</p><h2 id="concept-title">Des racines. Un nom.<br />Une nouvelle histoire à écrire.</h2><p>Le point de départ : une pizzeria à {franchiseData.firstCity}. La suite peut commencer avec votre projet.</p></div>
    <div className="feature-grid">
      <article className="feature-card"><span className="feature-index" aria-hidden="true">01</span><h3>Une histoire italienne</h3><p>Fondée par {franchiseData.founder}, originaire de {franchiseData.origin}, Pizza Zio a ouvert sa première pizzeria en {franchiseData.foundingYear}.</p></article>
      <article className="feature-card"><span className="feature-index" aria-hidden="true">02</span><h3>Un projet de terrain</h3><p>Accueillir les clients, organiser le service, faire grandir une équipe : votre implication quotidienne donne vie au projet.</p></article>
      <article className="feature-card"><span className="feature-index" aria-hidden="true">03</span><h3>Une implantation à étudier</h3><p>Votre ville, votre expérience et vos moyens sont les premiers éléments pour construire une discussion concrète.</p></article>
    </div>
  </section>;
}
