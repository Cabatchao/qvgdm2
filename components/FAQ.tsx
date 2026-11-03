export default function FAQ({ available = false }: { available?: boolean }) {
  return (
    <section
      id="questions"
      className="section faq-section"
      aria-labelledby="faq-title"
    >
      <div className="faq-grid">
        <div className="section-heading" data-reveal="true">
          <p className="eyebrow">Vos questions</p>
          <h2 id="faq-title">
            Avant
            <br />
            de se lancer.
          </h2>
          <p>
            Les repères pour préparer votre réflexion.
            {!available && ' Le formulaire de ce site est en préparation.'}
          </p>
        </div>
        <div className="faq-list">
          <details>
            <summary>
              À qui s’adresse ce projet ?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Aux porteurs de projet, y compris en reconversion, qui souhaitent
              s’impliquer dans l’exploitation d’une pizzeria. Une expérience de
              restauration, de management ou d’entrepreneuriat peut nourrir
              votre projet. Les critères définitifs d’entrée dans le réseau sont
              à confirmer par l’équipe Pizza Zio.
            </p>
          </details>
          <details>
            <summary>
              Quel apport ou budget dois-je prévoir ?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Les conditions financières actuelles sont à confirmer par l’équipe
              Pizza Zio. Indiquez votre apport disponible et, si vous le
              connaissez, votre budget global. Ces deux montants sont distincts
              : l’apport correspond à vos ressources personnelles mobilisables.
            </p>
          </details>
          <details>
            <summary>
              Ma ville est-elle disponible ?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Nous étudions d’abord les implantations dans le Nord (59). Indiquez la ville envisagée. L’équipe vérifiera avec vous si la zone est disponible.
            </p>
          </details>
          <details>
            <summary>
              Puis-je présenter mon projet sans local ?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Vous pouvez indiquer que vous recherchez un local ou que ce sujet
              n’est pas encore engagé. Les exigences immobilières et
              l’accompagnement éventuel sont à confirmer par l’équipe Pizza Zio.
            </p>
          </details>
          <details>
            <summary>
              Que se passe-t-il après l’envoi ?<span aria-hidden="true">+</span>
            </summary>
            <p>
              {available
                ? 'Après enregistrement de votre projet, un numéro de dossier s’affiche. Conservez-le pour votre premier échange par email.'
                : 'La collecte est en préparation. À l’ouverture, vous recevrez une référence après l’enregistrement de votre dossier.'}
            </p>
          </details>
          <details>
            <summary>
              Le formulaire valide-t-il ma candidature ?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Non. Il sert à présenter votre projet pour une étude humaine.
              Aucune acceptation, réservation de territoire ou rentabilité n’est
              garantie.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
