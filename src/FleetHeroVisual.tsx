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
  {
    visual:luxuryMedia.mountains,
    label:'BEYOND THE CITY',
    index:'01',
    subtitle:'A different perspective on the open road',
  },
  {
    visual:luxuryMedia.hero,
    label:'THE GOLDEN HOUR',
    index:'02',
    subtitle:'Even the journey deserves a moment',
  },
  {
    visual:luxuryMedia.landscape,
    label:'TAKE THE LONG WAY',
    index:'03',
    subtitle:'Every destination has a story',
  },
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
  const active=vehicles[activeIndex]??vehicles[0];

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
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
  const chooseVehicle=(index:number)=>{
    if(index>=0&&index<vehicles.length)onChange(index);
  };
  if(!active)return null;

  return <div className={'cinema-director '+((paused||!visible||reduceMotion)?'is-paused':'')+(reduceMotion?' reduce-motion':'')}
    ref={host} aria-label="Cinematic journey scenes and selectable travel vehicles"
    style={{'--cinema-duration':SCENE_INTERVAL_MS+'ms'} as React.CSSProperties}
    onPointerMove={event=>{
      if(reduceMotion||event.pointerType==='touch')return;
      const bounds=event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--cinema-x',(((event.clientX-bounds.left)/bounds.width-.5)*-23).toFixed(1)+'px');
      event.currentTarget.style.setProperty('--cinema-y',(((event.clientY-bounds.top)/bounds.height-.5)*-16).toFixed(1)+'px');
    }}
    onPointerLeave={event=>{
      event.currentTarget.style.setProperty('--cinema-x','0px');
      event.currentTarget.style.setProperty('--cinema-y','0px');
    }}>

    <div className="cinema-director-scenes" aria-hidden="true">
      {scenes.map((item,i)=><div key={item.index}
        className={'cinema-director-scene '+(i===scene?'is-active':'')}
        aria-hidden="true">
        <div className="cinema-director-backdrop">
          <ScenicImage src={item.visual.src} fallback={item.visual.fallback??luxuryMedia.forest.src} alt=""
            loading="eager" decoding="async" fetchPriority={i===0?'high':'low'}
            onLoad={()=>setSceneReady(previous=>previous[i]?previous:previous.map((ready,index)=>index===i?true:ready))}/>
        </div>
        <div className="cinema-director-foreground">
          <ScenicImage src={item.visual.src} fallback={item.visual.fallback??luxuryMedia.forest.src} alt="" loading="lazy"/>
        </div>
      </div>)}
    </div>
    <div className="cinema-director-atmosphere" aria-hidden="true"><span/><span/><span/></div>
    <div className="cinema-director-haze" aria-hidden="true"/>
    <div className="cinema-director-scrim" aria-hidden="true"/>

    <div className="cinema-director-top">
      <span className="cinema-director-eyebrow"><i/> SIGNATURE JOURNEYS / MATESHWARI</span>
      <span className="cinema-director-chapter">{scenes[scene].label} <strong>{scenes[scene].index} / 0{scenes.length}</strong></span>
    </div>

    <div className="cinema-director-caption" aria-live="off">
      <span className="cinema-director-vertical">THE OPEN ROAD IS CALLING</span>
      <span className="cinema-director-subtitle" key={scenes[scene].index}>{scenes[scene].subtitle}</span>
    </div>

    <div className="cinema-director-bottom">
      <div className="cinema-director-vehicle">
        <span>PLAN YOUR DRIVE</span>
        <strong>{active.name}</strong>
        <small>{active.seats} seats <i/> {active.category} <i/> ₹{active.rateMin??15}–₹{active.rateMax??25}/km indicative</small>
      </div>
      <button type="button" className="cinema-director-quote" onClick={()=>onQuote(active.name)}>
        Request this vehicle <ArrowUpRight size={17}/>
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
      <div className="cinema-director-vehicle-tabs" role="group" aria-label="Select your vehicle">
        {vehicles.map((vehicle,i)=><button type="button" key={vehicle.name}
          className={i===activeIndex?'active':''} aria-pressed={i===activeIndex}
          onClick={()=>chooseVehicle(i)}>{vehicle.name}</button>)}
      </div>
    </div>

    <div className="cinema-director-playback" aria-hidden="true" key={scene}>
      <span className="cinema-director-progress"/>
    </div>
    <p className="cinema-director-legal">ILLUSTRATIVE TRAVEL SCENERY · YOUR BOOKING VEHICLE IS SELECTED SEPARATELY</p>
  </div>;
}
