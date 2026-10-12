import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CarFront, ChevronLeft, ChevronRight, Compass, MoveUpRight } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';

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
  const activeIndex=Math.max(0,vehicles.findIndex(v=>v.name===activeName));
  const active=vehicles[activeIndex];
  // A reused photo URL is never allowed to stand for two different vehicle models.
  const photoOwner=useMemo(()=>{
    const owners=new Map<string,string>();
    for(const vehicle of vehicles){
      const url=vehicle.image?.trim();
      if(url&&!owners.has(url))owners.set(url,vehicle.name);
    }
    return owners;
  },[vehicles]);
  const hasUniquePhoto=(vehicle:FleetReelVehicle,src=vehicle.image)=>
    Boolean(src)&&photoOwner.get(src)===vehicle.name;
  const modelPhotos=active
    ?[active.image,...(active.gallery||[])].filter((url,index,list)=>Boolean(url)&&list.indexOf(url)===index)
    :[];
  const chosenUrl=modelPhotos[angle]||active?.image||'';
  useEffect(()=>setAngle(0),[activeName]);
  const choose=(index:number)=>{
    if(!vehicles.length)return;
    onSelect(vehicles[(index+vehicles.length)%vehicles.length].name);
  };
  if(!active)return null;
  const showApprovedConcept=active.name==='Maruti Ertiga';
  const uniqueActive=hasUniquePhoto(active,chosenUrl);
  return <section className="fleet-editorial" id="motion-fleet" aria-label="Our premium fleet collection">
    <div className="fleet-editorial-heading">
      <span className="fleet-editorial-kicker"><Compass size={15}/> THE MATESHWARI COLLECTION</span>
      <div><h2>One fleet. <em>Six distinct journeys.</em></h2>
        <p>Explore the actual vehicle categories available for your trip. Each model has its own reference image and booking details.</p></div>
    </div>
    <div className="fleet-editorial-stage">
      <div className="fleet-editorial-picture" key={active.name+'-'+angle}>
        {showApprovedConcept
          ?<ScenicImage src={luxuryMedia.hero.src} fallback={uniqueActive?chosenUrl:undefined}
              alt="Ertiga-inspired AI-generated MPV travel concept, not an actual assigned vehicle photo" loading="lazy"/>
          :<ModelImage vehicle={active} src={chosenUrl}
              alt={active.name+' model-specific vehicle reference photo'} duplicate={!uniqueActive}/>}
        <div className="fleet-editorial-gradient"/>
        <div className="fleet-editorial-frame-tag"><span/> {showApprovedConcept?'ILLUSTRATIVE MPV CONCEPT':'MODEL-SPECIFIC REFERENCE'}</div>
        <span className="fleet-editorial-frame-count">{String(activeIndex+1).padStart(2,'0')} — {String(vehicles.length).padStart(2,'0')}</span>
        <div className="fleet-editorial-frame-caption">
          {showApprovedConcept?'Golden-hour concept artwork. The actual Ertiga is confirmed before booking.':'Actual model and vehicle details are confirmed when we prepare your quote.'}
        </div>
        {modelPhotos.length>1&&uniqueActive&&!showApprovedConcept&&
          <div className="fleet-editorial-angles" role="group" aria-label="Choose model reference angle">
            {modelPhotos.map((url,index)=><button type="button" key={url} className={angle===index?'selected':''}
              aria-label={'View photo angle '+(index+1)} aria-pressed={angle===index}
              onClick={()=>setAngle(index)}>{String(index+1).padStart(2,'0')}</button>)}
          </div>}
      </div>
      <div className="fleet-editorial-description">
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
    </div>
    <div className="fleet-editorial-strip-title">
      <span>EXPLORE THE FLEET — INDIVIDUAL VEHICLE REFERENCES</span>
      <span>SELECT A VEHICLE <ArrowRight size={15}/></span>
    </div>
    <div className="fleet-editorial-rail" role="group" aria-label="Select a vehicle by its own photograph">
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
