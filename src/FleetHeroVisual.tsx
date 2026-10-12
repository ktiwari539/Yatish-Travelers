import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type Props={
 vehicles:FleetReelVehicle[];
 activeIndex:number;
 onChange:(index:number)=>void;
 onQuote:(name:string)=>void;
};
const scenes=[
 {visual:luxuryMedia.mountains,title:'Go where the road takes you.',eyebrow:'THE OPEN ROAD / 01',note:'Mountain roads & new perspectives'},
 {visual:luxuryMedia.hero,title:'Every mile should feel special.',eyebrow:'THE OPEN ROAD / 02',note:'Golden-hour road trips'},
 {visual:luxuryMedia.landscape,title:'Beyond the destination.',eyebrow:'THE OPEN ROAD / 03',note:'Unhurried escapes & scenic journeys'}
] as const;
export function FleetHeroVisual({vehicles,activeIndex,onChange,onQuote}:Props){
 const [scene,setScene]=useState(0);
 const [paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [visible,setVisible]=useState(true);
 const host=useRef<HTMLDivElement|null>(null);
 const active=vehicles[activeIndex]??vehicles[0];
 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');
  const read=()=>setReduced(query.matches);
  read();query.addEventListener('change',read);
  return()=>query.removeEventListener('change',read);
 },[]);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  const observer=new IntersectionObserver(([entry])=>setVisible(Boolean(entry?.isIntersecting)),{threshold:.1});
  observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(reduced||paused||!visible)return;
  const timer=window.setInterval(()=>setScene(v=>(v+1)%scenes.length),8800);
  return()=>window.clearInterval(timer);
 },[paused,reduced,visible,scene]);
 if(!active)return null;
 const current=scenes[scene];
 const move=(delta:number)=>{setScene(v=>(v+delta+scenes.length)%scenes.length);setPaused(true);};
 const select=(index:number)=>onChange(index);
 return <div className="film-hero" ref={host} aria-label="Cinematic travel and vehicle selection">
  <div className="film-hero-scene" key={scene}>
   <ScenicImage src={current.visual.src} fallback={current.visual.fallback}
     alt={current.visual.alt} loading={scene===0?'eager':'lazy'}/>
  </div>
  <div className="film-hero-scrim" aria-hidden="true"/>
  <div className="film-hero-top"><span><i/> MATESHWARI / TRAVEL STORIES</span><span>EST. FOR THE JOURNEY</span></div>
  <div className="film-hero-middle">
   <span className="film-hero-eyebrow">{current.eyebrow}</span>
   <h2 key={current.title}>{current.title}</h2>
   <p>{current.note}</p>
  </div>
  <div className="film-hero-lower">
    <div className="film-hero-selection">
     <span>PLAN WITH THE RIGHT VEHICLE</span>
     <strong>{active.name}</strong>
     <small>{active.seats} seats <b>·</b> {active.category} <b>·</b> ₹{active.rateMin??15}–₹{active.rateMax??25}/km indicative</small>
    </div>
    <button type="button" className="film-hero-quote" onClick={()=>onQuote(active.name)}>Get a quote <ArrowUpRight size={17}/></button>
  </div>
  <div className="film-hero-controls">
   <div className="film-hero-scene-nav">
    <button type="button" aria-label="Previous travel scene" onClick={()=>move(-1)}><ChevronLeft size={19}/></button>
    <span>{String(scene+1).padStart(2,'0')} <i/> 0{scenes.length}</span>
    <button type="button" aria-label="Next travel scene" onClick={()=>move(1)}><ChevronRight size={19}/></button>
    <button type="button" aria-label={paused?'Resume scene transitions':'Pause scene transitions'} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={17}/>:<Pause size={17}/>}</button>
   </div>
   <div className="film-hero-vehicle-nav" role="group" aria-label="Choose your vehicle">
    {vehicles.map((vehicle,i)=><button type="button" key={vehicle.name}
      className={i===activeIndex?'active':''} aria-pressed={i===activeIndex}
      onClick={()=>select(i)}>{vehicle.name}</button>)}
   </div>
  </div>
  <a className="film-hero-footnote" href="#fleet">Model-specific photos & details <ArrowRight size={13}/></a>
  <span className="film-hero-photo-note">EDITORIAL TRAVEL INSPIRATION · VEHICLE SHOWN IN TEXT IS YOUR SELECTION</span>
 </div>;
}
