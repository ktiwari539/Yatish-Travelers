import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MoveUpRight } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type Props={
  vehicles:FleetReelVehicle[];
  activeIndex:number;
  onChange:(index:number)=>void;
  onQuote:(name:string)=>void;
};
function ImageWithFallback({src,name}:{src:string;name:string}){
 const [error,setError]=useState(false);
 useEffect(()=>setError(false),[src]);
 return error?<div className="hero-motion-fallback"><strong>{name}</strong><small>Vehicle photo unavailable</small></div>:
    <img src={src} alt={name+' reference photograph'} decoding="async" onError={()=>setError(true)}/>;
}
export function FleetHeroVisual({vehicles,activeIndex,onChange,onQuote}:Props){
 const [paused,setPaused]=useState(false);
 const [motionAllowed,setMotionAllowed]=useState(true);
 const [manuallySelected,setManuallySelected]=useState(false);
 const [angle,setAngle]=useState(0);
 const container=useRef<HTMLDivElement|null>(null);
 const current=vehicles[activeIndex]??vehicles[0];
 const next=vehicles.length?vehicles[(activeIndex+1)%vehicles.length]:null;
 const previous=vehicles.length?vehicles[(activeIndex-1+vehicles.length)%vehicles.length]:null;
 const photos=current?[current.image,...(current.gallery||[])].filter(Boolean):[];
 useEffect(()=>{
   const q=window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');
   const sync=()=>setMotionAllowed(!q.matches);
   sync();q.addEventListener('change',sync);return()=>q.removeEventListener('change',sync);
 },[]);
 useEffect(()=>setAngle(0),[current?.name]);
 useEffect(()=>{
   if(!motionAllowed||paused||manuallySelected||vehicles.length<=1)return;
   const timer=window.setInterval(()=>onChange((activeIndex+1)%vehicles.length),5800);
   return()=>window.clearInterval(timer);
 },[activeIndex,onChange,motionAllowed,paused,manuallySelected,vehicles.length]);
 if(!current)return null;
 const choose=(i:number)=>{setManuallySelected(true);onChange((i+vehicles.length)%vehicles.length);};
 const display=(item:FleetReelVehicle)=>item.image;
 return <div className="hero-motion" ref={container} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
   onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}>
   <div className="hero-motion-header"><span><i/> THE MATESHWARI FLEET</span><span>DRIVEN BY YOUR JOURNEY</span></div>
   <div className="hero-motion-visual">
     <div className="hero-motion-ambient" aria-hidden="true"/>
     <button type="button" className="hero-motion-preview is-left" onClick={()=>choose(activeIndex-1)} aria-label={'Preview '+previous?.name}>
       <ImageWithFallback src={display(previous!)} name={previous!.name}/>
       <span>{previous?.name}</span>
     </button>
     <div className="hero-motion-active" key={current.name+'-'+angle}>
       <ImageWithFallback src={photos[angle]||current.image} name={current.name}/>
       <div className="hero-motion-tint"/>
       <div className="hero-motion-active-label"><span>{current.category.toUpperCase()} / {current.seats}</span><strong>{current.name}</strong><small>Model reference photography · Color and assigned vehicle may vary</small></div>
       <span className="hero-motion-active-serial">{String(activeIndex+1).padStart(2,'0')} / {String(vehicles.length).padStart(2,'0')}</span>
     </div>
     <button type="button" className="hero-motion-preview is-right" onClick={()=>choose(activeIndex+1)} aria-label={'Preview '+next?.name}>
       <ImageWithFallback src={display(next!)} name={next!.name}/>
       <span>{next?.name}</span>
     </button>
     <div className="hero-motion-trail" aria-hidden="true"><span/><span/><span/></div>
   </div>
   <div className="hero-motion-info">
     <div><span>FEATURED VEHICLE</span><strong>{current.name}</strong><small>From ₹{current.rateMin??15}–₹{current.rateMax??25}/km indicative</small></div>
     <button type="button" className="hero-motion-request" onClick={()=>onQuote(current.name)}>Request vehicle <MoveUpRight size={17}/></button>
   </div>
   <div className="hero-motion-controls">
     <div className="hero-motion-arrows"><button type="button" onClick={()=>choose(activeIndex-1)} aria-label="Previous vehicle"><ChevronLeft size={19}/></button>
       <button type="button" onClick={()=>choose(activeIndex+1)} aria-label="Next vehicle"><ChevronRight size={19}/></button></div>
     <div className="hero-motion-markers" role="group" aria-label="Choose a featured vehicle">{vehicles.slice(0,7).map((v,i)=><button type="button" key={v.name} aria-pressed={i===activeIndex} aria-label={'Show '+v.name} className={i===activeIndex?'selected':''} onClick={()=>choose(i)}/>)}</div>
     {photos.length>1&&<button className="hero-motion-next-angle" type="button" onClick={()=>{setManuallySelected(true);setAngle(i=>(i+1)%photos.length);}}>Another angle <ArrowRight size={15}/></button>}
   </div>
   <div className={'hero-motion-progress '+(paused||!motionAllowed||manuallySelected?'is-paused':'')} aria-hidden="true" key={current.name}><i/></div>
 </div>;
}
