/* One illustrative architectural model, eight configurations. Study units only:
   neither construction drawings nor a manufacturer's material specification. */
window.createSolutionsModel = function createSolutionsModel(T, { compact = false } = {}) {
  const scene = new T.Scene();
  scene.background = null;
  const camera = new T.OrthographicCamera(-25, 25, 25, -25, .1, 180);
  const root = new T.Group(); scene.add(root);
  const ambient = new T.HemisphereLight(0xf1efe6, 0x20364b, 2.1); scene.add(ambient);
  const light = new T.DirectionalLight(0xfff4d8, 3.2); light.position.set(-18, 32, 18);
  light.castShadow = true; light.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048);
  Object.assign(light.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
  light.shadow.bias = -.0003; light.shadow.normalBias = .025; scene.add(light);
  const rim = new T.DirectionalLight(0xbedbef, 1.8); rim.position.set(18, 16, -20); scene.add(rim);
  const material = color => new T.MeshStandardMaterial({ color, roughness: .68, metalness: .18 });
  const mats = { base: material('#60747b'), rubber: material('#253d49'), field: material('#254756'), frame: material('#adb8b7'), seats: material('#708f97'), dark: material('#213b49'), yellow: material('#efe158') };
  const parts = {};
  for (const key of ['base', 'underlay', 'surface', 'football', 'team', 'stands', 'access', 'outdoor', 'frame', 'roof', 'lights', 'network']) {
    parts[key] = new T.Group(); parts[key].name = key; root.add(parts[key]);
  }
  function box(parent, size, pos, mat = mats.frame) {
    const mesh = new T.Mesh(new T.BoxGeometry(...size), mat);
    mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function line(parent, points, color = '#b8c7c7', opacity = 1, closed = false) {
    const geometry = new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p)));
    const mesh = new (closed ? T.LineLoop : T.Line)(geometry, new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    parent.add(mesh); return mesh;
  }
  function beam(parent, a, b, radius = .09, mat = mats.frame) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
    const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, delta.length(), 8), mat);
    mesh.position.copy(start).add(end).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  const rectangle = (x, z, y = .08) => [[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]];
  box(parts.base, [33, .8, 25], [0, -.9, 0], mats.base);
  box(parts.underlay, [31.8, .28, 23.8], [0, -.36, 0], mats.rubber);
  box(parts.surface, [31.2, .18, 23.2], [0, -.13, 0], mats.field);
  // Perimeter inset and pavement joints ground the model in architectural scale.
  line(parts.surface, rectangle(15.2, 11.2, -.015), '#718c91');
  for (let x = -15; x <= 15; x += 3) line(parts.base, [[x,-.48,-12.5],[x,-.48,-11.8]], '#243e48');
  line(parts.football, rectangle(12.4, 7.6), '#d0d6cd', 1, true);
  line(parts.football, [[0,.08,-7.6],[0,.08,7.6]]);
  line(parts.football, Array.from({length:97}, (_, i) => [2.1*Math.cos(i/96*Math.PI*2),.08,2.1*Math.sin(i/96*Math.PI*2)]));
  for (const side of [-1, 1]) {
    line(parts.football, [[side*12.4,.08,-3.8],[side*8.8,.08,-3.8],[side*8.8,.08,3.8],[side*12.4,.08,3.8]]);
    for (const z of [-2.1,2.1]) { beam(parts.football,[side*12.4,.1,z],[side*12.4,2.35,z],.07); beam(parts.football,[side*12.4,2.35,z],[side*13.5,.1,z],.045); }
    beam(parts.football,[side*12.4,2.35,-2.1],[side*12.4,2.35,2.1],.07);
    for (let z=-2.1;z<=2.1;z+=.3) line(parts.football,[[side*12.4,2.3,z],[side*13.5,.15,z]],'#879ea1',.5);
  }
  // Seats are instanced: hundreds of recognisable details, four draw calls.
  const seatMatrices = [], backMatrices = [], helper = new T.Object3D();
  for (const side of [-1, 1]) for (let row = 0; row < 5; row++) {
    const z = side*(9.1+row*.75), y=.25+row*.48;
    box(parts.stands,[27,.46,.85],[0,y,z],mats.dark);
    for (let column = 0; column < 26; column++) {
      const x = -12.5+column;
      helper.position.set(x,y+.32,z); helper.scale.set(.72,.13,.55); helper.rotation.set(0,0,0); helper.updateMatrix(); seatMatrices.push(helper.matrix.clone());
      helper.position.set(x,y+.60,z+side*.25); helper.scale.set(.72,.53,.10); helper.updateMatrix(); backMatrices.push(helper.matrix.clone());
    }
    for (const x of [-14,14]) box(parts.stands,[1.1,.46,.9],[x,y,z],mats.base);
  }
  for (const matrices of [seatMatrices, backMatrices]) {
    const seats = new T.InstancedMesh(new T.BoxGeometry(1,1,1),mats.seats,matrices.length);
    matrices.forEach((matrix,i)=>seats.setMatrixAt(i,matrix)); seats.castShadow=true; seats.receiveShadow=true; parts.stands.add(seats);
  }
  // An open entrance tunnel; no opaque plaque disguising the model.
  for (const z of [-1.8,1.8]) box(parts.access,[4,2.6,.18],[-16,1.3,z],mats.dark);
  box(parts.access,[4,.2,3.8],[-16,2.7,0],mats.base);
  for(const x of [-18,-16,-14]) line(parts.access,[[x,.1,-1.8],[x,2.8,-1.8],[x,2.8,1.8],[x,.1,1.8]],'#b8c7c7');
  for(const x of [-17.5,-16,-14.5]) line(parts.access,[[x,.04,-.35],[x+.35,.04,0],[x,.04,.35]],'#efe158');

  // Team games: basketball ends and a central volleyball net.
  line(parts.team,rectangle(11,6.3), '#c4cfc8',1,true);
  for (const side of [-1,1]) {
    beam(parts.team,[side*11.8,.1,0],[side*11.8,3.5,0],.10);
    beam(parts.team,[side*11.8,3.5,0],[side*10.5,3.5,0],.10);
    box(parts.team,[.10,1.05,1.85],[side*10.5,3.5,0],mats.frame);
    const hoop=new T.Mesh(new T.TorusGeometry(.34,.04,6,24),mats.yellow); hoop.rotation.x=Math.PI/2;hoop.position.set(side*10,3.15,0);parts.team.add(hoop);
    line(parts.team,[[side*11,.08,-2.2],[side*7.5,.08,-2.2],[side*7.5,.08,2.2],[side*11,.08,2.2]],'#a2b7b8');
  }
  for(const z of [-6.7,6.7])beam(parts.team,[0,.1,z],[0,2.7,z],.07,mats.frame);
  beam(parts.team,[0,2.55,-6.7],[0,2.55,6.7],.035,mats.frame);
  for(let z=-6.5;z<6.6;z+=.4)line(parts.team,[[0,1.5,z],[0,2.55,z]],'#89a6ae',.65);
  for(let y=1.5;y<2.6;y+=.24)line(parts.team,[[0,y,-6.7],[0,y,6.7]],'#89a6ae',.65);

  // Outdoor equipment and a genuinely undulating rideable-looking ribbon.
  for(const x of [-10,-7,-4])for(const z of [-3,0,3]) {
    beam(parts.outdoor,[x,.1,z],[x,3.4+(z===0?.4:0),z],.11,mats.frame);
    box(parts.outdoor,[.5,.1,.5],[x,.12,z],mats.base);
  }
  for(const z of [-3,0,3])beam(parts.outdoor,[-10,3.4,z],[-4,3.4,z],.08,mats.frame);
  for(let z=-3;z<=3;z+=.6)beam(parts.outdoor,[-7,3.4,z],[-4,3.4,z],.055,mats.frame);
  const pumpPositions=[], pumpIndices=[];
  for(let i=0;i<=128;i++)for(const offset of [-.8,.8]){
    const angle=i/128*Math.PI*2;
    pumpPositions.push(5.2+(5.7+offset)*Math.cos(angle),.38+.48*(1+Math.sin(angle*3)),(4.7+offset)*Math.sin(angle));
    if(i<128&&offset<0){const j=i*2;pumpIndices.push(j,j+2,j+1,j+1,j+2,j+3);}
  }
  const pumpGeo=new T.BufferGeometry();pumpGeo.setAttribute('position',new T.Float32BufferAttribute(pumpPositions,3));pumpGeo.setIndex(pumpIndices);pumpGeo.computeVertexNormals();
  const pump=new T.Mesh(pumpGeo,mats.dark);pump.material=mats.dark.clone();pump.material.side=T.DoubleSide;pump.receiveShadow=true;pump.castShadow=true;parts.outdoor.add(pump);
  for(const offset of [-.8,.8])line(parts.outdoor,Array.from({length:129},(_,i)=>{const a=i/128*Math.PI*2;return [5.2+(5.7+offset)*Math.cos(a),.4+.48*(1+Math.sin(a*3)),(4.7+offset)*Math.sin(a)];}),'#8fa6ac');

  // An architectural cutaway canopy makes the gymnasium interior visible.
  for(const x of [-14,-7,0,7,14]) {
    for(const z of [-9,9]) { beam(parts.frame,[x,.02,z],[x,6.8,z],.14);box(parts.frame,[.65,.14,.65],[x,.08,z],mats.base); }
    for(const z of [-9,9]) { beam(parts.frame,[x,6.8,z],[x,8.4,0],.13);beam(parts.frame,[x,6.6,z],[x,6.6,0],.075); }
    beam(parts.frame,[x,6.6,0],[x,8.4,0],.06);
    for(const z of [-6,-3,3,6]) beam(parts.frame,[x,6.6,z],[x,8.4-Math.abs(z)*1.6/9,z],.055);
  }
  for(const z of [-9,0,9])beam(parts.frame,[-14,z===0?8.4:6.8,z],[14,z===0?8.4:6.8,z],.11);
  // Only the far roof slope is clad; the open near half is a deliberate cutaway.
  const roofGeo=new T.BufferGeometry();roofGeo.setAttribute('position',new T.Float32BufferAttribute([-14.5,6.9,-9.5,14.5,6.9,-9.5,14.5,8.6,0,-14.5,8.6,0],3));roofGeo.setIndex([0,2,1,0,3,2]);roofGeo.computeVertexNormals();
  const roof=new T.Mesh(roofGeo,mats.dark.clone());roof.material.side=T.DoubleSide;roof.castShadow=true;parts.roof.add(roof);
  for(let x=-14;x<=14;x+=1)line(parts.roof,[[x,6.95,-9.5],[x,8.65,0]],'#6b8089',.75);
  for(const x of [-14,14])for(const z of [-9,9]) {
    beam(parts.lights,[x,.1,z],[x,8.2,z],.1);
    box(parts.lights,[1.4,.4,.55],[x,8.25,z],mats.base);
    box(parts.lights,[1.2,.07,.4],[x,8.0,z],mats.frame);
  }
  // Blueprint links sit within the maquette, not over the site's other sections.
  for(const target of [[-14,0,-9],[14,0,-9],[14,0,9],[-14,0,9],[0,0,0]]) {
    line(parts.network,[target,[target[0],4,target[2]],[0,7,0]],'#efe158');
    const node=new T.Mesh(new T.SphereGeometry(.18,12,8),mats.yellow);node.position.set(target[0],4,target[2]);parts.network.add(node);
  }
  const grid=new T.GridHelper(60,30,0x36515e,0x1c3442);grid.position.y=-1.36;grid.material.transparent=true;grid.material.opacity=.48;scene.add(grid);
  const ground=box(scene,[200,.1,200],[0,-1.48,0],new T.ShadowMaterial({opacity:.26}));ground.castShadow=false;

  // Independent material sets allow one component to fade/highlight without
  // changing another that uses the same source material.
  const entries = {};
  Object.entries(parts).forEach(([key,group])=>{
    const clones=new Map();const edges=[];
    group.traverse(object=>{
      if(!object.material)return;
      const source=object.material;
      if(!clones.has(source)){const copy=source.clone();clones.set(source,copy);}
      object.material=clones.get(source);
      if(object.isMesh&&!object.isInstancedMesh){
        const edge=new T.LineSegments(new T.EdgesGeometry(object.geometry,30),new T.LineBasicMaterial({color:0x829ca5,transparent:true,opacity:0}));
        object.add(edge);edges.push(edge);
      }
    });
    entries[key]={group,materials:[...clones.values()].map(m=>({m,color:m.color.clone(),opacity:m.opacity})),edges};
  });
  const state = (visible, options={}) => ({
    parts:Object.fromEntries(Object.keys(parts).map(key=>[key,{p:[0,0,0],s:[1,1,1],o:visible.includes(key)?1:0}])),
    camera:[32,28,34],look:[0,1.3,0],span:40,wire:0,...options
  });
  const base=['base','underlay','surface'];
  const states=[
    state([...base,'football','stands','access','lights']),
    state([...base,'team'],{camera:[30,28,36],span:37}),
    state([...base,'outdoor'],{camera:[31,31,33],span:37}),
    state([...base,'team','frame','roof'],{camera:[31,23,34],look:[0,3,0],span:41}),
    state(base,{camera:[33,14,32],look:[0,2.5,0],span:39}),
    state([...base,'team','frame','roof'],{camera:[33,28,35],look:[0,3,0],span:43}),
    state([...base,'team','frame'],{camera:[30,27,33],look:[0,2.5,0],span:40}),
    state([...base,'team','frame','network'],{camera:[28,34,32],look:[0,2,0],span:40,wire:1})
  ];
  states[4].parts.underlay.p[1]=1.8;states[4].parts.surface.p[1]=4.1;
  const exploded=structuredClone(states[5]);
  exploded.parts.surface.p[1]=1.6;exploded.parts.team.p[1]=3;exploded.parts.frame.p[1]=3.6;exploded.parts.roof.p[1]=6.5;exploded.look=[0,4,0];exploded.span=46;

  const scan=new T.Mesh(new T.PlaneGeometry(23,8),new T.MeshBasicMaterial({color:0xefe158,transparent:true,opacity:.10,side:T.DoubleSide,depthWrite:false}));
  scan.rotation.y=Math.PI/2;scan.position.set(-14,3,0);root.add(scan);scan.visible=false;
  // One physical yellow thread uses the same vertices through every state.
  const tracePaths=[
    [[-18,.2,0],[-14,.2,0],[-12,.2,8],[0,2.8,12],[12,2.8,12],[14,.2,0]],
    [[-12,.2,0],[-10,3.5,0],[-5,.2,0],[0,2.7,0],[7,.2,0],[11,3.4,0]],
    [[-12,.2,-4],[-10,3.5,-3],[-4,3.5,0],[1,1,0],[5,1,5],[11,1,0]],
    [[-14,.2,9],[-14,6.8,9],[-7,8.4,0],[0,8.4,0],[7,8.4,0],[14,6.8,9]],
    [[-15,-.3,-10],[-15,1.7,-10],[-15,4.1,-10],[0,4.15,-10],[15,4.15,-10],[15,4.15,9]],
    [[-15,-.3,9],[-14,.2,9],[-14,6.8,9],[0,8.5,0],[14,6.8,9],[14,.2,9]],
    [[-14,.2,9],[-10,.2,4],[0,.2,0],[0,2.7,0],[14,6.8,9],[14,.2,9]],
    [[-14,.2,-9],[-14,4,-9],[0,7,0],[14,4,9],[14,.2,9],[0,.2,0]]
  ];
  const curve=new T.CatmullRomCurve3(tracePaths[0].map(p=>new T.Vector3(...p)),false,'catmullrom',.15);
  const traceGeo=new T.TubeGeometry(curve,80,.045,5,false);
  const trace=new T.Mesh(traceGeo,new T.MeshBasicMaterial({color:0xefe158}));root.add(trace);
  const pen=new T.Mesh(new T.SphereGeometry(.13,12,8),new T.MeshBasicMaterial({color:0xf2e77a}));root.add(pen);
  let current=structuredClone(states[0]),pathNow=tracePaths[0].map(p=>[...p]),plan=false;
  const mix=(a,b,t)=>a+(b-a)*t;
  const point=new T.Vector3(),tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),up=new T.Vector3(0,1,0);
  function drawTrace(){
    curve.points.forEach((p,i)=>p.fromArray(pathNow[i]));
    const positions=traceGeo.attributes.position.array,normals=traceGeo.attributes.normal.array;
    for(let i=0;i<=80;i++){
      curve.getPoint(i/80,point);curve.getTangent(i/80,tangent);normal.crossVectors(tangent,up);
      if(normal.lengthSq()<.001)normal.set(1,0,0);normal.normalize();binormal.crossVectors(tangent,normal).normalize();
      for(let j=0;j<=5;j++){
        const a=j/5*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=(i*6+j)*3;
        for(let axis=0;axis<3;axis++){const n=normal.getComponent(axis)*c+binormal.getComponent(axis)*s;positions[k+axis]=point.getComponent(axis)+n*.045;normals[k+axis]=n;}
      }
    }
    traceGeo.attributes.position.needsUpdate=true;traceGeo.attributes.normal.needsUpdate=true;traceGeo.computeBoundingSphere();
  }
  function apply(value,path,highlight='') {
    current=value;pathNow=path;
    Object.entries(entries).forEach(([key,{group,materials,edges}])=>{
      const part=value.parts[key];
      group.position.fromArray(part.p);group.scale.set(...part.s.map(n=>Math.max(.001,n)));group.visible=part.o>.005;
      materials.forEach(({m,color,opacity})=>{
        m.color.copy(color);if(key===highlight)m.color.lerp(mats.yellow.color,.55);
        m.opacity=opacity*part.o*(value.wire&&m.isMeshStandardMaterial?1-value.wire*.76:1);
        m.transparent=m.opacity<.995;m.depthWrite=m.opacity>.4;
      });
      edges.forEach(edge=>{edge.material.opacity=part.o*value.wire*.65;edge.visible=edge.material.opacity>.005;});
    });
    drawTrace();
  }
  function interpolate(from,to,t,fromPath,toPath){
    const value={parts:{},camera:[],look:[],span:mix(from.span,to.span,t),wire:mix(from.wire,to.wire,t)};
    for(const key of Object.keys(parts)){
      const a=from.parts[key],b=to.parts[key];
      // Hidden modules sink into the same plinth instead of popping away.
      value.parts[key]={p:a.p.map((n,i)=>mix(n,b.p[i],t)),s:a.s.map((n,i)=>mix(n,b.s[i],t)),o:mix(a.o,b.o,t)};
    }
    value.camera=from.camera.map((n,i)=>mix(n,to.camera[i],t));value.look=from.look.map((n,i)=>mix(n,to.look[i],t));
    apply(value,fromPath.map((p,i)=>p.map((n,j)=>mix(n,toPath[i][j],t))));
  }
  function destination(index,explode=false){
    const value=structuredClone(explode?exploded:states[index]);
    for(const [key,part]of Object.entries(value.parts))if(!part.o){part.p[1]=-2;part.s[1]=.025;}
    return value;
  }
  function frame(aspect,tilt=[0,0],inspection=0){
    root.rotation.y=tilt[0];root.rotation.x=tilt[1];
    const half=Math.max(current.span/2,current.span/(2*aspect));
    Object.assign(camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
    camera.position.fromArray(plan?[0,60,.01]:current.camera);camera.lookAt(...(plan?[0,0,0]:current.look));camera.updateProjectionMatrix();camera.updateMatrixWorld();root.updateMatrixWorld(true);
    scan.visible=inspection>0&&inspection<1;scan.position.x=-15+30*inspection;
  }
  function dispose(){
    const gs=new Set(),ms=new Set(Object.values(mats));
    scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);o.shadow?.dispose();if(o.isInstancedMesh)o.dispose();});
    gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());
  }
  apply(destination(0),tracePaths[0]);
  return {scene,camera,root,parts,scan,pen,trace,states,tracePaths,destination,apply,interpolate,frame,dispose,
    snapshot:()=>({state:structuredClone(current),path:pathNow.map(p=>[...p])}),
    highlight:key=>apply(current,pathNow,key),
    setPlan:value=>{plan=value;},
    traceAt:p=>{curve.getPoint(p,pen.position);}
  };
};
