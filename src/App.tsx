import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Calculator, CarFront, Check, CheckCircle2, Copy, MapPin, MessageCircle, Phone, Plane, Route, ShieldCheck, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';

type FleetVehicle = {
  name: string;
  seats: string;
  tag: string;
  category: string;
  image: string;
  imageSource: string;
  imageCredit: string;
  license: string;
};

const commonsImage = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=1600`;

const fleet: FleetVehicle[] = [
  {
    name: 'Maruti Dzire',
    seats: '4+1',
    tag: 'Smart & Efficient',
    category: 'Sedan',
    image: commonsImage('Suzuki%20Dzire%20II%201.2%20GLX%20Hybrid%20Arctic%20White%20Pearl.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg',
    imageCredit: 'Ethan Llamas',
    license: 'CC BY-SA 4.0',
  },
  {
    name: 'Maruti Ertiga',
    seats: '6+1',
    tag: 'Family Favourite',
    category: 'MPV',
    image: commonsImage('Suzuki%20Ertiga%20%28Front%29%2C%20Jakarta%2C%20Indonesia.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_(Front),_Jakarta,_Indonesia.jpg',
    imageCredit: 'RichardSummersault',
    license: 'CC0 1.0',
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
    tag: 'Reliable Traveller',
    category: 'SUV',
    image: commonsImage('Mahindra%20Bolero%20ZLX.jpg'),
    imageSource: 'https://commons.wikimedia.org/wiki/File:Mahindra_Bolero_ZLX.jpg',
    imageCredit: 'RaNK001',
    license: 'CC BY-SA 3.0',
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
  'Tempo Traveller': { capacity: 17, useCases: ['Group', 'Business'], priority: 3 },
};

const fleetFilters = ['All', 'Family', 'Premium', 'Group', 'Business'] as const;
type FleetFilter = typeof fleetFilters[number];
type QuoteMode = 'quote' | 'callback' | 'corporate';


function StoriesPage() {
  const storySlots = [
    { title: 'Family Journeys', text: 'Road-trip photos and verified family travel experiences will live here.', car: fleet[1] },
    { title: 'Airport & Business', text: 'Approved airport and corporate travel stories can be published here.', car: fleet[2] },
    { title: 'Group Adventures', text: 'Tempo Traveller and group-tour memories can be shared after moderation.', car: fleet[5] },
  ];

  return (
    <main className="stories-page">
      <header className="stories-nav">
        <a className="brand" href="/">YATISH <span>TRAVELERS</span></a>
        <a className="secondary" href="/">Back to Home <ArrowRight size={16} /></a>
      </header>

      <section className="stories-hero">
        <div className="stories-hero-glow" />
        <span className="kicker">Stories from the Road</span>
        <h1>Every trip has a story worth keeping.</h1>
        <p>
          A dedicated space for real customer journeys, travel photos and verified feedback.
          Every story is reviewed before it appears publicly.
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
              <img src={story.car.image} alt={story.car.name} />
              <div className="story-feature-shade" />
              <span>0{index + 1}</span>
            </div>
            <div className="story-feature-copy">
              <small>Customer journey</small>
              <h2>{story.title}</h2>
              <p>{story.text}</p>
              <strong>Verified stories will appear here</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="story-submit" id="share-story">
        <div>
          <span className="kicker">Share Your Journey</span>
          <h2>Share the moments that made your journey memorable.</h2>
          <p>
            Add your trip details, a short story and photos. Your submission stays private until it has been reviewed by Yatish Travelers.
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
        <div><strong>Yatish Travelers</strong><p>Real journeys. Verified stories. Premium travel.</p></div>
        <div><a href="/">Home</a><a href="/#fleet">Fleet</a><a href="/#contact">Contact</a></div>
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
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('quote');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const journeyRef = useRef<HTMLElement | null>(null);

  const selected = fleet.find((item) => item.name === vehicle) ?? fleet[1];
  const heroVehicle = fleet[2];

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

  useEffect(() => {
    const section = journeyRef.current;
    if (!section) return;

    let frame = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      section.style.setProperty('--journey-progress', progress.toFixed(3));
      section.dataset.step = progress < 0.34 ? '1' : progress < 0.68 ? '2' : '3';
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const estimate = useMemo(() => {
    const chargeableKm = Math.max(km, days * 250);
    const minBase = chargeableKm * indicativePricing.minRate;
    const maxBase = chargeableKm * indicativePricing.maxRate;
    const driver = nightStay ? 500 : 0;
    return {
      chargeableKm,
      minBase,
      maxBase,
      driver,
      minTotal: minBase + driver,
      maxTotal: maxBase + driver,
    };
  }, [days, km, nightStay]);

  const filteredFleet = useMemo(() => {
    const filtered = fleet.filter((car) => (
      fleetFilter === 'All' || vehicleProfiles[car.name].useCases.includes(fleetFilter)
    ));

    return [...filtered].sort((a, b) => {
      const aProfile = vehicleProfiles[a.name];
      const bProfile = vehicleProfiles[b.name];

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
  }, [fleetFilter, fleetSort, passengers]);

  const openQuote = (mode: QuoteMode = 'quote') => {
    setQuoteMode(mode);
    setQuoteSubmitted(false);
    setCopied(false);
    setQuoteOpen(true);
  };

  const quoteSummary = `Yatish Travelers enquiry
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

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top">YATISH <span>TRAVELERS</span></a>
        <nav>
          <a href="#fleet">Fleet</a>
          <a href="#services">Services</a>
          <a href="#corporate">Corporate</a>
          <a href="#fare">Fare Calculator</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#fare">Plan a Trip <ArrowRight size={16} /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-ambient" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> Chauffeur-driven travel, done right.</div>
          <h1>Every journey should feel <em>effortless.</em></h1>
          <p>Local rides, outstation trips, airport transfers and multi-day travel with transparent pricing and trusted drivers.</p>
          <div className="hero-actions">
            <a className="primary" href="#fare"><Calculator size={18} /> Calculate Fare</a>
            <a className="secondary" href="#fleet">Explore Fleet</a>
          </div>
          <div className="trust-row">
            <span><Check size={16}/> Transparent per-km pricing</span>
            <span><ShieldCheck size={16}/> Verified drivers</span>
            <span><MessageCircle size={16}/> Quick WhatsApp booking</span>
          </div>
        </div>

        <div className="car-stage">
          <div className="road-lines" aria-hidden="true"><span/><span/><span/></div>
          <div className="hero-car-frame hero-poster">
            <img
              className="hero-car-image"
              src={heroVehicle.image}
              alt="Toyota Innova Crysta"
              fetchPriority="high"
            />
            <div className="hero-car-shade" />
            <div className="poster-corner" aria-hidden="true"><span>01</span><strong>Signature journeys</strong></div>
            <div className="hero-car-label">
              <span>Premium Fleet</span>
              <strong>{heroVehicle.name}</strong>
              <small>{heroVehicle.seats} seats · {heroVehicle.category}</small>
            </div>
          </div>
          <div className="floating-card">
            <span>Indicative fares</span>
            <strong>₹15–₹25/km</strong>
            <small>Final fare confirmed before booking</small>
          </div>
          <div className="motion-pill"><span/> Designed around the journey.</div>
          <div className="hero-scroll-cue" aria-hidden="true"><span>Scroll to explore</span><i /></div>
        </div>
      </section>

      <section className="signature-strip reveal-3d" aria-label="Yatish Travelers service highlights">
        <div><small>01</small><strong>Chauffeur Included</strong><span>Professional driver-led travel</span></div>
        <div><small>02</small><strong>Flexible Journeys</strong><span>Local, airport and outstation</span></div>
        <div><small>03</small><strong>Right-Sized Fleet</strong><span>From sedans to group travelers</span></div>
        <div><small>04</small><strong>Clear Quotations</strong><span>Know the major charges before travel</span></div>
      </section>

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
          {filteredFleet.map((car, index) => (
            <article className="fleet-card" key={car.name} style={{ animationDelay: `${index * 90}ms` }}>
              <div className="fleet-visual">
                <img src={car.image} alt={car.name} loading="lazy" decoding="async" />
                <div className="fleet-shade" />
                <div className="fleet-number">0{index + 1}</div>
                <span className="fleet-type">{car.category}</span>
              </div>
              <div className="fleet-meta">
                <span>{car.tag}</span>
                <h3>{car.name}</h3>
                <div className="rate"><strong>₹15–₹25</strong><small>/ km indicative range</small></div>
                <div className="fleet-bottom">
                  <span>{car.seats} seats · {car.category}</span>
                  <button onClick={() => { setVehicle(car.name); document.getElementById('fare')?.scrollIntoView({behavior:'smooth'}); }}>
                    Estimate <ArrowRight size={15}/>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section services reveal-3d" id="services">
        <div className="section-heading">
          <div><span className="kicker">Travel Your Way</span><h2>One fleet. Multiple journeys.</h2></div>
        </div>
        <div className="service-grid">
          {[
            { title: 'Local City Travel', text: 'Point-to-point rides and flexible city packages for everyday movement.', icon: <MapPin size={24}/>, meta: 'City rides' },
            { title: 'Outstation', text: 'One-way, round-trip and multi-day intercity journeys with planned stops.', icon: <Route size={24}/>, meta: 'Intercity' },
            { title: 'Airport Transfer', text: 'Scheduled pickups and drops with room for flight-time coordination.', icon: <Plane size={24}/>, meta: 'Airport' },
            { title: 'Wedding & Events', text: 'Coordinated guest, family and event transport with the right fleet mix.', icon: <Users size={24}/>, meta: 'Events' },
          ].map((item) => (
            <article key={item.title}>
              <div className="service-icon">{item.icon}</div>
              <small>{item.meta}</small>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <button type="button" onClick={() => openQuote('quote')}>Plan this trip <ArrowRight size={14}/></button>
            </article>
          ))}
        </div>
      </section>


      <section className="fleet-reel-section reveal-3d" id="reels">
        <div className="fleet-reel-heading">
          <div>
            <span className="kicker">Car Reels</span>
            <h2>Our fleet, always in motion.</h2>
          </div>
          <p>
            A continuous cinematic reel of the vehicles available across our travel categories.
            A curated moving showcase of sedans, MPVs, SUVs and group-travel vehicles.
          </p>
        </div>

        <div className="fleet-reel-mask">
          <div className="fleet-reel-track">
            {[...fleet, ...fleet].map((car, index) => (
              <article className="reel-card" key={`${car.name}-${index}`} aria-hidden={index >= fleet.length}>
                <img src={car.image} alt={index < fleet.length ? car.name : ''} loading="lazy" />
                <div className="reel-card-shade" />
                <div className="reel-card-copy">
                  <small>{car.category}</small>
                  <strong>{car.name}</strong>
                  <span>{car.seats} seats</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="fleet-reel-footer">
          <span>Dzire · Ertiga · Innova · TUV · Bolero · Tempo Traveller</span>
          <a href="#fleet">Explore fleet details <ArrowRight size={15}/></a>
        </div>
      </section>

      <section ref={journeyRef} className="journey-motion" aria-label="Interactive journey animation">
        <div className="journey-sticky">
          <div className="journey-copy">
            <span className="kicker">A Journey in Motion</span>
            <h2>Scroll the road. Feel the depth.</h2>
            <p>This section reacts directly to your scroll — the vehicle moves from the horizon into the foreground while the route progresses with it.</p>

            <div className="journey-steps">
              <div className="journey-step step-one"><small>01</small><strong>Choose</strong><span>Match the right vehicle to your trip.</span></div>
              <div className="journey-step step-two"><small>02</small><strong>Confirm</strong><span>Review route, timing and major charges.</span></div>
              <div className="journey-step step-three"><small>03</small><strong>Travel</strong><span>Your chauffeur-led journey begins.</span></div>
            </div>
          </div>

          <div className="journey-world" aria-hidden="true">
            <div className="journey-sun" />
            <div className="journey-mountain mountain-a" />
            <div className="journey-mountain mountain-b" />
            <div className="journey-road">
              <i/><i/><i/><i/><i/>
            </div>
            <div className="journey-route route-a"><MapPin size={15}/><span>Pickup</span></div>
            <div className="journey-route route-b"><Route size={15}/><span>On the road</span></div>
            <div className="journey-route route-c"><CheckCircle2 size={15}/><span>Arrive</span></div>
            <div className="journey-vehicle">
              <img src={fleet[2].image} alt="" />
            </div>
            <div className="journey-shadow" />
          </div>

          <div className="journey-progress"><span/></div>
        </div>
      </section>

      <section className="corporate-section reveal-3d" id="corporate">
        <div className="corporate-orbit corporate-orbit-one" aria-hidden="true" />
        <div className="corporate-orbit corporate-orbit-two" aria-hidden="true" />
        <div className="corporate-copy">
          <span className="kicker">Corporate Mobility</span>
          <h2>One travel partner for your teams, guests and business journeys.</h2>
          <p>
            From daily business movement to airport pickups, executive travel, events and multi-city requirements,
            Yatish Travelers can coordinate corporate transport based on fleet and city availability.
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

      <section className="fare-section reveal-3d" id="fare">
        <div className="fare-copy">
          <span className="kicker">Trip Estimator</span>
          <h2>Know the approximate cost before you call.</h2>
          <p>Use the estimator for an indicative ₹15–₹25/km range. Final pricing can vary by vehicle, route, trip duration and travel requirements. Driver allowance is added only when a night stay is required. Toll/FASTag, parking, state permit and applicable GST are charged separately as applicable.</p>
          <div className="selected-vehicle">
            <div className="selected-vehicle-image"><img src={selected.image} alt="" /></div>
            <div><span>Selected vehicle</span><strong>{selected.name}</strong><small>{selected.seats} · {selected.category}</small></div>
          </div>
        </div>

        <div className="calculator">
          <label>Vehicle
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              {fleet.map((car) => <option key={car.name}>{car.name}</option>)}
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
          <p className="note">This estimate currently uses a 250 km/day minimum. The ₹15–₹25/km band is indicative only; your final quote is confirmed before booking. Driver allowance is added only for night stay. Toll/FASTag, parking and state permit charges are extra at actuals.</p>
          <div className="calc-actions">
            <button className="primary" type="button" onClick={() => openQuote('quote')}><MessageCircle size={18}/> Request Final Quote</button>
            <button className="secondary" type="button" onClick={() => openQuote('callback')}><Phone size={17}/> Request Callback</button>
          </div>
        </div>
      </section>


      <section className="stories-teaser reveal-3d" id="stories">
        <div className="stories-teaser-copy">
          <span className="kicker">Stories from the Road</span>
          <h2>Real journeys deserve more than a small review card.</h2>
          <p>
            Customer photos, memorable routes and verified feedback have their own space — so the people behind the journeys never feel like an afterthought.
          </p>
          <a className="primary" href="/stories">Explore Stories <ArrowRight size={17}/></a>
        </div>

        <div className="stories-teaser-stack" aria-hidden="true">
          {fleet.slice(1, 4).map((car, index) => (
            <article className={`story-stack-card story-stack-${index + 1}`} key={car.name}>
              <img src={car.image} alt="" />
              <div>
                <small>On the road</small>
                <strong>{car.name}</strong>
                <span>Real customer journeys</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact">
        <div><strong>Yatish Travelers</strong><p>Premium chauffeur-driven travel for local and outstation journeys.</p></div>
        <div><span>Booking</span><a href="#fare">Calculate Fare</a><a href="/stories">Stories from the Road</a><button className="footer-action" type="button" onClick={() => openQuote('callback')}>Request a callback</button></div>
        <div><span>Travel</span><p>Local city rides · Outstation trips · Airport transfers · Family journeys · Corporate mobility</p></div>
        <div className="image-credits">
          <span>Image credits</span>
          <p>
            {fleet.map((car, index) => (
              <span key={car.name}>
                <a href={car.imageSource} target="_blank" rel="noreferrer">{car.name}: {car.imageCredit} ({car.license})</a>
                {index < fleet.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </div>
      </footer>

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

                <form className="quote-form" onSubmit={(event) => {
                  event.preventDefault();
                  setQuoteSubmitted(true);
                }}>
                  <div className="quote-fields-two">
                    <label>Name<input name="name" required placeholder="Your name" /></label>
                    <label>Phone<input name="phone" required inputMode="tel" placeholder="+91..." /></label>
                  </div>

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

                  <div className="quote-actions">
                    <button className="primary" type="submit">{quoteMode === 'callback' ? 'Prepare Callback Request' : 'Prepare Trip Request'} <ArrowRight size={16}/></button>
                    <button className="secondary" type="button" onClick={copyQuoteSummary}>{copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy Trip Summary'}</button>
                  </div>
                  <small className="quote-disclaimer">Local preview: the interaction is complete, but external delivery is intentionally not enabled yet.</small>
                </form>
              </>
            ) : (
              <div className="quote-success">
                <CheckCircle2 size={42}/>
                <span className="kicker">Request Prepared</span>
                <h2>Your trip details are ready.</h2>
                <p>You can copy the trip summary during local review. External submission will be connected when the booking channel is finalized.</p>
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
