(() => {
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `any-pointer` is more reliable on laptops / hybrid devices than `pointer`.
  const fine = matchMedia('(any-pointer:fine)').matches;

  addEventListener('load', () => {
    setTimeout(() => {
      q('[data-preloader]')?.classList.add('is-done');
      document.body.classList.add('is-loaded');
    }, reduced ? 0 : 850);
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

  const header = q('[data-header]');
  const progress = q('.scroll-progress span');
  const heroMedia = q('[data-parallax]');
  const heroTitle = q('[data-hero-title]');
  const horizontal = q('[data-horizontal-section]');
  const horizontalTrack = q('[data-horizontal-track]');
  const worldsProgress = q('.worlds-progress span');

  let rafPending = false;
  const renderScroll = () => {
    rafPending = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    header?.classList.toggle('is-scrolled', y > 70);

    if (!reduced && heroMedia) heroMedia.style.transform = `translate3d(0,${y * .08}px,0) scale(1.045)`;
    if (!reduced && heroTitle && y < innerHeight * 1.1) {
      const p = clamp(y / innerHeight, 0, 1);
      heroTitle.style.transform = `translate3d(${p * -2.5}vw,${p * 3.8}vh,0) scale(${1 - p * .045})`;
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

  // ---------------------------------------------------------------------------
  // Directional cursor
  // ---------------------------------------------------------------------------
  const cursor = q('.directional-cursor');
  const customCursorEnabled = Boolean(cursor && fine && !reduced);

  // Important fallback: CSS intentionally hides the native cursor for the
  // desktop experience. If custom cursor support is not available, restore a
  // normal system cursor so the page can never end up cursor-less.
  if (!customCursorEnabled) {
    document.body.style.cursor = 'auto';
    if (cursor) cursor.style.display = 'none';

    qa('a, button, [role="button"], label').forEach(el => {
      el.style.cursor = 'pointer';
    });
    qa('input, select, textarea').forEach(el => {
      el.style.cursor = 'auto';
    });
  }

  if (customCursorEnabled) {
    // Inline state makes the cursor independent from stylesheet load timing and
    // ensures it renders above every site layer, including the intro transition.
    cursor.style.display = 'block';
    cursor.style.visibility = 'visible';
    cursor.style.opacity = '0';
    cursor.style.zIndex = '30000';
    document.body.style.cursor = 'none';

    let tx = innerWidth * .5;
    let ty = innerHeight * .5;
    let x = tx;
    let y = ty;
    let sampledX = tx;
    let sampledY = ty;
    let directionX = 0;
    let directionY = 0;
    let pointerInitialized = false;
    let angle = -18;
    let targetAngle = angle;
    let speed = 0;
    let visible = false;

    const shortestAngle = (from, to) => {
      const delta = (to - from + 540) % 360 - 180;
      return from + delta;
    };

    const showCursor = () => {
      if (!cursor) return;
      visible = true;
      document.body.classList.add('cursor-ready');
      cursor.style.opacity = '1';
    };

    const hideCursor = () => {
      if (!cursor) return;
      visible = false;
      document.body.classList.remove('cursor-ready', 'cursor-pressed');
      cursor.style.opacity = '0';
    };

    const handlePointerMove = e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;

      const nextX = e.clientX;
      const nextY = e.clientY;
      showCursor();

      if (!pointerInitialized) {
        pointerInitialized = true;
        tx = nextX;
        ty = nextY;
        x = nextX;
        y = nextY;
        sampledX = nextX;
        sampledY = nextY;
        return;
      }

      tx = nextX;
      ty = nextY;
    };

    if ('PointerEvent' in window) {
      addEventListener('pointermove', handlePointerMove, { passive: true });
    } else {
      addEventListener('mousemove', handlePointerMove, { passive: true });
    }

    document.documentElement.addEventListener('mouseenter', showCursor);
    document.documentElement.addEventListener('mouseleave', hideCursor);
    addEventListener('pointerdown', () => document.body.classList.add('cursor-pressed'));
    addEventListener('pointerup', () => document.body.classList.remove('cursor-pressed'));
    addEventListener('blur', hideCursor);

    const tickCursor = () => {
      const frameDX = tx - sampledX;
      const frameDY = ty - sampledY;
      sampledX = tx;
      sampledY = ty;
      const frameDistance = Math.hypot(frameDX, frameDY);

      if (frameDistance > .18) {
        const directionResponse = clamp(frameDistance / 12, .24, .5);
        directionX += (frameDX - directionX) * directionResponse;
        directionY += (frameDY - directionY) * directionResponse;

        const directionMagnitude = Math.hypot(directionX, directionY);
        if (directionMagnitude > .7) {
          targetAngle = Math.atan2(directionY, directionX) * 180 / Math.PI;
        }
        speed = speed * .66 + frameDistance * .34;
      } else {
        directionX *= .86;
        directionY *= .86;
        speed *= .88;
      }

      x += (tx - x) * .56;
      y += (ty - y) * .56;

      const unwrappedTarget = shortestAngle(angle, targetAngle);
      angle += (unwrappedTarget - angle) * .34;

      const stretch = 1 + clamp(speed / 115, 0, .16);
      const squash = 1 - clamp(speed / 180, 0, .07);

      if (cursor) {
        cursor.style.transform = `translate3d(${x - 12}px,${y - 12}px,0) rotate(${angle}deg) scale(${stretch},${squash})`;
      }
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
  let lang = 'fr';

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

  qa('[data-approach-row]').forEach(row => {
    const activate = () => {
      qa('[data-approach-row]').forEach(item => item.classList.remove('is-active'));
      row.classList.add('is-active');
      const code = q('[data-approach-code]');
      if (code) code.innerHTML = (row.dataset.code || '').replaceAll(' / ', '<br>');
    };
    row.addEventListener('mouseenter', activate);
    row.addEventListener('focusin', activate);
  });

  if (!reduced && fine) {
    q('[data-blueprint]')?.addEventListener('pointermove', e => {
      const host = e.currentTarget;
      const r = host.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width - .5;
      const y = (e.clientY-r.top)/r.height - .5;
      const photo = q('.blueprint-photo', host);
      if (photo) photo.style.transform = `translate(${x * -10}px,${y * -8}px) scale(1.015)`;
    });
    q('[data-blueprint]')?.addEventListener('pointerleave', e => {
      const photo = q('.blueprint-photo', e.currentTarget);
      if (photo) photo.style.transform = 'translate(0,0) scale(1)';
    });
  }

  const orbit = q('[data-orbit]');
  if (orbit && !reduced && fine) {
    q('#contact')?.addEventListener('pointermove', e => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width - .5;
      const y = (e.clientY-r.top)/r.height - .5;
      orbit.style.transform = `translate(${x * 26}px,${y * 20}px) rotate(${x * 1.5}deg)`;
    });
    q('#contact')?.addEventListener('pointerleave', () => orbit.style.transform = 'none');
  }

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
  });

  const menuButton = q('[data-menu-toggle]');
  const menu = q('[data-mobile-menu]');
  const setMenu = open => {
    menuButton?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
    menu?.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  qa('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
})();
