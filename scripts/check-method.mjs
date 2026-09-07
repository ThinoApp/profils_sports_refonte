// Browser regression check. Supply PLAYWRIGHT_MODULE if Playwright is not installed
// in the project. Run a static server first; METHOD_URL defaults to localhost:8766.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.METHOD_URL||'http://127.0.0.1:8766/';
const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),
  args:['--enable-unsafe-swiftshader']});
const output=process.env.METHOD_CAPTURES||'/tmp/profils-method-check';
await mkdir(output,{recursive:true});
const errors=[];
const track=p=>p.on('pageerror',e=>errors.push(e.message));
async function instrument(p){
  await p.addInitScript(()=>{
    let factory;
    window.__methodFrames=0;
    Object.defineProperty(window,'createMethodModel',{configurable:true,get:()=>factory,set:f=>{
      factory=(...args)=>{const model=f(...args);window.__methodModel=model;model.scene.onBeforeRender=()=>window.__methodFrames++;return model;};
    }});
  });
}
async function arrive(p){
  await p.locator('.method-figure').scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>window.__methodModel&&window.__methodFrames>0);
}
async function stage(p,i){
  await p.locator('[data-method-step]').nth(i).click();await p.mouse.move(2,2);
  await p.locator('.method-figure').scrollIntoViewIfNeeded();await p.waitForTimeout(2300);
  assert.equal(await p.locator('[data-method-step][aria-expanded="true"]').getAttribute('data-method-step'),String(i));
}
try {
  const p=await browser.newPage({viewport:{width:1540,height:1200},deviceScaleFactor:1});track(p);await instrument(p);
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(5500);
  assert.equal(await p.evaluate(()=>!!window.__methodModel),false,'scene must not initialize above the fold');
  await arrive(p);
  for(const i of [0,1,2,3,4]){
    await stage(p,i);
    await p.locator('.method-figure').screenshot({path:`${output}/desktop-${i}.png`});
  }
  await p.locator('[data-method-light]').click();await p.waitForTimeout(1400);
  assert.equal(await p.locator('[data-method-light]').getAttribute('aria-pressed'),'true');
  assert.ok(await p.evaluate(()=>window.__methodModel.spots.every(l=>l.intensity>100)),'real light sources must switch on');
  await p.locator('.method-figure').screenshot({path:`${output}/lights-on.png`});
  await p.locator('[data-method-part="panels"]').click();await p.waitForTimeout(1200);
  assert.equal(await p.locator('[data-method-part="panels"]').getAttribute('aria-pressed'),'true');
  await p.locator('.method-canvas').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(1200);
  assert.ok(await p.evaluate(()=>window.__methodModel.root.rotation.y>.1),'keyboard rotation');
  await p.keyboard.press('Home');await p.waitForTimeout(1200);
  assert.ok(await p.evaluate(()=>Math.abs(window.__methodModel.root.rotation.y)<.001),'keyboard reset');
  await stage(p,0);assert.equal(await p.locator('[data-method-light]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[data-method-light]').isDisabled(),true);
  await stage(p,3);assert.equal(await p.locator('[data-method-light]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-method-light]').click();await p.waitForTimeout(1600);
  assert.ok(await p.evaluate(()=>window.__methodModel.spots.every(l=>l.intensity<.1)),'lights switch off');
  const frames=await p.evaluate(()=>window.__methodFrames);await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>window.__methodFrames),frames,'settled renderer sleeps');
  // Interrupt an in-flight assembly and finish on the requested state.
  await p.locator('[data-method-step]').nth(1).evaluate(el=>el.click());await p.waitForTimeout(200);
  const before=await p.evaluate(()=>window.__methodModel.groups.panels.position.y);
  await p.locator('[data-method-step]').nth(3).evaluate(el=>el.click());
  const after=await p.evaluate(()=>window.__methodModel.groups.panels.position.y);
  assert.ok(Math.abs(before-after)<.2,'interruption must not reset geometry');
  await p.waitForTimeout(2300);assert.ok(await p.evaluate(()=>Math.abs(window.__methodModel.groups.panels.position.y)<.001));
  await p.locator('[data-language]').evaluate(el=>el.click());
  assert.match(await p.locator('[data-method-light]').innerText(),/Lighting/);
  await stage(p,4);await p.locator('[data-method-part="lighting"]').click();
  assert.match(await p.locator('[data-method-detail]').innerText(),/Floodlights/);
  // Existing catalogue interaction remains the owner of modal keyboard input.
  await p.locator('[data-catalogue]').first().click();await p.waitForSelector('body.catalogue-ribbon-open');
  const stopped=await p.evaluate(()=>window.__methodFrames);await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>window.__methodFrames),stopped,'Method sleeps behind catalogue');
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.body.classList.contains('catalogue-ribbon-open'));
  await arrive(p);
  // Context loss restores the still and leaves Method navigation usable.
  await p.locator('.method-canvas').evaluate(el=>el.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  assert.equal(await p.locator('.method-fallback').isVisible(),true);
  await stage(p,1);assert.match(await p.locator('.method-fallback').getAttribute('src'),/engineering/);
  await p.locator('.method-canvas').evaluate(el=>el.dispatchEvent(new Event('webglcontextrestored')));
  await p.waitForFunction(()=>!document.querySelector('.method-canvas').hidden);

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});track(mobile);await instrument(mobile);
  await mobile.goto(url+'#approach',{waitUntil:'domcontentloaded'});await mobile.waitForTimeout(5500);await arrive(mobile);
  for(const language of ['fr','en']){
    if(language==='en')await mobile.locator('[data-language]').evaluate(el=>el.click());
    for(const i of [1,4]){
      await mobile.locator('[data-method-step]').nth(i).click();await mobile.waitForTimeout(100);
      assert.equal(await mobile.locator('[data-method-step][aria-expanded="true"]').getAttribute('data-method-step'),String(i));
      assert.ok(await mobile.evaluate(()=>[...document.querySelectorAll('.method-step__short')].every(el=>el.getBoundingClientRect().right<=document.documentElement.clientWidth)),'mobile labels fit');
      await mobile.locator('.method-figure').scrollIntoViewIfNeeded();await mobile.screenshot({path:`${output}/mobile-${language}-${i}.png`});
    }
  }
  const noGL=await browser.newPage({viewport:{width:1000,height:1000}});track(noGL);
  await noGL.route('**/vendor/three.min.js*',route=>route.abort());
  await noGL.goto(url+'#approach',{waitUntil:'domcontentloaded'});await noGL.waitForTimeout(5500);
  await noGL.locator('.method-figure').scrollIntoViewIfNeeded();await noGL.waitForSelector('[data-method-status]:visible');
  await noGL.locator('[data-method-step]').nth(1).click();
  await noGL.waitForFunction(()=>{const img=document.querySelector('.method-fallback');return img.complete&&img.naturalWidth>0;});
  assert.equal(await noGL.locator('[data-method-light]').isVisible(),false);
  await noGL.locator('.method-figure').screenshot({path:`${output}/fallback.png`});
  const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJS.goto(url,{waitUntil:'domcontentloaded'});
  for(const paragraph of await noJS.locator('.method-step p').all())assert.equal(await paragraph.isVisible(),true);
  assert.equal(await noJS.locator('.method-canvas').isVisible(),false);
  assert.deepEqual(errors,[],'no page exceptions');
  console.log('PASS: 5 stages, interruptible assembly, real lighting, keyboard, FR/EN, idle/modal suspension, context recovery, mobile, reduced motion, no WebGL and no JS.');
  console.log('Captures:',output);
} finally { await browser.close(); }
