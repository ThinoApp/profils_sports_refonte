(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const catalogue = document.querySelector('#catalogues');
  const list = catalogue?.querySelector('.catalogue-list');
  const rows = catalogue ? [...catalogue.querySelectorAll('[data-catalogue]')] : [];

  if (!catalogue || !list || !rows.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(any-pointer:fine)').matches;
  const desktop = matchMedia('(min-width:900px)').matches;
  if (reduced || !finePointer || !desktop) return;

  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (_) {
      return false;
    }
  })();
  if (!supportsWebGL) return;

  const EFFECT_CONFIG = Object.freeze({
    transitionDuration: 0.8,
    cursorFollow: 0.14,
    previewWidth: 380,
    previewHeight: 240,
    cursorOffsetX: 34,
    cursorOffsetY: 22,
    viewportPadding: 22,
    headerClearance: 96,
    particleCount: 30000,
    particleCountLow: 22000,
    particleSize: 1.4,
    scatterDistance: 84,
    noiseStrength: 0.25,
    outgoingStart: 0.0,
    outgoingEnd: 0.62,
    incomingStart: 0.35,
    incomingEnd: 1.0,
    sharpImageFadeOutStart: 0.03,
    sharpImageFadeOutEnd: 0.30,
    sharpImageFadeInStart: 0.58,
    sharpImageFadeInEnd: 0.92,
    canvasFadeMs: 150,
    maxPixelRatio: 1.5
  });

  const catalogueImages = {
    fitness: 'assets/catalogue-preview/fitness.jpg',
    padel: 'assets/catalogue-preview/padel.jpg',
    csp: 'assets/catalogue-preview/csp.jpg',
    canopy: 'assets/catalogue-preview/canopy.jpg'
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  };

  const loadStyles = () => {
    if (document.querySelector('link[data-catalogue-particle-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'catalogue-particle-preview.css';
    link.dataset.catalogueParticleStyles = '';
    document.head.appendChild(link);
  };

  const loadThree = () => {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-three-catalogue-preview]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.THREE), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/three.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.threeCataloguePreview = '';
      script.addEventListener('load', () => window.THREE ? resolve(window.THREE) : reject(new Error('THREE unavailable')), { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  };

  const calibrateTextureCover = texture => {
    const image = texture.image;
    if (!image?.width || !image?.height) return;
    const imageAspect = image.width / image.height;
    const frameAspect = EFFECT_CONFIG.previewWidth / EFFECT_CONFIG.previewHeight;
    texture.wrapS = texture.wrapT = window.THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    if (imageAspect > frameAspect) {
      const repeatX = frameAspect / imageAspect;
      texture.repeat.x = repeatX;
      texture.offset.x = (1 - repeatX) * 0.5;
    } else {
      const repeatY = imageAspect / frameAspect;
      texture.repeat.y = repeatY;
      texture.offset.y = (1 - repeatY) * 0.5;
    }
    texture.userData.previewUvScale = { x: texture.repeat.x, y: texture.repeat.y };
    texture.userData.previewUvOffset = { x: texture.offset.x, y: texture.offset.y };
    texture.needsUpdate = true;
  };

  const buildParticleGeometry = THREE => {
    const lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 4) || innerWidth < 1280;
    const targetCount = lowPower ? EFFECT_CONFIG.particleCountLow : EFFECT_CONFIG.particleCount;
    const aspect = EFFECT_CONFIG.previewWidth / EFFECT_CONFIG.previewHeight;
    const rowsCount = Math.max(1, Math.round(Math.sqrt(targetCount / aspect)));
    const colsCount = Math.max(1, Math.round(rowsCount * aspect));
    const count = rowsCount * colsCount;

    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const randoms = new Float32Array(count);
    const directions = new Float32Array(count * 2);
    const amplitudes = new Float32Array(count);
    const delays = new Float32Array(count);

    let i = 0;
    for (let y = 0; y < rowsCount; y += 1) {
      for (let x = 0; x < colsCount; x += 1) {
        const index3 = i * 3;
        const index2 = i * 2;
        const u = colsCount === 1 ? 0.5 : x / (colsCount - 1);
        const v = rowsCount === 1 ? 0.5 : y / (rowsCount - 1);
        const seed = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const directionalBias = (u - 0.5) * 0.45;

        positions[index3] = (u - 0.5) * EFFECT_CONFIG.previewWidth;
        positions[index3 + 1] = (v - 0.5) * EFFECT_CONFIG.previewHeight;
        positions[index3 + 2] = 0;
        uvs[index2] = u;
        uvs[index2 + 1] = v;
        randoms[i] = seed;
        directions[index2] = Math.cos(angle) + directionalBias;
        directions[index2 + 1] = Math.sin(angle) + (Math.random() - 0.5) * 0.28;
        amplitudes[i] = 0.48 + Math.pow(Math.random(), 0.62) * 0.92;
        delays[i] = Math.random();
        i += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 2));
    geometry.setAttribute('aAmplitude', new THREE.BufferAttribute(amplitudes, 1));
    geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
    return geometry;
  };

  const vertexShader = `
    attribute vec2 aUv;
    attribute float aRandom;
    attribute vec2 aDirection;
    attribute float aAmplitude;
    attribute float aDelay;

    uniform float uProgress;
    uniform float uScatter;
    uniform float uNoiseStrength;
    uniform float uPointSize;
    uniform float uPixelRatio;
    uniform float uIncoming;

    varying vec2 vUv;
    varying float vAlpha;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float easeOutQuad(float t) {
      return 1.0 - (1.0 - t) * (1.0 - t);
    }

    float easeInOutCubic(float t) {
      return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
    }

    void main() {
      vUv = aUv;
      float delayed = clamp((uProgress - aDelay * 0.17) / 0.83, 0.0, 1.0);
      float randomNoiseX = hash(aUv * 17.31 + aRandom) * 2.0 - 1.0;
      float randomNoiseY = hash(aUv.yx * 23.73 + aRandom * 3.17) * 2.0 - 1.0;
      vec2 noisyDirection = normalize(aDirection + vec2(randomNoiseX, randomNoiseY) * uNoiseStrength);

      float outgoingScatter = easeOutQuad(delayed);
      float incomingRebuild = easeInOutCubic(delayed);
      float scatterAmount = mix(outgoingScatter, 1.0 - incomingRebuild, uIncoming);

      vec3 pos = position;
      pos.xy += noisyDirection * uScatter * aAmplitude * scatterAmount;
      pos.xy += vec2(randomNoiseY, randomNoiseX) * uScatter * 0.12 * scatterAmount;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = max(1.0, uPointSize * uPixelRatio * (0.82 + aRandom * 0.34));
      vAlpha = 1.0;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    uniform float uOpacity;
    varying vec2 vUv;
    varying float vAlpha;

    void main() {
      vec2 sampleUv = vUv * uUvScale + uUvOffset;
      vec4 color = texture2D(uTexture, sampleUv);
      if (color.a < 0.02) discard;
      gl_FragColor = vec4(color.rgb, color.a * uOpacity * vAlpha);
    }
  `;

  const init = async () => {
    loadStyles();
    let THREE;
    try {
      THREE = await loadThree();
    } catch (error) {
      console.warn('[CatalogueParticlePreview] Three.js could not load; keeping static preview.', error);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const entries = Object.entries(catalogueImages);
    const settled = await Promise.allSettled(entries.map(([key, url]) => new Promise((resolve, reject) => {
      loader.load(
        url,
        texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          calibrateTextureCover(texture);
          resolve([key, texture]);
        },
        undefined,
        reject
      );
    })));

    if (settled.some(item => item.status !== 'fulfilled')) {
      console.warn('[CatalogueParticlePreview] A catalogue texture failed to preload; keeping static preview.');
      settled.forEach(item => {
        if (item.status === 'fulfilled') item.value[1].dispose();
      });
      return;
    }

    const textures = Object.fromEntries(settled.map(item => item.value));
    const canvas = document.createElement('canvas');
    canvas.className = 'catalogue-particle-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    body.appendChild(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        premultipliedAlpha: true
      });
    } catch (error) {
      canvas.remove();
      Object.values(textures).forEach(texture => texture.dispose());
      console.warn('[CatalogueParticlePreview] WebGL renderer unavailable; keeping static preview.', error);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, EFFECT_CONFIG.maxPixelRatio));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-innerWidth / 2, innerWidth / 2, innerHeight / 2, -innerHeight / 2, -100, 100);
    camera.position.z = 10;

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);

    const planeGeometry = new THREE.PlaneGeometry(EFFECT_CONFIG.previewWidth, EFFECT_CONFIG.previewHeight);
    const planeCurrentMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthTest: false, depthWrite: false });
    const planeNextMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const planeCurrent = new THREE.Mesh(planeGeometry, planeCurrentMaterial);
    const planeNext = new THREE.Mesh(planeGeometry, planeNextMaterial);
    planeCurrent.renderOrder = 1;
    planeNext.renderOrder = 2;
    previewGroup.add(planeCurrent, planeNext);

    const particleGeometry = buildParticleGeometry(THREE);
    const commonUniforms = texture => ({
      uTexture: { value: texture },
      uUvScale: { value: new THREE.Vector2(texture.userData.previewUvScale?.x || 1, texture.userData.previewUvScale?.y || 1) },
      uUvOffset: { value: new THREE.Vector2(texture.userData.previewUvOffset?.x || 0, texture.userData.previewUvOffset?.y || 0) },
      uProgress: { value: 0 },
      uScatter: { value: EFFECT_CONFIG.scatterDistance },
      uNoiseStrength: { value: EFFECT_CONFIG.noiseStrength },
      uPointSize: { value: EFFECT_CONFIG.particleSize },
      uPixelRatio: { value: Math.min(devicePixelRatio || 1, EFFECT_CONFIG.maxPixelRatio) },
      uIncoming: { value: 0 },
      uOpacity: { value: 0 }
    });

    const outgoingUniforms = commonUniforms(textures.fitness);
    const incomingUniforms = commonUniforms(textures.fitness);
    incomingUniforms.uIncoming.value = 1;

    const createParticleMaterial = uniforms => new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const outgoingMaterial = createParticleMaterial(outgoingUniforms);
    const incomingMaterial = createParticleMaterial(incomingUniforms);
    const outgoingPoints = new THREE.Points(particleGeometry, outgoingMaterial);
    const incomingPoints = new THREE.Points(particleGeometry, incomingMaterial);
    outgoingPoints.renderOrder = 3;
    incomingPoints.renderOrder = 4;
    previewGroup.add(outgoingPoints, incomingPoints);

    let currentKey = null;
    let targetKey = null;
    let transitionFromKey = null;
    let transitionToKey = null;
    let transitionStart = 0;
    let transitioning = false;
    let insideList = false;
    let disposed = false;

    let targetX = innerWidth * 0.5;
    let targetY = innerHeight * 0.5;
    let currentX = targetX;
    let currentY = targetY;

    const setCanvasVisible = visible => {
      insideList = visible;
      canvas.classList.toggle('is-visible', visible);
    };

    const setTargetFromPointer = event => {
      const width = EFFECT_CONFIG.previewWidth;
      const height = EFFECT_CONFIG.previewHeight;
      const minCenterX = EFFECT_CONFIG.viewportPadding + width * 0.5;
      const maxCenterX = innerWidth - EFFECT_CONFIG.viewportPadding - width * 0.5;
      const minCenterY = EFFECT_CONFIG.headerClearance + height * 0.5;
      const maxCenterY = innerHeight - EFFECT_CONFIG.viewportPadding - height * 0.5;

      let centerX = event.clientX + EFFECT_CONFIG.cursorOffsetX + width * 0.5;
      let centerY = event.clientY + EFFECT_CONFIG.cursorOffsetY + height * 0.5;

      if (centerX > maxCenterX) centerX = event.clientX - EFFECT_CONFIG.cursorOffsetX - width * 0.5;
      if (centerY > maxCenterY) centerY = event.clientY - EFFECT_CONFIG.cursorOffsetY - height * 0.5;

      targetX = clamp(centerX, minCenterX, maxCenterX);
      targetY = clamp(centerY, minCenterY, maxCenterY);
    };

    const showImmediate = key => {
      const texture = textures[key];
      if (!texture) return;
      currentKey = key;
      targetKey = key;
      transitioning = false;
      planeCurrentMaterial.map = texture;
      planeCurrentMaterial.opacity = 1;
      planeCurrentMaterial.needsUpdate = true;
      planeNextMaterial.opacity = 0;
      outgoingUniforms.uOpacity.value = 0;
      incomingUniforms.uOpacity.value = 0;
    };

    const startTransition = key => {
      if (!textures[key] || key === targetKey) return;
      if (!currentKey) {
        showImmediate(key);
        return;
      }

      if (transitioning) {
        const elapsed = (performance.now() - transitionStart) / 1000;
        const progress = clamp(elapsed / EFFECT_CONFIG.transitionDuration, 0, 1);
        currentKey = progress >= 0.46 ? transitionToKey : transitionFromKey;
      }

      transitionFromKey = currentKey;
      transitionToKey = key;
      targetKey = key;
      transitionStart = performance.now();
      transitioning = true;

      const fromTexture = textures[transitionFromKey];
      const toTexture = textures[transitionToKey];
      planeCurrentMaterial.map = fromTexture;
      planeCurrentMaterial.opacity = 1;
      planeCurrentMaterial.needsUpdate = true;
      planeNextMaterial.map = toTexture;
      planeNextMaterial.opacity = 0;
      planeNextMaterial.needsUpdate = true;
      outgoingUniforms.uTexture.value = fromTexture;
      outgoingUniforms.uUvScale.value.set(fromTexture.userData.previewUvScale?.x || 1, fromTexture.userData.previewUvScale?.y || 1);
      outgoingUniforms.uUvOffset.value.set(fromTexture.userData.previewUvOffset?.x || 0, fromTexture.userData.previewUvOffset?.y || 0);
      incomingUniforms.uTexture.value = toTexture;
      incomingUniforms.uUvScale.value.set(toTexture.userData.previewUvScale?.x || 1, toTexture.userData.previewUvScale?.y || 1);
      incomingUniforms.uUvOffset.value.set(toTexture.userData.previewUvOffset?.x || 0, toTexture.userData.previewUvOffset?.y || 0);
      outgoingUniforms.uProgress.value = 0;
      incomingUniforms.uProgress.value = 0;
      outgoingUniforms.uOpacity.value = 0;
      incomingUniforms.uOpacity.value = 0;
    };

    const finishTransition = () => {
      currentKey = transitionToKey;
      targetKey = currentKey;
      transitioning = false;
      planeCurrentMaterial.map = textures[currentKey];
      planeCurrentMaterial.opacity = 1;
      planeCurrentMaterial.needsUpdate = true;
      planeNextMaterial.opacity = 0;
      outgoingUniforms.uOpacity.value = 0;
      incomingUniforms.uOpacity.value = 0;
    };

    rows.forEach(row => {
      row.addEventListener('mouseenter', event => {
        setCanvasVisible(true);
        setTargetFromPointer(event);
        startTransition(row.dataset.catalogue);
      });
      row.addEventListener('pointermove', setTargetFromPointer, { passive: true });
      row.addEventListener('focus', () => {
        // Keyboard users keep the existing static preview; the floating preview
        // is deliberately pointer-only because its position is cursor-driven.
      });
    });

    list.addEventListener('mouseenter', event => {
      setCanvasVisible(true);
      setTargetFromPointer(event);
    });
    list.addEventListener('pointermove', setTargetFromPointer, { passive: true });
    list.addEventListener('mouseleave', () => setCanvasVisible(false));

    const resize = () => {
      if (disposed) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, EFFECT_CONFIG.maxPixelRatio));
      renderer.setSize(innerWidth, innerHeight, false);
      camera.left = -innerWidth / 2;
      camera.right = innerWidth / 2;
      camera.top = innerHeight / 2;
      camera.bottom = -innerHeight / 2;
      camera.updateProjectionMatrix();
      outgoingUniforms.uPixelRatio.value = Math.min(devicePixelRatio || 1, EFFECT_CONFIG.maxPixelRatio);
      incomingUniforms.uPixelRatio.value = Math.min(devicePixelRatio || 1, EFFECT_CONFIG.maxPixelRatio);
    };

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      removeEventListener('resize', resize);
      planeGeometry.dispose();
      particleGeometry.dispose();
      planeCurrentMaterial.dispose();
      planeNextMaterial.dispose();
      outgoingMaterial.dispose();
      incomingMaterial.dispose();
      Object.values(textures).forEach(texture => texture.dispose());
      renderer.dispose();
      canvas.remove();
      body.classList.remove('catalogue-particle-ready');
    };

    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      cleanup();
    }, { once: true });

    addEventListener('resize', resize, { passive: true });
    resize();

    const firstKey = rows[0]?.dataset.catalogue;
    if (firstKey) showImmediate(firstKey);

    body.classList.add('catalogue-particle-ready');
    root.style.setProperty('--catalogue-particle-duration', `${EFFECT_CONFIG.canvasFadeMs}ms`);

    const tick = now => {
      if (disposed) return;

      currentX += (targetX - currentX) * EFFECT_CONFIG.cursorFollow;
      currentY += (targetY - currentY) * EFFECT_CONFIG.cursorFollow;
      previewGroup.position.x = currentX - innerWidth * 0.5;
      previewGroup.position.y = innerHeight * 0.5 - currentY;

      if (transitioning) {
        const p = clamp(((now - transitionStart) / 1000) / EFFECT_CONFIG.transitionDuration, 0, 1);
        outgoingUniforms.uProgress.value = p;
        incomingUniforms.uProgress.value = p;

        planeCurrentMaterial.opacity = 1 - smoothstep(
          EFFECT_CONFIG.sharpImageFadeOutStart,
          EFFECT_CONFIG.sharpImageFadeOutEnd,
          p
        );
        outgoingUniforms.uOpacity.value = smoothstep(0.04, 0.18, p) * (1 - smoothstep(EFFECT_CONFIG.outgoingEnd, 0.96, p));

        const incomingPresence = smoothstep(EFFECT_CONFIG.incomingStart, 0.53, p);
        incomingUniforms.uOpacity.value = incomingPresence * (1 - smoothstep(0.74, 0.98, p));
        planeNextMaterial.opacity = smoothstep(
          EFFECT_CONFIG.sharpImageFadeInStart,
          EFFECT_CONFIG.sharpImageFadeInEnd,
          p
        );

        if (p >= 1) finishTransition();
      }

      if (insideList || transitioning) renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  init().catch(error => {
    console.warn('[CatalogueParticlePreview] Initialization failed; keeping static preview.', error);
  });
})();
