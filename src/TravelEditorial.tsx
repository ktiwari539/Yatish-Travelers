import { ArrowUpRight, Compass, Mountain, Route } from 'lucide-react';

const image=(file:string)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=1600';
const trips=[
 {index:'01',type:'MOUNTAIN ROADS',title:'Into the Himalayas',place:'Manali & the mountain valleys',subtitle:'Pine forests, winding bends and crisp mountain air.',image:image('Manali mountains view.jpg'),author:'Kushavart',source:'https://commons.wikimedia.org/wiki/File:Manali_mountains_view.jpg',license:'CC BY-SA 4.0'},
 {index:'02',type:'THE SCENIC ROUTE',title:'The high-altitude road',place:'Ladakh road-trip inspiration',subtitle:'Vast panoramas and extraordinary mountain roads.',image:image('Khardung La (pass), Mountain road, Ladakh, North India.jpg'),author:'Vyacheslav Argenberg',source:'https://commons.wikimedia.org/wiki/File:Khardung_La_(pass),_Mountain_road,_Ladakh,_North_India.jpg',license:'CC BY 4.0'},
 {index:'03',type:'HERITAGE ESCAPES',title:'Chase the golden hour',place:'Udaipur & lakeside journeys',subtitle:'Slow evenings, heritage streets and unforgettable sunsets.',image:image('Lake Pichola at sunset, Udaipur, Rajasthan, India.jpg'),author:'UnpetitproleX',source:'https://commons.wikimedia.org/wiki/File:Lake_Pichola_at_sunset,_Udaipur,_Rajasthan,_India.jpg',license:'CC BY-SA 4.0'}
];
export function TravelEditorial({stories=false}:{stories?:boolean}){
 return <section className="route-editorial" id="journeys">
   <div className="route-editorial-top">
     <div><span className="route-eyebrow"><Compass size={15}/> BEYOND THE DESTINATION</span><h2>The road is part of <em>the story.</em></h2></div>
     <p>From winding hill roads to quiet heritage escapes, discover the kinds of journeys you could plan with Mateshwari Travellers.</p>
   </div>
   <div className="route-editorial-grid">
     {trips.map((trip,index)=><article className={'route-tile route-tile-'+index} key={trip.title}>
       <div className="route-tile-visual"><img src={trip.image} alt={trip.place} loading="lazy"/><div className="route-tile-scrim"/>
         <span className="route-tile-num">{trip.index} / 03</span>
         <span className="route-tile-icon">{index===0?<Mountain size={20}/>:<Route size={20}/>}</span>
         <div className="route-tile-content"><span>{trip.type}</span><h3>{trip.title}</h3><p>{trip.place}</p></div>
       </div>
       <div className="route-tile-foot"><span>{trip.subtitle}</span><a href={stories?'/#fare':'#fare'} aria-label={'Plan a journey inspired by '+trip.place}><ArrowUpRight size={18}/></a></div>
       <a className="route-credit" href={trip.source} target="_blank" rel="noreferrer">Photo: {trip.author}, {trip.license}</a>
     </article>)}
   </div>
   <div className="route-editorial-bottom"><p><strong>Editorial travel inspiration</strong> — not completed customer trips or guaranteed routes. Confirm availability and route suitability before travel.</p><a href={stories?'/#fare':'#fare'}>Plan your journey <ArrowUpRight size={16}/></a></div>
 </section>;
}
