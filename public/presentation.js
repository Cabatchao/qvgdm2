/* Progressive, local-only presentation. No cookies, storage, tracking or forms. */
(() => {
  function mount(hero) {
    const video = hero?.querySelector('[data-hero-video]');
    const button = hero?.querySelector('[data-video-toggle]');
    if (!(video instanceof HTMLVideoElement) || !(button instanceof HTMLButtonElement)) return null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const bounds = hero.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < innerHeight;
    let manuallyPaused = window.matchMedia('(max-width: 700px)').matches;
    let failed = false;
    let suspended = false;
    let disposed = false;
    let observer;
    const listeners = [];
    const listen = (target, event, callback) => {
      if (!target?.addEventListener) return;
      target.addEventListener(event, callback);
      listeners.push(() => target.removeEventListener(event, callback));
    };

    const permitted = () => !disposed && !reduced.matches && !connection?.saveData && !failed;
    const shouldPlay = () => permitted() && visible && !document.hidden && !manuallyPaused && !suspended;
    const paint = () => {
      if (disposed) return;
      const playing = !video.paused && !video.ended;
      button.querySelector('[data-video-label]').textContent = playing ? 'Mettre le film en pause' : 'Lire le film';
      button.dataset.playing = String(playing);
      hero.dataset.videoState = permitted() && video.readyState >= 2 ? (playing ? 'playing' : 'paused') : 'poster';
    };

    function sync() {
      if (disposed) return;
      if (!permitted()) {
        video.pause();
        if (video.hasAttribute('src')) {
          video.removeAttribute('src');
          video.load();
        }
        button.hidden = true;
        paint();
        return;
      }
      button.hidden = false;
      if (!shouldPlay()) {
        video.pause();
        paint();
        return;
      }
      if (!video.hasAttribute('src')) video.src = video.dataset.src;
      video.muted = true;
      video.play().then(() => {
        if (!shouldPlay()) video.pause();
        paint();
      }).catch(() => {
        // Autoplay restrictions leave the poster and an explicit play control.
        paint();
      });
    }
    listen(button, 'click', () => {
      if (!permitted()) return;
      manuallyPaused = !video.paused;
      if (!manuallyPaused) {
        // Honour the user gesture even if the observer has not delivered its first frame yet.
        visible = true;
        if (!video.hasAttribute('src')) {
          video.preload = 'metadata';
          video.src = video.dataset.src;
          video.load();
        }
      }
      sync();
    });
    listen(video, 'playing', paint);
    listen(video, 'pause', paint);
    listen(video, 'loadeddata', paint);
    listen(video, 'error', () => { failed = true; sync(); });
    listen(document, 'visibilitychange', sync);
    listen(reduced, 'change', sync);
    listen(connection, 'change', sync);
    // Safari can preserve this document in its back/forward cache.
    listen(window, 'pagehide', () => { suspended = true; sync(); });
    listen(window, 'pageshow', () => { suspended = false; sync(); });
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .12 });
      observer.observe(hero);
    }
    sync();
    return {
      hero,
      destroy() {
        disposed = true;
        observer?.disconnect();
        listeners.forEach(remove => remove());
        video.pause();
        video.removeAttribute('src');
        video.load();
      },
    };
  }

  // The shared Next.js layout keeps this script across client navigation.
  // Bind each newly mounted hero and release the detached player's listeners.
  // Existing-page mutations (labels, FAQ, hydration) are an immediate no-op.
  let current = null;
  function connect() {
    if (current?.hero.isConnected) return;
    current?.destroy();
    current = null;
    const hero = document.querySelector('.hero-immersive');
    if (hero) current = mount(hero);
  }
  new MutationObserver(connect).observe(document.body, { childList: true, subtree: true });
  connect();
})();
