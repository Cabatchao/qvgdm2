import EditorialPhoto from './EditorialPhoto';
import ArrowIcon from './ArrowIcon';
import { franchiseData } from '@/data/franchiseData';

export default function Hero({
  available = false,
  film = false,
}: {
  available?: boolean;
  film?: boolean;
}) {
  return (
    <section className="hero hero-immersive" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        <EditorialPhoto
          name="hero-v2"
          alt=""
          priority
          className="hero-media-image"
        />
        {film && (
          <video
            className="hero-video"
            id="hero-video"
            data-hero-video="true"
            data-src="/video/zio-cuisine.mp4"
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
          ></video>
        )}
      </div>
      <div className="hero-shade" aria-hidden="true"></div>
      <div className="hero-content">
        <p className="eyebrow" data-hero-reveal="true">
          Devenir franchisé Pizza Zio
        </p>
        <h1 id="hero-title" data-hero-reveal="2">
          <span className="hero-title-line">Le goût</span>{' '}
          <span className="hero-title-line">d’entreprendre.</span>
        </h1>
        <div className="hero-introduction" data-hero-reveal="3">
          <p className="hero-description">
            Ouvrez votre pizzeria dans le {franchiseData.recruitingArea}.<br />
            À emporter ou avec restaurant.
          </p>
          <div className="hero-actions">
            <a className="cta hero-cta" href="#projet">
              {available ? 'Présenter mon projet' : 'Préparer mon projet'}
              <ArrowIcon />
            </a>
            <a className="hero-discover" href="#formats">
              Découvrir les deux formats <ArrowIcon direction="down" />
            </a>
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <span className="hero-origin">Depuis {franchiseData.foundingYear}</span>
        <span className="hero-location">
          De la {franchiseData.origin} à {franchiseData.firstCity}
        </span>
        {film && (
          <button
            type="button"
            className="video-toggle"
            data-video-toggle="true"
            aria-controls="hero-video"
            data-playing="false"
            hidden
          >
            <span className="video-toggle-icon" aria-hidden="true"></span>
            <span data-video-label="true">Lire le film</span>
          </button>
        )}
      </div>
    </section>
  );
}
