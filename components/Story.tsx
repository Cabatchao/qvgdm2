import EditorialPhoto from './EditorialPhoto';
import { franchiseData } from '@/data/franchiseData';

export default function Story() {
  return (
    <section
      id="concept"
      className="section story-section"
      aria-labelledby="story-title"
    >
      <div className="story-grid">
        <div className="story-copy" data-reveal="true">
          <p className="eyebrow">La maison Pizza Zio</p>
          <h2 id="story-title">
            Des racines italiennes.
            <br />
            <span>Une histoire du Nord.</span>
          </h2>
          <p className="story-intro">
            En {franchiseData.foundingYear}, {franchiseData.founder}, originaire
            de {franchiseData.origin}, ouvre sa première pizzeria à{' '}
            {franchiseData.firstCity}.
          </p>
          <p>{franchiseData.onboarding}</p>
          <dl className="story-facts">
            <div>
              <dt>Les racines</dt>
              <dd>{franchiseData.origin}</dd>
            </div>
            <div>
              <dt>La première adresse</dt>
              <dd>{franchiseData.firstCity}</dd>
            </div>
          </dl>
        </div>
        <figure className="story-media" data-reveal="true">
          <EditorialPhoto
            name="restaurant"
            alt="La salle et le comptoir d’un restaurant Pizza Zio."
          />
          <figcaption>
            <span>À l’intérieur de Pizza Zio</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
