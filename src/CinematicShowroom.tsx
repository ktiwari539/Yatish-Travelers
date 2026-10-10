import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MoveUpRight } from 'lucide-react';

export type ShowroomVehicle = {
  name: string;
  image: string;
  seats: string;
  tag: string;
  category: string;
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
  const active = vehicles[activeIndex] ?? vehicles[0];

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

          <div className="cinema-stage" aria-label={'Featured vehicle: ' + active.name}>
            <div className="cinema-stage-halo" />
            <span className="cinema-stage-stamp">ENGINEERED FOR THE OPEN ROAD</span>
            <div className="cinema-ghost cinema-ghost-back" aria-hidden="true">
              <img src={vehicles[(activeIndex + vehicles.length - 1) % vehicles.length].image} alt="" />
            </div>
            <div className="cinema-ghost cinema-ghost-front" aria-hidden="true">
              <img src={vehicles[(activeIndex + 1) % vehicles.length].image} alt="" />
            </div>
            <div className="cinema-vehicle" key={active.name}>
              <img src={active.image} alt={active.name + ' vehicle photography'} loading="lazy"/>
              <div className="cinema-vehicle-sheen" />
              <span>YOUR NEXT JOURNEY <ArrowRight size={15}/></span>
            </div>
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
