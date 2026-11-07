/* Studio: local progressive enhancement. No tracking, persistence or network request. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let requestedMotion = null;
  const motionEnabled = () => !reducedMotion.matches && document.documentElement.dataset.motion !== 'off' &&
    (requestedMotion ?? (typeof window.zioMotionEnabled !== 'function' || window.zioMotionEnabled()));
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  let observer = null;
  let panelAnimation = null;

  function syncMotion() {
    observer?.disconnect();
    observer = null;
    panelAnimation?.cancel();
    panelAnimation = null;
    const enabled = motionEnabled();
    document.documentElement.classList.toggle('motion-ready', enabled);
    revealElements.forEach(element => {
      element.classList.remove('is-pending', 'is-entered');
    });
    if (!enabled || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.remove('is-pending');
        element.classList.add('is-entered');
        element.dataset.seen = 'true';
        observer?.unobserve(element);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    revealElements.forEach(element => {
      if (element.dataset.seen === 'true') return;
      element.classList.add('is-pending');
      observer.observe(element);
    });
  }

  const formatSection = document.querySelector('.formats-section');
  const switcher = document.querySelector('[data-format-switch]');
  const buttons = [...document.querySelectorAll('[data-format-button]')];
  const panels = [...document.querySelectorAll('[data-format-panel]')];
  const status = document.querySelector('[data-format-status]');
  const validSwitcher = formatSection && switcher && buttons.length === 2 && panels.length === 2 &&
    buttons.every(button => panels.some(panel => panel.dataset.formatPanel === button.dataset.formatButton && panel.id === button.getAttribute('aria-controls')));

  if (validSwitcher) {
    let selectedIndex = 0;
    function selectFormat(index, announce = true) {
      if (index < 0 || index >= buttons.length) return;
      panelAnimation?.cancel();
      panelAnimation = null;
      const changed = index !== selectedIndex;
      selectedIndex = index;
      const activeButton = buttons[index];
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.formatPanel !== activeButton.dataset.formatButton;
      });
      const activePanel = panels.find(panel => !panel.hidden);
      if (changed && motionEnabled() && typeof activePanel?.animate === 'function') {
        panelAnimation = activePanel.animate([
          { opacity: 0.35, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 420, easing: 'cubic-bezier(.22,.7,.2,1)' });
      }
      if (announce && status) status.textContent = `Format sélectionné : ${activeButton.textContent.trim()}.`;
    }
    switcher.setAttribute('role', 'tablist');
    buttons.forEach((button, index) => {
      button.setAttribute('role', 'tab');
      button.addEventListener('click', () => selectFormat(index));
      button.addEventListener('keydown', event => {
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index + buttons.length - 1) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        buttons[nextIndex].focus();
        selectFormat(nextIndex);
      });
      const panel = panels.find(item => item.dataset.formatPanel === button.dataset.formatButton);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.tabIndex = 0;
    });
    selectFormat(0, false);
    formatSection.classList.add('is-enhanced');
    switcher.hidden = false;
  }

  document.addEventListener('zio-motion-change', event => {
    if (typeof event.detail?.enabled === 'boolean') requestedMotion = event.detail.enabled;
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();
})();
