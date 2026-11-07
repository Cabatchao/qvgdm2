/* Pizza Zio — anatomie. Native controls, optional motion, no external dependencies. */
(() => {
  'use strict';

  function initialise() {
    const scene = document.querySelector('[data-scene]');
    if (!scene || scene.dataset.anatomyReady === 'true') return;
    scene.dataset.anatomyReady = 'true';

    const toggles = Array.from(document.querySelectorAll('[data-anatomy-toggle]'));
    const slider = document.querySelector('input[data-spread]');
    const motionButton = document.querySelector('[data-motion-toggle]');
    const status = document.querySelector('[data-scene-status]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
    const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

    let requestedMotion = document.documentElement.dataset.motion !== 'off';
    let hovering = false;
    let pinned = null; // null = exploration; 0 is an explicit, closed pin and must beat hover.
    let bounds = null;
    let frame = 0;
    let lastTime = 0;
    const current = { spread: 0, rx: 0, ry: 0 };
    const target = { spread: 0, rx: 0, ry: 0 };
    const initialSpread = slider ? clamp(number(slider.value) / 100, 0, 1) : 0;
    if (initialSpread > 0) pinned = initialSpread;
    current.spread = target.spread = initialSpread;

    const motionEnabled = () => requestedMotion && !reduced.matches;
    const isMouse = (event) => !event.pointerType || event.pointerType === 'mouse';

    function paint() {
      scene.style.setProperty('--spread', current.spread.toFixed(5));
      scene.style.setProperty('--rx', `${current.rx.toFixed(3)}deg`);
      scene.style.setProperty('--ry', `${current.ry.toFixed(3)}deg`);
    }

    function cancelFrame() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }

    function snapshot() {
      cancelFrame();
      current.spread = target.spread;
      current.rx = target.rx;
      current.ry = target.ry;
      paint();
    }

    function needsFrame() {
      return Math.abs(target.spread - current.spread) > .0005
        || Math.abs(target.rx - current.rx) > .003
        || Math.abs(target.ry - current.ry) > .003;
    }

    function tick(time) {
      frame = 0;
      if (document.hidden || !motionEnabled()) {
        target.rx = target.ry = 0;
        snapshot();
        return;
      }
      // Exponential damping is monotonic: no spring overshoot, even after a rapid reversal.
      const elapsed = lastTime ? clamp(time - lastTime, 0, 48) : 16.67;
      lastTime = time;
      const spreadEase = 1 - Math.exp(-elapsed / 105);
      const tiltEase = 1 - Math.exp(-elapsed / 90);
      current.spread += (target.spread - current.spread) * spreadEase;
      current.rx += (target.rx - current.rx) * tiltEase;
      current.ry += (target.ry - current.ry) * tiltEase;
      paint();
      if (needsFrame()) frame = window.requestAnimationFrame(tick);
      else snapshot();
    }

    function settle() {
      if (!motionEnabled() || document.hidden) {
        target.rx = target.ry = 0;
        snapshot();
      } else if (needsFrame() && !frame) {
        lastTime = 0;
        frame = window.requestAnimationFrame(tick);
      }
    }

    function syncControls() {
      const expanded = target.spread > .0005;
      const percent = Math.round(target.spread * 100);
      const label = expanded ? 'Recomposer la pizza' : 'Décomposer la pizza';
      scene.dataset.expanded = String(expanded);
      for (const toggle of toggles) {
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', label);
        const text = toggle.querySelector('[data-toggle-label]');
        if (text) text.textContent = label;
      }
      if (slider) {
        slider.value = String(percent);
        slider.setAttribute('aria-valuetext', percent === 0 ? 'Pizza assemblée'
          : percent === 100 ? 'Pizza décomposée' : `Décomposition à ${percent} %`);
      }
      if (status) {
        // Do not stream percentages into aria-live; the focused slider announces its own value.
        const description = percent === 0 ? 'Pizza assemblée.'
          : percent === 100 ? 'Pizza décomposée.' : 'Pizza partiellement décomposée.';
        const text = `${description}${pinned !== null ? ' Vue fixée.' : ''}`;
        if (status.textContent !== text) status.textContent = text;
      }
    }

    function resolveSpread() {
      target.spread = pinned === null ? (hovering ? 1 : 0) : pinned;
      syncControls();
      settle();
    }

    function syncMotion() {
      const enabled = motionEnabled();
      document.documentElement.dataset.motion = enabled ? 'on' : 'off';
      target.rx = target.ry = 0;
      if (motionButton) {
        motionButton.setAttribute('aria-pressed', String(enabled));
        motionButton.setAttribute('aria-disabled', String(reduced.matches));
        const label = reduced.matches ? 'Animations réduites' : enabled ? 'Mettre en pause' : 'Activer les animations';
        const text = motionButton.querySelector('[data-motion-label]') || motionButton;
        text.textContent = label;
        motionButton.setAttribute('aria-label', label);
        motionButton.title = reduced.matches
          ? 'Votre préférence système réduit les mouvements. La décomposition reste utilisable.'
          : enabled ? 'Arrêter les mouvements, conserver les commandes de la pizza.' : 'Rétablir les mouvements.';
      }
      settle();
    }

    scene.addEventListener('pointerenter', (event) => {
      if (!finePointer.matches || !isMouse(event)) return;
      hovering = true;
      bounds = scene.getBoundingClientRect();
      resolveSpread();
    });

    scene.addEventListener('pointermove', (event) => {
      if (!hovering || !finePointer.matches || !isMouse(event) || !motionEnabled()) return;
      if (!bounds) bounds = scene.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
      const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
      target.rx = (0.5 - y) * 4;
      target.ry = (x - 0.5) * 4;
      settle();
    });

    function leave(event) {
      if (event && !isMouse(event)) return;
      hovering = false;
      bounds = null;
      target.rx = target.ry = 0;
      resolveSpread();
    }
    scene.addEventListener('pointerleave', leave);
    scene.addEventListener('pointercancel', leave);

    // Native button click includes Enter and Space; no duplicate key handlers are needed.
    for (const toggle of toggles) {
      toggle.addEventListener('click', () => {
        pinned = target.spread > .0005 ? 0 : 1;
        resolveSpread();
      });
    }

    if (slider) {
      slider.addEventListener('input', () => {
        pinned = clamp(number(slider.value, target.spread * 100) / 100, 0, 1);
        resolveSpread();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      pinned = null;
      // Do not reopen under the same pointer after Escape; the next entry resumes exploration.
      hovering = false;
      target.rx = target.ry = 0;
      resolveSpread();
    });

    if (motionButton) {
      motionButton.addEventListener('click', () => {
        if (reduced.matches) return;
        requestedMotion = !requestedMotion;
        syncMotion();
      });
    }

    reduced.addEventListener('change', syncMotion);
    finePointer.addEventListener('change', () => leave());
    window.addEventListener('resize', () => { bounds = null; }, { passive: true });
    window.addEventListener('scroll', () => { bounds = null; }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hovering = false;
        bounds = null;
        target.rx = target.ry = 0;
        resolveSpread(); // A hidden document must never retain a scheduled animation frame.
      } else settle();
    });

    paint();
    syncControls();
    syncMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
