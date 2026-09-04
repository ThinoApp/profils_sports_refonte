(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.querySelector('[data-preloader]');
  if (!preloader || reduced) return;

  const heroVideo = document.querySelector('[data-hero-video]');
  const MINIMUM_DURATION = 3800;
  const FAILSAFE_DURATION = 8500;
  const OPENING_DURATION = 1180;
  const READY_THRESHOLD = 3;

  preloader.classList.add('intro-upgraded');
  document.body.classList.add('intro-running');

  preloader.innerHTML = `
    <div class="intro-stage">
      <div class="intro-grid" aria-hidden="true"></div>
      <div class="intro-scan" aria-hidden="true"></div>
      <div class="intro-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="intro-meta">
        <span>PROFILS SPORTS INTERNATIONAL</span>
        <strong data-intro-status>CONSTRUCTION / 01</strong>
      </div>

      <div class="intro-field" aria-hidden="true">
        <i class="intro-field__pitch"></i>
        <i class="intro-field__circle"></i>
        <i class="intro-field__axis"></i>
      </div>

      <div class="intro-orbit intro-orbit--a" aria-hidden="true"></div>
      <div class="intro-orbit intro-orbit--b" aria-hidden="true"></div>

      <div class="intro-lockup">
        <h2 class="intro-wordmark">
          <span><b>PROFILS</b></span>
          <span><b>SPORTS</b></span>
        </h2>
        <div class="intro-side">
          <span class="intro-side__label">DESIGN / CONSTRUCTION</span>
          <p class="intro-side__copy">Architecture sportive, ingénierie de performance, équipements & exploitation.</p>
          <div class="intro-side__rule"><i></i></div>
          <div class="intro-side__progress">
            <span class="intro-side__count" data-intro-count>00</span>
            <small data-intro-readiness>INITIALISATION</small>
          </div>
        </div>
      </div>

      <div class="intro-phases" aria-hidden="true">
        <span data-phase="structure">STRUCTURE</span>
        <span data-phase="surface">SURFACE</span>
        <span data-phase="equipment">ÉQUIPEMENT</span>
        <span data-phase="ready">MISE EN JEU</span>
      </div>

      <div class="intro-signal-line" aria-hidden="true"><i></i></div>
    </div>
    <div class="intro-curtain" aria-hidden="true"><span></span><span></span></div>
  `;

  const count = preloader.querySelector('[data-intro-count]');
  const status = preloader.querySelector('[data-intro-status]');
  const readiness = preloader.querySelector('[data-intro-readiness]');
  const phases = [...preloader.querySelectorAll('[data-phase]')];
  const start = performance.now();

  let videoReady = Boolean(heroVideo && heroVideo.readyState >= READY_THRESHOLD);
  let opening = false;
  let forced = false;
  let raf = 0;
  let finaliseStartedAt = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutQuart = value => 1 - Math.pow(1 - value, 4);

  const setPhase = progress => {
    const index = progress < .27 ? 0 : progress < .52 ? 1 : progress < .76 ? 2 : 3;
    phases.forEach((phase, i) => phase.classList.toggle('is-active', i === index));
    if (status) status.textContent = ['STRUCTURE / 01', 'SURFACE / 02', 'ÉQUIPEMENT / 03', 'MISE EN JEU / 04'][index];
  };

  const markVideoReady = () => {
    if (videoReady) return;
    videoReady = true;
    preloader.classList.add('is-media-ready');
    if (readiness) readiness.textContent = 'MÉDIA PRÊT';
    heroVideo?.play().catch(() => {});
  };

  if (heroVideo) {
    if (heroVideo.readyState >= READY_THRESHOLD) markVideoReady();
    heroVideo.addEventListener('canplay', markVideoReady, { once: true });
    heroVideo.addEventListener('playing', markVideoReady, { once: true });
  } else {
    videoReady = true;
  }

  const open = () => {
    if (opening) return;
    opening = true;
    cancelAnimationFrame(raf);
    preloader.style.setProperty('--intro-progress', '1');
    preloader.style.setProperty('--intro-wait', '1');
    if (count) count.textContent = '100';
    if (readiness) readiness.textContent = forced ? 'OUVERTURE' : 'PRÊT';
    phases.forEach((phase, i) => phase.classList.toggle('is-active', i === phases.length - 1));
    preloader.classList.add('is-opening');
    document.body.classList.add('intro-opening');

    setTimeout(() => {
      preloader.classList.add('is-complete');
      document.body.classList.remove('intro-running', 'intro-opening');
      document.body.classList.add('intro-complete');
    }, OPENING_DURATION);
  };

  const tick = now => {
    const elapsed = now - start;
    const minimumP = clamp(elapsed / MINIMUM_DURATION, 0, 1);

    // The construction sequence deliberately reaches only 88% on time alone.
    // The final 12% is reserved for the moment the Hero video is actually ready.
    let progress = easeOutQuart(minimumP) * .88;

    if (minimumP >= 1 && videoReady) {
      if (!finaliseStartedAt) finaliseStartedAt = now;
      const finishP = clamp((now - finaliseStartedAt) / 520, 0, 1);
      progress = .88 + easeOutQuart(finishP) * .12;
      if (finishP >= 1) {
        open();
        return;
      }
    } else if (minimumP >= 1) {
      // Keep the scene visibly alive while media buffers: never fake 100%.
      const waitSeconds = (elapsed - MINIMUM_DURATION) / 1000;
      const breathing = (Math.sin(waitSeconds * 2.4) + 1) * .5;
      progress = .88 + breathing * .055;
      preloader.style.setProperty('--intro-wait', breathing.toFixed(4));
      if (readiness) readiness.textContent = 'CHARGEMENT VIDÉO';
    }

    preloader.style.setProperty('--intro-progress', progress.toFixed(4));
    preloader.style.setProperty('--intro-time', (elapsed / 1000).toFixed(3));
    if (count) count.textContent = String(Math.round(progress * 100)).padStart(2, '0');
    setPhase(progress);

    if (elapsed >= FAILSAFE_DURATION) {
      forced = true;
      open();
      return;
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
})();
