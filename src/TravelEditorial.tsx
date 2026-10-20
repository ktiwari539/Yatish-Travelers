import { ArrowUpRight, Compass, Mountain, Route, Trees } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { journeyAdventures, journeyUrl } from './journeyAdventures';

export function TravelEditorial({stories=false}:{stories?:boolean}){
 return <section className="route-editorial cinematic-route-editorial" id="journeys">
   <div className="route-editorial-top">
     <div><span className="route-eyebrow"><Compass size={15}/> BEYOND THE DESTINATION</span><h2>The road is part of <em>the story.</em></h2></div>
     <p>Three different road-trip adventures. Choose a card to explore the journey, then request an itinerary suited to your route and group.</p>
   </div>
   <div className="route-editorial-grid">
     {journeyAdventures.map((trip,index)=><article className={'route-tile route-tile-'+index} key={trip.slug}>
       <div className="route-tile-visual">
         <ScenicImage src={trip.hero} fallback={trip.fallback} alt={trip.alt} loading="lazy"/>
         <div className="route-tile-scrim"/>
         <span className="route-tile-num">{trip.index} / 03</span>
         <span className="route-tile-icon">{index===0?<Mountain size={20}/>:index===1?<Route size={20}/>:<Trees size={20}/>}</span>
         <div className="route-tile-content"><span>{trip.type}</span><h3>{trip.title}</h3><p>{trip.place}</p></div>
         <a className="route-tile-image-link" href={journeyUrl(trip.slug)}
           aria-label={'Explore '+trip.place+' adventure'} title={'Explore '+trip.place}/>
       </div>
       <div className="route-tile-foot"><span>{trip.subtitle}</span>
         <a href={journeyUrl(trip.slug)} aria-label={'Open '+trip.place+' adventure'}><ArrowUpRight size={18}/></a>
       </div>
       <span className="route-credit">{trip.credit} · Editorial reference, not a verified fleet journey</span>
     </article>)}
   </div>
   <div className="route-editorial-bottom">
     <p><strong>Editorial travel inspiration</strong> — not testimonials, completed bookings or guaranteed routes. Click each card for its own adventure, then confirm destinations, access, availability and price.</p>
     <a href={stories?'/#fare':'#fare'}>Plan your journey <ArrowUpRight size={16}/></a>
   </div>
 </section>;
}
