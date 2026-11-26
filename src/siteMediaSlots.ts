import { luxuryMedia } from './luxuryMedia';
/** Fixed website placements exposed to staff. A slot cannot inject arbitrary markup. */
export const siteMediaSlots = [
  { id: 'homeStoryMountain', section: 'Home / Stories spotlight', label: 'Card 1 · Mountain escapes', tip: 'First image in the Stories from the Road preview.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'homeStorySunset', section: 'Home / Stories spotlight', label: 'Card 2 · Golden-hour drive', tip: 'Second image in the Stories from the Road preview.', defaultUrl:'/media/mt-hero-sunset.webp' },
  { id: 'homeStoryLandscape', section: 'Home / Stories spotlight', label: 'Card 3 · Scenic places', tip: 'Third image in the Stories from the Road preview.', defaultUrl:'' },
  { id: 'storiesHero', section: 'Stories page', label: 'Stories cover', tip: 'Wide cinematic cover behind the Stories page heading.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'journeyMountain', section: 'Journeys / both pages', label: 'Journey 1 · Mountain roads', tip: 'Shared by the mountain journey card and its detail page.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'journeySunset', section: 'Journeys / both pages', label: 'Journey 2 · Sunset drive', tip: 'Shared by the sunset journey card and its detail page.', defaultUrl:'/media/mt-hero-sunset.webp' },
  { id: 'journeyGreen', section: 'Journeys / both pages', label: 'Journey 3 · Green adventure', tip: 'Shared by the green journey card and its detail page.', defaultUrl:'/media/mt-thar-grey-road.webp' },
  { id: 'heroSceneArrival', section: 'Homepage / Cinematic hero', label: 'Scene 1 · Arrival background', tip: 'Wide background behind the first cinematic scene. Upload a large landscape image.', defaultUrl:'/media/mt-hero-sunset.webp' },
  { id: 'heroSceneRoad', section: 'Homepage / Cinematic hero', label: 'Scene 2 · Open road background', tip: 'Wide landscape for the second rotating scene.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'heroSceneJourney', section: 'Homepage / Cinematic hero', label: 'Scene 3 · Travel inspiration background', tip: 'Wide landscape for the third rotating scene.', defaultUrl:luxuryMedia.landscape.src },
  { id: 'heroForegroundArrival', section: 'Homepage / Cinematic hero', label: 'Scene 1 · Transparent vehicle foreground', tip: 'Use a privacy-cleared, transparent vehicle cutout matching the depicted model. Not a fleet listing photo.', defaultUrl:'/media/mt-hero-car-cutout.webp' },
  { id: 'heroForegroundRoad', section: 'Homepage / Cinematic hero', label: 'Scene 2 · Transparent vehicle foreground', tip: 'Use a privacy-cleared, transparent vehicle cutout matching the depicted model.', defaultUrl:'/media/mt-side-car-cutout.webp' },
  { id: 'serviceCity', section: 'Homepage / Services', label: 'City travel card', tip: 'Photo for the local city travel service card.', defaultUrl:luxuryMedia.forest.src },
  { id: 'serviceOutstation', section: 'Homepage / Services', label: 'Outstation card', tip: 'Photo for intercity and outstation trips.', defaultUrl:luxuryMedia.mountains.src },
  { id: 'serviceAirport', section: 'Homepage / Services', label: 'Airport transfer card', tip: 'Photo for the airport transfer service.', defaultUrl:luxuryMedia.airport.src },
  { id: 'serviceEvents', section: 'Homepage / Services', label: 'Weddings and events card', tip: 'Photo for group events and guest transport.', defaultUrl:luxuryMedia.hero.src },
  { id: 'corporateHero', section: 'Homepage / Corporate', label: 'Corporate mobility image', tip: 'Large image beside corporate travel description.', defaultUrl:luxuryMedia.airport.src },
  { id: 'interludeScene', section: 'Homepage / Scenic interlude', label: 'Wide scenic interlude image', tip: 'Immersive image between the services and journey sections.', defaultUrl:luxuryMedia.mountains.src },
  { id: 'storyFallbackRoad', section: 'Stories / Editorial fallback', label: 'Journey inspiration · Road', tip: 'First editorial story image before real approved stories are published.', defaultUrl:luxuryMedia.hero.src },
  { id: 'storyFallbackHighlands', section: 'Stories / Editorial fallback', label: 'Journey inspiration · Highlands', tip: 'Second editorial story image.', defaultUrl:luxuryMedia.mountains.src },
  { id: 'storyFallbackArrival', section: 'Stories / Editorial fallback', label: 'Journey inspiration · Arrival', tip: 'Third editorial story image.', defaultUrl:luxuryMedia.airport.src },
  { id: 'jabalpurHero', section: 'Jabalpur / Service page', label: 'Jabalpur car rental hero', tip: 'Landscape on Jabalpur service page; use authentic, licensed imagery, without pretending it is a Jabalpur office.', defaultUrl:luxuryMedia.landscape.src },
] as const;

export type SiteMediaSlot = typeof siteMediaSlots[number]['id'];
export type SiteMediaPlacement = { imageUrl: string; alt: string };
export const blankSiteMedia = () => Object.fromEntries(siteMediaSlots.map(slot =>
  [slot.id, { imageUrl: '', alt: '' }])) as Record<SiteMediaSlot, SiteMediaPlacement>;

export const siteVisibilitySections = [
  { id: 'homeStories', label: 'Homepage / Stories spotlight', description: 'Show or hide the three travel-inspiration cards and Stories link.' },
  { id: 'homeJourneys', label: 'Homepage / Journey cards', description: 'Show or hide the three linked editorial journey cards.' },
  { id: 'storiesGallery', label: 'Stories page / Gallery', description: 'Show or hide the approved story gallery (does not delete stories).' },
  { id: 'storiesAmbassadors', label: 'Stories page / Ambassadors', description: 'Show or hide published ambassador profiles (does not delete records).' },
  { id: 'storiesTestimonials', label: 'Stories page / Testimonials', description: 'Show or hide consented customer feedback (does not delete records).' },
] as const;
export type SiteVisibilitySection = typeof siteVisibilitySections[number]['id'];
export const blankSiteVisibility = () => Object.fromEntries(siteVisibilitySections.map(section =>
  [section.id, true])) as Record<SiteVisibilitySection, boolean>;

/** Client-side preview only; server independently validates these same-origin paths. */
export const safeSiteImagePath = (path: string) =>
  /^\/(?:api\/uploads\/[a-f0-9-]{36}\.webp|media\/[a-zA-Z0-9_-]{1,100}\.webp)$/.test(path);
