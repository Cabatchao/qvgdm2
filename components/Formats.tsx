import EditorialPhoto from './EditorialPhoto';
import ArrowIcon from './ArrowIcon';
import { franchiseData } from '@/data/franchiseData';
import { launchConfig } from '@/data/launchConfig';

export default function Formats({
  available = false,
}: {
  available?: boolean;
}) {
  return (
    <section
      id="formats"
      className="section formats-section"
      aria-labelledby="formats-title"
    >
      <div className="formats-heading" data-reveal="true">
        <div>
          <p className="eyebrow">Votre futur établissement</p>
          <h2 id="formats-title">
            Imaginez
            <br />
            votre Pizza Zio.
          </h2>
        </div>
        <p>
          Au comptoir ou à table : découvrez les deux formats Pizza Zio.
        </p>
      </div>
      <div className="formats-grid">
        <article className="format-panel" data-reveal="true">
          <div className="format-image">
            <EditorialPhoto
              name="service"
              alt="Des boîtes à pizza au nom de Pizza Zio."
            />
          </div>
          <div className="format-copy">
            <span className="format-index">01</span>
            <h3>{franchiseData.formats[0]}</h3>
            <p>
              Les clients retirent leur commande au comptoir.
            </p>
          </div>
        </article>
        <article className="format-panel" data-reveal="true">
          <div className="format-image">
            <EditorialPhoto
              name="dining-v2"
              alt="Un repas partagé à une table de Pizza Zio."
            />
          </div>
          <div className="format-copy">
            <span className="format-index">02</span>
            <h3>{franchiseData.formats[1]}</h3>
            <p>
              Les clients s’installent à table.
            </p>
          </div>
        </article>
      </div>
      <aside className="conditions-note" data-reveal="true">
        <h3>Chaque projet a ses conditions.</h3>
        {available && (
          <p>
            <strong>Territoires ouverts à l’étude</strong> ·{' '}
            {launchConfig.operations.availableTerritories.join(', ')}
          </p>
        )}
        <p>
          Indiquez la ville du Nord où vous souhaitez vous installer. L’équipe
          Pizza Zio vérifiera avec vous si la zone est disponible.
        </p>
        <p>
          L’apport personnel et l’investissement total
          sont à confirmer par l’équipe Pizza Zio. Aucun
          résultat financier n’est garanti.
        </p>
        <a className="text-link" href="#franchise">
          Les conditions de franchise <ArrowIcon direction="up-right" />
        </a>
      </aside>
    </section>
  );
}
