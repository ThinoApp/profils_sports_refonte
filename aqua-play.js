(() => {
  'use strict';

  const gallery = document.querySelector('#catalogues .catalogue-gallery');
  const row = gallery?.querySelector('[data-catalogue="aqua"]');
  if (!gallery || !row) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    <div class="aqua-portal__shade" aria-hidden="true"></div>
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
  let currentProduct = 'court';
  let documentLocale = document.documentElement.lang === 'en' ? 'en' : 'fr';
  let isOpen = false;
  let previousFocus = null;
  let backgroundState = [];
  let closeTimer = 0;
  let entranceTimer = 0;
  let lightFrame = 0;
  let lightPoint = null;

  const english = () => document.documentElement.lang === 'en';
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const viewport = () => ({
    width:window.visualViewport?.width || document.documentElement.clientWidth,
    height:window.visualViewport?.height || innerHeight,
    top:window.visualViewport?.offsetTop || 0,
    left:window.visualViewport?.offsetLeft || 0
  });
  const setOrigin = () => {
    const box = viewport();
    const source = row.getBoundingClientRect();
    const galleryRect = gallery.getBoundingClientRect();
    portal.style.setProperty('--aqua-top', `${box.top}px`);
    portal.style.setProperty('--aqua-left', `${box.left}px`);
    portal.style.setProperty('--aqua-width', `${box.width}px`);
    portal.style.setProperty('--aqua-height', `${box.height}px`);
    portal.style.setProperty('--aqua-origin', `${clamp(source.top - box.top, 0, box.height)}px ${Math.max(0, box.width - source.right + box.left)}px ${Math.max(0, box.height - source.bottom + box.top)}px ${Math.max(0, source.left - box.left)}px`);
    portal.style.setProperty('--aqua-handoff-x', `${galleryRect.left - box.left}px`);
    portal.style.setProperty('--aqua-handoff-y', `${galleryRect.top - box.top}px`);
    portal.style.setProperty('--aqua-handoff-width', `${galleryRect.width}px`);
    portal.style.setProperty('--aqua-handoff-height', `${galleryRect.height}px`);
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
  };

  const selectProduct = key => {
    if (!products[key]) return;
    currentProduct = key;
    portal.dataset.product = key;
    choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.aquaChoice === key)));
    updateCopy();
  };

  const setImmersed = active => {
    if (!active && (isOpen || portal.classList.contains('is-closing'))) return;
    gallery.classList.toggle('is-aqua-hover', active);
    document.body.classList.toggle('catalogue-aqua-hover', active);
  };
  row.addEventListener('mouseenter', () => setImmersed(true));
  row.addEventListener('focus', () => setImmersed(true));
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

  const open = () => {
    clearTimeout(closeTimer);
    clearTimeout(entranceTimer);
    setImmersed(true);
    setOrigin();
    previousFocus = row;
    documentLocale = english() ? 'en' : 'fr';
    selectProduct('court');
    portal.hidden = false;
    portal.setAttribute('aria-hidden', 'false');
    portal.classList.remove('is-closing');
    portal.classList.add('is-entering');
    document.body.classList.add('aqua-portal-open');
    isOpen = true;
    backgroundState = [...document.body.children]
      .filter(element => element !== portal && element.tagName !== 'SCRIPT')
      .map(element => ({ element, inert:element.inert }));
    backgroundState.forEach(({ element }) => { element.inert = true; });
    void portal.offsetWidth;
    requestAnimationFrame(() => { if (isOpen) portal.classList.add('is-open'); });
    entranceTimer = setTimeout(() => portal.classList.remove('is-entering'), reduced ? 0 : 950);
    setTimeout(() => { if (isOpen) closeButton.focus({ preventScroll:true }); }, reduced ? 0 : 120);
  };
  const close = () => {
    if (!isOpen) return;
    clearTimeout(entranceTimer);
    isOpen = false;
    setOrigin();
    portal.classList.add('is-closing');
    portal.classList.remove('is-open', 'is-entering');
    portal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('aqua-portal-open');
    backgroundState.forEach(({ element, inert }) => { element.inert = inert; });
    backgroundState = [];
    closeTimer = setTimeout(() => {
      if (isOpen) return;
      portal.hidden = true;
      portal.classList.remove('is-closing');
      previousFocus?.focus({ preventScroll:true });
    }, reduced ? 0 : 540);
  };

  row.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open();
  });
  closeButton.addEventListener('click', close);
  choices.forEach(choice => choice.addEventListener('click', () => selectProduct(choice.dataset.aquaChoice)));
  localeButtons.forEach(button => button.addEventListener('click', () => {
    documentLocale = button.dataset.aquaLocale;
    updateCopy();
  }));
  portal.addEventListener('pointermove', event => {
    if (!isOpen || reduced || event.pointerType !== 'mouse') return;
    portal.style.setProperty('--aqua-shift-x', `${((event.clientX / innerWidth) - .5) * -12}px`);
    portal.style.setProperty('--aqua-shift-y', `${((event.clientY / innerHeight) - .5) * -10}px`);
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
  addEventListener('resize', () => { if (isOpen) setOrigin(); }, { passive:true });
  window.visualViewport?.addEventListener('resize', () => { if (isOpen) setOrigin(); }, { passive:true });
  window.visualViewport?.addEventListener('scroll', () => { if (isOpen) setOrigin(); }, { passive:true });
  document.addEventListener('site:language-change', () => {
    documentLocale = english() ? 'en' : 'fr';
    updateCopy();
  });
  updateCopy();
})();
