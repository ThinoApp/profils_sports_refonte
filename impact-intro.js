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

      <svg class="intro-blueprint" viewBox="180 70 640 480" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g class="intro-blueprint__ghost">
          <ellipse cx="500" cy="310" rx="438" ry="248"></ellipse>
          <ellipse cx="500" cy="310" rx="380" ry="204"></ellipse>
        </g>
        <g class="intro-blueprint__field">
          <rect data-intro-field-frame data-intro-build-segment x="244" y="126" width="512" height="368"></rect>
          <path data-intro-build-segment d="M500 126V494"></path>
          <circle data-intro-build-segment cx="500" cy="310" r="70"></circle>
          <path data-intro-build-segment d="M244 221H342V399H244"></path>
          <path data-intro-build-segment d="M244 310H756"></path>
          <path data-intro-build-segment d="M756 221H658V399H756"></path>
        </g>
        <g class="intro-blueprint__marks">
          <path d="M115 86h52M141 60v52M833 508h52M859 482v52"></path>
          <circle cx="141" cy="86" r="16"></circle>
          <circle cx="859" cy="508" r="16"></circle>
        </g>
      </svg>

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
    <span class="intro-builder-cursor" data-intro-builder-cursor aria-hidden="true"><i></i></span>
    <div class="intro-gates" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <svg class="intro-flight" data-intro-flight aria-hidden="true">
      <path class="intro-flight__trace" data-intro-flight-trace></path>
      <circle class="intro-flight__landing" data-intro-flight-landing r="6"></circle>
    </svg>
  `;

  const count = preloader.querySelector('[data-intro-count]');
  const phaseLabel = preloader.querySelector('[data-intro-phase]');
  const fieldFrame = preloader.querySelector('[data-intro-field-frame]');
  const buildSegments = [...preloader.querySelectorAll('[data-intro-build-segment]')];
  const logoProxy = preloader.querySelector('[data-intro-logo-proxy]');
  const builderCursor = preloader.querySelector('[data-intro-builder-cursor]');
  const flight = preloader.querySelector('[data-intro-flight]');
  const flightTrace = preloader.querySelector('[data-intro-flight-trace]');
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
  let resolveCursorRaf = 0;
  const cursorState = { x: 0, y: 0, angle: 0, ready: false };

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => 1 - Math.pow(1 - value, 3);

  const cubicEase = value => value < .5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

  const segmentRanges = [
    [0, .31],
    [.31, .43],
    [.43, .58],
    [.58, .70],
    [.70, .84],
    [.84, 1]
  ];
  const segmentData = buildSegments.map((node, index) => {
    const length = node.getTotalLength();
    const dashLength = length + 2;
    node.style.strokeDasharray = `${dashLength} ${dashLength}`;
    node.style.strokeDashoffset = String(dashLength);
    return { node, length, dashLength, range: segmentRanges[index] || [0, 1] };
  });

  const placeBuilderCursor = (x, y, angle, immediate = false) => {
    if (!builderCursor) return;
    if (!cursorState.ready || immediate) {
      cursorState.x = x;
      cursorState.y = y;
      cursorState.angle = angle;
      cursorState.ready = true;
    } else {
      cursorState.x += (x - cursorState.x) * .42;
      cursorState.y += (y - cursorState.y) * .42;
      const angleDelta = ((angle - cursorState.angle + 540) % 360) - 180;
      cursorState.angle += angleDelta * .38;
    }
    builderCursor.style.transform = `translate3d(${cursorState.x - 16}px,${cursorState.y - 9}px,0) rotate(${cursorState.angle}deg)`;
    builderCursor.classList.add('is-active');
  };

  const segmentScreenPoint = (node, distance) => {
    const length = node.getTotalLength();
    const point = node.getPointAtLength(Math.min(length, Math.max(0, distance)));
    const behind = node.getPointAtLength(Math.max(0, distance - 2));
    const ahead = node.getPointAtLength(Math.min(length, distance + 2));
    const matrix = node.getScreenCTM();
    if (!matrix) return null;
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
    const screenBehind = new DOMPoint(behind.x, behind.y).matrixTransform(matrix);
    const screenAhead = new DOMPoint(ahead.x, ahead.y).matrixTransform(matrix);
    return {
      x: screenPoint.x,
      y: screenPoint.y,
      angle: Math.atan2(screenAhead.y - screenBehind.y, screenAhead.x - screenBehind.x) * 180 / Math.PI
    };
  };

  const updateBuildDrawing = (progress, immediateCursor = false) => {
    let active = segmentData[0];
    let activeProgress = 0;
    segmentData.forEach(data => {
      const [from, to] = data.range;
      const local = clamp((progress - from) / Math.max(.001, to - from));
      const drawn = cubicEase(local);
      data.node.style.strokeDashoffset = String(data.dashLength * (1 - drawn));
      if (progress >= from) {
        active = data;
        activeProgress = drawn;
      }
    });
    if (!active) return;
    const cursorPoint = segmentScreenPoint(active.node, active.length * activeProgress);
    if (cursorPoint) placeBuilderCursor(cursorPoint.x, cursorPoint.y, cursorPoint.angle, immediateCursor);
  };

  const animateCursorToLogo = logoGeometry => {
    if (!builderCursor || !logoGeometry || !cursorState.ready) return;
    cancelAnimationFrame(resolveCursorRaf);
    const from = { x: cursorState.x, y: cursorState.y };
    const to = {
      x: logoGeometry.x + logoGeometry.size * .55,
      y: logoGeometry.y - logoGeometry.size * .2
    };
    const control = {
      x: from.x + (to.x - from.x) * .48,
      y: Math.min(from.y, to.y) - Math.min(90, innerHeight * .1)
    };
    const cursorStart = performance.now();
    const animateResolveCursor = now => {
      const progress = clamp((now - cursorStart) / LOGO_RESOLVE_DURATION);
      const eased = cubicEase(progress);
      const inverse = 1 - eased;
      const x = inverse * inverse * from.x + 2 * inverse * eased * control.x + eased * eased * to.x;
      const y = inverse * inverse * from.y + 2 * inverse * eased * control.y + eased * eased * to.y;
      const tangentX = 2 * inverse * (control.x - from.x) + 2 * eased * (to.x - control.x);
      const tangentY = 2 * inverse * (control.y - from.y) + 2 * eased * (to.y - control.y);
      placeBuilderCursor(x, y, Math.atan2(tangentY, tangentX) * 180 / Math.PI, true);
      if (progress < 1) resolveCursorRaf = requestAnimationFrame(animateResolveCursor);
    };
    resolveCursorRaf = requestAnimationFrame(animateResolveCursor);
  };

  // The logo born from the field and the signal dart share one measured
  // Bézier until the moving logo occupies the exact header-logo geometry.
  const startFlight = () => {
    if (!flight || !flightTrace || !builderCursor || !flightLanding || !logoProxy || !brandLogo) return;

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
      placeBuilderCursor(cursorPoint.x, cursorPoint.y, angle, true);

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
        return;
      }

      document.body.classList.add('intro-logo-landed');
      flight.classList.add('is-landed');
      logoProxy.style.transition = 'opacity .18s ease';
      logoProxy.classList.add('is-landed');
      builderCursor.classList.add('is-landed');
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
    preloader.style.setProperty('--intro-marks-offset', '0');
    updateBuildDrawing(1, true);
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
    return { x: centreX, y: centreY, size };
  };

  const beginResolve = () => {
    if (resolving || opening) return;
    resolving = true;
    cancelAnimationFrame(raf);
    completeBuild();
    const logoGeometry = positionLogoProxy();
    animateCursorToLogo(logoGeometry);
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
    cancelAnimationFrame(resolveCursorRaf);
    completeBuild();

    // Measure the moving and final logo before opening alters either geometry.
    startFlight();

    // The Hero opens under the flight; its title appears here for the first
    // time, after the loader has already resolved into the brand mark.
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
    preloader.style.setProperty('--intro-marks-offset', (260 * (1 - progress)).toFixed(2));
    updateBuildDrawing(linear);
    if (count) count.textContent = String(Math.min(99, Math.round(progress * 100))).padStart(3, '0');
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
