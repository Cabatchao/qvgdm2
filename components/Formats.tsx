import { franchiseData } from '@/data/franchiseData';

export default function Formats() {
  return <section id="formats" className="section formats-section" aria-labelledby="formats-title">
    <div className="section-index"><span>03</span><p>À la carte</p><span aria-hidden="true">↘</span></div>
    <div className="formats-layout"><div className="section-heading" data-reveal><p className="eyebrow">Imaginer votre établissement</p><h2 id="formats-title">Un projet.<br /><em>Votre façon<br />de le faire vivre.</em></h2><p>Une première préférence suffit. Les formats disponibles et leurs modalités sont à confirmer par l’équipe Pizza Zio.</p></div>
      <div className="format-menu">{franchiseData.formats.map((format, index) => <article className="format-row" key={format} data-reveal><span className="format-number" aria-hidden="true">0{index + 1}</span><div><h3>{format}</h3><p>{index === 0 ? 'Un établissement centré sur la livraison.' : 'L’accueil au restaurant, associé à la livraison.'}</p></div><span aria-hidden="true">↗</span></article>)}
        <aside className="conditions-note" data-reveal><p className="eyebrow">Avant de décider</p><h3>Des conditions à préciser ensemble.</h3><p>Apport personnel, investissement total, droit d’entrée, redevances et territoires ouverts sont à confirmer par l’équipe Pizza Zio.</p><p>Aucun résultat financier n’est garanti.</p><a className="text-link" href="#questions">Les questions à se poser <span aria-hidden="true">↓</span></a></aside>
      </div>
    </div>
  </section>;
}
