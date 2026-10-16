import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCw} from 'lucide-react';

/**
 * Genuine frame-by-frame photographic spin. Each frame must depict a distinct
 * angle of THE SAME real model. Never derive a spin from arbitrary gallery
 * photos, nor render generic 3D as though it were an owned vehicle.
 */
export function PhotoTurntable({model,frames,onFailure}:{
 model:string;frames:readonly string[];onFailure:()=>void;
}){
 const [frame,setFrame]=useState(0);
 const [ready,setReady]=useState(false);
 const [manualPause,setManualPause]=useState(false);
 const [idle,setIdle]=useState(true);
 const [reducedMotion,setReducedMotion]=useState(false);
 const [visible,setVisible]=useState(true);
 const drag=useRef<{x:number;frame:number}|null>(null);
 const resume=useRef<ReturnType<typeof setTimeout>|null>(null);
 const stopTimeout=()=>{if(resume.current!==null)clearTimeout(resume.current);resume.current=null;};
 const interaction=()=>{
  setIdle(false);stopTimeout();
  resume.current=setTimeout(()=>setIdle(true),3000);
 };
 useEffect(()=>{
  let mounted=true;
  setReady(false);setFrame(0);
  const loaded:HTMLImageElement[]=[];
  const operations=frames.map(src=>new Promise<void>((resolve,reject)=>{
   const img=new Image();
   loaded.push(img);
   img.onload=()=>resolve();
   img.onerror=()=>reject(new Error('Frame cannot load: '+src));
   img.src=src;
  }));
  void Promise.all(operations).then(()=>{if(mounted)setReady(true);})
   .catch(()=>{if(mounted)onFailure();});
  return()=>{mounted=false;for(const img of loaded){img.onload=null;img.onerror=null;}};
 },[frames,onFailure]);
 useEffect(()=>{
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(mq.matches);
  const visibility=()=>setVisible(document.visibilityState==='visible');
  update();visibility();
  mq.addEventListener('change',update);
  document.addEventListener('visibilitychange',visibility);
  return()=>{mq.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!ready||manualPause||!idle||reducedMotion||!visible)return;
  // The selected real car completes one circle in ~12 seconds for 36 frames.
  const delay=Math.max(75,Math.round(12000/frames.length));
  const timer=setInterval(()=>setFrame(i=>(i+1)%frames.length),delay);
  return()=>clearInterval(timer);
 },[ready,manualPause,idle,reducedMotion,visible,frames]);
 useEffect(()=>()=>stopTimeout(),[]);
 const begin=(event:React.PointerEvent)=>{
  if(!ready)return;
  event.currentTarget.setPointerCapture(event.pointerId);
  drag.current={x:event.clientX,frame};
  interaction();
 };
 const move=(event:React.PointerEvent)=>{
  if(!drag.current){if(event.pointerType==='mouse')interaction();return;}
  const steps=Math.round((event.clientX-drag.current.x)/12);
  setFrame((drag.current.frame+steps%frames.length+frames.length)%frames.length);
 };
 const end=(event:React.PointerEvent)=>{
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  drag.current=null;interaction();
 };
 return <div className="ride-genuine-turntable" role="group"
   aria-label={'360-degree photographic rotation of '+model}
   data-turntable-ready={ready?'true':'false'}>
   <div className="ride-turntable-viewport" tabIndex={0}
    onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
    onKeyDown={event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
       event.preventDefault();interaction();
       setFrame(i=>(i+(event.key==='ArrowRight'?1:-1)+frames.length)%frames.length);
      }
    }}>
    {ready?<img src={frames[frame]} draggable={false}
      alt={model+' verified photographic turntable angle '+(frame+1)+' of '+frames.length}/>:
      <span role="status">Loading verified 360° photographs…</span>}
   </div>
   <div className="ride-turntable-toolbar">
    <span><RotateCw size={15}/> VERIFIED PHOTO 360° · {frame+1}/{frames.length} · DRAG OR USE ARROWS</span>
    <button type="button" disabled={!ready||reducedMotion}
      aria-label={manualPause?'Resume 360-degree rotation':'Pause 360-degree rotation'}
      onClick={()=>setManualPause(v=>!v)}>
      {manualPause?<Play size={15}/>:<Pause size={15}/>}
      {manualPause?'Resume rotation':'Pause rotation'}
    </button>
   </div>
 </div>;
}
