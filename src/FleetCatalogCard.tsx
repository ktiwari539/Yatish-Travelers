import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Maximize2 } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { needsFleetPlateReview } from './mediaSafety';
import { buildFleetGallery, fleetCoverSource } from './fleetGallery';

/**
 * The public fleet is a SELECTION experience, not a duplicate photo viewer.
 * One strong, actual model photo invites a closer look; the studio owns angles,
 * inspection, keyboard/touch controls and the eventual genuine turntable.
 */
export function FleetCatalogCard({car,index,onEstimate,onExplore}:{
 car:FleetReelVehicle;index:number;onEstimate:()=>void;onExplore?:()=>void
}){
 const gallery=useMemo(()=>buildFleetGallery(car),[car.name,car.image,car.gallery]);
 const galleryKey=gallery.map(photo=>photo.src).join('\u001f');
 const [failedSources,setFailedSources]=useState<string[]>([]);
 useEffect(()=>setFailedSources([]),[car.name,galleryKey]);
 const usable=gallery.filter(photo=>!failedSources.includes(photo.src)&&!needsFleetPlateReview(car.name,photo.src));
 const preferredCover=fleetCoverSource(car,usable);
 const hero=usable.find(p=>p.src===preferredCover)||usable[0];
 const editorial=gallery.find(photo=>photo.reviewPending);
 const markFailed=(source:string)=>setFailedSources(prev=>prev.includes(source)?prev:[...prev,source]);
 return <article className="fleet-card premium-catalog-card photo-rich-fleet-card" data-model={car.name}
   data-reviewed-candidate={editorial?.src||''} data-gallery-count={gallery.length}
   data-fleet-role="selection" style={{animationDelay:`${index*70}ms`}}>
  <div className="fleet-visual premium-catalog-visual">
   {hero?<img key={hero.src} src={hero.src}
     alt={car.name+' — model-specific signature photograph'}
     loading="lazy" decoding="async" onError={()=>markFailed(hero.src)}/>:
    <div className="premium-catalog-fallback" role="img"
     aria-label={'Approved photograph unavailable for '+car.name}>
     {car.name}<small>Photo review or installation pending</small>
    </div>}
   <div className="fleet-shade"/>
   {onExplore&&<button type="button" className="fleet-showroom-card-cta" onClick={onExplore}
     aria-label={'Open full-screen car studio for '+car.name}>
     <Maximize2 size={15}/> Inspect in Studio
   </button>}
   <div className="fleet-number">{String(index+1).padStart(2,'0')}</div>
   <span className="fleet-type">{car.category}</span>
   {hero?.reviewPending&&<span className="fleet-photo-editorial-note" title={hero.label}>
      Model reference · local review
   </span>}
  </div>
  <div className="fleet-meta">
   <span>{car.tag}</span><h3>{car.name}</h3>
   <div className="rate"><strong>₹{car.rateMin??15}–₹{car.rateMax??25}</strong><small>/ km indicative range</small></div>
   <div className="fleet-quick-specs" aria-label={'Quick comparison details for '+car.name}>
      <span>{car.seats} seats</span>
      <span>{car.category}</span>
      <span>Final fare on enquiry</span>
   </div>
   <div className="fleet-bottom"><span>EXPLORE THE COLLECTION</span>
    <button type="button" onClick={onEstimate}>Estimate fare <ArrowRight size={15}/></button></div>
   {hero?.credit&&<small className="fleet-card-photo-credit">
     <a href={hero.page} target="_blank" rel="noopener noreferrer">
      {hero.credit}
     </a> · {hero.license} · {hero.reviewPending?'Editorial review pending':'Model reference'}
   </small>}
  </div>
 </article>;
}
