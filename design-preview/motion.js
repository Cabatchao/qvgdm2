(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => !reduced.matches && typeof window.zioMotionEnabled === 'function' && window.zioMotionEnabled();
  const syncMotion = () => root.classList.toggle('pop-motion', canMove());

  document.addEventListener('zio-motion-change', syncMotion);
  syncMotion();

  // The observer only adds an entrance effect. Nothing is concealed while waiting.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-onstage');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    for (const element of document.querySelectorAll('[data-arrive]')) observer.observe(element);
  }

  // Native details remains usable with JavaScript off. Close it after navigation.
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    for (const link of menu.querySelectorAll('a[href^="#"]')) {
      link.addEventListener('click', () => { menu.open = false; });
    }
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      menu.querySelector('summary')?.focus();
    });
  }

  const syncVisibility = () => root.classList.toggle('pop-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
})();
