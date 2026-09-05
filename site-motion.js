(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width:721px)');
  const section = q('[data-horizontal-section]');
  const track = q('[data-horizontal-track]');
  const panels = qa('.world-panel');
  const links = qa('.site-header nav a[href^="#"]');
  let controls = [];
  let metrics = null;
  let position = 0;
  let initialized = false;
  let frame = 0;
  let previousTime = 0;
  let active = -1;
  let navActive = '';

  const enhanced = () => desktop.matches && !reduced.matches;
  const measure = () => {
    if (!section || !track) return;
    const head = q('.worlds-head');
    const geometry = panels.map(panel => ({ left: panel.offsetLeft, width: panel.offsetWidth }));
    const last = geometry.at(-1);
    const trackWidth = last ? last.left + last.width + parseFloat(getComputedStyle(track).paddingRight) : 0;
    metrics = {
      top: section.getBoundingClientRect().top + scrollY,
      distance: Math.max(1, section.offsetHeight - innerHeight),
      view: innerWidth - head.getBoundingClientRect().width,
      overflow: Math.max(0, trackWidth - track.clientWidth),
      panels: geometry
    };
    initialized = false;
    requestFrame();
  };

  function requestFrame() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }

  function render(time) {
    frame = 0;
    const dt = previousTime ? Math.min(.05, (time - previousTime) / 1000) : 1 / 60;
    previousTime = time;
    const current = links.filter(link => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return false;
      const box = target.getBoundingClientRect();
      return box.top <= innerHeight * .35 && box.bottom > innerHeight * .35;
    }).at(-1);
    if ((current?.hash || '') !== navActive) {
      navActive = current?.hash || '';
      links.forEach(link => link === current ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    }
    if (!metrics || !enhanced()) return;
    const progress = clamp((scrollY - metrics.top) / metrics.distance);
    const target = progress * metrics.overflow;
    const inSection = scrollY > metrics.top - innerHeight && scrollY < metrics.top + section.offsetHeight;
    if (!initialized || !inSection) position = target;
    initialized = true;
    position += (target - position) * (1 - Math.exp(-13 * dt));
    if (Math.abs(target - position) < .12) position = target;
    track.style.transform = `translate3d(${-position.toFixed(2)}px,0,0)`;
    const progressBar = q('.worlds-progress span');
    if (progressBar) progressBar.style.transform = `scaleX(${metrics.overflow ? position / metrics.overflow : 0})`;
    let nearest = 0;
    let nearestDistance = Infinity;
    metrics.panels.forEach((geometry, index) => {
      const centre = geometry.left + geometry.width / 2 - position;
      const local = clamp((centre - metrics.view / 2) / metrics.view, -1.4, 1.4);
      const focus = 1 - clamp(Math.abs(local));
      const panel = panels[index];
      if (Math.abs(local) < nearestDistance) { nearest = index; nearestDistance = Math.abs(local); }
      panel.style.setProperty('--panel-focus', focus.toFixed(3));
      panel.style.transform = `translate3d(0,${(Math.abs(local) * 24).toFixed(2)}px,0) scale(${(.965 + focus * .035).toFixed(4)})`;
      panel.querySelector('.world-media').style.transform = `translate3d(${(local * -3).toFixed(2)}%,0,0) scale(1.025)`;
      panel.querySelector('.world-copy').style.transform = `translate3d(${(local * 13).toFixed(2)}px,${((1 - focus) * 12).toFixed(2)}px,0)`;
    });
    if (active !== nearest) {
      active = nearest;
      controls.forEach((button, index) => button.setAttribute('aria-current', String(index === active)));
    }
    if (position !== target) requestFrame();
  }

  if (section && track) {
    const nav = document.createElement('nav');
    nav.className = 'worlds-wayfinding';
    controls = panels.map((panel, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(index + 1).padStart(2, '0');
      button.addEventListener('click', () => {
        if (enhanced() && metrics) {
          const geometry = metrics.panels[index];
          const destination = clamp(geometry.left + geometry.width / 2 - metrics.view / 2, 0, metrics.overflow);
          scrollTo({ top: metrics.top + destination / Math.max(1, metrics.overflow) * metrics.distance, behavior:'smooth' });
        } else {
          scrollTo({ top: panel.getBoundingClientRect().top + scrollY - 95, behavior:reduced.matches ? 'instant' : 'smooth' });
          controls.forEach(item => item.setAttribute('aria-current', String(item === button)));
        }
      });
      nav.append(button);
      return button;
    });
    q('.worlds-head').append(nav);
    const labels = () => {
      nav.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Browse solutions' : 'Parcourir les solutions');
      controls.forEach((button, index) => {
        button.setAttribute('aria-label', panels[index].querySelector('h3').textContent);
      });
    };
    const configure = () => {
      section.toggleAttribute('data-motion-track', enhanced());
      q('.worlds-progress span')?.style.removeProperty('width');
      if (!enhanced()) {
        track.style.removeProperty('transform');
        panels.forEach(panel => {
          panel.style.removeProperty('transform');
          panel.querySelector('.world-media').style.removeProperty('transform');
          panel.querySelector('.world-copy').style.removeProperty('transform');
        });
      }
      measure();
    };
    labels();
    configure();
    desktop.addEventListener('change', configure);
    reduced.addEventListener('change', configure);
    document.addEventListener('site:language-change', () => { labels(); requestAnimationFrame(measure); });
    document.fonts?.ready.then(measure);
    addEventListener('load', measure, { once:true });
    addEventListener('resize', measure, { passive:true });
  }
  addEventListener('scroll', requestFrame, { passive:true });
  document.addEventListener('visibilitychange', () => {
    previousTime = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else requestFrame();
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const reveal = (element, vars = {}) => gsap.fromTo(element,
      { y:32, opacity:0 },
      { y:0, opacity:1, duration:.85, ease:'power3.out', ...vars,
        scrollTrigger:{ trigger:element, start:'top 90%', once:true } });

    qa('.catalogue-row,.client-row,.performance-item').forEach(element => {
      element.classList.add('motion-rule');
      gsap.fromTo(element, { '--rule-progress':0 }, {
        '--rule-progress':1, duration:1.1, ease:'power3.inOut',
        scrollTrigger:{ trigger:element, start:'top 93%', once:true }
      });
      reveal(element);
    });
    qa('.discipline-rail figure').forEach((element, index) => reveal(element, { delay:index * .055 }));
    qa('.approach-row').forEach((element, index) => reveal(element, { delay:index * .035 }));
    qa('.catalogue-preview,.project-blueprint').forEach(element => {
      gsap.fromTo(element, { clipPath:'inset(0 0 100% 0)' }, {
        clipPath:'inset(0 0 0% 0)', duration:1.2, ease:'power3.inOut',
        scrollTrigger:{ trigger:element, start:'top 88%', once:true },
        onComplete:() => gsap.set(element, { clearProps:'clipPath' })
      });
    });
    const field = q('.contact-field');
    let drawing;
    if (field) {
      field.classList.add('has-drawing');
      field.insertAdjacentHTML('beforeend', `<svg class="contact-drawing" viewBox="0 0 740 740" aria-hidden="true"><path d="M370 15 A355 355 0 1 1 369.99 15"/><path d="M10 480 L710 252"/><circle r="4" cx="370" cy="15"/></svg>`);
      drawing = field.querySelector('.contact-drawing');
      const [circle, axis] = drawing.querySelectorAll('path');
      const tip = drawing.querySelector('circle');
      const circleLength = circle.getTotalLength();
      const axisLength = axis.getTotalLength();
      const pen = { progress:0 };
      gsap.set(circle, { strokeDasharray:circleLength, strokeDashoffset:circleLength });
      gsap.set(axis, { strokeDasharray:axisLength, strokeDashoffset:axisLength });
      gsap.to(pen, {
        progress:1, ease:'none',
        scrollTrigger:{ trigger:'#contact', start:'top 85%', end:'bottom 80%', scrub:.6 },
        onUpdate:() => {
          const circleP = clamp(pen.progress / .7);
          const axisP = clamp((pen.progress - .8) / .2);
          circle.style.strokeDashoffset = String(circleLength * (1 - circleP));
          axis.style.strokeDashoffset = String(axisLength * (1 - axisP));
          let point;
          if (pen.progress < .7) point = circle.getPointAtLength(circleLength * circleP);
          else if (pen.progress >= .8) point = axis.getPointAtLength(axisLength * axisP);
          else {
            // A pen-up transfer joins the two strokes without teleporting.
            const t = (pen.progress - .7) / .1;
            const u = 1 - t;
            point = { x:u * u * 370 + 2 * u * t * 80 + t * t * 10,
              y:u * u * 15 + 2 * u * t * 65 + t * t * 480 };
          }
          tip.setAttribute('cx', point.x); tip.setAttribute('cy', point.y);
        }
      });
    }
    qa('.footer-top > *').forEach((element, index) => reveal(element, { delay:index * .08 }));
    gsap.fromTo('.footer-wordmark', { yPercent:47 }, { yPercent:12, ease:'none',
      scrollTrigger:{ trigger:'.site-footer', start:'top bottom', end:'bottom bottom', scrub:.7 } });
    return () => { drawing?.remove(); field?.classList.remove('has-drawing'); };
  });
})();
