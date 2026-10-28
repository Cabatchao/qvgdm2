import { franchiseData } from '@/data/franchiseData';

export default function Formats() {
  return <section className="section" aria-labelledby="formats-title"><div className="section-heading"><p className="eyebrow">Votre établissement</p><h2 id="formats-title">Quel format pour votre projet ?</h2><p>Une première préférence suffit pour démarrer. Les modalités disponibles sont à confirmer par l’équipe Pizza Zio.</p></div><div className="format-grid">{franchiseData.formats.map((format, index) => <article className="format-card" key={format}><span aria-hidden="true" className="format-number">0{index + 1}</span><h3>{format}</h3><p>{index === 0 ? 'Un projet centré sur la livraison.' : 'Un projet associant accueil au restaurant et livraison.'}</p></article>)}</div></section>;
}
