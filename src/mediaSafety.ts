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
