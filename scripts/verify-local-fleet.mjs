/**
 * Read-only local fleet diagnostic. Run while npm run dev:full is active.
 * Does not change any files, inventory, notifications, or CRM records.
 */
import { readCatalog } from '../server/catalog.mjs';
import { inspectReviewedFleetMedia, SUPPORTED_MODELS } from '../server/fleet-photo-import.mjs';

const base='http://127.0.0.1:5173';
const problems=[];
const fail=(message)=>{problems.push(message);console.error('FAIL '+message);};
const pass=(message)=>console.log('PASS '+message);
const local=inspectReviewedFleetMedia();
console.log('\nMateshwari local fleet / reviewed photo diagnostics (read-only)\n');
console.log('Reviewed image checksums: '+local.installed+'/'+local.total+' verified');
if(local.missing.length)fail('Missing: '+local.missing.join(', '));
if(local.invalid.length)fail('Invalid or unreadable: '+local.invalid.join(', '));
if(local.ready)pass('All seven approved image files match expected SHA-256 values');
for(const link of local.modelLinks){
 const state=link.persistedMatches===null?'no saved catalog':link.persistedMatches?'saved catalog matches':'saved catalog differs';
 console.log(link.name+': effective URL '+(link.matches?'matches':'differs')+'; '+state);
 if(!link.matches)fail(link.name+' is not using the full reviewed photo set in the effective catalog');
 if(link.persistedMatches===false)fail(link.name+' stored photo URLs differ (use Admin approved photo pack import with confirmation)');
}
const getJson=async(path)=>{
 const response=await fetch(base+path,{signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error(path+' HTTP '+response.status);
 const mime=response.headers.get('content-type')||'';
 if(!mime.includes('application/json'))throw new Error(path+' returned '+mime+' instead of JSON; run npm run dev:full');
 return response.json();
};
try{
 const health=await getJson('/api/health');
 if(!health.ok)fail('Local CRM health check returned not ready');
 else pass('Vite proxy connects to the running CRM API');
 const publicCatalog=await getJson('/api/catalog');
 const publicVehicles=publicCatalog.vehicles;
 if(!Array.isArray(publicVehicles))throw new Error('/api/catalog missing vehicles');
 const expected=readCatalog().vehicles.filter(car=>car.enabled);
 const actualNames=publicVehicles.map(car=>car.name);
 if(JSON.stringify(actualNames)!==JSON.stringify(expected.map(car=>car.name)))
   fail('Public fleet differs from saved Admin Featured order (check port, catalog path and server restart)');
 else pass('Public Featured order matches enabled entries in local CRM catalog');
 console.log('Public order: '+actualNames.map((name,i)=>(i+1)+'. '+name).join(' | '));
 if(publicVehicles.some(car=>car.enabled===false))fail('Hidden vehicle exposed in public catalog');
 else pass('Hidden vehicles are excluded from public catalog');
 for(const [name,photos] of Object.entries(SUPPORTED_MODELS)){
   const entry=publicVehicles.find(car=>car.name===name);
   if(!entry){console.log('SKIP '+name+' is hidden or removed');continue;}
   const urls=[entry.image,...(entry.gallery||[])];
   const expectedUrls=[photos.image,...photos.gallery];
   if(JSON.stringify(urls)!==JSON.stringify(expectedUrls))
     fail(name+' publicly references different main/alternate photo URLs');
   else pass(name+' public main and alternate photo URLs match the reviewed set');
 }
 for(const img of [...local.missing,...local.invalid])console.log('NOT SERVABLE '+img);
 for(const img of Object.keys(SUPPORTED_MODELS).flatMap(name=>[SUPPORTED_MODELS[name].image,...SUPPORTED_MODELS[name].gallery])){
   const response=await fetch(base+img,{method:'HEAD',signal:AbortSignal.timeout(5000)});
   const mime=response.headers.get('content-type')||'';
   if(!response.ok||!mime.includes('image/webp'))fail(img+' is not served as WebP (HTTP '+response.status+', content type '+mime+')');
   else pass(img+' served successfully');
 }
}catch(e){fail('Could not verify running local website: '+(e instanceof Error?e.message:e)+'. Start CRM_ADMIN_TOKEN=... npm run dev:full in a separate terminal.');}
console.log('\n'+(problems.length?'BLOCKED: '+problems.length+' checks need attention.':'PASS: installed reviewed photos, public catalog order and served URLs agree.'));
console.log('This cannot certify plates on other models, image rights, Safari appearance, or live CRM actions.');
if(problems.length)process.exitCode=1;
