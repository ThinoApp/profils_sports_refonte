/* Approved schematic padel model. No manufacturer dimensions or performance claims.
   Loaded only near the Method section; independent of the catalogue renderer. */
window.createMethodModel = function createMethodModel(T) {
  const scene=new T.Scene();scene.background=new T.Color('#0d202c');
  const camera=new T.OrthographicCamera(-18,18,18,-18,.1,160);
  const ambient=new T.HemisphereLight(0xf1efe6,0x1b3042,1.8);scene.add(ambient);
  const key=new T.DirectionalLight(0xfff5df,2.6);key.position.set(-12,26,14);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:90});
  key.shadow.bias=-.0004;key.shadow.normalBias=.025;scene.add(key);
  const rim=new T.DirectionalLight(0xc1d6e4,1.2);rim.position.set(18,10,-15);scene.add(rim);
  const model=new T.Group();scene.add(model);
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.76,metalness:.08,...extra});
  const paper=material(0xc7c7b7), frameMat=material(0xe8e6db), floorMat=material(0x204352), signal=material(0xefe158);
  const hardwareMat=material(0x758891,{roughness:.45,metalness:.55});
  const plinthMat=material(0x77878a), rubberMat=material(0x112d39);
  const markingMat=material(0xefe158,{roughness:1,metalness:0});
  const lensMat=material(0xf3eed2,{emissive:0xefe158,emissiveIntensity:.18});
  lensMat.userData.lampLens=true;
  const glassMat=material(0x9cc0c7,{transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
  const lineMat=new T.LineBasicMaterial({color:0xefe158,transparent:true,opacity:.88});
  const meshMat=new T.LineBasicMaterial({color:0xbccfd0,transparent:true,opacity:.3});
  const foundation=new T.Group(),surface=new T.Group(),structure=new T.Group(),panels=new T.Group(),net=new T.Group(),lighting=new T.Group();
  model.add(foundation,surface,structure,panels,net,lighting);
  function box(parent,w,h,d,x,y,z,mat,edge=false){
    const geo=new T.BoxGeometry(w,h,d);const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);
    if(edge){const e=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:0x091521,transparent:true,opacity:.25}));m.add(e);}
    return m;
  }
  function lines(parent,coords,mat=lineMat){
    const g=new T.BufferGeometry().setFromPoints(coords.map(p=>new T.Vector3(...p)));
    const l=new T.LineSegments(g,mat);parent.add(l);return l;
  }
  // Shared geometry for small hardware: detail without a draw call per fixing.
  const batches=[];
  function detail(parent,mat,w,h,d,x,y,z){
    let batch=batches.find(b=>b.parent===parent&&b.mat===mat);
    if(!batch){batch={parent,mat,parts:[]};batches.push(batch);}
    batch.parts.push({w,h,d,x,y,z});
  }
  function foot(parent,x,z,y=.07){
    detail(parent,hardwareMat,.38,.07,.38,x,y,z);
    for(const dx of [-.13,.13])for(const dz of [-.13,.13])
      detail(parent,frameMat,.045,.055,.045,x+dx,y+.055,z+dz);
  }
  box(foundation,12.2,.42,22.2,0,-.27,0,paper,true);
  box(foundation,12.05,.12,22.05,0,-.52,0,plinthMat);
  // Subtle perimeter edge; no invented material stack or technical dimensions.
  for(const x of [-5.14,5.14])box(foundation,.16,.06,20.3,x,-.02,0,rubberMat);
  for(const z of [-10.14,10.14])box(foundation,10.44,.06,.16,0,-.02,z,rubberMat);
  box(surface,10.02,.10,20.02,0,0,0,floorMat);
  const markings=[[-5,.066,-10],[5,.066,-10],[5,.066,-10],[5,.066,10],[5,.066,10],[-5,.066,10],[-5,.066,10],[-5,.066,-10],
    [-5,.068,-7],[5,.068,-7],[-5,.068,7],[5,.068,7],[0,.068,-7],[0,.068,0],[0,.068,0],[0,.068,7]];
  for(let i=0;i<markings.length;i+=2){
    const a=markings[i],b=markings[i+1];
    box(surface,Math.max(.035,Math.abs(b[0]-a[0])),.006,Math.max(.035,Math.abs(b[2]-a[2])),(a[0]+b[0])/2,.058,(a[2]+b[2])/2,markingMat);
  }
  // The net remains legible as a dashed reference when vertical parts flatten.
  const netPlan=new T.Group();surface.add(netPlan);
  for(let x=-4.9;x<5;x+=.4)box(netPlan,.22,.008,.035,x,.064,0,frameMat);
  // Architectural study units, not published installation dimensions.
  for(const x of [-5,5]) for(const z of [-10,-7,-4,-1.3,1.3,4,7,10]) {
    box(structure,.12,3.1,.12,x,1.58,z,frameMat);
    foot(structure,x,z);
    detail(structure,hardwareMat,.17,.045,.17,x,3.16,z);
  }
  for(const x of [-5,5]) {
    box(structure,.09,.09,8.7,x,3.14,-5.65,frameMat);
    box(structure,.09,.09,8.7,x,3.14,5.65,frameMat);
    box(structure,.09,.09,8.7,x,.13,-5.65,frameMat);
    box(structure,.09,.09,8.7,x,.13,5.65,frameMat);
  }
  for(const z of [-10,10]){
    box(structure,10,.1,.1,0,3.14,z,frameMat);
    for(const x of [-2.5,0,2.5]){box(structure,.09,3.1,.09,x,1.58,z,frameMat);foot(structure,x,z);}
    for(const x of [-3.75,-1.25,1.25,3.75]){
      box(panels,2.38,2.9,.035,x,1.6,z,glassMat,true);
      for(const dx of [-1.13,1.13])for(const y of [.45,2.7])
        detail(panels,hardwareMat,.14,.12,.085,x+dx,y,z);
    }
  }
  for(const x of [-5,5]){
    for(const z of [-8.5,8.5]){
      box(panels,.035,2.9,2.87,x,1.6,z,glassMat,true);
      for(const dz of [-1.37,1.37])for(const y of [.45,2.7])
        detail(panels,hardwareMat,.085,.12,.14,x,y,z+dz);
    }
    for(const range of [[-7,-1.3],[1.3,7]]){
      const pts=[];
      for(let z=range[0];z<=range[1];z+=.33)pts.push([x,.15,z],[x,3.06,z]);
      for(let y=.15;y<3.1;y+=.33)pts.push([x,y,range[0]],[x,y,range[1]]);
      lines(panels,pts,meshMat);
      for(const y of [.15,3.06])box(panels,.055,.045,range[1]-range[0],x,y,(range[0]+range[1])/2,hardwareMat);
      box(panels,.05,.035,range[1]-range[0],x,1.6,(range[0]+range[1])/2,hardwareMat);
    }
  }
  for(const x of [-5,5]){
    box(net,.13,1.1,.13,x,.55,0,signal);foot(net,x,0);
    detail(net,hardwareMat,.18,.12,.18,x,1.08,0);
  }
  box(net,10,.075,.045,0,1.06,0,frameMat);
  box(net,10,.035,.035,0,.12,0,hardwareMat);
  const netPts=[];
  for(let x=-4.9;x<5;x+=.22)netPts.push([x,.12,0],[x,1.02,0]);
  for(let y=.12;y<1.02;y+=.18)netPts.push([-5,y,0],[5,y,0]);
  lines(net,netPts,meshMat);
  for(const x of [-5.55,5.55])for(const z of [-6.7,6.7]){
    box(lighting,.13,5.5,.13,x,2.75,z,frameMat);
    foot(lighting,x,z);
    box(lighting,.65,.1,.13,x-Math.sign(x)*.26,5.46,z,frameMat);
    const lamp=box(lighting,.65,.19,.5,x-Math.sign(x)*.5,5.35,z,hardwareMat);
    lamp.rotation.z=Math.sign(x)*.18;
    box(lamp,.56,.025,.41,0,-.11,0,lensMat);
    for(const dz of [-.13,0,.13])box(lamp,.5,.018,.026,0,-.127,dz,signal);
  }
  const detailMatrix=new T.Matrix4(),detailPosition=new T.Vector3(),detailScale=new T.Vector3(),detailRotation=new T.Quaternion();
  const detailGeometry=new T.BoxGeometry(1,1,1);
  batches.forEach(({parent,mat,parts})=>{
    const mesh=new T.InstancedMesh(detailGeometry,mat,parts.length);
    parts.forEach((p,i)=>{detailPosition.set(p.x,p.y,p.z);detailScale.set(p.w,p.h,p.d);detailMatrix.compose(detailPosition,detailRotation,detailScale);mesh.setMatrixAt(i,detailMatrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;parent.add(mesh);
  });
  // Quiet site grid and access markers tie the study to the current blueprint.
  const grid=new T.GridHelper(38,38,0x49606a,0x243a45);grid.position.y=-.59;grid.material.transparent=true;grid.material.opacity=.5;scene.add(grid);
  const ground=new T.Mesh(new T.PlaneGeometry(200,200),material(0x0d202c));ground.rotation.x=-Math.PI/2;ground.position.y=-.60;ground.receiveShadow=true;scene.add(ground);
  lines(foundation,[[-7,.01,-1],[-7,.01,1],[-7,.01,1],[-6.65,.01,.6],[7,.01,1],[7,.01,-1],[7,.01,-1],[6.65,.01,-.6]]);

  const groups={foundation,surface,structure,panels,net,lighting};
  // Isolate materials by lot so highlighting one part cannot recolor another.
  Object.values(groups).forEach(group=>{
    const copies=new Map();
    group.traverse(object=>{
      if(!object.material) return;
      const clone=m=>{if(!copies.has(m))copies.set(m,m.clone());return copies.get(m);};
      object.material=Array.isArray(object.material)?object.material.map(clone):clone(object.material);
    });
  });
  const spots=[];
  for(const x of [-5.55,5.55])for(const z of [-6.7,6.7]){
    const light=new T.SpotLight(0xfff4d5,0,24,Math.PI*.31,.65,2);
    light.position.set(x-Math.sign(x)*.5,5.22,z);
    light.target.position.set(0,.03,z*.66);
    light.castShadow=true;light.shadow.mapSize.set(512,512);
    light.shadow.bias=-.001;light.shadow.normalBias=.035;
    light.shadow.camera.near=.2;light.shadow.camera.far=24;
    lighting.add(light,light.target);spots.push(light);
  }
  function dispose(){
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{
      if(object.geometry)geometries.add(object.geometry);
      if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));
      if(object.isInstancedMesh)object.dispose();
      object.shadow?.dispose();
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    // Original shared material templates are no longer attached after isolation.
    [paper,frameMat,floorMat,signal,hardwareMat,plinthMat,rubberMat,markingMat,lensMat,glassMat,lineMat,meshMat].forEach(m=>m.dispose());
  }
  return {scene,camera,root:model,groups,ambient,key,rim,spots,netPlan,grid,dispose};
};
