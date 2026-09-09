/* Menu-driven Solutions. No wheel capture, autoplay rotation or photo layer. */
(() => {
  'use strict';
  const section = document.querySelector('.solutions-studio');
  if (!section) return;
  const q = s => section.querySelector(s);
  const entries = [...section.querySelectorAll('.solution-entry')];
  const buttons = entries.map(e => e.querySelector('button'));
  const canvas = q('.solutions-canvas'), still = q('.solutions-still'), viewport = q('.solutions-viewport');
  const annotation = q('[data-solution-annotation]'), planButton = q('[data-solution-plan]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
  const en = () => document.documentElement.lang === 'en';
  const text = (fr, eng) => en() ? eng : fr;
  const components = {
    base: ['Support','Base','Un socle illustratif pour comprendre l’aménagement.','An illustrative base for understanding the layout.'],
    underlay: ['Sous-couche','Underlay','Coupe de principe : la composition réelle dépend du projet.','Conceptual section: the actual build-up depends on the project.'],
    surface: ['Surface de jeu','Playing surface','Sol souple ou gazon : des finitions à choisir selon les usages.','Resilient surfaces or turf: finishes selected for the intended activities.'],
    football: ['Terrain & buts','Pitch & goals','Aménagement du terrain et équipements de jeu.','Playing area layout and equipment.'],
    team: ['Équipements','Equipment','Paniers, poteaux et filet : plusieurs pratiques dans un même espace.','Hoops, posts and a net: different sports in a shared space.'],
    stands: ['Tribunes','Stands','Des places pour accueillir le public autour du terrain.','Seating for spectators around the playing area.'],
    access: ['Accès au terrain','Pitch access','Un passage entre les abords et l’espace de jeu.','A passage from the surroundings to the playing area.'],
    outdoor: ['Pratiques en plein air','Outdoor activities','Modules de workout et parcours de pumptrack illustratifs.','Illustrative workout modules and pumptrack.'],
    frame: ['Ossature','Frame','Poteaux, assemblages et charpente à coordonner.','Columns, connections and roof structure to coordinate.'],
    roof: ['Couverture','Roof','La coupe ouverte laisse voir les équipements à l’intérieur.','The open cutaway reveals the equipment inside.'],
    network: ['Vision d’ensemble','The whole project','Relier les usages, les équipements et l’aménagement du lieu.','Connecting activities, equipment and the site layout.']
  };
  const phaseParts = [['stands','access','football'],['team','surface'],['outdoor','surface'],['frame','roof'],['surface','underlay','base'],['frame','team','surface'],['surface','team','frame'],['network','frame','base']];
  let active = 0, engine = null, renderer = null, loading = false, failed = false;
  let visible = false, raf = 0, previous = 0, transition = null;
  let effect = 3, assemblyWait = 0, topView = false, pinned = '', hovered = '', annotationKey = '';
  let tilt = [0,0], targetTilt = [0,0], pointer = null, pointerDirty = false;
  let ray = null, aspect = 1, modelPromise, textMotion = null, annotationMotion = null;
  section.classList.add('solutions-enabled');
  const playable = () => visible && !document.hidden && !document.body.classList.contains('catalogue-ribbon-open');
  function stop() { cancelAnimationFrame(raf); raf = 0; previous = 0; }
  function wake() { if (engine && playable() && !raf) raf = requestAnimationFrame(render); }
  function updateCopy() {
    buttons.forEach((button, i) => {
      button.disabled = false; button.setAttribute('aria-expanded', String(i === active));
      entries[i].querySelector('p').hidden = i !== active;
    });
    const title = buttons[active].querySelector('strong').textContent;
    q('[data-solution-count]').textContent = `${String(active+1).padStart(2,'0')} / 08`;
    q('[data-solution-name]').textContent = title;
    still.src = `assets/solutions/${active}.png`;
    still.alt = text('Maquette illustrative — ', 'Illustrative model — ') + title;
    q('.solutions-menu').setAttribute('aria-label', text('Choisissez un métier', 'Choose a service'));
    q('[data-solution-parts]').setAttribute('aria-label', text('Explorer la maquette', 'Explore the model'));
    const oldFocus = document.activeElement?.dataset.solutionPart;
    q('[data-solution-parts]').replaceChildren(...phaseParts[active].map(key => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.solutionPart = key;
      button.textContent = components[key][en() ? 1 : 0]; button.setAttribute('aria-pressed', String(key === pinned));
      button.addEventListener('click', () => choosePart(pinned === key ? '' : key));
      return button;
    }));
    if (oldFocus && phaseParts[active].includes(oldFocus)) q(`[data-solution-part="${oldFocus}"]`)?.focus({preventScroll:true});
    planButton.hidden = !engine; planButton.setAttribute('aria-pressed', String(topView));
    const status = q('[data-solution-status]'); status.hidden = !failed;
    status.textContent = text('La 3D est indisponible. Les vues de la maquette et les huit métiers restent accessibles.', '3D is unavailable. Model views and all eight services remain available.');
    annotationKey = null; showAnnotation(pinned || hovered);
  }
  function showAnnotation(key) {
    if (key === annotationKey) return;
    annotationKey = key;
    annotationMotion?.cancel();
    if (!key) {
      if (annotation.hidden) return;
      if (reduced.matches) { annotation.hidden = true; return; }
      annotationMotion = annotation.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:150,easing:'ease-in',fill:'both'});
      annotationMotion.finished.then(()=>{if(!annotationKey)annotation.hidden=true;}).catch(()=>{});
      return;
    }
    const data = components[key]; annotation.replaceChildren();
    const title = document.createElement('strong'); title.textContent = data[en()?1:0];
    const detail = document.createElement('span'); detail.textContent = data[en()?3:2];
    annotation.append(title,detail); annotation.hidden = false;
    if (!reduced.matches) annotationMotion = annotation.animate([{opacity:0,translate:'0 9px'},{opacity:1,translate:'0 0'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  }
  function choosePart(key) {
    pinned = key;
    q('[data-solution-parts]').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.solutionPart===key)));
    showAnnotation(pinned || hovered); engine?.highlight(pinned || hovered); wake();
  }
  function target(index, explode = false) {
    const value = engine.destination(index, explode);
    if (topView) { value.camera = [0,60,.01]; value.look = [0,0,0]; }
    return value;
  }
  function moveTo(explode = false, duration = 1.25) {
    if (!engine) return;
    const from = engine.snapshot();
    transition = {from:from.state,fromPath:from.path,to:target(active,explode),toPath:engine.tracePaths[active],elapsed:0,duration,explode};
    if (explode) transition.toPath = transition.toPath.map((p,i)=>[p[0],p[1]+(i===3?6.5:i===2||i===4?3.6:0),p[2]]);
    if (reduced.matches) { engine.apply(target(active,active===5),engine.tracePaths[active]); transition=null; effect=3; }
    wake();
  }
  function select(index) {
    if (index===active && index!==5) return;
    active=index; pinned=hovered=''; assemblyWait=0; effect=0; targetTilt=[0,0];
    textMotion?.cancel(); updateCopy();
    if (!reduced.matches) textMotion=entries[index].querySelector('p').animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
    section.dataset.solutionActive=String(index);
    moveTo(index===5&&!reduced.matches);
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',event=>{
      const direction={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[event.key];
      let next=direction ? (index+direction+8)%8 : event.key==='Home'?0:event.key==='End'?7:null;
      if(next!==null){
        event.preventDefault();buttons[next].focus({preventScroll:true});select(next);
        if(innerWidth<=760){
          const rect=buttons[next].getBoundingClientRect(),bottom=q('.solutions-figure').getBoundingClientRect().bottom;
          if(rect.top<bottom+12)scrollBy({top:rect.top-bottom-12,behavior:reduced.matches?'instant':'smooth'});
          else if(rect.bottom>innerHeight)buttons[next].scrollIntoView({block:'end',behavior:reduced.matches?'instant':'smooth'});
        }
      }
    });
  });
  planButton.addEventListener('click',()=>{topView=!topView;assemblyWait=0;planButton.setAttribute('aria-pressed',String(topView));targetTilt=[0,0];moveTo(false,.9);});
  section.addEventListener('keydown',event=>{if(event.key==='Escape'){hovered='';choosePart('');}});
  canvas.addEventListener('pointermove',event=>{
    if(!fine.matches||reduced.matches)return;
    const rect=canvas.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width*2-1,y=(event.clientY-rect.top)/rect.height*2-1;
    targetTilt=topView?[0,0]:[x*.035,y*.026];pointer=[x,-y];pointerDirty=true;wake();
  },{passive:true});
  canvas.addEventListener('pointerleave',()=>{targetTilt=[0,0];pointer=null;hovered='';pointerDirty=false;showAnnotation(pinned);engine?.highlight(pinned);wake();});
  function loadModel() {
    if(window.createSolutionsModel)return Promise.resolve();
    if(!modelPromise)modelPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='solutions-model.js?v=20260909-1';
      const timer=setTimeout(()=>reject(new Error('Model timeout')),8000);
      script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(new Error('Model unavailable'));};document.head.append(script);
    });
    return modelPromise;
  }
  function fail() {
    stop(); transition=null;assemblyWait=0;effect=3;pointerDirty=false;
    engine?.dispose();renderer?.dispose();engine=renderer=null;loading=false;failed=true;
    canvas.hidden=true;still.hidden=false;section.removeAttribute('data-solutions-ready');updateCopy();
  }
  async function initialize() {
    if(engine||loading||failed)return;
    loading=true;
    try {
      if(!window.THREE)throw new Error('3D unavailable');
      await loadModel();const T=window.THREE;
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
      renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
      engine=window.createSolutionsModel(T,{compact:innerWidth<761});ray=new T.Raycaster();
      engine.apply(target(active,reduced.matches&&active===5),engine.tracePaths[active]); effect=3;
      canvas.hidden=false;updateCopy();resize();wake();
    } catch (_) { fail(); }
    finally {loading=false;}
  }
  function resize() {
    const rect=viewport.getBoundingClientRect();aspect=rect.width/Math.max(1,rect.height);
    renderer?.setSize(rect.width,rect.height,false);wake();
  }
  function render(now) {
    raf=0;if(!engine||!playable()){previous=0;return;}
    const dt=Math.min(previous?(now-previous)/1000:1/60,.05);previous=now;let moving=false;
    if(transition){
      transition.elapsed+=dt;const p=Math.min(1,transition.elapsed/transition.duration),ease=1-Math.pow(1-p,4);
      engine.interpolate(transition.from,transition.to,ease,transition.fromPath,transition.toPath);
      if(p===1){if(transition.explode)assemblyWait=.5;transition=null;effect=0;moving=!reduced.matches;}else moving=true;
    }else if(assemblyWait>0){assemblyWait-=dt;if(assemblyWait<=0)moveTo(false,1.5);moving=true;}
    else if(effect<2.8&&!reduced.matches){effect=Math.min(2.8,effect+dt);moving=true;}
    const follow=reduced.matches?1:1-Math.exp(-6*dt);
    tilt=tilt.map((value,i)=>{const n=value+(targetTilt[i]-value)*follow; if(Math.abs(n-targetTilt[i])>.00005)moving=true;return n;});
    engine.frame(aspect,tilt,active===6&&!transition&&!reduced.matches?Math.min(1,effect/2.8):0);
    engine.traceAt(reduced.matches?1:Math.min(1,effect/2.8));
    engine.pen.visible=!transition&&effect<2.8&&!reduced.matches;
    if(pointerDirty&&pointer&&!transition){
      pointerDirty=false;ray.setFromCamera(new window.THREE.Vector2(...pointer),engine.camera);
      const hits=ray.intersectObjects(phaseParts[active].map(key=>engine.parts[key]).filter(g=>g.visible),true);
      const hit=hits.find(h=>h.object.isMesh);let key='';
      if(hit){let obj=hit.object;while(obj&&obj!==engine.root){if(phaseParts[active].includes(obj.name)){key=obj.name;break;}obj=obj.parent;}}
      if(key!==hovered){hovered=key;showAnnotation(pinned||hovered);engine.highlight(pinned||hovered);}
    }
    if(pinned&&transition)engine.highlight(pinned);
    renderer.render(engine.scene,engine.camera);still.hidden=true;section.dataset.solutionsReady='';
    if(moving)wake();else previous=0;
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
  canvas.addEventListener('webglcontextrestored',()=>{failed=false;initialize();});
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible){initialize();wake();}else stop();
  });observer.observe(viewport);
  const preload=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){initialize();preload.disconnect();}},{rootMargin:'350px'});preload.observe(section);
  new ResizeObserver(resize).observe(viewport);
  new MutationObserver(()=>{if(playable())wake();else stop();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});
  document.addEventListener('site:language-change',updateCopy);
  reduced.addEventListener('change',()=>{targetTilt=tilt=[0,0];assemblyWait=0;effect=3;textMotion?.cancel();annotationMotion?.cancel();if(engine){transition=null;engine.apply(target(active,reduced.matches&&active===5),engine.tracePaths[active]);wake();}});
  updateCopy();section.dataset.solutionActive='0';
})();
