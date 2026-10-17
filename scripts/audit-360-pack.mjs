#!/usr/bin/env node
// Read-only preflight for an operator-approved photographic 360 frame pack.
// Never installs assets, changes the registry or certifies legal/visual rights.
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,basename,join} from 'node:path';
import {createHash} from 'node:crypto';
const [folder,model,...extra]=process.argv.slice(2);
if(!folder||!model||extra.length){
 console.error('Usage: node scripts/audit-360-pack.mjs <frame-directory> "<exact catalog model>"');
 process.exit(2);
}
const slug=model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const root=resolve(folder);
const failures=[];
const items=(await readdir(root,{withFileTypes:true})).filter(x=>!x.name.startsWith('.'));
if(items.some(x=>!x.isFile()))failures.push('Pack must contain only plain frame files');
const names=items.map(x=>x.name).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
if(names.length<24||names.length>72)failures.push('Expected 24 to 72 frames, got '+names.length);
if(names.some(x=>!/^[a-zA-Z0-9_-]+\.webp$/.test(x)))failures.push('Unexpected/non-WebP filename');
const hashes=new Map(),sizes=new Map(),entries=[];
for(const name of names){
 const path=join(root,name);
 const s=await stat(path);
 if(s.size>4*1024*1024||s.size<1024)failures.push(name+': unexpected frame size ('+s.size+' bytes)');
 const bytes=await readFile(path);
 // WebP RIFF container: metadata/bitstream needs separate decode review.
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')failures.push(name+': invalid WebP signature');
 const hash=createHash('sha256').update(bytes).digest('hex');
 if(hashes.has(hash))failures.push(name+': duplicate bytes of '+hashes.get(hash));
 hashes.set(hash,name);
 entries.push({name,sha256:hash,bytes:s.size});
 // VP8X extended WebP carries canvas size at bytes 24..29.
 if(bytes.toString('ascii',12,16)==='VP8X'&&bytes.length>=30){
  const w=1+bytes.readUIntLE(24,3),h=1+bytes.readUIntLE(27,3);
  sizes.set(name,w+'x'+h);
 }
}
if(sizes.size&&new Set(sizes.values()).size>1)failures.push('Inconsistent WebP canvas dimensions');
const summary={model,slug,folder:root,frames:entries.length,bytes:entries.reduce((a,b)=>a+b.bytes,0),
 dimensions:sizes.size===names.length?[...new Set(sizes.values())][0]:'Not verified for all files',
 checksums:entries,failures,approval:'NOT CERTIFIED — requires written rights, exact model/trim, full 360 visual orbit, frame-by-frame plate/background review and owner approval'};
console.log(JSON.stringify(summary,null,2));
if(failures.length)process.exitCode=1;
