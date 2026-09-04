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
  const EXIT_DURATION = 1400;
  const LOGO_RESOLVE_DURATION = 640;
  const HERO_RELEASE_DELAY = 390;
  const BRIDGE_DURATION = 900;
  const FLIGHT_DURATION = 820;
  const PHASES = [
    { at: 0, label: 'IMPLANTATION' },
    { at: 0.27, label: 'STRUCTURE' },
    { at: 0.56, label: 'ÉQUIPEMENT' },
    { at: 0.82, label: 'MISE EN JEU' }
  ];

  preloader.classList.add('intro-upgraded');
  document.body.classList.add('intro-running');

  preloader.innerHTML = `
    <div class="intro-stage">
      <div class="intro-atmosphere" aria-hidden="true"></div>
      <div class="intro-grid" aria-hidden="true"></div>

      <svg class="intro-blueprint" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="intro-blueprint__ghost">
          <ellipse cx="500" cy="310" rx="438" ry="248"></ellipse>
          <ellipse cx="500" cy="310" rx="380" ry="204"></ellipse>
        </g>
        <g class="intro-blueprint__field">
          <rect data-intro-field-frame x="244" y="126" width="512" height="368"></rect>
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
      </div>

      <div class="intro-progress" aria-hidden="true"><i></i></div>
    </div>

    <img class="intro-logo-proxy" data-intro-logo-proxy alt="" aria-hidden="true">
    <div class="intro-gates" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="intro-bridge" aria-hidden="true">
      <span><b>SPORT</b></span>
      <span class="intro-bridge__offset"><b>TAKES</b></span>
      <span class="intro-bridge__signal"><b>SHAPE.</b></span>
    </div>
    <svg class="intro-flight" data-intro-flight aria-hidden="true">
      <path class="intro-flight__trace" data-intro-flight-trace></path>
      <circle class="intro-flight__landing" data-intro-flight-landing r="6"></circle>
      <g class="intro-flight__runner" data-intro-flight-runner>
        <path d="M-15-8.5 16 0-15 8.5-4 0Z"></path>
        <circle r="3.1"></circle>
      </g>
    </svg>
  `;

  const count = preloader.querySelector('[data-intro-count]');
  const phaseLabel = preloader.querySelector('[data-intro-phase]');
  const fieldFrame = preloader.querySelector('[data-intro-field-frame]');
  const logoProxy = preloader.querySelector('[data-intro-logo-proxy]');
  const wordmarkLines = [...preloader.querySelectorAll('.intro-wordmark > span')];
  const bridge = preloader.querySelector('.intro-bridge');
  const bridgeLines = [...preloader.querySelectorAll('.intro-bridge > span')];
  const heroLines = [...document.querySelectorAll('.hero-title .hero-line')];
  const flight = preloader.querySelector('[data-intro-flight]');
  const flightTrace = preloader.querySelector('[data-intro-flight-trace]');
  const flightRunner = preloader.querySelector('[data-intro-flight-runner]');
  const flightLanding = preloader.querySelector('[data-intro-flight-landing]');
  const brand = document.querySelector('.brand');
  const brandLogo = document.querySelector('.brand-logo');
  const siteHeader = document.querySelector('[data-header]');
  if (logoProxy && brandLogo) logoProxy.src = brandLogo.currentSrc || brandLogo.src;
  const start = performance.now();
  let currentPhase = -1;
  let resolving = false;
  let opening = false;
  let raf = 0;
  let resolveTimer = 0;

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => 1 - Math.pow(1 - value, 3);

  const finalTextBox = line => {
    const lineBox = line.getBoundingClientRect();
    const text = line.querySelector('b');
    let textBox = text?.getBoundingClientRect() || lineBox;
    if (text?.firstChild) {
      const range = document.createRange();
      range.selectNodeContents(text);
      const glyphBox = range.getBoundingClientRect();
      if (glyphBox.width) textBox = glyphBox;
    }
    return {
      left: textBox.left,
      top: lineBox.top,
      width: Math.max(1, textBox.width),
      height: Math.max(1, lineBox.height),
      right: textBox.right,
      bottom: lineBox.bottom
    };
  };

  // The bridge is not positioned with CSS guesses. Each line starts on the
  // rendered loader word and travels to the measured Hero line box (FLIP).
  const prepareBridge = () => {
    if (!bridge || wordmarkLines.length !== 3 || bridgeLines.length !== 3 || heroLines.length !== 3) return [];

    const sourceBoxes = wordmarkLines.map(finalTextBox);
    const targetBoxes = heroLines.map(finalTextBox);
    bridge.style.opacity = '1';

    bridgeLines.forEach((line, index) => {
      const source = sourceBoxes[index];
      const target = targetBoxes[index];
      const deltaX = target.left - source.left;
      const deltaY = target.top - source.top;
      const scaleX = target.width / source.width;
      const scaleY = target.height / source.height;

      Object.assign(line.style, {
        left: `${source.left}px`,
        top: `${source.top}px`,
        width: `${source.width}px`,
        height: `${source.height}px`,
        paddingLeft: '0',
        opacity: '1',
        transform: 'translate3d(0,0,0) scale(1,1)',
        transformOrigin: '0 0'
      });

      const finalTransform = `translate3d(${deltaX}px,${deltaY}px,0) scale(${scaleX},${scaleY})`;
      if (typeof line.animate === 'function') {
        line.animate([
          { transform: 'translate3d(0,0,0) scale(1,1)', opacity: 1, offset: 0 },
          { transform: finalTransform, opacity: 1, offset: .72 },
          { transform: finalTransform, opacity: 0, offset: 1 }
        ], {
          duration: BRIDGE_DURATION,
          delay: index * 28,
          easing: 'cubic-bezier(.18,.82,.18,1)',
          fill: 'forwards'
        });
      } else {
        line.style.transition = `transform ${BRIDGE_DURATION * .72}ms cubic-bezier(.18,.82,.18,1),opacity 240ms ${BRIDGE_DURATION * .72}ms ease`;
        requestAnimationFrame(() => {
          line.style.transform = finalTransform;
          line.style.opacity = '0';
        });
      }
    });

    return sourceBoxes;
  };

  const cubicEase = value => value < .5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

  // The logo born from the field and the signal dart share one measured
  // Bézier until the moving logo occupies the exact header-logo geometry.
  const startFlight = () => {
    if (!flight || !flightTrace || !flightRunner || !flightLanding || !logoProxy || !brandLogo) return;

    const source = logoProxy.getBoundingClientRect();
    const logoBox = brandLogo.getBoundingClientRect();
    const headerTransform = siteHeader ? getComputedStyle(siteHeader).transform : 'none';
    const Matrix = window.DOMMatrixReadOnly || window.DOMMatrix || window.WebKitCSSMatrix;
    const headerMatrix = headerTransform === 'none' || !Matrix ? null : new Matrix(headerTransform);
    const origin = {
      x: source.left + source.width * .5,
      y: source.top + source.height * .5
    };
    const destination = {
      x: logoBox.left + logoBox.width * .5 - (headerMatrix?.m41 || 0),
      y: logoBox.top + logoBox.height * .5 - (headerMatrix?.m42 || 0)
    };
    const horizontalSpan = Math.max(1, Math.abs(origin.x - destination.x));
    const controlA = {
      x: Math.min(innerWidth - 24, origin.x + Math.min(150, horizontalSpan * .2)),
      y: Math.max(44, origin.y - Math.min(innerHeight * .24, 210))
    };
    const controlB = {
      x: destination.x + Math.min(250, horizontalSpan * .36),
      y: destination.y + Math.min(innerHeight * .16, 118)
    };
    const pathData = `M${origin.x.toFixed(1)} ${origin.y.toFixed(1)}C${controlA.x.toFixed(1)} ${controlA.y.toFixed(1)} ${controlB.x.toFixed(1)} ${controlB.y.toFixed(1)} ${destination.x.toFixed(1)} ${destination.y.toFixed(1)}`;

    flight.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    flightTrace.setAttribute('d', pathData);
    flightLanding.setAttribute('cx', destination.x.toFixed(1));
    flightLanding.setAttribute('cy', destination.y.toFixed(1));

    const length = flightTrace.getTotalLength();
    flightTrace.style.strokeDasharray = String(length);
    flightTrace.style.strokeDashoffset = String(length);
    flight.classList.add('is-flying');
    logoProxy.style.transition = 'none';
    logoProxy.style.clipPath = 'circle(50% at 50% 50%)';

    const firstPoint = flightTrace.getPointAtLength(0);
    flightRunner.setAttribute('transform', `translate(${firstPoint.x} ${firstPoint.y})`);
    const sourceSize = Math.max(1, source.width);
    const destinationScale = logoBox.width / sourceSize;
    const flightStart = performance.now();

    const animateFlight = now => {
      const progress = clamp((now - flightStart) / FLIGHT_DURATION);
      const eased = cubicEase(progress);
      const travelled = length * eased;
      const point = flightTrace.getPointAtLength(travelled);
      const cursorLead = 14 + Math.max(28, sourceSize * .68) * (1 - eased);
      const cursorDistance = Math.min(length, travelled + cursorLead);
      const cursorPoint = flightTrace.getPointAtLength(cursorDistance);
      const behind = flightTrace.getPointAtLength(Math.max(0, cursorDistance - 2));
      const ahead = flightTrace.getPointAtLength(Math.min(length, cursorDistance + 2));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      const logoScale = 1 + (destinationScale - 1) * eased;

      flightTrace.style.strokeDashoffset = String(length - travelled);
      logoProxy.style.transform = `translate3d(${point.x - origin.x}px,${point.y - origin.y}px,0) scale(${logoScale})`;
      flightRunner.setAttribute('transform', `translate(${cursorPoint.x} ${cursorPoint.y}) rotate(${angle})`);

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
        return;
      }

      document.body.classList.add('intro-logo-landed');
      flight.classList.add('is-landed');
      logoProxy.style.transition = 'opacity .18s ease';
      logoProxy.classList.add('is-landed');
      brand?.classList.add('is-intro-landed');
      setTimeout(() => brand?.classList.remove('is-intro-landed'), 650);
    };

    requestAnimationFrame(animateFlight);
  };

  const setMediaReady = () => {
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
    preloader.dataset.phase = String(currentPhase + 1);
  };

  const completeBuild = () => {
    preloader.style.setProperty('--intro-progress', '1');
    preloader.style.setProperty('--intro-field-offset', '0');
    preloader.style.setProperty('--intro-marks-offset', '0');
    if (count) count.textContent = '100';
    updatePhase(1);
  };

  const positionLogoProxy = () => {
    if (!fieldFrame || !logoProxy) return;
    const fieldBox = fieldFrame.getBoundingClientRect();
    const compact = innerWidth <= 620;
    const maxSize = compact ? Math.min(116, innerWidth * .3) : 184;
    const minSize = compact ? 74 : 86;
    const size = Math.max(minSize, Math.min(maxSize, Math.min(fieldBox.width, fieldBox.height) * .44));
    const margin = compact ? 20 : 30;
    const fieldCentreX = fieldBox.left + fieldBox.width * .5;
    const fieldCentreY = fieldBox.top + fieldBox.height * .5;
    const centreX = Math.min(innerWidth - margin - size * .5, Math.max(margin + size * .5, fieldCentreX));
    const centreY = Math.min(innerHeight - margin - size * .5, Math.max(margin + size * .5, fieldCentreY));
    Object.assign(logoProxy.style, {
      left: `${centreX - size * .5}px`,
      top: `${centreY - size * .5}px`,
      width: `${size}px`,
      height: `${size}px`
    });
  };

  const beginResolve = () => {
    if (resolving || opening) return;
    resolving = true;
    cancelAnimationFrame(raf);
    completeBuild();
    positionLogoProxy();
    // Commit the initial proxy geometry before the field-to-logo transition.
    void logoProxy?.offsetWidth;
    preloader.classList.add('is-resolving');
    resolveTimer = setTimeout(open, LOGO_RESOLVE_DURATION);
  };

  const open = () => {
    if (opening) return;
    opening = true;
    clearTimeout(resolveTimer);
    cancelAnimationFrame(raf);
    completeBuild();

    // Measure both rendered scenes before opening alters either geometry.
    prepareBridge();
    startFlight();

    // The Hero opens under the FLIP bridge; its real type is released only as
    // the travelling copy reaches the measured destination.
    document.body.classList.add('is-loaded', 'intro-opening');
    preloader.classList.add('is-opening');

    setTimeout(() => {
      document.body.classList.add('intro-hero-release');
    }, HERO_RELEASE_DELAY);

    // The overlay stays mounted until the longest visible Hero/brand motion is
    // settled. Its root is transparent and non-interactive during this phase.
    setTimeout(() => {
      removeEventListener('keydown', skip);
      preloader.classList.add('is-complete');
      document.body.classList.remove('intro-running', 'intro-opening', 'intro-hero-release', 'intro-logo-landed');
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
      beginResolve();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const skip = event => {
    if (performance.now() - start < 650) return;
    if (event.type === 'keydown' && !['Escape', 'Enter', ' '].includes(event.key)) return;
    beginResolve();
  };

  preloader.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip);
  requestAnimationFrame(() => preloader.classList.add('is-building'));
  raf = requestAnimationFrame(tick);
})();
