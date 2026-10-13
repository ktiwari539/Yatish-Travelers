import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { importReviewedFleetZip, inspectReviewedFleetMedia, REQUIRED_ZIP_SHA256, MEDIA_FILES, SUPPORTED_MODELS } from './fleet-photo-import.mjs';

test('photo import rejects modified or fabricated ZIPs before writing any file',()=>{
 assert.match(REQUIRED_ZIP_SHA256,/^[a-f0-9]{64}$/);
 assert.equal(Object.keys(MEDIA_FILES).length,7);
 assert.deepEqual(Object.keys(SUPPORTED_MODELS).sort(),
   ['Mahindra Thar','Mahindra XUV700','Tempo Traveller'].sort());
 assert.throws(()=>importReviewedFleetZip(''),/approved fleet ZIP/);
 assert.throws(()=>importReviewedFleetZip(Buffer.from('not-the-approved-pack'.repeat(30)).toString('base64')),
   /differs from the reviewed seven-photo pack/);
 const invalidPath='/media/unreviewed-stock.webp';
 assert.ok(!Object.values(SUPPORTED_MODELS).some(x=>x.image===invalidPath||x.gallery.includes(invalidPath)));
});

test('photo readiness rejects a present but tampered asset and checks all three model links',t=>{
 const root=mkdtempSync(join(tmpdir(),'mateshwari-integrity-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const modelEntries=Object.entries(SUPPORTED_MODELS);
 const vehicles=modelEntries.map(([name,photos])=>({name,...photos}));
 const first=inspectReviewedFleetMedia({root,vehicles});
 assert.equal(first.ready,false);
 assert.equal(first.installed,0);
 assert.equal(first.missing.length,7);
 assert.equal(first.invalid.length,0);
 assert.equal(first.catalogApplied,true);
 const file=join(root,Object.keys(MEDIA_FILES)[0]);
 mkdirSync(dirname(file),{recursive:true});
 writeFileSync(file,Buffer.from('unapproved-image-bytes'));
 const second=inspectReviewedFleetMedia({root,vehicles});
 assert.equal(second.ready,false,'A file existing at the approved path is not approval');
 assert.equal(second.installed,0);
 assert.equal(second.invalid.length,1);
 assert.equal(second.missing.length,6);
 const mismatched=inspectReviewedFleetMedia({root,vehicles:vehicles.map(v=>
   v.name==='Mahindra Thar'?{...v,gallery:[]}:v)});
 assert.equal(mismatched.catalogApplied,false,'Alternate angles must also match reviewed pack');
 assert.equal(mismatched.modelLinks.find(v=>v.name==='Mahindra Thar').matches,false);
});
