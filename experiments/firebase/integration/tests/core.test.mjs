import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig} from '../runtime.mjs';
import {normalize} from '../repository.mjs';
import {createHandler} from '../handler.mjs';
import entry,{config} from '../netlify/functions/poc.mjs';
const env={POC_FIREBASE_PROJECT_ID:'demo-mateshwari-poc',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',POC_ADMIN_UIDS:'synthetic-staff',POC_RATE_SALT:'synthetic-only-rate-salt-'.repeat(2)};
test('runtime refuses production, partial emulators and unconfigured staging',()=>{
 assert.equal(validateConfig(env).emulator,true);
 for(const overrides of [{CONTEXT:'production'},{NETLIFY:'true'},{FIREBASE_AUTH_EMULATOR_HOST:''},{POC_FIREBASE_PROJECT_ID:'mateshwari-travellers'},{POC_ADMIN_UIDS:''},{POC_RATE_SALT:''},{FIRESTORE_EMULATOR_HOST:'remote:8080'}])assert.throws(()=>validateConfig({...env,...overrides}));
 assert.throws(()=>validateConfig({...env,FIRESTORE_EMULATOR_HOST:'',FIREBASE_AUTH_EMULATOR_HOST:''}));
 assert.equal(validateConfig({CONTEXT:'deploy-preview',POC_ENABLE_STAGING:'true',POC_PROJECT_PURPOSE:'development-only',POC_FIREBASE_PROJECT_ID:'mateshwari-poc-staging',POC_ADMIN_UIDS:'staging-only',POC_RATE_SALT:env.POC_RATE_SALT}).emulator,false);
 const owner={CONTEXT:'deploy-preview',POC_ENABLE_STAGING:'true',POC_PROJECT_PURPOSE:'development-only',POC_FIREBASE_PROJECT_ID:'mateshwari-travellers',POC_ADMIN_UIDS:'ejz9iejTasZMZSEc5nKnh7npNk72',POC_RATE_SALT:env.POC_RATE_SALT};
 assert.equal(validateConfig(owner).emulator,false);
 assert.deepEqual(validateConfig({...owner,POC_ADMIN_UIDS:''}).allowedUids,['ejz9iejTasZMZSEc5nKnh7npNk72']);
 assert.throws(()=>validateConfig({...owner,POC_ADMIN_UIDS:'someone-else'}));assert.throws(()=>validateConfig({...owner,POC_PROJECT_PURPOSE:''}));
});
test('normalization rejects malformed fields and does not accept client pricing/status',()=>{
 const value=normalize({name:'Synthetic',phone:'0000000000',mode:'callback',estimatedMin:99999,status:'confirmed'});
 assert.equal(value.estimatedMin,0);assert.equal(value.status,undefined);
 for(const body of [null,[],{}, {name:'Synthetic',phone:'0000000000',mode:'callback',days:Infinity},{name:'Synthetic',phone:'0000000000',pickup:'A',destination:'B',tripDate:'2026-02-31'}])assert.throws(()=>normalize(body));
});
test('HTTP boundary limits body, rejects missing authorization, never routes real API',async()=>{
 const handle=createHandler({emulator:true,authorize:async()=>false,repository:{create:async()=>({id:'fixture'})}});
 assert.equal((await handle(new Request('https://fixture.invalid/api/enquiries'))).status,404);
 assert.equal((await handle(new Request('https://fixture.invalid/api/poc/admin/enquiries'))).status,401);
 assert.equal((await handle(new Request('https://fixture.invalid/api/poc/admin/session'))).status,401);
 const post=(body,type='application/json')=>handle(new Request('https://fixture.invalid/api/poc/enquiries',{method:'POST',headers:{'Content-Type':type},body}),{ip:'synthetic'});
 assert.equal((await post(' '.repeat(8193))).status,413);assert.equal((await post('broken')).status,400);assert.equal((await post('{}','text/plain')).status,415);
 assert.equal((await post('null')).status,422);
 const response=await handle(new Request('https://fixture.invalid/api/poc/health'));assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
});
test('real function entry fails closed without configuration and exposes only POC path',async()=>{
 const response=await entry(new Request('https://fixture.invalid/api/poc/health'),{});assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'POC_NOT_CONFIGURED'});
 assert.equal(config.path,'/api/poc/*');assert.equal(config.rateLimit.aggregateBy,'ip');
});
