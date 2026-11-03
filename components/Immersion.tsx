import EditorialPhoto from './EditorialPhoto';

export default function Immersion() {
  return (
    <section className="immersion-section" aria-labelledby="immersion-title">
      <div className="section immersion-heading" data-reveal="true">
        <p className="eyebrow">L’esprit de la maison</p>
        <h2 id="immersion-title">
          Une marque
          <br />
          qui se vit.
        </h2>
        <p>
          À table, au comptoir,
          <br />
          autour d’une pizza.
        </p>
      </div>
      <div className="immersion-grid">
        <figure className="immersion-primary" data-reveal="true">
          <EditorialPhoto
            name="pizza"
            alt="Une pizza garnie et une assiette de pâtes sur une table en bois."
          />
          <figcaption>Le plaisir de se retrouver.</figcaption>
        </figure>
        <figure className="immersion-secondary" data-reveal="true">
          <EditorialPhoto
            name="dining-v2"
            alt="Un repas partagé à une table de Pizza Zio."
          />
          <figcaption>L’Italie à table.</figcaption>
        </figure>
        <figure className="immersion-secondary" data-reveal="true">
          <EditorialPhoto
            name="terrace-v2"
            alt="La terrasse et la façade d’un restaurant Pizza Zio."
          />
          <figcaption>L’esprit Pizza Zio.</figcaption>
        </figure>
      </div>
    </section>
  );
}
