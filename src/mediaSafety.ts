/**
 * Keep historically unreviewed, visibly plate-bearing Innova reference angles
 * off the public site. This is a visual display gate only: CRM catalog bytes,
 * staff uploads and prices remain unchanged.
 *
 * Once licensed, plate-sanitized replacements are uploaded through Admin, their
 * /api/uploads/... URLs are permitted and the full photo sequence is restored.
 */
export function needsInnovaPlateReview(name:string,src:string):boolean{
 if(name!=='Toyota Innova'||!src.startsWith('https://commons.wikimedia.org/'))return false;
 try{
   const photo=decodeURIComponent(new URL(src).pathname).replace(/_/g,' ');
   return /Toyota Innova Crysta 2\.4 Z (?:rear left|front right)\.jpg$/i.test(photo);
 }catch{return false;}
}

/**
 * Reject historically known plate-bearing source URLs throughout the frontend,
 * including fallback catalogs and old staff-saved references. Do not substitute
 * another model. Reviewed local /media or privacy-edited /api/uploads assets
 * are unaffected. This is a known-source denylist, NOT a blanket privacy audit.
 */
export function needsFleetPlateReview(name:string,src:string):boolean{
 if(needsInnovaPlateReview(name,src))return true;
 if(!src.startsWith('https://'))return false;
 let normalized=src.toLowerCase();
 try{normalized=decodeURIComponent(new URL(src).pathname).toLowerCase();}catch{}
 const marker:Record<string,string>={
  'Mahindra Thar':'mahindra_thar_suv_in_',
  'Mahindra XUV700':'a_black_mahindra_xuv700_suv_in_',
  'Tempo Traveller':'force_traveller_luxury'
 };
 const flagged=marker[name];
 return Boolean(flagged&&normalized.replaceAll(' ','_').replaceAll('%20','_').includes(flagged));
}
