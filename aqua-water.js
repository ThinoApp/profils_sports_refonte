(() => {
  'use strict';

  class AquaWaterSurface {
    constructor({ portal, canvas, reduced = false } = {}) {
      this.portal = portal;
      this.canvas = canvas;
      this.reduced = Boolean(reduced);
      this.available = Boolean(portal && canvas && window.THREE && !this.reduced);
      this.ready = false;
      this.initializing = null;
      this.active = false;
      this.frame = 0;
      this.lastFrame = 0;
      this.lastRenderedAt = 0;
      this.lastRenderedAt = 0;
      this.clock = 0;
      this.currentProduct = 'court';
      this.nextProduct = 'court';
      this.transitionStarted = 0;
      this.transitionDuration = 760;
      this.entranceStarted = 0;
      this.entranceDuration = 900;
      this.lastPointerMove = 0;
      this.pointerEnergy = 0;
      this.pointerEnergyTarget = 0;
      this.pointer = { x:.62, y:.48 };
      this.pointerTarget = { x:.62, y:.48 };
      this.origin = { x:.5, y:.06 };
      this.closingUntil = 0;
      this.textures = {};
      this.textureSizes = {};
      this.onVisibility = () => {
        if (document.hidden) this.pause();
        else if (this.active || performance.now() < this.closingUntil) this.resume();
      };

      if (!this.available) {
        if (this.portal) this.portal.dataset.waterMode = this.reduced ? 'reduced' : 'fallback';
        return;
      }

      document.addEventListener('visibilitychange', this.onVisibility);
      this.portal.dataset.waterMode = 'loading';
      this.portal.dataset.waterActive = 'false';
    }

    warm() {
      if (!this.available) return Promise.resolve(false);
      if (this.ready) return Promise.resolve(true);
      if (this.initializing) return this.initializing;
      this.initializing = this.init();
      return this.initializing;
    }

    async init() {
      try {
        const THREE = window.THREE;
        this.renderer = new THREE.WebGLRenderer({
          canvas:this.canvas,
          alpha:true,
          antialias:false,
          powerPreference:'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1.1 : 1.45));
        this.renderer.setClearColor(0x071a29, 1);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.geometry = new THREE.PlaneGeometry(2, 2);

        const loader = new THREE.TextureLoader();
        const loadTexture = src => new Promise((resolve, reject) => {
          loader.load(src, texture => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
            resolve(texture);
          }, undefined, reject);
        });

        const [court, bike] = await Promise.all([
          loadTexture('assets/aqua-play/water-court.jpg'),
          loadTexture('assets/aqua-play/water-bike.jpg')
        ]);

        this.textures.court = court;
        this.textures.bike = bike;
        this.textureSizes.court = new THREE.Vector2(court.image?.naturalWidth || court.image?.width || 1600, court.image?.naturalHeight || court.image?.height || 900);
        this.textureSizes.bike = new THREE.Vector2(bike.image?.naturalWidth || bike.image?.width || 1600, bike.image?.naturalHeight || bike.image?.height || 900);

        this.uniforms = {
          uTexA:{ value:court },
          uTexB:{ value:bike },
          uTexSizeA:{ value:this.textureSizes.court.clone() },
          uTexSizeB:{ value:this.textureSizes.bike.clone() },
          uResolution:{ value:new THREE.Vector2(1, 1) },
          uTime:{ value:0 },
          uMix:{ value:0 },
          uEntrance:{ value:1 },
          uEnergy:{ value:0 },
          uActivity:{ value:.08 },
          uPointer:{ value:new THREE.Vector2(this.pointer.x, this.pointer.y) },
          uOrigin:{ value:new THREE.Vector2(this.origin.x, this.origin.y) }
        };

        this.material = new THREE.ShaderMaterial({
          uniforms:this.uniforms,
          transparent:false,
          depthTest:false,
          depthWrite:false,
          vertexShader:`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `,
          fragmentShader:`
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTexA;
            uniform sampler2D uTexB;
            uniform vec2 uTexSizeA;
            uniform vec2 uTexSizeB;
            uniform vec2 uResolution;
            uniform vec2 uPointer;
            uniform vec2 uOrigin;
            uniform float uTime;
            uniform float uMix;
            uniform float uEntrance;
            uniform float uEnergy;
            uniform float uActivity;

            vec2 coverUv(vec2 uv, vec2 imageSize) {
              float viewportAspect = uResolution.x / max(uResolution.y, 1.0);
              float imageAspect = imageSize.x / max(imageSize.y, 1.0);
              vec2 result = uv;
              if (viewportAspect > imageAspect) {
                result.y = (uv.y - .5) * (imageAspect / viewportAspect) + .5;
              } else {
                result.x = (uv.x - .5) * (viewportAspect / imageAspect) + .5;
              }
              return result;
            }

            float gaussian(float value, float width) {
              float scaled = value / max(width, .0001);
              return exp(-scaled * scaled);
            }

            void main() {
              vec2 uv = vUv;
              float aspect = uResolution.x / max(uResolution.y, 1.0);

              vec2 entranceMetric = (uv - uOrigin) * vec2(aspect, 1.0);
              float entranceDistance = length(entranceMetric);
              float entranceRadius = mix(.01, 1.48, smoothstep(0.0, 1.0, uEntrance));
              float entranceRing = gaussian(entranceDistance - entranceRadius, mix(.035, .075, uEntrance));
              vec2 entranceDirection = entranceDistance > .0001
                ? entranceMetric / entranceDistance / vec2(aspect, 1.0)
                : vec2(0.0);
              float entranceStrength = (1.0 - smoothstep(.30, 1.0, uEntrance)) * .042;
              uv += entranceDirection * entranceRing * entranceStrength;
              uv += entranceDirection * sin(entranceDistance * 46.0 - uEntrance * 18.0) * entranceRing * entranceStrength * .28;

              vec2 pointerMetric = (uv - uPointer) * vec2(aspect, 1.0);
              float pointerDistance = length(pointerMetric);
              float pointerFalloff = exp(-pointerDistance * pointerDistance * 44.0);
              vec2 pointerDirection = pointerDistance > .0001
                ? pointerMetric / pointerDistance / vec2(aspect, 1.0)
                : vec2(0.0);
              float pointerWave = sin(pointerDistance * 58.0 - uTime * 5.4) * pointerFalloff * uEnergy;
              uv += pointerDirection * pointerWave * .0065;
              uv += vec2(
                sin((uv.y * 8.0 + uTime * .34) * 3.14159),
                cos((uv.x * 7.0 - uTime * .29) * 3.14159)
              ) * (.00045 + .0009 * uActivity);

              float frontier = uMix * 1.36 - .18;
              float liquidLine = uv.x
                + sin(uv.y * 13.0 + uTime * 1.35) * .034
                + sin(uv.y * 31.0 - uTime * .72) * .011;
              float liquidMask = 1.0 - smoothstep(frontier - .075, frontier + .075, liquidLine);
              float transitionEdge = gaussian(liquidLine - frontier, .075);
              vec2 transitionWarp = vec2(
                sin(uv.y * 22.0 + uTime * 2.0) * .014,
                cos(uv.y * 15.0 - uTime * 1.2) * .006
              ) * transitionEdge;

              vec2 uvA = coverUv(clamp(uv + transitionWarp, 0.0, 1.0), uTexSizeA);
              vec2 uvB = coverUv(clamp(uv - transitionWarp * .72, 0.0, 1.0), uTexSizeB);
              vec4 colorA = texture2D(uTexA, uvA);
              vec4 colorB = texture2D(uTexB, uvB);
              vec3 color = mix(colorA.rgb, colorB.rgb, liquidMask);

              vec2 c = uv * vec2(7.2, 5.2);
              float causticA = sin(c.x * 2.2 + sin(c.y * 1.4 + uTime * .46));
              float causticB = sin(c.y * 2.55 - cos(c.x * 1.3 - uTime * .34));
              float caustic = pow(clamp((causticA + causticB) * .24 + .52, 0.0, 1.0), 6.0);
              float causticStrength = mix(.016, .065, uActivity);
              color += vec3(.20, .56, .68) * caustic * causticStrength;

              float entranceGlow = entranceRing * (1.0 - smoothstep(.48, 1.0, uEntrance));
              color += vec3(.40, .85, .96) * entranceGlow * .16;
              color += vec3(.18, .58, .70) * transitionEdge * .055;

              gl_FragColor = vec4(color, 1.0);
            }
          `
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.resize();

        this.ready = true;
        this.portal.dataset.waterMode = 'webgl';
        this.portal.dataset.waterReady = 'true';
        this.portal.classList.add('is-water-ready');
        return true;
      } catch (error) {
        this.available = false;
        this.portal.dataset.waterMode = 'fallback';
        this.portal.classList.remove('is-water-ready');
        return false;
      }
    }

    setOrigin({ x, y } = {}) {
      if (Number.isFinite(x)) this.origin.x = Math.max(0, Math.min(1, x));
      if (Number.isFinite(y)) this.origin.y = 1 - Math.max(0, Math.min(1, y));
      if (this.uniforms) this.uniforms.uOrigin.value.set(this.origin.x, this.origin.y);
    }

    open({ origin, product = 'court' } = {}) {
      this.currentProduct = product;
      this.nextProduct = product;
      this.setOrigin(origin || this.origin);
      this.entranceStarted = 0;
      this.pointerEnergy = 0;
      this.pointerEnergyTarget = 0;
      this.lastPointerMove = 0;
      this.portal.dataset.waterEntrance = this.reduced ? 'static' : 'running';

      this.warm().then(ready => {
        if (!ready) return;
        this.setProductInstant(this.currentProduct);
        this.entranceStarted = performance.now();
        this.active = true;
        this.portal.dataset.waterActive = 'true';
        this.closingUntil = 0;
        this.resume();
      });
    }

    close(delay = 560) {
      this.active = false;
      this.portal.dataset.waterActive = 'false';
      this.closingUntil = performance.now() + delay;
      setTimeout(() => {
        if (performance.now() >= this.closingUntil && !this.active) {
          this.pause();
          this.portal.dataset.waterEntrance = 'idle';
          this.portal.dataset.waterTransition = 'idle';
        }
      }, delay + 40);
    }

    setProductInstant(key) {
      if (!this.ready || !this.textures[key]) return;
      this.currentProduct = key;
      this.nextProduct = key;
      this.uniforms.uTexA.value = this.textures[key];
      this.uniforms.uTexB.value = this.textures[key === 'court' ? 'bike' : 'court'];
      this.uniforms.uTexSizeA.value.copy(this.textureSizes[key]);
      this.uniforms.uTexSizeB.value.copy(this.textureSizes[key === 'court' ? 'bike' : 'court']);
      this.uniforms.uMix.value = 0;
      this.portal.dataset.waterTransition = 'idle';
    }

    transitionTo(key) {
      if (!key || key === this.currentProduct) return;
      if (!this.ready || !this.textures[key]) {
        this.currentProduct = key;
        this.nextProduct = key;
        this.warm().then(ready => {
          if (ready && this.currentProduct === key) this.setProductInstant(key);
        });
        return;
      }
      this.nextProduct = key;
      this.uniforms.uTexA.value = this.textures[this.currentProduct];
      this.uniforms.uTexB.value = this.textures[key];
      this.uniforms.uTexSizeA.value.copy(this.textureSizes[this.currentProduct]);
      this.uniforms.uTexSizeB.value.copy(this.textureSizes[key]);
      this.uniforms.uMix.value = 0;
      this.transitionStarted = performance.now();
      this.portal.dataset.waterTransition = `${this.currentProduct}-to-${key}`;
      this.resume();
    }

    pointerMove(event) {
      if (!this.ready || !this.active || event.pointerType === 'touch') return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const now = performance.now();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const yTop = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const y = 1 - yTop;
      const dx = x - this.pointerTarget.x;
      const dy = y - this.pointerTarget.y;
      const dt = Math.max(16, now - (this.lastPointerMove || now - 16));
      const speed = Math.sqrt(dx * dx + dy * dy) / dt * 1000;
      this.pointerTarget.x = x;
      this.pointerTarget.y = y;
      this.pointerEnergyTarget = Math.min(1, .20 + speed * .085);
      this.lastPointerMove = now;
      this.portal.dataset.waterInteraction = 'active';
      this.resume();
    }

    resize() {
      if (!this.ready || !this.renderer || !this.uniforms) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || innerWidth));
      const height = Math.max(1, Math.round(rect.height || innerHeight));
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 720 ? 1.1 : 1.45));
      this.renderer.setSize(width, height, false);
      this.uniforms.uResolution.value.set(width, height);
    }

    pause() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lastFrame = 0;
    }

    resume() {
      if (!this.ready || this.frame || document.hidden) return;
      this.frame = requestAnimationFrame(() => this.render());
    }

    render() {
      this.frame = 0;
      if (!this.ready || document.hidden) return;
      const now = performance.now();
      if (!this.active && now >= this.closingUntil) return;

      const entranceElapsedForThrottle = this.entranceStarted ? now - this.entranceStarted : this.entranceDuration;
      const sincePointer = this.lastPointerMove ? now - this.lastPointerMove : 9999;
      const canThrottle = sincePointer > 2400
        && entranceElapsedForThrottle >= this.entranceDuration
        && !this.transitionStarted;
      if (canThrottle && this.lastRenderedAt && now - this.lastRenderedAt < 84) {
        this.frame = requestAnimationFrame(() => this.render());
        return;
      }
      this.lastRenderedAt = now;

      const dt = Math.min(96, this.lastFrame ? now - this.lastFrame : 16.67);
      this.lastFrame = now;
      const activityTarget = sincePointer < 260 ? 1 : sincePointer < 2300 ? .34 : .06;
      const energyTarget = sincePointer < 900 ? this.pointerEnergyTarget : 0;
      const energyEase = 1 - Math.exp(-dt / 150);
      this.pointerEnergy += (energyTarget - this.pointerEnergy) * energyEase;
      this.pointerEnergyTarget *= Math.pow(.994, dt);

      const pointerEase = 1 - Math.exp(-dt / 95);
      this.pointer.x += (this.pointerTarget.x - this.pointer.x) * pointerEase;
      this.pointer.y += (this.pointerTarget.y - this.pointer.y) * pointerEase;

      const activity = this._activity ?? .06;
      this._activity = activity + (activityTarget - activity) * (1 - Math.exp(-dt / 520));
      this.clock += dt * (.10 + this._activity * .90) / 1000;

      const entranceElapsed = this.entranceStarted ? now - this.entranceStarted : this.entranceDuration;
      const entrance = Math.max(0, Math.min(1, entranceElapsed / this.entranceDuration));
      const entranceEase = 1 - Math.pow(1 - entrance, 3);
      if (entrance >= 1 && this.portal.dataset.waterEntrance === 'running') this.portal.dataset.waterEntrance = 'idle';

      if (this.transitionStarted) {
        const progress = Math.max(0, Math.min(1, (now - this.transitionStarted) / this.transitionDuration));
        const eased = progress * progress * (3 - 2 * progress);
        this.uniforms.uMix.value = eased;
        if (progress >= 1) {
          this.currentProduct = this.nextProduct;
          this.transitionStarted = 0;
          this.setProductInstant(this.currentProduct);
        }
      }

      this.uniforms.uTime.value = this.clock;
      this.uniforms.uEntrance.value = entranceEase;
      this.uniforms.uEnergy.value = this.pointerEnergy;
      this.uniforms.uActivity.value = this._activity;
      this.uniforms.uPointer.value.set(this.pointer.x, this.pointer.y);
      this.uniforms.uOrigin.value.set(this.origin.x, this.origin.y);

      this.renderer.render(this.scene, this.camera);

      if (sincePointer > 2400) this.portal.dataset.waterInteraction = 'idle';

      this.frame = requestAnimationFrame(() => this.render());
    }

    destroy() {
      this.pause();
      document.removeEventListener('visibilitychange', this.onVisibility);
      Object.values(this.textures).forEach(texture => texture?.dispose?.());
      this.geometry?.dispose?.();
      this.material?.dispose?.();
      this.renderer?.dispose?.();
    }
  }

  window.AquaWaterSurface = AquaWaterSurface;
})();
