export default function Steps() {
  const steps = [
    ['Présentez votre projet', 'Votre parcours, la ville envisagée et l’état de votre réflexion.'],
    ['Précisez les éléments utiles', 'Le premier contact est prévu par email pour compléter votre dossier.'],
    ['Étudiez la suite ensemble', 'Les conditions, la zone et le calendrier restent à valider avec l’équipe Pizza Zio.'],
  ];
  return <section className="section" aria-labelledby="steps-title"><div className="section-heading"><p className="eyebrow">Le premier pas</p><h2 id="steps-title">De votre idée à une discussion concrète.</h2><p>Le formulaire présente votre projet. Il ne constitue ni une acceptation de candidature ni un engagement contractuel.</p></div><ol className="steps-grid">{steps.map(([title, copy], index) => <li key={title}><span className="step-number" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>;
}
