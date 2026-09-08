/* Profils Sports — one scroll-driven camera, three readable depths.
   The prototype's camera-facing ribbons are adapted into five sports lanes.
   No bloom passes, textures, remote imports or scroll interception. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero--journey');
  const chapters = document.querySelector('[data-journey-chapters]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !chapters) return;
  const restoreBaseline = () => {
    document.querySelector('[data-hero-manifesto-transition]')?.dispatchEvent(new Event('hero:restore-flow'));
    hero.after(chapters);
  };
  if (reduced.matches || !window.THREE || innerHeight < 620) { restoreBaseline(); return; }
  const T = window.THREE;
  const media = hero.querySelector('.hero-media');
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-journey-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
  } catch (_) { restoreBaseline(); return; }

  const clamp = v => Math.max(0, Math.min(1, v));
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const smooth = v => { const p = clamp(v); return p * p * (3 - 2 * p); };
  const mix = (a, b, p) => a + (b - a) * p;
  const scene = new T.Scene();
  scene.background = new T.Color('#091521');
  const camera = new T.PerspectiveCamera(48, 1, .1, 240);
  renderer.outputColorSpace = T.SRGBColorSpace;
  const N = 512;
  const laneCount = 5;
  const colors = ['#597078', '#9aa995', '#EFE158', '#9aa995', '#597078'];
  const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));

  // Each layout has corresponding samples. Morph the same vertices instead
  // of swapping objects; camera travel continues through the handoff.
  const paths = Array.from({ length: 4 }, () => []);
  for (let l = 0; l < laneCount; l++) {
    const lane = l - 2;
    for (let shape = 0; shape < 4; shape++) {
      paths[shape][l] = Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);
        if (shape === 0) return new T.Vector3(7 + 6 * Math.sin(t * 4.2 - .35) + lane * mix(2.8, .6, t), -7 + Math.sin(t * Math.PI), 24 - t * 145);
        if (shape === 1) return new T.Vector3(-48 + t * 100, -9 + lane * .72 + 24 * gauss(t, .40 + lane * .009, .12) + 9 * gauss(t, .80, .16), -26 - t * 28 + lane * .6);
        if (shape === 2) return new T.Vector3(-70 + t * 145, 12 - 30 * Math.sin(Math.PI * t) ** 4 + lane * mix(1.15, .6, Math.sin(Math.PI * t)), -25 - 22 * Math.sin(Math.PI * t) + lane * .5);
        return new T.Vector3(-75 + 155 * t, -8 + 23 * t * t + lane * (1.1 + 4 * smooth(range(t, .50, 1))), -32 - 14 * Math.sin(t * Math.PI) + lane * t);
      });
    }
  }
  const layoutKeys = [[0, 0], [.115, 0], [.19, 1], [.30, 1], [.395, 2], [.50, 2], [.59, 3], [1, 3]];
  const cameraKeys = [
    [0, [0, 5, 27], [-10, -2, -48], 48, -.025],
    [.11, [3, 4, 12], [2, -2, -54], 49, -.04],
    [.20, [-14, 5, 5], [-3, 2, -36], 47, .04],
    [.30, [-7, 5, -3], [4, 2, -39], 45, .055],
    [.40, [18, 3, 9], [4, -5, -38], 48, -.035],
    [.50, [12, 1, -1], [-2, -6, -39], 46, -.05],
    [.60, [-14, 4, 12], [-2, 0, -38], 46, .025],
    [.72, [-5, 3, -2], [10, 3, -43], 47, .015],
    [1, [7, 5, -14], [25, 4, -46], 50, 0]
  ];
  const between = (keys, p) => {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    return [keys[i], keys[i + 1], smooth(range(p, keys[i][0], keys[i + 1][0]))];
  };
  const ribbons = colors.map((color, lane) => {
    const positions = new Float32Array(N * 6);
    const sides = new Float32Array(N * 2);
    const distances = new Float32Array(N * 2);
    const indices = [];
    for (let i = 0; i < N; i++) {
      sides[i * 2] = -1; sides[i * 2 + 1] = 1;
      distances[i * 2] = distances[i * 2 + 1] = i / (N - 1);
      if (i < N - 1) { const v = i * 2; indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('aSide', new T.BufferAttribute(sides, 1));
    geometry.setAttribute('aDistance', new T.BufferAttribute(distances, 1));
    geometry.setIndex(indices);
    const material = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uColor: { value: new T.Color(color) }, uTime: { value: 0 }, uSignal: { value: lane === 2 ? 1 : 0 }, uEnergy: { value: 0 },
        uResolution: { value: new T.Vector2(1, 1) }, uFocus: { value: new T.Vector4(0, 0, 0, 0) }, uFocusOpacity: { value: 0 } },
      vertexShader: `attribute float aSide; attribute float aDistance;
        varying float vSide; varying float vDistance; varying float vDepth;
        void main(){vSide=aSide;vDistance=aDistance;vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 uColor; uniform float uTime; uniform float uSignal; uniform float uEnergy;
        uniform vec2 uResolution; uniform vec4 uFocus; uniform float uFocusOpacity;
        varying float vSide; varying float vDistance; varying float vDepth;
        void main(){
          float edge=abs(vSide);
          float core=1.-smoothstep(.23,.42,edge);
          float shoulder=pow(max(0.,1.-edge),3.)*.17*uSignal;
          float head=fract(uTime*.055);
          float gap=abs(vDistance-head);
          float pulse=exp(-gap*gap/ .00010)*uSignal;
          float fade=(1.-smoothstep(75.,150.,vDepth)) * smoothstep(.0,.025,vDistance)*(1.-smoothstep(.97,1.,vDistance));
          float alpha=(core*(.66+.22*uSignal)+shoulder+pulse*.18)*fade;
          vec2 outside=max(abs(gl_FragCoord.xy/uResolution-uFocus.xy)-uFocus.zw,vec2(0.));
          alpha*=1.-.92*uFocusOpacity*(1.-smoothstep(0.,.085,length(outside)));
          vec3 col=mix(uColor,vec3(.97,.96,.75),pulse*.65+uEnergy*.12*uSignal);
          gl_FragColor=vec4(col,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { geometry, material, positions, points: Array.from({ length: N }, () => new T.Vector3()) };
  });

  // A real, tangent-following dart carries the preloader's drawing gesture.
  const dartShape = new T.Shape();
  dartShape.moveTo(0, -.38); dartShape.lineTo(.16, .22); dartShape.lineTo(0, .12); dartShape.lineTo(-.16, .22); dartShape.closePath();
  const dart = new T.Mesh(new T.ShapeGeometry(dartShape), new T.MeshBasicMaterial({ color: '#EFE158', side: T.DoubleSide, depthTest: false }));
  dart.renderOrder = 2;
  scene.add(dart);

  let stage = document.querySelector('[data-hero-manifesto-transition]');
  const desktopStage = !!stage;
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'hero-journey-mobile-stage';
    hero.before(stage);
    stage.append(hero);
  }
  stage.dataset.journeyStage = '';
  hero.dataset.journeyActive = '';
  media.append(canvas);
  hero.append(chapters);
  const articles = [...chapters.querySelectorAll('[data-journey-chapter]')];
  const nav = document.createElement('nav');
  nav.className = 'hero-journey-nav';
  nav.setAttribute('aria-label', 'Parcours du projet');
  const labels = [['Imaginer', 'Imagine'], ['Équiper', 'Equip'], ['Faire vivre', 'Keep playing']];
  nav.innerHTML = labels.map(([fr, en], i) => `<button type="button" data-journey-seek="${i}" data-fr="${fr}" data-en="${en}">${fr}</button>`).join('') +
    '<button type="button" class="hero-journey-nav__skip" data-fr="Passer l’introduction ↗" data-en="Skip introduction ↗">Passer l’introduction ↗</button>' +
    '<button type="button" class="hero-journey-nav__pause" aria-pressed="false" data-fr="Pause du tracé" data-en="Pause tracing">Pause du tracé</button>';
  hero.append(nav);
  const controls = [...nav.querySelectorAll('[data-journey-seek]')];
  const windows = [[.12, .16, .29, .33], [.335, .38, .485, .53], [.535, .58, .69, .735]];
  const centers = [.22, .43, .635];
  let top = 0, distance = 1, viewportHeight = innerHeight;
  let target = 0, current = 0, raf = 0, lastTime = 0, time = 0;
  let visible = true, paused = false, contextLost = false, lastWidth = 0, destroyed = false;
  let focusBoxes = [], activeFocus = -1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const tangent = new T.Vector3(), view = new T.Vector3(), side = new T.Vector3(), targetVector = new T.Vector3();
  const projected = new T.Vector3(), projectedNext = new T.Vector3();
  const introRunning = () => document.body.classList.contains('intro-running');
  const modalOpen = () => document.body.classList.contains('catalogue-ribbon-open');
  const canRender = () => !destroyed && visible && !document.hidden && !contextLost && !reduced.matches && !modalOpen();
  const wake = () => { if (!raf && canRender()) raf = requestAnimationFrame(render); };
  function measure() {
    if (destroyed) return;
    if (reduced.matches || (desktopStage !== (innerWidth >= 900)) || innerHeight < 620) { restoreReadingFlow(); return; }
    top = scrollY + stage.getBoundingClientRect().top;
    viewportHeight = hero.clientHeight;
    distance = Math.max(1, stage.offsetHeight - (desktopStage ? innerHeight : viewportHeight));
    const width = media.clientWidth;
    camera.aspect = width / Math.max(1, media.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 900 ? 1.5 : 1.8));
    renderer.setSize(width, media.clientHeight, false);
    focusBoxes = articles.map(article => ({ x: article.offsetLeft, y: article.offsetTop, w: article.offsetWidth, h: article.offsetHeight }));
    ribbons.forEach(ribbon => renderer.getDrawingBufferSize(ribbon.material.uniforms.uResolution.value));
    lastWidth = width;
    target = clamp((scrollY - top) / distance) * (desktopStage ? 1 : .75);
    wake();
  }
  const seek = (p, focusManifesto = false) => {
    // Native scrolling remains in charge, including touch, scrollbar and keys.
    window.scrollTo({ top: top + distance * p, behavior: reduced.matches ? 'instant' : 'smooth' });
    if (focusManifesto) {
      const next = document.querySelector('#approach-intro');
      next.setAttribute('tabindex', '-1');
      next.focus({ preventScroll: true });
    }
  };
  controls.forEach((button, i) => button.addEventListener('click', () => seek(centers[i] / (desktopStage ? 1 : .75))));
  nav.querySelector('.hero-journey-nav__skip').addEventListener('click', () => seek(desktopStage ? 1 : 1 + viewportHeight / distance, true));
  nav.querySelector('.hero-journey-nav__pause').addEventListener('click', event => {
    paused = !paused;
    event.currentTarget.setAttribute('aria-pressed', String(paused));
    wake();
  });
  const secondary = [hero.querySelector('.hero-tagline'), hero.querySelector('.hero-bottom')];
  const title = hero.querySelector('[data-hero-title]');
  function updateContent(p, velocity) {
    let active = -1;
    let focus = -1, strongest = 0;
    articles.forEach((article, i) => {
      const [start, enter, hold, end] = windows[i];
      const entrance = smooth(range(p, start, enter));
      const exit = (!desktopStage && i === 2) ? 0 : smooth(range(p, hold, end));
      const opacity = entrance * (1 - exit);
      const depth = (1 - entrance) * -.045 + exit * .065;
      article.style.opacity = opacity.toFixed(3);
      article.style.transform = `translate3d(0,${((1 - entrance) * 30 - exit * 38).toFixed(2)}px,0) scale(${(1 + depth).toFixed(4)})`;
      article.style.filter = `blur(${Math.min(3, ((1 - entrance) + exit) * (1 + velocity * 6)).toFixed(2)}px)`;
      article.inert = opacity < .2;
      article.setAttribute('aria-hidden', String(opacity < .2));
      if (opacity > .5) active = i;
      if (opacity > strongest) { strongest = opacity; focus = i; }
    });
    controls.forEach((button, i) => { if (active === i) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    activeFocus = focus;
    ribbons.forEach(ribbon => {
      const box = focusBoxes[focus];
      if (box) ribbon.material.uniforms.uFocus.value.set((box.x + box.w / 2) / lastWidth, 1 - (box.y + box.h / 2) / viewportHeight, box.w / (lastWidth * 2), box.h / (viewportHeight * 2));
      ribbon.material.uniforms.uFocusOpacity.value = strongest;
    });
    const reading = p > .105 && p < (desktopStage ? .745 : .85);
    hero.toggleAttribute('data-journey-reading', reading);
    nav.inert = p >= (desktopStage ? .745 : .85);
    nav.style.opacity = nav.inert ? 0 : 1;
    controls.forEach(button => { button.inert = !reading; });
    nav.querySelector('.hero-journey-nav__skip').inert = !reading;
    nav.style.setProperty('--journey-progress', String(range(p, .12, .735)));
    if (!desktopStage) {
      document.querySelector('[data-header]')?.classList.toggle('is-scrolled', scrollY > top + distance + viewportHeight * .8);
      const fade = 1 - smooth(range(p, .035, .115));
      title.style.opacity = fade;
      secondary.forEach(el => { el.style.opacity = fade; el.inert = fade < .05; });
    }
  }
  function updateGeometry(p, energy) {
    const [a, b, f] = between(cameraKeys, p);
    for (let i = 0; i < 3; i++) {
      camera.position.setComponent(i, mix(a[1][i], b[1][i], f));
      targetVector.setComponent(i, mix(a[2][i], b[2][i], f));
    }
    const mobile = lastWidth < 900;
    if (mobile) { camera.position.z += 14; targetVector.y += 8; targetVector.x += 19 * (1 - smooth(range(p, .11, .19))); }
    camera.position.x += pointer.x * .75;
    camera.position.y += pointer.y * .4;
    camera.fov = mix(a[3], b[3], f);
    camera.updateProjectionMatrix();
    camera.lookAt(targetVector);
    camera.rotateZ(mix(a[4], b[4], f));
    camera.updateMatrixWorld();
    const [from, to, t] = between(layoutKeys, p);
    ribbons.forEach((ribbon, lane) => {
      const { points, positions } = ribbon;
      for (let i = 0; i < N; i++) points[i].lerpVectors(paths[from[1]][lane][i], paths[to[1]][lane][i], t);
      for (let i = 0; i < N; i++) {
        const point = points[i];
        tangent.subVectors(points[Math.min(N - 1, i + 1)], points[Math.max(0, i - 1)]).normalize();
        view.subVectors(camera.position, point);
        const d = view.length();
        side.crossVectors(tangent, view.normalize()).normalize();
        const width = 2 * Math.tan(camera.fov * Math.PI / 360) * d / Math.max(1, viewportHeight) * (lane === 2 ? 3.2 : 2);
        for (let s = 0; s < 2; s++) {
          const j = i * 6 + s * 3;
          const sign = s === 0 ? -1 : 1;
          positions[j] = point.x + side.x * width * sign;
          positions[j + 1] = point.y + side.y * width * sign;
          positions[j + 2] = point.z + side.z * width * sign;
        }
      }
      ribbon.geometry.attributes.position.needsUpdate = true;
      ribbon.material.uniforms.uTime.value = time;
      ribbon.material.uniforms.uEnergy.value = energy;
    });
    const index = Math.floor((time * .055 % 1) * (N - 2));
    const points = ribbons[2].points;
    dart.position.copy(points[index]);
    projected.copy(points[index]).project(camera);
    projectedNext.copy(points[index + 1]).project(camera);
    dart.quaternion.copy(camera.quaternion);
    const angle = Math.atan2((projectedNext.y - projected.y) * viewportHeight, (projectedNext.x - projected.x) * lastWidth);
    dart.rotateZ(angle + Math.PI / 2);
    const scale = camera.position.distanceTo(dart.position) * .022;
    dart.scale.set(scale, scale * (1 + energy * .35), scale);
    dart.visible = !introRunning() && projected.z < 1 && projected.z > -1;
    const box = focusBoxes[activeFocus];
    const dx = (projected.x + 1) / 2 * lastWidth, dy = (1 - projected.y) / 2 * viewportHeight;
    if (box && dx > box.x - 35 && dx < box.x + box.w + 35 && dy > box.y - 35 && dy < box.y + box.h + 35) dart.visible = false;
  }
  function render(now) {
    raf = 0;
    if (!canRender()) { lastTime = 0; return; }
    const dt = Math.min(.05, lastTime ? (now - lastTime) / 1000 : .016);
    lastTime = now;
    // Direct jumps across the stage never spend seconds catching up offscreen.
    const difference = target - current;
    current = Math.abs(difference) > .28 ? target : mix(current, target, 1 - Math.exp(-dt * 11));
    if (Math.abs(target - current) < .00005) current = target;
    const energy = Math.min(1, Math.abs(difference) * 15);
    pointer.x = mix(pointer.x, pointer.tx, 1 - Math.exp(-dt * 6));
    pointer.y = mix(pointer.y, pointer.ty, 1 - Math.exp(-dt * 6));
    if (!paused && !introRunning()) time += dt * (1 + energy * 1.4);
    updateContent(current, energy);
    updateGeometry(current, energy);
    renderer.render(scene, camera);
    hero.dataset.journeyReady = '';
    if ((!paused && !introRunning()) || current !== target || Math.abs(pointer.x - pointer.tx) + Math.abs(pointer.y - pointer.ty) > .001) wake();
  }
  const updateProgress = p => { target = p; if (contextLost) updateContent(target, 0); wake(); };
  stage.addEventListener('hero:progress', event => updateProgress(event.detail.progress));
  const mobileScroll = () => { if (!destroyed) updateProgress(clamp((scrollY - top) / distance) * .75); };
  if (!desktopStage) addEventListener('scroll', mobileScroll, { passive: true });
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || paused) return;
    pointer.tx = event.clientX / innerWidth - .5;
    pointer.ty = .5 - event.clientY / innerHeight;
    wake();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; wake(); });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; } else { current = target; wake(); } });
  observer.observe(stage);
  const bodyObserver = new MutationObserver(wake);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { lastTime = 0; wake(); });
  document.addEventListener('site:language-change', event => {
    const english = event.detail.lang === 'en';
    nav.setAttribute('aria-label', english ? 'Your project journey' : 'Parcours du projet');
    chapters.setAttribute('aria-label', english ? 'Your journey with Profils Sports' : 'Votre parcours avec Profils Sports');
    measure();
  });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  document.fonts?.ready.then(measure);
  // Context loss keeps the native chapters and still usable. The camera can
  // resume after restoration without rebuilding the DOM or losing scroll.
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; hero.removeAttribute('data-journey-ready'); });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; measure(); });
  function restoreReadingFlow() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    observer.disconnect(); bodyObserver.disconnect();
    removeEventListener('resize', measure); removeEventListener('scroll', mobileScroll);
    stage.removeAttribute('data-journey-stage');
    if (desktopStage) stage.dispatchEvent(new Event('hero:restore-flow'));
    else stage.replaceWith(hero);
    hero.after(chapters);
    hero.removeAttribute('data-journey-active');
    hero.removeAttribute('data-journey-ready');
    hero.removeAttribute('data-journey-reading');
    [...articles, title, ...secondary].forEach(el => { el.removeAttribute('style'); el.inert = false; el.removeAttribute('aria-hidden'); });
    nav.remove(); canvas.remove();
    scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    renderer.dispose();
    dispatchEvent(new Event('resize'));
  }
  reduced.addEventListener('change', restoreReadingFlow, { once: true });
  measure();
  // Tell the existing stage owner its scroll distance has changed.
  dispatchEvent(new Event('resize'));
})();
