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
  const descriptions=[
    ['Un espace dédié au jeu et à la convivialité.','A space for play and shared moments.','Quel espace souhaitez-vous aménager et pour quels joueurs ?','What space are you planning, and who will play there?'],
    ['Préparez votre espace de fitness à partir des équipements du catalogue.','Plan your fitness space with equipment from the catalogue.','Quels usages, quelle surface et quel public envisagez-vous ?','Which activities, floor area and users do you have in mind?'],
    ['Explorez le catalogue Padel pour préparer votre projet de terrain.','Explore the Padel catalogue to plan your court project.','Un nouveau terrain ou un site à faire évoluer ?','A new court or an existing site to develop?'],
    ['Imaginez la place du pickleball dans votre espace sportif.','Explore how pickleball could fit your sports space.','Disposez-vous déjà d’un terrain ou partez-vous d’un nouvel espace ?','Do you have an existing court or a new space in mind?'],
    ['Pensez un espace adapté à la pratique du pilates.','Plan a space suited to pilates.','Pratique individuelle ou cours collectifs : quels sont vos besoins ?','Individual practice or group classes: what do you need?'],
    ['Préparez votre projet de football, du lieu de pratique à son aménagement.','Plan your football project, from the playing space to its layout.','Pour une école, un club ou un espace en accès libre ?','For a school, a club or an open-access space?'],
    ['Imaginez un espace de pratique sportive en accès libre.','Imagine an open-access space for exercise.','Quel lieu, quels pratiquants et quels usages souhaitez-vous réunir ?','Which location, users and activities do you want to bring together?'],
    ['Définissez les besoins de votre futur espace de tennis.','Define what your future tennis space needs.','Création, aménagement ou entretien : où en est votre projet ?','A new court, improvements or maintenance: what stage is your project at?']
  ];
  const popup=document.createElement('aside');popup.className='globe-popup';popup.id='globe-popup';popup.hidden=true;
  popup.setAttribute('aria-labelledby','globe-popup-title');
  popup.innerHTML='<button type="button" class="globe-popup__close"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><h3 id="globe-popup-title"></h3><p class="globe-popup__description"></p><p class="globe-popup__question"></p><small></small><a class="globe-popup__action" rel="noreferrer"></a>';
  section.append(popup);
  let popupIndex=-1,closeTimer=0,suppressFocus=false,traceTime=0;
  const canvas=document.createElement('canvas');canvas.className='sports-globe';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
  const status=document.createElement('p');status.className='brand-emblem__status';status.setAttribute('role','status');section.append(status);
  let model=null,started=false,failed=false,visible=false,modal=false,raf=0,last=0;
  let width=1,height=1,yaw=0,targetYaw=0,pitch=-.12,targetPitch=-.12;
  let selected=2,playing=!reduced.matches,drag=null,velocity=0;
  const buttons=figures.map((figure,i)=>{
    const b=document.createElement('button');b.type='button';b.className='brand-emblem__node';figure.append(b);
    b.setAttribute('aria-controls','globe-popup');b.setAttribute('aria-expanded','false');
    b.addEventListener('click',e=>{showPopup(i);select(i);if(e.detail===0)popup.querySelector('a').focus();});
    b.addEventListener('focus',()=>{if(!suppressFocus)showPopup(i);});
    b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')showPopup(i);});
    figure.addEventListener('pointerleave',scheduleClose);return b;
  });
  function popupCopy(){
    if(popupIndex<0)return;
    const i=popupIndex,english=document.documentElement.lang==='en',row=rows.find(r=>r.dataset.catalogue===catalogues[i]),link=popup.querySelector('a');
    popup.querySelector('h3').textContent=names[i];
    popup.querySelector('.globe-popup__description').textContent=descriptions[i][english?1:0];
    popup.querySelector('.globe-popup__question').textContent=descriptions[i][english?3:2];
    popup.querySelector('small').textContent=row?text('À explorer : ','Explore: ')+row.querySelector('.catalogue-name').textContent+' · '+row.dataset.pages+text(' pages',' pages'):text('Échangeons sur votre projet','Let’s discuss your project');
    popup.querySelector('button').setAttribute('aria-label',text('Fermer la fiche','Close details'));
    if(row){link.dataset.catalogueTrigger=row.dataset.catalogue;link.href=row.href;link.target='_blank';link.textContent=text('Ouvrir le catalogue','Open catalogue')+' ↗';}
    else{delete link.dataset.catalogueTrigger;link.removeAttribute('target');link.href='mailto:contact@profilssports.com?subject='+encodeURIComponent(text('Projet ','Project ')+names[i]);link.textContent=text('Parler de ce projet','Discuss this project')+' ↗';}
  }
  function positionPopup(){
    if(popupIndex<0)return;
    const host=section.getBoundingClientRect(),anchor=figures[popupIndex].getBoundingClientRect();
    const w=popup.offsetWidth,h=popup.offsetHeight;
    const left=host.width<=720?(host.width-w)/2:anchor.right-host.left+12+w<host.width-16?anchor.right-host.left+12:anchor.left-host.left-w-12;
    popup.style.left=clamp(left,12,Math.max(12,host.width-w-12))+'px';
    popup.style.top=clamp(anchor.top-host.top,Math.max(90,-host.top+85),Math.max(90,Math.min(host.height-20,innerHeight-host.top-12)-h))+'px';
  }
  function showPopup(i){clearTimeout(closeTimer);popupIndex=i;velocity=0;targetYaw=yaw;targetPitch=pitch;popup.hidden=false;popupCopy();buttons.forEach((b,j)=>b.setAttribute('aria-expanded',String(i===j)));positionPopup();wake();}
  function hidePopup(restore=false){clearTimeout(closeTimer);const i=popupIndex;popupIndex=-1;popup.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(restore&&i>=0){suppressFocus=true;buttons[i].focus({preventScroll:true});suppressFocus=false;}wake();}
  function scheduleClose(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!modal&&!popup.contains(document.activeElement)&&!buttons.includes(document.activeElement))hidePopup();},300);}
  popup.addEventListener('pointerenter',()=>clearTimeout(closeTimer));popup.addEventListener('pointerleave',scheduleClose);
  popup.querySelector('button').addEventListener('click',()=>hidePopup(true));
  popup.querySelector('a').addEventListener('click',pause);
  section.addEventListener('focusout',()=>setTimeout(()=>{if(!modal&&!popup.contains(document.activeElement)&&!buttons.includes(document.activeElement))hidePopup();},0));
  document.addEventListener('pointerdown',e=>{if(!modal&&!popup.contains(e.target)&&!figures.some(f=>f.contains(e.target)))hidePopup();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popupIndex>=0&&!modal){e.preventDefault();hidePopup(true);}});
  window.addEventListener('resize',positionPopup);window.addEventListener('scroll',()=>{if(popupIndex>=0)positionPopup();},{passive:true});
  function copy(){
    const row=rows.find(r=>r.dataset.catalogue===catalogues[selected]);
    if(row){action.dataset.catalogueTrigger=row.dataset.catalogue;action.href=row.href;action.target='_blank';action.textContent=text('FEUILLETER ','BROWSE ')+row.querySelector('.catalogue-name').textContent+' ↗';}
    else {delete action.dataset.catalogueTrigger;action.removeAttribute('target');action.href='mailto:contact@profilssports.com?subject='+encodeURIComponent(text('Projet ','Project ')+names[selected]);action.textContent=text('PARLONS ','DISCUSS ')+names[selected]+' ↗';}
    figures.forEach((f,i)=>{f.toggleAttribute('data-active',i===selected);buttons[i].setAttribute('aria-pressed',String(i===selected));buttons[i].setAttribute('aria-label',text('Sélectionner ','Select ')+names[i]);});
    stage.setAttribute('aria-label',text('Globe des sports. Glissez pour tourner. Flèches pour choisir une discipline, Début pour recentrer.','Sports globe. Drag to rotate. Arrow keys select a discipline, Home resets the view.'));
    play.hidden=reduced.matches||failed;play.textContent=playing?'Ⅱ':'▷';
    play.setAttribute('aria-label',playing?text('Mettre les animations en pause','Pause animations'):text('Reprendre les animations','Resume animations'));
    $('[data-emblem-prev]').setAttribute('aria-label',text('Discipline précédente','Previous discipline'));
    $('[data-emblem-next]').setAttribute('aria-label',text('Discipline suivante','Next discipline'));
    status.textContent=failed?text('La vue 3D est indisponible. Choisissez une discipline ci-dessous.','The 3D view is unavailable. Choose a discipline below.'):!model?text('Préparation du globe…','Preparing the globe…'):'';
    status.hidden=!!model&&!failed;
    popupCopy();
  }
  function pause(){playing=false;velocity=0;copy();}
  function select(i){
    pause();selected=mod(i);const desired=-(selected-2)*Math.PI/4;
    targetYaw=yaw+Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw));targetPitch=0;copy();wake();
  }
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function wake(){if(model&&visible&&!modal&&!document.hidden&&!failed&&!raf)raf=requestAnimationFrame(render);}
  function draw(){
    model.draw(yaw,pitch,traceTime).forEach((p,i)=>{
      const scale=.7+(p.z+3)/6*.3,x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;
      const f=figures[i];f.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
      f.style.opacity=p.z<-.4?'.55':'1';f.style.zIndex=p.z<0?'1':'2';f.dataset.depth=p.z<0?'back':'front';
      f.style.visibility=p.occluded?'hidden':'visible';buttons[i].tabIndex=p.occluded?-1:0;
    });section.dataset.globeYaw=yaw.toFixed(3);
  }
  function render(time){
    raf=0;if(!visible||modal||document.hidden||failed)return;
    const dt=Math.min(last?(time-last)/1000:1/60,.05);last=time;
    if(playing&&!drag&&!reduced.matches){traceTime+=dt;if(popupIndex<0)targetYaw+=dt*.075;}
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
