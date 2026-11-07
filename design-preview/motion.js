/* Éditorial : progressive chapter reveals. Native scrolling remains untouched. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const elements = [...document.querySelectorAll('[data-reveal]')];
  const seen = new WeakSet();
  let observer;

  const enabled = () => !reducedMotion.matches &&
    root.dataset.motion !== 'off' &&
    (typeof window.zioMotionEnabled !== 'function' || window.zioMotionEnabled());

  function stop() {
    observer?.disconnect();
    observer = undefined;
    root.dataset.editorialMotion = 'off';
    for (const element of elements) element.classList.remove('is-arriving');
  }

  function synchronize() {
    stop();
    if (!enabled() || !('IntersectionObserver' in window)) return;
    root.dataset.editorialMotion = 'on';
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target) || !enabled()) continue;
        seen.add(entry.target);
        entry.target.classList.add('is-arriving');
        observer?.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
    for (const element of elements) {
      if (!seen.has(element)) observer.observe(element);
    }
  }

  for (const element of elements) {
    element.addEventListener('animationend', () => element.classList.remove('is-arriving'));
  }
  document.addEventListener('zio-motion-change', event => {
    if (event.detail?.enabled === false) stop();
    else synchronize();
  });
  reducedMotion.addEventListener('change', synchronize);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', synchronize);
  synchronize();
})();
