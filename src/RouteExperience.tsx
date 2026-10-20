import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Compass, MapPin, Mountain, Plane, Building2, PartyPopper, RotateCcw } from 'lucide-react';

type TripType='mountains'|'heritage'|'airport'|'events';
type Props={onPlan:(suggestion:TripType)=>void};
const experiences:{
 id:TripType;label:string;index:string;from:string;to:string;title:string;sub:string;
 description:string;chip:string;dist:string;accent:string
}[]=[
 {id:'mountains',label:'Hill escapes',index:'01',from:'CITY LIGHTS',to:'THE MOUNTAINS',title:'The long way to extraordinary.',sub:'HILL STATIONS & WEEKEND ESCAPES',
  description:'Open windows. Winding roads. A planned journey into cooler air and quieter moments.',chip:'Best with an SUV or MPV',dist:'Curated round trip',accent:'#eac79d'},
 {id:'heritage',label:'Heritage tours',index:'02',from:'YOUR CITY',to:'HERITAGE TRAILS',title:'Discover the stories between cities.',sub:'PALACES, LAKES & CULTURE',
  description:'Take the scenic route with comfortable stops and a thoughtful travel schedule.',chip:'Best with a sedan or MPV',dist:'Scenic journey',accent:'#e9baa6'},
 {id:'airport',label:'Airport rides',index:'03',from:'YOUR DOOR',to:'THE TERMINAL',title:'A quieter way to catch a flight.',sub:'AIRPORT PICKUP & DROP',
  description:'A composed and well-planned transfer, designed around your departure and arrival.',chip:'Best with a sedan',dist:'Scheduled pickup',accent:'#c1dece'},
 {id:'events',label:'Groups & events',index:'04',from:'PICKUP HUB',to:'THE OCCASION',title:'Make room for everyone.',sub:'EVENTS & GROUP MOBILITY',
  description:'One coordinated plan for group journeys, celebrations, and important gatherings.',chip:'Best with a Traveller',dist:'Group coordination',accent:'#d1c6ed'}
];

export function RouteExperience({onPlan}:Props){
 const [active,setActive]=useState<TripType>('mountains');
 const [reverse,setReverse]=useState(false);
 const [direction,setDirection]=useState(1);
 const shell=useRef<HTMLDivElement|null>(null);
 const current=experiences.find(x=>x.id===active)??experiences[0];
 useEffect(()=>{
  const observer=new IntersectionObserver(entries=>{
   if(entries[0]?.isIntersecting) shell.current?.classList.add('active');
  },{threshold:.15});
  if(shell.current)observer.observe(shell.current);
  return()=>observer.disconnect();
 },[]);
 const choose=(kind:TripType)=>{
  const old=experiences.findIndex(x=>x.id===active),next=experiences.findIndex(x=>x.id===kind);
  setDirection(next>=old?1:-1);setActive(kind);
 };
 return <section className="route-playground" id="route-playground">
   <div className="route-playground-head">
     <span><Compass size={16}/> THE JOURNEY STUDIO</span>
     <h2>Where will the road <em>take you?</em></h2>
     <p>Change the destination style, explore a living route illustration, and start a quotation with the right kind of vehicle.</p>
   </div>
   <div className="route-playground-shell" ref={shell}
      onPointerMove={e=>{
       if(e.pointerType==='touch')return;
       const box=e.currentTarget.getBoundingClientRect();
       e.currentTarget.style.setProperty('--route-x',String(((e.clientX-box.left)/box.width-.5).toFixed(2)));
       e.currentTarget.style.setProperty('--route-y',String(((e.clientY-box.top)/box.height-.5).toFixed(2)));
      }}
      onPointerLeave={e=>{e.currentTarget.style.setProperty('--route-x','0');e.currentTarget.style.setProperty('--route-y','0');}}>
     <div className="route-playground-tabs" role="tablist" aria-label="Select journey type">
       {experiences.map(item=><button key={item.id} type="button" role="tab" aria-selected={active===item.id}
         className={active===item.id?'chosen':''} onClick={()=>choose(item.id)}>
         <span>{item.index}</span>{item.label}
       </button>)}
     </div>
     <div className="route-playground-content" style={{'--route-glow':current.accent} as React.CSSProperties}>
       <div className="route-playground-story" key={active}>
         <span className="route-playground-kicker">{current.sub}</span>
         <h3>{current.title}</h3>
         <p>{current.description}</p>
         <div className="route-experience-info"><span><MapPin size={15}/>{current.chip}</span><span>{current.dist}</span></div>
         <button type="button" className="route-book-button" onClick={()=>onPlan(active)}>Plan a similar journey <ArrowUpRight size={17}/></button>
       </div>
       <div className={'route-illustration route-'+active} aria-label="Decorative animated route map" role="img">
         <div className="route-orbit orb-one"/><div className="route-orbit orb-two"/>
         <div className="route-mesh"/>
         <div className="route-illustration-title">{current.index} / <span>{current.label.toUpperCase()}</span></div>
         <svg className="route-svg" viewBox="0 0 650 410" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
           <defs><linearGradient id="routeLine" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f5ebcb"/><stop offset="62%" stopColor={current.accent}/><stop offset="100%" stopColor="#fffcf1"/></linearGradient></defs>
           <path d={reverse?'M536 310 C465 278 528 65 349 99 C208 125 284 296 105 116':'M105 310 C229 310 180 106 352 116 C494 124 418 284 536 106'}
              className="route-svg-path-bg"/>
           <path key={active+'-'+reverse} d={reverse?'M536 310 C465 278 528 65 349 99 C208 125 284 296 105 116':'M105 310 C229 310 180 106 352 116 C494 124 418 284 536 106'}
              stroke="url(#routeLine)" className="route-svg-path"/>
           <circle cx={reverse?536:105} cy="310" r="8" fill="#e5ba7c" stroke="#fbf9ee" strokeWidth="4"/>
           <circle cx={reverse?105:536} cy="106" r="8" fill="#f6f3dd" stroke="#e5ba7c" strokeWidth="4"/>
         </svg>
         <div className="route-endpoint origin"><small>START</small><strong>{reverse?current.to:current.from}</strong></div>
         <div className="route-endpoint destination"><small>DESTINATION</small><strong>{reverse?current.from:current.to}</strong></div>
         <div className="route-illustration-feature">{active==='airport'?<Plane size={40}/>:active==='mountains'?<Mountain size={40}/>:active==='events'?<PartyPopper size={40}/>:<Building2 size={40}/>}</div>
         <button type="button" className="route-reverse" onClick={()=>setReverse(v=>!v)} title="Reverse journey path"><RotateCcw size={15}/> Reverse route</button>
         <div className="route-navigation-hint">{direction>0?'NEXT CHAPTER →':'← PREVIOUS CHAPTER'}</div>
       </div>
     </div>
   </div>
   <p className="route-playground-note">Illustrative route ideas only. Actual vehicle, timing, itinerary and destination coverage are confirmed with your quotation.</p>
 </section>;
}
