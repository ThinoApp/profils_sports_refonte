(() => {
  'use strict';

  const preloader = document.querySelector('[data-preloader]');
  if (!preloader) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || location.hash) {
    preloader.classList.add('intro-upgraded', 'is-complete');
    document.body.classList.add('is-loaded', 'intro-complete');
    return;
  }

  const heroVideo = document.querySelector('[data-hero-video]');
  const BUILD_DURATION = 2650;
  const EXIT_DURATION = 1050;
  const PHASES = [
    { at: 0, label: 'IMPLANTATION', code: '01' },
    { at: 0.27, label: 'STRUCTURE', code: '02' },
    { at: 0.56, label: 'ÉQUIPEMENT', code: '03' },
    { at: 0.82, label: 'MISE EN JEU', code: '04' }
  ];

  preloader.classList.add('intro-upgraded');
  document.body.classList.add('intro-running');

  preloader.innerHTML = `
    <div class="intro-stage">
      <div class="intro-atmosphere" aria-hidden="true"></div>
      <div class="intro-grid" aria-hidden="true"></div>

      <div class="intro-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      <div class="intro-meta">
        <span>PROFILS SPORTS INTERNATIONAL</span>
        <span class="intro-meta__center">SPORTS ARCHITECTURE / PERFORMANCE ENGINEERING</span>
        <strong><i data-intro-phase-code>01</i> / 04</strong>
      </div>

      <svg class="intro-blueprint" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="intro-blueprint__ghost">
          <ellipse cx="500" cy="310" rx="438" ry="248"></ellipse>
          <ellipse cx="500" cy="310" rx="380" ry="204"></ellipse>
        </g>
        <g class="intro-blueprint__field">
          <rect x="244" y="126" width="512" height="368"></rect>
          <path d="M500 126V494M244 310H756"></path>
          <circle cx="500" cy="310" r="70"></circle>
          <path d="M244 221H342V399H244M756 221H658V399H756"></path>
        </g>
        <g class="intro-blueprint__marks">
          <path d="M115 86h52M141 60v52M833 508h52M859 482v52"></path>
          <circle cx="141" cy="86" r="16"></circle>
          <circle cx="859" cy="508" r="16"></circle>
        </g>
      </svg>

      <div class="intro-lockup">
        <div class="intro-kicker"><span>DESIGN</span><i></i><span>CONSTRUCTION</span><i></i><span>EXPLOITATION</span></div>
        <h2 class="intro-wordmark">
          <span><b>SPORT</b></span>
          <span class="intro-wordmark__offset"><b>TAKES</b></span>
          <span class="intro-wordmark__signal"><b>SHAPE.</b></span>
        </h2>
      </div>

      <div class="intro-readout">
        <div class="intro-readout__count"><span data-intro-count>000</span><small>%</small></div>
        <div class="intro-readout__state">
          <span>PHASE ACTIVE</span>
          <strong data-intro-phase>IMPLANTATION</strong>
        </div>
        <div class="intro-readout__media" data-intro-media>HERO / STANDBY</div>
      </div>

      <div class="intro-phases" aria-hidden="true">
        ${PHASES.map((phase, index) => `<span data-phase-index="${index}"><i></i><b>${phase.code}</b>${phase.label}</span>`).join('')}
      </div>

      <div class="intro-progress" aria-hidden="true"><i></i></div>
      <div class="intro-impact-line" aria-hidden="true"></div>
    </div>

    <div class="intro-gates" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
  `;

  const count = preloader.querySelector('[data-intro-count]');
  const phaseLabel = preloader.querySelector('[data-intro-phase]');
  const phaseCode = preloader.querySelector('[data-intro-phase-code]');
  const mediaLabel = preloader.querySelector('[data-intro-media]');
  const phaseNodes = [...preloader.querySelectorAll('[data-phase-index]')];
  const start = performance.now();
  let currentPhase = -1;
  let opening = false;
  let raf = 0;

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => 1 - Math.pow(1 - value, 3);

  const setMediaReady = () => {
    preloader.classList.add('is-media-ready');
    if (mediaLabel) mediaLabel.textContent = 'HERO / READY';
    heroVideo?.play().catch(() => {});
  };

  if (!heroVideo) setMediaReady();
  else if (heroVideo.readyState >= 2) setMediaReady();
  else {
    heroVideo.addEventListener('loadeddata', setMediaReady, { once: true });
    heroVideo.addEventListener('canplay', setMediaReady, { once: true });
  }

  const updatePhase = progress => {
    let nextPhase = 0;
    PHASES.forEach((phase, index) => {
      if (progress >= phase.at) nextPhase = index;
    });
    if (nextPhase === currentPhase) return;
    currentPhase = nextPhase;
    const phase = PHASES[currentPhase];
    if (phaseLabel) phaseLabel.textContent = phase.label;
    if (phaseCode) phaseCode.textContent = phase.code;
    phaseNodes.forEach((node, index) => {
      node.classList.toggle('is-active', index === currentPhase);
      node.classList.toggle('is-complete', index < currentPhase);
    });
    preloader.dataset.phase = String(currentPhase + 1);
  };

  const open = () => {
    if (opening) return;
    opening = true;
    cancelAnimationFrame(raf);
    preloader.style.setProperty('--intro-progress', '1');
    preloader.style.setProperty('--intro-field-offset', '0');
    preloader.style.setProperty('--intro-marks-offset', '0');
    if (count) count.textContent = '100';
    updatePhase(1);

    // The Hero starts its own shutters and typography on the exact impact beat.
    document.body.classList.add('is-loaded', 'intro-opening');
    preloader.classList.add('is-opening');

    setTimeout(() => {
      removeEventListener('keydown', skip);
      preloader.classList.add('is-complete');
      document.body.classList.remove('intro-running', 'intro-opening');
      document.body.classList.add('intro-complete');
    }, EXIT_DURATION);
  };

  const tick = now => {
    const linear = clamp((now - start) / BUILD_DURATION);
    const progress = ease(linear);
    preloader.style.setProperty('--intro-progress', progress.toFixed(4));
    preloader.style.setProperty('--intro-field-offset', (2400 * (1 - progress)).toFixed(2));
    preloader.style.setProperty('--intro-marks-offset', (260 * (1 - progress)).toFixed(2));
    if (count) count.textContent = String(Math.round(progress * 100)).padStart(3, '0');
    updatePhase(linear);

    if (linear >= 1) {
      open();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const skip = event => {
    if (performance.now() - start < 650) return;
    if (event.type === 'keydown' && !['Escape', 'Enter', ' '].includes(event.key)) return;
    open();
  };

  preloader.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip);
  requestAnimationFrame(() => preloader.classList.add('is-building'));
  raf = requestAnimationFrame(tick);
})();
