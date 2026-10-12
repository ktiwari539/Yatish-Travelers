import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';
import type { FleetReelVehicle } from './PremiumFleetExperience';

type Props={
  vehicles:FleetReelVehicle[];
  activeIndex:number;
  onChange:(index:number)=>void;
  onQuote:(name:string)=>void;
};
const scenes=[
  {visual:luxuryMedia.hero, label:'THE SIGNATURE ARRIVAL', index:'01',
   subtitle:'The journey starts before you leave.', foreground:'/media/mt-hero-car-cutout.webp',
   tag:'GOLDEN-HOUR MPV CONCEPT'},
  {visual:luxuryMedia.mountains, label:'THE OPEN ROAD', index:'02',
   subtitle:'Every bend holds a new perspective.', foreground:'/media/mt-side-car-cutout.webp',
   tag:'MOUNTAIN-ROAD MPV CONCEPT'},
  {visual:luxuryMedia.landscape, label:'JOURNEYS THAT STAY', index:'03',
   subtitle:'Take the long way to somewhere memorable.', foreground:'',
   tag:'SCENIC TRAVEL INSPIRATION'},
] as const;

// 4.8-second scene cadence: faster than the former 9.6s, without a frantic slider.
const SCENE_INTERVAL_MS=4800;

/**
 * This is a motion-led editorial backdrop, not a real-time video or OEM car model.
 * Scenic photographs are never described as photos of the selected fleet vehicle.
 * All scene layers remain mounted so transitions genuinely crossfade rather than flash.
 */
