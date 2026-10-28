import { franchiseData } from '@/data/franchiseData';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="section hero-grid">
        <div>
          <p className="eyebrow">Entreprendre avec Pizza Zio</p>
          <h1 id="hero-title">Une histoire italienne.<br /><em>Votre projet de pizzeria.</em></h1>
          <p className="hero-copy">Vous avez le goût du terrain, du service et du travail en équipe ? Présentez votre projet de franchise à une enseigne née à {franchiseData.firstCity} en {franchiseData.foundingYear}.</p>
          <div className="hero-actions">
            <a className="cta" href="#projet">Présenter mon projet <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#concept">Découvrir l’enseigne <span aria-hidden="true">↓</span></a>
          </div>
          <p className="hero-note">Un premier échange écrit. Un projet étudié avec vous.</p>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="heritage-stamp">Racines italiennes<span>Depuis {franchiseData.foundingYear}</span></div>
          <svg viewBox="0 0 500 500" role="presentation" focusable="false">
            <defs><pattern id="plate-lines" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V12" stroke="#b7c3ae" strokeWidth="2" /></pattern></defs>
            <circle cx="250" cy="250" r="231" fill="url(#plate-lines)" />
            <circle cx="250" cy="250" r="217" fill="#faf5eb" stroke="#31523e" strokeWidth="2" />
            <circle cx="250" cy="250" r="191" fill="#e6b577" />
            <circle cx="250" cy="250" r="170" fill="#b8432c" />
            <path d="M152 122c35-24 64 12 91 2 29-11 57-8 71 13 20 31 58 24 59 63 1 20 31 31 26 62-5 32-38 32-44 61-6 31-25 41-58 30-30-10-38 29-71 21-24-7-29-33-57-34-29-1-52-21-44-51 7-26-25-38-22-66 3-23 24-31 25-56 1-19 8-34 24-45Z" fill="#f2dfba" />
            <g fill="#b8432c"><circle cx="173" cy="183" r="17" /><circle cx="310" cy="179" r="20" /><circle cx="282" cy="303" r="16" /><circle cx="175" cy="285" r="21" /><circle cx="344" cy="263" r="13" /></g>
            <g fill="#31523e"><path d="M238 172c-23-29-54-20-53 7 3 27 33 34 53-7Z" /><path d="M294 240c28-29 56-10 43 14-14 27-39 17-43-14Z" /><path d="M238 315c-36 0-43 27-20 39 26 13 39-16 20-39Z" /></g>
            <g fill="#a56f40"><circle cx="202" cy="74" r="5" /><circle cx="353" cy="108" r="6" /><circle cx="427" cy="231" r="5" /><circle cx="377" cy="371" r="6" /><circle cx="229" cy="428" r="5" /><circle cx="92" cy="326" r="6" /><circle cx="92" cy="175" r="4" /></g>
          </svg>
          <p className="illustration-caption">L’esprit Pizza Zio,<br /><strong>à faire vivre dans votre ville.</strong></p>
        </div>
      </div>
    </section>
  );
}
