import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Images, Maximize2 } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { needsFleetPlateReview } from './mediaSafety';
import { buildFleetGallery, fleetThumbnailSource } from './fleetGallery';

/** Thumbnail failures are explicit rather than invisible blank boxes.
 * Never disguise missing footage as a different vehicle or angle. */
function PhotoThumb({src,label,onFailure}:{src:string;label:string;onFailure:()=>void}){
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>setStatus('loading'),[src]);
 return status==='failed'?<span className="fleet-angle-pending">Photo pending</span>:
  <>
   <img src={fleetThumbnailSource(src)} loading="eager" decoding="async" alt=""
    className={status==='ready'?'fleet-thumb-ready':'fleet-thumb-loading'}
    onLoad={()=>setStatus('ready')}
    onError={()=>{setStatus('failed');onFailure();}} aria-label={label}/>
   {status==='loading'&&<span className="fleet-angle-loading">Loading photo</span>}
  </>;
}

/** A genuine photograph of this exact model is always required.
 * The three independent editorial images are available for LOCAL acceptance
 * only, with attribution and licence; staff CRM photo choices are untouched.
 */
export function FleetCatalogCard({car,index,onEstimate,onExplore}:{
 car:FleetReelVehicle;index:number;onEstimate:()=>void;onExplore?:()=>void
}){
 const [angle,setAngle]=useState(0);
 const [failedSources,setFailedSources]=useState<string[]>([]);
 const gallery=useMemo(()=>buildFleetGallery(car),[car.name,car.image,car.gallery]);
 const photos=gallery.map(item=>item.src);
 const galleryKey=photos.join('\u001f');
 const editorial=gallery.find(p=>p.reviewPending);
 // URLs are candidates until they load. Never leave a broken thumbnail or
 // failed full-size image as an active angle; use another photo of this model.
 const available=photos.map((_,i)=>i).filter(i=>!failedSources.includes(photos[i]));
 const shown=available.includes(angle)?angle:(available[0]??-1);
 const src=shown>=0?photos[shown]:'';
 const reviewPending=needsFleetPlateReview(car.name,src);
 const selectedPhoto=shown>=0?gallery[shown]:undefined;
 const editorialSelected=Boolean(selectedPhoto?.reviewPending);
 const markFailed=(source:string)=>setFailedSources(prev=>prev.includes(source)?prev:[...prev,source]);
 const nextAngle=()=>{if(available.length<2)return;
   const at=available.indexOf(shown);
   setAngle(available[(at+1)%available.length]);
 };
 useEffect(()=>{setAngle(0);setFailedSources([]);},[car.name,galleryKey]);
 return <article className="fleet-card premium-catalog-card photo-rich-fleet-card" data-model={car.name}
   data-reviewed-candidate={editorial?.src||''} data-gallery-count={photos.length}
    style={{animationDelay:`${index*70}ms`}}>
  <div className="fleet-visual premium-catalog-visual">
   {src&&!reviewPending?<img key={src} src={src} alt={car.name+' — model reference photograph '+(shown+1)}
    loading="lazy" decoding="async" onError={()=>markFailed(src)}/>:
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
   {available.length>1&&<button type="button" className="catalog-angle-button"
      aria-label={'Show another angle of '+car.name}
      title="Browse photographs, not a 360-degree rotation"
      onClick={nextAngle}>
       <Images size={15}/> {available.indexOf(shown)+1}/{available.length}
     </button>}
   {editorialSelected&&<span className="fleet-photo-editorial-note" title={selectedPhoto?.label}>
     Model reference · local review
    </span>}
  </div>
  <div className="fleet-meta">
   <span>{car.tag}</span><h3>{car.name}</h3>
   <div className="rate"><strong>₹{car.rateMin??15}–₹{car.rateMax??25}</strong><small>/ km indicative range</small></div>
   <div className="fleet-photo-preview-strip" role="group" aria-label={'Photo views of '+car.name}>
     {gallery.map((item,i)=><button
       key={item.src} type="button" className={shown===i?'active':''}
       disabled={failedSources.includes(item.src)}
       aria-pressed={shown===i} aria-label={'View '+car.name+' photo '+(i+1)+': '+item.label}
       title={failedSources.includes(item.src)?'Photo unavailable — not selectable':item.label}
       onClick={()=>setAngle(i)}>
       <PhotoThumb src={item.src} label={item.label} onFailure={()=>markFailed(item.src)}/>
       <span>{String(i+1).padStart(2,'0')}</span>
     </button>)}
     {available.length<=1&&<small className="fleet-single-photo-label">More working angles awaiting review</small>}
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
