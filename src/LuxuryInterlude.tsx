import { ArrowDownRight, ArrowUpRight, Compass } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';

export function LuxuryInterlude({compact=false}:{compact?:boolean}){
 return <section className={compact?'luxury-interlude is-compact':'luxury-interlude'} aria-label="Cinematic mountain travel inspiration"
  onPointerMove={event=>{
    if(event.pointerType==='touch')return;
    const bounds=event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--landscape-x',String(((event.clientX-bounds.left)/bounds.width-.5).toFixed(3)));
    event.currentTarget.style.setProperty('--landscape-y',String(((event.clientY-bounds.top)/bounds.height-.5).toFixed(3)));
  }}
  onPointerLeave={event=>{event.currentTarget.style.setProperty('--landscape-x','0');event.currentTarget.style.setProperty('--landscape-y','0');}}>
  <div className="luxury-interlude-scene"><ScenicImage src={luxuryMedia.mountains.src} fallback={luxuryMedia.mountains.fallback} alt={luxuryMedia.mountains.alt} loading="lazy"/></div>
  <div className="luxury-interlude-overlay"/>
  <div className="luxury-interlude-text">
    <span><Compass size={15}/> THE ART OF THE JOURNEY</span>
    <h2>Some roads are worth <em>taking slowly.</em></h2>
    <p>Every great journey begins with the freedom to explore. Let the destination inspire you, and we'll help plan the drive.</p>
    <div><a href="#route-playground">Explore journeys <ArrowUpRight size={17}/></a>
      <a href="#fare">Plan a trip <ArrowDownRight size={17}/></a></div>
  </div>
  <div className="luxury-interlude-meta"><span>THE OPEN ROAD / VOL. 01</span><a href={luxuryMedia.mountains.source} target="_blank" rel="noreferrer">Illustrative photo: {luxuryMedia.mountains.credit}</a></div>
 </section>;
}
