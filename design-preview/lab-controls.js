(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let enabled = !preference.matches;
  window.zioMotionEnabled = () => enabled;
  const apply = () => {
    enabled = !preference.matches && !userPaused;
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
    for (const button of document.querySelectorAll('[data-motion-toggle]')) {
      button.setAttribute('aria-pressed', String(enabled));
      button.disabled = preference.matches;
      button.textContent = preference.matches ? 'Animations réduites' : enabled ? 'Mettre les animations en pause' : 'Activer les animations';
      button.title = preference.matches ? 'La préférence de réduction des animations de votre appareil est respectée.' : '';
    }
    if (!enabled) for (const video of document.querySelectorAll('video')) video.pause();
    document.dispatchEvent(new CustomEvent('zio-motion-change', {detail: {enabled}}));
  };
  for (const button of document.querySelectorAll('[data-motion-toggle]')) {
    button.addEventListener('click', () => { userPaused = !userPaused; apply(); });
  }
  preference.addEventListener('change', apply);
  apply();
})();
