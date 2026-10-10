import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MoveUpRight, RotateCw } from 'lucide-react';

export type ShowroomVehicle = {
  name: string;
  image: string;
  seats: string;
  tag: string;
  category: string;
  gallery?:string[];
};

type Props = {
  vehicles: ShowroomVehicle[];
  onExplore: (name: string) => void;
};

export function CinematicShowroom({ vehicles, onExplore }: Props) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const priorScrollProgress = useRef(0);
  const [activeIndex, setActiveIndex] = useState(1);
  const [progress, setProgress] = useState(0);
  const [soundless, setSoundless] = useState(true);
  const [angle,setAngle]=useState(0);
  const active = vehicles[activeIndex] ?? vehicles[0];
  const photographs = active ? [active.image,...(active.gallery||[])] : [];

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let frame = 0;
    const update = () => {
      const bounds = scene.getBoundingClientRect();
      const available = Math.max(1, bounds.height - window.innerHeight);
      const next = Math.max(0, Math.min(1, -bounds.top / available));
      scene.style.setProperty('--cinema-progress', String(next.toFixed(4)));
      setProgress((previous) => Math.abs(previous - next) > 0.012 ? next : previous);
      if (Math.abs(next - priorScrollProgress.current) > 0.022) {
        const step = Math.min(vehicles.length - 1, Math.floor(next * vehicles.length));
        setActiveIndex(step);
        priorScrollProgress.current = next;
      }
      frame = 0;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [vehicles]);

  const choose = (index: number) => {
    setActiveIndex((index + vehicles.length) % vehicles.length);
    setSoundless(false);
    priorScrollProgress.current = progress;
  };
  useEffect(()=>{setAngle(0);},[active?.name]);
  const next = () => choose(activeIndex + 1);
  const previous = () => choose(activeIndex - 1);

  return (
    <section className="cinema-section" ref={sceneRef} id="showroom" aria-label="Interactive vehicle showroom">
      <div className="cinema-sticky">
        <div className="cinema-grain" aria-hidden="true" />
        <div className="cinema-light cinema-light-left" aria-hidden="true" />
        <div className="cinema-light cinema-light-right" aria-hidden="true" />
        <div className="cinema-topline">
          <span><i /> MATESHWARI / MOTION STUDIO</span>
          <span>AN INTERACTIVE FLEET EXPERIENCE <Compass size={15}/></span>
        </div>

        <div className="cinema-grid">
          <div className="cinema-copy">
            <div className="cinema-kicker"><span>0{activeIndex + 1} / 0{vehicles.length}</span><span>THE ART OF ARRIVING</span></div>
            <h2 key={active.name}>The journey looks <em>better from here.</em></h2>
            <p>Family escapes. Executive arrivals. Group adventures. Explore the vehicle that fits your journey, without losing the feeling of the road.</p>
            <div className="cinema-selected-details" key={active.name + '-details'}>
              <span>NOW SHOWING</span>
              <h3>{active.name}</h3>
              <p>{active.tag} <b>·</b> {active.seats} seats <b>·</b> {active.category}</p>
            </div>
            <div className="cinema-cta-row">
              <button type="button" className="cinema-explore" onClick={() => onExplore(active.name)}>
                Plan with this vehicle <MoveUpRight size={17}/>
              </button>
              <div className="cinema-arrows">
                <button type="button" aria-label="Previous vehicle" onClick={previous}><ChevronLeft size={21}/></button>
                <button type="button" aria-label="Next vehicle" onClick={next}><ChevronRight size={21}/></button>
              </div>
            </div>
          </div>

          <div className="cinema-stage" aria-label={'Featured vehicle: ' + active.name}
            onPointerMove={(event)=>{
              if(event.pointerType==='touch')return;
              const bounds=event.currentTarget.getBoundingClientRect();
              const x=(event.clientX-bounds.left)/bounds.width-.5;
              const y=(event.clientY-bounds.top)/bounds.height-.5;
              event.currentTarget.style.setProperty('--pointer-x',String(x.toFixed(3)));
              event.currentTarget.style.setProperty('--pointer-y',String(y.toFixed(3)));
            }}
            onPointerLeave={(event)=>{
              event.currentTarget.style.setProperty('--pointer-x','0');
              event.currentTarget.style.setProperty('--pointer-y','0');
            }}>
            <div className="cinema-stage-halo" />
            <span className="cinema-stage-stamp">ENGINEERED FOR THE OPEN ROAD</span>
            <div className="cinema-ghost cinema-ghost-back" aria-hidden="true">
              <img src={vehicles[(activeIndex + vehicles.length - 1) % vehicles.length].image} alt="" />
            </div>
            <div className="cinema-ghost cinema-ghost-front" aria-hidden="true">
              <img src={vehicles[(activeIndex + 1) % vehicles.length].image} alt="" />
            </div>
            <div className="cinema-vehicle" key={active.name+'-'+angle}>
              <img src={photographs[angle%photographs.length]||active.image} alt={active.name + ' / angle '+(angle+1)} loading="lazy"/>
              <div className="cinema-vehicle-sheen" />
              <span>YOUR NEXT JOURNEY <ArrowRight size={15}/></span>
            </div>
            {photographs.length>1&&<button className="cinema-angle" type="button" onClick={()=>setAngle(n=>(n+1)%photographs.length)} aria-label="View another angle of this vehicle"><RotateCw size={15}/> View angle {angle+1}/{photographs.length}</button>}
            <div className="cinema-stage-track"><span /></div>
            <span className="cinema-stage-counter">0{activeIndex + 1} <i /> {vehicles.length.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="cinema-bottom">
          <div className="cinema-choices" role="group" aria-label="Choose a vehicle">
            {vehicles.map((car, index) => (
              <button
                key={car.name}
                type="button"
                className={index === activeIndex ? 'cinema-choice is-selected' : 'cinema-choice'}
                aria-pressed={index === activeIndex}
                onClick={() => choose(index)}
              >
                <span>0{index + 1}</span>
                <strong>{car.name}</strong>
              </button>
            ))}
          </div>
          <div className="cinema-scroll-hint">
            <span>{soundless ? 'SCROLL TO CHANGE THE SCENE' : 'EXPLORE ALL VEHICLES'}</span>
            <div><i style={{ width: String(Math.max(8, progress * 100)) + '%' }}/></div>
          </div>
        </div>
      </div>
    </section>
  );
}
