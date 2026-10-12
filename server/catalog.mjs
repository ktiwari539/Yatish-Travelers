import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export const catalogPath=resolve(process.env.CRM_CATALOG_FILE || '.data/catalog.json');
const commons=(file)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+file+'?width=1600';
export const defaultCatalog=[
 {name:'Maruti Dzire',seats:'4+1',capacity:4,tag:'Smart & Efficient',category:'Sedan',image:commons('MIAS%202025%20-%20All-new%20Suzuki%20Dzire%20Hybrid%2002.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Maruti Ertiga',seats:'6+1',capacity:6,tag:'Family Favourite',category:'MPV',image:commons('Suzuki%20Ertiga%20GX%20%28Side%29%2C%20Jakarta%2C%20Indonesia.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Toyota Innova',seats:'6+1',capacity:6,tag:'Premium Comfort',category:'Premium MPV',image:commons('Toyota%20Innova%20Crysta%202.4%20Z%20side.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra TUV',seats:'6+1',capacity:6,tag:'Strong & Spacious',category:'SUV',image:commons('Mahindra%20TUV%20300%20%282016%29%20%2852715226367%29.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra Bolero',seats:'6+1',capacity:6,tag:'Bold Black Edition · On request',category:'SUV',image:commons('Mahindra%20Bolero%20Gen%203.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Tempo Traveller',seats:'12+1 / 17+1',capacity:17,tag:'Group Travel',category:'Traveller',image:commons('Force%20Traveller%20Luxury.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra Scorpio-N',seats:'6+1',capacity:6,tag:'Statement SUV · On request',category:'Premium SUV',image:commons(encodeURIComponent('2024 Mahindra Scorpio Z8L front.jpg')),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra Thar',seats:'3+1',capacity:3,tag:'Bold Adventure · On request',category:'Adventure SUV',image:commons(encodeURIComponent('Mahindra Thar SUV in "Red Rage" color at Ashiana Brahmanda, East Singbhum India (Ank Kumar, Infosys limited) 02 (cropped).jpg')),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra XUV700',seats:'6+1',capacity:6,tag:'Executive SUV · On request',category:'Premium SUV',image:commons(encodeURIComponent('A black Mahindra XUV700 SUV in Ashiana Brahmananda, Jamshedpur, India (Ank Kumar, Infosys Limited) 02.jpg')),rateMin:15,rateMax:25,enabled:true},
 {name:'Kia Carens',seats:'6+1',capacity:6,tag:'Contemporary Family · On request',category:'Premium MPV',image:commons(encodeURIComponent('Kia Carens 2024 Model 2.jpg')),rateMin:15,rateMax:25,enabled:true}
].map((v)=>({...v,id:v.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
 gallery:v.name==='Maruti Dzire' ? [commons('MIAS%202025%20-%20All-new%20Suzuki%20Dzire%20Hybrid%2004.jpg')]
 :v.name==='Maruti Ertiga' ? [commons('Suzuki%20Ertiga%20GX%201.5%20-%20Indonesia%20International%20Motor%20Show%202018%20-%20Rear%20view%20-%20April%2026%202018.jpg')]
 :v.name==='Toyota Innova' ? [commons('Toyota%20Innova%20Crysta%202.4%20Z%20rear%20left.jpg'),commons('Toyota%20Innova%20Crysta%202.4%20Z%20front%20right.jpg')]
 :[]
}));
const text=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
const bundledPhoto=/^\/media\/mt-(?:xuv700-(?:driving|studio)|thar-(?:red-front|red-rear|grey-road|grey-front-safe)|traveller-safe)\.webp$/;
const validImage=(url)=>{if(bundledPhoto.test(url))return true;if(/^\/api\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(url))return true;try{const u=new URL(url);return u.protocol==='https:'&&url.length<=900&&!u.username&&!u.password;}catch{return false;}};
export function validateVehicle(input,previous={}) {
  const name=text(input.name,80),seats=text(input.seats,30),tag=text(input.tag,80),category=text(input.category,50),image=text(input.image,900);
  const capacity=Number(input.capacity),rateMin=Number(input.rateMin),rateMax=Number(input.rateMax);
  if(!name || !seats || !tag || !category || !validImage(image)) throw new Error('Provide name, seats, tag, category and a valid HTTPS image URL.');
  if(!Number.isInteger(capacity)||capacity<1||capacity>50) throw new Error('Capacity must be 1–50.');
  if(!Number.isFinite(rateMin)||!Number.isFinite(rateMax)||rateMin<1||rateMax>10000||rateMin>rateMax) throw new Error('Invalid per-km pricing.');
  const gallery=Array.isArray(input.gallery)?input.gallery.filter(v=>typeof v==='string'&&v.length).slice(0,5):[];
  if(gallery.some(v=>!validImage(v)))throw new Error('All alternate images must be HTTPS or local uploads.');
  const modelUrl=text(input.modelUrl,150);
  if(modelUrl&&!/^\/api\/models\/[a-f0-9-]{36}\.glb$/.test(modelUrl))throw new Error('3D model must be a locally uploaded GLB.');
  return {id:previous.id||randomUUID(),name,seats,tag,category,image,capacity,rateMin,rateMax,enabled:input.enabled!==false,gallery,modelUrl};
}
// Reviewed files are installed locally in public/media, not committed as
// unlicensed binary assets. Never substitute across models or overwrite
// staff-managed photos; only a matching bundled default may be upgraded.
const previewMedia={
 'Mahindra Thar':{
   image:'/media/mt-thar-red-front.webp',
   gallery:['/media/mt-thar-red-rear.webp','/media/mt-thar-grey-road.webp','/media/mt-thar-grey-front-safe.webp']
 },
 'Mahindra XUV700':{
   image:'/media/mt-xuv700-driving.webp',
   gallery:['/media/mt-xuv700-studio.webp']
 },
 'Tempo Traveller':{
   image:'/media/mt-traveller-safe.webp',gallery:[]
 }
};
export function applyReviewedFleetMedia(records,rootDir=resolve('public')){
 const localFile=(path)=>resolve(rootDir,path.slice(1));
 return records.map(vehicle=>{
   const candidate=previewMedia[vehicle.name];
   if(!candidate)return vehicle;
   const original=defaultCatalog.find(entry=>entry.name===vehicle.name);
   if(!original || vehicle.image!==original.image)return vehicle;
   const paths=[candidate.image,...candidate.gallery];
   if(!paths.every(file=>existsSync(localFile(file))))return vehicle;
   const priorGallery=vehicle.gallery||[];
   const defaultGallery=original.gallery||[];
   const unmodifiedGallery=JSON.stringify(priorGallery)===JSON.stringify(defaultGallery);
   return {...vehicle,image:candidate.image,...(unmodifiedGallery?{gallery:candidate.gallery}:{})};
 });
}
export function readCatalog(){
  if(!existsSync(catalogPath)) return {vehicles:applyReviewedFleetMedia(defaultCatalog.map(x=>({...x}))),updatedAt:null};
  const value=JSON.parse(readFileSync(catalogPath,'utf8'));
  if(!Array.isArray(value.vehicles)) throw new Error('Invalid stored catalog.');
  // Only migrate the exact previous bundled reference asset, never user-provided photos.
  const previousErtiga=commons('Suzuki%20Ertiga%20GX%201.5%20-%20Indonesia%20International%20Motor%20Show%202018%20-%20Front%20view%20-%20April%2026%202018.jpg');
  const currentErtiga=defaultCatalog.find(v=>v.name==='Maruti Ertiga')?.image;
  const oldBolero=commons('Mahindra%20Bolero%20ZLX.jpg');
  const blackBolero=defaultCatalog.find(v=>v.name==='Mahindra Bolero')?.image;
  // Version-1 local catalogs predate these optional showcase entries. Add them once
  // without overwriting staff-managed pricing, images, visibility or existing records.
  // A version-2 catalog can intentionally remove vehicles without their return.
  const existing=value.vehicles.map(v=>{
    if(v.name==='Maruti Ertiga'&&v.image===previousErtiga&&currentErtiga)return {...v,image:currentErtiga};
    if(v.name==='Mahindra Bolero'&&v.image===oldBolero&&blackBolero)return {...v,image:blackBolero};
    return v;
  });
  const newShowcaseNames=new Set(['Mahindra Scorpio-N','Mahindra Thar','Mahindra XUV700','Kia Carens']);
  const additions=Number(value.catalogVersion||1)<2
    ?defaultCatalog.filter(v=>newShowcaseNames.has(v.name)&&!existing.some(item=>item.name===v.name))
    :[];
  return {...value,catalogVersion:2,vehicles:applyReviewedFleetMedia([...existing,...additions])};
}
export function writeCatalog(vehicles){
  if(!Array.isArray(vehicles)||vehicles.length>80) throw new Error('Catalog limit exceeded.');
  const next={catalogVersion:2,vehicles,updatedAt:new Date().toISOString()};
  mkdirSync(dirname(catalogPath),{recursive:true,mode:0o700});
  const tmp=catalogPath+'.'+randomUUID()+'.tmp';
  writeFileSync(tmp,JSON.stringify(next,null,2),{mode:0o600});
  renameSync(tmp,catalogPath);
  return next;
}
