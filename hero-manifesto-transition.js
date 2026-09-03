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
    <div class="manifesto-transition-media__grid"></div>
    <div class="manifesto-transition-media__pitch">
      <i class="manifesto-transition-media__axis manifesto-transition-media__axis--x"></i>
      <i class="manifesto-transition-media__axis manifesto-transition-media__axis--y"></i>
      <i class="manifesto-transition-media__circle"></i>
      <i class="manifesto-transition-media__box"></i>
    </div>
    <div class="manifesto-transition-media__scan"></div>
    <div class="manifesto-transition-media__meta">
      <span>PROFILS SPORTS / PROJECT SYSTEM</span>
      <span>DESIGN → DELIVERY</span>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'manifesto-transition-right';
  right.innerHTML = `
    <article class="manifesto-transition-item">
      <span>01</span>
      <strong>CONCEVOIR</strong>
      <p>Faisabilité · Architecture · ERP · Accessibilité</p>
    </article>
    <article class="manifesto-transition-item">
      <span>02</span>
      <strong>RÉALISER</strong>
      <p>Ingénierie · Eurocodes · Installation · Qualité</p>
    </article>
    <article class="manifesto-transition-item">
      <span>03</span>
      <strong>EXPLOITER</strong>
      <p>Maintenance · HSE · Réception · DOE</p>
    </article>
  `;

  shell.append(left, media, right);
  originalLayout?.replaceWith(shell);

  // Technical Hero layer: it belongs to the Hero coordinate system and is
  // clipped together with the full-size Hero content during the transition.
  const heroTech = document.createElement('div');
  heroTech.className = 'hero-transition-tech';
  heroTech.setAttribute('aria-hidden', 'true');
  heroTech.innerHTML = `
    <i class="hero-transition-tech__line hero-transition-tech__line--a"></i>
    <i class="hero-transition-tech__line hero-transition-tech__line--b"></i>
    <i class="hero-transition-tech__line hero-transition-tech__line--c"></i>
    <span class="hero-transition-tech__mark hero-transition-tech__mark--a"></span>
    <span class="hero-transition-tech__mark hero-transition-tech__mark--b"></span>
  `;
  hero.appendChild(heroTech);

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

  const measure = () => {
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
    const progress = clamp((scrollY - stageTop) / scrollDistance);
    if (!targetBox) measure();

    const internalP = smooth(range(progress, 0.00, 0.20));
    const prepareP = smooth(range(progress, 0.16, 0.34));
    const maskP = smooth(range(progress, 0.20, 0.72));
    const gridP = smooth(range(progress, 0.28, 0.50));
    const markerP = smooth(range(progress, 0.38, 0.56));
    const headingP = smooth(range(progress, 0.46, 0.82));
    const copyP = smooth(range(progress, 0.62, 0.90));
    const itemsP = smooth(range(progress, 0.58, 0.90));
    const mediaSwapP = smooth(range(progress, 0.68, 0.84));
    const finishP = smooth(range(progress, 0.82, 1.00));

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
    heroTech.style.opacity = String(internalP * (1 - finishP));
    heroTech.style.setProperty('--hero-tech-progress', internalP.toFixed(4));

    heroVisualLayers.forEach(layer => {
      layer.style.opacity = String(1 - mediaSwapP);
    });

    heroSecondary.forEach(layer => {
      const fade = 1 - smooth(range(progress, 0.66, 0.88));
      layer.style.opacity = String(fade);
    });

    if (heroTitle) {
      const titleFade = 1 - smooth(range(progress, 0.76, 0.94));
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
    lastProgress = progress;
  };

  const requestRender = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(render);
  };

  const refresh = () => {
    measure();
    requestRender();
  };

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', refresh, { passive: true });
  addEventListener('load', refresh, { once: true });

  // Fonts can slightly change the measured central target box.
  document.fonts?.ready?.then(refresh).catch(() => {});
  refresh();
})();
