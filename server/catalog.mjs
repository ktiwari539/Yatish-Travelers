import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export const catalogPath=resolve(process.env.CRM_CATALOG_FILE || '.data/catalog.json');
const commons=(file)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+file+'?width=1600';
export const defaultCatalog=[
 {name:'Maruti Dzire',seats:'4+1',capacity:4,tag:'Smart & Efficient',category:'Sedan',image:commons('MIAS%202025%20-%20All-new%20Suzuki%20Dzire%20Hybrid%2002.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Maruti Ertiga',seats:'6+1',capacity:6,tag:'Family Favourite',category:'MPV',image:commons('Suzuki%20Ertiga%20GX%201.5%20-%20Indonesia%20International%20Motor%20Show%202018%20-%20Front%20view%20-%20April%2026%202018.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Toyota Innova',seats:'6+1',capacity:6,tag:'Premium Comfort',category:'Premium MPV',image:commons('Toyota%20Innova%20Crysta%202.4%20Z%20side.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra TUV',seats:'6+1',capacity:6,tag:'Strong & Spacious',category:'SUV',image:commons('Mahindra%20TUV%20300%20%282016%29%20%2852715226367%29.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Mahindra Bolero',seats:'6+1',capacity:6,tag:'Reliable Traveller',category:'SUV',image:commons('Mahindra%20Bolero%20ZLX.jpg'),rateMin:15,rateMax:25,enabled:true},
 {name:'Tempo Traveller',seats:'12+1 / 17+1',capacity:17,tag:'Group Travel',category:'Traveller',image:commons('Force%20Traveller%20Luxury.jpg'),rateMin:15,rateMax:25,enabled:true}
].map((v)=>({...v,id:v.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}));
const text=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
const validImage=(url)=>{if(/^\/api\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(url))return true;try{const u=new URL(url);return u.protocol==='https:'&&url.length<=900&&!u.username&&!u.password;}catch{return false;}};
export function validateVehicle(input,previous={}) {
  const name=text(input.name,80),seats=text(input.seats,30),tag=text(input.tag,80),category=text(input.category,50),image=text(input.image,900);
  const capacity=Number(input.capacity),rateMin=Number(input.rateMin),rateMax=Number(input.rateMax);
  if(!name || !seats || !tag || !category || !validImage(image)) throw new Error('Provide name, seats, tag, category and a valid HTTPS image URL.');
  if(!Number.isInteger(capacity)||capacity<1||capacity>50) throw new Error('Capacity must be 1–50.');
  if(!Number.isFinite(rateMin)||!Number.isFinite(rateMax)||rateMin<1||rateMax>10000||rateMin>rateMax) throw new Error('Invalid per-km pricing.');
  return {id:previous.id||randomUUID(),name,seats,tag,category,image,capacity,rateMin,rateMax,enabled:input.enabled!==false};
}
export function readCatalog(){
  if(!existsSync(catalogPath)) return {vehicles:defaultCatalog.map(x=>({...x})),updatedAt:null};
  const value=JSON.parse(readFileSync(catalogPath,'utf8'));
  if(!Array.isArray(value.vehicles)) throw new Error('Invalid stored catalog.');
  return value;
}
export function writeCatalog(vehicles){
  if(!Array.isArray(vehicles)||vehicles.length>80) throw new Error('Catalog limit exceeded.');
  const next={vehicles,updatedAt:new Date().toISOString()};
  mkdirSync(dirname(catalogPath),{recursive:true,mode:0o700});
  const tmp=catalogPath+'.'+randomUUID()+'.tmp';
  writeFileSync(tmp,JSON.stringify(next,null,2),{mode:0o600});
  renameSync(tmp,catalogPath);
  return next;
}
