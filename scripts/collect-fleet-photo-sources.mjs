// Temporary release-evidence collector: download only curated public Commons URLs
// from the default catalog so registration plates can be pixelated in real source
// pixels, not masked by CSS. Never download arbitrary CRM admin URLs here.
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {defaultCatalog} from '../server/catalog.mjs';

const root='artifacts/photo-source-audit';
mkdirSync(root,{recursive:true});
const outcomes=[];
const entries=defaultCatalog.flatMap(v=>[
 {model:v.name,kind:'main',url:v.image},
 ...(v.gallery||[]).map((url,i)=>({model:v.name,kind:'angle-'+(i+1),url}))
]);
function slug(value){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
for(const entry of entries){
 const filename=slug(entry.model)+'-'+entry.kind+'.jpg';
 try{
  const url=new URL(entry.url);
  if(url.protocol!=='https:'||url.hostname!=='commons.wikimedia.org'
   ||!url.pathname.startsWith('/wiki/Special:FilePath/'))throw new Error('Non-curated host');
  const response=await fetch(entry.url,{
   headers:{'User-Agent':'MateshwariTravellers-QA/1.0 (license and privacy asset audit)',
    'Accept':'image/jpeg,image/png,image/webp,image/*'},
   signal:AbortSignal.timeout(20000),redirect:'follow'
  });
  if(!response.ok)throw new Error('HTTP '+response.status);
  const type=response.headers.get('content-type')||'';
  if(!type.startsWith('image/'))throw new Error('Not an image ('+type+')');
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>15_000_000||bytes.length<2000)throw new Error('Invalid size '+bytes.length);
  writeFileSync(join(root,filename),bytes);
  outcomes.push({...entry,file:filename,size:bytes.length,mime:type,downloaded:true});
 }catch(error){
  outcomes.push({...entry,file:filename,downloaded:false,error:String(error).slice(0,220)});
 }
}
writeFileSync(join(root,'manifest.json'),JSON.stringify(outcomes,null,2));
console.log('Image source audit:',outcomes.filter(x=>x.downloaded).length+'/'+outcomes.length,'downloaded');
for(const failure of outcomes.filter(x=>!x.downloaded))console.log('WARN',failure.model,failure.kind,failure.error);
// The artifact is for internal review, not published to site or treated as plate safe.
