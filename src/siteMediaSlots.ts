/** Fixed website placements exposed to staff. A slot cannot inject arbitrary markup. */
export const siteMediaSlots = [
  { id: 'homeStoryMountain', section: 'Home / Stories spotlight', label: 'Card 1 · Mountain escapes', tip: 'First image in the Stories from the Road preview.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'homeStorySunset', section: 'Home / Stories spotlight', label: 'Card 2 · Golden-hour drive', tip: 'Second image in the Stories from the Road preview.', defaultUrl:'/media/mt-hero-sunset.webp' },
  { id: 'homeStoryLandscape', section: 'Home / Stories spotlight', label: 'Card 3 · Scenic places', tip: 'Third image in the Stories from the Road preview.', defaultUrl:'' },
  { id: 'storiesHero', section: 'Stories page', label: 'Stories cover', tip: 'Wide cinematic cover behind the Stories page heading.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'journeyMountain', section: 'Journeys / both pages', label: 'Journey 1 · Mountain roads', tip: 'Shared by the mountain journey card and its detail page.', defaultUrl:'/media/mt-mountain-sunset.webp' },
  { id: 'journeySunset', section: 'Journeys / both pages', label: 'Journey 2 · Sunset drive', tip: 'Shared by the sunset journey card and its detail page.', defaultUrl:'/media/mt-hero-sunset.webp' },
  { id: 'journeyGreen', section: 'Journeys / both pages', label: 'Journey 3 · Green adventure', tip: 'Shared by the green journey card and its detail page.', defaultUrl:'/media/mt-thar-grey-road.webp' },
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
