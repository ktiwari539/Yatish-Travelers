import test from 'node:test';
import assert from 'node:assert/strict';
import { importReviewedFleetZip, REQUIRED_ZIP_SHA256, MEDIA_FILES, SUPPORTED_MODELS } from './fleet-photo-import.mjs';

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
