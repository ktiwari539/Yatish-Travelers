import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readCatalog, writeCatalog } from './catalog.mjs';

export const REQUIRED_ZIP_SHA256='ea09331069edb95fe65ee0ae17fbdf5ad1220ba81dca047de2911bab9166d927';
export const MEDIA_FILES={
 'public/media/mt-xuv700-driving.webp':'ab40ce92c23c5ae820bd509b75f49d79d0a08e9287cf6d3d027f6828e954b20a',
 'public/media/mt-xuv700-studio.webp':'5d0b00e1eb82ca75fd8cfbf7ea3e18d2641f6204aeac9942b574fb0b4fab3aaf',
 'public/media/mt-thar-red-front.webp':'fedf8c0c28124dad6057d10624790ca407497c6c8a8d26200a4ddb17de250b37',
 'public/media/mt-thar-red-rear.webp':'0722f2fc4f64b9b4d904239acbdf1892a3e9ae3d7aa00eca80f7323a1fcdf915',
 'public/media/mt-thar-grey-road.webp':'52fe060ac3b15932e2087e1dfc05cf6c1e1e4550c6e22a44ebb4b5c82d559e97',
 'public/media/mt-thar-grey-front-safe.webp':'453ba8a1fc414b5035f29c6278eb57830909a9a76722699149d160be44c96de9',
 'public/media/mt-traveller-safe.webp':'7165b80247d7ddaabcfc33fc26f7fd05e46bda9cf3d5a0c2f7b016145d3d76ad',
};
export const SUPPORTED_MODELS={
 'Mahindra Thar':{image:'/media/mt-thar-red-front.webp',
   gallery:['/media/mt-thar-red-rear.webp','/media/mt-thar-grey-road.webp','/media/mt-thar-grey-front-safe.webp']},
 'Mahindra XUV700':{image:'/media/mt-xuv700-driving.webp',
   gallery:['/media/mt-xuv700-studio.webp']},
 'Tempo Traveller':{image:'/media/mt-traveller-safe.webp',gallery:[]}
};
const hash=(bytes)=>createHash('sha256').update(bytes).digest('hex');
/**
 * Read-only integrity and catalog-link diagnostic for the local reviewed pack.
 * An existing filename is not proof that the photo has the approved bytes, and
 * installed bytes are not proof that a saved CRM entry references those photos.
 */
export function inspectReviewedFleetMedia({root=resolve('.'),vehicles=readCatalog().vehicles}={}){
 const images=Object.entries(MEDIA_FILES).map(([path,expected])=>{
   const file=join(root,path);
   const publicPath='/'+path.replace(/^public\//,'');
   if(!existsSync(file))return {path:publicPath,status:'missing'};
   try{
     return {path:publicPath,status:hash(readFileSync(file))===expected?'verified':'invalid'};
   }catch{return {path:publicPath,status:'unreadable'};}
 });
 const modelLinks=Object.entries(SUPPORTED_MODELS).map(([name,expected])=>{
   const actual=vehicles.find(v=>v.name===name);
   return {name,present:Boolean(actual),matches:Boolean(actual&&actual.image===expected.image&&
     JSON.stringify(actual.gallery||[])===JSON.stringify(expected.gallery))};
 });
 return {
   ready:images.every(x=>x.status==='verified'),
   installed:images.filter(x=>x.status==='verified').length,
   total:images.length,
   missing:images.filter(x=>x.status==='missing').map(x=>x.path),
   invalid:images.filter(x=>x.status==='invalid'||x.status==='unreadable').map(x=>x.path),
   catalogApplied:modelLinks.every(x=>x.matches),
   modelLinks
 };
}

const allow=[...Object.keys(MEDIA_FILES),'MEDIA_MANIFEST.json','README_INSTALL.txt'];

export function importReviewedFleetZip(base64,{root=resolve('.'),replaceExisting=false}={}){
 if(typeof base64!=='string'||base64.length>2_500_000||!/^[a-zA-Z0-9+/]+={0,2}$/.test(base64))
   throw new Error('Choose the original approved fleet ZIP (maximum 1.8MB).');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length<100||bytes.length>1_800_000||hash(bytes)!==REQUIRED_ZIP_SHA256)
   throw new Error('This ZIP differs from the reviewed seven-photo pack. Nothing was changed.');
 const temporary=mkdtempSync(join(tmpdir(),'mt-fleet-pack-'));
 try{
   const zip=join(temporary,randomUUID()+'.zip');
   writeFileSync(zip,bytes,{mode:0o600});
   const names=execFileSync('unzip',['-Z1',zip],{encoding:'utf8',maxBuffer:24000}).trim().split(/\r?\n/);
   if(names.length!==allow.length||names.some(name=>!allow.includes(name))||
      new Set(names).size!==allow.length)throw new Error('Unexpected ZIP paths. No files installed.');
   const checked=Object.entries(MEDIA_FILES).map(([path,expected])=>{
     const data=execFileSync('unzip',['-p',zip,path],{maxBuffer:2_000_000});
     if(hash(data)!==expected||data.length<1000)throw new Error('One reviewed image did not match: '+path);
     return [path,data];
   });
   // Never overwrite arbitrary paths. All bytes validated before the first write.
   for(const [path,data] of checked){
     const destination=join(root,path);
     mkdirSync(resolve(root,'public/media'),{recursive:true});
     const pending=destination+'.'+randomUUID()+'.tmp';
     writeFileSync(pending,data,{mode:0o644});
     renameSync(pending,destination);
   }
   let changed=[];
   if(replaceExisting){
     const previous=readCatalog();
     // Explicit admin opt-in: replace ONLY the named three models' photos,
     // keeping order, identifiers, rates, visibility and all other car settings.
     const vehicles=previous.vehicles.map(car=>{
       const reviewed=SUPPORTED_MODELS[car.name];
       if(!reviewed)return car;
       changed.push(car.name);
       return {...car,...reviewed};
     });
     if(changed.length)writeCatalog(vehicles);
   }
   return {installed:checked.length,applied:changed,images:checked.map(([path])=>'/'+path.replace(/^public\//,''))};
 }finally{rmSync(temporary,{recursive:true,force:true});}
}
