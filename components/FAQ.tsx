export default function FAQ() {
  const questions = [
    ['À qui s’adresse ce projet ?', 'Aux entrepreneurs qui souhaitent s’impliquer dans l’exploitation d’une pizzeria. Une expérience de restauration, de management ou d’entrepreneuriat peut nourrir votre projet. Les critères définitifs d’entrée dans le réseau sont à confirmer par l’équipe Pizza Zio.'],
    ['Quel apport ou budget dois-je prévoir ?', 'Les conditions financières actuelles sont à confirmer par l’équipe Pizza Zio. Indiquez votre apport disponible et, si vous le connaissez, votre budget global. Ces deux montants sont distincts : l’apport correspond à vos ressources personnelles mobilisables.'],
    ['Ma ville est-elle disponible ?', 'La disponibilité d’un territoire est à confirmer par l’équipe Pizza Zio. Indiquer une ville dans le formulaire ne réserve pas une zone.'],
    ['Puis-je présenter mon projet sans local ?', 'Vous pouvez indiquer que vous recherchez un local ou que ce sujet n’est pas encore engagé. Les exigences immobilières et l’accompagnement éventuel sont à confirmer par l’équipe Pizza Zio.'],
    ['Que se passe-t-il après l’envoi ?', 'Une confirmation s’affiche uniquement lorsque la demande a été prise en charge par le service de réception. Le premier contact est prévu par email. Les délais de réponse sont à confirmer par l’équipe Pizza Zio.'],
    ['Le formulaire valide-t-il ma candidature ?', 'Non. Il sert à présenter votre projet pour une étude humaine. Aucune acceptation, réservation de territoire ou rentabilité n’est garantie.'],
  ];
  return <section id="questions" className="section faq-section" aria-labelledby="faq-title"><div className="section-heading"><p className="eyebrow">Avant de vous lancer</p><h2 id="faq-title">Les questions qui comptent.</h2></div><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}
