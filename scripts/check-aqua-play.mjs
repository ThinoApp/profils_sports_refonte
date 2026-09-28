import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
  args: ['--enable-unsafe-swiftshader']
});
const url = process.env.AQUA_URL || 'http://127.0.0.1:8769/';
const errors = [];

async function pageFor(options = {}) {
  const page = await browser.newPage({ viewport:{ width:1440, height:900 }, ...options });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil:'domcontentloaded' });
  await page.addStyleTag({ content:'[data-preloader]{display:none!important}' });
  await page.locator('#catalogues').scrollIntoViewIfNeeded();
  return page;
}

try {
  const page = await pageFor();
  await page.evaluate(() => scrollTo(0, Math.min(5000, document.documentElement.scrollHeight - innerHeight)));
  await page.waitForFunction(() => document.querySelector('[data-header]')?.classList.contains('is-scrolled'));
  const shortcut = page.locator('[data-aqua-shortcut]');
  assert.equal(await shortcut.isVisible(), true, 'Aqua shortcut is visible in the fixed header');
  assert.match(await shortcut.locator('.aqua-shortcut__logo').getAttribute('src'), /assets\/aqua-play\/logo\.png$/, 'official Aqua Play logo is used in the shortcut');
  assert.equal(await shortcut.locator('.aqua-shortcut__wave').count(), 2, 'wave button renders two animated water layers');
  const shortcutStyle = await shortcut.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      color:style.color,
      backgroundImage:style.backgroundImage,
      borderTopWidth:style.borderTopWidth,
      borderRadius:style.borderRadius
    };
  });
  assert.equal(shortcutStyle.color, 'rgb(255, 255, 255)', 'shortcut remains high contrast on the paper header');
  assert.notEqual(shortcutStyle.backgroundImage, 'none', 'shortcut owns its own aquatic gradient on the paper header');
  assert.equal(shortcutStyle.borderTopWidth, '0px', 'wave shortcut has no visible border');
  assert.notEqual(shortcutStyle.borderRadius, '0px', 'wave shortcut keeps a capsule silhouette');
  await shortcut.hover();
  await page.waitForTimeout(700);
  assert.equal(await page.locator('[data-header]').evaluate(element => element.classList.contains('is-aqua-preview')), true, 'header enters Aqua preview state');
  await page.screenshot({ path:'/tmp/aqua-header-preview.png' });
  await shortcut.evaluate(element => element.click());
  await page.waitForSelector('.aqua-portal.is-open');
  await page.waitForFunction(() => document.querySelector('.aqua-portal')?.dataset.waterReady === 'true', null, { timeout:5000 });
  assert.equal(await page.locator('.aqua-portal').getAttribute('data-water-mode'), 'webgl', 'desktop Aqua viewer uses the WebGL liquid surface');
  assert.equal(await page.locator('.aqua-portal').getAttribute('data-water-motion'), 'enhanced', 'Aqua viewer uses the amplified liquid tuning');
  assert.equal(Number(await page.locator('.aqua-portal').getAttribute('data-water-entrance-duration')), 1250, 'enhanced radial entrance uses the longer 1.25s travel');
  assert.equal(await page.locator('[data-aqua-water]').isVisible(), true, 'liquid surface canvas is visible');
  assert.match(await page.locator('.aqua-portal').getAttribute('data-water-entrance') || '', /^(running|idle)$/, 'opening schedules the radial water entrance');
  await page.waitForFunction(() => document.querySelector('.aqua-portal')?.dataset.waterActive === 'true', null, { timeout:1000 });
  await page.locator('.aqua-portal').evaluate(element => {
    element.dispatchEvent(new PointerEvent('pointermove', { clientX:1110, clientY:420, pointerType:'mouse', bubbles:true }));
  });
  assert.equal(await page.locator('.aqua-portal').getAttribute('data-water-interaction'), 'active', 'pointer wakes the local water distortion');
  await page.waitForTimeout(140);
  const handoffWidth = parseFloat(await page.locator('.aqua-portal').evaluate(element => getComputedStyle(element).getPropertyValue('--aqua-handoff-width')));
  assert.ok(handoffWidth > 40 && handoffWidth < 320, 'header shortcut becomes the portal handoff origin');
  await page.locator('[data-aqua-close]').click();
  await page.locator('.aqua-portal').waitFor({ state:'hidden', timeout:2000 });
  assert.equal(await page.locator('.aqua-portal').isVisible(), false);
  assert.equal(await shortcut.evaluate(element => element === document.activeElement), true, 'focus returns to the header shortcut');
  assert.equal(await page.locator('[data-header]').evaluate(element => element.classList.contains('is-aqua-preview')), false, 'header returns to its normal state after closing');

  const aqua = page.locator('[data-catalogue="aqua"]');
  await aqua.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await aqua.hover();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.catalogue-gallery').evaluate(element => element.classList.contains('is-aqua-hover')), true);
  assert.equal(await page.locator('.catalogue-preview__aqua').isVisible(), true);
  await page.screenshot({ path:'/tmp/aqua-gallery-desktop.png' });
  await page.locator('[data-catalogue="padel"]').hover();
  assert.equal(await page.locator('.catalogue-gallery').evaluate(element => element.classList.contains('is-aqua-hover')), false);
  await aqua.hover();

  await aqua.click();
  await page.waitForSelector('.aqua-portal.is-open');
  assert.equal(await page.locator('.catalogue-gallery').evaluate(element => element.classList.contains('is-aqua-hover')), true, 'the water surface stays present behind the expanding viewer');
  if (process.env.CAPTURE_AQUA_TRANSITION) {
    await page.screenshot({ path:'/tmp/aqua-transition-0.png' });
    await page.waitForTimeout(170);
    await page.screenshot({ path:'/tmp/aqua-transition-170.png' });
    await page.waitForTimeout(250);
    await page.screenshot({ path:'/tmp/aqua-transition-420.png' });
  }
  await page.waitForTimeout(850);
  assert.equal(await page.locator('[data-aqua-choice="court"]').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('[data-aqua-link]').getAttribute('href'), /water-court-fr\.pdf$/);
  await page.locator('.aqua-portal').screenshot({ path:'/tmp/aqua-portal-desktop.png' });

  await page.locator('[data-aqua-choice="bike"]').evaluate(element => element.click());
  assert.match(await page.locator('.aqua-portal').getAttribute('data-water-transition'), /court-to-bike/, 'product change starts a liquid wipe');
  await page.waitForTimeout(320);
  await page.locator('.aqua-portal').screenshot({ path:'/tmp/aqua-liquid-wipe.png' });
  await page.waitForTimeout(520);
  assert.equal(await page.locator('.aqua-portal').getAttribute('data-water-transition'), 'idle', 'liquid wipe settles cleanly');
  assert.equal(await page.locator('.aqua-portal').getAttribute('data-product'), 'bike');
  assert.match(await page.locator('[data-aqua-link]').getAttribute('href'), /water-bike-fr\.pdf$/);
  await page.locator('.aqua-portal').screenshot({ path:'/tmp/aqua-portal-bike.png' });

  await page.keyboard.press('Escape');
  await page.locator('.aqua-portal').waitFor({ state:'hidden', timeout:2000 });
  assert.equal(await page.locator('.aqua-portal').isVisible(), false);
  assert.equal(await aqua.evaluate(element => element === document.activeElement), true);
  await page.locator('[data-language]').evaluate(element => element.click());
  await aqua.click();
  await page.waitForSelector('.aqua-portal.is-open');
  assert.match(await page.locator('[data-aqua-link]').getAttribute('href'), /water-court-en\.pdf$/);
  await page.locator('[data-aqua-choice="bike"]').click();
  assert.match(await page.locator('[data-aqua-link]').getAttribute('href'), /water-bike-en\.pdf$/);
  await page.locator('[data-aqua-close]').click();
  await page.waitForTimeout(600);

  await page.locator('[data-catalogue="padel"]').click();
  await page.waitForSelector('.catalogue-ribbon.is-open');
  await page.locator('[data-ribbon-close]').click();
  await page.close();

  const mobile = await pageFor({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
  const mobileShortcut = mobile.locator('[data-aqua-shortcut]');
  assert.equal(await mobileShortcut.isVisible(), true, 'compact Aqua shortcut stays visible beside the mobile menu');
  assert.match(await mobileShortcut.locator('.aqua-shortcut__logo').getAttribute('src'), /assets\/aqua-play\/logo\.png$/);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobileShortcut.click();
  await mobile.waitForSelector('.aqua-portal.is-open');
  assert.equal(await mobile.locator('.aqua-portal').getAttribute('data-water-mode'), 'reduced', 'reduced motion keeps the static image fallback');
  assert.equal(await mobile.locator('[data-aqua-water]').isVisible(), false, 'reduced motion does not animate the liquid canvas');
  await mobile.waitForSelector('.aqua-portal.is-open');
  await mobile.locator('.aqua-portal').screenshot({ path:'/tmp/aqua-portal-mobile.png' });
  assert.equal(await mobile.locator('[data-aqua-link]').isVisible(), true);
  await mobile.locator('[data-aqua-locale="en"]').click();
  assert.match(await mobile.locator('[data-aqua-link]').getAttribute('href'), /water-court-en\.pdf$/);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.keyboard.press('ArrowRight');
  assert.equal(await mobile.locator('.aqua-portal').getAttribute('data-product'), 'bike');
  assert.match(await mobile.locator('[data-aqua-link]').getAttribute('href'), /water-bike-en\.pdf$/);
  await mobile.keyboard.press('Escape');
  await mobile.locator('.aqua-portal').waitFor({ state:'hidden' });
  assert.equal(await mobile.locator('.aqua-portal').isVisible(), false);
  await mobile.close();

  const compact = await pageFor({ viewport:{ width:360, height:640 }, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
  await compact.locator('[data-catalogue="aqua"]').click();
  await compact.locator('[data-aqua-link]').scrollIntoViewIfNeeded();
  assert.equal(await compact.locator('[data-aqua-link]').isVisible(), true);
  assert.equal(await compact.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await compact.close();

  const noJS = await browser.newPage({ javaScriptEnabled:false });
  await noJS.goto(url, { waitUntil:'domcontentloaded' });
  assert.match(await noJS.locator('[data-aqua-shortcut]').getAttribute('href'), /water-court-fr\.pdf$/, 'header shortcut keeps a direct PDF fallback without JavaScript');
  assert.equal(await noJS.locator('[data-aqua-shortcut]').isVisible(), true);
  assert.match(await noJS.locator('[data-catalogue="aqua"]').getAttribute('href'), /water-court-fr\.pdf$/);
  assert.equal(await noJS.locator('[data-catalogue="aqua"]').isVisible(), true);
  await noJS.close();

  for (const file of ['water-court-fr.pdf','water-court-en.pdf','water-bike-fr.pdf','water-bike-en.pdf']) {
    const response = await fetch(new URL(`assets/aqua-play/${file}`, url));
    assert.equal(response.status, 200, file);
    assert.match(response.headers.get('content-type') || '', /pdf/, file);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: Aqua wave shortcut, amplified radial entrance, stronger pointer refraction, liquid product wipe, WebGL/static fallbacks, FR/EN PDFs, focus return, original ribbon, mobile/reduced motion.');
} finally {
  await browser.close();
}
