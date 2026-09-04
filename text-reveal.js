(() => {
  'use strict';

  const selector = '[data-text-reveal]';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = () => [...document.querySelectorAll(selector)];
  const records = [];
  let resizeTimer = 0;
  let lastWidth = innerWidth;

  const revealImmediately = element => {
    element.removeAttribute('data-text-reveal-pending');
    element.classList.add('text-reveal-complete');
    element.style.visibility = 'visible';
    element.style.opacity = '1';
  };

  const librariesReady = () => (
    typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined' &&
    typeof window.SplitText !== 'undefined'
  );

  const getConfig = element => ({
    type: element.dataset.textRevealType || 'lines',
    start: element.dataset.textRevealStart || 'top 78%',
    duration: Number.parseFloat(element.dataset.textRevealDuration || '.82'),
    stagger: Number.parseFloat(element.dataset.textRevealStagger || '.075'),
    yPercent: Number.parseFloat(element.dataset.textRevealY || '112'),
    ease: element.dataset.textRevealEase || 'expo.out'
  });

  const destroy = () => {
    while (records.length) {
      const record = records.pop();
      record.animations.forEach(animation => {
        animation.scrollTrigger?.kill();
        animation.kill();
      });
      record.split?.revert();
      record.element.classList.remove('text-reveal-complete');
      record.element.removeAttribute('data-text-reveal-pending');
      record.element.style.removeProperty('visibility');
      record.element.style.removeProperty('opacity');
    }
  };

  const createReveal = element => {
    const config = getConfig(element);
    const record = { element, split: null, animations: [] };
    const splitTypes = config.type === 'chars'
      ? 'lines,words,chars'
      : config.type === 'words' ? 'lines,words' : 'lines';

    element.setAttribute('data-text-reveal-pending', '');
    record.split = SplitText.create(element, {
      type: splitTypes,
      mask: 'lines',
      autoSplit: true,
      linesClass: 'text-reveal-line',
      wordsClass: 'text-reveal-word',
      charsClass: 'text-reveal-char',
      onSplit(instance) {
        const targets = instance[config.type] || instance.lines;
        gsap.set(targets, {
          yPercent: config.yPercent,
          force3D: true,
          willChange: 'transform'
        });
        gsap.set(element, { autoAlpha: 1 });
        element.removeAttribute('data-text-reveal-pending');

        const animation = gsap.to(targets, {
          yPercent: 0,
          duration: config.duration,
          stagger: config.stagger,
          ease: config.ease,
          force3D: true,
          scrollTrigger: {
            trigger: element,
            start: () => `clamp(${config.start})`,
            once: true,
            invalidateOnRefresh: true
          },
          onStart: () => element.dispatchEvent(new CustomEvent('text-reveal:start')),
          onComplete: () => {
            element.classList.add('text-reveal-complete');
            gsap.set(targets, { clearProps: 'willChange' });
            element.dispatchEvent(new CustomEvent('text-reveal:complete'));
          }
        });
        record.animations.push(animation);
        return animation;
      }
    });
    records.push(record);
  };

  const init = async () => {
    const targets = elements();
    if (!targets.length) return;
    if (reduced || !librariesReady()) {
      targets.forEach(revealImmediately);
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);
    targets.forEach(element => element.setAttribute('data-text-reveal-pending', ''));
    await (document.fonts?.ready || Promise.resolve());
    destroy();
    targets.forEach(createReveal);
    ScrollTrigger.refresh();
  };

  document.addEventListener('site:language-will-change', destroy);
  document.addEventListener('site:language-change', init);
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (matchMedia('(hover:none)').matches && innerWidth === lastWidth) return;
      lastWidth = innerWidth;
      if (librariesReady()) ScrollTrigger.refresh();
    }, 250);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
