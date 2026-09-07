/* Production Method controller: one model, five reversible stages.
   HTML and local stills remain the baseline if 3D cannot initialize. */
(() => {
  'use strict';
  const section=document.querySelector('#approach');
  const figure=section?.querySelector('#method-figure');
  if(!figure) return;
  const $=s=>section.querySelector(s);
  const buttons=[...section.querySelectorAll('[data-method-step]')];
  const canvas=$('.method-canvas'),fallback=$('[data-method-fallback]');
  const lightButton=$('[data-method-light]'),reset=$('[data-method-reset]');
  const scope=$('[data-method-scope]'),parts=$('[data-method-parts]');
  const status=$('[data-method-status]'),instructions=$('[data-method-instructions]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const abort=new AbortController();
  const listen=(node,event,handler,options={})=>node.addEventListener(event,handler,{...options,signal:abort.signal});
  const en=()=>document.documentElement.lang==='en';
  const text=(fr,eng)=>en()?eng:fr;
  const phases=[
    {fr:'Votre terrain / vue de dessus',en:'Your court / top view',image:'plan',cam:[0,36,.1],look:[0,0,0],span:27.5,volume:0,explode:0},
    {fr:'Les éléments de votre terrain',en:'The parts of your court',image:'engineering',cam:[25,22,30],look:[0,3.9,0],span:29.2,volume:1,explode:1},
    {fr:'Les travaux à prévoir',en:'Planning the work',image:'assembled',cam:[25,22,30],look:[0,2,0],span:27,volume:1,explode:.3},
    {fr:'Votre terrain prend forme',en:'Your court takes shape',image:'assembled',cam:[25,22,30],look:[0,1.6,0],span:26.2,volume:1,explode:0},
    {fr:'Les points à entretenir',en:'Maintenance checkpoints',image:'assembled',cam:[22,21,31],look:[0,1.6,0],span:26.2,volume:1,explode:0}
  ];
  const components=[
    {key:'surface',fr:'Surface',en:'Surface',point:[4.9,.1,8],
      careFr:'Surface de jeu et tracés : repérer les zones à examiner selon les préconisations du fabricant.',careEn:'Playing surface and markings: identify areas to inspect according to manufacturer guidance.',
      lotFr:'Sol et revêtement : prévoir leur installation avec celle de la structure et des équipements.',lotEn:'Ground and surface: plan their installation alongside the frame and equipment.'},
    {key:'structure',fr:'Ossature',en:'Frame',point:[-5,3,10],
      careFr:'Ossature et fixations : localiser les points de contrôle de la structure.',careEn:'Frame and fixings: locate the structure’s inspection points.',
      lotFr:'Structure porteuse : prévoir ses points de fixation au sol et aux parois.',lotEn:'Supporting frame: plan where it attaches to the ground and panels.'},
    {key:'panels',fr:'Parois',en:'Panels',point:[5,3,8.5],
      careFr:'Vitrages et grillages : repérer les parois et leurs attaches pour préparer une inspection.',careEn:'Glass and mesh: locate panels and their fixings to prepare an inspection.',
      lotFr:'Parois : identifier les éléments à coordonner avec l’ossature.',lotEn:'Panels: identify the elements to coordinate with the frame.'},
    {key:'net',fr:'Filet',en:'Net',point:[-5,1.1,0],
      careFr:'Filet et poteaux : distinguer l’équipement de jeu de la structure du terrain.',careEn:'Net and posts: distinguish playing equipment from the court structure.',
      lotFr:'Équipement de jeu : situer le filet et ses supports dans l’installation.',lotEn:'Playing equipment: locate the net and its supports within the installation.'},
    {key:'lighting',fr:'Éclairage',en:'Lighting',point:[-5.55,5.5,-6.7],
      careFr:'Projecteurs : allumez l’éclairage pour voir son effet sur la maquette. Cet aperçu ne permet pas de déterminer l’éclairage nécessaire à votre terrain.',careEn:'Floodlights: switch the lights on to see their effect on the model. This preview cannot determine the lighting your court needs.',
      lotFr:'Éclairage : prévoir la pose des projecteurs avec les autres travaux. La maquette ne fournit ni estimation de prix ni mesure de luminosité.',lotEn:'Lighting: plan the floodlight installation alongside the other work. The model provides neither a price estimate nor light-level measurements.'}
  ];
  const initial=new URLSearchParams(location.search);
  let active=({plan:0,exploded:1,assembled:3})[initial.get('variant')]??0;
  let selected='surface',lightsOn=false,visible=false,disposed=false,loading=false,failed=false;
  let engine=null,raf=0,last=0,transition=null,hoverTimer=0,partTour=null;
  let yaw=0,yawTarget=0,night=0,aspect=1,drag=null;
  const lookValues=[...phases[active].look];
  let span=phases[active].span;
  const highlights=Object.fromEntries(components.map(c=>[c.key,0]));
  const labels=components.map(component=>{
    const el=document.createElement('span');el.className='method-label';el.hidden=true;el.setAttribute('aria-hidden','true');figure.append(el);
    const button=document.createElement('button');button.type='button';button.dataset.methodPart=component.key;
    listen(button,'click',()=>choosePart(component.key));parts.append(button);
    return {component,el,button,w:0,h:0};
  });
  section.classList.add('method-enabled');
  const playable=()=>visible&&!document.hidden&&!document.body.classList.contains('catalogue-ribbon-open')&&!disposed;
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function wake(){if(engine&&playable()&&!raf)raf=requestAnimationFrame(render);}
  function copy(){
    buttons.forEach((b,i)=>{
      b.disabled=false;b.setAttribute('aria-expanded',String(i===active));
      b.setAttribute('aria-label',b.querySelector('.method-step__title').textContent);
      b.closest('.method-step').classList.toggle('is-active',i===active);
    });
    $('.method-steps').setAttribute('aria-label',text('Les cinq étapes de la méthode','The five stages of the method'));
    $('[data-method-view]').textContent=phases[active][en()?'en':'fr'];
    fallback.src='assets/method/'+phases[active].image+'.webp';
    fallback.alt=text('Maquette illustrative de padel — ','Illustrative padel model — ')+phases[active][en()?'en':'fr'];
    figure.setAttribute('aria-label',text('Maquette illustrative de padel','Illustrative padel model'));
    canvas.setAttribute('aria-label',text('Maquette 3D : flèches gauche et droite pour tourner, touche Début pour recentrer.','3D model: left and right arrows rotate, Home resets the view.'));
    lightButton.hidden=!engine;lightButton.disabled=active===0;
    lightButton.setAttribute('aria-pressed',String(lightsOn));
    lightButton.querySelector('span').textContent=text('Éclairage : ','Lighting: ')+(lightsOn?text('allumé','on'):text('éteint','off'));
    lightButton.title=active===0?text('Choisissez une autre étape pour essayer l’éclairage.','Select another stage to try the lights.'):text('Aperçu illustratif, pas une mesure de l’éclairage réel.','Illustrative preview, not a measurement of actual lighting.');
    reset.hidden=!engine;reset.textContent=text('Recentrer','Reset view');
    scope.hidden=![2,4].includes(active);
    parts.setAttribute('aria-label',text('Éléments de la maquette','Model components'));
    labels.forEach(({component,el,button})=>{
      el.textContent=component[en()?'en':'fr'];button.textContent=component[en()?'en':'fr'];
      button.setAttribute('aria-pressed',String(selected===component.key));
    });
    const part=components.find(c=>c.key===selected);
    $('[data-method-detail]').textContent=part[(active===2?'lot':'care')+(en()?'En':'Fr')];
    instructions.hidden=!engine;
    instructions.textContent=active===4?text('Sélectionnez un élément ci-dessous ou sur la maquette. Glissez pour faire tourner le terrain.','Select a component below or on the model. Drag to rotate the court.'):
      text('Glissez pour faire tourner le terrain. Au clavier : ← → pour tourner, Début pour recentrer.','Drag to rotate the court. Keyboard: ← → to rotate, Home to reset.');
    status.hidden=!failed;
    status.textContent=text('La vue interactive est indisponible. Parcourez les cinq étapes avec les images.','The interactive view is unavailable. Explore the five stages with the images.');
    measureLabels();
  }
  function measureLabels(){labels.forEach(l=>{const hidden=l.el.hidden;l.el.hidden=false;l.w=l.el.offsetWidth;l.h=l.el.offsetHeight;l.el.hidden=hidden;});}
  function choosePart(key){selected=key;partTour=null;copy();wake();}
  function snapshot(){
    return {cam:engine.camera.position.toArray(),look:[...lookValues],span,
      parts:Object.fromEntries(Object.entries(engine.groups).map(([key,g])=>[key,{y:g.position.y,s:g.scale.y}]))};
  }
  const offsets={foundation:0,surface:.9,structure:2.7,panels:5.2,net:2,lighting:6.7};
  const vertical=new Set(['structure','panels','net','lighting']);
  function target(i){
    const phase=phases[i];
    return {cam:phase.cam,look:phase.look,span:phase.span,
      parts:Object.fromEntries(Object.keys(offsets).map(key=>[key,{y:offsets[key]*phase.explode,s:vertical.has(key)?phase.volume:1}]))};
  }
  function transitionTo(i){
    if(!engine)return;
    transition={from:snapshot(),to:target(i),elapsed:0,build:i===3};
    yawTarget=0;wake();
  }
  function select(i){
    clearTimeout(hoverTimer);
    if(active===i)return;
    active=i;selected='surface';partTour=active===2&&!reduced.matches?{elapsed:0,index:0}:null;
    copy();transitionTo(i);
  }
  buttons.forEach((b,i)=>{
    listen(b,'click',()=>select(i));
    listen(b,'focus',()=>select(i));
    listen(b,'pointerenter',()=>{if(fine.matches)hoverTimer=setTimeout(()=>select(i),140);});
    listen(b,'pointerleave',()=>clearTimeout(hoverTimer));
    listen(b,'keydown',e=>{
      const offset={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];
      if(offset){e.preventDefault();buttons[(i+offset+5)%5].focus();}
      else if(e.key==='Home'||e.key==='End'){e.preventDefault();buttons[e.key==='Home'?0:4].focus();}
    });
  });
  listen(lightButton,'click',()=>{lightsOn=!lightsOn;copy();wake();});
  listen(reset,'click',()=>{yawTarget=0;wake();});
  listen(canvas,'keydown',e=>{
    if(!playable())return;
    if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){
      e.preventDefault();e.stopPropagation();yawTarget=e.key==='Home'?0:Math.max(-.45,Math.min(.45,yawTarget+(e.key==='ArrowLeft'?-.15:.15)));wake();
    }
  });
  listen(canvas,'pointerdown',e=>{if(e.button===0&&active!==0)drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:yawTarget,moved:false};});
  listen(canvas,'pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>7){drag=null;return;}
    if(Math.abs(dx)>5){drag.moved=true;canvas.setPointerCapture(e.pointerId);yawTarget=Math.max(-.45,Math.min(.45,drag.start+dx*.003));wake();}
  });
  function release(e){
    if(drag?.id!==e.pointerId)return;
    if(!drag.moved&&active===4&&engine){
      const r=canvas.getBoundingClientRect(),T=window.THREE,ray=new T.Raycaster();
      ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),engine.camera);
      const hit=ray.intersectObjects(components.map(c=>engine.groups[c.key]),true).find(h=>h.object.isMesh);
      if(hit){let node=hit.object;while(node&&node!==engine.root){const key=components.find(c=>engine.groups[c.key]===node)?.key;if(key){choosePart(key);break;}node=node.parent;}}
    }
    drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  }
  listen(canvas,'pointerup',release);
  listen(canvas,'pointercancel',()=>{drag=null;});
  listen(canvas,'lostpointercapture',()=>{drag=null;});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();fail();});
  listen(canvas,'webglcontextrestored',()=>{failed=false;loading=false;initialize();});
  function fail(){
    stop();transition=null;drag=null;engine?.dispose();engine?.renderer.dispose();engine=null;loading=false;failed=true;
    canvas.hidden=true;fallback.hidden=false;labels.forEach(l=>l.el.hidden=true);copy();
  }
  let modelPromise;
  function loadModel(){
    if(window.createMethodModel)return Promise.resolve();
    if(!modelPromise)modelPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='method-model.js?v=20260907-1';
      const timer=setTimeout(()=>reject(new Error('Model loading timeout')),8000);
      script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(new Error('Model unavailable'));};document.head.append(script);
    });
    return modelPromise;
  }
  async function initialize(){
    if(engine||loading||failed||disposed)return;
    loading=true;
    let renderer,model;
    try{
      if(!window.THREE)throw new Error('Three unavailable');
      await loadModel();if(disposed)return;
      const T=window.THREE;
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,fine.matches?2:1.5));
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
      model=window.createMethodModel(T);
      if(!fine.matches)model.key.shadow.mapSize.set(1024,1024);
      engine={...model,renderer,materials:[]};
      for(const {key} of components){
        const unique=new Set();model.groups[key].traverse(o=>{if(o.material?.isMeshStandardMaterial)unique.add(o.material);});
        unique.forEach(material=>engine.materials.push({key,material,color:material.color.clone(),emissive:material.emissive.clone(),intensity:material.emissiveIntensity}));
      }
      const dest=target(active);engine.camera.position.fromArray(dest.cam);lookValues.splice(0,3,...dest.look);span=dest.span;
      Object.entries(dest.parts).forEach(([key,p])=>{engine.groups[key].position.y=p.y;engine.groups[key].scale.y=Math.max(.001,p.s);});
      canvas.hidden=false;copy();resize();wake();
    }catch{model?.dispose();renderer?.dispose();engine=null;fail();}
    finally{loading=false;}
  }
  const ease=t=>1-Math.pow(1-t,4);
  const mix=(a,b,t)=>a+(b-a)*t;
  function resize(){
    const r=figure.getBoundingClientRect();aspect=r.width/r.height;
    if(engine)engine.renderer.setSize(r.width,r.height,false);
    measureLabels();wake();
  }
  function render(time){
    raf=0;if(!engine||!playable())return;
    const dt=Math.min(last?(time-last)/1000:1/60,.05);last=time;
    let moving=false;
    if(transition){
      transition.elapsed+=dt;
      const {from,to,elapsed,build}=transition;
      const progress=reduced.matches?1:Math.min(1,elapsed/(build?1.8:1.3));
      const t=ease(progress);
      engine.camera.position.set(...from.cam.map((n,i)=>mix(n,to.cam[i],t)));
      from.look.forEach((n,i)=>lookValues[i]=mix(n,to.look[i],t));span=mix(from.span,to.span,t);
      Object.keys(to.parts).forEach((key,i)=>{
        const lag=build?i*.09:0;
        const pt=ease(Math.max(0,Math.min(1,(progress-lag)/(1-lag))));
        engine.groups[key].position.y=mix(from.parts[key].y,to.parts[key].y,pt);
        engine.groups[key].scale.y=Math.max(.001,mix(from.parts[key].s,to.parts[key].s,pt));
      });
      if(progress===1)transition=null;else moving=true;
    }
    if(partTour){
      partTour.elapsed+=dt;
      const keys=['surface','structure','lighting'],i=Math.min(2,Math.floor(partTour.elapsed/1.4));
      if(i!==partTour.index){partTour.index=i;selected=keys[i];copy();}
      if(partTour.elapsed>4.2)partTour=null;else moving=true;
    }
    const follow=reduced.matches?1:1-Math.exp(-7*dt);
    yaw=mix(yaw,yawTarget,follow);if(Math.abs(yaw-yawTarget)>.0001)moving=true;
    engine.root.rotation.y=yaw;
    const desiredNight=lightsOn&&active!==0?1:0;
    night=mix(night,desiredNight,follow);
    if(Math.abs(night-desiredNight)>.001)moving=true;else night=desiredNight;
    engine.ambient.intensity=mix(1.8,.7,night);engine.key.intensity=mix(2.6,.7,night);engine.rim.intensity=mix(1.2,.42,night);
    engine.grid.material.opacity=mix(.5,.18,night);
    engine.spots.forEach(light=>light.intensity=night*110);
    const yellow=new window.THREE.Color(0xefe158);
    for(const {key} of components){
      const goal=[2,4].includes(active)&&selected===key?1:0;
      highlights[key]=mix(highlights[key],goal,follow);if(Math.abs(highlights[key]-goal)>.001)moving=true;
    }
    engine.materials.forEach(({key,material,color,emissive,intensity})=>{
      material.color.copy(color).lerp(yellow,highlights[key]*.32);
      if(material.userData.lampLens){material.emissive.set(0xffefb6);material.emissiveIntensity=night*3;}
      else{material.emissive.copy(emissive).lerp(yellow,highlights[key]*.2);material.emissiveIntensity=intensity+highlights[key]*.22;}
    });
    for(const key of vertical)engine.groups[key].visible=engine.groups[key].scale.y>.012;
    engine.netPlan.visible=engine.groups.net.scale.y<.3;
    const camera=engine.camera,half=Math.max(span/2,span/(2*aspect));
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
    camera.lookAt(...lookValues);camera.updateProjectionMatrix();camera.updateMatrixWorld();engine.root.updateMatrixWorld(true);
    placeLabels();
    engine.renderer.render(engine.scene,camera);fallback.hidden=true;
    if(moving)wake();else last=0;
  }
  function placeLabels(){
    const show=active===1&&!transition;
    labels.forEach(l=>l.el.hidden=!show);if(!show)return;
    const positions=labels.map(l=>{
      const pos=new window.THREE.Vector3(...l.component.point);engine.groups[l.component.key].localToWorld(pos);pos.project(engine.camera);
      return {l,x:Math.max(8,Math.min(figure.clientWidth-l.w-8,(pos.x*.5+.5)*figure.clientWidth+10)),y:Math.max(70,Math.min(figure.clientHeight-95,(-pos.y*.5+.5)*figure.clientHeight))};
    }).sort((a,b)=>a.y-b.y);
    const placed=[];
    positions.forEach(({l,x,y})=>{
      for(const other of placed)if(x<other.x+other.w+6&&x+l.w+6>other.x&&y<other.y+other.h+6&&y+l.h+6>other.y)y=other.y+other.h+6;
      placed.push({x,y,w:l.w,h:l.h});l.el.style.transform=`translate(${x}px,${y}px)`;
    });
  }
  const near=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){initialize();near.disconnect();}},{rootMargin:'400px'});
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else stop();});
  const resizer=new ResizeObserver(resize);
  const modal=new MutationObserver(()=>{if(playable())wake();else stop();});
  near.observe(figure);observer.observe(figure);resizer.observe(figure);modal.observe(document.body,{attributes:true,attributeFilter:['class']});
  listen(document,'visibilitychange',()=>{if(playable())wake();else stop();});
  listen(document,'site:language-change',()=>{copy();wake();});
  listen(reduced,'change',()=>{if(reduced.matches)partTour=null;wake();});
  listen(window,'pageshow',wake);
  listen(window,'pagehide',e=>{
    stop();if(e.persisted)return;
    disposed=true;clearTimeout(hoverTimer);abort.abort();near.disconnect();observer.disconnect();resizer.disconnect();modal.disconnect();engine?.dispose();engine?.renderer.dispose();
  });
  copy();
})();
