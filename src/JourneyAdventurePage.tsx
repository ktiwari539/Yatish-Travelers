import { ArrowLeft, ArrowRight, Compass, MapPin, ShieldCheck } from 'lucide-react';
import { findJourney, journeyAdventures, journeyUrl } from './journeyAdventures';
import { ScenicImage } from './ScenicImage';

export function JourneyAdventurePage({slug}:{slug:string}){
 const journey=findJourney(slug);
 if(!journey)return <main className="adventure-page">
   <header className="adventure-nav"><a href="/" aria-label="Return to Mateshwari home"><ArrowLeft size={16}/> MATESHWARI TRAVELLERS</a></header>
   <section className="adventure-not-found"><h1>Journey not found.</h1><p>Explore our three illustrated road-trip ideas instead.</p>
    <a href="/#journeys">Explore road trips <ArrowRight size={17}/></a></section>
 </main>;
 return <main className="adventure-page">
   <header className="adventure-nav">
     <a href="/" aria-label="Return to Mateshwari home"><ArrowLeft size={17}/> MATESHWARI <span>TRAVELLERS</span></a>
     <a href="/#fare">Plan a trip <ArrowRight size={17}/></a>
   </header>
   <section className="adventure-hero" aria-label={journey.type+' journey inspiration'}>
     <ScenicImage src={journey.hero} fallback={journey.fallback} alt={journey.alt} loading="eager"/>
     <div className="adventure-shade"/>
     <div className="adventure-hero-copy">
       <span><Compass size={17}/> ADVENTURE {journey.index} / 03 · {journey.type}</span>
       <h1>{journey.title}</h1>
       <p>{journey.intro}</p>
       <a href="/#fare">Plan this journey <ArrowRight size={18}/></a>
     </div>
   </section>
   <section className="adventure-chapters" aria-label="Suggested road-trip planning stages">
     <div className="adventure-chapters-head">
       <span>THE JOURNEY, YOUR WAY</span>
       <h2>Three ways to make it yours.</h2>
       <p>Ideas to customize with our team—not fixed packages or claims of completed trips.</p>
     </div>
     <div className="adventure-chapter-grid">{journey.chapters.map((chapter,index)=>
       <article key={chapter.title}>
         <small>0{index+1} / 03</small><h3>{chapter.title}</h3><p>{chapter.body}</p>
       </article>)}
     </div>
     <p className="adventure-photo-disclaimer"><ShieldCheck size={17}/>{journey.vehicleNote} {journey.credit}. Every final route, assigned vehicle, image rights and fare require confirmation.</p>
   </section>
   <section className="adventure-more">
     <div><span><MapPin size={16}/> MORE ROADS TO DISCOVER</span><h2>Keep exploring.</h2></div>
     <div className="adventure-more-links">{journeyAdventures.filter(item=>item.slug!==journey.slug).map(item=>
       <a key={item.slug} href={journeyUrl(item.slug)}>
         <small>{item.type}</small><strong>{item.title}</strong><ArrowRight size={19}/>
       </a>)}</div>
   </section>
   <footer className="adventure-footer">
     <a href="/#journeys"><ArrowLeft size={17}/> All road-trip ideas</a>
     <a href="/#fleet">Explore vehicles <ArrowRight size={17}/></a>
   </footer>
 </main>;
}
