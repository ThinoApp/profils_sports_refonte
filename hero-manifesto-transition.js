(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const manifesto = document.querySelector('#approach-intro');
  const header = document.querySelector('[data-header]');
  const heroTitle = document.querySelector('[data-hero-title]');
  const heroMedia = document.querySelector('.hero-media');
  const heroOverlay = document.querySelector('.hero-overlay');
  const stadiumPlan = document.querySelector('.stadium-plan');

  if (!hero || !manifesto) return;

  // ---------------------------------------------------------------------------
  // Hero editorial compaction. Keep the title DOM completely intact because the
  // pre-loader measures `.hero-title .hero-line b` at runtime for its cursor sweep.
  // Only secondary content and decorative layers are simplified here.
  // ---------------------------------------------------------------------------
  hero.classList.add('hero--editorial');

  if (!document.querySelector('link[data-hero-editorial]')) {
    const editorialStyles = document.createElement('link');
    editorialStyles.rel = 'stylesheet';
    editorialStyles.href = 'hero-editorial.css?v=20260904-hero1';
    editorialStyles.dataset.heroEditorial = '';
    document.head.appendChild(editorialStyles);
  }

  const heroTagline = hero.querySelector('.hero-tagline');
  if (heroTagline) {
    heroTagline.innerHTML = `
      <span>SPORTING EXCELLENCE</span>
      <span data-fr="Vos espaces sportifs" data-en="Your sports spaces">VOS ESPACES SPORTIFS</span>
    `;
  }

  const heroBottom = hero.querySelector('.hero-bottom');
  if (heroBottom) {
    heroBottom.innerHTML = `
      <div class="hero-brief">
        <span class="hero-brief__eyebrow" data-fr="De votre idée au terrain" data-en="From your idea to the field">DE VOTRE IDÉE AU TERRAIN</span>
        <p data-fr="Un espace à créer, des équipements à installer ou à entretenir : donnons forme à votre projet sportif." data-en="A space to build, equipment to install or maintain: let’s bring your sports project to life.">Un espace à créer, des équipements à installer ou à entretenir : donnons forme à votre projet sportif.</p>
      </div>
      <div class="hero-actions">
        <a class="hero-command" href="#contact">
          <span><small data-fr="Premier échange" data-en="Let’s talk">PREMIER ÉCHANGE</small><strong data-fr="Parler de votre projet" data-en="Discuss your project">PARLER DE VOTRE PROJET</strong></span>
          <b aria-hidden="true">↗</b>
        </a>
        <a class="hero-solutions-link" href="#solutions" data-fr="Voir les solutions" data-en="View solutions">VOIR LES SOLUTIONS <span aria-hidden="true">↓</span></a>
      </div>
    `;

    heroBottom.querySelectorAll('a').forEach(link => {
      link.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      link.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // These elements were competing with the video, title and action hierarchy.
  // Technical drawing language returns intentionally during the scroll transition.
  hero.querySelector('.stadium-plan')?.remove();
  hero.querySelector('.hero-coordinate')?.remove();
  hero.querySelector('.hero-proof')?.remove();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 900px)').matches;
  if (reduced || !desktop) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const range = (progress, start, end) => clamp((progress - start) / (end - start));
  const smooth = value => value * value * (3 - 2 * value);
  const mix = (from, to, progress) => from + (to - from) * progress;

  document.body.classList.add('has-hero-manifesto-transition');

  // ---------------------------------------------------------------------------
  // Build a single pinned stage. The manifesto exists behind the Hero from the
  // first frame; the Hero is only clipped, never uniformly scaled down.
  // ---------------------------------------------------------------------------
  const stage = document.createElement('section');
  stage.className = 'hero-manifesto-transition';
  stage.setAttribute('data-hero-manifesto-transition', '');

  const sticky = document.createElement('div');
  sticky.className = 'hero-manifesto-transition__sticky';

  const nextLayer = document.createElement('div');
  nextLayer.className = 'hero-manifesto-transition__next';

  const heroClip = document.createElement('div');
  heroClip.className = 'hero-manifesto-transition__clip';

  hero.parentNode.insertBefore(stage, hero);
  stage.appendChild(sticky);
  sticky.append(nextLayer, heroClip);
  nextLayer.appendChild(manifesto);
  heroClip.appendChild(hero);

  hero.classList.add('hero--transition');
  manifesto.classList.add('manifesto--transition');

  // ---------------------------------------------------------------------------
  // Recompose the manifesto into a three-part architectural layout.
  // ---------------------------------------------------------------------------
  const originalLayout = manifesto.querySelector('.manifesto-layout');
  const heading = originalLayout?.querySelector('.display-heading');
  const copy = originalLayout?.querySelector('.manifesto-copy');
  const tape = manifesto.querySelector('.capability-tape');

  const shell = document.createElement('div');
  shell.className = 'manifesto-transition-shell';

  const left = document.createElement('div');
  left.className = 'manifesto-transition-left';
  left.innerHTML = '<span class="manifesto-transition-marker" aria-hidden="true"></span>';
  if (heading) left.appendChild(heading);
  if (copy) left.appendChild(copy);

  const media = document.createElement('div');
  media.className = 'manifesto-transition-media';
  media.setAttribute('data-transition-media', '');
  media.setAttribute('aria-hidden', 'true');
  media.innerHTML = `
    <div class="manifesto-transition-media__photo"></div>
    <div class="manifesto-transition-media__meta">
      <span>PROFILS SPORTS INTERNATIONAL</span>
      <span data-fr="VOTRE IDÉE → VOTRE TERRAIN" data-en="YOUR IDEA → YOUR SPORTS SPACE">VOTRE IDÉE → VOTRE TERRAIN</span>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'manifesto-transition-right';
  right.innerHTML = `
    <article class="manifesto-transition-item">
      <span>01</span>
      <strong data-fr="CONCEVOIR" data-en="DESIGN">CONCEVOIR</strong>
      <p data-fr="Vos besoins · Votre site · Un espace adapté" data-en="Your needs · Your site · A space that fits">Vos besoins · Votre site · Un espace adapté</p>
    </article>
    <article class="manifesto-transition-item">
      <span>02</span>
      <strong data-fr="INSTALLER" data-en="INSTALL">INSTALLER</strong>
      <p data-fr="Équipements · Travaux · Contrôles de sécurité" data-en="Equipment · Construction · Safety checks">Équipements · Travaux · Contrôles de sécurité</p>
    </article>
    <article class="manifesto-transition-item">
      <span>03</span>
      <strong data-fr="ENTRETENIR" data-en="MAINTAIN">ENTRETENIR</strong>
      <p data-fr="Suivi des installations · Entretien des équipements" data-en="Facility care · Equipment maintenance">Suivi des installations · Entretien des équipements</p>
    </article>
  `;

  shell.append(left, media, right);
  originalLayout?.replaceWith(shell);

  const heroVisualLayers = [heroMedia, heroOverlay, stadiumPlan].filter(Boolean);
  const heroSecondary = [
    hero.querySelector('.hero-tagline'),
    hero.querySelector('.hero-bottom'),
    hero.querySelector('.hero-coordinate'),
    hero.querySelector('.hero-proof')
  ].filter(Boolean);

  let targetBox = null;
  let stageTop = 0;
  let scrollDistance = 1;
  let frameRequested = false;
  let lastProgress = -1;
  let restored = false;

  const measure = () => {
    if (restored) return;
    const stageRect = stage.getBoundingClientRect();
    stageTop = scrollY + stageRect.top;
    scrollDistance = Math.max(1, stage.offsetHeight - innerHeight);
    targetBox = media.getBoundingClientRect();
  };

  const setOpacityTransform = (element, opacity, translateY = 0) => {
    if (!element) return;
    element.style.opacity = opacity.toFixed(4);
    element.style.transform = `translate3d(0,${translateY.toFixed(2)}px,0)`;
  };

  const render = () => {
    frameRequested = false;
    if (restored) return;
    const journeyProgress = clamp((scrollY - stageTop) / scrollDistance);
    // One scroll owner. The immersive journey precedes the existing measured
    // photo crop, so its camera and the manifesto never compete for the Hero.
    const journeyActive = stage.hasAttribute('data-journey-stage');
    const progress = journeyActive ? range(journeyProgress, .72, 1) : journeyProgress;
    if (!targetBox) measure();

    const prepareP = smooth(range(progress, 0.16, 0.34));
    const maskP = smooth(range(progress, 0.20, 0.72));
    const gridP = smooth(range(progress, 0.28, 0.50));
    const markerP = smooth(range(progress, 0.38, 0.56));
    const headingP = smooth(range(progress, 0.46, 0.82));
    const copyP = smooth(range(progress, 0.62, 0.90));
    const itemsP = smooth(range(progress, 0.58, 0.90));
    const mediaSwapP = smooth(range(progress, 0.68, 0.84));

    // The final mask is measured from the real media rectangle, keeping the
    // shared-element alignment responsive instead of hardcoding 34vw/16vh.
    const topInset = mix(0, Math.max(0, targetBox.top), maskP);
    const leftInset = mix(0, Math.max(0, targetBox.left), maskP);
    const rightInset = mix(0, Math.max(0, innerWidth - targetBox.right), maskP);
    const bottomInset = mix(0, Math.max(0, innerHeight - targetBox.bottom), maskP);
    heroClip.style.clipPath = `inset(${topInset}px ${rightInset}px ${bottomInset}px ${leftInset}px)`;

    // The Hero itself remains a full viewport coordinate system. Existing
    // parallax is neutralised here so the title is cropped, not miniaturised.
    if (heroTitle) heroTitle.style.transform = 'none';
    hero.style.setProperty('--hero-transition-bg-alpha', String(1 - mediaSwapP));

    heroVisualLayers.forEach(layer => {
      layer.style.opacity = String(1 - mediaSwapP);
    });

    heroSecondary.forEach(layer => {
      const fade = journeyActive ? 1 - smooth(range(journeyProgress, .035, .105)) : 1 - smooth(range(progress, 0.66, 0.88));
      layer.style.opacity = String(fade);
      layer.inert = fade < .05;
    });

    if (heroTitle) {
      const titleFade = journeyActive ? 1 - smooth(range(journeyProgress, .035, .115)) : 1 - smooth(range(progress, 0.76, 0.94));
      heroTitle.style.opacity = String(titleFade);
    }

    // Section 2 is already laid out behind the Hero before the mask starts.
    manifesto.style.setProperty('--next-prepare', prepareP.toFixed(4));
    manifesto.style.setProperty('--next-grid', gridP.toFixed(4));
    manifesto.style.setProperty('--media-swap', mediaSwapP.toFixed(4));
    manifesto.style.setProperty('--tape-progress', smooth(range(progress, 0.76, 0.98)).toFixed(4));

    const marker = manifesto.querySelector('.manifesto-transition-marker');
    setOpacityTransform(marker, markerP, mix(10, 0, markerP));
    setOpacityTransform(heading, headingP, mix(34, 0, headingP));
    setOpacityTransform(copy, copyP, mix(28, 0, copyP));

    manifesto.querySelectorAll('.manifesto-transition-item').forEach((item, index) => {
      const itemP = smooth(range(itemsP, index * 0.12, 0.62 + index * 0.12));
      setOpacityTransform(item, itemP, mix(22, 0, itemP));
    });

    if (tape) {
      tape.style.opacity = manifesto.style.getPropertyValue('--tape-progress');
      tape.style.transform = `translate3d(0,${mix(28, 0, Number(manifesto.style.getPropertyValue('--tape-progress')))}px,0)`;
    }

    // Header geometry never changes. Only its light/dark visual theme changes.
    if (header) {
      const stagePassed = scrollY > stageTop + scrollDistance * 0.98;
      header.classList.toggle('is-scrolled', progress >= 0.40 || stagePassed);
    }

    stage.dataset.phase = progress < 0.20 ? 'hero' : progress < 0.72 ? 'mask' : progress < 0.90 ? 'swap' : 'manifesto';
    if (journeyActive) {
      stage.dispatchEvent(new CustomEvent('hero:progress', { detail: { progress: journeyProgress } }));
    }
    lastProgress = progress;
  };

  const requestRender = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(render);
  };

  const refresh = () => {
    if (restored) return;
    measure();
    requestRender();
  };

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', refresh, { passive: true });
  addEventListener('load', refresh, { once: true });

  // Fonts can slightly change the measured central target box.
  document.fonts?.ready?.then(refresh).catch(() => {});
  // The journey can gracefully leave its pinned composition after a runtime
  // accessibility/breakpoint change. Restore the genuine original document.
  stage.addEventListener('hero:restore-flow', () => {
    restored = true;
    removeEventListener('scroll', requestRender);
    removeEventListener('resize', refresh);
    removeEventListener('load', refresh);
    document.body.classList.remove('has-hero-manifesto-transition');
    hero.classList.remove('hero--transition');
    manifesto.classList.remove('manifesto--transition');
    [hero, heroTitle, manifesto, heading, copy, tape, ...heroVisualLayers, ...heroSecondary].filter(Boolean).forEach(element => {
      element.style.removeProperty('opacity');
      element.style.removeProperty('transform');
      element.inert = false;
    });
    if (originalLayout) {
      if (heading) originalLayout.append(heading);
      if (copy) originalLayout.append(copy);
      shell.replaceWith(originalLayout);
    }
    stage.replaceWith(hero, manifesto);
  }, { once: true });
  refresh();
})();
