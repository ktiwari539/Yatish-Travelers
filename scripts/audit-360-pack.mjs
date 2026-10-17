#!/usr/bin/env node
// Non-mutating technical integrity audit. A PASS is NEVER a rights/visual approval.
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const [folder,model,...extra]=process.argv.slice(2);
if(!folder||!model||extra.length){
 console.error('Usage: node scripts/audit-360-pack.mjs <frame-directory> "<exact catalog model>"');
 process.exit(2);
}
const slug=model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const root=resolve(folder),failures=[],entries=[],hashes=new Map(),dimensions=new Set();
if(!slug)failures.push('Invalid vehicle model');
try{
 const items=await readdir(root,{withFileTypes:true});
 if(items.some(x=>!x.isFile()))failures.push('Pack contains a directory or link');
 if(items.some(x=>x.name.startsWith('.')))failures.push('Pack contains hidden files');
 const names=items.map(x=>x.name).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(names.length<24||names.length>72)failures.push('Expected 24 to 72 frames; received '+names.length);
 if(names.some(x=>!/^[a-zA-Z0-9_-]+\.webp$/.test(x)))failures.push('Frame names must be safe .webp filenames only');
 let canonicalWidth=null,canonicalHeight=null;
 for(const name of names){
  if(!/^[a-zA-Z0-9_-]+\.webp$/.test(name))continue;
  const p=join(root,name);
  const info=await stat(p);
  if(!info.isFile())continue;
  const bytes=await readFile(p);
  if(bytes.length<1024||bytes.length>4*1024*1024)failures.push(name+': unsupported file size '+bytes.length);
  if(bytes.length<30||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'||
    bytes.readUInt32LE(4)+8!==bytes.length){
   failures.push(name+': invalid or incomplete WebP RIFF container');continue;
  }
  const codec=bytes.toString('ascii',12,16);
  let w=null,h=null;
  if(codec==='VP8X'&&bytes.length>=30){
   w=1+bytes.readUIntLE(24,3);h=1+bytes.readUIntLE(27,3);
  }else if(codec==='VP8 '&&bytes.length>=30&&bytes[23]===0x9d&&bytes[24]===0x01&&bytes[25]===0x2a){
   w=bytes.readUInt16LE(26)&0x3fff;h=bytes.readUInt16LE(28)&0x3fff;
  }else if(codec==='VP8L'&&bytes.length>=25&&bytes[20]===0x2f){
   const bits=bytes.readUInt32LE(21);
   w=(bits&0x3fff)+1;h=((bits>>>14)&0x3fff)+1;
  }
  if(!w||!h||w<640||h<360||w>8192||h>8192)failures.push(name+': invalid/unsupported frame dimensions');
  if(w&&h){dimensions.add(w+'x'+h);canonicalWidth??=w;canonicalHeight??=h;}
  // Decode the whole frame, not just the RIFF header. Fail closed if ffmpeg is missing.
  const decoded=spawnSync('ffmpeg',['-v','error','-nostdin','-i',p,'-frames:v','1','-f','null','-'],{encoding:'utf8',timeout:15000});
  if(decoded.error||decoded.status!==0)failures.push(name+': failed image decode: '+String(decoded.error?.message??decoded.stderr??decoded.status).slice(0,160));
  const digest=createHash('sha256').update(bytes).digest('hex');
  if(hashes.has(digest))failures.push(name+': exact duplicate of '+hashes.get(digest));
  hashes.set(digest,name);
  entries.push({name,sha256:digest,bytes:bytes.length,width:w,height:h});
 }
 if(dimensions.size!==1)failures.push('Every frame must have the same valid canvas dimensions');
 if(entries.length!==names.length)failures.push('Not every file could be audited');
}catch(error){failures.push('Cannot audit directory: '+String(error?.message??error));}
const result={model,slug,folder:root,frames:entries.length,dimensions:[...dimensions],checksums:entries,failures,
 technicalStatus:failures.length?'FAIL':'PASS — structural/decode validation only',
 certification:'NOT CERTIFIED: requires documented commercial rights, exact vehicle/trim, true full-orbit visual review, plate redaction in pixels and approved evidence ID'};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
