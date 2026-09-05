(() => {
  'use strict';

  const catalogueSection = document.querySelector('#catalogues');
  const rows = catalogueSection ? [...catalogueSection.querySelectorAll('[data-catalogue]')] : [];
  if (!catalogueSection || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONFIG = Object.freeze({
    cameraFov: 40,
    cameraZ: 8.65,
    cardHeight: 1.62,
    activeScale: .24,
    helixRadius: 2.82,
    mobileRadius: 2.15,
    helixPitch: 3.08,
    mobilePitch: 4,
    minimumSpacingAngle: .76,
    cardGap: 1.04,
    surfaceColumns: 32,
    surfaceRows: 4,
    follow: 7.2,
    wheelFactor: .00235,
    dragFactor: .0048,
    dragMomentum: 150,
    snapDelay: 190,
    maxDpr: 1.25,
    minDpr: .85,
    desktopSlots: 15,
    mobileSlots: 17
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
      <div class="catalogue-ribbon__navigation">
        <button type="button" data-ribbon-prev aria-label="Page précédente">←</button>
        <button type="button" data-ribbon-next aria-label="Page suivante">→</button>
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
  const previousButton = overlay.querySelector('[data-ribbon-prev]');
  const nextButton = overlay.querySelector('[data-ribbon-next]');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mod = (value, length) => ((value % length) + length) % length;
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / Math.max(.0001, edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  };
  const pageUrl = (key, index) => `assets/catalogue-ribbon/${key}/${String(index + 1).padStart(3, '0')}.webp`;

  let isOpen = false;
  let activeKey = 'fitness';
  let activeCatalogue = CATALOGUES.fitness;
  let previousFocus = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let group = null;
  let textureLoader = null;
  let placeholderTexture = null;
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
  let dragStartY = 0;
  let dragStartTarget = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;
  let snapAt = 0;
  let openTime = 0;
  let closeTimer = 0;
  let pointerX = 0;
  let pointerY = 0;
  let cameraX = 0;
  let cameraY = 0;
  let textureFading = false;
  let backgroundState = [];

  const viewport = () => ({
    width:window.visualViewport?.width || document.documentElement.clientWidth,
    height:window.visualViewport?.height || innerHeight,
    top:window.visualViewport?.offsetTop || 0,
    left:window.visualViewport?.offsetLeft || 0
  });
  const syncViewport = () => {
    const box = viewport();
    Object.entries(box).forEach(([key, value]) => overlay.style.setProperty(`--ribbon-${key}`, `${value}px`));
    return box;
  };
  const setOrigin = row => {
    const box = syncViewport();
    const source = row.getBoundingClientRect();
    overlay.style.setProperty('--ribbon-origin', `${clamp(source.top - box.top, 0, box.height)}px ${Math.max(0, box.width - source.right + box.left)}px ${Math.max(0, box.height - source.bottom + box.top)}px ${Math.max(0, source.left - box.left)}px`);
  };

  function requestRender() {
    if (isOpen && renderer && !document.hidden && !animationFrame) {
      animationFrame = requestAnimationFrame(render);
    }
  }

  const supportsWebGL = () => {
    if (!window.THREE || reduced) return false;
    try {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch (_) {
      return false;
    }
  };

  const vertexShader = `
    varying vec2 vRibbonUv;
    void main() {
      vRibbonUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uMap;
    uniform float uHasTexture;
    uniform float uBrightness;
    varying vec2 vRibbonUv;
    void main() {
      vec2 textureUv = vRibbonUv;
      if (!gl_FrontFacing) textureUv.x = 1.0 - textureUv.x;
      vec4 sampledPage = texture2D(uMap, textureUv);
      vec3 paper = vec3(0.898, 0.890, 0.855);
      vec3 surface = mix(paper, sampledPage.rgb, uHasTexture);
      float alpha = mix(1.0, sampledPage.a, uHasTexture);
      gl_FragColor = vec4(surface * uBrightness, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

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
      const geometry = new THREE.PlaneGeometry(1, 1, CONFIG.surfaceColumns, CONFIG.surfaceRows);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: placeholderTexture },
          uHasTexture: { value: 0 },
          uBrightness: { value: .72 }
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.absolutePage = Number.NaN;
      mesh.userData.pageIndex = 0;
      mesh.userData.basePositions = geometry.attributes.position.array.slice();
      mesh.frustumCulled = false;
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
      placeholderTexture = new THREE.DataTexture(new Uint8Array([229, 227, 220, 255]), 1, 1);
      placeholderTexture.colorSpace = THREE.SRGBColorSpace;
      placeholderTexture.needsUpdate = true;
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
      mesh.material.uniforms.uMap.value = placeholderTexture;
      mesh.material.uniforms.uHasTexture.value = 0;
      mesh.userData.textureReady = false;
      mesh.userData.absolutePage = Number.NaN;
    });
  };

  const loadTexture = pageIndex => {
    if (!textureLoader) return Promise.resolve(null);
    if (textureCache.has(pageIndex)) return Promise.resolve(textureCache.get(pageIndex));
    if (texturePending.has(pageIndex)) return texturePending.get(pageIndex);
    const requestGeneration = generation;
    // Fetch local pages explicitly: detached ImageLoader requests may be held
    // behind the legacy hero media while the document is still loading.
    const source = typeof createImageBitmap === 'function'
      ? fetch(pageUrl(activeKey, pageIndex), { priority:'high' })
        .then(response => { if (!response.ok) throw new Error('Catalogue page unavailable'); return response.blob(); })
        .then(blob => createImageBitmap(blob, { imageOrientation:'flipY' }))
        .then(bitmap => {
          const texture = new THREE.Texture(bitmap);
          texture.flipY = false;
          texture.needsUpdate = true;
          texture.addEventListener('dispose', () => bitmap.close());
          return texture;
        })
      : new Promise((resolve, reject) => textureLoader.load(pageUrl(activeKey, pageIndex), resolve, undefined, reject));
    const request = source.then(texture => {
        if (requestGeneration !== generation) {
          texture.dispose();
          return null;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        textureCache.set(pageIndex, texture);
        texturePending.delete(pageIndex);
        return texture;
    }).catch(() => {
        if (requestGeneration === generation) texturePending.delete(pageIndex);
        return null;
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
    mesh.userData.textureReady = Boolean(cached);
    mesh.material.uniforms.uMap.value = cached || placeholderTexture;
    mesh.material.uniforms.uHasTexture.value = cached ? 1 : 0;
    if (cached) return;
    loadTexture(pageIndex).then(texture => {
      if (!texture || mesh.userData.absolutePage !== absolutePage) return;
      mesh.material.uniforms.uMap.value = texture;
      mesh.material.uniforms.uHasTexture.value = 0;
      mesh.userData.textureReady = true;
      loadedVisibleCount += 1;
      if (loadedVisibleCount >= Math.min(5, cards.length)) overlay.classList.add('is-ready');
      requestRender();
    });
  };

  const helixMetrics = () => {
    const mobile = innerWidth < 760;
    const radius = mobile ? CONFIG.mobileRadius : CONFIG.helixRadius;
    const pitch = mobile ? CONFIG.mobilePitch : CONFIG.helixPitch;
    const pitchPerRadian = pitch / (Math.PI * 2);
    const pageWidth = CONFIG.cardHeight * activeCatalogue.ratio;
    const angularSpan = pageWidth / Math.hypot(radius, pitchPerRadian);
    const spacingAngle = Math.max(CONFIG.minimumSpacingAngle, angularSpan * CONFIG.cardGap);
    return { radius, pitchPerRadian, angularSpan, spacingAngle };
  };

  const deformCard = (mesh, relativePage, metrics) => {
    const activeInfluence = Math.exp(-Math.pow(relativePage / .72, 2));
    const surfaceScale = 1 + activeInfluence * CONFIG.activeScale;
    // Make physical room around the enlarged front page: scaling its width
    // alone makes neighbouring coplanar surfaces intersect and flicker.
    const focusSpacing = metrics.angularSpan * CONFIG.activeScale * .62 * Math.tanh(relativePage * 1.8);
    const centreAngle = relativePage * metrics.spacingAngle + focusSpacing;
    const depthInfluence = (Math.cos(centreAngle) + 1) * .5;
    const position = mesh.geometry.attributes.position;
    const vertices = position.array;
    const base = mesh.userData.basePositions;

    for (let index = 0; index < position.count; index += 1) {
      const offset = index * 3;
      const horizontal = base[offset];
      const vertical = base[offset + 1];
      const angle = centreAngle + horizontal * metrics.angularSpan * surfaceScale;
      vertices[offset] = metrics.radius * Math.sin(angle);
      vertices[offset + 1] = angle * metrics.pitchPerRadian + vertical * CONFIG.cardHeight * surfaceScale;
      vertices[offset + 2] = metrics.radius * Math.cos(angle);
    }

    position.needsUpdate = true;
    mesh.material.uniforms.uBrightness.value = .62 + depthInfluence * .2 + activeInfluence * .2;
    mesh.userData.activeInfluence = activeInfluence;
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

  const updateMeta = () => setActivePage(Math.round(currentPosition));

  const updateCards = (dt = .016) => {
    if (!cards.length) return;
    const slotCount = cards.length;
    const before = Math.floor(slotCount / 2);
    const firstAbsolutePage = Math.round(currentPosition) - before;
    const metrics = helixMetrics();
    let cardIndex = 0;
    textureFading = false;
    for (let absolutePage = firstAbsolutePage; absolutePage < firstAbsolutePage + slotCount; absolutePage += 1) {
      const mesh = cards[mod(absolutePage, slotCount)];
      assignPage(mesh, absolutePage);
      const relative = absolutePage - currentPosition;
      deformCard(mesh, relative, metrics);
      if (mesh.userData.textureReady && mesh.material.uniforms.uHasTexture.value < 1) {
        const uniform = mesh.material.uniforms.uHasTexture;
        uniform.value = Math.min(1, uniform.value + dt * 4);
        textureFading = uniform.value < 1 || textureFading;
      }
      mesh.renderOrder = cardIndex;
      cardIndex += 1;
    }
    const travel = Math.min(1, Math.abs(currentPosition - Math.round(currentPosition)) * 2);
    overlay.style.setProperty('--ribbon-title-split', (smoothstep(.08, .9, travel) * .14).toFixed(4));
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
    animationFrame = 0;
    if (!isOpen || !renderer || document.hidden) { lastFrame = 0; return; }
    const dt = lastFrame ? Math.min(.05, Math.max(.001, (time - lastFrame) / 1000)) : .016;
    lastFrame = time;
    if (!dragging && snapAt && time >= snapAt) {
      targetPosition = Math.round(targetPosition);
      snapAt = 0;
    }
    const alpha = 1 - Math.exp(-(dragging ? 18 : CONFIG.follow) * dt);
    currentPosition += (targetPosition - currentPosition) * alpha;
    const settled = Math.abs(targetPosition - currentPosition) < .0005;
    if (settled) currentPosition = targetPosition;
    const opening = clamp((time - openTime) / 1100, 0, 1);
    const arrival = 1 - Math.pow(1 - opening, 3);
    group.scale.setScalar(.88 + arrival * .12);
    cameraX += (pointerX - cameraX) * (1 - Math.exp(-4 * dt));
    cameraY += (pointerY - cameraY) * (1 - Math.exp(-4 * dt));
    if (Math.abs(pointerX - cameraX) < .0001) cameraX = pointerX;
    if (Math.abs(pointerY - cameraY) < .0001) cameraY = pointerY;
    group.rotation.y = cameraX * .035;
    group.rotation.x = cameraY * .022;
    updateCards(dt);
    renderer.render(scene, camera);
    frameCost += (dt - frameCost) * .08;
    frameProbe += 1;
    if (frameProbe >= 45 && frameCost > .025 && renderDpr > CONFIG.minDpr) {
      renderDpr = Math.max(CONFIG.minDpr, renderDpr - .15);
      renderer.setPixelRatio(renderDpr);
      const box = viewport();
      renderer.setSize(box.width, box.height, false);
      frameCost = .016;
      frameProbe = 0;
    }
    if (settled) evictDistantTextures();
    if (!settled || opening < 1 || snapAt || textureFading || cameraX !== pointerX || cameraY !== pointerY) requestRender();
    else lastFrame = 0;
  };

  function resize() {
    const box = syncViewport();
    if (!renderer || !camera) return;
    const mobile = innerWidth < 760;
    camera.aspect = box.width / box.height;
    camera.fov = mobile ? 48 : CONFIG.cameraFov;
    camera.position.z = mobile ? CONFIG.cameraZ + .75 : CONFIG.cameraZ;
    camera.updateProjectionMatrix();
    renderer.setSize(box.width, box.height, false);
    renderDpr = Math.min(devicePixelRatio || 1, CONFIG.maxDpr);
    renderer.setPixelRatio(renderDpr);
    frameCost = .016;
    frameProbe = 0;
    const desiredSlots = mobile ? CONFIG.mobileSlots : CONFIG.desktopSlots;
    if (cards.length && cards.length !== desiredSlots) createCards();
    requestRender();
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
    previousButton.setAttribute('aria-label', english ? 'Previous page' : 'Page précédente');
    nextButton.setAttribute('aria-label', english ? 'Next page' : 'Page suivante');
    overlay.querySelector('.catalogue-ribbon__loading span').textContent = english ? 'LOADING THE CATALOGUE' : 'CHARGEMENT DU CATALOGUE';
  };

  const open = row => {
    clearTimeout(closeTimer);
    setOrigin(row);
    activeKey = CATALOGUES[row.dataset.catalogue] ? row.dataset.catalogue : 'fitness';
    activeCatalogue = CATALOGUES[activeKey];
    previousFocus = row;
    currentPosition = 0;
    targetPosition = 0;
    snapAt = 0;
    frontPageIndex = -1;
    loadedVisibleCount = 0;
    openTime = performance.now();
    pointerX = pointerY = cameraX = cameraY = 0;
    disposeTextures();
    updateCopy();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('is-closing', 'is-ready', 'is-fallback');
    document.body.classList.add('catalogue-ribbon-open');
    isOpen = true;
    if (!backgroundState.length) {
      backgroundState = [...document.body.children].filter(element => element !== overlay && element.tagName !== 'SCRIPT')
        .map(element => ({ element, inert:element.inert }));
      backgroundState.forEach(({ element }) => { element.inert = true; });
    }

    if (initThree()) {
      updateCards();
      renderer.render(scene, camera);
      lastFrame = 0;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      requestRender();
    } else {
      overlay.classList.add('is-fallback', 'is-ready');
      buildFallback();
      requestAnimationFrame(() => {
        fallback.scrollLeft = 0;
        setActivePage(0);
      });
    }

    void overlay.offsetWidth;
    requestAnimationFrame(() => { if (isOpen) overlay.classList.add('is-open'); });
    setTimeout(() => { if (isOpen) closeButton.focus({ preventScroll: true }); }, 120);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    dragging = false;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    cancelAnimationFrame(fallbackScrollFrame);
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('catalogue-ribbon-open');
    if (previousFocus) setOrigin(previousFocus);
    backgroundState.forEach(({ element, inert }) => { element.inert = inert; });
    backgroundState = [];
    previousFocus?.focus({ preventScroll:true });
    closeTimer = setTimeout(() => {
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
  const step = direction => {
    if (overlay.classList.contains('is-fallback')) {
      const index = mod(frontPageIndex + direction, activeCatalogue.pages);
      const image = fallback.querySelectorAll('img')[index];
      if (image) {
        fallback.scrollTo({ left:image.offsetLeft - (fallback.clientWidth - image.offsetWidth) / 2, behavior:reduced ? 'instant' : 'smooth' });
        setActivePage(index);
      }
    } else {
      targetPosition = Math.round(targetPosition) + direction;
      snapAt = 0;
      requestRender();
    }
  };
  previousButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));
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
    snapAt = performance.now() + CONFIG.snapDelay;
    requestRender();
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
    if (!isOpen || event.button !== 0) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartTarget = targetPosition;
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragLastTime = event.timeStamp;
    dragVelocity = 0;
    snapAt = 0;
    canvas.setPointerCapture?.(event.pointerId);
    overlay.classList.add('is-dragging');
    requestRender();
  });
  canvas.addEventListener('pointermove', event => {
    if (isOpen && event.pointerType === 'mouse' && innerWidth >= 760) {
      pointerX = (event.clientX / innerWidth - .5) * 2;
      pointerY = (event.clientY / innerHeight - .5) * 2;
      requestRender();
    }
    if (!dragging) return;
    const elapsed = Math.max(8, event.timeStamp - dragLastTime);
    const delta = (dragLastY - event.clientY) + (dragLastX - event.clientX) * .55;
    const totalDelta = (dragStartY - event.clientY) + (dragStartX - event.clientX) * .55;
    const instantVelocity = delta * CONFIG.dragFactor / elapsed;
    dragVelocity += (instantVelocity - dragVelocity) * .32;
    targetPosition = dragStartTarget + totalDelta * CONFIG.dragFactor;
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragLastTime = event.timeStamp;
    requestRender();
  });
  canvas.addEventListener('pointerleave', () => { pointerX = pointerY = 0; requestRender(); });
  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    overlay.classList.remove('is-dragging');
    if (performance.now() - dragLastTime > 100 || event.type === 'pointercancel') dragVelocity = 0;
    targetPosition += clamp(dragVelocity * CONFIG.dragMomentum, -1.65, 1.65);
    dragVelocity = 0;
    snapAt = performance.now() + CONFIG.snapDelay;
    canvas.releasePointerCapture?.(event.pointerId);
    requestRender();
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
      step(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Tab') {
      const focusables = [closeButton, previousButton, nextButton, pageLink];
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
  window.visualViewport?.addEventListener('resize', resize, { passive:true });
  window.visualViewport?.addEventListener('scroll', syncViewport, { passive:true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    if (!document.hidden) requestRender();
  });
})();
