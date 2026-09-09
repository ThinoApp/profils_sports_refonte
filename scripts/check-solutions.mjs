// Start a static server first. Optional: SOLUTIONS_CAPTURE_STILLS=1 refreshes
// the local fallback PNGs from the actual model (never from project photos).
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.SOLUTIONS_URL || 'http://127.0.0.1:8767/';
const output = process.env.SOLUTIONS_CAPTURES || '/tmp/profils-solutions-check';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({headless:true,
  ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),
  args:['--enable-unsafe-swiftshader']});
const errors = [];
async function instrument(page) {
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    let factory;
    window.__solutionsFrames = 0; window.__solutionsInstances = 0;
    Object.defineProperty(window, 'createSolutionsModel', {configurable:true,
      get:()=>factory, set:f=>{ factory=(...args)=>{
        const model = f(...args); window.__solutionsModel=model; window.__solutionsInstances++;
        model.scene.onBeforeRender=()=>window.__solutionsFrames++;
        return model;
      }; }
    });
  });
}
async function arrive(page) {
  await page.locator('.solutions-viewport').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-solutions-ready]');
}
async function settled(page, index) {
  await page.waitForFunction(index => {
    const model=window.__solutionsModel, current=model.snapshot().state, expected=model.destination(index);
    return Object.entries(expected.parts).every(([key,part]) =>
      Math.abs(current.parts[key].o-part.o)<.00001 && current.parts[key].p.every((p,i)=>Math.abs(p-part.p[i])<.00001));
  }, index);
}
async function choose(page, index) {
  // Programmatic activation isolates scene changes from Playwright auto-scroll.
  await page.locator(`[data-solution="${index}"]`).evaluate(el=>el.click());
  await settled(page,index);
  assert.equal(await page.locator('[data-solution][aria-expanded="true"]').getAttribute('data-solution'),String(index));
}
async function idle(page) {
  await page.mouse.move(1,1);
  await page.waitForTimeout(3500);
  const frames=await page.evaluate(()=>window.__solutionsFrames);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>window.__solutionsFrames),frames,'renderer sleeps at rest');
}
try {
  const p=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  await instrument(p); await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(5500);
  assert.equal(await p.evaluate(()=>!!window.__solutionsModel),false,'lazy scene stays unloaded above the fold');
  await arrive(p);await p.mouse.move(1,1);
  assert.equal(await p.locator('.solutions-canvas').count(),1);
  assert.ok(await p.locator('#solutions img').evaluateAll(images=>images.every(img=>img.getAttribute('src').startsWith('assets/solutions/'))),'Solutions uses only local model renders');
  const root=await p.evaluate(()=>window.__solutionsModel.root.uuid);
  for(const i of [0,1,2,3,4,5,6,7]) {
    await p.locator(`[data-solution="${i}"]`).evaluate(el=>el.click());
    if(i===5) {
      await p.waitForFunction(()=>window.__solutionsModel.parts.frame.position.y>3.59);
      await p.locator('.solutions-figure').screenshot({path:`${output}/exploded.png`});
      if(process.env.SOLUTIONS_CAPTURE_STILLS)await p.locator('.solutions-canvas').screenshot({path:'assets/solutions/5.png',omitBackground:true});
    }
    await settled(p,i);
    if(i===6) await p.waitForFunction(()=>window.__solutionsModel.scan.visible);
    if(process.env.SOLUTIONS_CAPTURE_STILLS && i!==5) {
      await p.mouse.move(1,1);await p.waitForTimeout(3000);
      await p.locator('.solutions-canvas').screenshot({path:`assets/solutions/${i}.png`,omitBackground:true});
    }
    await p.locator('.solutions-figure').screenshot({path:`${output}/desktop-${i}.png`});
    assert.equal(await p.evaluate(()=>window.__solutionsModel.root.uuid),root,'same model persists');
  }
  assert.equal(await p.evaluate(()=>window.__solutionsInstances),1);
  console.log('Eight states and assembly checked.');
  assert.equal(await p.evaluate(()=>window.__solutionsModel.snapshot().state.wire),1);
  await idle(p);
  // Reverse a live transition in the same JS task: no hidden reset is possible.
  await p.locator('[data-solution="4"]').evaluate(el=>el.click());await p.waitForTimeout(200);
  const snapshots=await p.evaluate(()=>{
    const before=window.__solutionsModel.snapshot();document.querySelector('[data-solution="2"]').click();
    return [before,window.__solutionsModel.snapshot()];
  });
  assert.deepEqual(...snapshots);await settled(p,2);
  const scroll=await p.evaluate(()=>scrollY);await choose(p,3);
  assert.ok(Math.abs(await p.evaluate(()=>scrollY)-scroll)<2,'menu activation does not scroll desktop');
  await p.mouse.wheel(0,120);await p.waitForTimeout(500);
  assert.equal(await p.locator('#solutions').getAttribute('data-solution-active'),'3','scroll is not a service selector');
  await arrive(p);
  await p.locator('[data-solution="3"]').focus();await p.keyboard.press('End');await settled(p,7);
  await p.keyboard.press('Home');await settled(p,0);
  await p.keyboard.press('ArrowDown');await settled(p,1);
  await p.locator('[data-solution-part="team"]').click();
  assert.match(await p.locator('[data-solution-annotation]').innerText(),/ÉQUIPEMENTS|Équipements/);
  await p.keyboard.press('Escape');await p.waitForSelector('[data-solution-annotation]',{state:'hidden'});
  await p.locator('[data-solution-plan]').click();
  await p.waitForFunction(()=>window.__solutionsModel.camera.position.y>59.99);
  assert.equal(await p.locator('[data-solution-plan]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-solution-plan]').click();
  await p.waitForFunction(()=>window.__solutionsModel.camera.position.y<29);
  await p.locator('[data-language]').evaluate(el=>el.click());
  assert.match(await p.locator('[data-solution-plan]').innerText(),/Top view/);
  await p.locator('[data-solution-part="team"]').click();
  assert.match(await p.locator('[data-solution-annotation]').innerText(),/Equipment|EQUIPMENT/);
  await choose(p,0);await p.waitForSelector('[data-solution-annotation]',{state:'hidden'});
  await p.locator('[data-language]').evaluate(el=>el.click());await p.keyboard.press('Escape');
  console.log('Interruption, keyboard, top view and translations checked.');
  await choose(p,6);await p.waitForFunction(()=>window.__solutionsModel.scan.visible);
  await idle(p);assert.equal(await p.evaluate(()=>window.__solutionsModel.scan.visible),false);
  await p.locator('[data-solution="0"]').evaluate(el=>el.click());
  await p.evaluate(()=>document.body.classList.add('catalogue-ribbon-open'));
  await p.waitForTimeout(100);const modalFrames=await p.evaluate(()=>window.__solutionsFrames);
  await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>window.__solutionsFrames),modalFrames);
  await p.evaluate(()=>document.body.classList.remove('catalogue-ribbon-open'));await settled(p,0);
  await p.locator('#contact').scrollIntoViewIfNeeded();await p.waitForTimeout(200);
  const away=await p.evaluate(()=>window.__solutionsFrames);await p.waitForTimeout(350);
  assert.equal(await p.evaluate(()=>window.__solutionsFrames),away,'offscreen renderer sleeps');
  await arrive(p);
  const contextSupported=await p.locator('.solutions-canvas').evaluate(canvas=>{
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
    window.__solutionsContext=gl?.getExtension('WEBGL_lose_context');
    window.__solutionsContext?.loseContext();return !!window.__solutionsContext;
  });
  assert.ok(contextSupported,'test browser supports real context loss');
  await p.waitForSelector('[data-solution-status]:visible');
  await p.locator('[data-solution="4"]').evaluate(el=>el.click());
  assert.match(await p.locator('.solutions-still').getAttribute('src'),/4.png/);
  await p.evaluate(()=>window.__solutionsContext.restoreContext());await p.waitForSelector('[data-solutions-ready]');
  await settled(p,4);
  console.log('Idle, modal, offscreen and real context recovery checked.');
  await p.locator('#solutions').screenshot({path:`${output}/section.png`});
  // The page is also usable with touch, reduced motion or no WebGL at all.
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await instrument(mobile);await mobile.goto(url+'#solutions',{waitUntil:'domcontentloaded'});await mobile.waitForTimeout(5500);await arrive(mobile);
  for(const i of [0,1,2,3,4,5,6,7]) {
    await mobile.locator(`[data-solution="${i}"]`).click();await mobile.waitForTimeout(150);
    assert.equal(await mobile.locator('#solutions').getAttribute('data-solution-active'),String(i));
    const expected=i===5?3.6:0;
    if(i===5)assert.equal(await mobile.evaluate(()=>window.__solutionsModel.parts.frame.position.y),expected);
    assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile overflow');
    const box=await mobile.locator('.solutions-canvas').boundingBox();
    assert.ok(box.y>=0&&box.y+box.height<=844,'maquette stays visible while menu is used');
  }
  await mobile.locator('[data-solution="7"]').focus();await mobile.keyboard.press('Home');await mobile.waitForTimeout(400);
  const first=await mobile.locator('[data-solution="0"]').boundingBox(),figure=await mobile.locator('.solutions-figure').boundingBox();
  assert.ok(first.y>=figure.y+figure.height-2,'keyboard focus is not obscured by sticky figure');
  await mobile.screenshot({path:`${output}/mobile.png`});
  const reducedFrames=await mobile.evaluate(()=>window.__solutionsFrames);await mobile.waitForTimeout(500);
  assert.equal(await mobile.evaluate(()=>window.__solutionsFrames),reducedFrames,'reduced motion is truly static');
  await mobile.locator('[data-language]').evaluate(el=>el.click());
  assert.match(await mobile.locator('[data-solution-name]').innerText(),/Stadiums/i);
  for(const viewport of [{width:720,height:1024},{width:1024,height:900},{width:1920,height:1080}]) {
    await p.setViewportSize(viewport);await arrive(p);await p.waitForTimeout(250);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no intermediate/wide overflow');
    assert.ok(await p.locator('[data-solution]').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().right<=innerWidth)),'all service labels fit');
  }
  const fallback=await browser.newPage({viewport:{width:390,height:844}});
  await fallback.route('**/vendor/three.min.js*',route=>route.abort());
  await fallback.goto(url+'#solutions',{waitUntil:'domcontentloaded'});await fallback.waitForTimeout(5500);
  await fallback.locator('.solutions-figure').scrollIntoViewIfNeeded();await fallback.waitForSelector('[data-solution-status]:visible');
  for(let i=0;i<8;i++) {
    await fallback.locator(`[data-solution="${i}"]`).evaluate(el=>el.click());
    await fallback.waitForFunction(()=>{const img=document.querySelector('.solutions-still');return img.complete&&img.naturalWidth>0;});
    assert.match(await fallback.locator('.solutions-still').getAttribute('src'),new RegExp(`${i}.png`));
  }
  assert.equal(await fallback.locator('[data-solution-plan]').isVisible(),false);
  await fallback.locator('.solutions-figure').screenshot({path:`${output}/fallback.png`});
  const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJS.goto(url,{waitUntil:'domcontentloaded'});
  for(const paragraph of await noJS.locator('.solution-entry p').all())assert.equal(await paragraph.isVisible(),true);
  assert.equal(await noJS.locator('.solutions-canvas').isVisible(),false);
  assert.deepEqual(errors,[],'no browser exceptions');
  console.log('PASS: eight persistent states, interrupted transitions, complete assembly, inspection, keyboard, FR/EN, plan view, native scroll, idle/modal/offscreen suspension, actual context recovery, mobile, reduced motion, no WebGL, no JS.');
  console.log('Captures:',output);
} finally { await browser.close(); }
