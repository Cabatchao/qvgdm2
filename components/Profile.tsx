import EditorialPhoto from './EditorialPhoto';

export default function Profile() {
  return (
    <section
      id="profil"
      className="profile-section"
      aria-labelledby="profile-title"
    >
      <div className="section profile-grid">
        <figure className="profile-media" data-reveal="true">
          <EditorialPhoto
            name="service"
            alt="Un échange de boîtes à pizza Pizza Zio entre deux personnes."
          />
          <figcaption>
            Une envie d’entreprendre, un projet à construire.
          </figcaption>
        </figure>
        <div className="profile-content">
          <div className="profile-heading" data-reveal="true">
            <p className="eyebrow">Votre place dans l’histoire</p>
            <h2 id="profile-title">
              Et si la suite,
              <br />
              c’était vous ?
            </h2>
            <p>
              Votre métier actuel ne résume pas votre potentiel. Parlons de ce
              que vous souhaitez construire.
            </p>
          </div>
          <ol className="profile-list">
            <li data-reveal="true">
              <span className="list-index" aria-hidden="true">
                01
              </span>
              <div>
                <h3>Votre expérience</h3>
                <p>
                  Restauration, management, commerce ou reconversion : chaque
                  parcours apporte une histoire.
                </p>
              </div>
            </li>
            <li data-reveal="true">
              <span className="list-index" aria-hidden="true">
                02
              </span>
              <div>
                <h3>Votre envie</h3>
                <p>
                  Ce qui vous donne envie d’entreprendre et de vous impliquer
                  dans un établissement.
                </p>
              </div>
            </li>
            <li data-reveal="true">
              <span className="list-index" aria-hidden="true">
                03
              </span>
              <div>
                <h3>Votre projet</h3>
                <p>
                  Une ville, un calendrier, un financement à étudier. La
                  réflexion peut commencer maintenant.
                </p>
              </div>
            </li>
          </ol>
          <p className="profile-footnote">
            Les critères d’entrée dans le réseau sont à confirmer par l’équipe
            Pizza Zio. Chaque candidature fera l’objet d’une étude humaine.
          </p>
        </div>
      </div>
    </section>
  );
}
