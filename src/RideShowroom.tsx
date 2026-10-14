import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CarFront, ChevronLeft, ChevronRight, Maximize2, MousePointer2, ShieldCheck, Sparkles, X, Zap, Gauge, ScanLine } from 'lucide-react';
import { needsInnovaPlateReview } from './mediaSafety';
import { Real3DVehicle, type PaintTone } from './Real3DVehicle';
import { conceptModelFor } from './garageConceptAssets';
import { studioEditorialFor } from './studioPhotography';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type ShowroomVehicle=FleetReelVehicle & {capacity?:number;modelUrl?:string};
type Props={
 vehicles:ShowroomVehicle[];
 initialName:string;
 onClose:()=>void;
 onQuote:(name:string)=>void;
};
function uniquePhotos(car:ShowroomVehicle){
 const editorial=studioEditorialFor(car.name);
 const listed=[...(editorial?[editorial.src]:[]),car.image,...(car.gallery||[])]
   .filter((url,index,all)=>Boolean(url)&&all.indexOf(url)===index);
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
 const [switching,setSwitching]=useState(false);
 const switchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [cinematicOn,setCinematicOn]=useState(true);
 const [lightPreset,setLightPreset]=useState<'ion'|'titanium'|'ember'>('ion');
 // An actual approved per-vehicle model may open in 3D. Generic CC0 models
 // never replace the named car's real photographs without an explicit click.
 const [show3D,setShow3D]=useState(()=>Boolean(vehicles.find(v=>v.name===initialName)?.modelUrl));
 // Named-vehicle photography remains the first impression unless an approved
 // model-specific 3D asset exists. CC0 generic concepts are opt-in only.
 const [rotationPlaying,setRotationPlaying]=useState(true);
 const [doorsOpen,setDoorsOpen]=useState(false);
 const [viewPreset,setViewPreset]=useState<'hero'|'front'|'side'|'rear'>('hero');
 const [zoom,setZoom]=useState(1);
 const [conceptPaint,setConceptPaint]=useState<PaintTone>('pearl');
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
 const imageSource=studioEditorialFor(active.name);
 const isEditorialChoice=Boolean(imageSource&&imageSource.src===image);
 const hasActualModel=Boolean(active.modelUrl);
 const availableConcept=Boolean(conceptModelFor(active.name));
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
    setDoorsOpen(false);setZoom(1);setViewPreset('hero');
    // In an explicitly entered 3D mode, keep it where a licensed model is
    // available. Otherwise use this model's actual photo reference.
    setShow3D(current=>current&&Boolean(vehicles[destination]?.modelUrl||conceptModelFor(vehicles[destination]?.name||'')));
    setSwitching(false);
    switchTimer.current=null;
  },310);
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
     <div className="ride-studio-scanner" aria-hidden="true"><ScanLine size={14}/> STUDIO LIGHTING <i/> SYSTEM READY</div>
     <div className="ride-studio-car-title" aria-hidden="true"><small>THE GARAGE / {String(vehicleIndex+1).padStart(2,'0')}</small><strong>{active.name}</strong></div>
     <div className="ride-studio-mode-switch" role="group" aria-label="Choose studio viewing mode">
       <button type="button" className={show3D?'selected':''} aria-pressed={show3D} onClick={()=>setShow3D(true)}>ROTATE 3D CONCEPT</button>
       <button type="button" className={!show3D?'selected':''} aria-pressed={!show3D} onClick={()=>setShow3D(false)}>ACTUAL MODEL PHOTOS</button>
     </div>
     <div className="ride-studio-illumination" role="group" aria-label="Change studio environment lighting">
       {(['ion','titanium','ember'] as const).map(preset=><button
         key={preset} type="button" aria-label={'Use '+preset+' studio lighting'}
         aria-pressed={lightPreset===preset}
         className={lightPreset===preset?'selected':''}
         onClick={()=>setLightPreset(preset)}><span className={'light-dot '+preset}/>{preset==='ion'?'ION BLUE':preset==='titanium'?'TITANIUM':'AMBER'}</button>)}
     </div>
     <div className="ride-studio-garage-ticks" aria-hidden="true"><b>01</b><i/><i/><i/><i/><i/><b>100</b></div>
     {show3D?
       <div className="ride-studio-interactive-3d" role="group" aria-label={'Rotate the '+active.category+' concept car'}>
         <Real3DVehicle key={active.name} category={active.category} modelUrl={active.modelUrl}
           conceptUrl={conceptModelFor(active.name)} continuousPreview
           paint={conceptPaint} mood={lightPreset==='ember'?'golden-hour':'daylight'} progress={.50}
           zoom={zoom} autoRotate={rotationPlaying&&cinematicOn} doorsOpen={doorsOpen}
           viewPreset={viewPreset} reducedMotion={reducedMotion}
           onUnavailable={()=>setShow3D(false)}/>
         <div className="ride-studio-3d-disclaimer">
           {active.modelUrl?'APPROVED MODEL IF LOADED · CONCEPT FALLBACK':'GENERIC 3D CONCEPT · NOT AN EXACT '+active.name.toUpperCase()+' REPLICA'}
         </div>
       </div>:
       <button type="button" className="ride-studio-image-action"
         aria-label={'Explore specifications of '+active.name}
         onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button===0){setPointerDown(event.clientX);setDragging(false);}}}
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
     }
     <div className="ride-studio-stage-footer">
      <div><strong><Gauge size={15}/> {show3D?'INTERACTIVE ORBIT / CONCEPT PREVIEW':photos.length>1?'CAMERA BAY / ACTUAL PHOTOS':'MODEL PHOTO'}</strong>
        <span>{show3D?'Drag to rotate, pinch or scroll to zoom. Concept shape, not an exact model.':photos.length>1?'Swipe or use the arrows for verified model-specific photo angles':'A full photographic 360° requires additional approved photos.'}</span></div>
      {!show3D&&<div className="ride-studio-angle-nav" role="group" aria-label="Photo-angle controls">
       <button type="button" aria-label="Previous photo angle" disabled={photos.length<2} onClick={()=>nextAngle(-1)}><ChevronLeft size={23}/></button>
       <span>{String(shownAngle+1).padStart(2,'0')} / {String(Math.max(photos.length,1)).padStart(2,'0')}</span>
       <button type="button" aria-label="Next photo angle" disabled={photos.length<2} onClick={()=>nextAngle(1)}><ChevronRight size={23}/></button>
      </div>}
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
      <p className="ride-studio-media-truth">{show3D?'Rotatable class-based 3D concept. Not an exact manufacturer model or specification.':isReferenceApproved?'Reviewed model photo. Lighting does not change the actual paint.':isEditorialChoice?'Higher-resolution editorial model reference; not a fleet photograph. Registration-plate/privacy approval remains pending.':'Editorial model reference. Better licensed, plate-safe imagery remains required.'}</p>
      {!show3D&&isEditorialChoice&&imageSource&&<p className="ride-studio-photo-credit">
        <a href={imageSource.page} target="_blank" rel="noreferrer">{imageSource.credit}</a> · {imageSource.license} · {imageSource.model} · Public release requires plate review.
      </p>}
      {show3D&&<div className="ride-studio-drive-controls" aria-label="Interactive vehicle controls">
        <div className="ride-studio-drive-buttons">
          <button type="button" aria-pressed={rotationPlaying} aria-label={rotationPlaying?'Pause 3D rotation':'Resume 3D rotation'} onClick={()=>setRotationPlaying(value=>!value)}>{rotationPlaying?'Ⅱ PAUSE TURN':'▶ RESUME TURN'}</button>
          <button type="button" aria-pressed={doorsOpen} aria-label={doorsOpen?'Close concept doors':'Open concept doors'} onClick={()=>setDoorsOpen(value=>!value)}>{doorsOpen?'CLOSE DOORS':'OPEN DOORS'}</button>
        </div>
        <div className="ride-studio-camera-presets" role="group" aria-label="3D camera presets">
          {(['hero','front','side','rear'] as const).map(view=><button type="button" key={view}
            aria-label={'Show '+view+' 3D camera angle'} aria-pressed={viewPreset===view}
            className={viewPreset===view?'active':''} onClick={()=>{setRotationPlaying(false);setViewPreset(view);}}>{view.toUpperCase()}</button>)}
        </div>
        <div className="ride-studio-zoom-controls" role="group" aria-label="3D camera zoom">
          <button type="button" aria-label="Zoom 3D out" onClick={()=>{setRotationPlaying(false);setZoom(value=>Math.max(.8,Math.round((value-.2)*10)/10));}}>−</button>
          <span>{Math.round(zoom*100)}% ZOOM</span>
          <button type="button" aria-label="Zoom 3D in" onClick={()=>{setRotationPlaying(false);setZoom(value=>Math.min(2,Math.round((value+.2)*10)/10));}}>+</button>
        </div>
        <div className="ride-studio-paint-presets" role="group" aria-label="Concept car paint samples, not stock variants">
          {(['pearl','obsidian','champagne','forest'] as const).map(color=><button key={color}
            type="button" aria-label={'Preview concept in '+color+' paint'}
            aria-pressed={conceptPaint===color} className={'paint-swatch '+color+(conceptPaint===color?' selected':'')}
            onClick={()=>setConceptPaint(color)} title={'Concept only: '+color}/>)}
          <small>Concept palette · not real available colours</small>
        </div>
      </div>}
      <div className="ride-studio-switch">
       <button type="button" aria-label="Previous vehicle" onClick={()=>setCar(vehicleIndex-1)}><ArrowLeft size={18}/> Previous</button>
       <button type="button" aria-label="Next vehicle" onClick={()=>setCar(vehicleIndex+1)}>Next <ArrowRight size={18}/></button>
      </div>
      <button type="button" className="ride-studio-detail-button" aria-expanded={details}
        onClick={()=>setDetails(current=>!current)}>
       {details?'Hide vehicle details':'Explore this vehicle'} <ArrowRight size={18}/>
      </button>
      {details?productDetails:<div className="ride-studio-preview-copy">
       <strong>{show3D?'A GARAGE YOU CAN ACTUALLY ROTATE':'THE ACTUAL VEHICLE REFERENCE'}</strong>
       <p>{show3D?'Rotate a genuine 3D concept in the garage, zoom and open its illustrative doors. Switch to actual photos to verify how the selected vehicle really looks.':'Browse this named vehicle’s actual available photo angles, then inspect the booking specifications. Missing rights-cleared images remain blocked.'}</p>
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
