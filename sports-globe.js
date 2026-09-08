/* Authored spherical sports geometry. Shares the site's local Three.js runtime. */
(() => {
  'use strict';
  window.createSportsGlobe = async (canvas) => {
    const T = window.THREE;
    if (!T) throw new Error('Three.js unavailable');
    const renderer = new T.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, .1, 40);
    camera.position.set(0, 0, 12.5);
    const shell = new T.Group(), core = new T.Group();
    scene.add(shell, core);
    const yellow = new T.MeshStandardMaterial({color:0xefe158, metalness:.42, roughness:.34});
    const pale = new T.MeshStandardMaterial({color:0xe7e6d9, metalness:.35, roughness:.42});
    const quiet = new T.MeshStandardMaterial({color:0x33535d, metalness:.45, roughness:.5});
    const line = new T.LineBasicMaterial({color:0xb5b48a, transparent:true, opacity:.22});
    scene.add(new T.HemisphereLight(0xe5f0f2,0x132738,2.1));
    const light = (color,intensity,x,y,z) => {const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);};
    light(0xfff3c9,3, -3,5,6);light(0x87c6e1,2,5,1,-3);light(0xffffff,1,0,-3,5);
    const v=(lon,lat,r=2.5)=>new T.Vector3(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon));
    const stroke=(points,material=yellow,radius=.009,parent=shell)=>{
      const curve=new T.CatmullRomCurve3(points);
      const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(16,points.length*2),radius,5,false),material);
      parent.add(mesh);return mesh;
    };
    const ring=(r,rx,rz,material,radius=.012)=>{
      const points=Array.from({length:129},(_,i)=>new T.Vector3(Math.cos(i/128*Math.PI*2)*r,0,Math.sin(i/128*Math.PI*2)*r));
      const mesh=stroke(points,material,radius);mesh.rotation.set(rx,0,rz);return mesh;
    };
    // Sparse meridians establish a globe; courts, not continents, supply its surface.
    for(let i=0;i<6;i++) {
      const p=Array.from({length:97},(_,j)=>v(i*Math.PI/3,j/96*Math.PI*2));
      shell.add(new T.Line(new T.BufferGeometry().setFromPoints(p),line));
    }
    [-.85,0,.85].forEach(lat=>shell.add(new T.Line(new T.BufferGeometry().setFromPoints(
      Array.from({length:129},(_,j)=>v(j/128*Math.PI*2,lat))),line)));
    ring(2.58,.16,.38,quiet,.018);
    // A travelling dart and a fading ribbon replace the static yellow orbit.
    const orbitRotation=new T.Euler(.42,0,-.38);
    const orbitPoint=a=>new T.Vector3(Math.cos(a)*2.82,0,Math.sin(a)*2.82).applyEuler(orbitRotation);
    const dartShape=new T.Shape();
    dartShape.moveTo(0,.2);dartShape.lineTo(-.085,-.11);dartShape.lineTo(0,-.055);dartShape.lineTo(.085,-.11);dartShape.closePath();
    const dart=new T.Mesh(new T.ExtrudeGeometry(dartShape,{depth:.028,bevelEnabled:false}),new T.MeshBasicMaterial({color:0xefe158,side:T.DoubleSide}));
    shell.add(dart);
    const trailPositions=new Float32Array(65*2*3),trailColors=new Float32Array(65*2*3),trailIndices=[];
    for(let i=0;i<65;i++)for(let j=0;j<2;j++){
      const color=new T.Color(0xefe158).multiplyScalar(Math.pow(1-i/64,1.8));color.toArray(trailColors,(i*2+j)*3);
      if(i<64&&j===0){const a=i*2;trailIndices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const trailGeometry=new T.BufferGeometry();trailGeometry.setAttribute('position',new T.BufferAttribute(trailPositions,3));trailGeometry.setAttribute('color',new T.BufferAttribute(trailColors,3));trailGeometry.setIndex(trailIndices);
    const trail=new T.Mesh(trailGeometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));trail.frustumCulled=false;shell.add(trail);
    const basis=new T.Matrix4();
    function trace(time){
      const a=time*.65,p=orbitPoint(a),tangent=orbitPoint(a+.001).sub(p).normalize(),normal=p.clone().normalize(),right=tangent.clone().cross(normal).normalize();
      basis.makeBasis(right,tangent,normal);dart.quaternion.setFromRotationMatrix(basis);dart.position.copy(p);
      for(let i=0;i<65;i++){
        const q=orbitPoint(a-i/64*.95),t=orbitPoint(a-i/64*.95+.001).sub(q).normalize(),side=t.cross(q.clone().normalize()).normalize().multiplyScalar(.019*(1-i/70));
        q.clone().add(side).toArray(trailPositions,i*6);q.sub(side).toArray(trailPositions,i*6+3);
      }
      trailGeometry.attributes.position.needsUpdate=true;
    }
    ring(2.71,-.58,.5,quiet,.022);
    function court(lon,lat,type) {
      const parent=new T.Group();shell.add(parent);
      // Each rectangle and marking is mapped onto the same sphere, not a flat tile.
      const path=coords=>stroke(coords.flatMap(([x,y],i)=>{
        if(!i)return [v(lon+x,lat+y)];
        const [a,b]=coords[i-1];return Array.from({length:9},(_,j)=>v(lon+a+(x-a)*(j+1)/9,lat+b+(y-b)*(j+1)/9));
      }),yellow,.009,parent);
      const rect=(x,y,w,h)=>path([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]);
      rect(-.43,-.31,.86,.62);path([[0,-.31],[0,.31]]);
      if(type==='court'){
        path([[-.43,-.22],[.43,-.22]]);path([[-.43,.22],[.43,.22]]);
        path([[-.22,-.22],[-.22,.22]]);path([[.22,-.22],[.22,.22]]);path([[-.22,0],[.22,0]]);
      }else{
        path(Array.from({length:49},(_,i)=>[Math.cos(i/48*Math.PI*2)*.115,Math.sin(i/48*Math.PI*2)*.115]));
        rect(-.43,-.15,.14,.3);rect(.29,-.15,.14,.3);
      }
    }
    [[-.93,.65,'court'],[.95,.63,'field'],[-1.12,-.54,'field'],[1.1,-.55,'court'],[2.4,.4,'court'],[-2.35,-.3,'field'],[3,.95,'field']].forEach(args=>court(...args));
    // Curved running lanes form an open cap instead of a solid globe skin.
    for(let lane=0;lane<4;lane++) {
      const p=Array.from({length:100},(_,i)=>v(-1.5+i/99*3,1.03+lane*.055));
      stroke(p,lane===0?yellow:quiet,.009);
    }
    const anchors=Array.from({length:8},(_,i)=>v((i-2)*Math.PI/4,[.18,-.43,.58,-.3,.35,-.5,.5,-.35][i],2.92));
    // Genuine bevelled logo contours, calculated away from the UI thread.
    let worker;
    try {
      const response=await fetch('assets/brand/profils-sports-emblem-contours.json');
      if(!response.ok)throw new Error('Logo contours unavailable');
      const contours=await response.json();
      const meshes=await new Promise((resolve,reject)=>{
        worker=new Worker('brand-emblem-worker.js');
        const timer=setTimeout(()=>{worker.terminate();reject(new Error('Logo geometry timed out'));},15000);
        worker.onmessage=({data})=>{clearTimeout(timer);data.error?reject(new Error(data.error)):resolve(data.meshes);};
        worker.onerror=()=>{clearTimeout(timer);reject(new Error('Logo geometry unavailable'));};
        worker.postMessage({contours});
      });
      meshes.forEach(data=>{
        const geometry=new T.BufferGeometry();
        geometry.setAttribute('position',new T.BufferAttribute(data.positions,3));
        geometry.setAttribute('normal',new T.BufferAttribute(data.normals,3));
        geometry.setIndex(new T.BufferAttribute(data.indices,1));
        core.add(new T.Mesh(geometry,data.color==='yellow'?yellow:pale));
      });
      core.scale.setScalar(.72);core.position.z=.35;
    } catch(error) {dispose();throw error;} finally {worker?.terminate();}
    function dispose(){
      const geometries=new Set(),materials=new Set();
      scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();
    }
    return {
      renderer,scene,shell,core,anchors,dispose,tracer:dart,
      resize(width,height){camera.aspect=width/height;camera.position.z=Math.max(11.2,12.8/camera.aspect);camera.updateProjectionMatrix();renderer.setSize(width,height,false);},
      draw(yaw,pitch,time=0){
        trace(time);
        shell.rotation.set(pitch,yaw,0,'YXZ');
        // Gimballed signature stays readable, with a small real parallax response.
        core.rotation.set(pitch*.18,Math.sin(yaw)*.14,-.055);
        shell.updateMatrixWorld();renderer.render(scene,camera);
        return anchors.map(a=>{const world=a.clone().applyMatrix4(shell.matrixWorld);const point=world.clone().project(camera);return {x:point.x,y:point.y,z:world.z,occluded:world.z<.35&&Math.hypot(world.x,world.y)<1.65};});
      }
    };
  };
})();
