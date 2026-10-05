import { useMemo, useState } from 'react';
import { ArrowRight, Calculator, CarFront, Check, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles } from 'lucide-react';

const fleet = [
  { name: 'Maruti Dzire', rate: 14, seats: '4+1', tag: 'Smart & Efficient' },
  { name: 'Maruti Ertiga', rate: 16, seats: '6+1', tag: 'Family Favourite' },
  { name: 'Toyota Innova', rate: 21, seats: '6+1', tag: 'Premium Comfort' },
  { name: 'Mahindra TUV', rate: 15, seats: '6+1', tag: 'Strong & Spacious' },
  { name: 'Mahindra Bolero', rate: 15, seats: '6+1', tag: 'Reliable Traveller' },
  { name: 'Tempo Traveller', rate: null, seats: '12+1 / 17+1', tag: 'Group Travel' },
];

export function App() {
  const [vehicle, setVehicle] = useState(fleet[1].name);
  const [km, setKm] = useState(250);
  const [days, setDays] = useState(1);
  const [nightStay, setNightStay] = useState(false);

  const selected = fleet.find((item) => item.name === vehicle) ?? fleet[1];
  const estimate = useMemo(() => {
    const hasPublishedRate = selected.rate !== null;
    const base = hasPublishedRate ? Math.max(km, days * 250) * selected.rate : null;
    const driver = nightStay ? 500 : 0;
    return { base, driver, total: base === null ? null : base + driver, hasPublishedRate };
  }, [days, km, nightStay, selected.rate]);

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top">YATISH <span>TRAVELERS</span></a>
        <nav>
          <a href="#fleet">Fleet</a>
          <a href="#services">Services</a>
          <a href="#fare">Fare Calculator</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#fare">Plan a Trip <ArrowRight size={16} /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
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
        <div className="car-stage" aria-hidden="true">
          <div className="road-glow" />
          <div className="car-silhouette">
            <div className="windshield" />
            <div className="wheel wheel-left" />
            <div className="wheel wheel-right" />
            <div className="headlight" />
          </div>
          <div className="floating-card"><span>Starting from</span><strong>₹14/km</strong></div>
        </div>
      </section>

      <section className="section" id="fleet">
        <div className="section-heading">
          <div><span className="kicker">Our Fleet</span><h2>Choose your ride.</h2></div>
          <p>Clean, comfortable vehicles for solo travel, families, business trips and long-distance journeys.</p>
        </div>
        <div className="fleet-grid">
          {fleet.map((car, index) => (
            <article className="fleet-card" key={car.name}>
              <div className="fleet-visual">
                <div className="fleet-number">0{index + 1}</div>
                <CarFront size={76} strokeWidth={1.2} />
              </div>
              <div className="fleet-meta">
                <span>{car.tag}</span>
                <h3>{car.name}</h3>
                <div className="rate">{car.rate === null ? <><strong>Custom</strong><small>quote with driver</small></> : <><strong>₹{car.rate}</strong><small>/ km with driver</small></>}</div>
                <div className="fleet-bottom"><span>{car.seats} seats</span><button onClick={() => { setVehicle(car.name); document.getElementById('fare')?.scrollIntoView({behavior:'smooth'}); }}>Calculate <ArrowRight size={15}/></button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section services" id="services">
        <div className="section-heading">
          <div><span className="kicker">Travel Your Way</span><h2>One fleet. Multiple journeys.</h2></div>
        </div>
        <div className="service-grid">
          {[
            ['Local City Travel','Point-to-point rides and hourly packages for everyday travel.'],
            ['Outstation','One-way, round-trip and multi-day intercity journeys.'],
            ['Airport Transfer','Reliable pickup and drop with scheduled reporting time.'],
            ['Wedding & Events','Coordinated vehicle support for guests, families and events.'],
          ].map(([title, text]) => <article key={title}><MapPin size={24}/><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="fare-section" id="fare">
        <div className="fare-copy">
          <span className="kicker">Trip Estimator</span>
          <h2>Know the approximate cost before you call.</h2>
          <p>Estimate includes the vehicle rate. Driver allowance is added only when a night stay is required. Toll/FASTag, parking, state permit and applicable GST are not included in the base fare and are charged separately as applicable.</p>
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
            <div><span>Vehicle estimate</span><strong>{estimate.base === null ? 'Final quote required' : `₹${estimate.base.toLocaleString('en-IN')}`}</strong></div>
            {nightStay && <div><span>Driver night-stay allowance</span><strong>₹{estimate.driver.toLocaleString('en-IN')}</strong></div>}<div><span>Toll / FASTag</span><strong>Actuals extra</strong></div><div><span>Parking / state permit</span><strong>Actuals extra</strong></div>
            <div className="total"><span>Estimated trip cost</span><strong>{estimate.total === null ? 'Contact for quote' : `₹${estimate.total.toLocaleString('en-IN')}`}</strong></div>
          </div>
          <p className="note">Minimum 250 km/day is used for this prototype estimate where a published per-km rate exists. Tempo Traveller is included in the fleet, with its final per-km commercial rate intentionally left as a custom quote until the business rate is confirmed. Driver allowance is added only for night stay. Toll/FASTag, parking and state permit charges are extra at actuals. Final commercial rules will be configurable from the backend.</p>
          <div className="calc-actions">
            <a className="primary" href="#contact"><MessageCircle size={18}/> Request Final Quote</a>
            <a className="secondary" href="tel:+910000000000"><Phone size={17}/> Call</a>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div><strong>Yatish Travelers</strong><p>Premium chauffeur-driven travel for local and outstation journeys.</p></div>
        <div><span>Booking</span><a href="#fare">Calculate Fare</a><a href="tel:+910000000000">Call us</a></div>
        <div><span>Coming next</span><p>WhatsApp integration · Real fleet imagery · SEO landing pages · Backend tracking</p></div>
      </footer>
    </main>
  );
}
