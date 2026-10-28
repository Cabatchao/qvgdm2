import EditorialPhoto from './EditorialPhoto';

export default function Profile() {
  const qualities = [
    ['L’envie d’entreprendre', 'En activité, en reconversion ou déjà indépendant : racontez ce qui vous donne envie de construire votre projet.'],
    ['Le goût du terrain', 'Service, gestion, management : votre expérience compte, y compris lorsqu’elle vient d’un autre secteur.'],
    ['Un projet à préparer', 'Une ville, un calendrier, un financement à étudier. Vous n’avez pas besoin d’avoir toutes les réponses pour commencer à réfléchir.'],
  ];
  return <section id="profil" className="profile-section" aria-labelledby="profile-title">
    <div className="section"><div className="section-index"><span>02</span><p>Votre place à table</p><span aria-hidden="true">↘</span></div>
      <div className="profile-grid"><div className="profile-heading" data-reveal><p className="eyebrow">Le prochain chapitre</p><h2 id="profile-title">Votre parcours.<br /><em>Votre signature.</em></h2><p>Un métier actuel ne résume pas une envie d’entreprendre. Ce qui nous intéresse ici, c’est le projet que vous souhaitez préparer.</p><a className="text-link" href="#projet">Faire le point sur mon projet <span aria-hidden="true">↗</span></a>
        <figure className="service-figure"><EditorialPhoto name="service" alt="Des mains se passent une pile de boîtes à pizza portant le nom Pizza Zio." /><figcaption>Le service, un travail collectif.</figcaption></figure>
      </div><ol className="profile-list">{qualities.map(([title, copy], index) => <li key={title} data-reveal><span className="list-index" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}<li className="profile-footnote"><p>Les critères définitifs d’entrée dans le réseau sont à confirmer par l’équipe Pizza Zio. Chaque candidature fera l’objet d’une étude humaine.</p></li></ol></div>
    </div>
  </section>;
}
