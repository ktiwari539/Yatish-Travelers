import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync,mkdirSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { applyReviewedFleetMedia,defaultCatalog,validateVehicle } from './catalog.mjs';

const names=[
 'mt-xuv700-driving.webp','mt-xuv700-studio.webp',
 'mt-thar-red-front.webp','mt-thar-red-rear.webp',
 'mt-thar-grey-road.webp','mt-thar-grey-front-safe.webp',
 'mt-traveller-safe.webp'
];

test('reviewed fleet photos install only for the right models and preserve staff data',t=>{
 const dir=mkdtempSync(join(tmpdir(),'mt-fleet-photos-'));
 t.after(()=>rmSync(dir,{force:true,recursive:true}));
 const original=defaultCatalog.map(v=>({...v}));
 const notInstalled=applyReviewedFleetMedia(original,dir);
 for(const name of ['Mahindra Thar','Mahindra XUV700','Tempo Traveller']){
  const before=original.find(v=>v.name===name);
  const after=notInstalled.find(v=>v.name===name);
  assert.notEqual(after.image,before.image,'Never expose old registration-plate photos without safe pack');
  assert.ok(after.image.startsWith('/media/mt-'),'Show only the named safe image path');
  assert.deepEqual(after.gallery,[],'No unverified alternate-angle fallback');
 }
 for(const name of names){
  const p=join(dir,'media',name);
  mkdirSync(dirname(p),{recursive:true});
  writeFileSync(p,'photo-fixture');
 }
 const upgraded=applyReviewedFleetMedia(original,dir);
 assert.equal(upgraded.length,10);
 const get=name=>upgraded.find(v=>v.name===name);
 assert.equal(get('Mahindra Thar').image,'/media/mt-thar-red-front.webp');
 assert.equal(get('Mahindra Thar').gallery.length,3);
 assert.ok(get('Mahindra Thar').gallery.every(url=>url.includes('thar-')));
 assert.equal(get('Mahindra XUV700').image,'/media/mt-xuv700-driving.webp');
 assert.deepEqual(get('Mahindra XUV700').gallery,['/media/mt-xuv700-studio.webp']);
 assert.equal(get('Tempo Traveller').image,'/media/mt-traveller-safe.webp');
 assert.equal(get('Toyota Innova').image,original.find(v=>v.name==='Toyota Innova').image);
 assert.equal(new Set(upgraded.map(v=>v.image)).size,upgraded.length);
 const custom=original.map(v=>v.name==='Mahindra Thar'
  ?{...v,image:'https://example.com/approved-thar.webp',rateMin:45,enabled:false}
  :v.name==='Mahindra XUV700'
    ?{...v,gallery:['https://example.com/custom-angle.webp']}
    :v);
 const preserved=applyReviewedFleetMedia(custom,dir);
 const thar=preserved.find(v=>v.name==='Mahindra Thar');
 const xuv=preserved.find(v=>v.name==='Mahindra XUV700');
 assert.equal(thar.image,'https://example.com/approved-thar.webp');
 assert.equal(thar.rateMin,45);
 assert.equal(thar.enabled,false);
 assert.deepEqual(xuv.gallery,['https://example.com/custom-angle.webp']);
 assert.equal(xuv.image,'/media/mt-xuv700-driving.webp');
 assert.ok(validateVehicle({...get('Mahindra Thar')}).image.includes('mt-thar-red-front'));
 assert.throws(()=>validateVehicle({...get('Mahindra Thar'),image:'/media/unknown.webp'}),/valid HTTPS image URL/);
});

test('partially installed photo pack never mixes old and new angles',t=>{
 const dir=mkdtempSync(join(tmpdir(),'mt-partial-photos-'));
 t.after(()=>rmSync(dir,{force:true,recursive:true}));
 const p=join(dir,'media','mt-xuv700-driving.webp');
 mkdirSync(dirname(p),{recursive:true});writeFileSync(p,'image');
 const originals=defaultCatalog.map(v=>({...v}));
 const actual=applyReviewedFleetMedia(originals,dir);
 assert.equal(actual.find(v=>v.name==='Mahindra XUV700').image,'/media/mt-xuv700-driving.webp');
 assert.deepEqual(actual.find(v=>v.name==='Mahindra XUV700').gallery,[]);
});
