import { useEffect, useState } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { needsInnovaPlateReview } from './mediaSafety';

export function FleetCatalogCard({car,index,onEstimate}:{car:FleetReelVehicle;index:number;onEstimate:()=>void}){
 const [angle,setAngle]=useState(0);
 const [failed,setFailed]=useState(false);
 const photos=[car.image,...(car.gallery||[])].filter(Boolean).slice(0,6);
 const src=photos[angle]??car.image;
 const reviewPending=needsInnovaPlateReview(car.name,src);
 useEffect(()=>setFailed(false),[src]);
 return <article className="fleet-card premium-catalog-card" data-model={car.name} style={{animationDelay:`${index*70}ms`}}>
  <div className="fleet-visual premium-catalog-visual">
   {!failed&&!reviewPending?<img src={src} alt={car.name+' photo angle '+(angle+1)} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:
    <div className="premium-catalog-fallback" role="img" aria-label={reviewPending?'Registration plate review pending for '+car.name:'Photo unavailable for '+car.name}>{car.name}<small>{reviewPending?'Registration plate review pending':'Image unavailable'}</small></div>}
   <div className="fleet-shade"/>
   <div className="fleet-number">{String(index+1).padStart(2,'0')}</div>
   <span className="fleet-type">{car.category}</span>
   {photos.length>1&&<button type="button" className="catalog-angle-button"
      aria-label={'Show another angle of '+car.name} onClick={()=>setAngle(i=>(i+1)%photos.length)}>
      <RotateCw size={15}/> {angle+1}/{photos.length}
     </button>}
  </div>
  <div className="fleet-meta">
   <span>{car.tag}</span><h3>{car.name}</h3>
   <div className="rate"><strong>₹{car.rateMin??15}–₹{car.rateMax??25}</strong><small>/ km indicative range</small></div>
   <div className="fleet-bottom"><span>{car.seats} seats · {car.category}</span>
    <button type="button" onClick={onEstimate}>Estimate fare <ArrowRight size={15}/></button></div>
  </div>
 </article>;
}
