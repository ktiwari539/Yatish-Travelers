import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MoveUpRight, RotateCw, Sparkles, MousePointer2 } from 'lucide-react';

const Real3DVehicle=lazy(()=>import('./Real3DVehicle').then(m=>({default:m.Real3DVehicle})));
export type ShowroomVehicle={
 name:string;image:string;seats:string;tag:string;category:string;gallery?:string[];
 modelUrl?:string;
};
type Props={vehicles:ShowroomVehicle[];onExplore:(name:string)=>void};

export function CinematicShowroom({vehicles,onExplore}:Props){
 const section=useRef<HTMLElement|null>(null);
 const [activeIndex,setActiveIndex]=useState(0);
 const [angle,setAngle]=useState(0);
 const [scrollProgress,setScrollProgress]=useState(0);
 const [reducedMotion,setReducedMotion]=useState(false);
 const [modelUnavailable,setModelUnavailable]=useState(false);
 const active=vehicles[activeIndex]??vehicles[0];
 const photos=active?[active.image,...(active.gallery||[])]:[];
 useEffect(()=>{
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  setReducedMotion(motion.matches);
  const update=()=>setReducedMotion(motion.matches);
  motion.addEventListener('change',update);
  return()=>motion.removeEventListener('change',update);
 },[]);
 useEffect(()=>{setAngle(0);setModelUnavailable(false);},[active?.name]);
 useEffect(()=>{
  const target=section.current;
  if(!target||!vehicles.length)return;
  let raf=0;
  const update=()=>{
   const rect=target.getBoundingClientRect();
   const length=Math.max(1,rect.height-window.innerHeight);
   const p=Math.max(0,Math.min(1,-rect.top/length));
   target.style.setProperty('--gallery-progress',String(p));
   setScrollProgress(old=>Math.abs(p-old)>.02?p:old);
   raf=0;
  };
  const watch=()=>{if(!raf)raf=window.requestAnimationFrame(update);};
  update();window.addEventListener('scroll',watch,{passive:true});window.addEventListener('resize',watch);
  return()=>{window.removeEventListener('scroll',watch);window.removeEventListener('resize',watch);if(raf)cancelAnimationFrame(raf);};
 },[vehicles.length]);
 if(!active)return null;
 const choose=(index:number)=>setActiveIndex((index+vehicles.length)%vehicles.length);
 const prev=vehicles[(activeIndex-1+vehicles.length)%vehicles.length];
 const next=vehicles[(activeIndex+1)%vehicles.length];
 return <section className="luxury-showroom" ref={section} id="showroom" aria-label="Explore Mateshwari Travellers vehicle collection">
  <div className="luxury-showroom-sticky">
   <div className="luxury-showroom-top"><span><Sparkles size={14}/> MATESHWARI / THE FLEET GALLERY</span>
     <span>REAL VEHICLES. THOUGHTFUL JOURNEYS.</span></div>
   <div className="luxury-showroom-heading">
     <div><span>THE COLLECTION / 2026</span><h2>Arrive with <em>intention.</em></h2></div>
     <p>Explore our vehicle categories through real model photography and an interactive gallery. Find the right space for your journey.</p>
   </div>
   <div className="luxury-showroom-main">
    <div className="luxury-showroom-copy">
     <div className="luxury-showroom-index"><span>0{activeIndex+1}</span> / 0{vehicles.length}</div>
     <span className="luxury-showroom-kicker">EXPLORE THE COLLECTION</span>
     <h3 key={active.name}>{active.name}</h3>
     <p>{active.tag} <i/> {active.seats} seats <i/> {active.category}</p>
     <div className="luxury-showroom-rule"/>
     <span className="luxury-showroom-note">Individual vehicles and their exact specifications are confirmed with your quotation. Photos are model references, not guaranteed assigned vehicles.</span>
     <button type="button" className="luxury-showroom-cta" onClick={()=>onExplore(active.name)}>
       Request this vehicle <MoveUpRight size={18}/></button>
     <div className="luxury-showroom-nav" role="group" aria-label="Change selected vehicle">
       <button type="button" onClick={()=>choose(activeIndex-1)} aria-label="Previous vehicle"><ChevronLeft size={22}/></button>
       <span>EXPLORE MORE VEHICLES</span>
       <button type="button" onClick={()=>choose(activeIndex+1)} aria-label="Next vehicle"><ChevronRight size={22}/></button>
     </div>
    </div>
    <div className="luxury-showroom-visual" onPointerMove={e=>{
        if(e.pointerType==='touch'||reducedMotion)return;
        const rect=e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--tilt-x',String(((e.clientX-rect.left)/rect.width-.5).toFixed(3)));
        e.currentTarget.style.setProperty('--tilt-y',String(((e.clientY-rect.top)/rect.height-.5).toFixed(3)));
       }}
       onPointerLeave={e=>{e.currentTarget.style.setProperty('--tilt-x','0');e.currentTarget.style.setProperty('--tilt-y','0');}}>
     <div className="luxury-showroom-halo" aria-hidden="true"/>
     <div className="luxury-showroom-photo" key={active.name+'-'+angle}>
       {active.modelUrl&&!modelUnavailable&&!reducedMotion?(
        <Suspense fallback={<img src={photos[angle]||active.image} alt={active.name}/>}>
         <Real3DVehicle category={active.category} modelUrl={active.modelUrl} paint="pearl" mood="daylight" progress={scrollProgress}
           onUnavailable={()=>setModelUnavailable(true)}/>
        </Suspense>
       ):<img src={photos[angle]||active.image} alt={active.name+' model reference photo, angle '+(angle+1)} loading="lazy"/>}
       <div className="luxury-showroom-photo-shade"/>
       <span className="luxury-showroom-photo-label">{active.modelUrl&&!modelUnavailable?'INTERACTIVE LICENSED 3D MODEL':'REAL MODEL PHOTOGRAPHY'} <ArrowRight size={15}/></span>
     </div>
     <button className="luxury-showroom-side luxury-showroom-side-left" type="button" onClick={()=>choose(activeIndex-1)} aria-label={'Select '+prev.name}>
       <img src={prev.image} alt=""/><span>{prev.name}</span>
     </button>
     <button className="luxury-showroom-side luxury-showroom-side-right" type="button" onClick={()=>choose(activeIndex+1)} aria-label={'Select '+next.name}>
       <img src={next.image} alt=""/><span>{next.name}</span>
     </button>
     {photos.length>1&&<button type="button" className="luxury-angle-button" onClick={()=>setAngle(i=>(i+1)%photos.length)}>
        <RotateCw size={16}/> Another angle <span>{angle+1} / {photos.length}</span>
       </button>}
     {active.modelUrl&&<span className="luxury-3d-hint"><MousePointer2 size={15}/> DRAG TO ROTATE THE 3D MODEL</span>}
    </div>
   </div>
   <div className="luxury-showroom-bottom">
    <div className="luxury-showroom-options" role="group" aria-label="Select from all vehicles">
     {vehicles.map((item,index)=><button key={item.name} type="button" aria-pressed={index===activeIndex}
       className={index===activeIndex?'selected':''} onClick={()=>choose(index)}><span>{String(index+1).padStart(2,'0')}</span>{item.name}</button>)}
    </div>
    <span className="luxury-showroom-scroll">DISCOVER YOUR DRIVE <i style={{width:Math.max(8,scrollProgress*100)+'%'}}/></span>
   </div>
  </div>
 </section>;
}
