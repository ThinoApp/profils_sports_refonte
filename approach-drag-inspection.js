(() => {
  'use strict';

  const section = document.querySelector('#approach');
  const host = section?.querySelector('[data-blueprint]');
  const rows = section ? [...section.querySelectorAll('[data-approach-row]')] : [];
  if (!section || !host || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(any-pointer:fine)').matches;
  const desktop = matchMedia('(min-width:900px)').matches;
  if (reduced || !finePointer || !desktop) return;

  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'fr';

  const STATES = [
    {
      fr: 'CONCEPTION STRATÉGIQUE & FAISABILITÉ',
      en: 'STRATEGIC DESIGN & FEASIBILITY',
      labelsFr: ['BESOINS', 'FAISABILITÉ', 'URBANISME', 'ERP', 'ACCESSIBILITÉ', 'CONCEPTION'],
      labelsEn: ['NEEDS', 'FEASIBILITY', 'PLANNING', 'ERP', 'ACCESSIBILITY', 'DESIGN'],
      geometry: 'field'
    },
    {
      fr: 'INGÉNIERIE SUR MESURE & NORMÉE',
      en: 'BESPOKE & STANDARDS-BASED ENGINEERING',
      labelsFr: ['STRUCTURES', 'REVÊTEMENTS', 'ÉQUIPEMENTS', 'EUROCODES', 'MODULAIRE', 'INDUSTRIALISATION'],
      labelsEn: ['STRUCTURES', 'SURFACES', 'EQUIPMENT', 'EUROCODES', 'MODULAR', 'INDUSTRIALISATION'],
      geometry: 'structure'
    },
    {
      fr: 'PILOTAGE ADMINISTRATIF & FINANCIER',
      en: 'ADMINISTRATIVE & FINANCIAL STEERING',
      labelsFr: ['DOSSIERS', 'CONFORMITÉ ERP', 'GARANTIES', 'BUDGET', 'CAPEX / OPEX', 'REPORTING'],
      labelsEn: ['PERMITS', 'ERP COMPLIANCE', 'GUARANTEES', 'BUDGET', 'CAPEX / OPEX', 'REPORTING'],
      geometry: 'flow'
    },
    {
      fr: 'RÉALISATION DES TRAVAUX',
      en: 'CONSTRUCTION EXECUTION',
      labelsFr: ['PLANIFICATION', 'COORDINATION', 'INSTALLATION', 'QUALITÉ', 'HSE', 'RÉCEPTION / DOE'],
      labelsEn: ['PLANNING', 'COORDINATION', 'INSTALLATION', 'QUALITY', 'HSE', 'HANDOVER / DOE'],
      geometry: 'delivery'
    },
    {
      fr: 'MAINTENANCE',
      en: 'MAINTENANCE',
      labelsFr: ['AIRES DE JEUX', 'ÉQUIPEMENTS', 'SPORTS & LOISIRS', 'GYMNASES', 'STADES', 'MAINTENANCE'],
      labelsEn: ['PLAYGROUNDS', 'EQUIPMENT', 'SPORTS & LEISURE', 'ARENAS', 'STADIUMS', 'MAINTENANCE'],
      geometry: 'maintenance'
    }
  ];

  host.classList.add('approach-drag-ready');

  const layer = document.createElement('div');
  layer.className = 'approach-drag-layer';
  layer.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  layer.appendChild(canvas);

  const traceSvg = document.createElementNS(NS, 'svg');
  traceSvg.classList.add('approach-drag-trace');
  traceSvg.setAttribute('aria-hidden', 'true');
  traceSvg.setAttribute('preserveAspectRatio', 'none');

  const traceGroup = document.createElementNS(NS, 'g');
  traceGroup.classList.add('approach-drag-trace__paths');
  traceSvg.appendChild(traceGroup);

  const traceCursor = document.createElementNS(NS, 'g');
  traceCursor.classList.add('approach-drag-trace__cursor');
  const traceCursorShape = document.createElementNS(NS, 'path');
  traceCursorShape.setAttribute('d', 'M 10 0 L -7 6 L -3 0 L -7 -6 Z');
  traceCursor.appendChild(traceCursorShape);
  traceSvg.appendChild(traceCursor);
  layer.appendChild(traceSvg);

  const surface = document.createElement('div');
  surface.className = 'approach-drag-surface';
  surface.setAttribute('aria-hidden', 'true');

  const divider = document.createElement('div');
  divider.className = 'approach-drag-divider';
  divider.setAttribute('aria-hidden', 'true');

  const handle = document.createElement('div');
  handle.className = 'approach-drag-handle';
  handle.setAttribute('aria-hidden', 'true');
  handle.textContent = 'GLISSER';

  const ui = document.createElement('div');
  ui.className = 'approach-drag-ui';
  ui.setAttribute('aria-hidden', 'true');
  ui.innerHTML = `
    <span class="approach-drag-ui__photo">PROJET</span>
    <span class="approach-drag-ui__technical">INGÉNIERIE</span>
    <strong class="approach-drag-stage"></strong>
    <span class="approach-drag-hint">GLISSER POUR INSPECTER · LE TRACEUR CONSTRUIT LE PLAN</span>
  `;

  host.append(layer, ui, surface, divider, handle);

  const ctx = canvas.getContext('2d');
  const stageLabel = ui.querySelector('.approach-drag-stage');
  const photoLabel = ui.querySelector('.approach-drag-ui__photo');
  const technicalLabel = ui.querySelector('.approach-drag-ui__technical');
  const hintLabel = ui.querySelector('.approach-drag-hint');

  let activeStep = Math.max(0, rows.findIndex(row => row.classList.contains('is-active')));
  let width = 1;
  let height = 1;
  let dpr = 1;
  let currentX = 18;
  let targetX = 18;
  let restX = 18;
  let dragging = false;
  let interacted = false;
  let raf = 0;
  let running = false;

  let tracePaths = [];
  let traceTimeline = [];
  let traceTimelineIndex = 0;
  let traceStartedAt = 0;
  let traceRaf = 0;
  let traceReleaseTimer = 0;

  const setInspectX = value => {
    currentX = clamp(value, 6, 94);
    host.style.setProperty('--inspect-x', `${currentX}%`);
  };

  const drawGrid = () => {
    const gap = Math.max(34, Math.round(width / 12));
    ctx.save();
    ctx.strokeStyle = 'rgba(239,225,88,.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x + .5, 0);
      ctx.lineTo(x + .5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y + .5);
      ctx.lineTo(width, y + .5);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawField = () => {
    const x = width * .18;
    const y = height * .30;
    const w = width * .64;
    const h = height * .48;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * .13, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(x, y + h * .26, w * .13, h * .48);
    ctx.strokeRect(x + w * .87, y + h * .26, w * .13, h * .48);
  };

  const drawStructure = () => {
    const baseY = height * .76;
    ctx.beginPath();
    ctx.moveTo(width * .18, baseY);
    ctx.quadraticCurveTo(width * .38, height * .29, width * .5, height * .35);
    ctx.quadraticCurveTo(width * .62, height * .29, width * .82, baseY);
    ctx.stroke();
    for (let i = 0; i < 7; i += 1) {
      const x = width * (.22 + i * .093);
      const apexY = height * (.39 + Math.abs(3 - i) * .038);
      ctx.beginPath(); ctx.moveTo(x, baseY - height * .025); ctx.lineTo(width * .5, apexY); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, baseY - height * .025, 4, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawFlow = () => {
    const boxes = [[.15,.34],[.42,.34],[.69,.34],[.285,.64],[.555,.64]];
    const bw = width * .16;
    const bh = height * .105;
    boxes.forEach(([px, py], index) => {
      const x = width * px;
      const y = height * py;
      ctx.strokeRect(x, y, bw, bh);
      ctx.fillRect(x + 14, y + 18, 24, 3);
      ctx.font = `600 ${Math.max(10,width*.014)}px Arial`;
      ctx.fillText(String(index + 1).padStart(2,'0'), x + 14, y + bh - 15);
    });
    const points = [[.31,.392,.42,.392],[.58,.392,.69,.392],[.23,.445,.365,.64],[.85,.445,.635,.64],[.445,.692,.555,.692]];
    points.forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(width*x1,height*y1); ctx.lineTo(width*x2,height*y2); ctx.stroke();
    });
  };

  const drawDelivery = () => {
    const x = width * .16;
    const y = height * .30;
    const w = width * .68;
    const h = height * .48;
    ctx.strokeRect(x, y, w, h);
    for (let i = 0; i < 5; i += 1) {
      const yy = y + h * (.16 + i * .17);
      ctx.beginPath(); ctx.moveTo(x + w * .08, yy); ctx.lineTo(x + w * .88, yy); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * (.12 + i * .16), yy, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x + w * .08, y + h * .16);
    ctx.lineTo(x + w * .28, y + h * .33);
    ctx.lineTo(x + w * .44, y + h * .50);
    ctx.lineTo(x + w * .60, y + h * .67);
    ctx.lineTo(x + w * .76, y + h * .84);
    ctx.stroke();
  };

  const drawMaintenance = () => {
    const cx = width * .52;
    const cy = height * .55;
    const radii = [height * .24, height * .18, height * .12];
    radii.forEach(radius => {
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    });
    const pts = [
      [cx, cy-radii[0]], [cx+radii[0]*.87,cy-radii[0]*.28], [cx+radii[0]*.65,cy+radii[0]*.76],
      [cx-radii[0]*.55,cy+radii[0]*.84], [cx-radii[0]*.92,cy-radii[0]*.22]
    ];
    pts.forEach((p, index) => {
      const n = pts[(index + 1) % pts.length];
      ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(n[0],n[1]); ctx.stroke();
    });
  };

  const drawBlueprint = () => {
    if (!ctx) return;
    const state = STATES[activeStep] || STATES[0];
    const isEn = lang() === 'en';
    const labels = isEn ? state.labelsEn : state.labelsFr;
    const title = isEn ? state.en : state.fr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#07131f';
    ctx.fillRect(0, 0, width, height);
    drawGrid();

    ctx.strokeStyle = 'rgba(239,225,88,.72)';
    ctx.fillStyle = 'rgba(239,225,88,.88)';
    ctx.lineWidth = 1.35;
    ctx.strokeRect(18.5, 18.5, width - 37, height - 37);

    ctx.font = `700 ${Math.max(9, width * .014)}px Arial`;
    ctx.fillText('PROFILS SPORTS / PROJECT SYSTEM', 30, 42);
    ctx.textAlign = 'right';
    ctx.fillText(`${String(activeStep + 1).padStart(2,'0')} / 05`, width - 30, 42);
    ctx.textAlign = 'left';

    ctx.save();
    ctx.strokeStyle = 'rgba(239,225,88,.62)';
    ctx.fillStyle = 'rgba(239,225,88,.82)';
    ctx.lineWidth = 1.35;
    if (state.geometry === 'field') drawField();
    else if (state.geometry === 'structure') drawStructure();
    else if (state.geometry === 'flow') drawFlow();
    else if (state.geometry === 'delivery') drawDelivery();
    else drawMaintenance();
    ctx.restore();

    ctx.font = `600 ${Math.max(9, width * .013)}px Arial`;
    labels.forEach((label, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 30 + col * width * .47;
      const y = height - 112 + row * 30;
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(x, y - 7, 18, 1);
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.fillText(label, x + 28, y);
    });

    stageLabel.textContent = title;
    photoLabel.textContent = isEn ? 'PROJECT' : 'PROJET';
    technicalLabel.textContent = isEn ? 'ENGINEERING' : 'INGÉNIERIE';
    hintLabel.textContent = isEn
      ? 'DRAG TO INSPECT · THE TRACER BUILDS THE DRAWING'
      : 'GLISSER POUR INSPECTER · LE TRACEUR CONSTRUIT LE PLAN';
    handle.textContent = isEn ? 'DRAG' : 'GLISSER';
  };

  const fmt = value => Number(value.toFixed(2));
  const rectD = (x, y, w, h) => `M ${fmt(x)} ${fmt(y)} H ${fmt(x+w)} V ${fmt(y+h)} H ${fmt(x)} Z`;
  const lineD = (x1, y1, x2, y2) => `M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}`;
  const circleD = (cx, cy, r) => `M ${fmt(cx+r)} ${fmt(cy)} A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx-r)} ${fmt(cy)} A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx+r)} ${fmt(cy)}`;

  const traceDefinitions = geometry => {
    if (geometry === 'field') {
      const x = width * .18;
      const y = height * .30;
      const w = width * .64;
      const h = height * .48;
      const r = Math.min(w, h) * .13;
      return [
        rectD(x,y,w,h),
        lineD(x+w/2,y,x+w/2,y+h),
        circleD(x+w/2,y+h/2,r),
        rectD(x,y+h*.26,w*.13,h*.48),
        rectD(x+w*.87,y+h*.26,w*.13,h*.48)
      ];
    }

    if (geometry === 'structure') {
      const baseY = height * .76;
      const paths = [`M ${fmt(width*.18)} ${fmt(baseY)} Q ${fmt(width*.38)} ${fmt(height*.29)} ${fmt(width*.5)} ${fmt(height*.35)} Q ${fmt(width*.62)} ${fmt(height*.29)} ${fmt(width*.82)} ${fmt(baseY)}`];
      for (let i = 0; i < 7; i += 1) {
        const x = width * (.22 + i * .093);
        const apexY = height * (.39 + Math.abs(3 - i) * .038);
        paths.push(lineD(x, baseY-height*.025, width*.5, apexY));
      }
      return paths;
    }

    if (geometry === 'flow') {
      const boxes = [[.15,.34],[.42,.34],[.69,.34],[.285,.64],[.555,.64]];
      const bw = width * .16;
      const bh = height * .105;
      const paths = boxes.map(([px, py]) => rectD(width*px,height*py,bw,bh));
      const connectors = [[.31,.392,.42,.392],[.58,.392,.69,.392],[.23,.445,.365,.64],[.85,.445,.635,.64],[.445,.692,.555,.692]];
      connectors.forEach(([x1,y1,x2,y2]) => paths.push(lineD(width*x1,height*y1,width*x2,height*y2)));
      return paths;
    }

    if (geometry === 'delivery') {
      const x = width * .16;
      const y = height * .30;
      const w = width * .68;
      const h = height * .48;
      const paths = [rectD(x,y,w,h)];
      for (let i = 0; i < 5; i += 1) {
        const yy = y + h * (.16 + i * .17);
        paths.push(lineD(x+w*.08,yy,x+w*.88,yy));
      }
      paths.push(`M ${fmt(x+w*.08)} ${fmt(y+h*.16)} L ${fmt(x+w*.28)} ${fmt(y+h*.33)} L ${fmt(x+w*.44)} ${fmt(y+h*.50)} L ${fmt(x+w*.60)} ${fmt(y+h*.67)} L ${fmt(x+w*.76)} ${fmt(y+h*.84)}`);
      return paths;
    }

    const cx = width * .52;
    const cy = height * .55;
    const radii = [height*.24,height*.18,height*.12];
    const paths = radii.map(radius => circleD(cx,cy,radius));
    const pts = [
      [cx,cy-radii[0]], [cx+radii[0]*.87,cy-radii[0]*.28], [cx+radii[0]*.65,cy+radii[0]*.76],
      [cx-radii[0]*.55,cy+radii[0]*.84], [cx-radii[0]*.92,cy-radii[0]*.22]
    ];
    paths.push(`M ${pts.map((p,index) => `${index ? 'L' : ''} ${fmt(p[0])} ${fmt(p[1])}`).join(' ')} Z`);
    return paths;
  };

  const setTraceCursor = (x, y, angle) => {
    traceCursor.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(angle)})`);
  };

  const pathAngle = (path, distance) => {
    const length = path.getTotalLength();
    const before = path.getPointAtLength(clamp(distance - 2.5, 0, length));
    const after = path.getPointAtLength(clamp(distance + 2.5, 0, length));
    return Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
  };

  const resetTraceVisuals = () => {
    tracePaths.forEach(item => {
      item.path.style.strokeDasharray = `${item.length}`;
      item.path.style.strokeDashoffset = `${item.length}`;
    });
    traceTimelineIndex = 0;
    traceCursor.removeAttribute('style');
    const first = tracePaths[0];
    if (first) {
      const point = first.path.getPointAtLength(0);
      setTraceCursor(point.x, point.y, pathAngle(first.path, 0));
    }
  };

  const rebuildTrace = () => {
    cancelAnimationFrame(traceRaf);
    clearTimeout(traceReleaseTimer);
    traceRaf = 0;
    host.classList.remove('is-tracing', 'is-trace-complete', 'is-trace-releasing');
    traceSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    traceGroup.replaceChildren();

    const state = STATES[activeStep] || STATES[0];
    tracePaths = traceDefinitions(state.geometry).map(d => {
      const path = document.createElementNS(NS, 'path');
      path.classList.add('approach-drag-trace__path');
      path.setAttribute('d', d);
      traceGroup.appendChild(path);
      const length = Math.max(1, path.getTotalLength());
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      return { path, length };
    });
    resetTraceVisuals();
  };

  const quadraticPoint = (a, c, b, t) => {
    const inv = 1 - t;
    return {
      x: inv*inv*a.x + 2*inv*t*c.x + t*t*b.x,
      y: inv*inv*a.y + 2*inv*t*c.y + t*t*b.y
    };
  };

  const quadraticAngle = (a, c, b, t) => {
    const dx = 2*(1-t)*(c.x-a.x) + 2*t*(b.x-c.x);
    const dy = 2*(1-t)*(c.y-a.y) + 2*t*(b.y-c.y);
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const buildTraceTimeline = () => {
    const totalLength = tracePaths.reduce((sum, item) => sum + item.length, 0) || 1;
    const drawBudget = 1500;
    const timeline = [];
    let clock = 0;

    tracePaths.forEach((item, index) => {
      const duration = Math.max(105, drawBudget * item.length / totalLength);
      timeline.push({ type:'draw', start:clock, end:clock+duration, duration, item });
      clock += duration;

      const next = tracePaths[index + 1];
      if (!next) return;
      const from = item.path.getPointAtLength(item.length);
      const to = next.path.getPointAtLength(0);
      const distance = Math.hypot(to.x-from.x, to.y-from.y);
      if (distance < 3) return;
      const durationTransfer = clamp(55 + distance * .12, 72, 145);
      const control = {
        x: (from.x + to.x) * .5,
        y: clamp(Math.min(from.y,to.y) - Math.min(height*.075, 26 + distance*.08), 18, height-18)
      };
      timeline.push({ type:'transfer', start:clock, end:clock+durationTransfer, duration:durationTransfer, from, to, control });
      clock += durationTransfer;
    });
    return timeline;
  };

  const finishTimelineItem = item => {
    if (item.type === 'draw') {
      item.item.path.style.strokeDashoffset = '0';
      const point = item.item.path.getPointAtLength(item.item.length);
      setTraceCursor(point.x, point.y, pathAngle(item.item.path, item.item.length));
    } else {
      setTraceCursor(item.to.x, item.to.y, quadraticAngle(item.from,item.control,item.to,1));
    }
  };

  const traceFrame = now => {
    const elapsed = now - traceStartedAt;

    while (traceTimelineIndex < traceTimeline.length && elapsed >= traceTimeline[traceTimelineIndex].end) {
      finishTimelineItem(traceTimeline[traceTimelineIndex]);
      traceTimelineIndex += 1;
    }

    const item = traceTimeline[traceTimelineIndex];
    if (!item) {
      traceRaf = 0;
      host.classList.remove('is-tracing');
      host.classList.add('is-trace-complete');
      return;
    }

    const local = clamp((elapsed - item.start) / item.duration, 0, 1);
    const eased = easeOutCubic(local);

    if (item.type === 'draw') {
      const distance = item.item.length * eased;
      item.item.path.style.strokeDashoffset = `${item.item.length - distance}`;
      const point = item.item.path.getPointAtLength(distance);
      setTraceCursor(point.x, point.y, pathAngle(item.item.path, distance));
    } else {
      const point = quadraticPoint(item.from,item.control,item.to,eased);
      setTraceCursor(point.x, point.y, quadraticAngle(item.from,item.control,item.to,eased));
    }

    traceRaf = requestAnimationFrame(traceFrame);
  };

  const startTrace = () => {
    clearTimeout(traceReleaseTimer);
    cancelAnimationFrame(traceRaf);
    host.classList.remove('is-trace-releasing', 'is-trace-complete');
    host.classList.add('is-tracing');
    resetTraceVisuals();
    traceTimeline = buildTraceTimeline();
    traceTimelineIndex = 0;
    traceStartedAt = performance.now();
    traceRaf = requestAnimationFrame(traceFrame);
  };

  const stopTrace = (immediate = false) => {
    cancelAnimationFrame(traceRaf);
    traceRaf = 0;
    clearTimeout(traceReleaseTimer);
    host.classList.remove('is-tracing', 'is-trace-complete');

    if (immediate) {
      host.classList.remove('is-trace-releasing');
      resetTraceVisuals();
      return;
    }

    host.classList.add('is-trace-releasing');
    traceReleaseTimer = window.setTimeout(() => {
      host.classList.remove('is-trace-releasing');
      resetTraceVisuals();
    }, 440);
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    drawBlueprint();
    rebuildTrace();
    if (dragging) startTrace();
  };

  const startAnimation = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };

  const tick = () => {
    const delta = targetX - currentX;
    currentX = Math.abs(delta) < .02 ? targetX : lerp(currentX, targetX, dragging ? .34 : .18);
    setInspectX(currentX);
    if (Math.abs(targetX - currentX) > .02) {
      raf = requestAnimationFrame(tick);
      return;
    }
    running = false;
  };

  const pointerPercent = event => {
    const rect = host.getBoundingClientRect();
    return clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100, 6, 94);
  };

  surface.addEventListener('pointerenter', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (!dragging && !interacted) {
      const hover = pointerPercent(event);
      targetX = clamp(hover * .34, 18, 31);
      startAnimation();
    }
  }, { passive: true });

  surface.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const next = pointerPercent(event);
    if (dragging) {
      targetX = next;
      startAnimation();
    } else if (!interacted) {
      targetX = clamp(next * .34, 18, 31);
      startAnimation();
    }
  }, { passive: true });

  surface.addEventListener('pointerleave', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (!dragging && !interacted) {
      targetX = restX;
      startAnimation();
    }
  }, { passive: true });

  surface.addEventListener('pointerdown', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    dragging = true;
    interacted = true;
    host.classList.add('is-dragging', 'is-interacted');
    targetX = pointerPercent(event);
    surface.setPointerCapture?.(event.pointerId);
    startAnimation();
    startTrace();
  });

  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    restX = targetX;
    host.classList.remove('is-dragging');
    if (event?.pointerId != null) surface.releasePointerCapture?.(event.pointerId);
    startAnimation();
    stopTrace(false);
  };

  surface.addEventListener('pointerup', endDrag);
  surface.addEventListener('pointercancel', endDrag);

  surface.addEventListener('dblclick', () => {
    interacted = false;
    restX = 18;
    targetX = 18;
    host.classList.remove('is-interacted');
    stopTrace(true);
    startAnimation();
  });

  rows.forEach((row, index) => {
    const setStep = () => {
      if (activeStep === index) return;
      activeStep = index;
      drawBlueprint();
      rebuildTrace();
      if (dragging) startTrace();
    };
    row.addEventListener('mouseenter', setStep);
    row.addEventListener('focusin', setStep);
  });

  const rowObserver = new MutationObserver(() => {
    const index = rows.findIndex(row => row.classList.contains('is-active'));
    if (index >= 0 && index !== activeStep) {
      activeStep = index;
      drawBlueprint();
      rebuildTrace();
      if (dragging) startTrace();
    }
  });
  rows.forEach(row => rowObserver.observe(row, { attributes: true, attributeFilter: ['class'] }));

  const languageObserver = new MutationObserver(drawBlueprint);
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  addEventListener('resize', resize, { passive: true });

  resize();
  setInspectX(restX);
})();
