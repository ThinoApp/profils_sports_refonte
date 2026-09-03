(() => {
  'use strict';

  const catalogue = document.querySelector('#catalogues');
  const preview = catalogue?.querySelector('.catalogue-preview');
  const rows = catalogue ? [...catalogue.querySelectorAll('[data-catalogue]')] : [];
  if (!catalogue || !preview || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(any-pointer:fine)').matches;
  const desktop = matchMedia('(min-width:900px)').matches;
  if (reduced || !finePointer || !desktop) return;

  const NS = 'http://www.w3.org/2000/svg';
  const SAMPLE_COUNT = 96;
  const SPRING = 0.072;
  const DAMPING = 0.79;
  const SETTLE_EPSILON = 0.018;

  const STATES = {
    fitness: {
      number: '01 / 04',
      title: 'FITNESS',
      footer: 'CATALOGUE FITNESS',
      coordinate: '74 PAGES',
      path: 'M62 436C82 286 126 128 257 105c116-20 197 85 204 189 8 119-73 197-191 181-96-13-158-95-141-190 15-85 92-143 176-124 70 16 114 86 96 154-17 64-79 103-143 87-51-13-80-65-67-116 10-41 48-69 89-62'
    },
    padel: {
      number: '02 / 04',
      title: 'PADEL',
      footer: 'CATALOGUE PADEL',
      coordinate: '20 PAGES',
      path: 'M126 404C178 348 189 300 156 263c-30-34-19-82 28-102 62-26 118 20 106 78-10 49-60 62-79 100-18 36 10 81 63 73 56-8 87-68 63-115-19-38-6-90 45-113'
    },
    csp: {
      number: '03 / 04',
      title: 'CSP PRO',
      footer: 'CATALOGUE CSP PRO',
      coordinate: '4 PAGES',
      path: 'M93 411L159 311l66 48 72-149 74 54 58-110'
    },
    canopy: {
      number: '04 / 04',
      title: 'CANOPY SCHOOL',
      footer: 'CATALOGUE CANOPY SCHOOL',
      coordinate: '4 PAGES',
      path: 'M90 402C139 259 208 167 292 143c67-19 122 16 151 72'
    }
  };

  const createSvg = (name, attrs = {}) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const stage = document.createElement('div');
  stage.className = 'catalogue-morph-stage';
  stage.setAttribute('aria-hidden', 'true');

  const svg = createSvg('svg', {
    viewBox: '0 0 520 560',
    preserveAspectRatio: 'xMidYMid meet',
    role: 'presentation'
  });

  const defs = createSvg('defs');
  const grid = createSvg('pattern', { id: 'catalogueMorphGrid', width: '40', height: '40', patternUnits: 'userSpaceOnUse' });
  grid.appendChild(createSvg('path', { d: 'M40 0H0V40', fill: 'none', stroke: '#091521', 'stroke-opacity': '.08', 'stroke-width': '1' }));
  defs.appendChild(grid);
  svg.appendChild(defs);

  svg.appendChild(createSvg('rect', { width: '520', height: '560', fill: '#f1efe6' }));
  svg.appendChild(createSvg('rect', { x: '18', y: '18', width: '484', height: '524', fill: 'url(#catalogueMorphGrid)', stroke: '#091521', 'stroke-opacity': '.14' }));

  const axisGroup = createSvg('g', { fill: 'none', stroke: '#091521', 'stroke-opacity': '.13', 'stroke-width': '1' });
  axisGroup.appendChild(createSvg('path', { d: 'M58 132H462M58 280H462M58 428H462' }));
  axisGroup.appendChild(createSvg('path', { d: 'M112 102V462M260 102V462M408 102V462' }));
  svg.appendChild(axisGroup);

  const ghostPath = createSvg('path', {
    fill: 'none', stroke: '#091521', 'stroke-opacity': '.18', 'stroke-width': '10',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  });
  const dashedPath = createSvg('path', {
    fill: 'none', stroke: '#091521', 'stroke-opacity': '.34', 'stroke-width': '1.35',
    'stroke-dasharray': '5 10', 'stroke-linecap': 'round'
  });
  const livePath = createSvg('path', {
    fill: 'none', stroke: '#efe158', 'stroke-width': '4',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  });
  svg.append(ghostPath, dashedPath, livePath);

  const nodesGroup = createSvg('g', { class: 'catalogue-morph-nodes', fill: 'none', stroke: '#091521', 'stroke-opacity': '.34' });
  const nodeFractions = [0.18, 0.43, 0.68, 0.87];
  const nodeEls = nodeFractions.map(() => {
    const g = createSvg('g');
    g.appendChild(createSvg('circle', { r: '18' }));
    g.appendChild(createSvg('path', { d: 'M-12 0H12M0-12V12' }));
    const dot = createSvg('circle', { r: '3', fill: '#efe158', stroke: 'none' });
    g.appendChild(dot);
    nodesGroup.appendChild(g);
    return { g, dot };
  });
  svg.appendChild(nodesGroup);

  const runner = createSvg('circle', { r: '6', fill: '#efe158' });
  const runnerTrail = createSvg('circle', { r: '3', fill: '#efe158', opacity: '.58' });
  svg.append(runnerTrail, runner);

  const labelGroup = createSvg('g', { fill: '#091521' });
  const label = (x, y, text, attrs = {}) => {
    const t = createSvg('text', { x, y, ...attrs });
    t.textContent = text;
    labelGroup.appendChild(t);
    return t;
  };
  label(38, 49, 'PROFILS SPORTS / CATALOGUES', { 'font-family': 'Archivo, Arial, sans-serif', 'font-size': '8.5', 'font-weight': '600', 'letter-spacing': '.9', opacity: '.72' });
  const stateNumber = label(454, 49, '01 / 04', { 'font-family': 'Archivo, Arial, sans-serif', 'font-size': '8.5', 'font-weight': '600', 'letter-spacing': '.4', 'text-anchor': 'end', opacity: '.72' });
  const stateTitle = label(39, 88, 'FITNESS', { 'font-family': '"Barlow Condensed", Arial, sans-serif', 'font-size': '31', 'font-weight': '600', 'letter-spacing': '.2' });
  const stateFooter = label(38, 526, 'CATALOGUE FITNESS', { 'font-family': 'Archivo, Arial, sans-serif', 'font-size': '8', 'font-weight': '500', 'letter-spacing': '.45', opacity: '.48' });
  const stateCoordinate = label(454, 526, '74 PAGES', { 'font-family': 'Archivo, Arial, sans-serif', 'font-size': '8', 'font-weight': '500', 'letter-spacing': '.35', 'text-anchor': 'end', opacity: '.48' });
  svg.appendChild(labelGroup);

  stage.appendChild(svg);
  preview.appendChild(stage);

  const sampler = createSvg('path', { fill: 'none', stroke: 'none' });
  svg.appendChild(sampler);

  const samplePath = d => {
    sampler.setAttribute('d', d);
    const length = sampler.getTotalLength();
    return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
      const point = sampler.getPointAtLength(length * index / (SAMPLE_COUNT - 1));
      return { x: point.x, y: point.y };
    });
  };

  const targets = Object.fromEntries(Object.entries(STATES).map(([key, state]) => [key, samplePath(state.path)]));
  sampler.remove();

  const current = targets.fitness.map(point => ({ x: point.x, y: point.y, vx: 0, vy: 0 }));
  let target = targets.fitness;
  let activeKey = 'fitness';
  let lastTime = performance.now();
  let travel = 0;

  const pointsToPath = points => {
    if (!points.length) return '';
    if (points.length < 3) return `M${points[0].x} ${points[0].y}`;
    let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    const tension = 0.92;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) * tension / 6;
      const c1y = p1.y + (p2.y - p0.y) * tension / 6;
      const c2x = p2.x - (p3.x - p1.x) * tension / 6;
      const c2y = p2.y - (p3.y - p1.y) * tension / 6;
      d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  };

  const setTarget = key => {
    if (!STATES[key] || key === activeKey) return;
    activeKey = key;
    target = targets[key];
    const state = STATES[key];
    stateNumber.textContent = state.number;
    stateTitle.textContent = state.title;
    stateFooter.textContent = state.footer;
    stateCoordinate.textContent = state.coordinate;
    stage.dataset.state = key;
  };

  const updateMarkers = time => {
    let length = 0;
    try { length = livePath.getTotalLength(); } catch (_) { return; }
    if (!length) return;

    nodeEls.forEach(({ g, dot }, index) => {
      const point = livePath.getPointAtLength(length * nodeFractions[index]);
      g.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
      const pulse = 3 + (Math.sin(time * 0.0024 + index * 1.7) + 1) * 1.8;
      dot.setAttribute('r', pulse.toFixed(2));
    });

    const runnerPosition = livePath.getPointAtLength((travel % 1) * length);
    const trailPosition = livePath.getPointAtLength(((travel + 0.52) % 1) * length);
    runner.setAttribute('cx', runnerPosition.x.toFixed(2));
    runner.setAttribute('cy', runnerPosition.y.toFixed(2));
    runnerTrail.setAttribute('cx', trailPosition.x.toFixed(2));
    runnerTrail.setAttribute('cy', trailPosition.y.toFixed(2));
  };

  const render = now => {
    const dt = Math.min(2, Math.max(0.35, (now - lastTime) / 16.667));
    lastTime = now;
    travel = (travel + 0.00235 * dt) % 1;

    let energy = 0;
    for (let i = 0; i < current.length; i += 1) {
      const point = current[i];
      const goal = target[i];
      point.vx += (goal.x - point.x) * SPRING * dt;
      point.vy += (goal.y - point.y) * SPRING * dt;
      point.vx *= Math.pow(DAMPING, dt);
      point.vy *= Math.pow(DAMPING, dt);
      point.x += point.vx * dt;
      point.y += point.vy * dt;
      energy += Math.abs(goal.x - point.x) + Math.abs(goal.y - point.y) + Math.abs(point.vx) + Math.abs(point.vy);
    }

    const d = pointsToPath(current);
    livePath.setAttribute('d', d);
    ghostPath.setAttribute('d', d);
    dashedPath.setAttribute('d', d);
    dashedPath.setAttribute('stroke-dashoffset', String(-(now * 0.015) % 90));

    updateMarkers(now);
    stage.classList.toggle('is-morphing', energy / current.length > SETTLE_EPSILON);
    requestAnimationFrame(render);
  };

  rows.forEach(row => {
    const activate = () => setTarget(row.dataset.catalogue);
    row.addEventListener('mouseenter', activate, { passive: true });
    row.addEventListener('focus', activate);
  });

  const initiallyActive = rows.find(row => row.classList.contains('is-active')) || rows[0];
  if (initiallyActive) {
    activeKey = initiallyActive.dataset.catalogue;
    target = targets[activeKey] || targets.fitness;
    const initialState = STATES[activeKey] || STATES.fitness;
    stateNumber.textContent = initialState.number;
    stateTitle.textContent = initialState.title;
    stateFooter.textContent = initialState.footer;
    stateCoordinate.textContent = initialState.coordinate;
    stage.dataset.state = activeKey;
  }

  requestAnimationFrame(render);
})();
