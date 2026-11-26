import { ArrowRight, CarFront, MapPin, Phone, Plane, Route, Users } from 'lucide-react';
import { ScenicImage } from './ScenicImage';
import { luxuryMedia } from './luxuryMedia';
import type { SiteContent } from './siteContent';

export function JabalpurCarRentalPage({media}:{media:SiteContent['media']}){
  const visual=media.jabalpurHero;
  return <main className="jabalpur-page">
    <header className="jabalpur-nav">
      <a href="/" className="jabalpur-brand">MATESHWARI <span>TRAVELLERS</span></a>
      <a href="/#fare">Request a quote <ArrowRight size={17}/></a>
    </header>
    <section className="jabalpur-hero">
      <ScenicImage src={visual.imageUrl||luxuryMedia.landscape.src} fallback={luxuryMedia.landscape.fallback||luxuryMedia.forest.src} alt={visual.alt||luxuryMedia.landscape.alt} loading="eager"/>
      <div className="jabalpur-hero-shade"/>
      <div className="jabalpur-hero-copy">
        <span className="jabalpur-eyebrow"><MapPin size={16}/> JABALPUR · MADHYA PRADESH</span>
        <h1>Car rental enquiries in Jabalpur</h1>
        <p>Compare chauffeur-driven vehicle options for local travel, airport pickups, outstation trips and group journeys around Jabalpur. Tell us what you need; availability and your final fare are confirmed before booking.</p>
        <div className="jabalpur-actions"><a className="jabalpur-primary" href="/#fare">Plan a trip <ArrowRight size={18}/></a><a href="tel:+919340098177"><Phone size={17}/> Call +91 93400 98177</a></div>
      </div>
    </section>
    <section className="jabalpur-services" aria-labelledby="jabalpur-services-title">
      <div className="jabalpur-heading"><span>JABALPUR TRAVEL OPTIONS</span><h2 id="jabalpur-services-title">Find the right vehicle for your route.</h2><p>Share your pickup location, date, passenger count and luggage needs. Mateshwari Travellers can review requests for these travel types, subject to fleet and route availability.</p></div>
      <div className="jabalpur-service-grid">
        <article><CarFront size={25}/><h3>Local trips</h3><p>Request a sedan, MPV or SUV for city travel and local requirements around Jabalpur. Pickup availability is confirmed individually.</p></article>
        <article><Plane size={25}/><h3>Airport transfers</h3><p>Enquire about Jabalpur airport pickup or drop-off with advance travel timing and luggage details.</p></article>
        <article><Route size={25}/><h3>Outstation journeys</h3><p>Discuss one-way, return and multi-day journeys starting from or travelling to Jabalpur and other destinations in Madhya Pradesh.</p></article>
        <article><Users size={25}/><h3>Family and group travel</h3><p>Compare family-size vehicles and Tempo Traveller options, then request a suitable quotation for your group.</p></article>
      </div>
    </section>
    <section className="jabalpur-planning">
      <div><span>HOW BOOKING ENQUIRIES WORK</span><h2>Simple planning. No customer login.</h2><p>Choose a vehicle, provide your route and travel date, and send an enquiry. Our team will check suitability, availability and the final price. An enquiry is not a confirmed booking.</p></div>
      <div className="jabalpur-planning-actions"><a href="/#fleet">Compare the fleet <ArrowRight size={17}/></a><a href="/#fare">Get an indicative estimate <ArrowRight size={17}/></a><a href="https://wa.me/919340098177" target="_blank" rel="noopener noreferrer">Ask on WhatsApp <ArrowRight size={17}/></a></div>
    </section>
    <section className="jabalpur-faq" aria-labelledby="jabalpur-faq-title">
      <h2 id="jabalpur-faq-title">Planning travel from Jabalpur?</h2>
      <h3>Do you guarantee a particular vehicle for pickup in Jabalpur?</h3><p>No. Each request depends on the date, route and actual vehicle availability. The vehicle and final fare are confirmed before any booking.</p>
      <h3>Can I request an outstation or airport trip?</h3><p>Yes. Share your pickup, destination, passenger count and timing through the enquiry form. Our team will review the request.</p>
      <h3>Is an account required?</h3><p>No account or Gmail sign-in is needed. The website uses a guest enquiry flow.</p>
    </section>
    <footer className="jabalpur-footer"><a href="/">Mateshwari Travellers home</a><a href="/#contact">Contact our team</a><span>Jabalpur service enquiries are subject to availability; no Jabalpur storefront address is claimed.</span></footer>
  </main>;
}
