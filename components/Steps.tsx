export default function Steps() {
  const steps = [
    ['Votre idée', 'Votre parcours, la ville envisagée et l’état de votre réflexion.'],
    ['Le premier échange', 'Un contact prévu par email pour préciser les éléments de votre dossier.'],
    ['La suite, ensemble', 'Les conditions, la zone et le calendrier à étudier avec l’équipe Pizza Zio.'],
  ];
  return <section className="steps-section" aria-labelledby="steps-title"><div className="section"><div className="section-index"><span>04</span><p>Le premier pas</p><span aria-hidden="true">↘</span></div><div className="steps-heading" data-reveal><h2 id="steps-title">Tout commence<br /><em>par une discussion.</em></h2><p>Présenter votre projet ne constitue ni une acceptation de candidature ni un engagement contractuel.</p></div><ol className="steps-grid">{steps.map(([title, copy], index) => <li key={title} data-reveal><span className="step-number" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol></div></section>;
}
