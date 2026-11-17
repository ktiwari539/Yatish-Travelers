import test from 'node:test';
import assert from 'node:assert/strict';
import {getRuntime} from '../runtime.mjs';
Object.assign(process.env,{POC_FIREBASE_PROJECT_ID:'demo-mateshwari-poc',POC_ADMIN_UIDS:'poc-synthetic-admin',POC_RATE_SALT:'synthetic-emulator-rate-salt-'.repeat(2)});
test('Firebase CLI emulator process restart/import preserves synthetic enquiries, quotes, status and Auth user',async()=>{
 const runtime=getRuntime();assert.equal(runtime.emulator,true);
 try{
  const {items}=await runtime.repository.list();assert.equal(items.length,10);
  const confirmed=items.find(r=>r.status==='confirmed');assert.ok(confirmed);assert.equal(confirmed.quote.amount,1500);assert.equal(confirmed.version,3);
  assert.equal((await runtime.auth.getUser('poc-synthetic-admin')).emailVerified,true);
 }finally{await runtime.db.terminate();}
});
