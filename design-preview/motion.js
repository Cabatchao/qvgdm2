(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const seen = new WeakSet();
  const motionEnabled = () => !reducedMotion.matches && document.documentElement.dataset.motion !== 'off' && (typeof window.zioMotionEnabled !== 'function' || window.zioMotionEnabled());

  // The page is visible before JavaScript. Only decorative entrance motion is added.
  const play = (element, frames, options) => {
    if (!motionEnabled() || typeof element.animate !== 'function') return;
    const animation = element.animate(frames, options);
    animations.add(animation);
    const release = () => animations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  };

  const stopAnimations = () => {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };

  document.addEventListener('zio-motion-change', event => {
    if (!event.detail?.enabled || !motionEnabled()) stopAnimations();
  });
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) stopAnimations();
    });
  }

  if ('IntersectionObserver' in window) {
    const entryObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        entryObserver.unobserve(entry.target);
        if (entry.target.hasAttribute('data-draw')) {
          play(entry.target, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)' });
        } else {
          const frame = entry.target.querySelector('.photo-window');
          if (!frame) return;
          play(frame, [{ clipPath: 'inset(0 13% 0 0)', transform: 'translateX(18px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' }], { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' });
          const photo = frame.querySelector('img');
          if (photo) play(photo, [{ transform: 'scale(1.04) translateX(-8px)' }, { transform: 'scale(1) translateX(0)' }], { duration: 1200, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-draw], [data-photo]').forEach(element => entryObserver.observe(element));
  }

  const chapterLinks = [...document.querySelectorAll('.chapter-nav a[href^="#"]')];
  const chapters = chapterLinks.map(link => document.getElementById(link.hash.slice(1)));
  const progress = document.querySelector('.chapter-progress');
  let scheduled = false;
  let activeChapter = -1;
  const updateChapter = () => {
    scheduled = false;
    const readingLine = window.innerHeight * 0.38;
    let current = 0;
    chapters.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= readingLine) current = index;
    });
    if (current !== activeChapter) {
      activeChapter = current;
      chapterLinks.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (progress) progress.style.transform = `scaleY(${chapterLinks.length > 1 ? current / (chapterLinks.length - 1) : 1})`;
    }
  };
  const scheduleChapter = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateChapter);
  };
  window.addEventListener('scroll', scheduleChapter, { passive: true });
  window.addEventListener('resize', scheduleChapter, { passive: true });
  window.addEventListener('hashchange', scheduleChapter);
  updateChapter();

  // Keep native anchors and keyboard navigation. Link a map point to its address.
  const mapPoints = [...document.querySelectorAll('.network-pin')];
  const restaurants = [...document.querySelectorAll('.restaurant-list > li')];
  const setRestaurant = id => {
    mapPoints.forEach(point => point.classList.toggle('is-active', point.getAttribute('href') === `#${id}`));
    restaurants.forEach(restaurant => restaurant.classList.toggle('is-active', restaurant.id === id));
  };
  const idFor = element => {
    if (!(element instanceof Element)) return '';
    const pin = element.closest('.network-pin');
    if (pin) return pin.getAttribute('href').slice(1);
    return element.closest('.restaurant-list > li')?.id || '';
  };
  const network = document.getElementById('restaurants');
  if (network) {
    network.addEventListener('focusin', event => setRestaurant(idFor(event.target)));
    network.addEventListener('focusout', event => setRestaurant(idFor(event.relatedTarget)));
    [...mapPoints, ...restaurants].forEach(element => {
      element.addEventListener('pointerenter', () => setRestaurant(idFor(element)));
      element.addEventListener('pointerleave', () => setRestaurant(idFor(document.activeElement)));
    });
  }
})();
