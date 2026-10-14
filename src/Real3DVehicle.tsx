import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ALLOWED_CC0_GARAGE_MODELS } from './garageConceptAssets';

type VehicleKind='sedan'|'mpv'|'suv'|'van';
export type PaintTone='champagne'|'pearl'|'obsidian'|'forest';
export type StudioMood='daylight'|'golden-hour';

type Props={
 category:string;
 paint:PaintTone;
 mood:StudioMood;
 progress:number;
 modelUrl?:string;
 conceptUrl?:string;
 onUnavailable?:()=>void;
 autoRotate?:boolean;
 doorsOpen?:boolean;
 zoom?:number;
 reducedMotion?:boolean;
 viewPreset?:'hero'|'front'|'side'|'rear';
};

const paintValues:Record<PaintTone,number>={
 champagne:0xb69b74,
 pearl:0xe6e3db,
 obsidian:0x1a2726,
 forest:0x294e3f
};
const classOf=(category:string):VehicleKind=>{
 const x=category.toLowerCase();
 return x.includes('traveller')||x.includes('van')?'van':
   x.includes('suv')?'suv':
   x.includes('mpv')?'mpv':'sedan';
};
type VehicleParts={vehicle:THREE.Group;wheels:THREE.Group[];paint:THREE.MeshPhysicalMaterial;doors:THREE.Group[]};
function createVehicle(kind:VehicleKind,color:number):VehicleParts {
 const vehicle=new THREE.Group();
 const dims={
  sedan:{length:4.65,width:1.74,roof:1.43,base:.80,wheelbase:3.05},
  mpv:{length:4.75,width:1.84,roof:1.73,base:.85,wheelbase:3.15},
  suv:{length:4.92,width:1.96,roof:1.85,base:.98,wheelbase:3.24},
  van:{length:5.30,width:1.99,roof:2.27,base:1.08,wheelbase:3.55}
 }[kind];
 const half=dims.width/2;
 const paint=new THREE.MeshPhysicalMaterial({color,metalness:.55,roughness:.19,clearcoat:1,clearcoatRoughness:.14});
 const glass=new THREE.MeshPhysicalMaterial({color:0x182d32,metalness:.16,roughness:.11,clearcoat:1,transparent:true,opacity:.91,side:THREE.DoubleSide});
 const rubber=new THREE.MeshStandardMaterial({color:0x0c1517,metalness:.06,roughness:.89});
 const dark=new THREE.MeshPhysicalMaterial({color:0x151d20,metalness:.34,roughness:.32});
 const chrome=new THREE.MeshStandardMaterial({color:0xcbd1cd,metalness:.87,roughness:.18});
 const warm=new THREE.MeshStandardMaterial({color:0xffe7ad,emissive:0xf9d292,emissiveIntensity:1.6,roughness:.16});
 const red=new THREE.MeshStandardMaterial({color:0xb82b21,emissive:0xa52318,emissiveIntensity:.65});
 const add=(geo:THREE.BufferGeometry,mat:THREE.Material,xyz:[number,number,number],target=vehicle)=>{
  const obj=new THREE.Mesh(geo,mat);obj.position.set(...xyz);obj.castShadow=true;obj.receiveShadow=true;target.add(obj);return obj;
 };
 const box=(size:[number,number,number],mat:THREE.Material,xyz:[number,number,number])=>
   add(new THREE.BoxGeometry(...size),mat,xyz);

 // Curved coachwork, true extruded 3D mesh — not a photo or plane.
 const silhouette=new THREE.Shape();
 const L=dims.length/2;
 silhouette.moveTo(-L+.19,.29);
 silhouette.lineTo(-L,.42);
 silhouette.quadraticCurveTo(-L+.02,dims.base-.18,-L+.32,dims.base-.11);
 silhouette.lineTo(-L+.80,dims.base+.06);
 silhouette.lineTo(L-.75,dims.base+.06);
 silhouette.quadraticCurveTo(L-.22,dims.base+.04,L-.09,dims.base-.14);
 silhouette.lineTo(L,.42);
 silhouette.lineTo(L-.21,.29);
 silhouette.closePath();
 const chassis=new THREE.ExtrudeGeometry(silhouette,{depth:dims.width-.11,steps:1,bevelEnabled:true,bevelThickness:.075,bevelSize:.10,bevelSegments:3,curveSegments:12});
 chassis.rotateY(Math.PI/2);
 const base=add(chassis,paint,[-(dims.width-.11)/2,0,0]);
 base.castShadow=true;

 // Model-specific roof proportions. Deliberately unbranded concept vehicle.
 const cabin=new THREE.Shape();
 const front=kind==='van'?L-.65:kind==='mpv'?L-.75:kind==='suv'?L-.98:L-1.00;
 const back=kind==='van'?-L+.43:kind==='mpv'?-L+.52:-L+.96;
 const upper=kind==='van'?dims.roof-.08:dims.roof-.06;
 cabin.moveTo(back,dims.base-.04);
 cabin.lineTo(back+.27,upper);
 cabin.lineTo(front-.35,upper);
 cabin.lineTo(front,dims.base-.04);
 cabin.closePath();
 const roofGeom=new THREE.ExtrudeGeometry(cabin,{
  depth:dims.width-.26,steps:1,bevelEnabled:true,bevelThickness:.055,bevelSize:.047,bevelSegments:3
 });
 roofGeom.rotateY(Math.PI/2);
 add(roofGeom,paint,[-(dims.width-.26)/2,0,0]);

 // Windscreens are actual sloped glazing panels in 3D, not an opaque
 // extrusion viewed from the front/rear. Neither has a number plate.
 const pane=(corners:[number,number,number][],material:THREE.Material)=>{
   const g=new THREE.BufferGeometry();
   const vertices=new Float32Array(corners.flat());
   g.setAttribute('position',new THREE.BufferAttribute(vertices,3));
   g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
   const mesh=new THREE.Mesh(g,material);mesh.castShadow=false;vehicle.add(mesh);
 };
 const winHalf=(dims.width-.26)*.43;
 const frontLower=-front+.055,frontUpper=-(front-.38)-.035;
 pane([
   [-winHalf,dims.base+.16,frontLower],[winHalf,dims.base+.16,frontLower],
   [winHalf*.93,upper-.18,frontUpper],[-winHalf*.93,upper-.18,frontUpper]
 ],glass);
 const rearLower=-back-.04,rearUpper=-(back+.28)+.02;
 pane([
   [winHalf,dims.base+.17,rearLower],[-winHalf,dims.base+.17,rearLower],
   [-winHalf*.93,upper-.19,rearUpper],[winHalf*.93,upper-.19,rearUpper]
 ],glass);
 const rearWindowGlow=new THREE.Mesh(new THREE.BoxGeometry(dims.width*.70,.017,.025),chrome);
 rearWindowGlow.position.set(0,dims.base+.17,rearLower+.012);vehicle.add(rearWindowGlow);
 const roofTop=box([dims.width-.30,.045,Math.abs(front-back)-.6],paint,
   [0,upper+.028,-(front+back)/2]);
 roofTop.castShadow=true;
 const roofGlass=new THREE.Mesh(new THREE.BoxGeometry(dims.width*.62,.013,.68),glass);
 roofGlass.position.set(0,upper+.056,-(front+back)/2);
 vehicle.add(roofGlass);
  // Windows drawn on both side faces with a real windshield zone.
 const win=new THREE.Shape();
 win.moveTo(back+.17,dims.base+.125);
 win.lineTo(back+.36,upper-.11);
 win.lineTo(front-.42,upper-.11);
 win.lineTo(front-.18,dims.base+.125);
 win.closePath();
 const glassGeom=new THREE.ShapeGeometry(win);
 glassGeom.rotateY(Math.PI/2);
 const side1=new THREE.Mesh(glassGeom,glass);side1.position.x=half-.085;vehicle.add(side1);
 const side2=new THREE.Mesh(glassGeom.clone(),glass);side2.position.x=-half+.085;vehicle.add(side2);
 // Window divisions, chrome beltline, and door seams.
 const drawLine=(pts:THREE.Vector3[],mat:THREE.Material,rad=.015)=>{
  const curve=new THREE.CatmullRomCurve3(pts);
  const obj=new THREE.Mesh(new THREE.TubeGeometry(curve,16,rad,6,false),mat);
  vehicle.add(obj);
 };
 for(const side of [-1,1]){
  const x=side*(half-.075);
  for(const offset of [-.26,.57]){
   if(kind==='sedan'&&offset===.57)continue;
   drawLine([new THREE.Vector3(x,upper-.10,offset),new THREE.Vector3(x,dims.base+.12,offset+.12)],dark,.018);
  }
  drawLine([new THREE.Vector3(x,dims.base+.09,back+.24),new THREE.Vector3(x,dims.base+.09,front-.16)],chrome,.015);
  drawLine([new THREE.Vector3(x,dims.base-.24,-.22),new THREE.Vector3(x,dims.base+.08,-.22)],dark,.008);
  drawLine([new THREE.Vector3(x,dims.base-.23,.78),new THREE.Vector3(x,dims.base+.07,.78)],dark,.008);
  for(const z of [back+.8,front-.8]){
   const handle=box([.042,.045,.21],chrome,[side*(half+.02),dims.base-.08,z]);
   handle.rotation.y=0;
  }
  // Wing mirrors with compact realistic mirrors.
  box([.24,.13,.24],paint,[side*(half+.13),dims.base+.20,front-.12]);
  box([.19,.08,.17],dark,[side*(half+.27),dims.base+.20,front-.12]);
  if(kind==='suv'||kind==='van')box([.09,.03,dims.length*.54],chrome,[side*(half-.18),upper+.04,.01]);
 }

 // Front bumper, curved accent and rear tailgate; the details are
 // intentionally generic to avoid misrepresenting any manufacturer's trim.
 box([dims.width*.78,.12,.16],dark,[0,.35,-L-.025]);
 box([dims.width*.70,.10,.12],dark,[0,.32,L+.015]);
 box([dims.width*.63,.018,.035],chrome,[0,dims.base+.015,-L-.082]);
 box([dims.width*.54,.018,.025],chrome,[0,dims.base-.02,L+.087]);
 const running=new THREE.Mesh(new THREE.BoxGeometry(dims.width*.30,.018,.7),dark);
 running.position.set(0,upper+.066,front*.3);vehicle.add(running);
 // Grilles, front lights, rear clusters.
 box([dims.width*.55,.21,.052],dark,[0,.58,-L-.035]);
 for(let i=-2;i<=2;i++){
  box([dims.width*.48,.016,.06],chrome,[0,.49+i*.045,-L-.071]);
 }
 for(const side of [-1,1]){
  box([.35,.12,.045],warm,[side*(half-.27),dims.base-.12,-L-.072]);
  box([.22,.17,.049],red,[side*(half-.27),dims.base-.1,L+.065]);
 }
 const doors:THREE.Group[]=[];
 // Simple articulated concept door panels; unbranded and not actual trim.
 if(kind!=='van') for(const side of [-1,1]){
   const hinge=new THREE.Group();
   hinge.position.set(side*(half+.062),dims.base-.12,-.58);
   const panel=new THREE.Mesh(new THREE.BoxGeometry(.049,.54,.91),paint);
   panel.position.set(side*.025,-.085,.455);
   panel.castShadow=true;panel.receiveShadow=true;hinge.add(panel);
   const outline=new THREE.Mesh(new THREE.BoxGeometry(.065,.015,.82),chrome);
   outline.position.set(side*.065,.14,.46);hinge.add(outline);
   vehicle.add(hinge);doors.push(hinge);
 }
 const wheels:THREE.Group[]=[];
 const radius=kind==='suv'||kind==='van'?.47:.42;
 for(const side of [-1,1])for(const z of [-dims.wheelbase/2,dims.wheelbase/2]){
   const wheel=new THREE.Group();wheel.position.set(side*(half+.035),radius+.06,z);
   wheel.rotation.z=Math.PI/2;
   const tire=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.22,28,1),rubber);
   tire.castShadow=true;wheel.add(tire);
   const outer=new THREE.Mesh(new THREE.CylinderGeometry(radius*.69,radius*.69,.235,28),chrome);wheel.add(outer);
   const insert=new THREE.Mesh(new THREE.CylinderGeometry(radius*.57,radius*.57,.24,28),dark);wheel.add(insert);
   for(let i=0;i<8;i++){
    const spoke=new THREE.Mesh(new THREE.BoxGeometry(radius*.08,.263,radius*.51),chrome);
    spoke.position.set(0,0,0);spoke.rotation.y=i*Math.PI/8;wheel.add(spoke);
   }
   const nut=new THREE.Mesh(new THREE.CylinderGeometry(radius*.17,radius*.17,.272,16),chrome);wheel.add(nut);
   vehicle.add(wheel);wheels.push(wheel);
   // Articulated wheel-arch contours on side panels.
   const arch=new THREE.Mesh(new THREE.TorusGeometry(radius+.085,.029,8,28),dark);
   arch.rotation.y=Math.PI/2;
   arch.position.set(side*(half-.02),radius+.06,z);vehicle.add(arch);
 }
 vehicle.position.y=.06;
 return {vehicle,wheels,paint,doors};
}

