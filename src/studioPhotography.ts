/**
 * Editorial studio-only photo upgrades. Never writes or migrates staff CRM data.
 * These are model references, NOT Mateshwari-owned/assigned vehicles.
 * Images remain eligible for local preview only until full-resolution plate
 * privacy review and final publisher/rights acceptance.
 *
 * Attribution is required by CC BY-SA 4.0 and displayed beside the imagery.
 */
export type StudioEditorialPhoto={src:string;credit:string;page:string;license:string;model:string;privacyApproved:false};
const commons=(filename:string)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=1600';
const candidates:Record<string,StudioEditorialPhoto>={
 'Maruti Ertiga':{
  src:commons('Suzuki Ertiga GX 1.5 - Indonesia International Motor Show 2018 - Front view - April 26 2018.jpg'),
  credit:'Wilzz99 · Wikimedia Commons',license:'CC BY-SA 4.0',
  page:'https://commons.wikimedia.org/wiki/File:Suzuki_Ertiga_GX_1.5_-_Indonesia_International_Motor_Show_2018_-_Front_view_-_April_26_2018.jpg',
  model:'2018 Suzuki Ertiga GX show vehicle',privacyApproved:false
 },
 'Mahindra TUV':{
  src:commons('Mahindra TUV 300 Chennai 2016 (3) (cropped).JPG'),
  credit:'SnapMeUp / Davey2010 (crop) · Wikimedia Commons',license:'CC BY-SA 4.0',
  page:'https://commons.wikimedia.org/wiki/File:Mahindra_TUV_300_Chennai_2016_(3)_(cropped).JPG',
  model:'2016 Mahindra TUV300 model reference',privacyApproved:false
 }
};
export function studioEditorialFor(name:string){
 // Unreviewed editorial candidates are visible only in local acceptance.
 // Image-rights and registration-plate approval are still release gates.
 if(typeof window==='undefined'||!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname))return undefined;
 return candidates[name];
}
