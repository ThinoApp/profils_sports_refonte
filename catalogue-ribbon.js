(() => {
  'use strict';

  const catalogueSection = document.querySelector('#catalogues');
  const rows = catalogueSection ? [...catalogueSection.querySelectorAll('[data-catalogue]')] : [];
  if (!catalogueSection || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONFIG = Object.freeze({
    cameraFov: 38,
    cameraZ: 9.6,
    cardHeight: 1.55,
    startOffset: .4,
    titleCycleOffset: .06,
    follow: 3.45,
    wheelFactor: .003,
    dragFactor: .0065,
    dragMomentum: 210,
    maxDpr: 1.25,
    minDpr: .85,
    curveSamples: 720,
    desktopSlots: 10,
    mobileSlots: 8
  });

  const CATALOGUES = Object.freeze({
    fitness: { title: 'FITNESS', pages: 74, ratio: 1755 / 1240, categoryFr: 'PERFORMANCE', categoryEn: 'PERFORMANCE' },
    padel: { title: 'PADEL', pages: 20, ratio: 2133 / 1601, categoryFr: 'SPORTS DE RAQUETTE', categoryEn: 'RACKET SPORTS' },
    csp: { title: 'CSP PRO', pages: 4, ratio: 1241 / 1754, categoryFr: 'OUTDOOR', categoryEn: 'OUTDOOR' },
    canopy: { title: 'CANOPY SCHOOL', pages: 4, ratio: 1241 / 1754, categoryFr: 'ÉDUCATION', categoryEn: 'EDUCATION' }
  });

  const overlay = document.createElement('section');
  overlay.className = 'catalogue-ribbon';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-labelledby', 'catalogue-ribbon-title');
  overlay.innerHTML = `
    <h2 class="catalogue-ribbon__sr-only" id="catalogue-ribbon-title" data-ribbon-a11y-title>Catalogue Fitness</h2>
    <div class="catalogue-ribbon__orbits" aria-hidden="true"></div>
    <div class="catalogue-ribbon__title" aria-hidden="true">
      <span class="catalogue-ribbon__title-line">CATALOGUE</span>
      <small class="catalogue-ribbon__title-note">PROFILS SPORTS INTERNATIONAL<br>TECHNICAL COLLECTION</small>
      <span class="catalogue-ribbon__title-line" data-ribbon-title>FITNESS</span>
    </div>
    <canvas class="catalogue-ribbon__canvas" data-ribbon-canvas aria-hidden="true"></canvas>
    <div class="catalogue-ribbon__fallback" data-ribbon-fallback></div>
    <header class="catalogue-ribbon__topbar">
      <div class="catalogue-ribbon__brand">
        <img src="assets/brand/profils-sports-logo.png" alt="">
        <span><strong>PROFILS SPORTS</strong><small>INTERNATIONAL</small></span>
      </div>
      <button class="catalogue-ribbon__close" type="button" data-ribbon-close aria-label="Fermer le catalogue">FERMER &nbsp; ×</button>
    </header>
    <footer class="catalogue-ribbon__bottom">
      <div class="catalogue-ribbon__meta">
        <span class="catalogue-ribbon__eyebrow" data-ribbon-eyebrow>CATALOGUE FITNESS</span>
        <span class="catalogue-ribbon__category" data-ribbon-category>PERFORMANCE</span>
        <strong class="catalogue-ribbon__counter"><span data-ribbon-current>01</span><span data-ribbon-total>/ 74</span></strong>
      </div>
      <div class="catalogue-ribbon__instruction" aria-hidden="true">
        <span data-ribbon-instruction>FAITES DÉFILER</span><span class="catalogue-ribbon__meter"><i data-ribbon-meter></i></span><span>↕</span>
      </div>
      <a class="catalogue-ribbon__page-link" data-ribbon-page-link href="#" target="_blank" rel="noreferrer">OUVRIR LA PAGE <span>↗</span></a>
    </footer>
    <div class="catalogue-ribbon__loading" role="status"><i></i><span>CHARGEMENT DU RUBAN</span></div>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('[data-ribbon-canvas]');
  const fallback = overlay.querySelector('[data-ribbon-fallback]');
  const closeButton = overlay.querySelector('[data-ribbon-close]');
  const accessibleTitle = overlay.querySelector('[data-ribbon-a11y-title]');
  const title = overlay.querySelector('[data-ribbon-title]');
  const eyebrow = overlay.querySelector('[data-ribbon-eyebrow]');
  const category = overlay.querySelector('[data-ribbon-category]');
  const currentLabel = overlay.querySelector('[data-ribbon-current]');
  const totalLabel = overlay.querySelector('[data-ribbon-total]');
  const meter = overlay.querySelector('[data-ribbon-meter]');
  const pageLink = overlay.querySelector('[data-ribbon-page-link]');
  const instruction = overlay.querySelector('[data-ribbon-instruction]');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mod = (value, length) => ((value % length) + length) % length;
  const mod1 = value => mod(value, 1);
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / Math.max(.0001, edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  };
  const smoothPulse = (value, a, b, c, d) => smoothstep(a, b, value) * (1 - smoothstep(c, d, value));
  const pageUrl = (key, index) => `assets/catalogue-ribbon/${key}/${String(index + 1).padStart(3, '0')}.webp`;

  let isOpen = false;
  let activeKey = 'fitness';
  let activeCatalogue = CATALOGUES.fitness;
  let previousFocus = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let group = null;
  let curve = null;
  let textureLoader = null;
  let curvePosition = null;
  let curveTangent = null;
  let cameraNormal = null;
  let curveUp = null;
  let curveBasis = null;
  let curveQuaternionA = null;
  let curveQuaternionB = null;
  let curveSamplePositions = null;
  let curveSampleQuaternions = null;
  let cards = [];
  let textureCache = new Map();
  let texturePending = new Map();
  let generation = 0;
  let currentPosition = 0;
  let targetPosition = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let fallbackScrollFrame = 0;
  let renderDpr = 1;
  let frameCost = .016;
  let frameProbe = 0;
  let loadedVisibleCount = 0;
  let frontPageIndex = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartTarget = 0;
  let dragLastX = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;

  const curveSource = [
    [-10.5,.62,-5.4],[-6.7,.78,-3.05],[-4.45,.08,-.72],[-2.45,-.58,2.08],
    [-.62,-.34,2.92],[1.38,.38,.92],[3.28,.82,2.42],[5.12,.2,.34],
    [7.08,-.58,-2.75],[10.5,-.16,-5.4]
  ];

  const supportsWebGL = () => {
    if (!window.THREE || reduced) return false;
    try {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch (_) {
      return false;
    }
  };

  const createCards = () => {
    if (!group || !window.THREE) return;
    cards.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      group.remove(mesh);
    });
    cards = [];
    const count = innerWidth < 760 ? CONFIG.mobileSlots : CONFIG.desktopSlots;
    for (let index = 0; index < count; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xe5e3dc,
        side: THREE.DoubleSide,
        toneMapped: false,
        depthTest: true,
        depthWrite: true
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.userData.absolutePage = Number.NaN;
      mesh.userData.pageIndex = 0;
      group.add(mesh);
      cards.push(mesh);
    }
  };

  const initThree = () => {
    if (renderer || !supportsWebGL()) return Boolean(renderer);
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, innerWidth / innerHeight, .1, 80);
      camera.position.set(0, 0, CONFIG.cameraZ);
      camera.lookAt(0, 0, 0);
      group = new THREE.Group();
      scene.add(group);
      curve = new THREE.CatmullRomCurve3(curveSource.map(point => new THREE.Vector3(...point)), false, 'centripetal', .5);
      curve.arcLengthDivisions = 1000;
      curve.updateArcLengths();
      curvePosition = new THREE.Vector3();
      curveTangent = new THREE.Vector3();
      cameraNormal = new THREE.Vector3();
      curveUp = new THREE.Vector3();
      curveBasis = new THREE.Matrix4();
      curveQuaternionA = new THREE.Quaternion();
      curveQuaternionB = new THREE.Quaternion();
      textureLoader = new THREE.TextureLoader();
      createCards();
      resize();
      return true;
    } catch (error) {
      console.warn('[CatalogueRibbon] WebGL unavailable; using the static ribbon.', error);
      renderer = null;
      return false;
    }
  };

  const disposeTextures = () => {
    generation += 1;
    textureCache.forEach(texture => texture.dispose());
    textureCache.clear();
    texturePending.clear();
    cards.forEach(mesh => {
      mesh.material.map = null;
      mesh.material.color.setHex(0xe5e3dc);
      mesh.material.needsUpdate = true;
      mesh.userData.absolutePage = Number.NaN;
    });
  };

  const loadTexture = pageIndex => {
    if (!textureLoader) return Promise.resolve(null);
    if (textureCache.has(pageIndex)) return Promise.resolve(textureCache.get(pageIndex));
    if (texturePending.has(pageIndex)) return texturePending.get(pageIndex);
    const requestGeneration = generation;
    const request = new Promise(resolve => {
      textureLoader.load(pageUrl(activeKey, pageIndex), texture => {
        if (requestGeneration !== generation) {
          texture.dispose();
          resolve(null);
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        textureCache.set(pageIndex, texture);
        texturePending.delete(pageIndex);
        resolve(texture);
      }, undefined, () => {
        texturePending.delete(pageIndex);
        resolve(null);
      });
    });
    texturePending.set(pageIndex, request);
    return request;
  };

  const assignPage = (mesh, absolutePage) => {
    if (mesh.userData.absolutePage === absolutePage) return;
    const pageIndex = mod(absolutePage, activeCatalogue.pages);
    mesh.userData.absolutePage = absolutePage;
    mesh.userData.pageIndex = pageIndex;
    const cached = textureCache.get(pageIndex);
    mesh.material.map = cached || null;
    mesh.material.color.setHex(cached ? 0xffffff : 0xe5e3dc);
    mesh.material.needsUpdate = true;
    if (cached) return;
    loadTexture(pageIndex).then(texture => {
      if (!texture || mesh.userData.absolutePage !== absolutePage) return;
      mesh.material.map = texture;
      mesh.material.color.setHex(0xffffff);
      mesh.material.needsUpdate = true;
      loadedVisibleCount += 1;
      if (loadedVisibleCount >= Math.min(5, cards.length)) overlay.classList.add('is-ready');
    });
  };

  const rebuildCurveSamples = () => {
    if (!curve || !camera) return;
    const count = CONFIG.curveSamples;
    curveSamplePositions = new Float32Array((count + 1) * 3);
    curveSampleQuaternions = new Float32Array((count + 1) * 4);
    for (let index = 0; index <= count; index += 1) {
      const u = index / count;
      curve.getPointAt(u, curvePosition);
      curve.getTangentAt(u, curveTangent).normalize();
      cameraNormal.copy(camera.position).sub(curvePosition).normalize();
      cameraNormal.addScaledVector(curveTangent, -cameraNormal.dot(curveTangent));
      if (cameraNormal.lengthSq() < 1e-5) cameraNormal.set(0, 0, 1);
      cameraNormal.normalize();
      curveUp.crossVectors(cameraNormal, curveTangent).normalize();
      cameraNormal.crossVectors(curveTangent, curveUp).normalize();
      curveBasis.makeBasis(curveTangent, curveUp, cameraNormal);
      curveQuaternionA.setFromRotationMatrix(curveBasis);
      curveSamplePositions.set([curvePosition.x, curvePosition.y, curvePosition.z], index * 3);
      curveSampleQuaternions.set([curveQuaternionA.x, curveQuaternionA.y, curveQuaternionA.z, curveQuaternionA.w], index * 4);
    }
  };

  const positionCard = (mesh, u) => {
    const count = CONFIG.curveSamples;
    const scaled = mod1(u) * count;
    const index = Math.min(count - 1, Math.floor(scaled));
    const next = index + 1;
    const mix = scaled - Math.floor(scaled);
    const positionOffset = index * 3;
    const nextPositionOffset = next * 3;
    mesh.position.set(
      curveSamplePositions[positionOffset] + (curveSamplePositions[nextPositionOffset] - curveSamplePositions[positionOffset]) * mix,
      curveSamplePositions[positionOffset + 1] + (curveSamplePositions[nextPositionOffset + 1] - curveSamplePositions[positionOffset + 1]) * mix,
      curveSamplePositions[positionOffset + 2] + (curveSamplePositions[nextPositionOffset + 2] - curveSamplePositions[positionOffset + 2]) * mix
    );
    curveQuaternionA.fromArray(curveSampleQuaternions, index * 4);
    curveQuaternionB.fromArray(curveSampleQuaternions, next * 4);
    mesh.quaternion.slerpQuaternions(curveQuaternionA, curveQuaternionB, mix);
    mesh.scale.set(CONFIG.cardHeight * activeCatalogue.ratio, CONFIG.cardHeight, 1);
  };

  const setActivePage = nextIndex => {
    const safeIndex = mod(nextIndex, activeCatalogue.pages);
    if (safeIndex !== frontPageIndex) {
      frontPageIndex = safeIndex;
      currentLabel.textContent = String(frontPageIndex + 1).padStart(2, '0');
      pageLink.href = pageUrl(activeKey, frontPageIndex);
      const english = document.documentElement.lang === 'en';
      pageLink.setAttribute('aria-label', english
        ? `Open page ${frontPageIndex + 1} of the ${activeCatalogue.title} catalogue`
        : `Ouvrir la page ${frontPageIndex + 1} du catalogue ${activeCatalogue.title}`);
    }
    const progress = activeCatalogue.pages > 1 ? frontPageIndex / (activeCatalogue.pages - 1) : 1;
    meter.style.transform = `scaleX(${progress.toFixed(4)})`;
  };

  const updateMeta = () => {
    let bestMesh = cards[0];
    cards.forEach(mesh => {
      if (!bestMesh || mesh.position.z > bestMesh.position.z) bestMesh = mesh;
    });
    setActivePage(bestMesh?.userData.pageIndex ?? Math.round(currentPosition));
  };

  const updateCards = () => {
    if (!cards.length) return;
    const slotCount = cards.length;
    const pageSpacing = 1 / slotCount;
    const before = Math.floor(slotCount / 2);
    const firstAbsolutePage = Math.floor(currentPosition) - before;
    let cardIndex = 0;
    for (let absolutePage = firstAbsolutePage; absolutePage < firstAbsolutePage + slotCount; absolutePage += 1) {
      const mesh = cards[mod(absolutePage, slotCount)];
      assignPage(mesh, absolutePage);
      const relative = absolutePage - currentPosition;
      const u = mod1(CONFIG.startOffset + relative * pageSpacing);
      positionCard(mesh, u);
      mesh.renderOrder = cardIndex;
      cardIndex += 1;
    }
    const titlePhase = mod1(CONFIG.titleCycleOffset + currentPosition / slotCount);
    const split = smoothPulse(titlePhase, .2, .35, .62, .78);
    overlay.style.setProperty('--ribbon-title-split', split.toFixed(4));
    updateMeta();
  };

  const evictDistantTextures = () => {
    if (textureCache.size <= 26) return;
    const centre = mod(Math.round(currentPosition), activeCatalogue.pages);
    textureCache.forEach((texture, pageIndex) => {
      const rawDistance = Math.abs(pageIndex - centre);
      const distance = Math.min(rawDistance, activeCatalogue.pages - rawDistance);
      if (distance <= 14) return;
      texture.dispose();
      textureCache.delete(pageIndex);
    });
  };

  const render = time => {
    if (!isOpen || !renderer) return;
    const dt = lastFrame ? Math.min(.05, Math.max(.001, (time - lastFrame) / 1000)) : .016;
    lastFrame = time;
    const alpha = 1 - Math.exp(-CONFIG.follow * dt);
    currentPosition += (targetPosition - currentPosition) * alpha;
    updateCards();
    renderer.render(scene, camera);
    frameCost += (dt - frameCost) * .08;
    frameProbe += 1;
    if (frameProbe >= 45 && frameCost > .025 && renderDpr > CONFIG.minDpr) {
      renderDpr = Math.max(CONFIG.minDpr, renderDpr - .15);
      renderer.setPixelRatio(renderDpr);
      renderer.setSize(innerWidth, innerHeight, false);
      frameCost = .016;
      frameProbe = 0;
    }
    if (Math.abs(targetPosition - currentPosition) < .001) evictDistantTextures();
    animationFrame = requestAnimationFrame(render);
  };

  function resize() {
    if (!renderer || !camera) return;
    const mobile = innerWidth < 760;
    camera.aspect = innerWidth / innerHeight;
    camera.fov = mobile ? 47 : CONFIG.cameraFov;
    camera.position.z = mobile ? CONFIG.cameraZ + 1.15 : CONFIG.cameraZ;
    camera.updateProjectionMatrix();
    rebuildCurveSamples();
    renderer.setSize(innerWidth, innerHeight, false);
    renderDpr = Math.min(devicePixelRatio || 1, CONFIG.maxDpr);
    renderer.setPixelRatio(renderDpr);
    frameCost = .016;
    frameProbe = 0;
    const desiredSlots = mobile ? CONFIG.mobileSlots : CONFIG.desktopSlots;
    if (cards.length && cards.length !== desiredSlots) createCards();
  }

  const buildFallback = () => {
    fallback.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < activeCatalogue.pages; index += 1) {
      const image = new Image();
      image.src = pageUrl(activeKey, index);
      image.loading = index < 3 ? 'eager' : 'lazy';
      image.alt = `${activeCatalogue.title} — page ${index + 1}`;
      image.dataset.page = String(index);
      fragment.appendChild(image);
    }
    fallback.appendChild(fragment);
  };

  const updateCopy = () => {
    const english = document.documentElement.lang === 'en';
    accessibleTitle.textContent = `${english ? 'Catalogue' : 'Catalogue'} ${activeCatalogue.title}`;
    title.textContent = activeCatalogue.title;
    eyebrow.textContent = `${english ? 'CATALOGUE' : 'CATALOGUE'} ${activeCatalogue.title}`;
    category.textContent = english ? activeCatalogue.categoryEn : activeCatalogue.categoryFr;
    totalLabel.textContent = `/ ${activeCatalogue.pages}`;
    instruction.textContent = innerWidth < 760 ? (english ? 'DRAG TO BROWSE' : 'GLISSEZ POUR PARCOURIR') : (english ? 'SCROLL TO BROWSE' : 'FAITES DÉFILER');
    pageLink.firstChild.textContent = english ? 'OPEN PAGE ' : 'OUVRIR LA PAGE ';
    closeButton.firstChild.textContent = english ? 'CLOSE  ' : 'FERMER  ';
    closeButton.setAttribute('aria-label', english ? 'Close catalogue' : 'Fermer le catalogue');
  };

  const open = row => {
    activeKey = CATALOGUES[row.dataset.catalogue] ? row.dataset.catalogue : 'fitness';
    activeCatalogue = CATALOGUES[activeKey];
    previousFocus = row;
    currentPosition = 0;
    targetPosition = 0;
    frontPageIndex = -1;
    loadedVisibleCount = 0;
    disposeTextures();
    updateCopy();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('is-closing', 'is-ready', 'is-fallback');
    document.body.classList.add('catalogue-ribbon-open');
    isOpen = true;

    if (initThree()) {
      updateCards();
      renderer.render(scene, camera);
      lastFrame = 0;
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(render);
    } else {
      overlay.classList.add('is-fallback', 'is-ready');
      buildFallback();
      requestAnimationFrame(() => {
        fallback.scrollLeft = 0;
        setActivePage(0);
      });
    }

    requestAnimationFrame(() => overlay.classList.add('is-open'));
    setTimeout(() => closeButton.focus({ preventScroll: true }), 120);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    dragging = false;
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(fallbackScrollFrame);
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('catalogue-ribbon-open');
    setTimeout(() => {
      if (isOpen) return;
      overlay.hidden = true;
      overlay.classList.remove('is-closing');
      previousFocus?.focus({ preventScroll: true });
    }, reduced ? 0 : 820);
  };

  rows.forEach(row => {
    row.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(row);
    });
  });

  closeButton.addEventListener('click', close);
  overlay.addEventListener('wheel', event => {
    if (!isOpen) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (overlay.classList.contains('is-fallback')) {
      fallback.scrollLeft += delta;
      return;
    }
    const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    targetPosition += clamp(delta * deltaScale * CONFIG.wheelFactor, -1.15, 1.15);
  }, { passive: false });

  fallback.addEventListener('scroll', () => {
    cancelAnimationFrame(fallbackScrollFrame);
    fallbackScrollFrame = requestAnimationFrame(() => {
      const centre = fallback.getBoundingClientRect().left + fallback.clientWidth / 2;
      let nearest = null;
      let nearestDistance = Infinity;
      fallback.querySelectorAll('img').forEach(image => {
        const rect = image.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - centre);
        if (distance >= nearestDistance) return;
        nearest = image;
        nearestDistance = distance;
      });
      if (nearest) setActivePage(Number(nearest.dataset.page));
    });
  }, { passive: true });

  canvas.addEventListener('pointerdown', event => {
    if (!isOpen) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartTarget = targetPosition;
    dragLastX = event.clientX;
    dragLastTime = event.timeStamp;
    dragVelocity = 0;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const elapsed = Math.max(8, event.timeStamp - dragLastTime);
    const instantVelocity = (dragLastX - event.clientX) * CONFIG.dragFactor / elapsed;
    dragVelocity += (instantVelocity - dragVelocity) * .32;
    targetPosition = dragStartTarget + (dragStartX - event.clientX) * CONFIG.dragFactor;
    dragLastX = event.clientX;
    dragLastTime = event.timeStamp;
  });
  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    targetPosition += clamp(dragVelocity * CONFIG.dragMomentum, -1.65, 1.65);
    dragVelocity = 0;
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      targetPosition += 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      targetPosition -= 1;
    } else if (event.key === 'Tab') {
      const focusables = [closeButton, pageLink];
      const index = focusables.indexOf(document.activeElement);
      const nextIndex = event.shiftKey ? mod(index - 1, focusables.length) : mod(index + 1, focusables.length);
      event.preventDefault();
      focusables[nextIndex].focus();
    }
  });

  addEventListener('resize', () => {
    resize();
    if (isOpen) updateCopy();
  }, { passive: true });
})();
