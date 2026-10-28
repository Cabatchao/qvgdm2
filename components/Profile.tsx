export default function Profile() {
  const qualities = [
    ['Vous envisagez d’entreprendre', 'En activité, en reconversion ou déjà indépendant, expliquez ce qui vous donne envie de préparer un projet de pizzeria.'],
    ['Vous êtes prêt à apprendre', 'Présentez vos compétences, vos motivations et ce que vous souhaitez développer.'],
    ['Vous avez le goût du collectif', 'Parlez de vos expériences de service, de gestion ou de management, y compris dans un autre secteur.'],
    ['Vous préparez un projet concret', 'Vous réfléchissez à une ville, à un calendrier et à votre financement.'],
  ];
  return <section id="profil" className="profile-section" aria-labelledby="profile-title"><div className="section profile-grid">
    <div className="section-heading"><p className="eyebrow">Votre place dans le projet</p><h2 id="profile-title">Votre parcours.<br />Votre envie.<br /><em>Votre projet.</em></h2><p>Votre métier actuel ne raconte pas tout votre projet. Dans votre présentation, expliquez ce que vous savez faire, ce que vous souhaitez apprendre et votre expérience d’équipe.</p><a className="text-link" href="#projet">Parlons de votre parcours <span aria-hidden="true">↗</span></a></div>
    <ul className="profile-list">{qualities.map(([title, copy]) => <li key={title}><span className="check-mark" aria-hidden="true">✓</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ul>
  </div></section>;
}
