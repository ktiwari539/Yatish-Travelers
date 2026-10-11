import { ArrowUpRight, Compass, Mountain, Route, Trees } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';

const trips=[
 {index:'01',type:'MOUNTAIN ROADS',title:'Beyond the familiar.',place:'Himalayan road-trip inspiration',subtitle:'Winding roads, open skies and new perspectives.',visual:luxuryMedia.mountains},
 {index:'02',type:'THE GOLDEN HOUR',title:'Take the scenic route.',place:'Sunset-drive inspiration',subtitle:'The kind of drive you remember long after arriving.',visual:luxuryMedia.hero},
 {index:'03',type:'GREEN ESCAPES',title:'Where the road breathes.',place:'Forest and nature-drive inspiration',subtitle:'A slower rhythm and more to discover along the way.',visual:luxuryMedia.forest}
];
export function TravelEditorial({stories=false}:{stories?:boolean}){
 return <section className="route-editorial cinematic-route-editorial" id="journeys">
   <div className="route-editorial-top">
     <div><span className="route-eyebrow"><Compass size={15}/> BEYOND THE DESTINATION</span><h2>The road is part of <em>the story.</em></h2></div>
     <p>Beautiful routes and memorable destinations are the inspiration. Explore what's possible, then plan a journey around your needs.</p>
   </div>
   <div className="route-editorial-grid">
     {trips.map((trip,index)=><article className={'route-tile route-tile-'+index} key={trip.title}>
       <div className="route-tile-visual">
         <ScenicImage src={trip.visual.src} fallback={trip.visual.fallback ?? luxuryMedia.landscape.src} alt={trip.visual.alt} loading="lazy"/>
         <div className="route-tile-scrim"/>
         <span className="route-tile-num">{trip.index} / 03</span>
         <span className="route-tile-icon">{index===0?<Mountain size={20}/>:index===1?<Route size={20}/>:<Trees size={20}/>}</span>
         <div className="route-tile-content"><span>{trip.type}</span><h3>{trip.title}</h3><p>{trip.place}</p></div>
       </div>
       <div className="route-tile-foot"><span>{trip.subtitle}</span><a href={stories?'/#fare':'#fare'} aria-label={'Plan a journey inspired by '+trip.place}><ArrowUpRight size={18}/></a></div>
       <a className="route-credit" href={trip.visual.source} target="_blank" rel="noreferrer">Illustrative photo: {trip.visual.credit} · Unsplash License</a>
     </article>)}
   </div>
   <div className="route-editorial-bottom"><p><strong>Editorial travel inspiration</strong> — not customer testimonials, completed bookings or guaranteed routes. Destinations, vehicles and scheduling require confirmation before travel.</p><a href={stories?'/#fare':'#fare'}>Plan your journey <ArrowUpRight size={16}/></a></div>
 </section>;
}
