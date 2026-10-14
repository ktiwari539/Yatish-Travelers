/** Multi-angle, model-specific photo catalog for local editorial review.
 * Never substitute other models. Images sourced from Wikimedia Commons and
 * used only on localhost until their plates, licence, visual quality and
 * exact variant are signed off. No CRM records are changed.
 */
import { needsInnovaPlateReview } from './mediaSafety';
import { studioEditorialFor } from './studioPhotography';

export type GalleryCar={
 name:string;image:string;gallery?:string[];
};
export type GalleryPhoto={src:string;label:string;credit?:string;license?:string;page?:string;reviewPending:boolean};

const commons=(filename:string)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=1600';
const page=(filename:string)=>'https://commons.wikimedia.org/wiki/File:'+filename.replaceAll(' ','_');
type Candidate={file:string;credit:string;license:string;label:string};
const candidates:Record<string,Candidate[]>={
 'Toyota Innova':[
  {file:'2019 Toyota Innova 2.0 G (74).jpg',label:'2019 Innova cabin reference (different trim)',credit:'Bindydad123',license:'CC BY-SA 4.0'}
 ],
 'Mahindra Bolero':[
  {file:'Mahindra Bolero GLX Front.JPG',label:'Bolero GLX front reference (different trim)',credit:'Ominae',license:'CC BY-SA 4.0'},
  {file:'Mahindra Bolero GLX Rear.JPG',label:'Bolero GLX rear reference (different trim)',credit:'Ominae',license:'CC BY-SA 4.0'}
 ],
 'Maruti Dzire':[
  {file:'MIAS 2025 - All-new Suzuki Dzire Hybrid 03.jpg',label:'Front three-quarter',credit:'Ethan Llamas',license:'CC BY-SA 4.0'}
 ],
 'Mahindra TUV':[
  {file:'Mahindra TUV 300 Chennai 2016 (1).JPG',label:'Alternate model view',credit:'SnapMeUp',license:'CC BY-SA 4.0'}
 ],
 'Mahindra Scorpio-N':[
  {file:'2024 Mahindra Scorpio Z8L rear.jpg',label:'Rear reference',credit:'LuvsMG481',license:'CC BY-SA 4.0'}
 ],
 'Kia Carens':[
  {file:'2022 Kia Carens 1.4 Premiere (Indonesia) rear view.jpg',label:'Rear three-quarter',credit:'Andra Febrian',license:'CC BY-SA 4.0'}
 ],
 'Tempo Traveller':[
  {file:'ForceTravellerside.JPG',label:'Traveller side reference (older variant)',credit:'OnkelFordTaunus',license:'CC BY-SA 3.0'}
 ]
};
const isLocal=()=>typeof window!=='undefined'&&
 ['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);

export function buildFleetGallery(car:GalleryCar):GalleryPhoto[]{
 const editorial=isLocal()?studioEditorialFor(car.name):undefined;
 const preferred:Record<string,string>={
  'Mahindra XUV700':'/media/mt-xuv700-studio.webp',
  'Mahindra Thar':'/media/mt-thar-red-front.webp'
 };
 const listed=[car.image,...(car.gallery||[])];
 const photoSources=[
  ...(editorial?[editorial.src]:[]),
  ...(preferred[car.name]&&listed.includes(preferred[car.name])?[preferred[car.name]]:[]),
  ...listed
 ];
 const results:GalleryPhoto[]=[];
 const add=(item:GalleryPhoto)=>{
  if(!item.src||results.some(p=>p.src===item.src)||needsInnovaPlateReview(car.name,item.src))return;
  results.push(item);
 };
 for(const src of photoSources){
  add({src,label:results.length===0?'Main view':'Alternate angle',
   ...(editorial&&src===editorial.src?{credit:editorial.credit,license:editorial.license,page:editorial.page}:{}),
   reviewPending:Boolean(editorial&&src===editorial.src)});
 }
 if(isLocal())for(const candidate of candidates[car.name]||[]){
  add({src:commons(candidate.file),label:candidate.label,credit:candidate.credit,
   license:candidate.license,page:page(candidate.file),reviewPending:true});
 }
 return results.slice(0,7);
}
export function isPhotoPrivacyReviewed(photo:GalleryPhoto):boolean{
 return !photo.reviewPending && !/^https?:/.test(photo.src);
}
