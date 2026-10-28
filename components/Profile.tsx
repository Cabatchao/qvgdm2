export default function Profile() {
  const qualities = [
    ['Vous aimez être sur le terrain', 'Vous souhaitez vous impliquer dans l’exploitation de votre établissement.'],
    ['Vous avez le sens du service', 'L’accueil, la régularité et la satisfaction des clients comptent pour vous.'],
    ['Vous savez travailler en équipe', 'Vous avez une expérience en restauration, en management ou un parcours à nous présenter.'],
    ['Vous préparez un projet concret', 'Vous réfléchissez à une ville, à un calendrier et à votre financement.'],
  ];
  return <section id="profil" className="profile-section" aria-labelledby="profile-title"><div className="section profile-grid">
    <div className="section-heading"><p className="eyebrow">Votre place dans le projet</p><h2 id="profile-title">Entrepreneur.<br />Manager.<br /><em>Présent au quotidien.</em></h2><p>Vous vous reconnaissez dans ce portrait ? Votre expérience et votre motivation méritent d’être présentées.</p><a className="text-link" href="#projet">Parlons de votre parcours <span aria-hidden="true">↗</span></a></div>
    <ul className="profile-list">{qualities.map(([title, copy]) => <li key={title}><span className="check-mark" aria-hidden="true">✓</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ul>
  </div></section>;
}
