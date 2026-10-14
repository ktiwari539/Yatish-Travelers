import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CarFront, ChevronLeft, ChevronRight, Maximize2, MousePointer2, ShieldCheck, Sparkles, X, Zap, Gauge, ScanLine } from 'lucide-react';
import { needsInnovaPlateReview } from './mediaSafety';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type ShowroomVehicle=FleetReelVehicle & {capacity?:number;modelUrl?:string};
type Props={
 vehicles:ShowroomVehicle[];
 initialName:string;
 onClose:()=>void;
 onQuote:(name:string)=>void;
};
function uniquePhotos(car:ShowroomVehicle){
 const listed=[car.image,...(car.gallery||[])].filter((url,index,all)=>Boolean(url)&&all.indexOf(url)===index);
 // Choose the most showroom-ready angle when the APPROVED local media is
 // already part of the catalog. This is display-only: no CRM write or price
 // change and never substitutes photographs from a different model.
 const preferred:Record<string,string>={
  'Mahindra XUV700':'/media/mt-xuv700-studio.webp',
  'Mahindra Thar':'/media/mt-thar-red-front.webp'
 };
 const hero=preferred[car.name];
 if(!hero||!listed.includes(hero))return listed;
 return [hero,...listed.filter(url=>url!==hero)];
}
const knownSafePreview=(src:string)=>/^\/media\/mt-(?:thar-(?:red-front|red-rear|grey-road|grey-front-safe)|xuv700-(?:driving|studio)|traveller-safe)\.webp$/.test(src);
function RideStudioPhoto({car,src,angle}:{car:ShowroomVehicle;src:string;angle:number}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 const platePending=needsInnovaPlateReview(car.name,src);
 if(!src||platePending||failed){
  return <div className="ride-studio-photo-pending" role="img" aria-label={car.name+' photograph awaiting review'}>
   <CarFront size={75} strokeWidth={1.1}/>
   <strong>{car.name}</strong>
   <span>{platePending?'Registration-plate review pending':'A model-specific photo is not currently available'}</span>
  </div>;
 }
 return <img key={src} className="ride-studio-car-image" src={src}
  alt={car.name+' reference photograph — angle '+(angle+1)}
  onError={()=>setFailed(true)} draggable={false}/>;
}
export function RideShowroom({vehicles,initialName,onClose,onQuote}:Props){
 const [vehicleIndex,setVehicleIndex]=useState(()=>Math.max(0,vehicles.findIndex(v=>v.name===initialName)));
 const [angle,setAngle]=useState(0);
 const [details,setDetails]=useState(false);
 const [revealId,setRevealId]=useState(0);
 const [cinematicOn,setCinematicOn]=useState(true);
 const [lightPreset,setLightPreset]=useState<'ion'|'titanium'|'ember'>('ion');
 const [reducedMotion,setReducedMotion]=useState(false);
 const [pointerDown,setPointerDown]=useState<number|null>(null);
 const [dragging,setDragging]=useState(false);
 const closeRef=useRef<HTMLButtonElement|null>(null);
 const dialogRef=useRef<HTMLDivElement|null>(null);
 const previousFocus=useRef<Element|null>(null);
 const active=vehicles[vehicleIndex]||vehicles[0];
 const photos=useMemo(()=>active?uniquePhotos(active):[],[active]);
 const shownAngle=Math.min(angle,Math.max(photos.length-1,0));
 const image=photos[shownAngle]||'';
 const isReferenceApproved=knownSafePreview(image);
 const studioAssetQuality=isReferenceApproved?'reviewed-local':'editorial-reference';
 const setCar=(index:number)=>{
  setVehicleIndex((index+vehicles.length)%vehicles.length);
  setAngle(0);setDetails(false);setPointerDown(null);setDragging(false);setRevealId(count=>count+1);
 };
 const nextAngle=(delta:number)=>{
  if(photos.length<2)return;
  setAngle(current=>(current+delta+photos.length)%photos.length);
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
  <div><span>Reference photo angles</span><strong>{photos.length}</strong></div>
  <div><span>Colour / variant</span><strong>Confirm before booking</strong></div>
  <div><span>Assigned vehicle</span><strong>Confirmed on enquiry</strong></div>
 </div>;
 return createPortal(<div className={'ride-studio-backdrop garage-luxe-v19 garage-light-'+lightPreset}>
  <div ref={dialogRef} className="ride-studio-dialog" role="dialog" aria-modal="true"
    aria-label="Mateshwari full-screen vehicle studio">
   <div className="ride-studio-topbar">
    <div className="ride-studio-wordmark"><Sparkles size={17}/><strong>MATESHWARI <span>MOTOR STUDIO</span></strong><small>INTERACTIVE FLEET PREVIEW</small></div>
    <span className="ride-studio-step">SELECT VEHICLE <i/> LIGHT THE STAGE <i/> INSPECT DETAILS</span>
    <button ref={closeRef} className="ride-studio-close" type="button" onClick={onClose} aria-label="Close car studio">
     <X size={20}/> <span>Exit studio</span>
    </button>
   </div>
   <div className="ride-studio-body">
    <div className={'ride-studio-stage ride-studio-stage-v18'+(!cinematicOn?' no-cinematic':'')} data-vehicle={active.name} data-media-quality={studioAssetQuality}>
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
     <div className="ride-studio-scanner" aria-hidden="true"><ScanLine size={14}/> STUDIO LIGHTING <i/> SYSTEM READY</div>
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
       onPointerDown={event=>{if(event.pointerType!=='mouse' || event.button===0){setPointerDown(event.clientX);setDragging(false);}}}
       onPointerUp={event=>onPointerRelease(event.clientX)}
       onPointerCancel={()=>setPointerDown(null)}
       onClick={()=>{if(dragging){setDragging(false);return;}setDetails(true);}}>
       <div key={active.name+'-'+shownAngle} className={'ride-studio-vehicle-frame '+(isReferenceApproved?'is-reviewed':'is-editorial')}>
         <div className="ride-studio-frame-glow" aria-hidden="true"/>
         {image&&!needsInnovaPlateReview(active.name,image)&&<img className="ride-studio-image-atmosphere" src={image} aria-hidden="true" alt=""/>}
         <RideStudioPhoto car={active} src={image} angle={shownAngle}/>
         <div className="ride-studio-frame-sweep" aria-hidden="true"/>
       </div>
       <span className="ride-studio-zoom-hint"><Maximize2 size={16}/> EXPLORE VEHICLE DETAILS</span>
     </button>
     <div className="ride-studio-stage-footer">
      <div><strong><Gauge size={15}/> {photos.length>1?'CAMERA BAY / PHOTO ANGLES':'MODEL VIEW'}</strong><span>{photos.length>1?'Swipe or use the arrows to switch available photo angles':'360° turning requires approved 3D models or rotation photographs'}</span></div>
      <div className="ride-studio-angle-nav" role="group" aria-label="Photo-angle controls">
       <button type="button" aria-label="Previous photo angle" disabled={photos.length<2} onClick={()=>nextAngle(-1)}><ChevronLeft size={23}/></button>
       <span>{String(shownAngle+1).padStart(2,'0')} / {String(Math.max(photos.length,1)).padStart(2,'0')}</span>
       <button type="button" aria-label="Next photo angle" disabled={photos.length<2} onClick={()=>nextAngle(1)}><ChevronRight size={23}/></button>
      </div>
     </div>
     {!reducedMotion&&<span className="ride-studio-ambient-label" aria-hidden="true">PREMIUM ROAD EXPERIENCES</span>}
    </div>
    <aside className="ride-studio-panel">
      <div className="ride-studio-panel-heading">
       <span className="ride-studio-eyebrow">SELECTED MODEL / {String(vehicleIndex+1).padStart(2,'0')}</span>
       <h2>{active.name}</h2>
       <p>{active.tag} · {active.category}</p>
       <div className="ride-studio-energy" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
      </div>
      <div className="ride-studio-panel-meta"><span>{active.seats} seating</span><span>₹{active.rateMin??15}–₹{active.rateMax??25} / km indicative</span></div>
      <p className="ride-studio-media-truth">{isReferenceApproved?'Reviewed model photo. Lighting preset changes only the studio, not the vehicle colour.':'Editorial reference photo. A higher-quality, rights-cleared image is required for a release-ready showcase.'}</p>
      <div className="ride-studio-switch">
       <button type="button" aria-label="Previous vehicle" onClick={()=>setCar(vehicleIndex-1)}><ArrowLeft size={18}/> Previous</button>
       <button type="button" aria-label="Next vehicle" onClick={()=>setCar(vehicleIndex+1)}>Next <ArrowRight size={18}/></button>
      </div>
      <button type="button" className="ride-studio-detail-button" aria-expanded={details}
        onClick={()=>setDetails(current=>!current)}>
       {details?'Hide vehicle details':'Explore this vehicle'} <ArrowRight size={18}/>
      </button>
      {details?productDetails:<div className="ride-studio-preview-copy">
       <strong>STEP INTO THE DRIVER'S VIEW</strong>
       <p>Explore the available real model-reference angles, then open the vehicle details. Actual trims, colours and fleet availability are confirmed by our team.</p>
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
