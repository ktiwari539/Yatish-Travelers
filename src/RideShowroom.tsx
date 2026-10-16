import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CarFront, ChevronLeft, ChevronRight, Maximize2, MousePointer2, ShieldCheck, Sparkles, X, Zap, Gauge, ScanLine, Play, Pause } from 'lucide-react';
import { needsFleetPlateReview } from './mediaSafety';
import { buildFleetGallery, fleetThumbnailSource, studioOpeningIndex } from './fleetGallery';
import type { FleetReelVehicle } from './PremiumFleetExperience';
import { verifiedTurntableFor } from './verifiedTurntables';
import { PhotoTurntable } from './PhotoTurntable';

type ShowroomVehicle=FleetReelVehicle & {capacity?:number;modelUrl?:string};
type Props={
 vehicles:ShowroomVehicle[];
 initialName:string;
 onClose:()=>void;
 onQuote:(name:string)=>void;
};
const knownSafePreview=(src:string)=>/^\/media\/mt-(?:thar-(?:red-front|red-rear|grey-road|grey-front-safe)|xuv700-(?:driving|studio)|traveller-safe)\.webp$/.test(src);
function RideStudioPhoto({car,src,angle,onFailure}:{car:ShowroomVehicle;src:string;angle:number;onFailure:(src:string)=>void}){
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>setStatus('loading'),[src]);
 const platePending=needsFleetPlateReview(car.name,src);
 if(!src||platePending||status==='failed'){
  return <div className="ride-studio-photo-pending" role="img" aria-label={car.name+' photograph awaiting review'}>
   <CarFront size={75} strokeWidth={1.1}/>
   <strong>{car.name}</strong>
   <span>{platePending?'Registration-plate review pending':'A model-specific photo is not currently available'}</span>
  </div>;
 }
 return <>
  {status==='loading'&&<div className="ride-studio-photo-loading" role="status">
   <CarFront size={32} strokeWidth={1.2}/>
   <span>Loading {car.name} photograph…</span>
  </div>}
  <img key={src} className="ride-studio-car-image" src={src}
   style={{opacity:status==='ready'?1:0}}
   alt={car.name+' reference photograph — angle '+(angle+1)}
   onLoad={()=>setStatus('ready')}
   onError={()=>{setStatus('failed');onFailure(src);}} draggable={false}/>
 </>;
}
/** Keep the failed state visible. A hidden image must not remain a clickable angle. */
function RideStudioThumb({src,onFailure}:{src:string;onFailure:()=>void}){
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>setStatus('loading'),[src]);
 return status==='failed'?<span className="ride-studio-thumb-pending">Photo pending</span>:
  <>
   <img src={fleetThumbnailSource(src)} alt="" loading="eager" decoding="async"
    className={status==='ready'?'fleet-thumb-ready':'fleet-thumb-loading'}
    onLoad={()=>setStatus('ready')}
    onError={()=>{setStatus('failed');onFailure();}}/>
   {status==='loading'&&<span className="ride-studio-thumb-loading">Loading photo</span>}
  </>;
}
export function RideShowroom({vehicles,initialName,onClose,onQuote}:Props){
 const [vehicleIndex,setVehicleIndex]=useState(()=>Math.max(0,vehicles.findIndex(v=>v.name===initialName)));
 const [angle,setAngle]=useState(-1);
 const [zoomed,setZoomed]=useState(false);
 const [zoomPoint,setZoomPoint]=useState({x:50,y:50});
 const [failedSources,setFailedSources]=useState<string[]>([]);
 const [details,setDetails]=useState(false);
 const [revealId,setRevealId]=useState(0);
 const [switching,setSwitching]=useState(false);
 const switchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [cinematicOn,setCinematicOn]=useState(true);
 const [autoTourEnabled,setAutoTourEnabled]=useState(false); // Optional photo slideshow, never 360 rotation
 const [turntableMode,setTurntableMode]=useState(false);
 const [tourRunning,setTourRunning]=useState(false);
 const [lightPreset,setLightPreset]=useState<'ion'|'titanium'|'ember'>('ion');
 const [reducedMotion,setReducedMotion]=useState(false);
 const [pointerDown,setPointerDown]=useState<number|null>(null);
 const [dragging,setDragging]=useState(false);
 const closeRef=useRef<HTMLButtonElement|null>(null);
 const dialogRef=useRef<HTMLDivElement|null>(null);
 const previousFocus=useRef<Element|null>(null);
 const active=vehicles[vehicleIndex]||vehicles[0];
 const verified360=active?verifiedTurntableFor(active.name):null;
 const gallery=useMemo(()=>active?buildFleetGallery(active):[],[active]);
 const photos=gallery.map(p=>p.src);
 const galleryKey=photos.join('\u001f');
 const available=photos.map((_,i)=>i).filter(i=>!failedSources.includes(photos[i]));
 const openingAngle=active?studioOpeningIndex(active,gallery):-1;
 const shownAngle=available.includes(angle)?angle:(available.includes(openingAngle)?openingAngle:(available[0]??-1));
 const image=shownAngle>=0?photos[shownAngle]:'';
 const selectedPhoto=shownAngle>=0?gallery[shownAngle]:undefined;
 const markFailed=(src:string)=>setFailedSources(prev=>prev.includes(src)?prev:[...prev,src]);
 useEffect(()=>{setFailedSources([]);setAngle(-1);setZoomed(false);setTurntableMode(Boolean(verified360));setZoomPoint({x:50,y:50});},[active?.name,galleryKey]);
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
    setAngle(-1);setZoomed(false);setTurntableMode(false);setDetails(false);setPointerDown(null);setDragging(false);
    setRevealId(count=>count+1);
    setSwitching(false);
    switchTimer.current=null;
  },310);
 };
 const nextAngle=(delta:number)=>{
  if(available.length<2)return;
  const current=available.indexOf(shownAngle);
  setAngle(available[(current+delta+available.length)%available.length]);
  setZoomed(false);
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
 // The studio is deliberately different from the fleet selection cards:
 // after brief inactivity, it automatically tours the genuine
 // available photographs. This is NEVER represented as a rotating 3D car.
 // A user moving, touching, typing, scrolling, or focusing pauses the tour.
 // Reduced-motion preferences, hidden tabs and manual pause are respected.
 useEffect(()=>{
  if(!active||!autoTourEnabled||reducedMotion||details||zoomed||turntableMode||switching||available.length<2){
   setTourRunning(false);return;
  }
  const dialog=dialogRef.current;
  let idleTimer:ReturnType<typeof setTimeout>|undefined;
  let tourTimer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{
   if(tourTimer!==undefined)clearInterval(tourTimer);
   tourTimer=undefined;
   setTourRunning(false);
  };
  const advance=()=>{
   setAngle(current=>{
    const position=available.indexOf(current<0?openingAngle:current);
    return available[(Math.max(position,0)+1)%available.length];
   });
  };
  const start=()=>{
   idleTimer=undefined;
   if(document.visibilityState!=='visible')return;
   setTourRunning(true);
   advance(); // A visible change immediately after idle, not 4s + another delay.
   tourTimer=setInterval(advance,3800);
  };
  const reset=()=>{
   stop();
   if(idleTimer!==undefined)clearTimeout(idleTimer);
   idleTimer=undefined;
   if(document.visibilityState==='visible')idleTimer=setTimeout(start,3000);
  };
  let lastPointer:{x:number;y:number}|null=null;
  const activity=(event:Event)=>{
   if(!event.isTrusted)return;
   // WebKit may dispatch pointermove at unchanged coordinates while a
   // cinematic layer animates under a stationary pointer. That is not
   // visitor activity and must not indefinitely postpone the photo tour.
   if(event.type==='pointermove'){
    const pointer=event as PointerEvent;
    if(lastPointer&&Math.abs(pointer.clientX-lastPointer.x)<5&&
      Math.abs(pointer.clientY-lastPointer.y)<5)return;
    lastPointer={x:pointer.clientX,y:pointer.clientY};
   }
   reset();
  };
  const onVisibility=()=>reset();
  const events=['pointermove','pointerdown','touchstart','wheel','keydown','focusin'];
  for(const event of events)dialog?.addEventListener(event,activity,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  reset();
  return ()=>{
   if(idleTimer!==undefined)clearTimeout(idleTimer);
   if(tourTimer!==undefined)clearInterval(tourTimer);
   for(const event of events)dialog?.removeEventListener(event,activity);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[active?.name,galleryKey,failedSources.join('|'),autoTourEnabled,reducedMotion,details,zoomed,turntableMode,switching]);
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   // Arrow keys belong to the focused genuine photographic turntable.
   // Otherwise the global studio navigation steals them and switches cars.
   if((event.target as Element|null)?.closest?.('.ride-turntable-viewport') &&
      (event.key==='ArrowLeft'||event.key==='ArrowRight'))return;
   if(event.key==='Escape'){event.preventDefault();if(zoomed)setZoomed(false);else onClose();return;}
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
 },[vehicleIndex,angle,photos.length,onClose,vehicles.length,zoomed]);
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
    <div className={'ride-studio-stage ride-studio-stage-v18'+(!cinematicOn?' no-cinematic':'')+(switching?' is-switching':'')+(tourRunning?' is-photo-touring':'')} data-vehicle={active.name} data-media-quality={studioAssetQuality} data-tour-state={turntableMode?'verified-360':tourRunning?'playing':autoTourEnabled?'idle':'paused'}>
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
     <div className="ride-studio-scanner" aria-hidden="true"><ScanLine size={14}/> PHOTO INSPECTION <i/> AUTHENTIC MODEL REFERENCE</div>
     <div className="ride-studio-inspection-label" aria-live="off">
      <span>THE INSPECTION STUDIO</span>
      <strong>{selectedPhoto?.label||'Model photograph'}</strong>
      <small>{turntableMode?'Verified same-model 360° photo spin':available.length>1?'Photo '+(available.indexOf(shownAngle)+1)+' of '+available.length+' · not 360° rotation':'Single reference photograph'}</small>
     </div>
     <div className="ride-studio-car-title" aria-hidden="true"><small>THE GARAGE / {String(vehicleIndex+1).padStart(2,'0')}</small><strong>{active.name}</strong></div>
     <div className="ride-studio-illumination" role="group" aria-label="Change studio environment lighting">
       {(['ion','titanium','ember'] as const).map(preset=><button
         key={preset} type="button" aria-label={'Use '+preset+' studio lighting'}
         aria-pressed={lightPreset===preset}
         className={lightPreset===preset?'selected':''}
         onClick={()=>setLightPreset(preset)}><span className={'light-dot '+preset}/>{preset==='ion'?'ION BLUE':preset==='titanium'?'TITANIUM':'AMBER'}</button>)}
     </div>
     <div className="ride-studio-garage-ticks" aria-hidden="true"><b>01</b><i/><i/><i/><i/><i/><b>100</b></div>
     {turntableMode&&verified360?
       <div className="ride-studio-turntable-stage">
         <PhotoTurntable key={active.name} model={active.name} frames={verified360.frames}
          onFailure={()=>{setTurntableMode(false);setAutoTourEnabled(false);}}/>
       </div>:
       <button type="button" className="ride-studio-image-action"
         aria-label={(zoomed?'Return to full view of ':'Inspect photograph of ')+active.name}
         aria-pressed={zoomed}
         onPointerMove={event=>{
          if(!zoomed)return;
          const rect=event.currentTarget.getBoundingClientRect();
          setZoomPoint({x:Math.max(10,Math.min(90,(event.clientX-rect.left)/rect.width*100)),
           y:Math.max(10,Math.min(90,(event.clientY-rect.top)/rect.height*100))});
         }}
         onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button===0){setPointerDown(event.clientX);setDragging(false);}}}
         onPointerUp={event=>onPointerRelease(event.clientX)}
         onPointerCancel={()=>setPointerDown(null)}
         onClick={()=>{if(dragging){setDragging(false);return;}setZoomed(v=>!v);}}>
         <div key={active.name+'-'+shownAngle} className={'ride-studio-vehicle-frame '+(isReferenceApproved?'is-reviewed':'is-editorial')+(zoomed?' is-zoomed':'')}
           style={{'--photo-focus-x':zoomPoint.x+'%','--photo-focus-y':zoomPoint.y+'%'} as React.CSSProperties}>
           <div className="ride-studio-frame-glow" aria-hidden="true"/>
           {image&&!failedSources.includes(image)&&!needsFleetPlateReview(active.name,image)&&<img className="ride-studio-image-atmosphere" src={image} aria-hidden="true" alt=""/>}
           <RideStudioPhoto car={active} src={image} angle={shownAngle} onFailure={markFailed}/>
           <div className="ride-studio-frame-sweep" aria-hidden="true"/>
         </div>
         <span className="ride-studio-zoom-hint"><Maximize2 size={16}/> {zoomed?'RETURN TO FULL PHOTOGRAPH':'CLICK TO INSPECT / ZOOM PHOTOGRAPH'}</span>
       </button>}
     <div className="ride-studio-photo-strip" role="group" aria-label={'Select photo view of '+active.name}>
       {gallery.map((photo,i)=><button type="button" key={photo.src}
          aria-label={'Show '+active.name+' photo '+(i+1)} aria-pressed={shownAngle===i}
          disabled={failedSources.includes(photo.src)}
          title={failedSources.includes(photo.src)?'Photo unavailable — not selectable':photo.label}
          className={shownAngle===i?'active':''} onClick={()=>{setAngle(i);setZoomed(false);setRevealId(n=>n+1);}}>
         <RideStudioThumb src={photo.src} onFailure={()=>markFailed(photo.src)}/>
         <span>{String(i+1).padStart(2,'0')}</span>
       </button>)}
       {available.length<=1&&<span className="ride-studio-photo-count">More working angles pending review</span>}
     </div>
     <div className="ride-studio-stage-footer">
      <div><strong><Gauge size={15}/> {turntableMode?'VERIFIED 360° TURNTABLE':available.length>1?'STILL PHOTO INSPECTION':'MODEL REFERENCE'}</strong>
        <span>{turntableMode?'Drag the verified frame sequence to rotate the same model.':tourRunning?'Photo slideshow playing · not 360°':available.length>1?'Browse still photos, or enable the slideshow. Not a rotating car.':'360° unavailable without matched rotation frames.'}</span></div>
      <div className="ride-studio-tour-controls">
       <button type="button" className="ride-studio-tour-toggle"
        disabled={available.length<2||reducedMotion}
        aria-label={autoTourEnabled?'Pause automatic photo slideshow':'Enable automatic photo slideshow'}
        aria-pressed={autoTourEnabled}
        onClick={()=>setAutoTourEnabled(current=>!current)}>
        {autoTourEnabled?<Pause size={15}/>:<Play size={15}/>}
        {autoTourEnabled?(tourRunning?'Slideshow · playing':'Slideshow · waiting'):'Photo slideshow · off'}
       </button>
      </div>
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
      <div className="ride-studio-turntable-status">
       {verified360?<button type="button" onClick={()=>setTurntableMode(v=>!v)}
         aria-pressed={turntableMode} aria-label={turntableMode?'Switch to still photographs':'Open verified 360-degree rotation'}>
         {turntableMode?'Inspect still photos':'View verified 360° rotation'}
       </button>:<span>360° unavailable · verified rotation frames for this exact model are not installed.</span>}
      </div>
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
       <p>The fleet cards show one signature photograph. Here you can inspect full-size model photographs, zoom and optionally play a still-photo slideshow. Genuine 360° needs verified rotation frames.</p>
       <div><MousePointer2 size={16}/> Use the thumbnail rail, photo zoom or arrow keys to explore.</div>
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
