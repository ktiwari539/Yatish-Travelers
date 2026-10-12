import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Compass, MoveUpRight } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';

export type FleetReelVehicle={
 name:string;seats:string;tag:string;category:string;image:string;
 gallery?:string[];rateMin?:number;rateMax?:number;
};
type Props={vehicles:FleetReelVehicle[];activeName:string;onSelect:(name:string)=>void;onQuote:(name:string)=>void};
const editorialScenes=[luxuryMedia.mountains,luxuryMedia.hero,luxuryMedia.forest] as const;
const legacyUnsuitable=new Set(['Mahindra TUV','Mahindra Bolero','Tempo Traveller']);
const isEditorialOnly=(vehicle:FleetReelVehicle)=>legacyUnsuitable.has(vehicle.name)&&
  /commons\.wikimedia\.org|wikipedia\.org/.test(vehicle.image);
const preview=(vehicle:FleetReelVehicle,position:number)=>{
 if(isEditorialOnly(vehicle))return {src:editorialScenes[position%editorialScenes.length].src,
  fallback:editorialScenes[position%editorialScenes.length].fallback,
  alt:editorialScenes[position%editorialScenes.length].alt,editorial:true};
 return {src:vehicle.image,fallback:undefined,alt:vehicle.name+' vehicle model reference',editorial:false};
};
export function PremiumFleetExperience({vehicles,activeName,onSelect,onQuote}:Props){
 const [angle,setAngle]=useState(0);
 const [failed,setFailed]=useState(false);
 const rail=useRef<HTMLDivElement|null>(null);
 const activeIndex=Math.max(0,vehicles.findIndex(v=>v.name===activeName));
 const active=vehicles[activeIndex];
 const item=useMemo(()=>active?preview(active,activeIndex):null,[active,activeIndex]);
 const angleUrls=active&&!item?.editorial?[active.image,...(active.gallery||[])].filter(Boolean):[];
 const chosenUrl=angleUrls[angle]||item?.src||'';
 useEffect(()=>{setAngle(0);setFailed(false);},[activeName]);
 useEffect(()=>setFailed(false),[chosenUrl]);
 const choose=(index:number)=>{
  if(!vehicles.length)return;
  const next=(index+vehicles.length)%vehicles.length;
  onSelect(vehicles[next].name);
 };
 if(!active||!item)return null;
 const showEditorial=Boolean(item.editorial||failed);
 return <section className="fleet-editorial" id="motion-fleet" aria-label="Our premium fleet collection">
   <div className="fleet-editorial-heading">
     <span className="fleet-editorial-kicker"><Compass size={15}/> THE MATESHWARI COLLECTION</span>
     <div><h2>Every journey, <em>considered.</em></h2>
       <p>From everyday city rides to unforgettable long-distance journeys, discover the right space for your next chapter.</p></div>
   </div>
   <div className="fleet-editorial-stage">
    <div className="fleet-editorial-picture" key={active.name+'-'+angle}>
     {showEditorial?<ScenicImage src={failed?luxuryMedia.mountains.src:item.src} fallback={failed?luxuryMedia.mountains.fallback:item.fallback} alt={failed?'Travel inspiration photo — selected model reference unavailable':item.alt} loading="lazy"/>:
       <img src={chosenUrl} alt={active.name+' vehicle reference photograph'} loading="lazy" onError={()=>setFailed(true)}/>}
     <div className="fleet-editorial-gradient"/>
     <div className="fleet-editorial-frame-tag"><span/> {showEditorial?'JOURNEY INSPIRATION':'MODEL REFERENCE PHOTO'}</div>
     <span className="fleet-editorial-frame-count">0{activeIndex+1} — 0{vehicles.length}</span>
     <div className="fleet-editorial-frame-caption">{showEditorial?'Travel is about the places along the way.':'A closer look at the category you have selected.'}</div>
     {angleUrls.length>1&&!failed&&<div className="fleet-editorial-angles" role="group" aria-label="Choose reference photo angle">
       {angleUrls.map((url,i)=><button type="button" key={url+i} className={i===angle?'selected':''}
          aria-pressed={i===angle} onClick={()=>setAngle(i)} aria-label={'View angle '+(i+1)}>{String(i+1).padStart(2,'0')}</button>)}
      </div>}
    </div>
    <div className="fleet-editorial-description">
      <span className="fleet-editorial-chapter">THE COLLECTION / {String(activeIndex+1).padStart(2,'0')}</span>
      <div className="fleet-editorial-model" key={active.name}>
       <span className="fleet-editorial-class">{active.category.toUpperCase()} <i/> {active.seats} SEATS</span>
       <h3>{active.name}</h3>
       <p>{active.tag}. Vehicle and itinerary details are confirmed with your booking quotation.</p>
       <div className="fleet-editorial-rate"><small>INDICATIVE RATE PER KM</small>
         <strong>₹{active.rateMin??15}–₹{active.rateMax??25}<span> / km</span></strong></div>
       <button type="button" className="fleet-editorial-request" onClick={()=>onQuote(active.name)}>Request this vehicle <MoveUpRight size={18}/></button>
      </div>
      <div className="fleet-editorial-navigation">
       <button type="button" onClick={()=>choose(activeIndex-1)} aria-label="Previous model"><ChevronLeft size={20}/></button>
       <span>CHOOSE YOUR VEHICLE</span>
       <button type="button" onClick={()=>choose(activeIndex+1)} aria-label="Next model"><ChevronRight size={20}/></button>
      </div>
    </div>
   </div>
   <div className="fleet-editorial-strip-title"><span>EXPLORE ALL SIX VEHICLE STYLES</span><span>SWIPE TO EXPLORE <ArrowRight size={15}/></span></div>
   <div className="fleet-editorial-rail" ref={rail} role="group" aria-label="Select any vehicle">
    {vehicles.map((v,i)=>{
      const vImage=preview(v,i);
      return <button type="button" key={v.name} className={'fleet-editorial-tile '+(i===activeIndex?'selected':'')}
        aria-pressed={i===activeIndex} onClick={()=>choose(i)}>
        <div className="fleet-editorial-tile-photo">
          <ScenicImage src={vImage.src} fallback={vImage.fallback??luxuryMedia.forest.src}
            alt={vImage.alt} loading="lazy"/>
          <span>{vImage.editorial?'TRAVEL INSPIRATION':v.category.toUpperCase()}</span>
        </div>
        <div className="fleet-editorial-tile-foot"><span>{String(i+1).padStart(2,'0')}</span>
          <strong>{v.name}</strong><ArrowUpRight size={16}/></div>
      </button>;
    })}
   </div>
   <div className="fleet-editorial-footer">
     <p>Model photos are illustrative; actual vehicle, color and availability may vary. Editorial travel photos are not representations of the selected vehicle.</p>
     <a href="#fleet">See full vehicle comparison <ArrowRight size={16}/></a>
   </div>
 </section>;
}
