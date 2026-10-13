import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CarFront, ChevronLeft, ChevronRight, Compass, MoveUpRight } from 'lucide-react';

export type FleetReelVehicle={
  name:string;seats:string;tag:string;category:string;image:string;
  gallery?:string[];rateMin?:number;rateMax?:number;
};
type Props={vehicles:FleetReelVehicle[];activeName:string;onSelect:(name:string)=>void;onQuote:(name:string)=>void};

type ModelImageProps={vehicle:FleetReelVehicle;src:string;alt:string;duplicate?:boolean};
/**
 * A vehicle card may only show THAT vehicle's actual catalog photo.
 * Duplicate links and broken/empty sources produce a named placeholder instead
 * of silently recycling another model's car or an unrelated landscape.
 */
function ModelImage({vehicle,src,alt,duplicate=false}:ModelImageProps){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  if(!src||duplicate||failed){
    return <div className="fleet-model-image-missing" role="img" aria-label={vehicle.name+' — vehicle image pending'}>
      <span className="fleet-model-image-emblem"><CarFront size={32} strokeWidth={1.35}/></span>
      <span className="fleet-model-image-name">{vehicle.name}</span>
      <small>{duplicate?'Distinct photo needed':'Vehicle photo pending'}</small>
    </div>;
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}
export function PremiumFleetExperience({vehicles,activeName,onSelect,onQuote}:Props){
  const [angle,setAngle]=useState(0);
  const [manualAngleChosen,setManualAngleChosen]=useState(false);
  const scorpioVideo=useRef<HTMLVideoElement|null>(null);
  const [videoReady,setVideoReady]=useState(false);
  const [videoFailed,setVideoFailed]=useState(false);
  const [videoEnded,setVideoEnded]=useState(false);
  // The locally installed video is a reviewed, edited AI-generated concept.
  // Only this exact model receives it; all other cars retain their own photo.
  useEffect(()=>{
    setVideoReady(false);
    setVideoFailed(false);
    setVideoEnded(false);
  },[activeName]);
  const road=useRef<HTMLDivElement|null>(null);
  const railRef=useRef<HTMLDivElement|null>(null);
  const [driveStep,setDriveStep]=useState(0);
  const [reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(query.matches);
    update();
    query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const stage=road.current;
    if(!stage)return;
    let frame=0;
    const update=()=>{
      const rect=stage.getBoundingClientRect();
      const distance=Math.max(1,rect.height-window.innerHeight);
      const p=Math.min(1,Math.max(0,-rect.top/distance));
      // Scroll controls photograph movement, not selected fleet model.
      // Manual vehicle selection therefore remains stable and quote-safe.
      const travel=reducedMotion?1:Math.min(1,p/.40);
      stage.style.setProperty('--road-car-offset',(30*(1-travel)).toFixed(1)+'%');
      stage.style.setProperty('--road-car-scale',(1.17-.14*travel).toFixed(3));
      stage.style.setProperty('--road-marking-shift',(-p*480).toFixed(0)+'px');
      stage.style.setProperty('--road-motion-progress',p.toFixed(3));
      const step=reducedMotion?2:p<.34?0:p<.68?1:2;
      setDriveStep(current=>current===step?current:step);
      frame=0;
    };
    const watch=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll',watch,{passive:true});
    window.addEventListener('resize',watch);
    return()=>{
      window.removeEventListener('scroll',watch);
      window.removeEventListener('resize',watch);
      if(frame)cancelAnimationFrame(frame);
    };
  },[reducedMotion]);
  const activeIndex=Math.max(0,vehicles.findIndex(v=>v.name===activeName));
  const active=vehicles[activeIndex];
  useEffect(()=>{
    const video=scorpioVideo.current;
    if(!video || activeName!=='Mahindra Scorpio-N'||reducedMotion||!videoReady)return;
    let inView=false;
    const watch=new IntersectionObserver(([entry])=>{
      if(entry?.isIntersecting && !inView){
        inView=true;
        video.currentTime=0;
        setVideoEnded(false);
        void video.play().catch(()=>{});
      }else if(!entry?.isIntersecting && inView){
        inView=false;
        video.pause();
      }
    },{threshold:.35});
    watch.observe(video);
    return()=>{watch.disconnect();video.pause();};
  },[activeName,reducedMotion,videoReady]);
  // A reused photo URL is never allowed to stand for two different vehicle models.
  const photoOwner=useMemo(()=>{
    const owners=new Map<string,string>();
    for(const vehicle of vehicles){
      // Check alternate angles as well as primary photographs. Sharing an
      // image between two different models must not silently mislabel a car.
      for(const photo of [vehicle.image,...(vehicle.gallery||[])]){
        const url=photo?.trim();
        if(url&&!owners.has(url))owners.set(url,vehicle.name);
      }
    }
    return owners;
  },[vehicles]);
  const hasUniquePhoto=(vehicle:FleetReelVehicle,src=vehicle.image)=>
    Boolean(src)&&(!photoOwner.has(src)||photoOwner.get(src)===vehicle.name);
  const modelPhotos=active
    ?[active.image,...(active.gallery||[])].filter((url,index,list)=>Boolean(url)&&list.indexOf(url)===index)
    :[];
  // Innova's three genuine model-reference photos follow the three story
  // chapters. Once a visitor chooses an angle, that choice takes precedence;
  // navigation and quotations never change the selected vehicle implicitly.
  // Reduced-motion visitors keep a static first photo until they choose one.
  const isInnova=active?.name==='Toyota Innova';
  const visibleAngle=isInnova&&!manualAngleChosen&&!reducedMotion
    ?Math.min(driveStep,Math.max(0,modelPhotos.length-1))
    :Math.min(angle,Math.max(0,modelPhotos.length-1));
  const chosenUrl=modelPhotos[visibleAngle]||active?.image||'';
  useEffect(()=>{setAngle(0);setManualAngleChosen(false);},[activeName]);
  const choose=(index:number)=>{
    if(!vehicles.length)return;
    const next=(index+vehicles.length)%vehicles.length;
    onSelect(vehicles[next].name);
    const rail=railRef.current;
    const tile=rail?.querySelectorAll<HTMLElement>('.fleet-editorial-tile')[next];
    if(rail&&tile){
      const left=tile.offsetLeft-rail.offsetLeft-16;
      rail.scrollTo({left,behavior:'smooth'});
    }
  };
  const browseRail=(direction:-1|1)=>{
    const rail=railRef.current;
    if(!rail)return;
    rail.scrollBy({left:direction*Math.max(240,rail.clientWidth*.65),behavior:'smooth'});
  };
  if(!active)return null;
  const uniqueActive=hasUniquePhoto(active,chosenUrl);
  const showScorpioFilm=active.name==='Mahindra Scorpio-N'&&!reducedMotion&&!videoFailed;
  const replayScorpioFilm=()=>{
    const video=scorpioVideo.current;
    if(!video)return;
    video.currentTime=0;
    setVideoEnded(false);
    void video.play().catch(()=>{});
  };
  const chapters=isInnova?[
    {number:'01',label:'THE EXECUTIVE ARRIVAL',heading:'Arrive with intention.',detail:'The Innova model comes into view. A considered choice for airport and executive travel.'},
    {number:'02',label:'SPACE & COMFORT',heading:'Room for the journey.',detail:active.seats+' seating configuration · '+active.category+' · '+active.tag+'. Exact assigned vehicle is confirmed first.'},
    {number:'03',label:'MAKE IT YOURS',heading:'Every detail, arranged.',detail:'Choose your route, passenger count and date to receive a final Innova quotation.'}
  ]:[
    {number:'01',label:'THE ARRIVAL',heading:'See the '+active.name+'.',detail:'The selected model-reference photograph comes into view as you scroll.'},
    {number:'02',label:'THE DETAILS',heading:'Discover the right fit.',detail:active.seats+' seating · '+active.category+' · '+active.tag+'.'},
    {number:'03',label:'THE JOURNEY',heading:'Plan your next drive.',detail:'Request this model, then confirm the assigned vehicle, availability and final fare.'}
  ];
  const chapter=chapters[driveStep];
  return <section className="fleet-editorial" id="motion-fleet" aria-label="Our premium fleet collection">
    <div className="fleet-editorial-heading">
      <span className="fleet-editorial-kicker"><Compass size={15}/> THE MATESHWARI COLLECTION</span>
      <div><h2>One fleet. <em>{vehicles.length} distinct journeys.</em></h2>
        <p>Explore {vehicles.length} individual vehicle references. Scroll through the scene, then request the model you prefer.</p></div>
    </div>
    <div className="fleet-road-story" ref={road} aria-label="Scroll-driven photographic vehicle experience">
      <div className="fleet-road-sticky">
        <div className="fleet-road-story-top" aria-hidden="true">
          <span>REAL VEHICLE PHOTOGRAPHY</span><span>SCROLL TO REVEAL <span className="fleet-road-story-line"/></span>
        </div>
    <div className="fleet-editorial-stage fleet-road-stage" data-drive-step={driveStep} data-model={active.name}>
      <div className="fleet-editorial-picture" key={active.name+'-'+visibleAngle}>
        <ModelImage vehicle={active} src={chosenUrl}
          alt={active.name+' model-specific vehicle reference photograph'} duplicate={!uniqueActive}/>
        {showScorpioFilm&&<video key="scorpio-clean-v1" ref={scorpioVideo}
          className={'fleet-scorpio-film'+(videoReady?' is-ready':'')}
          src="/media/mt-scorpio-arrival.mp4"
          poster="/media/mt-scorpio-poster.webp"
          muted playsInline preload="metadata"
          disablePictureInPicture
          aria-label="Scorpio-N cinematic video concept: arrival followed by door opening"
          onLoadedMetadata={()=>setVideoReady(true)}
          onError={()=>{setVideoFailed(true);setVideoReady(false);}}
          onEnded={()=>setVideoEnded(true)} />}
        {showScorpioFilm&&videoReady&&<>
          <span className="fleet-scorpio-film-credit">MATESHWARI TRAVELLERS <i/> SCORPIO-N FILM CONCEPT</span>
          <button type="button" className="fleet-scorpio-replay"
            onClick={replayScorpioFilm} aria-label="Replay Scorpio-N arrival film">
            {videoEnded?'Replay arrival':'Replay film'} ↻
          </button>
        </>}
        {isInnova&&<div className="fleet-innova-visual-note" aria-hidden="true">
          <span>TOYOTA INNOVA</span>
          <strong>{driveStep===0?'ARRIVE':driveStep===1?'SETTLE IN':'GO FURTHER'}</strong>
          <i/>
        </div>}
        <div className="fleet-drive-road-markings" aria-hidden="true"><span/><span/><span/></div>
        <div className="fleet-editorial-gradient"/>
        <div className="fleet-editorial-frame-tag"><span/> {showScorpioFilm&&videoReady?'SCORPIO-N CINEMATIC CONCEPT':isInnova?'INNOVA · EXECUTIVE COLLECTION':'MODEL-SPECIFIC REFERENCE'}</div>
        <span className="fleet-editorial-frame-count">{String(activeIndex+1).padStart(2,'0')} — {String(vehicles.length).padStart(2,'0')}</span>
        <div className="fleet-editorial-frame-caption">
          {showScorpioFilm&&videoReady?'Edited cinematic concept video; not genuine footage of a fleet vehicle.':'Model reference photography, not a confirmed fleet vehicle. Vehicle and color verified on enquiry.'}
        </div>
        {modelPhotos.length>1&&uniqueActive&&
          <div className="fleet-editorial-angles" role="group" aria-label="Choose model reference angle">
            {modelPhotos.map((url,index)=><button type="button" key={url} className={visibleAngle===index?'selected':''}
              aria-label={'View photo angle '+(index+1)} aria-pressed={visibleAngle===index}
              onClick={()=>{setAngle(index);setManualAngleChosen(true);}}>{String(index+1).padStart(2,'0')}</button>)}
          </div>}
      </div>
      <div className="fleet-editorial-description">
        <div className="fleet-drive-story-chapter" key={active.name+'-'+driveStep} aria-live="off">
          <span>{chapter.number} / {chapter.label}</span>
          <strong>{chapter.heading}</strong>
          <p>{chapter.detail}</p>
        </div>
        <span className="fleet-editorial-chapter">THE COLLECTION / {String(activeIndex+1).padStart(2,'0')}</span>
        <div className="fleet-editorial-model" key={active.name}>
          <span className="fleet-editorial-class">{active.category.toUpperCase()} <i/> {active.seats} SEATS</span>
          <h3>{active.name}</h3>
          <p>{active.tag}. Image references are illustrative; assigned car, color and final itinerary are confirmed before booking.</p>
          <div className="fleet-editorial-rate"><small>INDICATIVE RATE PER KM</small>
            <strong>₹{active.rateMin??15}–₹{active.rateMax??25}<span> / km</span></strong></div>
          <button type="button" className="fleet-editorial-request" onClick={()=>onQuote(active.name)}>
            Request this vehicle <MoveUpRight size={18}/>
          </button>
        </div>
        <div className="fleet-editorial-navigation">
          <button type="button" onClick={()=>choose(activeIndex-1)} aria-label="Previous model"><ChevronLeft size={20}/></button>
          <span>CHOOSE YOUR VEHICLE</span>
          <button type="button" onClick={()=>choose(activeIndex+1)} aria-label="Next model"><ChevronRight size={20}/></button>
        </div>
      </div>
      <div className="fleet-road-story-progress" aria-hidden="true"><i/></div>
      </div>
    </div>
    </div>
    <div className="fleet-editorial-strip-title">
      <span>EXPLORE THE FLEET — INDIVIDUAL VEHICLE REFERENCES</span>
      <div className="fleet-rail-browse" role="group" aria-label="Browse fleet photographs">
        <span>SCROLL THE COLLECTION</span>
        <button type="button" aria-label="Scroll fleet left" onClick={()=>browseRail(-1)}><ChevronLeft size={18}/></button>
        <button type="button" aria-label="Scroll fleet right" onClick={()=>browseRail(1)}><ChevronRight size={18}/></button>
      </div>
    </div>
    <div className="fleet-editorial-rail" ref={railRef} role="group" aria-label="Select a vehicle by its own photograph">
      {vehicles.map((vehicle,index)=><button type="button" key={vehicle.name}
        className={'fleet-editorial-tile '+(index===activeIndex?'selected':'')}
        aria-pressed={index===activeIndex} onClick={()=>choose(index)}>
        <div className="fleet-editorial-tile-photo" data-vehicle={vehicle.name}>
          <ModelImage vehicle={vehicle} src={vehicle.image}
            alt={vehicle.name+' model reference photo'}
            duplicate={!hasUniquePhoto(vehicle)}/>
          <span>{vehicle.category.toUpperCase()}</span>
        </div>
        <div className="fleet-editorial-tile-foot">
          <span>{String(index+1).padStart(2,'0')}</span>
          <strong>{vehicle.name}</strong><ArrowUpRight size={16}/>
        </div>
      </button>)}
    </div>
    <div className="fleet-editorial-footer">
      <p>Each thumbnail represents its named vehicle model. Unavailable or duplicate photos show a placeholder—not another model or unrelated scenery. Exact color, vehicle and fare are confirmed before booking.</p>
      <a href="#fleet">See full vehicle comparison <ArrowRight size={16}/></a>
    </div>
  </section>;
}
