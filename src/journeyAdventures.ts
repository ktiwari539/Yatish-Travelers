import { luxuryMedia } from './luxuryMedia';

export type JourneyAdventure={
  slug:'mountain-roads'|'sunset-drive'|'green-adventure';
  index:string;type:string;title:string;place:string;subtitle:string;
  hero:string;fallback?:string;alt:string;credit:string;source?:string;
  intro:string;vehicleNote:string;chapters:{title:string;body:string}[];
};

export const journeyAdventures:JourneyAdventure[]=[
  {
    slug:'mountain-roads',index:'01',type:'MOUNTAIN ROADS',
    title:'Beyond the familiar.',place:'Mountain road-trip adventures',
    subtitle:'Winding roads, open skies and new perspectives.',
    hero:luxuryMedia.mountains.src,fallback:luxuryMedia.mountains.fallback,
    alt:luxuryMedia.mountains.alt,
    credit:'AI-generated editorial car-and-mountain concept',intro:
    'Set your own pace for a hill-road escape. Pick a starting point, plan pauses for the views and choose a vehicle to suit your group.',
    vehicleNote:'Illustrative MPV concept, not an identified Mateshwari fleet vehicle.',
    chapters:[
      {title:'Start with the route',body:'Tell us where you would like to leave from, your preferred hill destination and the number of travellers.'},
      {title:'Make space for the stops',body:'Plan viewpoints, refreshments and rest stops around your interests. Road conditions and access are confirmed before travel.'},
      {title:'Return at your own pace',body:'Choose a same-day visit or an overnight itinerary. Actual vehicle, driver availability and final fare follow a quotation.'}
    ]
  },
  {
    slug:'sunset-drive',index:'02',type:'THE GOLDEN HOUR',
    title:'Take the scenic route.',place:'Sunset and scenic road trips',
    subtitle:'The kind of drive you remember long after arriving.',
    hero:luxuryMedia.hero.src,fallback:luxuryMedia.hero.fallback,
    alt:luxuryMedia.hero.alt,
    credit:'AI-generated sunset-drive editorial concept',intro:
    'Build an unhurried evening drive around the landscape, your company and the hour you want to arrive.',
    vehicleNote:'Illustrative MPV concept, not a confirmed booking or route.',
    chapters:[
      {title:'Choose your horizon',body:'Share a preferred drive, destination or scenic viewpoint. The journey is planned for your actual pickup area.'},
      {title:'Time the experience',body:'Consider daylight, weather, safe stopping points and realistic driving time rather than a fixed advertised sunset schedule.'},
      {title:'Travel comfortably',body:'Request a sedan, MPV or another suitable vehicle and confirm the itinerary, pickup time and fare before departure.'}
    ]
  },
  {
    slug:'green-adventure',index:'03',type:'GREEN ESCAPES',
    title:'Where the road breathes.',place:'Green roads and open-air adventures',
    subtitle:'A quieter road-trip mood with room for adventure.',
    hero:'/media/mt-thar-grey-road.webp',alt:'Grey Thar model-reference vehicle on a green-lined road',
    credit:'Reviewed local Thar model-reference photograph',intro:
    'Leave the usual route behind with a nature-led road trip. Explore countryside drives and green escapes without assuming off-road access.',
    vehicleNote:'Model-reference Thar photo. Off-road driving, permits and specific vehicle availability are not implied.',
    chapters:[
      {title:'Find the green escape',body:'Share a nature destination, countryside route or outdoor stop. Access and road suitability must be checked first.'},
      {title:'Match the group to the vehicle',body:'Choose seats, luggage room and comfort for the actual travellers; a Thar image does not guarantee a specific assigned car.'},
      {title:'Plan responsibly',body:'Check weather, safe roads, local access rules and return timing before confirming the route and price.'}
    ]
  }
];

export function journeyUrl(slug:JourneyAdventure['slug']){return '/journeys/'+slug;}
export function findJourney(slug:string){return journeyAdventures.find(journey=>journey.slug===slug);}
