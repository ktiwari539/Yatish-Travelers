import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Images, Maximize2 } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { needsInnovaPlateReview } from './mediaSafety';
import { studioEditorialFor } from './studioPhotography';

/** A genuine photograph of this exact model is always required.
 * The three independent editorial images are available for LOCAL acceptance
 * only, with attribution and licence; staff CRM photo choices are untouched.
 */
export function FleetCatalogCard({car,index,onEstimate,onExplore}:{
 car:FleetReelVehicle;index:number;onEstimate:()=>void;onExplore?:()=>void
}){
 const [angle,setAngle]=useState(0);
 const [failed,setFailed]=useState(false);
 const editorial=studioEditorialFor(car.name);
 const photos=useMemo(()=>{
   const localPreferred:Record<string,string>={
     'Mahindra XUV700':'/media/mt-xuv700-studio.webp',
     'Mahindra Thar':'/media/mt-thar-red-front.webp',
     'Tempo Traveller':'/media/mt-traveller-safe.webp'
   };
   const verified=localPreferred[car.name];
   const approvedGallery=[car.image,...(car.gallery||[])];
   return [...(editorial?[editorial.src]:[]),...(verified&&approvedGallery.includes(verified)?[verified]:[]),...approvedGallery]
     .filter((src,n,arr)=>Boolean(src)&&arr.indexOf(src)===n).slice(0,7);
 },[car.name,car.image,car.gallery,editorial?.src]);
 const shown=Math.min(angle,Math.max(photos.length-1,0));
 const src=photos[shown]??car.image;
 const reviewPending=needsInnovaPlateReview(car.name,src);
 const editorialSelected=Boolean(editorial&&src===editorial.src);
 useEffect(()=>setFailed(false),[src]);
 useEffect(()=>setAngle(0),[car.name]);
 return <article className="fleet-card premium-catalog-card photo-rich-fleet-card" data-model={car.name}
   data-reviewed-candidate={editorial?.src||''}
    style={{animationDelay:`${index*70}ms`}}>
  <div className="fleet-visual premium-catalog-visual">
   {!failed&&!reviewPending?<img src={src} alt={car.name+' — authentic model photograph '+(shown+1)}
    loading="lazy" decoding="async" onError={()=>{
       // If a high-resolution local-review image is offline, fall back to the
       // existing photograph of the SAME vehicle. Never substitute another model.
       if(editorialSelected&&photos.length>1)setAngle(i=>Math.min(i+1,photos.length-1));
       else setFailed(true);
    }}/>:
    <div className="premium-catalog-fallback" role="img"
      aria-label={reviewPending?'Registration plate review pending for '+car.name:'Photo unavailable for '+car.name}>
      {car.name}<small>{reviewPending?'Registration plate review pending':'Photograph temporarily unavailable'}</small>
    </div>}
   <div className="fleet-shade"/>
   {onExplore&&<button type="button" className="fleet-showroom-card-cta" onClick={onExplore}
      aria-label={'Open full-screen car studio for '+car.name}>
       <Maximize2 size={15}/> Explore photos
   </button>}
   <div className="fleet-number">{String(index+1).padStart(2,'0')}</div>
   <span className="fleet-type">{car.category}</span>
   {photos.length>1&&<button type="button" className="catalog-angle-button"
      aria-label={'Show another angle of '+car.name}
      title="Browse photographs, not a 360-degree rotation"
      onClick={()=>setAngle(i=>(i+1)%photos.length)}>
       <Images size={15}/> {shown+1}/{photos.length}
     </button>}
   {editorialSelected&&<span className="fleet-photo-editorial-note" title={editorial?.model}>
     Model reference · local review
    </span>}
  </div>
  <div className="fleet-meta">
   <span>{car.tag}</span><h3>{car.name}</h3>
   <div className="rate"><strong>₹{car.rateMin??15}–₹{car.rateMax??25}</strong><small>/ km indicative range</small></div>
   <div className="fleet-bottom"><span>{car.seats} seats · {car.category}</span>
    <button type="button" onClick={onEstimate}>Estimate fare <ArrowRight size={15}/></button></div>
   {editorialSelected&&editorial&&<small className="fleet-card-photo-credit">
     <a href={editorial.page} target="_blank" rel="noopener noreferrer">
       {editorial.credit}
     </a> · {editorial.license} · Privacy review pending
   </small>}
  </div>
 </article>;
}
