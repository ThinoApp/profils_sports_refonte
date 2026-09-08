import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--enable-unsafe-swiftshader']});
const url=process.env.GLOBE_URL||'http://127.0.0.1:8767/';
const errors=[];
async function open(options={}) {
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2,...options});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let factory;window.__globeFrames=0;
    Object.defineProperty(window,'createSportsGlobe',{configurable:true,get:()=>factory,set:f=>{
      factory=async (...args)=>{const m=await f(...args);window.__globe=m;const draw=m.draw;m.draw=(...a)=>{window.__globeFrames++;return draw(...a);};return m;};
    }});
  });
  return page;
}
async function arrive(p){await p.locator('#disciplines').scrollIntoViewIfNeeded();await p.waitForSelector('[data-emblem-ready]',{timeout:25000});}
try {
  const p=await open();await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(5000);
  assert.equal(await p.evaluate(()=>!!window.__globe),false,'lazy initialization');await arrive(p);
  await p.locator('[data-emblem-play]').click();await p.waitForTimeout(1800);
  assert.ok(await p.evaluate(()=>window.__globe.core.children.every(m=>m.geometry.attributes.position.count>0)),'real logo geometry');
  const frames=await p.evaluate(()=>window.__globeFrames);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__globeFrames),frames,'paused renderer sleeps');
  await p.locator('#disciplines').screenshot({path:'/tmp/globe-final-desktop.png'});
  await p.locator('[data-emblem-next]').click();await p.waitForTimeout(1800);
  assert.match(await p.locator('[data-emblem-action]').textContent(),/PICKLEBALL/);
  await p.locator('.brand-emblem__stage').focus();await p.keyboard.press('Home');await p.waitForTimeout(1500);
  assert.match(await p.locator('[data-emblem-action]').textContent(),/PADEL/);
  const box=await p.locator('.brand-emblem__stage').boundingBox();const x=box.x+box.width*.28,y=box.y+box.height*.65;
  await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+120,y+50,{steps:12});await p.mouse.up();await p.waitForTimeout(1500);
  assert.ok(Math.abs(Number(await p.locator('#disciplines').getAttribute('data-globe-yaw')))>.1,'drag rotates');
  await p.locator('[data-language]').evaluate(b=>b.click());assert.match(await p.locator('[data-emblem-action]').textContent(),/BROWSE PADEL/);
  await p.locator('[data-emblem-action]').click();await p.waitForSelector('.catalogue-ribbon-open');await p.waitForTimeout(400);
  const modalFrames=await p.evaluate(()=>window.__globeFrames);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>window.__globeFrames),modalFrames,'sleeps behind catalogue');
  await p.locator('[data-ribbon-close]').click();await p.waitForTimeout(500);
  assert.equal(await p.locator('[data-emblem-action]').evaluate(el=>el===document.activeElement),true,'catalogue focus return');
  await p.locator('[data-emblem-play]').click();await p.locator('#contact').scrollIntoViewIfNeeded();await p.waitForTimeout(400);
  const hidden=await p.evaluate(()=>window.__globeFrames);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__globeFrames),hidden,'offscreen suspension');
  const mobile=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await mobile.goto(url,{waitUntil:'domcontentloaded'});await arrive(mobile);await mobile.waitForTimeout(300);
  assert.equal(await mobile.locator('[data-emblem-play]').isVisible(),false);
  await mobile.locator('.brand-emblem__stage').focus();await mobile.keyboard.press('ArrowRight');await mobile.waitForTimeout(200);
  assert.match(await mobile.locator('[data-emblem-action]').textContent(),/PICKLEBALL/);
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const reducedFrames=await mobile.evaluate(()=>window.__globeFrames);await mobile.waitForTimeout(300);assert.equal(await mobile.evaluate(()=>window.__globeFrames),reducedFrames);
  await mobile.keyboard.press('Home');await mobile.waitForTimeout(150);await mobile.locator('#disciplines').screenshot({path:'/tmp/globe-final-mobile.png'});
  assert.ok(await mobile.locator('.brand-emblem figure').evaluateAll(els=>els.filter(el=>getComputedStyle(el).visibility!=='hidden').every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),'mobile discipline controls fit');
  const touch=await mobile.context().newCDPSession(mobile);
  const bounds=await mobile.locator('.brand-emblem__stage').boundingBox();
  const tx=bounds.x+bounds.width*.45,ty=bounds.y+bounds.height*.5;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
  for(let i=1;i<=8;i++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx+i*10,y:ty}]});await mobile.waitForTimeout(25);}
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(300);
  assert.ok(Math.abs(Number(await mobile.locator('#disciplines').getAttribute('data-globe-yaw')))>.1,'touch swipe rotates');
  const touchFrames=await mobile.evaluate(()=>window.__globeFrames);await mobile.waitForTimeout(200);assert.equal(await mobile.evaluate(()=>window.__globeFrames),touchFrames,'reduced motion sleeps after touch');
  const noGL=await open();await noGL.route('**/sports-globe.js*',r=>r.abort());await noGL.goto(url,{waitUntil:'domcontentloaded'});
  await noGL.locator('#disciplines').scrollIntoViewIfNeeded();await noGL.waitForSelector('[data-globe-fallback]');
  await noGL.locator('.brand-emblem__node').nth(1).click();assert.match(await noGL.locator('[data-emblem-action]').textContent(),/FITNESS/);
  assert.equal(await noGL.locator('figure .brand-emblem__node').count(),8);
  assert.deepEqual(errors,[]);
  console.log('PASS: real geometry, lazy load, mouse, keyboard, pause/idle, FR/EN, catalogue/focus, offscreen/modal suspension, mobile/reduced motion and fallback.');
} finally {await browser.close();}
