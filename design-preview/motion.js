/* Optional cinema treatment. Native scrolling and the complete document stay usable without JS. */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 800px)');
  const running = new Set();
  const revealed = new WeakSet();
  const timelines = [];
  let observer = null;
  let frame = 0;
  let active = false;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const isAllowed = () => !reduceMotion.matches && document.documentElement.dataset.motion !== 'off'
    && (typeof window.zioMotionEnabled !== 'function' || window.zioMotionEnabled());

  function track(animation) {
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }

  function makeTimeline(element, keyframes, measure) {
    if (!element || typeof element.animate !== 'function') return;
    const animation = track(element.animate(keyframes, { duration: 1000, fill: 'both', easing: 'linear' }));
    animation.pause();
    timelines.push({ animation, measure });
  }

  function update() {
    frame = 0;
    if (!active) return;
    const height = window.innerHeight;
    for (const { animation, measure } of timelines) animation.currentTime = clamp(measure(height)) * 1000;
  }

  function schedule() {
    if (active && !frame) frame = window.requestAnimationFrame(update);
  }

  function stop() {
    active = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (observer) observer.disconnect();
    observer = null;
    for (const animation of running) animation.cancel();
    running.clear();
    timelines.length = 0;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  }

  function start() {
    stop();
    if (!isAllowed()) return;
    active = true;

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (!active) return;
        for (const entry of entries) {
          if (!entry.isIntersecting || revealed.has(entry.target)) continue;
          revealed.add(entry.target);
          observer.unobserve(entry.target);
          if (typeof entry.target.animate !== 'function') continue;
          const isFrame = entry.target.hasAttribute('data-frame');
          track(entry.target.animate(isFrame ? [
            { clipPath: 'inset(5% 4% 5% 4%)' },
            { clipPath: 'inset(0% 0% 0% 0%)' }
          ] : [
            { transform: 'translateY(25px)', opacity: .6 },
            { transform: 'translateY(0)', opacity: 1 }
          ], { duration: isFrame ? 1100 : 850, easing: 'cubic-bezier(.2,.7,.2,1)' }));
        }
      }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
      document.querySelectorAll('[data-reveal], [data-frame]').forEach((element) => {
        if (!revealed.has(element)) observer.observe(element);
      });
    }

    // Gentle image depth is reserved for wider screens to keep mobile scrolling lightweight.
    if (!narrowScreen.matches) {
      const hero = document.querySelector('.hero');
      makeTimeline(document.querySelector('[data-depth="hero"]'), [
        { transform: 'translateY(0%) scale(1.025)' },
        { transform: 'translateY(7%) scale(1.06)' }
      ], () => hero ? -hero.getBoundingClientRect().top / hero.offsetHeight : 0);

      document.querySelectorAll('[data-depth="photo"]').forEach((photo) => {
        const frameElement = photo.closest('.format-photo');
        makeTimeline(photo, [
          { transform: 'translateY(-6%)' },
          { transform: 'translateY(0%)' }
        ], (height) => frameElement ? (height - frameElement.getBoundingClientRect().top) / (height + frameElement.offsetHeight) : 0);
      });

      const scene = document.querySelector('.cinema-scene');
      const sceneProgress = (height) => scene ? (height * .65 - scene.getBoundingClientRect().top) / (scene.offsetHeight + height * .1) : 0;
      makeTimeline(document.querySelector('[data-scene-image]'), [
        { clipPath: 'inset(7% 6% 7% 6%)', transform: 'scale(1.04)' },
        { clipPath: 'inset(0% 0% 0% 0%)', transform: 'scale(1)' }
      ], sceneProgress);
      makeTimeline(document.querySelector('[data-scene-title]'), [
        { transform: 'translateY(35px)' },
        { transform: 'translateY(-25px)' }
      ], sceneProgress);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  }

  document.addEventListener('zio-motion-change', (event) => {
    if (event.detail && event.detail.enabled === false) stop();
    else start();
  });
  reduceMotion.addEventListener('change', start);
  narrowScreen.addEventListener('change', start);
  start();
})();