export function FleetHeroVisual({vehicles,activeIndex,onChange,onQuote}:Props){
  const host=useRef<HTMLDivElement|null>(null);
  const raf=useRef(0);
  const [scene,setScene]=useState(0);
  const [paused,setPaused]=useState(false);
  const [reduceMotion,setReduceMotion]=useState(false);
  const [visible,setVisible]=useState(true);
  const [sceneReady,setSceneReady]=useState<boolean[]>(()=>scenes.map(()=>false));
  const [cinematic,setCinematic]=useState(true);
  const [introDone,setIntroDone]=useState(false);
  const [videoReady,setVideoReady]=useState(false);
  const video=useRef<HTMLVideoElement|null>(null);
  const active=vehicles[activeIndex]??vehicles[0];
  const featured=vehicles.find(item=>item.name==='Maruti Ertiga')??active;
  // Each full page mount runs the sequence once. Motion-sensitive clients skip it.
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');
    if(media.matches){setIntroDone(true);return;}
    const timer=window.setTimeout(()=>setIntroDone(true),2550);
    return()=>window.clearTimeout(timer);
  },[]);
  useEffect(()=>{
    const node=video.current;
    if(!node)return;
    if(scene===0&&visible&&!reduceMotion&&cinematic){
      void node.play().catch(()=>{setVideoReady(false);});
    }else{node.pause();}
  },[scene,visible,reduceMotion,cinematic,videoReady]);

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');
    const change=()=>setReduceMotion(media.matches);
    change();
    media.addEventListener('change',change);
    return()=>media.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    const watcher=new IntersectionObserver(([entry])=>setVisible(Boolean(entry?.isIntersecting)),{threshold:.08});
    watcher.observe(element);
    return()=>watcher.disconnect();
  },[]);
  useEffect(()=>{
    if(paused||reduceMotion||!visible)return;
    // Do not show a new slide until its large scenic photo (or fallback) has decoded.
    // Hidden scenes are intentionally mounted and preloaded at low priority below.
    const next=(scene+1)%scenes.length;
    const timer=window.setTimeout(()=>{
      if(sceneReady[next])setScene(next);
    },SCENE_INTERVAL_MS);
    return()=>window.clearTimeout(timer);
  },[scene,paused,reduceMotion,visible,sceneReady]);
  useEffect(()=>{
    const element=host.current;
    if(!element||reduceMotion)return;
    const update=()=>{
      const rect=element.getBoundingClientRect();
      const fraction=Math.max(-1,Math.min(1,(window.innerHeight*.5-(rect.top+rect.height*.5))/Math.max(window.innerHeight,1)));
      element.style.setProperty('--cinema-scroll-y',(fraction*30).toFixed(1)+'px');
      raf.current=0;
    };
    const onScroll=()=>{if(!raf.current)raf.current=requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return()=>{
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',onScroll);
      cancelAnimationFrame(raf.current);
    };
  },[reduceMotion]);

  const move=useCallback((delta:number)=>{
    // Manual scene changes are immediate and intentionally pause autoplay.
    setScene(index=>(index+delta+scenes.length)%scenes.length);
    setPaused(true);
  },[]);
  // The cinematic artwork is a generated Ertiga-inspired MPV concept, not a
  // model-accurate photo. Real vehicle selection belongs in the following gallery.
  const chooseFeatured=()=>onQuote(featured.name);
  const progressKey=[scene,paused?'paused':'playing',visible?'visible':'hidden',sceneReady.filter(Boolean).length].join('-');
  if(!active)return null;

  return <div className={'cinema-director cinematic-v6 '+(!introDone?' cinematic-intro-running':' cinematic-intro-finished')+' '+((paused||!visible||reduceMotion)?'is-paused':'')+(reduceMotion?' reduce-motion':'')+(cinematic?' cinematic-enabled':' cinematic-disabled')}
    ref={host} aria-label="Cinematic journey scenes and selectable travel vehicles"
    style={{'--cinema-duration':SCENE_INTERVAL_MS+'ms'} as React.CSSProperties}
    onPointerMove={event=>{
      if(reduceMotion||event.pointerType==='touch')return;
      const bounds=event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--cinema-x',(((event.clientX-bounds.left)/bounds.width-.5)*-23).toFixed(1)+'px');
      event.currentTarget.style.setProperty('--cinema-y',(((event.clientY-bounds.top)/bounds.height-.5)*-16).toFixed(1)+'px');
      event.currentTarget.style.setProperty('--cinema-car-x',(((event.clientX-bounds.left)/bounds.width-.5)*28).toFixed(1)+'px');
      event.currentTarget.style.setProperty('--cinema-car-y',(((event.clientY-bounds.top)/bounds.height-.5)*22).toFixed(1)+'px');
    }}
    onPointerLeave={event=>{
      event.currentTarget.style.setProperty('--cinema-x','0px');
      event.currentTarget.style.setProperty('--cinema-y','0px');
      event.currentTarget.style.setProperty('--cinema-car-x','0px');
      event.currentTarget.style.setProperty('--cinema-car-y','0px');
    }}>

    {!introDone&&<div className="cinema-arrival" aria-label="Mateshwari Travellers cinematic arrival">
      <div className="cinema-arrival-scene" aria-hidden="true">
        <ScenicImage src={luxuryMedia.hero.src} fallback={luxuryMedia.hero.fallback} alt="" fetchPriority="high" />
      </div>
      <div className="cinema-arrival-wash" aria-hidden="true"/>
      <img src="/media/mt-hero-car-cutout.webp" className="cinema-arrival-vehicle" alt="" aria-hidden="true"
        onError={event=>{event.currentTarget.style.visibility='hidden';}}/>
      <span className="cinema-arrival-wordmark">MATESHWARI <em>TRAVELLERS</em></span>
      <span className="cinema-arrival-subline">THE JOURNEY BEGINS HERE</span>
      <button type="button" className="cinema-arrival-skip" onClick={()=>setIntroDone(true)}>Skip intro <ArrowUpRight size={15}/></button>
    </div>}
  <div className="cinema-director-scenes" aria-hidden="true">
      {scenes.map((item,i)=><div key={item.index}
        className={'cinema-director-scene '+(i===scene?'is-active':'')+(i===0&&videoReady?' has-video':'')}
        aria-hidden="true">
        <div className="cinema-director-backdrop">
          <ScenicImage src={item.visual.src} fallback={item.visual.fallback??luxuryMedia.forest.src} alt=""
            loading="eager" decoding="async" fetchPriority={i===0?'high':'low'}
            onLoad={()=>setSceneReady(previous=>previous[i]?previous:previous.map((ready,index)=>index===i?true:ready))}/>
          {i===0&&!reduceMotion&&<video ref={video}
            className={'cinema-director-video '+(videoReady?'is-ready':'')} muted playsInline loop autoPlay
            preload="metadata" aria-hidden="true" poster="/media/mt-hero-sunset.webp"
            onCanPlay={()=>setVideoReady(true)} onError={()=>setVideoReady(false)}>
            <source src="/media/mt-cinematic-drive.mp4" type="video/mp4"/>
          </video>}
        </div>
        {item.foreground&&<div className="cinema-director-foreground cinema-director-car-depth" aria-hidden="true">
          <img src={item.foreground} alt="" loading="lazy" decoding="async"
            onError={event=>{event.currentTarget.style.display='none';}}/>
        </div>}
      </div>)}
    </div>
    <div className="cinema-director-atmosphere" aria-hidden="true"><span/><span/><span/></div>
    <div className="cinema-director-kinetic" aria-hidden="true"><i/><i/><i/></div>
    <div className="cinema-director-haze" aria-hidden="true"/>
    <div className="cinema-director-scrim" aria-hidden="true"/>

    <div className="cinema-director-top">
      <span className="cinema-director-eyebrow"><i/> SIGNATURE JOURNEYS / MATESHWARI</span>
      <span className="cinema-director-chapter">{scenes[scene].label} <strong>{scenes[scene].index} / 0{scenes.length}</strong></span>
    </div>

    <button type="button" className="cinema-director-cinematic-toggle" onClick={()=>setCinematic(value=>!value)}
      aria-pressed={cinematic} title={cinematic?'Disable cinematic depth effect':'Enable cinematic depth effect'}>
      {cinematic?'DEPTH ON':'DEPTH OFF'} <span aria-hidden="true"/>
    </button>
    <div className="cinema-director-caption" aria-live="off">
      <span className="cinema-director-vertical">{scenes[scene].tag}</span>
      <span className="cinema-director-subtitle" key={scenes[scene].index}>{scenes[scene].subtitle}</span>
    </div>

    <div className="cinema-director-bottom">
      <div className="cinema-director-vehicle">
        <span>PLAN YOUR DRIVE</span>
        <strong>Family MPV · Ertiga-inspired concept</strong>
        <small>{featured.seats} seats <i/> Reference artwork <i/> Actual model and fare confirmed in quotation</small>
      </div>
      <button type="button" className="cinema-director-quote" onClick={chooseFeatured}>
        Enquire about Ertiga <ArrowUpRight size={17}/>
      </button>
    </div>

    <div className="cinema-director-controls">
      <div className="cinema-director-scene-buttons" role="group" aria-label="Choose travel scene">
        <button type="button" aria-label="Previous travel scene" onClick={()=>move(-1)}><ChevronLeft size={17}/></button>
        <span>{scenes[scene].index} <i/> 0{scenes.length}</span>
        <button type="button" aria-label="Next travel scene" onClick={()=>move(1)}><ChevronRight size={17}/></button>
        <button type="button" aria-label={paused?'Resume cinematic transitions':'Pause cinematic transitions'}
          aria-pressed={paused} disabled={reduceMotion} onClick={()=>setPaused(value=>!value)}>
          {paused?<Play size={15}/>:<Pause size={15}/>}
        </button>
      </div>
      <div className="cinema-director-vehicle-tabs cinema-gallery-action">
        <a href="#motion-fleet">Explore all {vehicles.length} vehicles <ArrowUpRight size={15}/></a>
      </div>
    </div>

    <div className="cinema-director-playback" aria-hidden="true" key={progressKey}>
      <span className="cinema-director-progress"/>
    </div>
    <p className="cinema-director-legal">CINEMATIC CONCEPT · NOT ACTUAL FLEET PHOTOGRAPHY · CHOOSE YOUR VEHICLE BELOW</p>
  </div>;
}
