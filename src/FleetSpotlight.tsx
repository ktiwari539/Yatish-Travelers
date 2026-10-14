import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CarFront } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type Props={
 vehicles:FleetReelVehicle[];
 onExplore:(name:string)=>void;
 onEstimate:(name:string)=>void;
};
type Highlight={name:string;photo:string;eyebrow:string;story:string};
const approvedHighlights:Highlight[]=[
 {name:'Mahindra XUV700',photo:'/media/mt-xuv700-studio.webp',eyebrow:'EXECUTIVE COMFORT',
  story:'For longer journeys that call for space, quiet comfort and a thoughtful arrival.'},
 {name:'Mahindra Thar',photo:'/media/mt-thar-red-front.webp',eyebrow:'THE ADVENTURE CHOICE',
  story:'For those who prefer a distinctive SUV and a journey beyond the ordinary.'},
 {name:'Tempo Traveller',photo:'/media/mt-traveller-safe.webp',eyebrow:'TRAVEL TOGETHER',
  story:'A practical group-travel reference, with capacity confirmed for every enquiry.'}
];
function VerifiedImage({name,src}:{name:string;src:string}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 if(failed)return <div className="fleet-atelier-photo-fallback" role="img" aria-label={name+' reviewed photo unavailable'}>
    <CarFront size={58} strokeWidth={1}/><strong>{name}</strong><span>Reviewed vehicle image unavailable on this device</span>
   </div>;
 return <img key={src} src={src} alt={name+' — reviewed model-reference photograph'}
    decoding="async" loading="lazy" onError={()=>setFailed(true)}/>;
}
export function FleetSpotlight({vehicles,onExplore,onEstimate}:Props){
 const choices=useMemo(()=>approvedHighlights.filter(h=>vehicles.some(v=>v.name===h.name)),[vehicles]);
 const [activeName,setActiveName]=useState('Mahindra XUV700');
 const index=Math.max(0,choices.findIndex(h=>h.name===activeName));
 const highlight=choices[index];
 const vehicle=highlight&&vehicles.find(v=>v.name===highlight.name);
 if(!highlight||!vehicle)return null;
 const change=(delta:number)=>{setActiveName(choices[(index+delta+choices.length)%choices.length].name);};
 return <div className="fleet-studio-launch fleet-atelier" aria-label="Browse featured vehicle photographs">
   <div className="fleet-atelier-copy">
     <span className="fleet-atelier-kicker"><span className="fleet-atelier-kicker-mark"/> THE MATESHWARI COLLECTION <span className="fleet-atelier-kicker-line"/></span>
     <h3>Find a ride that <em>feels right.</em></h3>
     <p>Explore actual model-reference photographs, compare the essentials and choose the vehicle that fits your plans.</p>
     <div className="fleet-atelier-selection">
       <span>FEATURED VEHICLE <b>{String(index+1).padStart(2,'0')} / {String(choices.length).padStart(2,'0')}</b></span>
       <div key={vehicle.name} className="fleet-atelier-selection-body">
         <strong>{vehicle.name}</strong>
         <small>{highlight.eyebrow}</small>
         <p>{highlight.story}</p>
       </div>
       <div className="fleet-atelier-specs">
         <span><strong>{vehicle.seats}</strong> Seating configuration</span>
         <span><strong>₹{vehicle.rateMin??15}–₹{vehicle.rateMax??25}/km</strong> Indicative range</span>
       </div>
     </div>
     <div className="fleet-atelier-actions">
       <button type="button" className="fleet-atelier-main-cta" onClick={()=>onExplore(vehicle.name)}>
         View {vehicle.name} photos <ArrowUpRight size={19}/>
       </button>
       <button type="button" className="fleet-atelier-secondary-cta" onClick={()=>onEstimate(vehicle.name)}>
         Estimate fare <ArrowRight size={16}/>
       </button>
     </div>
   </div>
   <div className="fleet-atelier-visual">
     <div className="fleet-atelier-stage" aria-hidden="true"><span/><span/></div>
     <div key={vehicle.name} className="fleet-atelier-photo">
       <VerifiedImage name={vehicle.name} src={highlight.photo}/>
     </div>
     <div className="fleet-atelier-caption"><span>REAL VEHICLE PHOTOGRAPHY</span><strong>{vehicle.name}</strong></div>
     <div className="fleet-atelier-pagination">
       <button type="button" aria-label="Previous featured vehicle" onClick={()=>change(-1)}><ChevronLeft size={21}/></button>
       <span>{String(index+1).padStart(2,'0')} <i/> {String(choices.length).padStart(2,'0')}</span>
       <button type="button" aria-label="Next featured vehicle" onClick={()=>change(1)}><ChevronRight size={21}/></button>
     </div>
   </div>
   <div className="fleet-atelier-rail" role="group" aria-label="Choose a featured vehicle">
     {choices.map((item,n)=><button key={item.name} type="button" className={item.name===vehicle.name?'active':''}
       aria-pressed={item.name===vehicle.name} onClick={()=>setActiveName(item.name)}>
        <span>{String(n+1).padStart(2,'0')}</span><strong>{item.name}</strong>
        <ArrowUpRight size={14}/>
       </button>)}
   </div>
   <small className="fleet-atelier-disclaimer">The photographs identify vehicle models, not an assigned car or guaranteed trim. Colour and availability are confirmed before booking.</small>
 </div>;
}
