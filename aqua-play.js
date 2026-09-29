(() => {
  'use strict';

  const gallery = document.querySelector('#catalogues .catalogue-gallery');
  const row = gallery?.querySelector('[data-catalogue="aqua"]');
  const header = document.querySelector('[data-header]');
  const shortcuts = [...document.querySelectorAll('[data-aqua-shortcut]')];
  if (!gallery || !row) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canClipWipe = Boolean(window.CSS?.supports?.('clip-path', 'polygon(0 0, 100% 0, 100% 100%)'));
  const products = {
    court: {
      title: 'WATER COURT',
      fr: 'Le terrain de sport flottant',
      en: 'The floating sports court',
      file: 'water-court'
    },
    bike: {
      title: 'WATER BIKE',
      fr: 'Le vélo nautique',
      en: 'The water bike',
      file: 'water-bike'
    }
  };

  const portal = document.createElement('section');
  portal.className = 'aqua-portal';
  portal.hidden = true;
  portal.dataset.product = 'court';
  portal.setAttribute('role', 'dialog');
  portal.setAttribute('aria-modal', 'true');
  portal.setAttribute('aria-hidden', 'true');
  portal.setAttribute('aria-labelledby', 'aqua-portal-title');
  portal.innerHTML = `
    <div class="aqua-portal__handoff" aria-hidden="true"></div>
    <div class="aqua-portal__scene aqua-portal__scene--court" aria-hidden="true"></div>
    <div class="aqua-portal__scene aqua-portal__scene--bike" aria-hidden="true"></div>
    <canvas class="aqua-portal__water" data-aqua-water aria-hidden="true"></canvas>
    <div class="aqua-portal__entry-ripple" aria-hidden="true"></div>
    <div class="aqua-portal__shade" aria-hidden="true"></div>
    <div class="aqua-portal__wipe-edge" aria-hidden="true"></div>
    <div class="aqua-portal__line" aria-hidden="true"></div>
    <header class="aqua-portal__top">
      <div class="aqua-portal__brand"><img src="assets/aqua-play/logo.png" alt=""><span>PROFILS SPORTS × AQUA PLAY</span></div>
      <button type="button" class="aqua-portal__close" data-aqua-close>FERMER ×</button>
    </header>
    <div class="aqua-portal__content">
      <p class="aqua-portal__index" data-aqua-index>COLLECTION / 01 — 02</p>
      <h2 class="aqua-portal__title" id="aqua-portal-title"><span>AQUA</span><span>PLAY.</span></h2>
      <div class="aqua-portal__detail" aria-live="polite">
        <h3 data-aqua-title>WATER COURT</h3>
        <p data-aqua-description>Le terrain de sport flottant</p>
      </div>
      <div class="aqua-portal__choices" role="group" aria-label="Aqua Play">
        <button class="aqua-portal__choice" type="button" data-aqua-choice="court" aria-pressed="true"><small>01 / 02</small>WATER COURT</button>
        <button class="aqua-portal__choice" type="button" data-aqua-choice="bike" aria-pressed="false"><small>02 / 02</small>WATER BIKE</button>
      </div>
      <div class="aqua-portal__document">
        <a class="aqua-portal__link" data-aqua-link href="assets/aqua-play/water-court-fr.pdf" target="_blank" rel="noopener noreferrer">VOIR LA FICHE <span aria-hidden="true">↗</span></a>
        <div class="aqua-portal__languages" role="group" aria-label="Langue de la fiche">
          <button type="button" data-aqua-locale="fr" aria-pressed="true">FR</button><span aria-hidden="true">/</span><button type="button" data-aqua-locale="en" aria-pressed="false">EN</button>
        </div>
      </div>
    </div>
    <footer class="aqua-portal__footer"><span data-aqua-note>VISUELS DE PRÉSENTATION · FICHES FR / EN</span><span>PROFILS SPORTS INTERNATIONAL</span></footer>
  `;
  document.body.appendChild(portal);

  const closeButton = portal.querySelector('[data-aqua-close]');
  const title = portal.querySelector('[data-aqua-title]');
  const description = portal.querySelector('[data-aqua-description]');
  const index = portal.querySelector('[data-aqua-index]');
  const link = portal.querySelector('[data-aqua-link]');
  const note = portal.querySelector('[data-aqua-note]');
  const choices = [...portal.querySelectorAll('[data-aqua-choice]')];
  const localeButtons = [...portal.querySelectorAll('[data-aqua-locale]')];
  const localeGroup = portal.querySelector('.aqua-portal__languages');
  const waterCanvas = portal.querySelector('[data-aqua-water]');
  const bikeScene = portal.querySelector('.aqua-portal__scene--bike');
  const wipeEdge = portal.querySelector('.aqua-portal__wipe-edge');
  const water = window.AquaWaterSurface
    ? new window.AquaWaterSurface({ portal, canvas:waterCanvas, reduced })
    : null;
  let currentProduct = 'court';
  let documentLocale = document.documentElement.lang === 'en' ? 'en' : 'fr';
  let isOpen = false;
  let previousFocus = null;
  let backgroundState = [];
  let closeTimer = 0;
  let entranceTimer = 0;
  let lightFrame = 0;
  let lightPoint = null;
  let headerLightFrame = 0;
  let headerLightPoint = null;
  let originSource = row;
  let productSwitchTimer = 0;
  let rippleTimer = 0;
  let wipeFrame = 0;
  let wipeLastFrame = 0;
  let wipeValue = 0;
  let wipeTarget = 0;
  let wipeStartValue = 0;
  let wipeStartedAt = 0;
  let wipeDuration = 900;
  let wipePhase = 0;

  const english = () => document.documentElement.lang === 'en';
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const viewport = () => ({
    width:window.visualViewport?.width || document.documentElement.clientWidth,
    height:window.visualViewport?.height || innerHeight,
    top:window.visualViewport?.offsetTop || 0,
    left:window.visualViewport?.offsetLeft || 0
  });
  const sourceOrigin = (sourceElement = originSource) => {
    const box = viewport();
    const rect = (sourceElement || row).getBoundingClientRect();
    return {
      x:clamp((rect.left + rect.width / 2 - box.left) / Math.max(1, box.width), 0, 1),
      y:clamp((rect.top + rect.height / 2 - box.top) / Math.max(1, box.height), 0, 1)
    };
  };
  const setOrigin = (sourceElement = originSource) => {
    const box = viewport();
    const sourceElementRect = (sourceElement || row).getBoundingClientRect();
    const handoffRect = sourceElement === row ? gallery.getBoundingClientRect() : sourceElementRect;
    portal.style.setProperty('--aqua-top', `${box.top}px`);
    portal.style.setProperty('--aqua-left', `${box.left}px`);
    portal.style.setProperty('--aqua-width', `${box.width}px`);
    portal.style.setProperty('--aqua-height', `${box.height}px`);
    portal.style.setProperty('--aqua-origin', `${clamp(sourceElementRect.top - box.top, 0, box.height)}px ${Math.max(0, box.width - sourceElementRect.right + box.left)}px ${Math.max(0, box.height - sourceElementRect.bottom + box.top)}px ${Math.max(0, sourceElementRect.left - box.left)}px`);
    portal.style.setProperty('--aqua-handoff-x', `${handoffRect.left - box.left}px`);
    portal.style.setProperty('--aqua-handoff-y', `${handoffRect.top - box.top}px`);
    portal.style.setProperty('--aqua-handoff-width', `${handoffRect.width}px`);
    portal.style.setProperty('--aqua-handoff-height', `${handoffRect.height}px`);
    portal.style.setProperty('--aqua-ripple-x', `${sourceElementRect.left + sourceElementRect.width / 2 - box.left}px`);
    portal.style.setProperty('--aqua-ripple-y', `${sourceElementRect.top + sourceElementRect.height / 2 - box.top}px`);
    const localX = clamp(sourceElementRect.left + sourceElementRect.width / 2 - box.left, 0, box.width);
    const localY = clamp(sourceElementRect.top + sourceElementRect.height / 2 - box.top, 0, box.height);
    const radius = Math.hypot(Math.max(localX, box.width - localX), Math.max(localY, box.height - localY)) + 24;
    portal.style.setProperty('--aqua-reveal-radius', `${radius}px`);
    portal.style.setProperty('--aqua-ripple-size', `${radius * 2}px`);
    const origin = sourceOrigin(sourceElement);
    water?.setOrigin(origin);
    return origin;
  };

  // Keep both authentic photos in the DOM: only the upper photo is clipped.
  // The boundary can reverse mid-flight without replacing or resampling either image.
  const paintWipe = (active = false) => {
    portal.dataset.waterWipe = wipeValue.toFixed(3);
    const width = Math.max(1, portal.getBoundingClientRect().width || viewport().width);
    const height = Math.max(1, portal.getBoundingClientRect().height || viewport().height);
    if (wipeValue <= .001 || wipeValue >= .999) {
      bikeScene.style.clipPath = wipeValue >= .999 ? 'inset(0)' : 'inset(0 100% 0 0)';
      wipeEdge.style.opacity = '0';
    } else {
      const amplitude = Math.min(48, Math.max(20, width * .033)) * Math.sin(Math.PI * wipeValue);
      const samples = width < 720 ? 16 : 24;
      const edgeAt = ratio => clamp(
        width * wipeValue + amplitude * (Math.sin(ratio * 13 + wipePhase) * .72 + Math.sin(ratio * 31 - wipePhase * .55) * .28),
        0,
        width
      );
      const boundary = [];
      const left = [];
      const right = [];
      for (let step = 0; step <= samples; step += 1) {
        const ratio = step / samples;
        const y = Math.round(ratio * height);
        const edge = edgeAt(ratio);
        boundary.push(`${edge.toFixed(1)}px ${y}px`);
        left.push(`${clamp(edge - 15, 0, width).toFixed(1)}px ${y}px`);
        right.push(`${clamp(edge + 18, 0, width).toFixed(1)}px ${y}px`);
      }
      bikeScene.style.clipPath = `polygon(0px 0px, ${boundary.join(', ')}, 0px ${height}px)`;
      wipeEdge.style.clipPath = `polygon(${left.join(', ')}, ${right.reverse().join(', ')})`;
      wipeEdge.style.opacity = active ? String(Math.min(.82, Math.sin(Math.PI * wipeValue) * .82)) : '0';
    }
    water?.setWipe(wipeValue, wipePhase, active);
  };
  const stopWipe = () => {
    if (wipeFrame) cancelAnimationFrame(wipeFrame);
    wipeFrame = 0;
    wipeLastFrame = 0;
  };
  const setWipeInstant = value => {
    stopWipe();
    wipeValue = wipeTarget = wipeStartValue = value;
    wipeStartedAt = 0;
    wipePhase = 0;
    paintWipe(false);
    portal.dataset.waterTransition = 'idle';
  };
  const tickWipe = now => {
    wipeFrame = 0;
    if (!isOpen || reduced) return;
    const dt = Math.min(64, wipeLastFrame ? now - wipeLastFrame : 16.67);
    wipeLastFrame = now;
    const progress = clamp((now - wipeStartedAt) / wipeDuration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    wipeValue = wipeStartValue + (wipeTarget - wipeStartValue) * eased;
    wipePhase += dt * .0024;
    const settled = progress >= 1;
    if (settled) wipeValue = wipeTarget;
    paintWipe(!settled);
    if (settled) {
      wipeLastFrame = 0;
      portal.dataset.waterTransition = 'idle';
    } else {
      wipeFrame = requestAnimationFrame(tickWipe);
    }
  };
  const transitionWipe = key => {
    wipeStartValue = wipeValue;
    wipeTarget = key === 'bike' ? 1 : 0;
    wipeStartedAt = performance.now();
    wipeDuration = Math.max(380, 900 * Math.abs(wipeTarget - wipeStartValue));
    portal.dataset.waterTransition = `${wipeTarget ? 'court-to-bike' : 'bike-to-court'}`;
    if (!wipeFrame) wipeFrame = requestAnimationFrame(tickWipe);
  };

  const updateCopy = () => {
    const product = products[currentProduct];
    title.textContent = product.title;
    description.textContent = product[english() ? 'en' : 'fr'];
    index.textContent = english() ? 'COLLECTION / 01 — 02' : 'COLLECTION / 01 — 02';
    closeButton.textContent = english() ? 'CLOSE ×' : 'FERMER ×';
    closeButton.setAttribute('aria-label', english() ? 'Close Aqua Play' : 'Fermer Aqua Play');
    link.firstChild.textContent = english() ? 'OPEN THE BROCHURE ' : 'VOIR LA FICHE ';
    link.href = `assets/aqua-play/${product.file}-${documentLocale}.pdf`;
    link.setAttribute('aria-label', documentLocale === 'en' ? `Open the ${product.title} brochure in English` : `Ouvrir la fiche ${product.title} en français`);
    localeGroup.setAttribute('aria-label', english() ? 'Brochure language' : 'Langue de la fiche');
    localeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.aquaLocale === documentLocale)));
    note.textContent = english() ? 'PRESENTATION VISUALS · FR / EN SHEETS' : 'VISUELS DE PRÉSENTATION · FICHES FR / EN';
    row.href = `assets/aqua-play/water-court-${english() ? 'en' : 'fr'}.pdf`;
    shortcuts.forEach(shortcut => {
      shortcut.href = `assets/aqua-play/water-court-${english() ? 'en' : 'fr'}.pdf`;
      shortcut.setAttribute('aria-label', english() ? 'Open Aqua Play' : 'Ouvrir Aqua Play');
    });
  };

  const selectProduct = (key, { instant = false } = {}) => {
    if (!products[key]) return;
    const changed = key !== currentProduct;
    currentProduct = key;
    portal.dataset.product = key;
    choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.aquaChoice === key)));
    updateCopy();

    if (!changed && !instant) return;
    clearTimeout(productSwitchTimer);
    portal.classList.remove('is-product-switching');
    if (instant || reduced || !canClipWipe) {
      setWipeInstant(key === 'bike' ? 1 : 0);
      return;
    }

    transitionWipe(key);
    void portal.offsetWidth;
    portal.classList.add('is-product-switching');
    productSwitchTimer = setTimeout(() => portal.classList.remove('is-product-switching'), reduced ? 0 : 860);
  };

  const setImmersed = (active, event) => {
    if (!active && (isOpen || portal.classList.contains('is-closing'))) return;
    if (active) {
      const galleryRect = gallery.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const x = event?.clientX ?? rowRect.left + rowRect.width / 2;
      const y = event?.clientY ?? rowRect.top + rowRect.height / 2;
      const localX = clamp(x - galleryRect.left, 0, galleryRect.width);
      const localY = clamp(y - galleryRect.top, 0, galleryRect.height);
      const radius = Math.hypot(Math.max(localX, galleryRect.width - localX), Math.max(localY, galleryRect.height - localY)) + 24;
      gallery.style.setProperty('--aqua-gallery-x', `${localX}px`);
      gallery.style.setProperty('--aqua-gallery-y', `${localY}px`);
      gallery.style.setProperty('--aqua-gallery-radius', `${radius}px`);
    }
    gallery.classList.toggle('is-aqua-hover', active);
    document.body.classList.toggle('catalogue-aqua-hover', active);
  };
  const setHeaderPreview = active => {
    if (!header) return;
    const next = Boolean(active && !isOpen && !portal.classList.contains('is-closing'));
    header.classList.toggle('is-aqua-preview', next);
    if (!next) {
      header.style.removeProperty('--aqua-header-light-x');
      header.style.removeProperty('--aqua-header-light-y');
    }
  };
  const moveHeaderLight = event => {
    if (!header || reduced || event.pointerType === 'touch') return;
    headerLightPoint = { x:event.clientX, y:event.clientY };
    if (headerLightFrame) return;
    headerLightFrame = requestAnimationFrame(() => {
      headerLightFrame = 0;
      if (!headerLightPoint) return;
      const rect = header.getBoundingClientRect();
      header.style.setProperty('--aqua-header-light-x', `${headerLightPoint.x - rect.left - 150}px`);
      header.style.setProperty('--aqua-header-light-y', `${headerLightPoint.y - rect.top - 95}px`);
    });
  };
  row.addEventListener('mouseenter', event => { setImmersed(true, event); water?.warm(); });
  row.addEventListener('focus', () => { setImmersed(true); water?.warm(); });
  gallery.querySelectorAll('[data-catalogue]:not([data-catalogue="aqua"])').forEach(other => {
    other.addEventListener('mouseenter', () => setImmersed(false));
    other.addEventListener('focus', () => setImmersed(false));
  });
  gallery.addEventListener('pointerleave', () => { if (!gallery.contains(document.activeElement)) setImmersed(false); });
  gallery.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!gallery.contains(document.activeElement) && !gallery.matches(':hover')) setImmersed(false);
    });
  });
  gallery.addEventListener('pointermove', event => {
    if (!gallery.classList.contains('is-aqua-hover') || reduced || event.pointerType === 'touch') return;
    lightPoint = { x:event.clientX, y:event.clientY };
    if (lightFrame) return;
    lightFrame = requestAnimationFrame(() => {
      lightFrame = 0;
      if (!lightPoint) return;
      const rect = gallery.getBoundingClientRect();
      const diameter = Math.min(innerWidth * .36, 500);
      gallery.style.setProperty('--aqua-light-x', `${lightPoint.x - rect.left - diameter / 2}px`);
      gallery.style.setProperty('--aqua-light-y', `${lightPoint.y - rect.top - diameter / 2}px`);
    });
  }, { passive:true });

  const open = (sourceElement = row) => {
    clearTimeout(closeTimer);
    clearTimeout(entranceTimer);
    clearTimeout(rippleTimer);
    originSource = sourceElement || row;
    setHeaderPreview(false);
    setImmersed(true);
    const origin = setOrigin(originSource);
    previousFocus = originSource;
    documentLocale = english() ? 'en' : 'fr';
    selectProduct('court', { instant:true });
    portal.hidden = false;
    water?.resize();
    water?.open({ origin, product:'court' });
    portal.setAttribute('aria-hidden', 'false');
    portal.classList.remove('is-closing');
    portal.classList.remove('is-water-rippling');
    portal.classList.add('is-entering');
    document.body.classList.add('aqua-portal-open');
    isOpen = true;
    backgroundState = [...document.body.children]
      .filter(element => element !== portal && element.tagName !== 'SCRIPT')
      .map(element => ({ element, inert:element.inert }));
    backgroundState.forEach(({ element }) => { element.inert = true; });
    void portal.offsetWidth;
    requestAnimationFrame(() => {
      if (!isOpen) return;
      portal.classList.add('is-open');
      if (!reduced) portal.classList.add('is-water-rippling');
    });
    rippleTimer = setTimeout(() => portal.classList.remove('is-water-rippling'), reduced ? 0 : 1040);
    entranceTimer = setTimeout(() => portal.classList.remove('is-entering'), reduced ? 0 : 1000);
    setTimeout(() => { if (isOpen) closeButton.focus({ preventScroll:true }); }, reduced ? 0 : 120);
  };
  const close = () => {
    if (!isOpen) return;
    clearTimeout(entranceTimer);
    clearTimeout(rippleTimer);
    isOpen = false;
    stopWipe();
    setOrigin(originSource);
    portal.classList.add('is-closing');
    portal.classList.remove('is-open', 'is-entering', 'is-water-rippling');
    portal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('aqua-portal-open');
    water?.close(reduced ? 0 : 560);
    backgroundState.forEach(({ element, inert }) => { element.inert = inert; });
    backgroundState = [];
    closeTimer = setTimeout(() => {
      if (isOpen) return;
      portal.hidden = true;
      portal.classList.remove('is-closing');
      previousFocus?.focus({ preventScroll:true });
      if (previousFocus?.matches?.('[data-aqua-shortcut]')) setHeaderPreview(false);
    }, reduced ? 0 : 600);
  };

  row.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(row);
  });
  shortcuts.forEach(shortcut => {
    shortcut.addEventListener('mouseenter', () => { setHeaderPreview(true); water?.warm(); });
    shortcut.addEventListener('focus', () => { setHeaderPreview(true); water?.warm(); });
    shortcut.addEventListener('pointermove', moveHeaderLight, { passive:true });
    shortcut.addEventListener('mouseleave', () => setHeaderPreview(false));
    shortcut.addEventListener('blur', () => setHeaderPreview(false));
    shortcut.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(shortcut);
    });
  });
  closeButton.addEventListener('click', close);
  choices.forEach(choice => choice.addEventListener('click', () => selectProduct(choice.dataset.aquaChoice)));
  localeButtons.forEach(button => button.addEventListener('click', () => {
    documentLocale = button.dataset.aquaLocale;
    updateCopy();
  }));
  portal.addEventListener('pointermove', event => {
    if (!isOpen || reduced || event.pointerType !== 'mouse') return;
    water?.pointerMove(event);
  }, { passive:true });
  addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectProduct(event.key === 'ArrowLeft' ? 'court' : 'bike');
    } else if (event.key === 'Tab') {
      const focusables = [closeButton, ...choices, link, ...localeButtons];
      const current = focusables.indexOf(document.activeElement);
      const next = current < 0
        ? (event.shiftKey ? focusables.length - 1 : 0)
        : (event.shiftKey ? (current - 1 + focusables.length) % focusables.length : (current + 1) % focusables.length);
      event.preventDefault();
      focusables[next].focus();
    }
  });
  addEventListener('resize', () => {
    if (!isOpen) return;
    setOrigin(originSource);
    paintWipe(Boolean(wipeFrame));
    water?.resize();
  }, { passive:true });
  window.visualViewport?.addEventListener('resize', () => {
    if (!isOpen) return;
    setOrigin(originSource);
    paintWipe(Boolean(wipeFrame));
    water?.resize();
  }, { passive:true });
  window.visualViewport?.addEventListener('scroll', () => {
    if (!isOpen) return;
    setOrigin(originSource);
    paintWipe(Boolean(wipeFrame));
    water?.resize();
  }, { passive:true });
  document.addEventListener('site:language-change', () => {
    documentLocale = english() ? 'en' : 'fr';
    updateCopy();
  });
  updateCopy();
})();
