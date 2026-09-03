(() => {
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `any-pointer` is more reliable on laptops / hybrid devices than `pointer`.
  const fine = matchMedia('(any-pointer:fine)').matches;

  let lang = 'fr';

  addEventListener('load', () => {
    setTimeout(() => {
      q('[data-preloader]')?.classList.add('is-done');
      document.body.classList.add('is-loaded');
    }, reduced ? 0 : 720);
  });

  const heroVideo = q('[data-hero-video]');
  if (heroVideo && reduced) heroVideo.pause();
  document.addEventListener('visibilitychange', () => {
    if (!heroVideo || reduced) return;
    if (document.hidden) heroVideo.pause();
    else heroVideo.play().catch(() => {});
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
  qa('[data-reveal]').forEach(el => revealObserver.observe(el));

  /* --------------------------
     Hero drag / inspection tool
     -------------------------- */
  const inspector = q('[data-hero-inspector]');
  const inspectorViewport = q('.hero-inspector__viewport', inspector || document);
  const inspectStage = q('[data-inspect-stage]');
  const inspectKicker = q('[data-inspect-kicker]');
  const inspectDetail = q('[data-inspect-detail]');
  const inspectCount = q('[data-inspect-count]');
  const inspectStepEls = qa('.hero-inspector__steps span');
  let inspectValue = 12;
  let inspectorDragging = false;

  const inspectCopy = {
    fr: [
      ['01 / CONTEXTE', 'PHOTO', 'Site / contexte'],
      ['02 / IMPLANTATION', 'PLAN', 'Tracé / circulation / implantation'],
      ['03 / INGÉNIERIE', 'STRUCTURE', 'Axes / portées / modules'],
      ['04 / MATIÈRE', 'SURFACE', 'EPDM / SBR / gazons synthétiques'],
      ['05 / USAGE', 'ÉQUIPEMENTS', 'Tribunes / sièges / accès']
    ],
    en: [
      ['01 / CONTEXT', 'PHOTO', 'Site / context'],
      ['02 / LAYOUT', 'PLAN', 'Marking / circulation / layout'],
      ['03 / ENGINEERING', 'STRUCTURE', 'Axes / spans / modules'],
      ['04 / MATERIAL', 'SURFACE', 'EPDM / SBR / synthetic turf'],
      ['05 / USE', 'EQUIPMENT', 'Stands / seats / access']
    ]
  };

  const getInspectStep = value => Math.min(4, Math.floor(clamp(value, 0, 99.999) / 20));

  const setInspect = value => {
    if (!inspector) return;
    inspectValue = clamp(value, 0, 100);
    const step = inspectValue >= 100 ? 4 : getInspectStep(inspectValue);
    inspector.style.setProperty('--inspect', `${inspectValue}%`);
    inspector.dataset.stage = String(step);
    inspector.setAttribute('aria-valuenow', String(Math.round(inspectValue)));
    inspector.setAttribute('aria-valuetext', inspectCopy[lang][step][1]);
    if (inspectKicker) inspectKicker.textContent = inspectCopy[lang][step][0];
    if (inspectStage) inspectStage.textContent = inspectCopy[lang][step][1];
    if (inspectDetail) inspectDetail.textContent = inspectCopy[lang][step][2];
    if (inspectCount) inspectCount.textContent = `${String(step + 1).padStart(2, '0')} / 05`;
    inspectStepEls.forEach((el, i) => el.classList.toggle('is-active', i === step));
  };

  const inspectFromPointer = e => {
    if (!inspectorViewport) return;
    const r = inspectorViewport.getBoundingClientRect();
    setInspect(((e.clientX - r.left) / r.width) * 100);
  };

  if (inspector) {
    setInspect(inspectValue);
    inspector.addEventListener('pointerenter', () => {
      if (fine) document.body.classList.add('cursor-drag');
    });
    inspector.addEventListener('pointerleave', () => {
      if (fine && !inspectorDragging) document.body.classList.remove('cursor-drag');
    });
    inspector.addEventListener('pointerdown', e => {
      inspectorDragging = true;
      inspector.setPointerCapture?.(e.pointerId);
      if (fine) document.body.classList.add('cursor-drag', 'cursor-dragging');
      inspectFromPointer(e);
    });
    inspector.addEventListener('pointermove', e => {
      if (inspectorDragging) inspectFromPointer(e);
    });
    const stopInspectDrag = e => {
      if (!inspectorDragging) return;
      inspectorDragging = false;
      try { inspector.releasePointerCapture?.(e.pointerId); } catch (_) {}
      if (fine) {
        document.body.classList.remove('cursor-dragging');
        if (!inspector.matches(':hover')) document.body.classList.remove('cursor-drag');
      }
    };
    inspector.addEventListener('pointerup', stopInspectDrag);
    inspector.addEventListener('pointercancel', stopInspectDrag);
    inspector.addEventListener('keydown', e => {
      const step = e.shiftKey ? 20 : 5;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setInspect(inspectValue + step); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setInspect(inspectValue - step); }
      if (e.key === 'Home') { e.preventDefault(); setInspect(0); }
      if (e.key === 'End') { e.preventDefault(); setInspect(100); }
    });
  }

  /* --------------------------
     State-based project story
     -------------------------- */
  const story = q('[data-approach-story]');
  const storyShell = q('[data-approach-shell]');
  const storyVisual = q('[data-story-visual]');
  const storyProgress = q('[data-story-progress]');
  const storyCount = q('[data-story-count]');
  const approachRows = qa('[data-approach-row]');
  const approachCode = q('[data-approach-code]');
  let activeApproachStep = -1;

  const setApproachStep = index => {
    index = clamp(index, 0, approachRows.length - 1);
    if (activeApproachStep === index) return;
    activeApproachStep = index;
    approachRows.forEach((row, i) => row.classList.toggle('is-active', i === index));
    const row = approachRows[index];
    if (approachCode && row) approachCode.innerHTML = (row.dataset.code || '').replaceAll(' / ', '<br>');
    if (storyVisual) {
      [...storyVisual.classList].filter(c => c.startsWith('story-step-')).forEach(c => storyVisual.classList.remove(c));
      storyVisual.classList.add(`story-step-${index + 1}`);
    }
    if (storyCount) storyCount.textContent = `${String(index + 1).padStart(2, '0')} / 05`;
  };
  if (approachRows.length) setApproachStep(0);

  approachRows.forEach((row, i) => {
    const activate = () => {
      if (innerWidth <= 1100 || reduced) setApproachStep(i);
    };
    row.addEventListener('mouseenter', activate);
    row.addEventListener('focusin', activate);
  });

  /* --------------------------
     Scroll systems
     -------------------------- */
  const header = q('[data-header]');
  const progress = q('.scroll-progress span');
  const heroMedia = q('[data-parallax]');
  const heroTitle = q('[data-hero-title]');
  const horizontal = q('[data-horizontal-section]');
  const horizontalTrack = q('[data-horizontal-track]');
  const worldsProgress = q('.worlds-progress span');
  const worldPanels = qa('.world-panel');

  let rafPending = false;
  const renderScroll = () => {
    rafPending = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    header?.classList.toggle('is-scrolled', y > 70);

    if (!reduced && heroMedia) heroMedia.style.transform = `translate3d(0,${y * .075}px,0) scale(1.045)`;
    if (!reduced && heroTitle && y < innerHeight * 1.1) {
      const p = clamp(y / innerHeight, 0, 1);
      heroTitle.style.transform = `translate3d(${p * -2.2}vw,${p * 3.4}vh,0) scale(${1 - p * .04})`;
    }

    if (horizontal && horizontalTrack && innerWidth > 720 && !reduced) {
      const r = horizontal.getBoundingClientRect();
      const scrollable = horizontal.offsetHeight - innerHeight;
      const local = clamp(-r.top, 0, scrollable);
      const p = scrollable > 0 ? local / scrollable : 0;
      const visibleTrackArea = innerWidth * .66;
      const overflow = Math.max(0, horizontalTrack.scrollWidth - visibleTrackArea);
      horizontalTrack.style.transform = `translate3d(${-p * overflow}px,0,0)`;
      if (worldsProgress) worldsProgress.style.width = `${p * 100}%`;

      // Subtle three-speed depth: imagery, content, index.
      worldPanels.forEach(panel => {
        const pr = panel.getBoundingClientRect();
        const d = clamp(((pr.left + pr.width * .5) - innerWidth * .68) / innerWidth, -1.2, 1.2);
        const media = q('.world-media', panel);
        const copy = q('.world-copy', panel);
        const num = q('.world-copy > span', panel);
        if (media) media.style.transform = `translate3d(${d * -22}px,0,0) scale(1.075)`;
        if (copy) copy.style.transform = `translate3d(${d * 10}px,0,0)`;
        if (num) num.style.transform = `translate3d(${d * 12}px,${d * -4}px,0)`;
      });
    }

    if (story && storyShell && approachRows.length && innerWidth > 1100 && !reduced) {
      const sr = story.getBoundingClientRect();
      const shellStart = storyShell.offsetTop - 78;
      const range = Math.max(1, story.offsetHeight - storyShell.offsetTop - innerHeight + 78);
      const local = clamp(-sr.top - shellStart, 0, range);
      const p = local / range;
      const step = Math.min(approachRows.length - 1, Math.floor(clamp(p * approachRows.length, 0, approachRows.length - .001)));
      setApproachStep(step);
      if (storyProgress) storyProgress.style.width = `${p * 100}%`;
      if (storyVisual) storyVisual.style.setProperty('--story-progress', p.toFixed(4));
    }
  };
  const onScroll = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(renderScroll);
  };
  addEventListener('scroll', onScroll, { passive:true });
  addEventListener('resize', onScroll, { passive:true });
  renderScroll();

  /* --------------------------
     Directional cursor
     -------------------------- */
  const cursor = q('.directional-cursor');
  const customCursorEnabled = Boolean(cursor && fine && !reduced);

  // CSS intentionally hides the native cursor for the desktop experience.
  // Always restore it when the custom cursor cannot be safely enabled.
  if (!customCursorEnabled) {
    document.body.style.cursor = 'auto';
    if (cursor) cursor.style.display = 'none';
    qa('a, button, [role="button"], label').forEach(el => { el.style.cursor = 'pointer'; });
    qa('input, select, textarea').forEach(el => { el.style.cursor = 'auto'; });
  }

  if (customCursorEnabled) {
    cursor.style.display = 'block';
    cursor.style.visibility = 'visible';
    cursor.style.opacity = '0';
    cursor.style.zIndex = '30000';
    document.body.style.cursor = 'none';

    let tx = innerWidth * .5;
    let ty = innerHeight * .5;
    let x = tx;
    let y = ty;
    let lastInputX = tx;
    let lastInputY = ty;
    let angle = -18;
    let targetAngle = angle;
    let speed = 0;

    const shortestAngle = (from, to) => {
      const delta = (to - from + 540) % 360 - 180;
      return from + delta;
    };

    const isDragCursor = () => document.body.classList.contains('cursor-drag') || document.body.classList.contains('cursor-dragging');

    const showCursor = () => {
      document.body.classList.add('cursor-ready');
      cursor.style.opacity = '1';
    };

    const hideCursor = () => {
      document.body.classList.remove('cursor-ready', 'cursor-pressed', 'cursor-drag', 'cursor-dragging');
      cursor.style.opacity = '0';
    };

    const handlePointerMove = e => {
      showCursor();
      tx = e.clientX;
      ty = e.clientY;
      const vx = tx - lastInputX;
      const vy = ty - lastInputY;
      const instantaneousSpeed = Math.hypot(vx, vy);
      speed = speed * .58 + instantaneousSpeed * .42;

      // In normal navigation the dart points toward the travel vector. Inside
      // the inspector it becomes a horizontal drag instrument instead.
      if (instantaneousSpeed > .65 && !isDragCursor()) {
        targetAngle = Math.atan2(vy, vx) * 180 / Math.PI;
      }

      lastInputX = tx;
      lastInputY = ty;
    };

    addEventListener('pointermove', handlePointerMove, { passive:true });
    addEventListener('mousemove', handlePointerMove, { passive:true });
    document.documentElement.addEventListener('mouseenter', showCursor);
    document.documentElement.addEventListener('mouseleave', hideCursor);
    addEventListener('pointerdown', () => document.body.classList.add('cursor-pressed'));
    addEventListener('pointerup', () => document.body.classList.remove('cursor-pressed'));
    addEventListener('blur', hideCursor);

    const tickCursor = () => {
      x += (tx - x) * .42;
      y += (ty - y) * .42;

      const dragMode = isDragCursor();
      if (!dragMode) {
        const unwrappedTarget = shortestAngle(angle, targetAngle);
        angle += (unwrappedTarget - angle) * .24;
      }

      speed *= .88;
      const stretch = dragMode ? 1 : 1 + clamp(speed / 115, 0, .16);
      const squash = dragMode ? 1 : 1 - clamp(speed / 180, 0, .07);
      const visualAngle = dragMode ? 0 : angle;
      const cursorWidth = dragMode ? (document.body.classList.contains('cursor-dragging') ? 76 : 58) : 24;

      cursor.style.transform = `translate3d(${x - cursorWidth * .5}px,${y - 12}px,0) rotate(${visualAngle}deg) scale(${stretch},${squash})`;
      requestAnimationFrame(tickCursor);
    };
    tickCursor();

    qa('a,button,[data-cursor-label],input,select,textarea').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    qa('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width/2);
        const my = e.clientY - (r.top + r.height/2);
        el.style.transform = `translate(${mx * .1}px,${my * .14}px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = 'translate(0,0)');
    });
  }

  /* --------------------------
     Catalogue preview
     -------------------------- */
  const catalogueImages = {
    fitness: 'https://www.profilssports.com/assets/CATALOGUES_THUMBS/Fitness/Fitness_Page_01.jpg',
    padel: 'https://www.profilssports.com/assets/CATALOGUES_THUMBS/PADEL/PADEL_page-0001.jpg',
    csp: 'https://www.profilssports.com/assets/CATALOGUES_THUMBS/CSP%20Pro/CSP%20PRO_page-0001.jpg',
    canopy: 'https://www.profilssports.com/assets/CATALOGUES_THUMBS/Canopy/CANOPY%20SCHOOL_pages-to-jpg-0001.jpg'
  };
  const previewImage = q('.catalogue-preview__image');
  const previewNumber = q('.catalogue-preview__data strong');
  const previewCategory = q('.catalogue-preview__category');
  const previewPages = q('.catalogue-preview__pages');

  const activateCatalogue = (row, index) => {
    qa('[data-catalogue]').forEach(r => r.classList.remove('is-active'));
    row.classList.add('is-active');
    if (previewImage) {
      previewImage.style.backgroundImage = `url("${catalogueImages[row.dataset.catalogue]}")`;
      if (!reduced && previewImage.animate) {
        previewImage.animate(
          [{transform:'scale(1.045)',filter:'brightness(.72)'},{transform:'scale(1)',filter:'brightness(1)'}],
          {duration:520,easing:'cubic-bezier(.18,.82,.18,1)'}
        );
      }
    }
    if (previewNumber) previewNumber.textContent = String(index + 1).padStart(2,'0');
    if (previewCategory) previewCategory.textContent = (lang === 'fr' ? row.dataset.categoryFr : row.dataset.categoryEn || row.dataset.categoryFr).toUpperCase();
    if (previewPages) previewPages.textContent = `${row.dataset.pages} PAGES`;
  };
  const catalogueRows = qa('[data-catalogue]');
  catalogueRows.forEach((row, index) => {
    row.addEventListener('mouseenter', () => activateCatalogue(row, index));
    row.addEventListener('focus', () => activateCatalogue(row, index));
  });
  if (catalogueRows[0]) activateCatalogue(catalogueRows[0], 0);

  /* --------------------------
     Blueprint and contact pointer depth
     -------------------------- */
  if (!reduced && fine) {
    q('[data-blueprint]')?.addEventListener('pointermove', e => {
      if (innerWidth > 1100) return; // desktop story owns the visual state
      const host = e.currentTarget;
      const r = host.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width - .5;
      const py = (e.clientY-r.top)/r.height - .5;
      const photo = q('.blueprint-photo', host);
      if (photo) photo.style.transform = `translate(${px * -10}px,${py * -8}px) scale(1.015)`;
    });
    q('[data-blueprint]')?.addEventListener('pointerleave', e => {
      if (innerWidth > 1100) return;
      const photo = q('.blueprint-photo', e.currentTarget);
      if (photo) photo.style.transform = 'translate(0,0) scale(1)';
    });
  }

  const orbit = q('[data-orbit]');
  if (orbit && !reduced && fine) {
    q('#contact')?.addEventListener('pointermove', e => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width - .5;
      const py = (e.clientY-r.top)/r.height - .5;
      orbit.style.transform = `translate(${px * 26}px,${py * 20}px) rotate(${px * 1.5}deg)`;
    });
    q('#contact')?.addEventListener('pointerleave', () => orbit.style.transform = 'none');
  }

  /* --------------------------
     Bilingual UI
     -------------------------- */
  q('[data-language]')?.addEventListener('click', () => {
    lang = lang === 'fr' ? 'en' : 'fr';
    document.documentElement.lang = lang;
    qa('[data-fr][data-en]').forEach(el => {
      const value = el.dataset[lang];
      if (!value) return;
      const arrow = el.querySelector(':scope > span:last-child');
      if (el.matches('a.button') && arrow) {
        el.firstChild.textContent = `${value} `;
      } else {
        el.innerHTML = value.replaceAll('\n','<br>');
      }
    });
    const active = q('[data-catalogue].is-active');
    if (active) activateCatalogue(active, catalogueRows.indexOf(active));
    setInspect(inspectValue);
  });

  /* --------------------------
     Mobile menu
     -------------------------- */
  const menuButton = q('[data-menu-toggle]');
  const menu = q('[data-mobile-menu]');
  const setMenu = open => {
    menuButton?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
    menu?.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  qa('a', menu || document.createElement('div')).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* --------------------------
     Architectural anchor transition
     -------------------------- */
  const routeTransition = q('[data-route-transition]');
  const routeLabel = q('[data-route-label]');
  qa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = q(href);
      if (!target) return;
      e.preventDefault();
      if (reduced || !routeTransition) {
        target.scrollIntoView({behavior:'smooth', block:'start'});
        history.replaceState(null, '', href);
        return;
      }
      if (routeLabel) routeLabel.textContent = (link.textContent || target.id).replace('↗','').trim().toUpperCase();
      routeTransition.classList.remove('is-leaving');
      routeTransition.classList.add('is-active');
      setTimeout(() => {
        const old = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        const offset = target.id === 'top' ? 0 : 78;
        window.scrollTo(0, target.getBoundingClientRect().top + scrollY - offset);
        document.documentElement.style.scrollBehavior = old;
        history.replaceState(null, '', href);
        renderScroll();
      }, 300);
      setTimeout(() => {
        routeTransition.classList.add('is-leaving');
        routeTransition.classList.remove('is-active');
      }, 510);
      setTimeout(() => routeTransition.classList.remove('is-leaving'), 1160);
    });
  });
})();
