/**
 * Verified Creative Commons model-specific photographs for LOCAL REVIEW ONLY.
 * Source originals are cached by scripts/install-studio-review.mjs under
 * .data/studio-review, never public/ or dist/. External Wikimedia links are
 * the fallback when local assets are not cached (e.g. the Chromium CI).
 * Registration plates and variants still need human review before release.
 */
export type StudioEditorialPhoto={
 src:string;credit:string;page:string;license:string;model:string;privacyApproved:false;
};
const local=import.meta.env.VITE_STUDIO_REVIEW_READY==='1';
const commons=(filename:string)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=1600';
const candidates:Record<string,StudioEditorialPhoto>={
 'Maruti Ertiga':{
  src:local?'/studio-review/mt-studio-ertiga-review.jpg':commons('Suzuki Ertiga GX 1.5 - Indonesia International Motor Show 2018 - Front view - April 26 2018.jpg'),
  credit:'Wilzz99 · Wikimedia Commons',license:'CC BY-SA 4.0',
  page:'https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_GX_1.5_-_Indonesia_International_Motor_Show_2018_-_Front_view_-_April_26_2018.jpg',
  model:'2018 Suzuki Ertiga GX — genuine motor-show photograph',privacyApproved:false
 },
 'Mahindra TUV':{
  src:local?'/studio-review/mt-studio-tuv-review.jpg':commons('Mahindra TUV 300 Chennai 2016 (3) (cropped).JPG'),
  credit:'SnapMeUp / Davey2010 (crop) · Wikimedia Commons',license:'CC BY-SA 4.0',
  page:'https://commons.wikimedia.org/wiki/File:Mahindra_TUV_300_Chennai_2016_(3)_(cropped).JPG',
  model:'2016 Mahindra TUV300 — actual photographed vehicle',privacyApproved:false
 },
 'Kia Carens':{
  src:local?'/studio-review/mt-studio-carens-review.jpg':commons('2022 Kia Carens 1.4 Premiere (Indonesia) front view.jpg'),
  credit:'Andra Febrian · Wikimedia Commons',license:'CC BY-SA 4.0',
  page:'https://commons.wikimedia.org/wiki/File:2022_Kia_Carens_1.4_Premiere_(Indonesia)_front_view.jpg',
  model:'2022 Kia Carens 1.4 Premiere — genuine motor-show photograph',privacyApproved:false
 }
};
export function studioEditorialFor(name:string){
 // Never use unapproved editorial assets in the public/production website.
 if(typeof window==='undefined'||!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname))return undefined;
 return candidates[name];
}
