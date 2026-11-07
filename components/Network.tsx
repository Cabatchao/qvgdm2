import { franchiseData } from '@/data/franchiseData';

export default function Network() {
  const { restaurants } = franchiseData;
  return (
    <section id="restaurants" className="section network-section" aria-labelledby="network-title">
      <div className="network-heading">
        <div>
          <p className="eyebrow">Nos restaurants dans le Nord</p>
          <h2 id="network-title">{restaurants.length} adresses.<br /><em>Une histoire locale.</em></h2>
        </div>
        <p>De Marcq-en-Barœul à Mérignies, retrouvez les établissements Pizza Zio autour de Lille.</p>
      </div>
      <div className="network-grid">
        <figure className="network-map">
          <svg viewBox="0 0 600 720" role="group" aria-labelledby="map-title map-description">
            <title id="map-title">Les huit restaurants Pizza Zio dans le Nord</title>
            <desc id="map-description">Chaque repère numéroté mène à l’adresse correspondante dans la liste. Le nord est en haut.</desc>
            <image href="/images/zio-network-map.svg" width="600" height="720" />
            <g aria-hidden="true" className="map-orientation">
              <path d="M550 76V36m-8 12 8-12 8 12" />
              <text x="550" y="25" textAnchor="middle">N</text>
              <circle cx="272" cy="246" r="4" />
              <text x="272" y="272" textAnchor="middle">LILLE</text>
            </g>
            {restaurants.map((restaurant, index) => {
              const x = (restaurant.coordinates[0] - 2.93) / 0.28 * 600;
              const y = (50.702 - restaurant.coordinates[1]) / 0.212 * 720;
              const [labelX, labelY, anchor] = restaurant.mapLabel;
              return (
                <a key={restaurant.id} href={`#restaurant-${restaurant.id}`}
                  aria-label={`${index + 1}. Pizza Zio ${restaurant.city}, voir l’adresse`}
                  className="network-pin">
                  <circle cx={x} cy={y} r="28" className="pin-hit" />
                  <circle cx={x} cy={y} r="20" className="pin-dot" />
                  <text x={x} y={y} dy=".35em" textAnchor="middle" className="pin-number">{index + 1}</text>
                  <text x={x + labelX} y={y + labelY} textAnchor={anchor} className="pin-label" aria-hidden="true">{restaurant.id === 'saint-andre' ? 'Saint-André' : restaurant.city}</text>
                </a>
              );
            })}
          </svg>
          <figcaption>
            Choisissez un numéro pour retrouver son adresse.
            <span>Fond simplifié IGN / data.gouv.fr · <a href="https://www.data.gouv.fr/datasets/contours-administratifs" target="_blank" rel="noopener noreferrer">Sources cartographiques<span className="sr-only"> (nouvel onglet)</span></a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL<span className="sr-only"> (nouvel onglet)</span></a></span>
          </figcaption>
        </figure>
        <ol className="restaurant-list">
          {restaurants.map((restaurant, index) => (
            <li key={restaurant.id} id={`restaurant-${restaurant.id}`} tabIndex={-1}>
              <span className="restaurant-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{restaurant.city}</h3>
                {restaurant.opened && <p className="restaurant-year">Depuis {restaurant.opened}</p>}
                <p>{restaurant.address}<br />{restaurant.postcode} {restaurant.city}</p>
                <a href={restaurant.url} target="_blank" rel="noopener noreferrer">
                  Voir le restaurant <span aria-hidden="true">↗</span>
                  <span className="sr-only"> {restaurant.city} (nouvel onglet)</span>
                </a>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="network-note">Votre future implantation dans le Nord sera étudiée avec l’équipe Pizza Zio en fonction des zones disponibles.</p>
    </section>
  );
}
