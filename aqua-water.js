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
      this.clock = 0;
      this.currentProduct = 'court';
      this.nextProduct = 'court';
      this.transitionStarted = 0;
      this.transitionDuration = 760;
      this.entranceStarted = 0;
      this.entranceLaunchAt = 0;
      this.entranceDelay = 220;
      this.entranceDuration = 1250;
      this.lastPointerMove = 0;
      this.pointerEnergy = 0;
      this.pointerEnergyTarget = 0;
      this.pointer = { x:.62, y:.48 };
      this.pointerTarget = { x:.62, y:.48 };
      this.origin = { x:.5, y:.06 };
      this.closingUntil = 0;
      this.rippleTimer = 0;
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
          premultipliedAlpha:true,
          powerPreference:'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1 : 1.25));
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.geometry = new THREE.PlaneGeometry(2, 2);

        this.uniforms = {
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
          transparent:true,
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
            uniform vec2 uResolution;
            uniform vec2 uPointer;
            uniform vec2 uOrigin;
            uniform float uTime;
            uniform float uMix;
            uniform float uEntrance;
            uniform float uEnergy;
            uniform float uActivity;

            float gaussian(float value, float width) {
              float scaled = value / max(width, .0001);
              return exp(-scaled * scaled);
            }

            void main() {
              vec2 uv = vUv;
              float aspect = uResolution.x / max(uResolution.y, 1.0);

              vec2 entranceMetric = (uv - uOrigin) * vec2(aspect, 1.0);
              float entranceDistance = length(entranceMetric);
              float entranceRadius = mix(.01, 1.62, uEntrance);
              float entranceLead = gaussian(entranceDistance - (entranceRadius + .055), mix(.032, .052, uEntrance));
              float entranceRing = gaussian(entranceDistance - entranceRadius, mix(.046, .078, uEntrance));
              float entranceWake = gaussian(entranceDistance - max(.0, entranceRadius - .12), mix(.065, .10, uEntrance));
              float entranceLife = 1.0 - smoothstep(.68, 1.0, uEntrance);
              float entranceGlow = (entranceRing + entranceLead * .72 + entranceWake * .34) * entranceLife;

              vec2 pointerMetric = (uv - uPointer) * vec2(aspect, 1.0);
              float pointerDistance = length(pointerMetric);
              float pointerFalloff = exp(-pointerDistance * pointerDistance * 17.0);
              float pointerWaveA = .5 + .5 * sin(pointerDistance * 52.0 - uTime * 7.0);
              float pointerWaveB = .5 + .5 * sin(pointerDistance * 29.0 - uTime * 3.8 + 1.2);
              float pointerSurface = (pointerWaveA * .66 + pointerWaveB * .34) * pointerFalloff * uEnergy;
              float pointerCore = gaussian(pointerDistance, .105) * uEnergy;

              vec2 c = uv * vec2(7.2, 5.2);
              float causticA = sin(c.x * 2.2 + sin(c.y * 1.4 + uTime * .46));
              float causticB = sin(c.y * 2.55 - cos(c.x * 1.3 - uTime * .34));
              float caustic = pow(clamp((causticA + causticB) * .24 + .52, 0.0, 1.0), 6.0);
              float causticAlpha = caustic * mix(.015, .055, uActivity);

              float frontier = uMix * 1.36 - .18;
              float liquidLine = uv.x
                + sin(uv.y * 13.0 + uTime * 1.35) * .034
                + sin(uv.y * 31.0 - uTime * .72) * .011;
              float transitionEdge = gaussian(liquidLine - frontier, .072);
              float transitionAlpha = transitionEdge * step(.001, uMix) * step(uMix, .999) * .16;

              vec3 color = vec3(.24, .76, .90) * causticAlpha;
              color += vec3(.50, .93, 1.0) * entranceGlow * .34;
              color += vec3(.22, .78, .92) * pointerSurface * .16;
              color += vec3(.72, .97, 1.0) * pointerCore * .045;
              color += vec3(.25, .72, .86) * transitionAlpha;

              float alpha = clamp(
                causticAlpha * .70
                + entranceGlow * .46
                + pointerSurface * .22
                + pointerCore * .05
                + transitionAlpha,
                0.0,
                .46
              );

              gl_FragColor = vec4(color, alpha);
            }
          `
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.resize();

        this.ready = true;
        this.portal.dataset.waterMode = 'webgl-overlay';
        this.portal.dataset.waterReady = 'true';
        this.portal.dataset.waterMotion = 'light-only';
        this.portal.dataset.waterEntranceDuration = String(this.entranceDuration);
        this.portal.dataset.waterActive = 'false';
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
      this.entranceLaunchAt = performance.now() + this.entranceDelay;
      this.pointerEnergy = 0;
      this.pointerEnergyTarget = 0;
      this.lastPointerMove = 0;
      this.portal.dataset.waterEntrance = this.reduced ? 'static' : 'pending';

      this.warm().then(ready => {
        if (!ready) return;
        this.setProductInstant(this.currentProduct);
        this.active = true;
        this.portal.dataset.waterActive = 'true';
        this.closingUntil = 0;
        this.resume();
      });
    }

    close(delay = 560) {
      this.active = false;
      clearTimeout(this.rippleTimer);
      this.portal.classList.remove('is-water-rippling');
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
      if (!key) return;
      this.currentProduct = key;
      this.nextProduct = key;
      if (this.uniforms) this.uniforms.uMix.value = 0;
      this.portal.dataset.waterTransition = 'idle';
    }

    transitionTo(key) {
      if (!key || key === this.currentProduct) return;
      this.nextProduct = key;
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
      this.pointerEnergyTarget = Math.min(1.35, .34 + speed * .14);
      this.lastPointerMove = now;
      this.portal.dataset.waterInteraction = 'active';
      this.resume();
    }

    resize() {
      if (!this.ready || !this.renderer || !this.uniforms) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || innerWidth));
      const height = Math.max(1, Math.round(rect.height || innerHeight));
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 720 ? 1 : 1.25));
      this.renderer.setSize(width, height, false);
      this.uniforms.uResolution.value.set(width, height);
    }

    pause() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lastFrame = 0;
      this.lastRenderedAt = 0;
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

      if (this.active && !this.entranceStarted && now >= this.entranceLaunchAt) {
        this.entranceStarted = now;
        this.portal.dataset.waterEntrance = 'running';
        clearTimeout(this.rippleTimer);
        this.portal.classList.remove('is-water-rippling');
        void this.portal.offsetWidth;
        this.portal.classList.add('is-water-rippling');
        this.rippleTimer = setTimeout(() => {
          this.portal.classList.remove('is-water-rippling');
        }, this.entranceDuration + 90);
      }

      const entranceElapsedForThrottle = this.entranceStarted ? now - this.entranceStarted : 0;
      const sincePointer = this.lastPointerMove ? now - this.lastPointerMove : 9999;
      const canThrottle = sincePointer > 2400
        && (!this.active || (this.entranceStarted && entranceElapsedForThrottle >= this.entranceDuration))
        && !this.transitionStarted;

      if (canThrottle && this.lastRenderedAt && now - this.lastRenderedAt < 84) {
        this.frame = requestAnimationFrame(() => this.render());
        return;
      }
      this.lastRenderedAt = now;

      const dt = Math.min(96, this.lastFrame ? now - this.lastFrame : 16.67);
      this.lastFrame = now;

      const activityTarget = sincePointer < 320 ? 1.05 : sincePointer < 2300 ? .36 : .05;
      const energyTarget = sincePointer < 900 ? this.pointerEnergyTarget : 0;
      this.pointerEnergy += (energyTarget - this.pointerEnergy) * (1 - Math.exp(-dt / 120));
      this.pointerEnergyTarget *= Math.pow(.996, dt);

      const pointerEase = 1 - Math.exp(-dt / 78);
      this.pointer.x += (this.pointerTarget.x - this.pointer.x) * pointerEase;
      this.pointer.y += (this.pointerTarget.y - this.pointer.y) * pointerEase;

      const activity = this._activity ?? .05;
      this._activity = activity + (activityTarget - activity) * (1 - Math.exp(-dt / 520));
      this.clock += dt * (.09 + this._activity * .82) / 1000;

      const entranceElapsed = this.entranceStarted ? now - this.entranceStarted : 0;
      const entrance = this.entranceStarted
        ? Math.max(0, Math.min(1, entranceElapsed / this.entranceDuration))
        : 0;
      const entranceEase = entrance * entrance * (3 - 2 * entrance);
      if (this.entranceStarted && entrance >= 1 && this.portal.dataset.waterEntrance === 'running') {
        this.portal.dataset.waterEntrance = 'idle';
      }

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
      clearTimeout(this.rippleTimer);
      this.pause();
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.geometry?.dispose?.();
      this.material?.dispose?.();
      this.renderer?.dispose?.();
    }
  }

  window.AquaWaterSurface = AquaWaterSurface;
})();
