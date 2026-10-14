import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Images, Maximize2 } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { needsInnovaPlateReview } from './mediaSafety';
import { buildFleetGallery } from './fleetGallery';

/** Thumbnail failures are explicit rather than invisible blank boxes.
 * Never disguise missing footage as a different vehicle or angle. */
function PhotoThumb({src,label}:{src:string;label:string}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return failed?<span className="fleet-angle-pending">Photo pending</span>:
  <img src={src} loading="lazy" decoding="async" alt=""
   onError={()=>setFailed(true)} aria-label={label}/>;
}

/** A genuine photograph of this exact model is always required.
 * The three independent editorial images are available for LOCAL acceptance
 * only, with attribution and licence; staff CRM photo choices are untouched.
 */
export function FleetCatalogCard({car,index,onEstimate,onExplore}:{
 car:FleetReelVehicle;index:number;onEstimate:()=>void;onExplore?:()=>void
}){
 const [angle,setAngle]=useState(0);
 const [failed,setFailed]=useState(false);
 const gallery=useMemo(()=>buildFleetGallery(car),[car.name,car.image,car.gallery]);
 const photos=gallery.map(item=>item.src);
 const editorial=gallery.find(p=>p.reviewPending);
 const shown=Math.min(angle,Math.max(photos.length-1,0));
 const src=photos[shown]??car.image;
 const reviewPending=needsInnovaPlateReview(car.name,src);
 const selectedPhoto=gallery[shown];
 const editorialSelected=Boolean(selectedPhoto?.reviewPending);
 useEffect(()=>setFailed(false),[src]);
 useEffect(()=>setAngle(0),[car.name]);
 return <article className="fleet-card premium-catalog-card photo-rich-fleet-card" data-model={car.name}
   data-reviewed-candidate={editorial?.src||''} data-gallery-count={photos.length}
    style={{animationDelay:`${index*70}ms`}}>
  <div className="fleet-visual premium-catalog-visual">
   {!failed&&!reviewPending?<img key={src} src={src} alt={car.name+' — authentic model photograph '+(shown+1)}
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
   {editorialSelected&&<span className="fleet-photo-editorial-note" title={selectedPhoto?.label}>
     Model reference · local review
    </span>}
  </div>
  <div className="fleet-meta">
   <span>{car.tag}</span><h3>{car.name}</h3>
   <div className="rate"><strong>₹{car.rateMin??15}–₹{car.rateMax??25}</strong><small>/ km indicative range</small></div>
   <div className="fleet-photo-preview-strip" role="group" aria-label={'Photo views of '+car.name}>
     {gallery.slice(0,3).map((item,i)=><button
       key={item.src} type="button" className={shown===i?'active':''}
       aria-pressed={shown===i} aria-label={'View '+car.name+' photo '+(i+1)+': '+item.label}
       onClick={()=>setAngle(i)}>
       <PhotoThumb src={item.src} label={item.label}/>
       <span>{String(i+1).padStart(2,'0')}</span>
     </button>)}
     {photos.length===1&&<small className="fleet-single-photo-label">More real angles awaiting approval</small>}
   </div>
   <div className="fleet-bottom"><span>{car.seats} seats · {car.category}</span>
    <button type="button" onClick={onEstimate}>Estimate fare <ArrowRight size={15}/></button></div>
   {selectedPhoto?.credit&&<small className="fleet-card-photo-credit">
     <a href={selectedPhoto.page} target="_blank" rel="noopener noreferrer">
       {selectedPhoto.credit}
     </a> · {selectedPhoto.license} · {selectedPhoto.reviewPending?'Editorial review pending':'Model reference'}
   </small>}
  </div>
 </article>;
}
