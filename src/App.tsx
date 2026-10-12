import { useEffect, useMemo, useState } from 'react';
import { FleetHeroVisual } from './FleetHeroVisual';
import { FleetCatalogCard } from './FleetCatalogCard';
import { PremiumFleetExperience } from './PremiumFleetExperience';
import { WhyMateshwari } from './WhyMateshwari';

import { AdminDashboard } from './AdminDashboard';
import { TravelEditorial } from './TravelEditorial';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';
import { LuxuryInterlude } from './LuxuryInterlude';
import { RouteExperience } from './RouteExperience';
import { ArrowRight, Calculator, CarFront, Check, CheckCircle2, Copy, MapPin, MessageCircle, Mail, Menu, Phone, Plane, Route, ShieldCheck, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';

type FleetVehicle = {
  name: string;
  seats: string;
  tag: string;
  category: string;
  image: string;
  imageSource: string;
  imageCredit: string;
  license: string;
  capacity?:number;
  rateMin?:number;
  rateMax?:number;
  gallery?:string[];
  modelUrl?:string;
};

const commonsImage = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=1600`;

const fleet: FleetVehicle[] = [
  {
    name: 'Maruti Dzire',
    seats: '4+1',
    tag: 'Smart & Efficient',
    category: 'Sedan',
    image: commonsImage('MIAS%202025%20-%20All-new%20Suzuki%20Dzire%20Hybrid%2002.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:MIAS_2025_-_All-new_Suzuki_Dzire_Hybrid_02.jpg',
    imageCredit: 'Ethan Llamas',
    license: 'CC BY-SA 4.0',
    gallery:[commonsImage('MIAS%202025%20-%20All-new%20Suzuki%20Dzire%20Hybrid%2004.jpg')],
  },
  {
    name: 'Maruti Ertiga',
    seats: '6+1',
    tag: 'Family Favourite',
    category: 'MPV',
    image: commonsImage('Suzuki%20Ertiga%20GX%20%28Side%29%2C%20Jakarta%2C%20Indonesia.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_GX_(Side),_Jakarta,_Indonesia.jpg',
    imageCredit: 'RichardSummersault',
    license: 'CC0 1.0',
    gallery:[commonsImage('Suzuki%20Ertiga%20GX%201.5%20-%20Indonesia%20International%20Motor%20Show%202018%20-%20Rear%20view%20-%20April%2026%202018.jpg')],
  },
  {
    name: 'Toyota Innova',
    seats: '6+1',
    tag: 'Premium Comfort',
    category: 'Premium MPV',
    image: commonsImage('Toyota%20Innova%20Crysta%202.4%20Z%20side.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_side.jpg',
    imageCredit: 'Premnath Kudva',
    license: 'CC BY-SA 4.0',
    gallery:[commonsImage('Toyota%20Innova%20Crysta%202.4%20Z%20rear%20left.jpg'),commonsImage('Toyota%20Innova%20Crysta%202.4%20Z%20front%20right.jpg')],
  },
  {
    name: 'Mahindra TUV',
    seats: '6+1',
    tag: 'Strong & Spacious',
    category: 'SUV',
    image: commonsImage('Mahindra%20TUV%20300%20%282016%29%20%2852715226367%29.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Mahindra_TUV_300_(2016)_(52715226367).jpg',
    imageCredit: 'Charles',
    license: 'CC BY 2.0',
  },
  {
    name: 'Mahindra Bolero',
    seats: '6+1',
    tag: 'Bold Black Edition · On request',
    category: 'SUV',
    image: commonsImage('Mahindra%20Bolero%20Gen%203.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Mahindra_Bolero_Gen_3.jpg',
    imageCredit: 'SnapMeUp',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Mahindra Scorpio-N',
    seats: '6+1',
    tag: 'Statement SUV · On request',
    category: 'Premium SUV',
    image: commonsImage(encodeURIComponent('2024 Mahindra Scorpio Z8L front.jpg')),
    imageSource: 'https://commons.wikimedia.org/wiki/File:2024_Mahindra_Scorpio_Z8L_front.jpg',
    imageCredit: 'LuvsMG481',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Mahindra Thar',
    seats: '3+1',
    tag: 'Red Rage Adventure · On request',
    category: 'Adventure SUV',
    image: commonsImage(encodeURIComponent('Mahindra Thar SUV in "Red Rage" color at Ashiana Brahmanda, East Singbhum India (Ank Kumar, Infosys limited) 02 (cropped).jpg')),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Mahindra_Thar_SUV_in_%22Red_Rage%22_color_at_Ashiana_Brahmanda,_East_Singbhum_India_(Ank_Kumar,_Infosys_limited)_02_(cropped).jpg',
    imageCredit: 'Ank Kumar',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Mahindra XUV700',
    seats: '6+1',
    tag: 'Black Executive · On request',
    category: 'Premium SUV',
    image: commonsImage(encodeURIComponent('A black Mahindra XUV700 SUV in Ashiana Brahmananda, Jamshedpur, India (Ank Kumar, Infosys Limited) 02.jpg')),
    imageSource: 'https://commons.wikimedia.org/wiki/File:A_black_Mahindra_XUV700_SUV_in_Ashiana_Brahmananda,_Jamshedpur,_India_(Ank_Kumar,_Infosys_Limited)_02.jpg',
    imageCredit: 'Ank Kumar',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Kia Carens',
    seats: '6+1',
    tag: 'Contemporary Family · On request',
    category: 'Premium MPV',
    image: commonsImage(encodeURIComponent('Kia Carens 2024 Model 2.jpg')),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Kia_Carens_2024_Model_2.jpg',
    imageCredit: 'Ganesh Mohan T',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Tempo Traveller',
    seats: '12+1 / 17+1',
    tag: 'Group Travel',
    category: 'Traveller',
    image: commonsImage('Force%20Traveller%20Luxury.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Force_Traveller_Luxury.jpg',
    imageCredit: 'वंपायर',
    license: 'CC BY-SA 2.0',
  },
];


const contactWhatsapp='https://wa.me/919340098177';
const contactEmail='mailto:ktiwari539@gmail.com';
const getVisitorSession=()=>{
  try {
    let value=sessionStorage.getItem('mt-visitor-session');
    if (!value) {
      value=crypto.randomUUID();
      sessionStorage.setItem('mt-visitor-session',value);
    }
    return value;
  } catch { return ''; }
};
const logInteraction=(event:string,source:string,vehicle='')=>{
  if (typeof window==='undefined')return;
  const body=JSON.stringify({event,source,vehicle,sessionId:getVisitorSession()});
  try {
    void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }catch{/* analytics must never block booking */}
};
const WhatsappLink=({label='WhatsApp',source,className='whatsapp-link'}:{label?:string;source:string;className?:string})=>(
  <a href={contactWhatsapp+'?text='+encodeURIComponent('Hello Mateshwari Travellers, I would like to enquire about a trip.')}
     target="_blank" rel="noopener noreferrer" className={className}
     onClick={()=>logInteraction('whatsapp_click',source)} aria-label="Chat with Mateshwari Travellers on WhatsApp">
    <MessageCircle size={18}/>{label}
  </a>
);

const indicativePricing = {
  minRate: 15,
  maxRate: 25,
};

const vehicleProfiles: Record<string, { capacity: number; useCases: string[]; priority: number }> = {
  'Maruti Dzire': { capacity: 4, useCases: ['Business', 'Family'], priority: 4 },
  'Maruti Ertiga': { capacity: 6, useCases: ['Family', 'Business'], priority: 2 },
  'Toyota Innova': { capacity: 6, useCases: ['Premium', 'Family', 'Business'], priority: 1 },
  'Mahindra TUV': { capacity: 6, useCases: ['Family', 'Group'], priority: 5 },
  'Mahindra Bolero': { capacity: 6, useCases: ['Family', 'Group'], priority: 6 },
  'Mahindra Scorpio-N': { capacity: 6, useCases: ['Premium', 'Family', 'Group'], priority: 3 },
  'Mahindra Thar': { capacity: 3, useCases: ['Premium', 'Family'], priority: 8 },
  'Mahindra XUV700': { capacity: 6, useCases: ['Premium', 'Family', 'Business'], priority: 2 },
  'Kia Carens': { capacity: 6, useCases: ['Family', 'Business'], priority: 3 },
  'Tempo Traveller': { capacity: 17, useCases: ['Group', 'Business'], priority: 3 },
};

const fleetFilters = ['All', 'Family', 'Premium', 'Group', 'Business'] as const;
type FleetFilter = typeof fleetFilters[number];
type QuoteMode = 'quote' | 'callback' | 'corporate';


function StoriesPage() {
  const storySlots = [
    { title:'Roads to remember',text:'Scenic drives and family escapes provide inspiration for future journeys. Authentic customer road stories will appear after review.',visual:luxuryMedia.hero },
    { title:'Into the highlands',text:'Mountain views, remarkable bends and the beauty of the journey itself. Verified customer mountain-trip stories will appear here.',visual:luxuryMedia.mountains },
    { title:'The art of arriving',text:'A more considered way to plan airport arrivals, business journeys and special moments. Real stories will be published after moderation.',visual:luxuryMedia.airport }
  ];

  return (
    <main className="stories-page">
      <header className="stories-nav">
        <a className="brand" href="/">MATESHWARI <span>TRAVELLERS</span></a>
        <a className="secondary" href="/">Back to Home <ArrowRight size={16} /></a>
      </header>

      <section className="stories-hero cinematic-stories-hero">
        <ScenicImage className="stories-hero-background" src={luxuryMedia.mountains.src} fallback={luxuryMedia.mountains.fallback} alt="" loading="eager"/>
        <div className="stories-hero-glow" />
        <span className="kicker">Stories from the Road</span>
        <h1>Every trip has a story worth keeping.</h1>
        <p>
          Discover scenic journeys and ideas for your next trip. This page will also feature real customer photos and verified travel stories once our submission and moderation process opens.
        </p>
        <div className="stories-hero-actions">
          <a className="primary" href="#share-story">Share your journey <ArrowRight size={16}/></a>
          <a className="secondary" href="/">Explore the fleet</a>
        </div>
      </section>

      <section className="stories-gallery" aria-label="Future customer story gallery">
        {storySlots.map((story, index) => (
          <article className="story-feature" key={story.title}>
            <div className="story-feature-image">
              <ScenicImage src={story.visual.src} fallback={story.visual.fallback ?? luxuryMedia.landscape.src} alt={story.visual.alt} loading="lazy" />
              <div className="story-feature-shade" />
              <span>0{index + 1}</span>
            </div>
            <div className="story-feature-copy">
              <small>EDITORIAL JOURNEY INSPIRATION</small>
              <h2>{story.title}</h2>
              <p>{story.text}</p>
              <strong>Real customer stories: awaiting approved submissions</strong>
            </div>
          </article>
        ))}
      </section>

      <TravelEditorial stories />
      <section className="story-submit" id="share-story">
        <div>
          <span className="kicker">Share Your Journey</span>
          <h2>Share the moments that made your journey memorable.</h2>
          <p>
            Add your trip details, a short story and photos. Your submission stays private until it has been reviewed by Mateshwari Travellers.
          </p>
        </div>
        <form onSubmit={(event) => event.preventDefault()} className="story-submit-form">
          <label>Your name<input type="text" placeholder="Name" /></label>
          <label>Journey type
            <select defaultValue="">
              <option value="" disabled>Select journey type</option>
              <option>Family / Outstation</option>
              <option>Airport</option>
              <option>Corporate</option>
              <option>Wedding / Event</option>
              <option>Group Travel</option>
            </select>
          </label>
          <label>Your story<textarea rows={5} placeholder="Tell us about your journey..." /></label>
          <label>Photos<input type="file" accept="image/*" multiple /></label>
          <button type="button" className="story-submit-disabled" disabled>
            Story submissions opening soon
          </button>
          <small>Nothing is published automatically. Every submission is reviewed first.</small>
        </form>
      </section>

      <footer className="stories-footer">
        <div><strong>Mateshwari Travellers</strong><p>Real journeys. Verified stories. Premium travel.</p></div>
        <div><a href="/">Home</a><a href="/#fleet">Fleet</a><WhatsappLink label="WhatsApp" source="stories-footer"/><a href={contactEmail}>Email</a></div>
      </footer>

    </main>
  );
}

export function App() {
  const [vehicle, setVehicle] = useState(fleet[1].name);
  const [km, setKm] = useState(250);
  const [days, setDays] = useState(1);
  const [nightStay, setNightStay] = useState(false);
  const [fleetFilter, setFleetFilter] = useState<FleetFilter>('All');
  const [fleetSort, setFleetSort] = useState('smart');
  const [passengers, setPassengers] = useState(4);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('quote');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [quoteDelivery,setQuoteDelivery]=useState<Array<{channel:string;purpose:string;status:string}>>([]);
  const [copied, setCopied] = useState(false);
  const [liveFleet,setLiveFleet]=useState<FleetVehicle[]>(fleet);
  const [quoteSource,setQuoteSource]=useState('website');
  useEffect(()=>{
    let active=true;
    fetch('/api/catalog').then(res=>res.ok?res.json():Promise.reject()).then(data=>{
      if(!active || !Array.isArray(data.vehicles))return;
      const next=data.vehicles.map((car:FleetVehicle)=>{
        const initial=fleet.find(v=>v.name===car.name && v.image===car.image);
        return {...car,imageSource:initial?.imageSource||car.image,imageCredit:initial?.imageCredit||'Fleet administration',license:initial?.license||'Check image rights'};
      });
      setLiveFleet(next);
    }).catch(()=>{/* offline frontend keeps preview vehicles */});
    return ()=>{active=false;};
  },[]);

  const selected = liveFleet.find(item=>item.name===vehicle) ?? liveFleet[0] ?? fleet[1];
  const heroVehicle = selected;
  const selectFeatured = (name:string)=>{
    const next=liveFleet.findIndex(item=>item.name===name);
    if(next>=0)setVehicle(name);
  };

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal-3d'));
    if (!nodes.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-inview');
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);



  const estimate = useMemo(() => {
    const chargeableKm = Math.max(km, days * 250);
    const minBase = chargeableKm * (selected.rateMin ?? indicativePricing.minRate);
    const maxBase = chargeableKm * (selected.rateMax ?? indicativePricing.maxRate);
    const driver = nightStay ? 500 : 0;
    return {
      chargeableKm,
      minBase,
      maxBase,
      driver,
      minTotal: minBase + driver,
      maxTotal: maxBase + driver,
    };
  }, [days, km, nightStay, selected.name, selected.rateMin, selected.rateMax]);

  const filteredFleet = useMemo(() => {
    const filtered = liveFleet.filter((car)=>(
      fleetFilter === 'All' || (vehicleProfiles[car.name]?.useCases||[
        car.category.toLowerCase().includes('premium')?'Premium':'Family',
        car.capacity && car.capacity>=7?'Group':'Business'
      ]).includes(fleetFilter)
    ));

    return [...filtered].sort((a, b) => {
      const aProfile=vehicleProfiles[a.name]??{capacity:a.capacity||4,useCases:['Family'],priority:50};
      const bProfile=vehicleProfiles[b.name]??{capacity:b.capacity||4,useCases:['Family'],priority:50};

      if (fleetSort === 'seats-desc') return bProfile.capacity - aProfile.capacity;
      if (fleetSort === 'compact') return aProfile.capacity - bProfile.capacity;
      if (fleetSort === 'premium') {
        const aPremium = aProfile.useCases.includes('Premium') ? 0 : 1;
        const bPremium = bProfile.useCases.includes('Premium') ? 0 : 1;
        return aPremium - bPremium || aProfile.priority - bProfile.priority;
      }

      const aFits = aProfile.capacity >= passengers ? 0 : 1;
      const bFits = bProfile.capacity >= passengers ? 0 : 1;
      const aGap = aFits === 0 ? aProfile.capacity - passengers : 99;
      const bGap = bFits === 0 ? bProfile.capacity - passengers : 99;
      return aFits - bFits || aGap - bGap || aProfile.priority - bProfile.priority;
    });
  }, [fleetFilter, fleetSort, passengers, liveFleet]);

  const openQuote = (mode: QuoteMode = 'quote',source='website',requestedVehicle?:string) => {
    setQuoteMode(mode);
    setQuoteSource(source);
    logInteraction(mode+'_open',source,requestedVehicle??selected.name);
    setQuoteSubmitted(false);
    setQuoteError('');
    setQuoteId('');
    setQuoteDelivery([]);
    setCopied(false);
    setQuoteOpen(true);
  };

  const quoteSummary = `Mateshwari Travellers enquiry
Vehicle: ${selected.name}
Passengers: ${passengers}
Distance: ${estimate.chargeableKm.toLocaleString('en-IN')} km
Trip days: ${days}
Indicative range: ₹${estimate.minTotal.toLocaleString('en-IN')}–₹${estimate.maxTotal.toLocaleString('en-IN')}
Night stay: ${nightStay ? 'Yes' : 'No'}`;

  const copyQuoteSummary = async () => {
    try {
      await navigator.clipboard.writeText(quoteSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!quoteOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuoteOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quoteOpen]);

  const isStoriesPage = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/stories';
  if (isStoriesPage) return <StoriesPage />;
  if (typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/admin') return <AdminDashboard />;

  return (
    <main>
      <header className="nav">
        <a className="brand" href="/" aria-label="Mateshwari Travellers — return to homepage">MATESHWARI <span>TRAVELLERS</span></a>
        <nav>
          <a href="#motion-fleet">Experience</a>
          <a href="#fleet">Fleet</a>
          <a href="#services">Services</a>
          <a href="#corporate">Corporate</a>
          <a href="#fare">Fare Calculator</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#fare">Plan a Trip <ArrowRight size={16} /></a>
        <button className="nav-menu-toggle" type="button" onClick={()=>setMobileMenuOpen(v=>!v)}
          aria-expanded={mobileMenuOpen} aria-controls="mobile-main-nav" aria-label={mobileMenuOpen?'Close navigation':'Open navigation'}>
          {mobileMenuOpen?<X size={22}/>:<Menu size={22}/>}
        </button>
        {mobileMenuOpen&&<nav className="mobile-nav-panel" id="mobile-main-nav" aria-label="Mobile navigation">
          {[['Fleet experience','#motion-fleet'],['Vehicle options','#fleet'],['Fare estimator','#fare'],['Services','#services'],['Corporate','#corporate'],['Journeys','#journeys'],['Contact','#contact']].map(([label,href])=>(
            <a key={href} href={href} onClick={()=>setMobileMenuOpen(false)}>{label}<ArrowRight size={15}/></a>
          ))}
          <a className="mobile-nav-quote" href="#fare" onClick={()=>setMobileMenuOpen(false)}>Get a quote <ArrowRight size={16}/></a>
        </nav>}
      </header>

      <section className="hero cinematic-landing" id="top" aria-label="Mateshwari Travellers signature journeys">
        <div className="car-stage fleet-hero-slot">
          <FleetHeroVisual vehicles={liveFleet}
            activeIndex={Math.max(0,liveFleet.findIndex(item=>item.name===vehicle))}
            onChange={index=>{const car=liveFleet[index];if(car)selectFeatured(car.name);}}
            onQuote={name=>{selectFeatured(name);openQuote('quote','hero-featured',name);}}/>
        </div>
        <div className="hero-copy cinematic-landing-copy">
          <div className="eyebrow"><Sparkles size={15}/> MATESHWARI TRAVELLERS / YOUR JOURNEY, ELEVATED</div>
          <h1>Travel, arranged with <em>more thought.</em></h1>
          <p>Thoughtfully coordinated local, outstation, airport and group journeys. Find the right vehicle, plan your route and travel on your terms.</p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={()=>openQuote('quote','cinematic-hero')}>
              Request a Quote <ArrowRight size={17}/>
            </button>
            <WhatsappLink source="hero" label="Chat on WhatsApp" className="secondary hero-whatsapp"/>
            <a className="hero-fleet-link" href="#motion-fleet">Explore the Fleet <ArrowRight size={15}/></a>
          </div>
          <a className="cinematic-landing-email" href={contactEmail+'?subject='+encodeURIComponent('Travel enquiry — Mateshwari Travellers')}
            onClick={()=>logInteraction('email_click','hero')}><Mail size={15}/> Prefer email? Contact us directly</a>
        </div>
        <div className="cinematic-landing-scroll" aria-hidden="true"><span>SCROLL TO EXPLORE</span><i/></div>
      </section>

      <section className="signature-strip reveal-3d" aria-label="Mateshwari Travellers service highlights">
        <div><small>01</small><strong>Chauffeur Included</strong><span>Professional driver-led travel</span></div>
        <div><small>02</small><strong>Flexible Journeys</strong><span>Local, airport and outstation</span></div>
        <div><small>03</small><strong>Right-Sized Fleet</strong><span>From sedans to group travelers</span></div>
        <div><small>04</small><strong>Clear Quotations</strong><span>Know the major charges before travel</span></div>
      </section>

      <PremiumFleetExperience vehicles={liveFleet} activeName={heroVehicle.name}
        onSelect={selectFeatured} onQuote={name=>{selectFeatured(name);openQuote('quote','featured-fleet',name);}}/>
      <section className="section reveal-3d" id="fleet">
        <div className="section-heading">
          <div><span className="kicker">Our Fleet</span><h2>Choose your ride.</h2></div>
          <p>Clean, comfortable vehicles for solo travel, families, business trips and long-distance journeys.</p>
        </div>

        <div className="fleet-tools">
          <div className="fleet-filter-block">
            <span><SlidersHorizontal size={15}/> Best for</span>
            <div className="filter-chips">
              {fleetFilters.map((filter) => (
                <button
                  key={filter}
                  className={fleetFilter === filter ? 'is-active' : ''}
                  onClick={() => setFleetFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <label className="passenger-control">
            <span><Users size={15}/> Travelers</span>
            <input
              type="number"
              min="1"
              max="17"
              value={passengers}
              onChange={(event) => setPassengers(Math.max(1, Math.min(17, Number(event.target.value) || 1)))}
            />
          </label>

          <label className="sort-control">
            <span>Sort</span>
            <select value={fleetSort} onChange={(event) => setFleetSort(event.target.value)}>
              <option value="smart">Smart Match</option>
              <option value="premium">Premium First</option>
              <option value="seats-desc">Most Seats</option>
              <option value="compact">Compact First</option>
            </select>
          </label>
        </div>

        <div className="fleet-match-note">
          <strong>{filteredFleet.length} vehicles</strong>
          <span>sorted for {passengers} traveler{passengers === 1 ? '' : 's'}{fleetFilter !== 'All' ? ` · ${fleetFilter}` : ''}</span>
        </div>

        <div className="fleet-grid">
          {filteredFleet.map((car,index)=>(
            <FleetCatalogCard car={car} index={index} key={car.name}
              onEstimate={()=>{selectFeatured(car.name);logInteraction('vehicle_explore','fleet',car.name);document.getElementById('fare')?.scrollIntoView({behavior:'smooth'});}}/>
          ))}       </div>
      </section>

      <WhyMateshwari onQuote={()=>openQuote('quote','why-mateshwari')}/>
      <section className="fare-section reveal-3d" id="fare">
        <div className="fare-copy">
          <span className="kicker">Trip Estimator</span>
          <h2>Know the approximate cost before you call.</h2>
          <p>Indicative pricing follows the selected vehicle. Final pricing can vary by route, trip duration and travel requirements. Driver allowance is added only when a night stay is required. Toll/FASTag, parking, state permit and applicable GST are charged separately as applicable.</p>
          <div className="selected-vehicle">
            <div className="selected-vehicle-image"><img src={selected.image} alt="" /></div>
            <div><span>Selected vehicle</span><strong>{selected.name}</strong><small>{selected.seats} · {selected.category}</small></div>
          </div>
        </div>

        <div className="calculator">
          <label>Vehicle
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              {liveFleet.map((car) => <option key={car.name}>{car.name}</option>)}
            </select>
          </label>
          <div className="field-row">
            <label>Approx. kilometres<input type="number" min="1" value={km} onChange={(e) => setKm(Number(e.target.value))}/></label>
            <label>Trip days<input type="number" min="1" value={days} onChange={(e) => setDays(Number(e.target.value))}/></label>
          </div>
          <label className="checkline"><input type="checkbox" checked={nightStay} onChange={(e) => setNightStay(e.target.checked)}/> Driver night stay required</label>
          <div className="breakdown">
            <div><span>Chargeable distance</span><strong>{estimate.chargeableKm.toLocaleString('en-IN')} km</strong></div>
            <div><span>Indicative vehicle range</span><strong>₹{estimate.minBase.toLocaleString('en-IN')}–₹{estimate.maxBase.toLocaleString('en-IN')}</strong></div>
            {nightStay && <div><span>Driver night-stay allowance</span><strong>₹{estimate.driver.toLocaleString('en-IN')}</strong></div>}
            <div><span>Toll / FASTag</span><strong>Actuals extra</strong></div>
            <div><span>Parking / state permit</span><strong>Actuals extra</strong></div>
            <div className="total"><span>Indicative trip range</span><strong>₹{estimate.minTotal.toLocaleString('en-IN')}–₹{estimate.maxTotal.toLocaleString('en-IN')}</strong></div>
          </div>
          <p className="note">This estimate currently uses a 250 km/day minimum. The selected vehicle rate is indicative only; your final quote is confirmed before booking. Driver allowance is added only for night stay. Toll/FASTag, parking and state permit charges are extra at actuals.</p>
          <div className="calc-actions">
            <button className="primary" type="button" onClick={() => openQuote('quote','calculator')}><MessageCircle size={18}/> Request Final Quote</button>
            <button className="secondary" type="button" onClick={() => openQuote('callback','calculator')}><Phone size={17}/> Request Callback</button>
          </div>
        </div>
      </section>

      <section className="section services reveal-3d" id="services">
        <div className="section-heading">
          <div><span className="kicker">Travel Your Way</span><h2>One fleet. Multiple journeys.</h2></div>
        </div>
        <div className="service-grid">
          {[
            { title: 'Local City Travel', text: 'Point-to-point rides and flexible city packages for everyday movement.', icon: <MapPin size={24}/>, meta: 'City rides', visual: luxuryMedia.forest },
            { title: 'Outstation', text: 'One-way, round-trip and multi-day intercity journeys with planned stops.', icon: <Route size={24}/>, meta: 'Intercity', visual: luxuryMedia.mountains },
            { title: 'Airport Transfer', text: 'Scheduled pickups and drops with room for flight-time coordination.', icon: <Plane size={24}/>, meta: 'Airport', visual: luxuryMedia.airport },
            { title: 'Wedding & Events', text: 'Coordinated guest, family and event transport with the right fleet mix.', icon: <Users size={24}/>, meta: 'Events', visual: luxuryMedia.hero },
          ].map((item) => (
            <article key={item.title} className="cinematic-service-card">
              <div className="cinematic-service-media"><ScenicImage src={item.visual.src} fallback={item.visual.fallback ?? luxuryMedia.landscape.src} alt={item.visual.alt} loading="lazy"/><span>{item.meta.toUpperCase()}</span></div>
              <div className="service-icon">{item.icon}</div>
              <small>{item.meta}</small>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <button type="button" onClick={() => openQuote('quote')}>Plan this trip <ArrowRight size={14}/></button>
            </article>
          ))}
        </div>
      </section>


      <LuxuryInterlude compact/>
      <RouteExperience onPlan={(kind)=>{
        const suggestions:Record<string,string[]>={
          mountains:['Mahindra TUV','Mahindra Bolero','Toyota Innova'],
          heritage:['Toyota Innova','Maruti Ertiga','Maruti Dzire'],
          airport:['Maruti Dzire','Toyota Innova','Maruti Ertiga'],
          events:['Tempo Traveller','Maruti Ertiga','Toyota Innova']
        };
        const match=(suggestions[kind]||[]).find(name=>liveFleet.some(car=>car.name===name));
        if(match)setVehicle(match);
        openQuote('quote','journey-studio');
      }}/>
      
      <section className="corporate-section reveal-3d" id="corporate">
        <div className="corporate-orbit corporate-orbit-one" aria-hidden="true" />
        <div className="corporate-orbit corporate-orbit-two" aria-hidden="true" />
        <div className="corporate-image-panel">
          <ScenicImage src={luxuryMedia.airport.src} fallback={luxuryMedia.forest.src} alt={luxuryMedia.airport.alt} loading="lazy"/>
          <div className="corporate-image-overlay">
            <small>ARRIVE IN YOUR ELEMENT</small>
            <strong>Business travel, thoughtfully coordinated.</strong>
            <span>Airport · Executive · Teams · Events</span>
          </div>
        </div>
        <div className="corporate-copy">
          <span className="kicker">Corporate Mobility</span>
          <h2>One travel partner for your teams, guests and business journeys.</h2>
          <p>
            From daily business movement to airport pickups, executive travel, events and multi-city requirements,
            Mateshwari Travellers can coordinate corporate transport based on fleet and city availability.
          </p>
          <div className="corporate-actions">
            <button className="primary" type="button" onClick={() => openQuote('corporate')}>Discuss Corporate Requirement <ArrowRight size={17}/></button>
            <a className="secondary" href="#coverage">See Coverage Model</a>
          </div>
        </div>

        <div className="corporate-panel">
          <div className="corporate-panel-head">
            <span>Business travel solutions</span>
            <strong>Flexible coordination for single-city & multi-city needs</strong>
          </div>
          <div className="corporate-grid">
            {[
              ['Employee Travel', 'Planned office travel, shifts and recurring mobility requirements.'],
              ['Executive & Airport', 'Professional airport transfers, meetings and leadership travel.'],
              ['Multi-City Coordination', 'One point of coordination for requirements across supported cities.'],
              ['Events & Guests', 'Guest movement, conferences, weddings and business events.'],
              ['Billing Ready', 'Structured billing and account-based pricing for recurring requirements.'],
              ['Dedicated Coordination', 'A structured contact path for recurring or high-volume requirements.'],
            ].map(([title, text], index) => (
              <article key={title}>
                <span className="corporate-index">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="coverage-strip" id="coverage">
            <div>
              <span className="coverage-label">Coverage model</span>
              <strong>City → Multi-city → Corporate network</strong>
            </div>
            <p>City and multi-city requests are coordinated based on actual vehicle and route availability, with one point of contact for the journey.</p>
          </div>
        </div>
      </section>




      <TravelEditorial />
      <section className="stories-teaser reveal-3d" id="stories">
        <div className="stories-teaser-copy">
          <span className="kicker">Stories from the Road</span>
          <h2>Real journeys deserve more than a small review card.</h2>
          <p>
            Customer photos, memorable routes and verified feedback have their own space — so the people behind the journeys never feel like an afterthought.
          </p>
          <a className="primary" href="/stories">Explore Stories <ArrowRight size={17}/></a>
        </div>

        <div className="stories-teaser-stack cinematic-stories-stack" aria-label="Illustrative journeys">
          {[{visual:luxuryMedia.mountains,title:'Mountain escapes'}, {visual:luxuryMedia.hero,title:'The golden-hour drive'}, {visual:luxuryMedia.landscape,title:'Places worth discovering'}].map(({visual,title},index)=>(
            <article className={`story-stack-card story-stack-${index + 1}`} key={title}>
              <ScenicImage src={visual.src} fallback={visual.fallback ?? luxuryMedia.landscape.src} alt={visual.alt} loading="lazy" />
              <div><small>TRAVEL INSPIRATION</small><strong>{title}</strong><span>Imagine your next journey</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="conversion-finale" aria-label="Start a journey">
        <div><span className="kicker">LET THE JOURNEY BEGIN</span>
          <h2>Where would you like <em>to go?</em></h2>
          <p>Tell us the route, date and who is travelling. We'll help work out a suitable vehicle and final quotation.</p></div>
        <div className="conversion-finale-actions">
          <button className="primary" type="button" onClick={()=>openQuote('quote','final-cta')}>Request a quotation <ArrowRight size={18}/></button>
          <WhatsappLink source="final-cta" label="Chat on WhatsApp" className="secondary"/>
          <a href="tel:+919340098177"><Phone size={17}/> Call us</a>
        </div>
      </section>
      <footer id="contact">
        <div><strong>Mateshwari Travellers</strong><p>Premium chauffeur-driven travel for local and outstation journeys.</p></div>
        <div><span>Booking</span><a href="#fare">Calculate Fare</a><a href="/stories">Stories from the Road</a><WhatsappLink label="WhatsApp us" source="footer"/><a href={contactEmail}>Email: ktiwari539@gmail.com</a><a href="tel:+919340098177">Call: +91 93400 98177</a><button className="footer-action" type="button" onClick={() => openQuote('callback','footer')}>Request a callback</button></div>
        <div><span>Travel</span><p>Local city rides · Outstation trips · Airport transfers · Family journeys · Corporate mobility</p></div>
        <div className="image-credits">
          <span>Image credits</span>
          <p>
            {liveFleet.map((car, index) => (
              <span key={car.name}>
                <a href={car.imageSource} target="_blank" rel="noreferrer">{car.name}: {car.imageCredit} ({car.license})</a>
                {index < liveFleet.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
          <p>Alternate angles: <a href="https://commons.wikimedia.org/wiki/File:MIAS_2025_-_All-new_Suzuki_Dzire_Hybrid_04.jpg" target="_blank" rel="noreferrer">Dzire — Ethan Llamas (CC BY-SA 4.0)</a> · <a href="https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_GX_1.5_-_Indonesia_International_Motor_Show_2018_-_Rear_view_-_April_26_2018.jpg" target="_blank" rel="noreferrer">Ertiga — Wilzz99 (CC BY-SA 4.0)</a> · <a href="https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_rear_left.jpg" target="_blank" rel="noreferrer">Innova — Premnath Kudva (CC BY-SA)</a>.</p>
          <p>Scenic editorial images (Unsplash License):
            {[luxuryMedia.hero,luxuryMedia.mountains,luxuryMedia.airport,luxuryMedia.forest,luxuryMedia.landscape].map((visual,index)=>(
              <span key={visual.src}> <a href={visual.source} target="_blank" rel="noreferrer">{visual.credit}</a>{index<4?' · ':''}</span>
            ))}
          </p>
        </div>
      </footer>

      <div className="mobile-booking-bar" role="navigation" aria-label="Quick contact">
        <a href="https://wa.me/919340098177" target="_blank" rel="noopener noreferrer" onClick={()=>logInteraction('whatsapp_click','mobile-sticky')}><MessageCircle size={17}/> WhatsApp</a>
        <a href="tel:+919340098177"><Phone size={17}/> Call</a>
        <button type="button" onClick={()=>openQuote('quote','mobile-sticky')}>Get Quote <ArrowRight size={17}/></button>
      </div>
      <div className="floating-contact">
        <a className="floating-email" href={contactEmail+'?subject='+encodeURIComponent('Travel enquiry — Mateshwari Travellers')} onClick={()=>logInteraction('email_click','floating')} aria-label="Email Mateshwari Travellers"><Mail size={18}/><span>Email</span></a>
        <WhatsappLink source="floating" label="WhatsApp us"/>
      </div>
      {quoteOpen && (
        <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setQuoteOpen(false);
        }}>
          <div className="quote-sheet">
            <button className="quote-close" type="button" aria-label="Close" onClick={() => setQuoteOpen(false)}><X size={19}/></button>

            {!quoteSubmitted ? (
              <>
                <div className="quote-head">
                  <span className="kicker">{quoteMode === 'corporate' ? 'Corporate Enquiry' : quoteMode === 'callback' ? 'Callback Request' : 'Final Quote Request'}</span>
                  <h2 id="quote-title">{quoteMode === 'callback' ? 'Tell us where to call you.' : 'Share the trip details that matter.'}</h2>
                  <p>{quoteMode === 'callback' ? 'Leave your contact details and preferred context for the call.' : 'Use your current estimate as the starting point, then add pickup, destination and travel date.'}</p>
                </div>

                <div className="quote-trip-card">
                  <div><CarFront size={18}/><span>{selected.name}</span></div>
                  <div><Users size={18}/><span>{passengers} traveler{passengers === 1 ? '' : 's'}</span></div>
                  <div><Route size={18}/><span>{estimate.chargeableKm.toLocaleString('en-IN')} km</span></div>
                  <strong>₹{estimate.minTotal.toLocaleString('en-IN')}–₹{estimate.maxTotal.toLocaleString('en-IN')}</strong>
                </div>

                <form className="quote-form" onSubmit={async (event) => {
                  event.preventDefault();
                  if (quoteSubmitting) return;
                  const data = new FormData(event.currentTarget);
                  setQuoteSubmitting(true);
                  setQuoteError('');
                  try {
                    const response = await fetch('/api/enquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        mode: quoteMode,
                        sessionId: getVisitorSession(),
                        source:quoteSource,
                        email:data.get('email'),
                        name: data.get('name'),
                        phone: data.get('phone'),
                        pickup: data.get('pickup') || '',
                        destination: data.get('destination') || '',
                        tripDate: data.get('date') || '',
                        tripType: data.get('tripType') || '',
                        notes: data.get('notes') || '',
                        vehicle: selected.name,
                        passengers,
                        days,
                        distanceKm: estimate.chargeableKm,
                        nightStay,
                        estimatedMin: estimate.minTotal,
                        estimatedMax: estimate.maxTotal,
                      }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || 'Unable to save your request.');
                    setQuoteId(result.id);
                    setQuoteDelivery(result.delivery||[]);
                    setQuoteSubmitted(true);
                  } catch (error) {
                    setQuoteError(error instanceof Error ? error.message : 'Unable to save your request. Check that the local CRM API is running.');
                  } finally {
                    setQuoteSubmitting(false);
                  }
                }}>
                  <div className="quote-fields-two">
                    <label>Name<input name="name" required placeholder="Your name" /></label>
                    <label>Phone<input name="phone" required inputMode="tel" placeholder="+91..." /></label>
                  </div>
                  <label>Email (optional)<input name="email" type="email" placeholder="you@example.com"/></label>

                  {quoteMode !== 'callback' && (
                    <>
                      <div className="quote-fields-two">
                        <label>Pickup<input name="pickup" required placeholder="Pickup city / location" /></label>
                        <label>Destination<input name="destination" required placeholder="Destination" /></label>
                      </div>
                      <div className="quote-fields-two">
                        <label>Travel date<input name="date" type="date" required /></label>
                        <label>Trip type
                          <select name="tripType" defaultValue={quoteMode === 'corporate' ? 'Corporate' : 'Outstation'}>
                            <option>Local City</option>
                            <option>Outstation</option>
                            <option>Airport</option>
                            <option>Wedding / Event</option>
                            <option>Corporate</option>
                          </select>
                        </label>
                      </div>
                    </>
                  )}

                  <label>Anything we should know?<textarea name="notes" rows={3} placeholder="Timing, luggage, stops, special requirement..." /></label>

                  {quoteError && <p className="quote-api-error" role="alert">{quoteError}</p>}
                  <div className="quote-actions">
                    <button className="primary" type="submit" disabled={quoteSubmitting}>{quoteSubmitting ? 'Saving request...' : quoteMode === 'callback' ? 'Request a Callback' : 'Send Trip Enquiry'} <ArrowRight size={16}/></button>
                    <button className="secondary" type="button" onClick={copyQuoteSummary}>{copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy Trip Summary'}</button>
                  </div>
                  <div className="quote-contact-options"><WhatsappLink source="quote-dialog" label="Or message us on WhatsApp"/><a href={contactEmail}>Email us directly</a></div>
                  <small className="quote-disclaimer">Requests are saved to your local CRM during testing. No external notifications are sent. WhatsApp opens your messaging app separately.</small>
                </form>
              </>
            ) : (
              <div className="quote-success">
                <CheckCircle2 size={42}/>
                <span className="kicker">Request Saved</span>
                <h2>Your enquiry has been recorded.</h2>
                <p>Reference: {quoteId.slice(0, 8).toUpperCase()}. The request is stored in the local CRM for staff review. No email or WhatsApp message was sent.</p>
                <div className="quote-actions">
                  <button className="primary" type="button" onClick={copyQuoteSummary}>{copied ? 'Summary Copied' : 'Copy Trip Summary'} <Copy size={16}/></button>
                  <button className="secondary" type="button" onClick={() => setQuoteOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