export function Real3DVehicle({category,paint,mood,progress,modelUrl,conceptUrl,onUnavailable,autoRotate=true,doorsOpen=false,zoom=1,reducedMotion=false,viewPreset='hero'}:Props){
 const host=useRef<HTMLDivElement|null>(null);
 const engine=useRef<{
  renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;
  root:THREE.Group;platform:THREE.Group;
  point:THREE.PointLight;wheels:THREE.Group[];paintMaterial:THREE.MeshPhysicalMaterial;
  dispose:()=>void
 }|null>(null);
 const refState=useRef({progress,mood,autoRotate,doorsOpen,zoom,reducedMotion,viewPreset});
 const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
 const [assetLoad,setAssetLoad]=useState<'loading'|'loaded'|'error'>('loading');
 useEffect(()=>{refState.current={progress,mood,autoRotate,doorsOpen,zoom,reducedMotion,viewPreset};},[progress,mood,autoRotate,doorsOpen,zoom,reducedMotion,viewPreset]);

 useEffect(()=>{
  const element=host.current;if(!element)return;
  let cancelled=false,frame=0;
  let visible=false;
  let hasApprovedModel=false;
  let controls:OrbitControls|undefined;
  let mixer:THREE.AnimationMixer|undefined;
  let doorOpenAction:THREE.AnimationAction|undefined;
  let doorCloseAction:THREE.AnimationAction|undefined;
  let lastDoorsOpen=false;
  let lastPreset='hero';
  let doorAmount=0;
  const clock=new THREE.Clock();
  let defaultDistance=11.3;
  let resize:ResizeObserver|undefined,observer:IntersectionObserver|undefined;
  const initialize=()=>{
    if(cancelled||engine.current)return;
    try{
      const scene=new THREE.Scene();
      scene.fog=new THREE.Fog(0x121f35,12,28);
      const camera=new THREE.PerspectiveCamera(34,1,.1,100);
      camera.position.set(7.1,3.65,-7.8);camera.lookAt(0,.82,0);
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
      renderer.setSize(element.clientWidth,element.clientHeight,false);
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.75;
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText='width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y';
      renderer.domElement.setAttribute('aria-label','Interactive concept 3D vehicle, drag to orbit and scroll to zoom');
      element.appendChild(renderer.domElement);
      controls=new OrbitControls(camera,renderer.domElement);
      controls.target.set(0,.83,0);
      controls.enableDamping=true;
      controls.dampingFactor=.075;
      controls.enablePan=false;
      controls.enableZoom=true;
      controls.minDistance=5.2;
      controls.maxDistance=18;
      controls.minPolarAngle=.55;
      controls.maxPolarAngle=1.6;
      controls.rotateSpeed=.65;
      controls.autoRotateSpeed=1.65;
      controls.update();
      defaultDistance=camera.position.distanceTo(controls.target);

      scene.add(new THREE.AmbientLight(0xe3ebff,1.7));
      const key=new THREE.DirectionalLight(0xffeed1,3.6);
      key.position.set(4,8,5);key.castShadow=true;
      key.shadow.mapSize.set(1024,1024);
      key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
      scene.add(key);
      const fill=new THREE.DirectionalLight(0x94cdff,3.5);
      fill.position.set(-5,3,-4);scene.add(fill);
      const point=new THREE.PointLight(0xffc78b,65,16);
      point.position.set(-3,4,2);scene.add(point);

      const platform=new THREE.Group();
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.43,3.43,.18,90),
        new THREE.MeshPhysicalMaterial({color:0x203450,metalness:.65,roughness:.29,clearcoat:.65}));
      disc.position.y=-.15;disc.receiveShadow=true;platform.add(disc);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(3.36,.027,8,100),
        new THREE.MeshStandardMaterial({color:0x94cefc,metalness:.82,roughness:.3}));
      ring.rotation.x=Math.PI/2;ring.position.y=-.03;platform.add(ring);
      const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.68,.013,8,100),
        new THREE.MeshStandardMaterial({color:0x4b82be,metalness:.8,roughness:.45}));
      ring2.rotation.x=Math.PI/2;ring2.position.y=-.035;platform.add(ring2);
      scene.add(platform);

      const root=new THREE.Group();scene.add(root);
      const built=createVehicle(classOf(category),paintValues[paint]);
      root.add(built.vehicle);
      // Approved local GLB assets replace the conceptual 3D silhouette.
      // Uploaded assets are self-contained and validated by the local CRM backend.
      const validLocal=Boolean(modelUrl&&/^\/api\/models\/[0-9a-f-]{36}\.glb$/.test(modelUrl));
      const validConcept=Boolean(!validLocal&&conceptUrl&&ALLOWED_CC0_GARAGE_MODELS.has(conceptUrl));
      const target=validLocal?modelUrl:validConcept?conceptUrl:undefined;
      if(target){
        import('three/examples/jsm/loaders/GLTFLoader.js').then(({GLTFLoader})=>{
          if(cancelled)return;
          new GLTFLoader().load(target,gltf=>{
            if(cancelled)return;
            const custom=gltf.scene;
            const box=new THREE.Box3().setFromObject(custom);
            if(box.isEmpty())return;
            const size=box.getSize(new THREE.Vector3());
            const max=Math.max(size.x,size.z);
            if(max<.001)return;
            const scale=4.65/max;
            custom.scale.setScalar(scale);
            const bounds=new THREE.Box3().setFromObject(custom);
            const center=bounds.getCenter(new THREE.Vector3());
            custom.position.set(-center.x,-bounds.min.y+.065,-center.z);
            custom.traverse(obj=>{
              if(obj instanceof THREE.Mesh){
                obj.castShadow=true;obj.receiveShadow=true;
              }
            });
            root.remove(built.vehicle);
            root.add(custom);
            hasApprovedModel=true;
            setAssetLoad('loaded');
            if(gltf.animations.length){
              mixer=new THREE.AnimationMixer(custom);
              const opened=gltf.animations.find(c=>/door.*open/i.test(c.name));
              const closed=gltf.animations.find(c=>/door.*close/i.test(c.name));
              if(opened){
                doorOpenAction=mixer.clipAction(opened);
                doorOpenAction.setLoop(THREE.LoopOnce,1);
                doorOpenAction.clampWhenFinished=true;
              }
              if(closed){
                doorCloseAction=mixer.clipAction(closed);
                doorCloseAction.setLoop(THREE.LoopOnce,1);
                doorCloseAction.clampWhenFinished=true;
              }
            }
          },undefined,error=>{
            console.warn('Optional GLB failed to load; switching to actual vehicle photo.',error);
            if(!cancelled){setAssetLoad('error');onUnavailable?.();}
          });
        }).catch(()=>{if(!cancelled){setAssetLoad('error');onUnavailable?.();}});
      }

      const tick=()=>{
        if(cancelled||!visible)return;
        frame=window.requestAnimationFrame(tick);
        const delta=Math.min(clock.getDelta(),.05);
        const current=refState.current;
        if(controls){
          controls.autoRotate=current.autoRotate&&!current.reducedMotion;
          if(current.viewPreset!==lastPreset){
            const dist=camera.position.distanceTo(controls.target);
            const off:Record<string,[number,number,number]>={
              hero:[.67,.31,-.68],front:[.04,.26,-1],side:[1,.27,.03],rear:[.04,.26,1]
            };
            const pos=off[current.viewPreset]||off.hero;
            camera.position.set(pos[0]*dist,controls.target.y+pos[1]*dist,pos[2]*dist);
            lastPreset=current.viewPreset;
          }
          const wanted=Math.max(5.2,Math.min(18,defaultDistance/current.zoom));
          const distance=camera.position.distanceTo(controls.target);
          if(Math.abs(distance-wanted)>.035&&!controls.autoRotate){
            const dir=camera.position.clone().sub(controls.target).normalize();
            camera.position.copy(controls.target).addScaledVector(dir,distance+(wanted-distance)*.09);
          }
          controls.update(delta);
        }
        if(hasApprovedModel&&current.doorsOpen!==lastDoorsOpen){
          const next=current.doorsOpen?doorOpenAction:doorCloseAction;
          const previous=current.doorsOpen?doorCloseAction:doorOpenAction;
          previous?.stop();
          if(next){next.reset();next.play();}
          lastDoorsOpen=current.doorsOpen;
        }
        mixer?.update(delta);
        const wantedDoor=current.doorsOpen&&!hasApprovedModel?1:0;
        doorAmount+=(wantedDoor-doorAmount)*Math.min(1,delta*4);
        built.doors.forEach((door,i)=>{door.rotation.y=(i===0?-.98:.98)*doorAmount;});
        if(!current.reducedMotion){
          root.position.y=Math.sin(performance.now()*.0013)*.014;
          platform.rotation.y+=delta*.022;
        }
        point.intensity=current.mood==='golden-hour'?81:61;
        point.color.set(current.mood==='golden-hour'?0xffae6f:0xd3e8ff);
        renderer.toneMappingExposure=current.mood==='golden-hour'?1.48:1.68;
        renderer.render(scene,camera);
      };
      const observerStart=()=>{visible=true;if(!frame)tick();};
      const observerStop=()=>{visible=false;window.cancelAnimationFrame(frame);frame=0;};
      observer=new IntersectionObserver(entries=>{
        if(entries[0]?.isIntersecting && !document.hidden)observerStart();else observerStop();
      },{threshold:.08});
      observer.observe(element);
      resize=new ResizeObserver(()=>{
        const w=Math.max(50,element.clientWidth),h=Math.max(50,element.clientHeight);
        renderer.setSize(w,h,false);
        camera.aspect=w/h;camera.updateProjectionMatrix();
      });
      resize.observe(element);
      const cleanup=()=>{
        observer?.disconnect();resize?.disconnect();
        controls?.dispose();
        window.cancelAnimationFrame(frame);
        scene.traverse(obj=>{
          if(obj instanceof THREE.Mesh){
            obj.geometry.dispose();
            const mats=Array.isArray(obj.material)?obj.material:[obj.material];
            mats.forEach(m=>m.dispose());
          }
        });
        renderer.dispose();renderer.forceContextLoss();
        renderer.domElement.remove();
      };
      engine.current={renderer,scene,camera,root,platform,point,wheels:built.wheels,
        paintMaterial:built.paint,dispose:cleanup};
      setStatus('ready');
    }catch(err){
      console.warn('WebGL preview unavailable, using fallback photo',err);
      if(!cancelled){setStatus('fallback');onUnavailable?.();}
    }
  };
  // Lazy creation only when the large showroom is about to enter the viewport.
  const startObserver=new IntersectionObserver(entries=>{
    if(entries[0]?.isIntersecting){initialize();startObserver.disconnect();}
  },{rootMargin:'200px'});
  startObserver.observe(element);
  return()=>{
    cancelled=true;startObserver.disconnect();
    engine.current?.dispose();engine.current=null;
  };
 // Scene rebuilt only when silhouette category changes, not on every scroll frame.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[category,modelUrl,conceptUrl]);

 useEffect(()=>{
   const material=engine.current?.paintMaterial;if(material){material.color.setHex(paintValues[paint]);}
 },[paint,status]);

 return <div className="vehicle-webgl" ref={host} aria-label={'Interactive concept 3D '+category+' silhouette'}>
   {(status==='loading'||(status==='ready'&&(modelUrl||conceptUrl)&&assetLoad==='loading'))&&
     <div className="vehicle-loading"><span className="vehicle-loading-spinner"/><small>PREPARING ROTATABLE 3D VEHICLE</small></div>}
   {status==='fallback'&&<div className="vehicle-3d-fallback">3D preview is unavailable in this browser. Use the vehicle gallery below.</div>}
 </div>;
}
