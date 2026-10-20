import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { studioReviewSources } from './studio-review-sources.mjs';

const dir=resolve('.data/studio-review');
const isJpeg=bytes=>bytes.length>100_000&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={status:'LOCAL_PREVIEW_ONLY',productionApproved:false,plateSafetyApproved:false,images:[]};
mkdirSync(dir,{recursive:true});
for(const source of studioReviewSources){
 const filename=resolve(dir,source.file);
 let buf;
 if(existsSync(filename)){
  buf=readFileSync(filename);
  if(!isJpeg(buf)){
   console.warn('[studio] Existing '+source.file+' is invalid; leaving it untouched for manual inspection.');
   continue;
  }
 }else{
  const src='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(source.commonsFile)+'?width=1600';
  try{
   const response=await fetch(src,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'MateshwariStudioLocalImageReview/1.0 (licensed-image attribution review)'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(!String(response.headers.get('content-type')).toLowerCase().includes('image/jpeg'))throw Error('Not a JPEG');
   const data=new Uint8Array(await response.arrayBuffer());
   if(data.length>10_000_000||!isJpeg(data))throw Error('Invalid or oversized image');
   const temp=filename+'.partial';
   writeFileSync(temp,data,{flag:'wx'});
   renameSync(temp,filename);
   buf=data;
   console.log('[studio] Stored source photograph: '+source.model+' / '+source.file);
  }catch(error){
   rmSync(filename+'.partial',{force:true});
   console.warn('[studio] Could not cache '+source.model+': '+(error instanceof Error?error.message:String(error)));
   continue;
  }
 }
 manifest.images.push({
  model:source.model,file:source.file,sha256:digest(buf),
  bytes:buf.length,source:source.source,credit:source.credit,
  license:source.license,licenseUrl:source.rights,
  reviewRequired:['plate-privacy','correct-vehicle-model','release-asset-approval']
 });
}
writeFileSync(resolve(dir,'sources.json'),JSON.stringify(manifest,null,2)+'\n');
const complete=manifest.images.length===studioReviewSources.length;
console.log('[studio] '+manifest.images.length+'/'+studioReviewSources.length+' originals stored in .data/studio-review (NOT production public assets).');
if(!complete)process.exitCode=1;
