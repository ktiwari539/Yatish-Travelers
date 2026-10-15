import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CarFront, ChevronLeft, ChevronRight, Maximize2, MousePointer2, ShieldCheck, Sparkles, X, Zap, Gauge, ScanLine } from 'lucide-react';
import { needsFleetPlateReview } from './mediaSafety';
import { buildFleetGallery } from './fleetGallery';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type ShowroomVehicle=FleetReelVehicle & {capacity?:number;modelUrl?:string};
type Props={
 vehicles:ShowroomVehicle[];
 initialName:string;
 onClose:()=>void;
 onQuote:(name:string)=>void;
};
const knownSafePreview=(src:string)=>/^\/media\/mt-(?:thar-(?:red-front|red-rear|grey-road|grey-front-safe)|xuv700-(?:driving|studio)|traveller-safe)\.webp$/.test(src);
function RideStudioPhoto({car,src,angle,onFailure}:{car:ShowroomVehicle;src:string;angle:number;onFailure:(src:string)=>void}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 const platePending=needsFleetPlateReview(car.name,src);
 if(!src||platePending||failed){
  return <div className="ride-studio-photo-pending" role="img" aria-label={car.name+' photograph awaiting review'}>
   <CarFront size={75} strokeWidth={1.1}/>
   <strong>{car.name}</strong>
   <span>{platePending?'Registration-plate review pending':'A model-specific photo is not currently available'}</span>
  </div>;
 }
 return <img key={src} className="ride-studio-car-image" src={src}
  alt={car.name+' reference photograph — angle '+(angle+1)}
  onError={()=>{setFailed(true);onFailure(src);}} draggable={false}/>;
}
/** Keep the failed state visible. A hidden image must not remain a clickable angle. */
function RideStudioThumb({src,onFailure}:{src:string;onFailure:()=>void}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return failed?<span className="ride-studio-thumb-pending">Photo pending</span>:
  <img src={src} alt="" loading="lazy" decoding="async"
   onError={()=>{setFailed(true);onFailure();}}/>;
}
export function RideShowroom({vehicles,initialName,onClose,onQuote}:Props){
 const [vehicleIndex,setVehicleIndex]=useState(()=>Math.max(0,vehicles.findIndex(v=>v.name===initialName)));
 const [angle,setAngle]=useState(0);
 const [failedSources,setFailedSources]=useState<string[]>([]);
 const [details,setDetails]=useState(false);
 const [revealId,setRevealId]=useState(0);
 const [switching,setSwitching]=useState(false);
 const switchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [cinematicOn,setCinematicOn]=useState(true);
 const [lightPreset,setLightPreset]=useState<'ion'|'titanium'|'ember'>('ion');
 const [reducedMotion,setReducedMotion]=useState(false);
 const [pointerDown,setPointerDown]=useState<number|null>(null);
 const [dragging,setDragging]=useState(false);
 const closeRef=useRef<HTMLButtonElement|null>(null);
 const dialogRef=useRef<HTMLDivElement|null>(null);
 const previousFocus=useRef<Element|null>(null);
 const active=vehicles[vehicleIndex]||vehicles[0];
 const gallery=useMemo(()=>active?buildFleetGallery(active):[],[active]);
 const photos=gallery.map(p=>p.src);
 const galleryKey=photos.join('\u001f');
 const available=photos.map((_,i)=>i).filter(i=>!failedSources.includes(photos[i]));
 const shownAngle=available.includes(angle)?angle:(available[0]??-1);
 const image=shownAngle>=0?photos[shownAngle]:'';
 const selectedPhoto=shownAngle>=0?gallery[shownAngle]:undefined;
 const markFailed=(src:string)=>setFailedSources(prev=>prev.includes(src)?prev:[...prev,src]);
 useEffect(()=>{setFailedSources([]);setAngle(0);},[active?.name,galleryKey]);
 const isReferenceApproved=knownSafePreview(image);
 const studioAssetQuality=isReferenceApproved?'reviewed-local':'editorial-reference';
 const imageSource=selectedPhoto;
 const isEditorialChoice=Boolean(selectedPhoto?.reviewPending);
 const setCar=(index:number)=>{
  const destination=(index+vehicles.length)%vehicles.length;
  if(destination===vehicleIndex)return;
  // Exit the old vehicle first; the new image or WebGL scene mounts only
  // after the old model visibly leaves the stage.
  if(switchTimer.current!==null)clearTimeout(switchTimer.current);
  setSwitching(true);
  switchTimer.current=setTimeout(()=>{
    setVehicleIndex(destination);
    setAngle(0);setDetails(false);setPointerDown(null);setDragging(false);
    setRevealId(count=>count+1);
    setSwitching(false);
    switchTimer.current=null;
  },310);
 };
 const nextAngle=(delta:number)=>{
  if(available.length<2)return;
  const current=available.indexOf(shownAngle);
  setAngle(available[(current+delta+available.length)%available.length]);
  setRevealId(count=>count+1);
 };
 useEffect(()=>{
  previousFocus.current=document.activeElement;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  closeRef.current?.focus();
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(mq.matches);
  update();
  mq.addEventListener('change',update);
  return ()=>{
   if(switchTimer.current!==null)clearTimeout(switchTimer.current);
   document.body.style.overflow=oldOverflow;
   mq.removeEventListener('change',update);
   if(previousFocus.current instanceof HTMLElement)previousFocus.current.focus();
  };
 },[]);
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key==='ArrowLeft'){event.preventDefault();setCar(vehicleIndex-1);return;}
   if(event.key==='ArrowRight'){event.preventDefault();setCar(vehicleIndex+1);return;}
   if(event.key==='ArrowUp'){event.preventDefault();nextAngle(1);return;}
   if(event.key==='ArrowDown'){event.preventDefault();nextAngle(-1);return;}
   if(event.key==='Tab'){
    const focusable=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
     'button:not([disabled]):not([tabindex="-1"]), a[href], [tabindex="0"]')||[]);
    if(!focusable.length)return;
    const currentIndex=focusable.indexOf(document.activeElement as HTMLElement);
    if(event.shiftKey&&currentIndex<=0){event.preventDefault();focusable[focusable.length-1].focus();}
    else if(!event.shiftKey&&currentIndex===focusable.length-1){event.preventDefault();focusable[0].focus();}
   }
  };
  document.addEventListener('keydown',handler);
  return()=>document.removeEventListener('keydown',handler);
 },[vehicleIndex,angle,photos.length,onClose,vehicles.length]);
 if(!active)return null;
 const onPointerRelease=(clientX:number)=>{
  if(pointerDown===null)return;
  const distance=clientX-pointerDown;
  if(Math.abs(distance)>35){
   setDragging(true);
   nextAngle(distance<0?1:-1);
  }
  setPointerDown(null);
 };
 const productDetails=<div className="ride-studio-facts" aria-label="Vehicle reference details">
  <div><span>Passenger configuration</span><strong>{active.seats}</strong></div>
  <div><span>Vehicle category</span><strong>{active.category}</strong></div>
  <div><span>Indicative / km</span><strong>₹{active.rateMin??15}–₹{active.rateMax??25}</strong></div>
  <div><span>Available photo angles</span><strong>{available.length}</strong></div>
  <div><span>Colour / variant</span><strong>Confirm before booking</strong></div>
  <div><span>Assigned vehicle</span><strong>Confirmed on enquiry</strong></div>
 </div>;
 return createPortal(<div className={'ride-studio-backdrop garage-luxe-v19 garage-light-'+lightPreset}>
  <div ref={dialogRef} className="ride-studio-dialog" role="dialog" aria-modal="true"
    aria-label="Mateshwari full-screen vehicle studio">
   <div className="ride-studio-topbar">
    <div className="ride-studio-wordmark"><Sparkles size={17}/><strong>MATESHWARI <span>MOTOR STUDIO</span></strong><small>INTERACTIVE FLEET PREVIEW</small></div>
    <span className="ride-studio-step">SELECT THE REAL VEHICLE <i/> EXPLORE PHOTO ANGLES <i/> INSPECT DETAILS</span>
    <button ref={closeRef} className="ride-studio-close" type="button" onClick={onClose} aria-label="Close car studio">
     <X size={20}/> <span>Exit studio</span>
    </button>
   </div>
   <div className="ride-studio-body">
    <div className={'ride-studio-stage ride-studio-stage-v18'+(!cinematicOn?' no-cinematic':'')+(switching?' is-switching':'')} data-vehicle={active.name} data-media-quality={studioAssetQuality}>
     <div className="ride-studio-atmosphere" aria-hidden="true"/>
     <div className="ride-studio-softbox softbox-left" aria-hidden="true"/>
     <div className="ride-studio-softbox softbox-right" aria-hidden="true"/>
     <div className="ride-studio-garage" aria-hidden="true">
       <div className="ride-studio-light light-left"/><div className="ride-studio-light light-right"/>
       <div className="ride-studio-horizon"/><div className="ride-studio-floor"/><div className="ride-studio-grid"/>
       <div className="ride-studio-runway"/><div className="ride-studio-orbit"><i/><i/><i/></div>
     </div>
     <div className="ride-studio-reveal" key={'reveal-'+revealId} aria-hidden="true">
       <span className="ride-studio-reveal-gate"/>
       <strong>VEHICLE INITIALIZED</strong><small>{active.name} / {String(vehicleIndex+1).padStart(2,'0')}</small>
       <i/><i/><i/>
     </div>
     <div className="ride-studio-stage-head"><span className="ride-studio-eyebrow"><Zap size={14}/> GARAGE BAY / {String(vehicleIndex+1).padStart(2,'0')} — {String(vehicles.length).padStart(2,'0')}</span><span>{isReferenceApproved?'REVIEWED LOCAL REFERENCE':'EDITORIAL MODEL REFERENCE'}</span></div>
     <div className="ride-studio-scanner" aria-hidden="true"><ScanLine size={14}/> REAL CAR PHOTOGRAPHY <i/> MODEL-SPECIFIC VIEW</div>
     <div className="ride-studio-car-title" aria-hidden="true"><small>THE GARAGE / {String(vehicleIndex+1).padStart(2,'0')}</small><strong>{active.name}</strong></div>
     <div className="ride-studio-illumination" role="group" aria-label="Change studio environment lighting">
       {(['ion','titanium','ember'] as const).map(preset=><button
         key={preset} type="button" aria-label={'Use '+preset+' studio lighting'}
         aria-pressed={lightPreset===preset}
         className={lightPreset===preset?'selected':''}
         onClick={()=>setLightPreset(preset)}><span className={'light-dot '+preset}/>{preset==='ion'?'ION BLUE':preset==='titanium'?'TITANIUM':'AMBER'}</button>)}
     </div>
     <div className="ride-studio-garage-ticks" aria-hidden="true"><b>01</b><i/><i/><i/><i/><i/><b>100</b></div>
     <button type="button" className="ride-studio-image-action"
         aria-label={'Explore specifications of '+active.name}
         onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button===0){setPointerDown(event.clientX);setDragging(false);}}}
         onPointerUp={event=>onPointerRelease(event.clientX)}
         onPointerCancel={()=>setPointerDown(null)}
         onClick={()=>{if(dragging){setDragging(false);return;}setDetails(true);}}>
         <div key={active.name+'-'+shownAngle} className={'ride-studio-vehicle-frame '+(isReferenceApproved?'is-reviewed':'is-editorial')}>
           <div className="ride-studio-frame-glow" aria-hidden="true"/>
           {image&&!failedSources.includes(image)&&!needsFleetPlateReview(active.name,image)&&<img className="ride-studio-image-atmosphere" src={image} aria-hidden="true" alt=""/>}
           <RideStudioPhoto car={active} src={image} angle={shownAngle} onFailure={markFailed}/>
           <div className="ride-studio-frame-sweep" aria-hidden="true"/>
         </div>
         <span className="ride-studio-zoom-hint"><Maximize2 size={16}/> EXPLORE VEHICLE DETAILS</span>
       </button>
     <div className="ride-studio-photo-strip" role="group" aria-label={'Select photo view of '+active.name}>
       {gallery.map((photo,i)=><button type="button" key={photo.src}
          aria-label={'Show '+active.name+' photo '+(i+1)} aria-pressed={shownAngle===i}
          disabled={failedSources.includes(photo.src)}
          title={failedSources.includes(photo.src)?'Photo unavailable — not selectable':photo.label}
          className={shownAngle===i?'active':''} onClick={()=>{setAngle(i);setRevealId(n=>n+1);}}>
         <RideStudioThumb src={photo.src} onFailure={()=>markFailed(photo.src)}/>
         <span>{String(i+1).padStart(2,'0')}</span>
       </button>)}
       {available.length<=1&&<span className="ride-studio-photo-count">More working angles pending review</span>}
     </div>
     <div className="ride-studio-stage-footer">
      <div><strong><Gauge size={15}/> {available.length>1?'CAMERA BAY / MODEL PHOTOGRAPHS':'MODEL REFERENCE'}</strong>
        <span>{available.length>1?'Swipe or use the arrows to browse real photographic angles':'True 360° rotation is available only with a verified model-specific 3D asset.'}</span></div>
      <div className="ride-studio-angle-nav" role="group" aria-label="Photo-angle controls">
       <button type="button" aria-label="Previous photo angle" disabled={available.length<2} onClick={()=>nextAngle(-1)}><ChevronLeft size={23}/></button>
       <span>{String(Math.max(available.indexOf(shownAngle)+1,0)).padStart(2,'0')} / {String(available.length).padStart(2,'0')}</span>
       <button type="button" aria-label="Next photo angle" disabled={available.length<2} onClick={()=>nextAngle(1)}><ChevronRight size={23}/></button>
      </div>
     </div>
     {!reducedMotion&&<span className="ride-studio-ambient-label" aria-hidden="true">PREMIUM ROAD EXPERIENCES</span>}
    </div>
    <aside className={'ride-studio-panel'+(switching?' is-switching':'')}>
      <div className="ride-studio-panel-heading">
       <span className="ride-studio-eyebrow">SELECTED MODEL / {String(vehicleIndex+1).padStart(2,'0')}</span>
       <h2>{active.name}</h2>
       <p>{active.tag} · {active.category}</p>
       <div className="ride-studio-energy" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
      </div>
      <div className="ride-studio-panel-meta"><span>{active.seats} seating</span><span>₹{active.rateMin??15}–₹{active.rateMax??25} / km indicative</span></div>
      <p className="ride-studio-media-truth">{isReferenceApproved?'Reviewed model-specific photograph.':isEditorialChoice?'Licensed model-reference photograph for local review. Plate and variant approval remain pending.':'Model-specific reference photo. Actual assigned car, trim and colour confirmed before booking.'}</p>
      {imageSource?.credit&&<p className="ride-studio-photo-credit">
        <a href={imageSource.page} target="_blank" rel="noreferrer">{imageSource.credit}</a> · {imageSource.license} · {imageSource.label} · {imageSource.reviewPending?'Local review only':'Licensed model reference'}.
      </p>}
      <div className="ride-studio-switch">
       <button type="button" aria-label="Previous vehicle" onClick={()=>setCar(vehicleIndex-1)}><ArrowLeft size={18}/> Previous</button>
       <button type="button" aria-label="Next vehicle" onClick={()=>setCar(vehicleIndex+1)}>Next <ArrowRight size={18}/></button>
      </div>
      <button type="button" className="ride-studio-detail-button" aria-expanded={details}
        onClick={()=>setDetails(current=>!current)}>
       {details?'Hide vehicle details':'Explore this vehicle'} <ArrowRight size={18}/>
      </button>
      {details?productDetails:<div className="ride-studio-preview-copy">
       <strong>THE ACTUAL VEHICLE REFERENCE</strong>
       <p>Browse available photographs of this exact model, then inspect the booking specifications. No unrelated cars or simulated 360° rotation.</p>
       <div><MousePointer2 size={16}/> Select another model below or use the arrow keys.</div>
       <button type="button" className="ride-studio-cinematic-toggle" aria-pressed={!cinematicOn}
         onClick={()=>setCinematicOn(value=>!value)}>
         <Zap size={14}/> {cinematicOn?'Disable garage effects':'Enable garage effects'}
       </button>
      </div>}
      <div className="ride-studio-panel-bottom">
       <p><ShieldCheck size={16}/> Editorial/local preview. Model photographs are not proof of vehicle ownership. Check image licences and plates before publication.</p>
       <button type="button" className="ride-studio-quote" onClick={()=>onQuote(active.name)}>
         Request {active.name} quotation <ArrowRight size={19}/>
       </button>
      </div>
    </aside>
   </div>
   <div className="ride-studio-model-rail" role="group" aria-label="Choose a vehicle model">
    {vehicles.map((car,index)=><button type="button" key={car.name} className={index===vehicleIndex?'active':''}
      aria-pressed={index===vehicleIndex} onClick={()=>setCar(index)}>
      <small>{String(index+1).padStart(2,'0')}</small><strong>{car.name}</strong><span>{car.category}</span>
    </button>)}
   </div>
  </div>
 </div>,document.body);
}
