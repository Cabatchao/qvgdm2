export default function Steps({ available = false }: { available?: boolean }) {
  return (
    <section className="steps-section" aria-labelledby="steps-title">
      <div className="section">
        <div className="steps-heading" data-reveal="true">
          <p className="eyebrow">Le premier pas</p>
          <h2 id="steps-title">
            Tout commence
            <br />
            par un échange.
          </h2>
        </div>
        <ol className="steps-grid">
          <li data-reveal="true">
            <span className="step-number" aria-hidden="true">
              01
            </span>
            <div>
              <h3>Votre idée</h3>
              <p>
                Votre parcours, la ville envisagée et l’état de votre réflexion.
              </p>
            </div>
          </li>
          <li data-reveal="true">
            <span className="step-number" aria-hidden="true">
              02
            </span>
            <div>
              <h3>Le premier échange</h3>
              <p>Votre candidature est étudiée confidentiellement par le responsable du recrutement. Le premier échange est prévu par email.</p>
            </div>
          </li>
          <li data-reveal="true">
            <span className="step-number" aria-hidden="true">
              03
            </span>
            <div>
              <h3>La suite, ensemble</h3>
              <p>
                Les conditions, la zone et le calendrier à étudier avec l’équipe
                Pizza Zio.
              </p>
            </div>
          </li>
        </ol>
        <p className="steps-note">
          {!available &&
            'Ce parcours sera proposé à l’ouverture du formulaire sur ce site. '}
          Présenter votre projet ne constitue ni une acceptation de candidature
          ni un engagement contractuel.
        </p>
      </div>
    </section>
  );
}
