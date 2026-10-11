import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { PaintTone, StudioMood } from './Real3DVehicle';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MoveUpRight, RotateCw, Sun, Moon, MousePointer2 } from 'lucide-react';

const Real3DVehicle=lazy(()=>import('./Real3DVehicle').then(m=>({default:m.Real3DVehicle})));
const tones: {id:PaintTone;name:string;color:string}[]=[{id:'champagne',name:'Champagne',color:'#b69b74'},{id:'pearl',name:'Pearl',color:'#e6e3db'},{id:'obsidian',name:'Obsidian',color:'#1a2726'},{id:'forest',name:'Forest',color:'#294e3f'}];

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
  const [paint,setPaint]=useState<PaintTone>('champagne');
  const [mood,setMood]=useState<StudioMood>('daylight');
  const [webglUnavailable,setWebglUnavailable]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  const active = vehicles[activeIndex] ?? vehicles[0];
  const photographs = active ? [active.image,...(active.gallery||[])] : [];
  useEffect(()=>{setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);},[]);

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
            <h2>Choose the journey. <em>Feel the difference.</em></h2>
            <p>Enter our interactive design studio: rotate a real 3D vehicle concept, change its finish, switch the lighting and explore different body styles. Then pick the actual vehicle for your journey.</p>
            <div className="cinema-selected-details" key={active.name + '-details'}>
              <span>NOW SHOWING</span>
              <h3>{active.name}</h3>
              <p>{active.tag} <b>·</b> {active.seats} seats <b>·</b> {active.category}</p>
              <small className="cinema-disclaimer">3D model is an illustrative body style, not an exact render of this vehicle.</small>
            </div>
            <div className="studio-controls" aria-label="3D studio controls">
              <div className="studio-paints" role="group" aria-label="Change model color">
                <span>01 / PAINT FINISH</span>
                <div>{tones.map(t=><button key={t.id} type="button" onClick={()=>setPaint(t.id)}
                  className={paint===t.id?'selected':''} aria-pressed={paint===t.id}
                  aria-label={t.name+' paint'} title={t.name} style={{'--paint':t.color} as React.CSSProperties}/>)}</div>
              </div>
              <div className="studio-moods" role="group" aria-label="Change studio lighting">
                <span>02 / LIGHTING</span>
                <button type="button" className={mood==='daylight'?'active':''} aria-pressed={mood==='daylight'} onClick={()=>setMood('daylight')}><Sun size={16}/> Daylight</button>
                <button type="button" className={mood==='golden-hour'?'active':''} aria-pressed={mood==='golden-hour'} onClick={()=>setMood('golden-hour')}><Moon size={16}/> Sunset</button>
              </div>
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
            <div className="cinema-webgl-stage">
              {!reducedMotion && !webglUnavailable ? (
                <Suspense fallback={<div className="studio-loading">LOADING LIVE 3D EXPERIENCE</div>}>
                  <Real3DVehicle category={active.category} paint={paint} mood={mood} progress={progress}
                    onUnavailable={()=>setWebglUnavailable(true)}/>
                </Suspense>
              ) : <img className="studio-static-fallback" src={active.image} alt={active.name} loading="lazy"/>}
              <div className="studio-drag-hint"><MousePointer2 size={14}/>{webglUnavailable?'PHOTO PREVIEW':reducedMotion?'REDUCED MOTION MODE':'DRAG THE VEHICLE TO ROTATE'}</div>
            </div>
            <div className="cinema-photo-angles">
              <span>REAL VEHICLE REFERENCE</span>
              <button type="button" className="cinema-angle-photo"
                onClick={()=>setAngle(n=>(n+1)%photographs.length)}
                aria-label="Change reference vehicle photo"><img src={photographs[angle%photographs.length]||active.image} alt={active.name+' / reference angle '+(angle+1)} loading="lazy"/>
                <span><RotateCw size={13}/> Reference {angle+1}/{photographs.length}</span>
              </button>
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
