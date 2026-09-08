import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: ['--enable-unsafe-swiftshader'] });
const url = process.env.JOURNEY_URL || 'http://127.0.0.1:8767/';
const errors = [];
async function open(options = {}) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, ...options });
  p.on('pageerror', error => errors.push(error.message));
  await p.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    window.__heroDraws = 0;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const gl = getContext.apply(this, args);
      if (gl && this.classList.contains('hero-journey-canvas') && !window.__heroGL) {
        window.__heroGL = gl;
        const draw = gl.drawElements;
        gl.drawElements = function (...params) { window.__heroDraws++; return draw.apply(this, params); };
      }
      return gl;
    };
  });
  return p;
}
async function progress(page, p) {
  await page.evaluate(p => {
    const s = document.querySelector('[data-journey-stage]');
    const h = s.querySelector('.hero').clientHeight;
    scrollTo({ top: scrollY + s.getBoundingClientRect().top + p * (s.offsetHeight - h), behavior: 'instant' });
  }, p);
  await page.waitForTimeout(700);
}
const opacity = (page, index) => page.locator('[data-journey-chapter]').nth(index).evaluate(el => Number(getComputedStyle(el).opacity));
try {
  const p = await open();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('body.intro-complete', { timeout: 20000 });
  await p.waitForSelector('[data-journey-ready]');
  assert.equal(await p.locator('[data-hero-video]').count(), 0);
  assert.equal(await p.locator('.hero-title').textContent().then(t => t.replace(/\s/g, '')), 'SPORTTAKESSHAPE.');
  assert.ok(await p.locator('.hero-line b').evaluateAll(es => es.every(e => getComputedStyle(e).transform === 'none')));
  await p.screenshot({ path: '/tmp/hero-journey-final-desktop.png' });
  for (const [i, value] of [.22, .43, .635].entries()) {
    await progress(p, value);
    assert.ok(await opacity(p, i) > .98, `chapter ${i} has a stable reading plateau`);
    assert.equal(await p.locator('.hero-title').evaluate(e => Number(getComputedStyle(e).opacity)), 0);
    assert.equal(await p.locator('[data-journey-seek]').nth(i).getAttribute('aria-current'), 'step');
    await p.screenshot({ path: `/tmp/hero-journey-final-depth-${i}.png` });
  }
  await p.locator('[data-journey-seek="0"]').click();
  await p.waitForTimeout(1600);
  assert.ok(await opacity(p, 0) > .98, 'reverse navigation');
  await p.locator('[data-language]').click();
  assert.match(await p.locator('[data-journey-chapter] h2').first().textContent(), /VISION/);
  assert.equal(await p.locator('.hero-journey-nav').getAttribute('aria-label'), 'Your project journey');
  await p.locator('[data-language]').click();
  await p.locator('.hero-journey-nav__pause').click();
  await p.mouse.move(10, 10);
  await p.waitForTimeout(1600);
  const stopped = await p.evaluate(() => window.__heroDraws);
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__heroDraws), stopped, 'pause stops renderer');
  await p.locator('.hero-journey-nav__pause').click();
  await p.waitForTimeout(200);
  assert.ok(await p.evaluate(() => window.__heroDraws) > stopped, 'resume');
  await p.locator('.hero-journey-nav__skip').click();
  await p.waitForTimeout(1800);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'approach-intro');
  await p.screenshot({ path: '/tmp/hero-journey-final-photo.png' });
  await p.locator('#solutions').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const offscreen = await p.evaluate(() => window.__heroDraws);
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__heroDraws), offscreen, 'offscreen suspension');
  await progress(p, .22);
  await p.evaluate(() => { window.__heroContextControl = window.__heroGL.getExtension('WEBGL_lose_context'); window.__heroContextControl.loseContext(); });
  await p.waitForTimeout(150);
  assert.equal(await p.locator('[data-journey-ready]').count(), 0);
  await progress(p, .43);
  assert.ok(await opacity(p, 1) > .98, 'readable content survives context loss');
  await p.evaluate(() => window.__heroContextControl.restoreContext());
  await p.waitForSelector('[data-journey-ready]');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(300);
  assert.equal(await p.locator('[data-journey-stage]').count(), 0, 'breakpoint change restores native flow');
  assert.equal(await p.locator('.hero-journey-chapters > article').count(), 3);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await p.close();

  const mobile = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(`${url}#top`, { waitUntil: 'domcontentloaded' });
  await mobile.waitForSelector('[data-journey-ready]');
  await progress(mobile, .43 / .75);
  assert.ok(await opacity(mobile, 1) > .98);
  await mobile.screenshot({ path: '/tmp/hero-journey-final-mobile.png' });
  await progress(mobile, 1);
  assert.ok(await opacity(mobile, 2) > .98, 'last mobile message stays visible until natural exit');
  assert.ok(await mobile.locator('.hero-journey-nav__pause').isVisible());
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.emulateMedia({ reducedMotion: 'reduce' });
  await mobile.waitForSelector('[data-journey-stage]', { state: 'detached', timeout: 5000 });
  assert.equal(await mobile.locator('[data-journey-stage]').count(), 0, 'live reduced motion restores reading flow');
  await mobile.close();

  for (const fallback of ['reduced', 'noGL']) {
    const page = await open(fallback === 'reduced' ? { reducedMotion: 'reduce' } : {});
    if (fallback === 'noGL') await page.route('**/vendor/three.min.js*', route => route.abort());
    await page.goto(`${url}#top`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.hero-journey-canvas').count(), 0, fallback);
    assert.equal(await page.locator('[data-hero-manifesto-transition]').count(), 0, `${fallback} reading flow`);
    assert.equal(await page.locator('[data-journey-chapter]').count(), 3);
    assert.ok(await page.locator('[data-journey-chapter]').evaluateAll(es => es.every(e => getComputedStyle(e).opacity === '1')));
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: intro/title, three depths, reverse navigation, FR/EN, pause, skip/focus, offscreen, context loss/restore, mobile, breakpoint and reduced-motion changes, no-WebGL.');
} finally { await browser.close(); }
