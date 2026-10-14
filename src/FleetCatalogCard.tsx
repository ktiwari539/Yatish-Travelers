import { ArrowRight, ArrowUpRight, CarFront, Users } from 'lucide-react';
import type { FleetReelVehicle } from './PremiumFleetExperience';

/** Clean, text-first comparison: low-quality editorial street photos should
 * not compete with the reviewed vehicle spotlight. All models stay available,
 * with real photographs one click away when they pass their privacy gate. */
export function FleetCatalogCard({car,index,onEstimate,onExplore}:{
 car:FleetReelVehicle;index:number;onEstimate:()=>void;onExplore?:()=>void
}){
 return <article className="fleet-card premium-catalog-card fleet-atelier-row" data-model={car.name}>
  <div className="fleet-atelier-row-mark" aria-hidden="true">
    <span>{String(index+1).padStart(2,'0')}</span><CarFront size={28} strokeWidth={1.4}/>
  </div>
  <div className="fleet-atelier-row-content">
    <div className="fleet-atelier-row-head"><span>{car.category}</span><strong>{car.tag}</strong></div>
    <h3>{car.name}</h3>
    <div className="fleet-atelier-row-data">
      <span><Users size={14}/> {car.seats} seats</span>
      <span><b>₹{car.rateMin??15}–₹{car.rateMax??25}</b> / km indicative</span>
    </div>
    <div className="fleet-atelier-row-actions">
      {onExplore&&<button type="button" onClick={onExplore}
        aria-label={'Open full-screen car studio for '+car.name}>
        View photos <ArrowUpRight size={16}/>
      </button>}
      <button type="button" onClick={onEstimate}>Estimate fare <ArrowRight size={15}/></button>
    </div>
  </div>
 </article>;
}
