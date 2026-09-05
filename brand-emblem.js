(() => {
  'use strict';
  const section = document.querySelector('.discipline-rail.brand-emblem');
  if (!section) return;
  const stage = section.querySelector('.brand-emblem__stage');
  const canvas = section.querySelector('canvas');
  const figures = [...section.querySelectorAll('figure')];
  const toolbar = section.querySelector('.brand-emblem__toolbar');
  const bottom = section.querySelector('.brand-emblem__bottom');
  const playButton = section.querySelector('[data-emblem-play]');
  const action = section.querySelector('[data-emblem-action]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  // Exact source ordering and links from legacy NosCatalogues.tsx.
  // The CTA names the actual catalogue (e.g. Canopy School, not "Soccer catalogue").
  const catalogues = [null, 'fitness', 'padel', null, null, 'canopy', 'csp', null];
  const rows = [...document.querySelectorAll('.catalogue-row[data-catalogue]')];
  const names = figures.map(figure => figure.querySelector('figcaption').textContent);
  const step = Math.PI / 4;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, n) => ((v % n) + n) % n;
  let renderer, scene, camera, emblem, environment, projection;
  let initialized = false, initializing = false, failed = false, visible = false;
  let raf = 0, lastTime = 0, phase = 2, targetPhase = 2, selected = -1;
  let pitch = .13, yaw = -.12, pointerX = 0, pointerY = 0, scrollTilt = 0;
  let pointer = null, playing = !reduced.matches, width = 1, height = 1;
  let modalOpen = document.body.classList.contains('catalogue-ribbon-open');
  const resources = new Set();
  const keep = resource => { resources.add(resource); return resource; };
  const nodeButtons = [];
  const english = () => document.documentElement.lang === 'en';
  const refreshLayout = () => requestAnimationFrame(() => window.ScrollTrigger?.refresh());

  function buildGeometry(contours) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('brand-emblem-worker.js?v=20260905-2');
      const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Logo geometry timed out')); }, 15000);
      worker.onmessage = ({ data }) => {
        clearTimeout(timeout); worker.terminate();
        if (data.error) reject(new Error(data.error)); else resolve(data.meshes);
      };
      worker.onerror = () => {
        clearTimeout(timeout); worker.terminate(); reject(new Error('Logo geometry worker unavailable'));
      };
      worker.postMessage({ contours });
    });
  }

  function studioEnvironment(THREE) {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color('#34424b');
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color:new THREE.Color(5, 5, 5), side:THREE.DoubleSide });
    [[-4, 3, 5, 3, 6], [4, 1, 2, 1, 5], [0, 5, -2, 5, 2], [1, 3, 6, 5, 1]].forEach(([x, y, z, w, h]) => {
      const panel = new THREE.Mesh(geometry, material);
      panel.position.set(x, y, z); panel.scale.set(w, h, 1); panel.lookAt(0, 0, 0);
      studio.add(panel);
    });
    const generator = new THREE.PMREMGenerator(renderer);
    const target = generator.fromScene(studio, 0);
    generator.dispose(); geometry.dispose(); material.dispose();
    return target;
  }

  function updateCopy(force = false) {
    const index = mod(Math.round(phase), figures.length);
    if (!force && selected === index) return;
    selected = index;
    const row = rows.find(row => row.dataset.catalogue === catalogues[index]);
    if (row) {
      action.dataset.catalogueTrigger = row.dataset.catalogue;
      action.href = row.href;
      action.target = '_blank';
      action.textContent = (english() ? 'BROWSE ' : 'FEUILLETER ') + row.querySelector('.catalogue-name').textContent + ' ↗';
    } else {
      delete action.dataset.catalogueTrigger;
      action.href = 'mailto:contact@profilssports.com?subject=' + encodeURIComponent('Projet ' + names[index]);
      action.removeAttribute('target');
      action.textContent = (english() ? 'DISCUSS ' : 'PARLONS ') + names[index] + ' ↗';
    }
    figures.forEach((figure, i) => {
      figure.toggleAttribute('data-active', i === index);
      nodeButtons[i]?.setAttribute('aria-pressed', String(i === index));
      nodeButtons[i]?.setAttribute('aria-label', (english() ? 'Select ' : 'Sélectionner ') + names[i]);
    });
    stage.setAttribute('aria-label', english() ? 'Rotating three-dimensional Profils Sports logo. Arrow keys select a discipline.' : 'Logo Profils Sports en trois dimensions. Les flèches sélectionnent une discipline.');
    section.querySelector('[data-emblem-prev]').setAttribute('aria-label', english() ? 'Previous discipline' : 'Discipline précédente');
    section.querySelector('[data-emblem-next]').setAttribute('aria-label', english() ? 'Next discipline' : 'Discipline suivante');
    updatePlaybackCopy();
  }

  function updatePlaybackCopy() {
    playButton.hidden = reduced.matches;
    playButton.textContent = playing ? 'Ⅱ' : '▷';
    playButton.setAttribute('aria-label', playing
      ? (english() ? 'Pause rotation' : 'Mettre la rotation en pause')
      : (english() ? 'Resume rotation' : 'Reprendre la rotation'));
  }

  function select(index) {
    playing = false;
    const delta = mod(index - mod(targetPhase, 8) + 4, 8) - 4;
    targetPhase += delta;
    updatePlaybackCopy(); wake();
  }
  function next(direction) {
    playing = false;
    targetPhase = Math.round(targetPhase) + direction;
    updatePlaybackCopy(); wake();
  }

  function fail(error) {
    failed = true; initialized = false;
    cancelAnimationFrame(raf); raf = 0;
    delete section.dataset.emblemReady; delete section.dataset.emblemPending;
    stage.hidden = toolbar.hidden = bottom.hidden = true;
    nodeButtons.forEach(button => button.remove());
    figures.forEach(figure => {
      figure.style.removeProperty('transform'); figure.style.removeProperty('visibility');
      figure.removeAttribute('data-active');
    });
    environment?.dispose();
    resources.forEach(resource => resource.dispose()); resources.clear();
    renderer?.dispose(); refreshLayout();
    if (error) console.warn('Profils Sports rotor: original discipline rail retained.', error);
  }

  async function init() {
    if (initialized || initializing || failed) return;
    initializing = true;
    try {
      const THREE = window.THREE;
      if (!THREE) throw new Error('Three.js unavailable');
      const response = await fetch('assets/brand/profils-sports-emblem-contours.json');
      if (!response.ok) throw new Error('Logo geometry HTTP ' + response.status);
      const relief = await buildGeometry(await response.json());
      renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setClearColor(0x091521, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
      projection = new THREE.Vector3();
      environment = studioEnvironment(THREE);
      scene.environment = environment.texture;
      scene.add(new THREE.HemisphereLight(0xf1efe6, 0x112333, .9));
      const key = new THREE.DirectionalLight(0xfff8e6, 1.8);
      key.position.set(-3, 5, 7); scene.add(key);
      const rim = new THREE.DirectionalLight(0xcbdcea, 1.6);
      rim.position.set(4, -1, 3); scene.add(rim);
      const silver = keep(new THREE.MeshStandardMaterial({ color:0xe4e2d5, metalness:.8, roughness:.23 }));
      const yellow = keep(new THREE.MeshPhysicalMaterial({ color:0xefe158, metalness:.42, roughness:.24, clearcoat:.65, clearcoatRoughness:.22 }));
      emblem = new THREE.Group();
      emblem.name = 'Profils Sports — openwork rotating logo';
      // Open negative space: NO cylinder, disk, face plane, logo texture or image.
      for (const data of relief) {
        const geometry = keep(new THREE.BufferGeometry());
        geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, data.color === 'yellow' ? yellow : silver);
        mesh.name = 'Authentic ' + data.color + (data.major ? ' lettering' : ' inscriptions and pictograms');
        emblem.add(mesh);
      }
      const outline = new THREE.Mesh(keep(new THREE.TorusGeometry(2.2, .013, 8, 192)), silver);
      outline.name = 'Original logo perimeter'; emblem.add(outline);
      const orbitPoints = Array.from({ length:192 }, (_, i) => new THREE.Vector3(Math.sin(i / 192 * Math.PI * 2) * 3.03, Math.cos(i / 192 * Math.PI * 2) * 3.03, -.05));
      const orbit = new THREE.LineLoop(keep(new THREE.BufferGeometry().setFromPoints(orbitPoints)), keep(new THREE.LineDashedMaterial({ color:0xefe158, transparent:true, opacity:.22, dashSize:.035, gapSize:.045 })));
      orbit.computeLineDistances(); orbit.name = 'Discipline wayfinding guide'; emblem.add(orbit);
      scene.add(emblem);
      figures.forEach((figure, index) => {
        const button = document.createElement('button');
        button.className = 'brand-emblem__node'; button.type = 'button';
        button.addEventListener('click', () => select(index));
        button.addEventListener('focus', () => { playing = false; updatePlaybackCopy(); });
        figure.appendChild(button); nodeButtons.push(button);
      });
      stage.hidden = toolbar.hidden = bottom.hidden = false;
      section.dataset.emblemReady = '';
      delete section.dataset.emblemPending;
      initialized = true;
      // Pending and ready have identical dimensions; avoid refreshing pinned
      // scroll scenes again during an interaction or direct-anchor arrival.
      updateCopy(true); resize(); render(performance.now());
    } catch (error) { fail(error); }
    finally { initializing = false; }
  }

  function resize() {
    if (!initialized) return;
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const span = width < 720 ? 6.9 : 8.2;
    camera.position.set(0, 0, span / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
    camera.updateProjectionMatrix();
    const verticalSpan = span / camera.aspect;
    emblem.position.y = -verticalSpan * (width < 720 ? .11 : .45);
    wake();
  }

  function projectNodes() {
    emblem.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    figures.forEach((figure, index) => {
      const angle = (index - 2) * step;
      projection.set(Math.sin(angle) * 3.03, Math.cos(angle) * 3.03, .07).applyMatrix4(emblem.matrixWorld).project(camera);
      const x = (projection.x * .5 + .5) * width;
      const y = (-projection.y * .5 + .5) * height;
      const w = width < 720 ? 100 : 140, h = width < 720 ? 105 : 130;
      const shown = x > w / 2 + 6 && x < width - w / 2 - 6 && y > 100 && y < height - (width < 720 ? 120 : 60);
      figure.style.transform = 'translate3d(' + (x - w / 2).toFixed(2) + 'px,' + (y - h / 2).toFixed(2) + 'px,0)';
      figure.style.visibility = shown ? 'visible' : 'hidden';
      nodeButtons[index].tabIndex = shown ? 0 : -1;
    });
  }

  function wake() {
    if (!initialized || !visible || document.hidden || modalOpen || failed || raf) return;
    raf = requestAnimationFrame(render);
  }
  function render(time) {
    raf = 0;
    if (!initialized || !visible || document.hidden || modalOpen || failed) return;
    const dt = Math.min((time - lastTime) / 1000 || 1 / 60, .05);
    lastTime = time;
    if (playing && !reduced.matches && !pointer) targetPhase += dt * .09;
    const follow = reduced.matches ? 1 : 1 - Math.exp(-8 * dt);
    phase += (targetPhase - phase) * follow;
    const tx = reduced.matches ? .1 : .13 + pointerY * .06 + scrollTilt;
    const ty = reduced.matches ? -.1 : -.12 + pointerX * .1 + clamp(targetPhase - phase, -.8, .8) * .12;
    pitch += (tx - pitch) * follow; yaw += (ty - yaw) * follow;
    emblem.rotation.set(pitch, yaw, (phase - 2) * step);
    projectNodes(); updateCopy(); renderer.render(scene, camera);
    if ((playing && !reduced.matches) || Math.abs(targetPhase - phase) + Math.abs(tx - pitch) + Math.abs(ty - yaw) > .0001) wake();
  }

  section.querySelector('[data-emblem-prev]').addEventListener('click', () => next(-1));
  section.querySelector('[data-emblem-next]').addEventListener('click', () => next(1));
  playButton.addEventListener('click', () => {
    if (reduced.matches) return;
    playing = !playing; updatePlaybackCopy(); wake();
  });
  action.addEventListener('click', () => { playing = false; updatePlaybackCopy(); });
  stage.addEventListener('pointerdown', event => {
    if (!initialized || event.button !== 0 || pointer) return;
    playing = false; updatePlaybackCopy();
    pointer = { id:event.pointerId, x:event.clientX, y:event.clientY, phase:targetPhase, touch:event.pointerType === 'touch', captured:false };
    if (!pointer.touch) { stage.setPointerCapture(event.pointerId); pointer.captured = true; }
  });
  stage.addEventListener('pointermove', event => {
    if (!initialized) return;
    if (pointer && pointer.id === event.pointerId) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (pointer.touch && !pointer.captured) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { pointer = null; return; }
        if (Math.abs(dx) < 6) return;
        stage.setPointerCapture(event.pointerId); pointer.captured = true;
      }
      targetPhase = pointer.phase - dx / Math.max(80, width * .13);
      wake();
    } else if (fine.matches && !reduced.matches) {
      const rect = stage.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
      wake();
    }
  });
  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const id = pointer.id;
    pointer = null; targetPhase = Math.round(targetPhase);
    if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    wake();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => stage.addEventListener(type, release));
  stage.addEventListener('pointerleave', () => { pointerX = pointerY = 0; wake(); });
  section.addEventListener('keydown', event => {
    if (!initialized || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.target.classList.contains('brand-emblem__node')) stage.focus({ preventScroll:true });
    if (event.key === 'Home') select(2); else next(event.key === 'ArrowLeft' ? -1 : 1);
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(); });
  section.dataset.emblemPending = '';
  refreshLayout();
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { init(); wake(); }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin:'100px' });
  observer.observe(section);
  new ResizeObserver(resize).observe(section);
  window.addEventListener('scroll', () => {
    if (!visible || reduced.matches) return;
    scrollTilt = clamp(section.getBoundingClientRect().top / innerHeight, -1, 1) * .055;
    wake();
  }, { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake();
  });
  new MutationObserver(() => {
    modalOpen = document.body.classList.contains('catalogue-ribbon-open');
    if (modalOpen) { cancelAnimationFrame(raf); raf = 0; } else wake();
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { playing = false; targetPhase = Math.round(targetPhase); }
    pointerX = pointerY = scrollTilt = 0;
    updatePlaybackCopy(); wake();
  });
  document.addEventListener('site:language-change', () => updateCopy(true));
})();
