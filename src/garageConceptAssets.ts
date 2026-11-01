/**
 * Optional public-domain, UNBRANDED showroom concepts. These are never
 * presented as the named customer fleet vehicles and are only fetched after
 * a visitor explicitly chooses ROTATE 3D CONCEPT.
 *
 * Source: https://3dassets.dev/packs/car-park-and-road-vehicle-fleet
 * Publisher: 3D Assets (original generic road-vehicle concepts)
 * Declared licence: CC0 1.0 Universal, no attribution required
 * Source-specific assets / cross-check (2026-10-14):
 *   Four-door saloon: /assets/car-park-and-road-vehicle-fleet-saloon-ad831b1f
 *   Large seven-seat SUV: /assets/car-park-and-road-vehicle-fleet-large-suv-da72f8b4
 *   City SUV: /assets/car-park-and-road-vehicle-fleet-city-suv-427b6f75
 *
 * These are browser-side, third-party network resources. No model is
 * bundled, no brand-specific model ownership is implied, and any load or CORS
 * failure falls back to the local generic concept renderer.
 */
const concepts={
 sedan:'https://cdn.3dassets.dev/assets/32490/v1/model.glb',
 bigSUV:'https://cdn.3dassets.dev/assets/32503/v1/model.glb',
 citySUV:'https://cdn.3dassets.dev/assets/32519/v1/model.glb'
} as const;
const names:Record<string,string>={
 'Maruti Dzire':concepts.sedan,
 'Mahindra Scorpio-N':concepts.bigSUV,
 'Mahindra XUV700':concepts.bigSUV,
 'Mahindra Bolero':concepts.bigSUV,
 'Mahindra TUV':concepts.citySUV,
 'Mahindra Thar':concepts.citySUV
};
export const ALLOWED_CC0_GARAGE_MODELS=new Set<string>(Object.values(concepts));
export function conceptModelFor(name:string):string|undefined{return names[name];}
