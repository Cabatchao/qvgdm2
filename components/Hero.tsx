import { franchiseData } from '@/data/franchiseData';

export default function Hero() {
  const badges = [
    `${franchiseData.franchiseCount} franchises`,
    `${franchiseData.entryFee} de droit d’entrée`,
    `${franchiseData.estimatedInvestment} d’investissement estimé`,
    `${franchiseData.openingTargetPerYear} ouvertures visées par an`,
  ];
  return <section className="bg-gradient-to-b from-white to-zioCream"><div className="section"><h1 className="text-4xl font-bold md:text-5xl">Ouvrez votre pizzeria Pizza Zio et rejoignez une enseigne familiale née dans le Nord</h1><p className="mt-4 max-w-3xl text-lg">Depuis 1983, Pizza Zio développe un savoir-faire italien autour de pizzas généreuses, artisanales et conviviales. Aujourd’hui, l’enseigne accélère son développement en franchise dans les Hauts-de-France, avec une ambition régionale puis nationale.</p><div className="mt-6 flex flex-wrap gap-3">{badges.map((b)=><span key={b} className="rounded-full bg-white px-4 py-2 text-sm ring-1 ring-black/10">{b}</span>)}</div><div className="mt-8 flex gap-4"><a href="#eligibilite" className="cta">Tester mon éligibilité</a><a href="#eligibilite" className="rounded-full border border-zioGreen px-6 py-3 font-semibold text-zioGreen">Recevoir le dossier franchise</a></div></div></section>;
}
