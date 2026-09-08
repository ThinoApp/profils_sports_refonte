/* Globe navigation: inertial rotation, native controls, original catalogue mapping. */
(() => {
  'use strict';
  const section=document.querySelector('.brand-emblem');
  if(!section)return;
  const $=s=>section.querySelector(s);
  const stage=$('.brand-emblem__stage'),logo=$('.brand-emblem__logo');
  const toolbar=$('.brand-emblem__toolbar'),bottom=$('.brand-emblem__bottom');
  const play=$('[data-emblem-play]'),action=$('[data-emblem-action]');
  const figures=[...section.querySelectorAll('figure')];
  const names=figures.map(f=>f.querySelector('figcaption').textContent);
  const catalogues=[null,'fitness','padel',null,null,'canopy','csp',null];
  const rows=[...document.querySelectorAll('[data-catalogue]')];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const text=(fr,en)=>document.documentElement.lang==='en'?en:fr;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const mod=n=>(n%8+8)%8;
  const canvas=document.createElement('canvas');canvas.className='sports-globe';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
  const status=document.createElement('p');status.className='brand-emblem__status';status.setAttribute('role','status');section.append(status);
  let model=null,started=false,failed=false,visible=false,modal=false,raf=0,last=0;
  let width=1,height=1,yaw=0,targetYaw=0,pitch=-.12,targetPitch=-.12;
  let selected=2,playing=!reduced.matches,drag=null,velocity=0;
  const buttons=figures.map((figure,i)=>{
    const b=document.createElement('button');b.type='button';b.className='brand-emblem__node';figure.append(b);
    b.addEventListener('click',()=>select(i));b.addEventListener('focus',pause);b.addEventListener('pointerenter',pause);return b;
  });
  function copy(){
    const row=rows.find(r=>r.dataset.catalogue===catalogues[selected]);
    if(row){action.dataset.catalogueTrigger=row.dataset.catalogue;action.href=row.href;action.target='_blank';action.textContent=text('FEUILLETER ','BROWSE ')+row.querySelector('.catalogue-name').textContent+' ↗';}
    else {delete action.dataset.catalogueTrigger;action.removeAttribute('target');action.href='mailto:contact@profilssports.com?subject='+encodeURIComponent(text('Projet ','Project ')+names[selected]);action.textContent=text('PARLONS ','DISCUSS ')+names[selected]+' ↗';}
    figures.forEach((f,i)=>{f.toggleAttribute('data-active',i===selected);buttons[i].setAttribute('aria-pressed',String(i===selected));buttons[i].setAttribute('aria-label',text('Sélectionner ','Select ')+names[i]);});
    stage.setAttribute('aria-label',text('Globe des sports. Glissez pour tourner. Flèches pour choisir une discipline, Début pour recentrer.','Sports globe. Drag to rotate. Arrow keys select a discipline, Home resets the view.'));
    play.hidden=reduced.matches||failed;play.textContent=playing?'Ⅱ':'▷';
    play.setAttribute('aria-label',playing?text('Mettre la rotation en pause','Pause rotation'):text('Reprendre la rotation','Resume rotation'));
    $('[data-emblem-prev]').setAttribute('aria-label',text('Discipline précédente','Previous discipline'));
    $('[data-emblem-next]').setAttribute('aria-label',text('Discipline suivante','Next discipline'));
    status.textContent=failed?text('La vue 3D est indisponible. Choisissez une discipline ci-dessous.','The 3D view is unavailable. Choose a discipline below.'):!model?text('Préparation du globe…','Preparing the globe…'):'';
    status.hidden=!!model&&!failed;
  }
  function pause(){playing=false;velocity=0;copy();}
  function select(i){
    pause();selected=mod(i);const desired=-(selected-2)*Math.PI/4;
    targetYaw=yaw+Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw));targetPitch=0;copy();wake();
  }
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function wake(){if(model&&visible&&!modal&&!document.hidden&&!failed&&!raf)raf=requestAnimationFrame(render);}
  function draw(){
    model.draw(yaw,pitch).forEach((p,i)=>{
      const scale=.7+(p.z+3)/6*.3,x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;
      const f=figures[i];f.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
      f.style.opacity=p.z<-.4?'.55':'1';f.style.zIndex=p.z<0?'1':'2';f.dataset.depth=p.z<0?'back':'front';
      f.style.visibility=p.occluded?'hidden':'visible';buttons[i].tabIndex=p.occluded?-1:0;
    });section.dataset.globeYaw=yaw.toFixed(3);
  }
  function render(time){
    raf=0;if(!visible||modal||document.hidden||failed)return;
    const dt=Math.min(last?(time-last)/1000:1/60,.05);last=time;
    if(playing&&!drag&&!reduced.matches)targetYaw+=dt*.075;
    if(!drag&&!reduced.matches&&Math.abs(velocity)>.001){targetYaw+=velocity*dt;velocity*=Math.exp(-6*dt);}
    const k=reduced.matches?1:1-Math.exp(-9*dt);yaw+=(targetYaw-yaw)*k;pitch+=(targetPitch-pitch)*k;
    if(Math.abs(targetYaw-yaw)<.0001)yaw=targetYaw;if(Math.abs(targetPitch-pitch)<.0001)pitch=targetPitch;
    draw();if(playing||yaw!==targetYaw||pitch!==targetPitch||Math.abs(velocity)>.001)wake();
  }
  function resize(){width=stage.clientWidth;height=stage.clientHeight;if(model&&width&&height){model.resize(width,height);if(visible)draw();wake();}}
  function fallback(){
    stop();failed=true;playing=false;model?.dispose();model=null;
    delete section.dataset.emblemReady;delete section.dataset.emblemPending;section.dataset.globeFallback='';
    stage.hidden=true;toolbar.hidden=false;bottom.hidden=false;figures.forEach(f=>{f.removeAttribute('style');delete f.dataset.depth;});
    buttons.forEach(b=>{b.tabIndex=0;});
    copy();requestAnimationFrame(()=>window.ScrollTrigger?.refresh());
  }
  async function init(){
    if(started)return;started=true;copy();
    try{model=await window.createSportsGlobe(canvas);if(failed){model.dispose();model=null;return;}
      section.dataset.emblemReady='';delete section.dataset.emblemPending;logo.hidden=true;
      stage.hidden=toolbar.hidden=bottom.hidden=false;copy();resize();wake();
    }catch{fallback();}
  }
  $('[data-emblem-prev]').addEventListener('click',()=>select(selected-1));
  $('[data-emblem-next]').addEventListener('click',()=>select(selected+1));
  play.addEventListener('click',()=>{if(reduced.matches)return;playing=!playing;velocity=0;copy();wake();});
  action.addEventListener('click',pause);
  stage.addEventListener('pointerdown',e=>{
    if(!model||e.button!==0||drag)return;pause();
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,lastX:e.clientX,time:performance.now(),touch:e.pointerType==='touch',captured:false};
    if(!drag.touch){stage.setPointerCapture(e.pointerId);drag.captured=true;}
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(drag.touch&&!drag.captured){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>6){drag=null;return;}if(Math.abs(dx)<6)return;stage.setPointerCapture(e.pointerId);drag.captured=true;}
    const now=performance.now();velocity=clamp((e.clientX-drag.lastX)/Math.max(16,now-drag.time)*7,-2,2);
    targetYaw=drag.yaw+dx/Math.max(180,width*.33);targetPitch=clamp(drag.pitch+dy/Math.max(260,height*.7),-.75,.75);
    drag.lastX=e.clientX;drag.time=now;wake();
  });
  function release(e){if(!drag||drag.id!==e.pointerId)return;const id=drag.id;if(reduced.matches||e.type!=='pointerup'||performance.now()-drag.time>100)velocity=0;drag=null;if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);wake();}
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,e=>{
    // Touch starts with implicit capture on the canvas. Transferring capture to
    // the stage must not treat the canvas's bubbling loss event as a release.
    if(type==='lostpointercapture'&&e.target!==stage)return;
    release(e);
  }));
  section.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?2:selected+(e.key==='ArrowRight'?1:-1));});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});
  section.dataset.emblemPending='';stage.hidden=toolbar.hidden=bottom.hidden=false;copy();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){init();wake();}else stop();},{rootMargin:'150px'}).observe(section);
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():wake());
  new MutationObserver(()=>{modal=document.body.classList.contains('catalogue-ribbon-open');if(modal)stop();else wake();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',()=>{if(reduced.matches)pause();wake();});
  document.addEventListener('site:language-change',copy);
})();
