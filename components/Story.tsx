import { franchiseData } from '@/data/franchiseData';

export default function Story() {
  return <section className="story-section" aria-labelledby="story-title"><div className="section story-grid"><div><p className="eyebrow">De la Calabre au Nord</p><h2 id="story-title">L’histoire commence<br />à {franchiseData.firstCity}.</h2></div><div><p className="story-year">{franchiseData.foundingYear}</p><p>{franchiseData.founder}, originaire de {franchiseData.origin}, ouvre la première Pizza Zio à {franchiseData.firstCity}. C’est cette histoire italienne, ancrée dans le Nord, qui donne son nom à votre futur projet.</p></div></div></section>;
}
