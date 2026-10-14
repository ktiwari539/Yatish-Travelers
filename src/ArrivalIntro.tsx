import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const KEY='mt-arrival-intro-v1';
const DURATION=1750;

/** Short, one-session photographic arrival. Unlike a fake 3D model this uses
 * a reviewed car photo and never pretends to show another angle of the car.
 * Direct deep links, reduced-motion users and repeat navigation skip it.
 */
export function ArrivalIntro(){
 const [visible,setVisible]=useState(false);
 const [photoFailed,setPhotoFailed]=useState(false);
 useEffect(()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deepLink=Boolean(window.location.hash&&window.location.hash!=='#home');
  let seen=false;
  try{seen=window.sessionStorage.getItem(KEY)==='seen';}
  catch{seen=true;}
  if(reduce||deepLink||seen)return;
  try{window.sessionStorage.setItem(KEY,'seen');}catch{/* non-persistent mode */}
  setVisible(true);
  const timeout=window.setTimeout(()=>setVisible(false),DURATION);
  return ()=>window.clearTimeout(timeout);
 },[]);
 useEffect(()=>{
  if(!visible)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'||event.key==='Enter')setVisible(false);};
  window.addEventListener('keydown',onKey);
  return ()=>window.removeEventListener('keydown',onKey);
 },[visible]);
 if(!visible)return null;
 return <div className="mt-arrival" role="presentation" aria-label="Mateshwari vehicle arrival introduction">
  <div className="mt-arrival-masthead">
   <span>MATESHWARI <b>TRAVELLERS</b></span>
   <small>YOUR JOURNEY BEGINS HERE</small>
  </div>
  <div className="mt-arrival-scene" aria-hidden="true">
   <span className="mt-arrival-road"/>
   {!photoFailed?<img src="/media/mt-xuv700-studio.webp" alt=""
     onError={()=>setPhotoFailed(true)} decoding="async"/>:
     <span className="mt-arrival-type">Every journey begins with a choice.</span>}
  </div>
  <button type="button" className="mt-arrival-skip" onClick={()=>setVisible(false)}>
   Skip intro <ArrowRight size={16}/>
  </button>
 </div>;
}
