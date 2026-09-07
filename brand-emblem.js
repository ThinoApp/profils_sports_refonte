(() => {
  'use strict';
  const section = document.querySelector('.discipline-rail.brand-emblem');
  if (!section) return;
  const stage = section.querySelector('.brand-emblem__stage');
  const logo = section.querySelector('.brand-emblem__logo');
  const orbit = section.querySelector('.brand-emblem__orbit');
  const figures = [...section.querySelectorAll('figure')];
  const toolbar = section.querySelector('.brand-emblem__toolbar');
  const bottom = section.querySelector('.brand-emblem__bottom');
  const playButton = section.querySelector('[data-emblem-play]');
  const action = section.querySelector('[data-emblem-action]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Verified legacy order and catalogue mappings, shared with the page ribbon.
  const catalogues = [null, 'fitness', 'padel', null, null, 'canopy', 'csp', null];
  const rows = [...document.querySelectorAll('.catalogue-row[data-catalogue]')];
  const names = figures.map(figure => figure.querySelector('figcaption').textContent);
  const step = Math.PI / 4;
  const mod = (v, n) => ((v % n) + n) % n;
  const english = () => document.documentElement.lang === 'en';
  const nodeButtons = [];
  let ready = false, failed = false, visible = false;
  let raf = 0, lastTime = 0, phase = 2, targetPhase = 2, selected = -1;
  let pointer = null, playing = !reduced.matches;
  let width = 1, height = 1, centerX = 0, centerY = 0, radius = 0;
  let modalOpen = document.body.classList.contains('catalogue-ribbon-open');

  function playbackCopy() {
    playButton.hidden = reduced.matches;
    playButton.textContent = playing ? 'Ⅱ' : '▷';
    playButton.setAttribute('aria-label', playing
      ? (english() ? 'Pause rotation' : 'Mettre la rotation en pause')
      : (english() ? 'Resume rotation' : 'Reprendre la rotation'));
  }
  function updateCopy(force = false) {
    const index = mod(Math.round(phase), figures.length);
    if (!force && selected === index) return;
    selected = index;
    const row = rows.find(row => row.dataset.catalogue === catalogues[index]);
    if (row) {
      action.dataset.catalogueTrigger = row.dataset.catalogue;
      action.href = row.href;
      action.target = '_blank';
      action.textContent = (english() ? 'BROWSE ' : 'FEUILLETER ') + row.querySelector('.catalogue-name').textContent + ' ↗';
    } else {
      delete action.dataset.catalogueTrigger;
      action.href = 'mailto:contact@profilssports.com?subject=' + encodeURIComponent('Projet ' + names[index]);
      action.removeAttribute('target');
      action.textContent = (english() ? 'DISCUSS ' : 'PARLONS ') + names[index] + ' ↗';
    }
    figures.forEach((figure, i) => {
      figure.toggleAttribute('data-active', i === index);
      nodeButtons[i]?.setAttribute('aria-pressed', String(i === index));
      nodeButtons[i]?.setAttribute('aria-label', (english() ? 'Select ' : 'Sélectionner ') + names[i]);
    });
    stage.setAttribute('aria-label', english()
      ? 'Rotating Profils Sports logo. Arrow keys select a discipline.'
      : 'Logo Profils Sports en rotation. Les flèches sélectionnent une discipline.');
    section.querySelector('[data-emblem-prev]').setAttribute('aria-label', english() ? 'Previous discipline' : 'Discipline précédente');
    section.querySelector('[data-emblem-next]').setAttribute('aria-label', english() ? 'Next discipline' : 'Discipline suivante');
    playbackCopy();
  }
  function pause() { playing = false; playbackCopy(); }
  function select(index) {
    pause(); targetPhase += mod(index - mod(targetPhase, 8) + 4, 8) - 4; wake();
  }
  function next(direction) {
    pause(); targetPhase = Math.round(targetPhase) + direction; wake();
  }
  function draw() {
    // One planar angle drives the native HD image and upright discipline nodes.
    logo.style.transform = 'translate(-50%, -50%) rotate(' + (-(phase - 2) * 45).toFixed(4) + 'deg)';
    figures.forEach((figure, index) => {
      const angle = (index - phase) * step;
      const x = centerX + Math.sin(angle) * radius;
      const y = centerY - Math.cos(angle) * radius;
      const w = width <= 720 ? 100 : 140, h = width <= 720 ? 105 : 130;
      const shown = x > w / 2 + 6 && x < width - w / 2 - 6 && y > 110 && y < height - (width <= 720 ? 120 : 100);
      figure.style.transform = 'translate(' + (x - w / 2).toFixed(2) + 'px,' + (y - h / 2).toFixed(2) + 'px)';
      figure.style.visibility = shown ? 'visible' : 'hidden';
      nodeButtons[index].tabIndex = shown ? 0 : -1;
    });
    updateCopy();
  }
  function resize() {
    if (!ready) return;
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (!width || !height) return;
    const mobile = width <= 720;
    const diameter = mobile ? Math.min(width * .54, 340) : Math.min(width * .54, 1040);
    centerX = width / 2;
    centerY = mobile ? height * .54 : height * .95;
    radius = mobile ? Math.min(width * .44, centerY - 145) : Math.min(width * .37, centerY - 158);
    logo.style.width = diameter + 'px';
    logo.style.left = orbit.style.left = centerX + 'px';
    logo.style.top = orbit.style.top = centerY + 'px';
    orbit.style.width = orbit.style.height = radius * 2 + 'px';
    draw(); wake();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
  function wake() {
    if (!ready || !visible || document.hidden || modalOpen || failed || raf) return;
    raf = requestAnimationFrame(render);
  }
  function render(time) {
    raf = 0;
    if (!ready || !visible || document.hidden || modalOpen || failed) return;
    const dt = Math.min(lastTime ? (time - lastTime) / 1000 : 1 / 60, .05);
    lastTime = time;
    if (playing && !reduced.matches && !pointer) targetPhase += dt * .09;
    phase += (targetPhase - phase) * (reduced.matches ? 1 : 1 - Math.exp(-8 * dt));
    if (Math.abs(targetPhase - phase) < .0001) phase = targetPhase;
    draw();
    if ((playing && !reduced.matches) || phase !== targetPhase) wake();
  }
  function fail() {
    failed = true; ready = false; stop();
    delete section.dataset.emblemReady; delete section.dataset.emblemPending;
    stage.hidden = toolbar.hidden = bottom.hidden = true;
    nodeButtons.forEach(button => button.remove());
    figures.forEach(figure => {
      figure.style.removeProperty('transform'); figure.style.removeProperty('visibility');
      figure.removeAttribute('data-active');
    });
    requestAnimationFrame(() => window.ScrollTrigger?.refresh());
  }
  async function init() {
    try {
      await logo.decode();
      figures.forEach((figure, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'brand-emblem__node';
        button.addEventListener('click', () => select(index));
        button.addEventListener('focus', pause);
        figure.appendChild(button); nodeButtons.push(button);
      });
      stage.hidden = toolbar.hidden = bottom.hidden = false;
      section.dataset.emblemReady = '';
      delete section.dataset.emblemPending;
      ready = true; updateCopy(true); resize();
    } catch { fail(); }
  }
  section.querySelector('[data-emblem-prev]').addEventListener('click', () => next(-1));
  section.querySelector('[data-emblem-next]').addEventListener('click', () => next(1));
  playButton.addEventListener('click', () => {
    if (reduced.matches) return;
    playing = !playing; playbackCopy(); wake();
  });
  action.addEventListener('click', pause);
  stage.addEventListener('pointerdown', event => {
    if (!ready || event.button !== 0 || pointer) return;
    pause();
    pointer = { id:event.pointerId, x:event.clientX, y:event.clientY, phase:targetPhase, touch:event.pointerType === 'touch', captured:false };
    if (!pointer.touch) { stage.setPointerCapture(event.pointerId); pointer.captured = true; }
  });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (pointer.touch && !pointer.captured) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { pointer = null; return; }
      if (Math.abs(dx) < 6) return;
      stage.setPointerCapture(event.pointerId); pointer.captured = true;
    }
    targetPhase = pointer.phase - dx / Math.max(80, width * .13); wake();
  });
  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const id = pointer.id;
    pointer = null; targetPhase = Math.round(targetPhase);
    if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    wake();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => stage.addEventListener(type, release));
  section.addEventListener('keydown', event => {
    if (!ready || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.target.classList.contains('brand-emblem__node')) stage.focus({ preventScroll:true });
    if (event.key === 'Home') select(2); else next(event.key === 'ArrowLeft' ? -1 : 1);
  });
  section.dataset.emblemPending = '';
  requestAnimationFrame(() => window.ScrollTrigger?.refresh());
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake(); else stop();
  }, { rootMargin:'100px' }).observe(section);
  new ResizeObserver(resize).observe(section);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : wake());
  new MutationObserver(() => {
    modalOpen = document.body.classList.contains('catalogue-ribbon-open');
    if (modalOpen) stop(); else wake();
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { playing = false; targetPhase = Math.round(targetPhase); }
    playbackCopy(); wake();
  });
  document.addEventListener('site:language-change', () => updateCopy(true));
  init();
})();
