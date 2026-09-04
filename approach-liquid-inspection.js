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

  const supportsWebGL = (() => {
    try {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch (_) {
      return false;
    }
  })();
  if (!supportsWebGL) return;

  const CONFIG = Object.freeze({
    trailCapacity: 48,
    dropCapacity: 8,
    trailLifetime: 2.85,
    dropLifetime: 1.35,
    brushRadius: 0.072,
    sampleSpacing: 0.014,
    stationaryEpsilon: 0.0018,
    springStiffness: 86,
    springDampingActive: 13.5,
    springDampingIdle: 22,
    stopHoldMs: 120,
    activityRelease: 2.1,
    maxDpr: 1.35
  });

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

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const language = () => document.documentElement.lang === 'en' ? 'en' : 'fr';

  const loadThree = () => {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-three-catalogue-preview],script[data-three-approach-inspection]');
      if (existing) {
        if (window.THREE) resolve(window.THREE);
        else {
          existing.addEventListener('load', () => window.THREE ? resolve(window.THREE) : reject(new Error('THREE unavailable')), { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/three.min.js?v=20260903-3';
      script.async = true;
      script.dataset.threeApproachInspection = '';
      script.addEventListener('load', () => window.THREE ? resolve(window.THREE) : reject(new Error('THREE unavailable')), { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  };

  loadThree().then(THREE => {
    const canvas = document.createElement('canvas');
    canvas.className = 'approach-liquid-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    const frame = document.createElement('div');
    frame.className = 'approach-liquid-frame';
    frame.setAttribute('aria-hidden', 'true');

    const ui = document.createElement('div');
    ui.className = 'approach-liquid-ui';
    ui.setAttribute('aria-hidden', 'true');
    ui.innerHTML = `
      <div class="approach-liquid-ui__state">
        <span class="approach-liquid-ui__mode">ENGINEERING INSPECTION</span>
        <strong class="approach-liquid-ui__stage"></strong>
      </div>
      <span class="approach-liquid-ui__hint">DÉPLACER POUR INSPECTER</span>
    `;

    host.append(canvas, frame, ui);
    const stageLabel = ui.querySelector('.approach-liquid-ui__stage');
    const hintLabel = ui.querySelector('.approach-liquid-ui__hint');
    const modeLabel = ui.querySelector('.approach-liquid-ui__mode');

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CONFIG.maxDpr));
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    const blueprintCanvas = document.createElement('canvas');
    blueprintCanvas.width = 1200;
    blueprintCanvas.height = 1400;
    const blueprintCtx = blueprintCanvas.getContext('2d');
    const blueprintTexture = new THREE.CanvasTexture(blueprintCanvas);
    if (THREE.SRGBColorSpace) blueprintTexture.colorSpace = THREE.SRGBColorSpace;
    blueprintTexture.minFilter = THREE.LinearFilter;
    blueprintTexture.magFilter = THREE.LinearFilter;

    const trailUniforms = Array.from({ length: CONFIG.trailCapacity }, () => new THREE.Vector4(-10, -10, 0, 0));
    const dropUniforms = Array.from({ length: CONFIG.dropCapacity }, () => new THREE.Vector4(-10, -10, 0, 0));
    const headUniform = new THREE.Vector4(-10, -10, 0, 0);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uBlueprint;
      uniform vec4 uTrail[${CONFIG.trailCapacity}];
      uniform vec4 uDrops[${CONFIG.dropCapacity}];
      uniform vec4 uHead;
      uniform int uTrailCount;
      uniform int uDropCount;
      uniform float uAspect;
      uniform float uTime;

      vec2 metric(vec2 p) {
        return vec2(p.x * uAspect, p.y);
      }

      float sdSegment(vec2 p, vec2 a, vec2 b) {
        p = metric(p);
        a = metric(a);
        b = metric(b);
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), .000001), 0.0, 1.0);
        return length(pa - ba * h);
      }

      float smin(float a, float b, float k) {
        float h = clamp(.5 + .5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        float sdf = 10.0;
        vec4 previousBlob = vec4(-10.0, -10.0, 0.0, 0.0);

        for (int i = 0; i < ${CONFIG.trailCapacity}; i++) {
          if (i >= uTrailCount) break;
          vec4 blob = uTrail[i];
          float life = clamp(blob.w, 0.0, 1.0);
          if (life > .001) {
            float retention = pow(smoothstep(0.0, .34, life), .70);
            float radius = blob.z * retention;
            float d = length(metric(vUv) - metric(blob.xy)) - radius;
            sdf = smin(sdf, d, radius * .40 + .005);
            if (previousBlob.w > .001) {
              float prevLife = clamp(previousBlob.w, 0.0, 1.0);
              float segmentLife = min(life, prevLife);
              float segmentRetention = pow(smoothstep(0.0, .36, segmentLife), .74);
              float neck = mix(previousBlob.z, blob.z, .5) * segmentRetention * .72;
              float segmentD = sdSegment(vUv, previousBlob.xy, blob.xy) - neck;
              sdf = smin(sdf, segmentD, neck * .52 + .004);
            }
            previousBlob = blob;
          }
        }

        if (uHead.w > .001) {
          float headRadius = uHead.z * uHead.w;
          float headD = length(metric(vUv) - metric(uHead.xy)) - headRadius;
          sdf = smin(sdf, headD, headRadius * .44 + .005);
          if (previousBlob.w > .001) {
            float prevRetention = pow(smoothstep(0.0, .34, previousBlob.w), .70);
            float neck = min(previousBlob.z * prevRetention, headRadius) * .76;
            float bridgeD = sdSegment(vUv, previousBlob.xy, uHead.xy) - neck;
            sdf = smin(sdf, bridgeD, neck * .54 + .004);
          }
        }

        for (int i = 0; i < ${CONFIG.dropCapacity}; i++) {
          if (i >= uDropCount) break;
          vec4 drop = uDrops[i];
          float life = clamp(drop.w, 0.0, 1.0);
          float radius = drop.z * smoothstep(0.0, .28, life);
          float dropD = length(metric(vUv) - metric(drop.xy)) - radius;
          sdf = smin(sdf, dropD, radius * .18 + .0025);
        }

        float pressure = (hash21(floor(vUv * 32.0) + floor(uTime * .7)) - .5) * .0014;
        pressure += sin((vUv.x * 6.0 + vUv.y * 4.0) + uTime * .42) * .0018;
        sdf += pressure;

        float body = 1.0 - smoothstep(-.0035, .0055, sdf);
        float outer = 1.0 - smoothstep(.004, .012, sdf);
        float inner = 1.0 - smoothstep(-.010, -.003, sdf);
        float meniscus = clamp(outer - inner, 0.0, 1.0);

        vec3 blueprint = texture2D(uBlueprint, vUv).rgb;
        vec3 signal = vec3(.937, .882, .345);
        vec3 color = mix(blueprint, signal, meniscus * .92);
        float alpha = max(body, meniscus * .92);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uBlueprint: { value: blueprintTexture },
        uTrail: { value: trailUniforms },
        uDrops: { value: dropUniforms },
        uHead: { value: headUniform },
        uTrailCount: { value: 0 },
        uDropCount: { value: 0 },
        uAspect: { value: 1 },
        uTime: { value: 0 }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let width = 1;
    let height = 1;
    let aspect = 1;
    let activeStep = Math.max(0, rows.findIndex(row => row.classList.contains('is-active')));
    let visible = false;
    let running = false;
    let raf = 0;
    let lastFrame = performance.now();
    let pointerInside = false;
    let pointerInitialized = false;
    let lastPointerMotionTime = performance.now();
    let motionActivity = 0;
    let lastTrailTime = 0;
    let lastDropTime = 0;

    const pointer = new THREE.Vector2(.5, .5);
    const head = new THREE.Vector2(.5, .5);
    const previousHead = head.clone();
    const velocity = new THREE.Vector2();
    const lastTrailPoint = head.clone();
    const trail = [];
    const drops = [];

    const drawGrid = ctx => {
      ctx.save();
      ctx.strokeStyle = 'rgba(239,225,88,.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= blueprintCanvas.width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, blueprintCanvas.height); ctx.stroke();
      }
      for (let y = 0; y <= blueprintCanvas.height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(blueprintCanvas.width, y); ctx.stroke();
      }
      ctx.restore();
    };

    const drawField = ctx => {
      ctx.strokeRect(190, 300, 820, 650);
      ctx.beginPath(); ctx.moveTo(600, 300); ctx.lineTo(600, 950); ctx.stroke();
      ctx.beginPath(); ctx.arc(600, 625, 105, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(190, 455, 145, 340);
      ctx.strokeRect(865, 455, 145, 340);
      ctx.beginPath(); ctx.arc(600, 625, 7, 0, Math.PI * 2); ctx.fill();
    };

    const drawStructure = ctx => {
      ctx.beginPath();
      ctx.moveTo(170, 870);
      ctx.quadraticCurveTo(360, 330, 600, 390);
      ctx.quadraticCurveTo(840, 330, 1030, 870);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const x = 220 + i * 125;
        ctx.beginPath(); ctx.moveTo(x, 835); ctx.lineTo(600, 410 + Math.abs(3 - i) * 45); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, 835, 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeRect(230, 860, 740, 95);
    };

    const drawFlow = ctx => {
      const boxes = [[180,390],[510,390],[840,390],[345,710],[675,710]];
      boxes.forEach(([x,y], index) => {
        ctx.strokeRect(x, y, 180, 110);
        ctx.fillRect(x + 20, y + 28, 34, 5);
        ctx.fillText(String(index + 1).padStart(2, '0'), x + 20, y + 82);
      });
      [[360,445,510,445],[690,445,840,445],[270,500,435,710],[930,500,765,710],[525,765,675,765]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
    };

    const drawDelivery = ctx => {
      ctx.strokeRect(185, 360, 830, 560);
      for (let i = 0; i < 5; i++) {
        const y = 420 + i * 100;
        ctx.beginPath(); ctx.moveTo(250, y); ctx.lineTo(910, y); ctx.stroke();
        ctx.beginPath(); ctx.arc(275 + i * 135, y, 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(250, 420); ctx.lineTo(410, 520); ctx.lineTo(545, 620); ctx.lineTo(680, 720); ctx.lineTo(815, 820);
      ctx.stroke();
    };

    const drawMaintenance = ctx => {
      [300, 225, 150].forEach(radius => {
        ctx.beginPath(); ctx.arc(600, 635, radius, 0, Math.PI * 2); ctx.stroke();
      });
      const points = [[600,335],[860,500],[800,820],[430,890],[330,560]];
      points.forEach(([x,y], index) => {
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
        const next = points[(index + 1) % points.length];
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(next[0],next[1]); ctx.stroke();
      });
    };

    const drawBlueprint = () => {
      const state = STATES[activeStep] || STATES[0];
      const lang = language();
      const labels = lang === 'en' ? state.labelsEn : state.labelsFr;
      const title = lang === 'en' ? state.en : state.fr;
      const ctx = blueprintCtx;

      ctx.clearRect(0, 0, blueprintCanvas.width, blueprintCanvas.height);
      ctx.fillStyle = '#07131f';
      ctx.fillRect(0, 0, blueprintCanvas.width, blueprintCanvas.height);
      drawGrid(ctx);

      ctx.strokeStyle = 'rgba(239,225,88,.72)';
      ctx.fillStyle = 'rgba(239,225,88,.92)';
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 70, blueprintCanvas.width - 140, blueprintCanvas.height - 140);

      ctx.font = '700 24px Arial, Helvetica, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('PROFILS SPORTS / PROJECT SYSTEM', 105, 125);
      ctx.textAlign = 'right';
      ctx.fillText(`${String(activeStep + 1).padStart(2, '0')} / 05`, 1095, 125);
      ctx.textAlign = 'left';

      ctx.font = '700 52px Arial, Helvetica, sans-serif';
      const titleWords = title.split(' ');
      let line = '';
      let y = 205;
      titleWords.forEach(word => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > 880 && line) {
          ctx.fillText(line, 105, y);
          line = word;
          y += 58;
        } else line = test;
      });
      if (line) ctx.fillText(line, 105, y);

      ctx.save();
      ctx.strokeStyle = 'rgba(239,225,88,.68)';
      ctx.fillStyle = 'rgba(239,225,88,.88)';
      ctx.lineWidth = 2;
      if (state.geometry === 'field') drawField(ctx);
      else if (state.geometry === 'structure') drawStructure(ctx);
      else if (state.geometry === 'flow') drawFlow(ctx);
      else if (state.geometry === 'delivery') drawDelivery(ctx);
      else drawMaintenance(ctx);
      ctx.restore();

      ctx.font = '600 22px Arial, Helvetica, sans-serif';
      labels.forEach((label, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 105 + col * 520;
        const ly = 1110 + row * 68;
        ctx.fillStyle = 'rgba(255,255,255,.36)';
        ctx.fillRect(x, ly - 13, 24, 2);
        ctx.fillStyle = 'rgba(255,255,255,.88)';
        ctx.fillText(label, x + 42, ly);
      });

      blueprintTexture.needsUpdate = true;
      stageLabel.textContent = title;
      modeLabel.textContent = lang === 'en' ? 'ENGINEERING INSPECTION' : 'INSPECTION INGÉNIERIE';
      hintLabel.textContent = lang === 'en' ? 'MOVE TO INSPECT' : 'DÉPLACER POUR INSPECTER';
    };

    const setStep = index => {
      const next = clamp(index, 0, STATES.length - 1);
      if (next === activeStep && stageLabel.textContent) return;
      activeStep = next;
      drawBlueprint();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      aspect = width / height;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CONFIG.maxDpr));
      renderer.setSize(width, height, false);
      material.uniforms.uAspect.value = aspect;
      startLoop();
    };

    const metricDistance = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);

    const localPointer = event => {
      const rect = host.getBoundingClientRect();
      return new THREE.Vector2(
        clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        clamp(1 - (event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      );
    };

    const pushTrail = (position, speed, birth) => {
      const speedFactor = clamp(speed / 1.15, 0, 1);
      trail.push({
        x: position.x,
        y: position.y,
        radius: CONFIG.brushRadius * (0.94 + speedFactor * .55),
        birth
      });
      if (trail.length > CONFIG.trailCapacity) trail.splice(0, trail.length - CONFIG.trailCapacity);
    };

    const addTrail = now => {
      if (!pointerInside) return;
      if (!lastTrailTime) {
        lastTrailPoint.copy(head);
        pushTrail(head, 0, now);
        lastTrailTime = now;
        return;
      }
      const distance = metricDistance(lastTrailPoint, head);
      if (distance < CONFIG.stationaryEpsilon) return;
      const elapsed = Math.max((now - lastTrailTime) / 1000, .001);
      const speed = distance / elapsed;
      if (distance < CONFIG.sampleSpacing && now - lastTrailTime < 70) return;
      const steps = Math.min(9, Math.max(1, Math.ceil(distance / CONFIG.sampleSpacing)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const eased = t * t * (3 - 2 * t);
        const p = lastTrailPoint.clone().lerp(head, eased);
        pushTrail(p, speed, lastTrailTime + (now - lastTrailTime) * t);
      }

      if (speed > .78 && now - lastDropTime > 210 && drops.length < CONFIG.dropCapacity) {
        const movement = head.clone().sub(lastTrailPoint);
        const length = Math.max(metricDistance(head, lastTrailPoint), .0001);
        const tangent = new THREE.Vector2((movement.x * aspect) / length, movement.y / length);
        const normal = new THREE.Vector2(-tangent.y / aspect, tangent.x);
        const side = Math.random() > .5 ? 1 : -1;
        const pos = head.clone().addScaledVector(normal, side * (.035 + Math.random() * .022));
        drops.push({
          x: pos.x,
          y: pos.y,
          radius: .010 + Math.random() * .012,
          birth: now,
          lifetime: CONFIG.dropLifetime * (900 + Math.random() * 260)
        });
        lastDropTime = now;
      }

      lastTrailPoint.copy(head);
      lastTrailTime = now;
    };

    const updateUniforms = now => {
      const cutoff = now - (CONFIG.trailLifetime * 1000 + 180);
      while (trail.length && trail[0].birth < cutoff) trail.shift();
      while (drops.length && now - drops[0].birth > drops[0].lifetime) drops.shift();

      const trailCount = Math.min(trail.length, CONFIG.trailCapacity);
      for (let i = 0; i < CONFIG.trailCapacity; i++) {
        const uniform = trailUniforms[i];
        if (i < trailCount) {
          const sample = trail[i];
          const life = 1 - (now - sample.birth) / (CONFIG.trailLifetime * 1000);
          uniform.set(sample.x, sample.y, sample.radius, clamp(life, 0, 1));
        } else uniform.set(-10, -10, 0, 0);
      }

      const dropCount = Math.min(drops.length, CONFIG.dropCapacity);
      for (let i = 0; i < CONFIG.dropCapacity; i++) {
        const uniform = dropUniforms[i];
        if (i < dropCount) {
          const drop = drops[i];
          const life = 1 - (now - drop.birth) / drop.lifetime;
          uniform.set(drop.x, drop.y, drop.radius, clamp(life, 0, 1));
        } else uniform.set(-10, -10, 0, 0);
      }

      material.uniforms.uTrailCount.value = trailCount;
      material.uniforms.uDropCount.value = dropCount;
      return trailCount + dropCount;
    };

    const render = now => {
      running = false;
      if (!visible || document.hidden) return;

      const dt = Math.min((now - lastFrame) / 1000, .05);
      lastFrame = now;
      previousHead.copy(head);

      const displacement = pointer.clone().sub(head);
      const idleAge = now - lastPointerMotionTime;
      const activityTarget = pointerInside && idleAge < CONFIG.stopHoldMs ? 1 : 0;
      const activityRate = activityTarget > motionActivity ? 15 : CONFIG.activityRelease;
      motionActivity += (activityTarget - motionActivity) * (1 - Math.exp(-dt * activityRate));

      velocity.addScaledVector(displacement, CONFIG.springStiffness * dt);
      const damping = CONFIG.springDampingIdle + (CONFIG.springDampingActive - CONFIG.springDampingIdle) * motionActivity;
      velocity.multiplyScalar(Math.exp(-damping * dt));
      head.addScaledVector(velocity, dt);

      if (pointerInside && motionActivity < .015 && displacement.lengthSq() < 1e-8 && velocity.lengthSq() < 1e-8) {
        head.copy(pointer);
        velocity.set(0, 0);
      }

      addTrail(now);
      const activeParticles = updateUniforms(now);
      const headSpeed = Math.hypot(velocity.x * aspect, velocity.y);
      const speedFactor = clamp(headSpeed / 1.1, 0, 1);
      const targetHead = pointerInside ? 1 : 0;
      const currentHead = headUniform.w;
      const headPresence = currentHead + (targetHead - currentHead) * (1 - Math.exp(-dt * 12));
      headUniform.set(head.x, head.y, CONFIG.brushRadius * (.98 + speedFactor * .50), headPresence);

      material.uniforms.uTime.value = now / 1000;
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);

      host.classList.toggle('is-liquid-active', pointerInside || activeParticles > 0 || headPresence > .02);

      if (pointerInside || activeParticles > 0 || headPresence > .02 || velocity.lengthSq() > 1e-8) startLoop();
    };

    function startLoop() {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(render);
    }

    host.addEventListener('pointerenter', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const next = localPointer(event);
      pointer.copy(next);
      if (!pointerInitialized) {
        pointerInitialized = true;
        head.copy(next);
        previousHead.copy(next);
        lastTrailPoint.copy(next);
      }
      pointerInside = true;
      lastPointerMotionTime = performance.now();
      host.classList.add('is-liquid-interacted');
      startLoop();
    }, { passive: true });

    host.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const next = localPointer(event);
      if (metricDistance(pointer, next) > CONFIG.stationaryEpsilon * .3) lastPointerMotionTime = performance.now();
      pointer.copy(next);
      pointerInside = true;
      startLoop();
    }, { passive: true });

    host.addEventListener('pointerleave', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      pointerInside = false;
      lastTrailTime = 0;
      startLoop();
    }, { passive: true });

    rows.forEach((row, index) => {
      row.addEventListener('mouseenter', () => setStep(index));
      row.addEventListener('focusin', () => setStep(index));
    });

    const rowObserver = new MutationObserver(() => {
      const index = rows.findIndex(row => row.classList.contains('is-active'));
      if (index >= 0) setStep(index);
    });
    rows.forEach(row => rowObserver.observe(row, { attributes: true, attributeFilter: ['class'] }));

    const languageObserver = new MutationObserver(drawBlueprint);
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    const visibilityObserver = new IntersectionObserver(entries => {
      visible = Boolean(entries[0]?.isIntersecting);
      if (visible) startLoop();
      else cancelAnimationFrame(raf);
    }, { threshold: .08, rootMargin: '180px 0px 180px 0px' });
    visibilityObserver.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        lastFrame = performance.now();
        startLoop();
      }
    });

    drawBlueprint();
    resize();
    host.classList.add('approach-liquid-ready');
    document.body.classList.add('approach-liquid-enabled');
  }).catch(error => {
    console.warn('[ApproachLiquidInspection] enhancement unavailable; retaining static blueprint.', error);
  });
})();
