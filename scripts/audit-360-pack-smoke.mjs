#!/usr/bin/env node
// Synthetic media QA only: no vehicles, no provenance or reuse certification.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,copyFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'mt-360-audit-'));
const target=join(dir,'frames');
const audit=join(process.cwd(),'scripts/audit-360-pack.mjs');
const validate=()=>spawnSync(process.execPath,[audit,target,'Maruti Ertiga'],{encoding:'utf8'});
try{
 await mkdir(target);
 for(let i=0;i<24;i++){
  // Identifiable artificial color test data, explicitly never vehicle imagery.
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=s=640x360:d=0.1','-vf','hue=h='+String(i*13),'-frames:v','1','-y',join(target,String(i).padStart(3,'0')+'.webp')]);
 }
 assert.equal(validate().status,0,'Complete 24-frame synthetic WebP pack must pass');
 const first=join(target,'000.webp'),second=join(target,'001.webp');
 const good=await readFile(second);
 await copyFile(first,second);
 assert.notEqual(validate().status,0,'Identical duplicate must fail');
 await writeFile(second,good);
 await writeFile(second,Buffer.from('RIFF NOT WEBP'));
 assert.notEqual(validate().status,0,'Corrupted frame must fail');
 await writeFile(second,good);
 await rm(join(target,'023.webp'));
 assert.notEqual(validate().status,0,'Insufficient frame count must fail');
 console.log('PASS 360 asset audit: 24 valid synthetic frames, duplicate, corruption and incomplete pack');
}finally{await rm(dir,{recursive:true,force:true});}
