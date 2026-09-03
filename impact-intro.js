(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.querySelector('[data-preloader]');
  if (!preloader || reduced) return;

  preloader.classList.add('intro-upgraded');
  document.body.classList.add('intro-running');

  preloader.innerHTML = `
    <div class="intro-stage">
      <div class="intro-grid" aria-hidden="true"></div>
      <div class="intro-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="intro-meta"><span>PROFILS SPORTS INTERNATIONAL</span><strong>SPORTING EXCELLENCE</strong></div>
      <div class="intro-field" aria-hidden="true"></div>
      <div class="intro-lockup">
        <h2 class="intro-wordmark"><span><b>PROFILS</b></span><span><b>SPORTS</b></span></h2>
        <div class="intro-side">
          <span class="intro-side__label">DESIGN / CONSTRUCTION</span>
          <p class="intro-side__copy">Architecture sportive, ingénierie de performance, équipements & exploitation.</p>
          <div class="intro-side__rule"><i></i></div>
          <span class="intro-side__count" data-intro-count>00</span>
        </div>
      </div>
      <div class="intro-signal-line" aria-hidden="true"></div>
    </div>
    <div class="intro-curtain" aria-hidden="true"><span></span><span></span></div>
  `;

  const count = preloader.querySelector('[data-intro-count]');
  const start = performance.now();
  const duration = 1450;
  let raf = 0;

  const tick = now => {
    const p = Math.min(1, (now - start) / duration);
    preloader.style.setProperty('--intro-progress', p.toFixed(4));
    if (count) count.textContent = String(Math.round(p * 100)).padStart(2, '0');
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const open = () => {
    cancelAnimationFrame(raf);
    preloader.style.setProperty('--intro-progress', '1');
    if (count) count.textContent = '100';
    preloader.classList.add('is-opening');
    document.body.classList.add('intro-opening');

    setTimeout(() => {
      preloader.classList.add('is-complete');
      document.body.classList.remove('intro-running', 'intro-opening');
      document.body.classList.add('intro-complete');
    }, 940);
  };

  const earliestOpenAt = 1550;
  const latestOpenAt = 2300;
  const elapsed = () => performance.now() - start;

  const scheduleOpen = () => {
    const wait = Math.max(0, earliestOpenAt - elapsed());
    setTimeout(open, wait);
  };

  if (document.readyState === 'complete') {
    scheduleOpen();
  } else {
    addEventListener('load', scheduleOpen, { once: true });
    setTimeout(() => {
      if (!preloader.classList.contains('is-opening')) open();
    }, latestOpenAt);
  }
})();
