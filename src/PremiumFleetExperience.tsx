import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CirclePause, CirclePlay, MoveUpRight, Sparkles } from 'lucide-react';

export type FleetReelVehicle = {
 name:string;
 seats:string;
 tag:string;
 category:string;
 image:string;
 gallery?:string[];
 rateMin?:number;
 rateMax?:number;
};
type Props={
 vehicles:FleetReelVehicle[];
 activeName:string;
 onSelect:(name:string)=>void;
 onQuote:(name:string)=>void;
};

const safePhotos=(vehicle:FleetReelVehicle)=>[vehicle.image,...(vehicle.gallery||[])].filter(Boolean).slice(0,5);
function useReducedMotion(){
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{
   const query=window.matchMedia('(prefers-reduced-motion: reduce)');
   setReduced(query.matches);
   const change=()=>setReduced(query.matches);
   query.addEventListener('change',change);
   return()=>query.removeEventListener('change',change);
 },[]);
 return reduced;
}
function FleetPhoto({src,name,priority=false}:{src:string;name:string;priority?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return <div className={'motion-fleet-image '+(failed?'is-missing':'')}>
    {!failed&&<img src={src} alt={name+' vehicle model reference photography'} loading={priority?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>}
    {failed&&<span role="img" aria-label={'Photo unavailable for '+name}><strong>{name}</strong><small>Photography unavailable</small></span>}
   </div>;
}
function ReelLane({vehicles,offset=0,onSelect}:{vehicles:FleetReelVehicle[];offset?:number;onSelect:(name:string)=>void}){
 const cards=useMemo(()=>vehicles.flatMap((car,index)=>{
  const photos=safePhotos(car);
  const first=photos[(index+offset)%photos.length]||car.image;
  return [{car,src:first,angle:(index+offset)%photos.length},
    ...(photos.length>1?[{car,src:photos[(index+offset+1)%photos.length],angle:(index+offset+1)%photos.length}]:[])];
 }),[vehicles,offset]);
 return <div className={'motion-reel-lane lane-'+offset} role="list" aria-label="Vehicle image showcase">
  {[0,1].map(copy=><div className="motion-reel-set" key={copy} aria-hidden={copy===1?'true':undefined}>
   {cards.map((entry,i)=><button type="button" role="listitem" tabIndex={copy===1?-1:0}
     className="motion-reel-card" onClick={()=>onSelect(entry.car.name)} key={entry.car.name+'-'+entry.angle+'-'+i}>
      <FleetPhoto src={entry.src} name={entry.car.name}/>
      <div className="motion-reel-card-wash"/>
      <div className="motion-reel-card-label"><span>{entry.car.category} / {entry.car.seats}</span><strong>{entry.car.name}</strong></div>
      <span className="motion-reel-card-icon" aria-hidden="true"><ArrowUpRight size={17}/></span>
    </button>)}
   </div>)}
 </div>;
}

export function PremiumFleetExperience({vehicles,activeName,onSelect,onQuote}:Props){
 const reduced=useReducedMotion();
 const [paused,setPaused]=useState(false);
 const [visible,setVisible]=useState(true);
 const [angle,setAngle]=useState(0);
 const [touched,setTouched]=useState(false);
 const root=useRef<HTMLElement|null>(null);
 const safe=vehicles.length?vehicles:[];
 const index=Math.max(0,safe.findIndex(car=>car.name===activeName));
 const active=safe[index];
 const previews=safe.length?[safe[(index+safe.length-1)%safe.length],safe[(index+1)%safe.length]]:[];
 const photos=active?safePhotos(active):[];
 useEffect(()=>setAngle(0),[activeName]);
 useEffect(()=>{
   const node=root.current;if(!node)return;
   const obs=new IntersectionObserver(([entry])=>setVisible(Boolean(entry?.isIntersecting)),{threshold:.04});
   obs.observe(node);return()=>obs.disconnect();
 },[]);
 useEffect(()=>{
   if(reduced||paused||touched||!visible||safe.length<2)return;
   const timer=window.setInterval(()=>onSelect(safe[(index+1)%safe.length].name),6400);
   return()=>window.clearInterval(timer);
 },[index,onSelect,paused,reduced,touched,visible,safe]);
 const manual=(delta:number)=>{
   if(!safe.length)return;
   setTouched(true);
   onSelect(safe[(index+delta+safe.length)%safe.length].name);
 };
 if(!active)return null;
 return <section className="motion-fleet-section" id="motion-fleet" ref={root}
    aria-label="Interactive premium vehicle fleet collection"
    onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}>
   <div className="motion-fleet-grain" aria-hidden="true"/>
   <div className="motion-fleet-topline"><span><Sparkles size={15}/> MATESHWARI / THE COLLECTION</span><span>THE VEHICLE. THE JOURNEY. THE EXPERIENCE.</span></div>
   <div className="motion-fleet-title-row">
    <div><span className="motion-eyebrow">01 / FLEET IN MOTION</span><h2>A better journey <em>begins here.</em></h2></div>
    <p>From a thoughtful city transfer to a long-awaited family escape. Find your kind of journey in a fleet made for different ways of travelling.</p>
   </div>
   <div className="motion-fleet-stage" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
    <div className="motion-fleet-copy">
     <span className="motion-active-count">{String(index+1).padStart(2,'0')}<i/> {String(safe.length).padStart(2,'0')}</span>
     <div className="motion-fleet-copy-main" key={active.name}>
      <span className="motion-eyebrow">FEATURED VEHICLE / {active.category.toUpperCase()}</span>
      <h3>{active.name}</h3>
      <p>{active.tag} · {active.seats} seats</p>
      <div className="motion-fleet-rate"><span>Indicative per-km range</span><strong>₹{active.rateMin??15}–₹{active.rateMax??25}<small> / km</small></strong></div>
     </div>
     <div className="motion-fleet-actions">
      <button className="motion-fleet-quote" type="button" onClick={()=>onQuote(active.name)}>Request this vehicle <MoveUpRight size={18}/></button>
      <div className="motion-fleet-nav" role="group" aria-label="Browse fleet">
       <button type="button" onClick={()=>manual(-1)} aria-label="Previous vehicle"><ChevronLeft size={20}/></button>
       <button type="button" onClick={()=>manual(1)} aria-label="Next vehicle"><ChevronRight size={20}/></button>
      </div>
     </div>
     <p className="motion-fleet-disclaimer">Vehicle photos show model references. The exact car, color, availability and price are confirmed with your quotation.</p>
    </div>
    <div className="motion-fleet-gallery">
     <button type="button" className="motion-fleet-sneak is-prev" onClick={()=>manual(-1)} aria-label={'Preview '+previews[0].name}>
       <FleetPhoto src={previews[0].image} name={previews[0].name}/><span>{previews[0].name}</span>
     </button>
     <div className="motion-fleet-feature" onPointerMove={event=>{
       if(event.pointerType==='touch'||reduced)return;
       const rect=event.currentTarget.getBoundingClientRect();
       event.currentTarget.style.setProperty('--fleet-x',((event.clientX-rect.left)/rect.width-.5).toFixed(3));
       event.currentTarget.style.setProperty('--fleet-y',((event.clientY-rect.top)/rect.height-.5).toFixed(3));
      }} onPointerLeave={event=>{event.currentTarget.style.setProperty('--fleet-x','0');event.currentTarget.style.setProperty('--fleet-y','0');}}>
      <div className="motion-fleet-feature-photo" key={active.name+'-'+angle}>
       <FleetPhoto src={photos[angle]||active.image} name={active.name} priority/>
       <div className="motion-fleet-feature-glaze"/>
      </div>
      <span className="motion-feature-tag">THE SIGNATURE COLLECTION</span>
      <div className="motion-feature-foot"><span>{active.category.toUpperCase()}</span><strong>{active.name}</strong></div>
      {photos.length>1&&<div className="motion-fleet-angle" role="group" aria-label={'View other angles of '+active.name}>
        {photos.map((src,i)=><button type="button" key={src+i} aria-label={'View photo angle '+(i+1)} aria-pressed={angle===i}
          className={angle===i?'selected':''} onClick={()=>{setAngle(i);setTouched(true);}}>{String(i+1).padStart(2,'0')}</button>)}
       </div>}
     </div>
     <button type="button" className="motion-fleet-sneak is-next" onClick={()=>manual(1)} aria-label={'Preview '+previews[1].name}>
       <FleetPhoto src={previews[1].image} name={previews[1].name}/><span>{previews[1].name}</span>
     </button>
    </div>
   </div>
   <div className="motion-fleet-select" role="group" aria-label="Choose a vehicle">
    {safe.map((v,i)=><button type="button" key={v.name} aria-pressed={i===index} onClick={()=>{setTouched(true);onSelect(v.name);}}
       className={i===index?'selected':''}><span>{String(i+1).padStart(2,'0')}</span>{v.name}</button>)}
   </div>
   <div className="motion-reel-header">
    <div><span className="motion-eyebrow">DISCOVER THE ANGLES</span><h3>Every detail, in <em>motion.</em></h3></div>
    <button type="button" className="motion-reel-toggle" onClick={()=>{setPaused(v=>!v);setTouched(true);}}
      aria-pressed={paused||reduced} disabled={reduced}>{paused||reduced?<CirclePlay size={18}/>:<CirclePause size={18}/>} {reduced?'Reduced motion':paused?'Play preview':'Pause motion'}</button>
   </div>
   <div className={'motion-reels '+(paused||reduced?'is-paused':'')}>
    <ReelLane vehicles={safe} offset={0} onSelect={name=>{setTouched(true);onSelect(name);}}/>
    <ReelLane vehicles={[...safe].reverse()} offset={1} onSelect={name=>{setTouched(true);onSelect(name);}}/>
   </div>
   <div className="motion-fleet-bottom"><span>Different models. Multiple perspectives. One simple way to plan.</span>
      <a href="#fleet">Compare vehicle details <ArrowRight size={17}/></a></div>
 </section>;
}
