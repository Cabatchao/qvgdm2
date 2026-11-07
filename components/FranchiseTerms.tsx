import { franchiseData } from '@/data/franchiseData';

export default function FranchiseTerms() {
  return (
    <section id="franchise" className="franchise-section" aria-labelledby="franchise-title">
      <div className="section">
        <p className="eyebrow">Les repères pour nous rejoindre</p>
        <h2 id="franchise-title">Votre projet.<br />Un cadre pour avancer.</h2>
        <dl className="franchise-numbers">
          <div><dt>Droit d’entrée</dt><dd>{franchiseData.entryFee.toLocaleString('fr-FR')} €<span>{franchiseData.entryFeeTax}</span></dd></div>
          <div><dt>Redevance mensuelle</dt><dd>{franchiseData.royaltyPercent} %<span>du chiffre d’affaires mensuel {franchiseData.royaltyBase}</span></dd></div>
          <div><dt>Durée du contrat</dt><dd>{franchiseData.contractYears} ans</dd></div>
        </dl>
        <div className="franchise-benefits">
          {franchiseData.benefits.map(benefit => (
            <div key={benefit.title}><h3>{benefit.title}</h3><p>{benefit.description}</p></div>
          ))}
        </div>
        <p className="franchise-note">L’apport personnel et l’investissement total, selon le format et le local, sont à confirmer par l’équipe Pizza Zio.</p>
        <a className="text-link" href="#projet">Préparer notre premier échange <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
