import { ArrowUpRight, CalendarDays, CarFront, CheckCircle2, MessageCircle, Route } from 'lucide-react';

export function WhyMateshwari({onQuote}:{onQuote:()=>void}){
 return <section className="confidence-section" id="why-mateshwari">
  <div className="confidence-intro">
    <span className="kicker">THE MATESHWARI APPROACH</span>
    <h2>A little more thought.<br/><em>A better journey.</em></h2>
    <p>Great travel experiences are built on thoughtful planning, clear conversations and the right vehicle for the occasion.</p>
    <button type="button" onClick={onQuote}>Let's plan your trip <ArrowUpRight size={18}/></button>
  </div>
  <div className="confidence-grid">
    <article><span className="confidence-num">01 / BEFORE YOU GO</span><span className="confidence-icon"><MessageCircle size={24}/></span>
      <h3>Tell us the journey.</h3><p>Share your pickup, destination, preferred date and passenger count. We'll understand what you need before proposing a vehicle.</p>
      <span className="confidence-foot">PERSONAL TRIP PLANNING <ArrowUpRight size={15}/></span></article>
    <article><span className="confidence-num">02 / THE RIGHT FIT</span><span className="confidence-icon"><CarFront size={24}/></span>
      <h3>Choose with confidence.</h3><p>Compare sedans, family MPVs, SUVs and group vehicles. Indicative pricing is shown openly; final availability and fare are confirmed before booking.</p>
      <span className="confidence-foot">FLEET & FARE CLARITY <ArrowUpRight size={15}/></span></article>
    <article><span className="confidence-num">03 / THE PLAN</span><span className="confidence-icon"><Route size={24}/></span>
      <h3>Know what's next.</h3><p>Discuss travel timing, stops and any special requirements. A clear conversation makes it easier to coordinate a smooth journey.</p>
      <span className="confidence-foot">COORDINATED JOURNEYS <ArrowUpRight size={15}/></span></article>
  </div>
  <div className="confidence-ribbon"><span><CalendarDays size={16}/> Flexible trip requirements</span><span><CheckCircle2 size={16}/> Indicative fares explained</span><span><CarFront size={16}/> Vehicle suitability first</span></div>
 </section>;
}
