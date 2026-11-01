import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Readable} from 'node:stream';
import {initializeApp as initializeWeb,deleteApp as deleteWebApp} from 'firebase/app';
import {getAuth as webAuth,connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {Firestore,FieldValue} from 'firebase-admin/firestore';
import {getRuntime} from '../runtime.mjs';
import {createRepository} from '../repository.mjs';
import {createHandler} from '../handler.mjs';
import {exportSnapshot,restoreSnapshot} from '../snapshot.mjs';
const uid='poc-synthetic-admin',password='synthetic-test-password-only-937',email='synthetic-admin@example.invalid';
Object.assign(process.env,{POC_FIREBASE_PROJECT_ID:'demo-mateshwari-poc',POC_ADMIN_UIDS:uid,POC_RATE_SALT:'synthetic-emulator-rate-salt-'.repeat(2)});
const runtime=getRuntime();
if(!runtime.emulator)throw Error('Never run this suite against live Firebase');

test('real Auth/Firestore emulators: SDK login -> HTTP function handler -> idempotency -> quote/status -> rules/revocation -> restore',async t=>{
 await runtime.auth.createUser({uid,email,password,emailVerified:true});
 await runtime.auth.createUser({uid:'poc-unverified',email:'synthetic-unverified@example.invalid',password,emailVerified:false});
 await runtime.auth.createUser({uid:'poc-outsider',email:'synthetic-outsider@example.invalid',password,emailVerified:true});
 const app=initializeWeb({apiKey:'fake-key',projectId:'demo-mateshwari-poc',appId:'demo'},'poc-web-test');
 const auth=webAuth(app);connectAuthEmulator(auth,'http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST,{disableWarnings:true});
 const handle=createHandler(runtime);
 const server=http.createServer(async(req,res)=>{
  const request=new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await handle(request,{ip:'127.0.0.1'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await signOut(auth);await deleteWebApp(app);await new Promise(r=>server.close(r));await runtime.db.terminate();});
 const input={name:'Synthetic emulator guest',phone:'0000000000',email:'synthetic-guest@example.invalid',pickup:'Synthetic station',destination:'Synthetic hotel',tripDate:'2026-12-01',vehicle:'Maruti Ertiga',estimatedMin:999999};
 const post=(key,body=input)=>fetch(base+'/api/poc/enquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});
 const responses=await Promise.all(Array.from({length:5},()=>post('synthetic-idempotency-key-0001')));
 assert.ok(responses.every(r=>r.status===201));const created=await Promise.all(responses.map(r=>r.json()));assert.equal(new Set(created.map(v=>v.id)).size,1);assert.equal(created.filter(v=>!v.replay).length,1);
 const id=created[0].id,url=base+'/api/poc/admin/enquiries/'+id;
 assert.equal((await post('synthetic-idempotency-key-0001',{...input,name:'Changed payload'})).status,409);
 assert.equal((await fetch(url)).status,401);
 for(const address of ['synthetic-unverified@example.invalid','synthetic-outsider@example.invalid']){
  const login=await signInWithEmailAndPassword(auth,address,password);const token=await login.user.getIdToken();assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+token}})).status,401);await signOut(auth);
 }
 const login=await signInWithEmailAndPassword(auth,email,password);const token=await login.user.getIdToken();const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const initial=await (await fetch(url,{headers})).json();assert.equal(initial.status,'new');assert.equal(initial.version,1);assert.equal(initial.estimatedMin,0);assert.match(initial.createdAt,/^\d{4}-/);assert.equal(initial.requestHash,undefined);
 const quote=await fetch(url+'/quotation',{method:'POST',headers,body:JSON.stringify({amount:1500,notes:'Synthetic quote',expectedVersion:1})});assert.equal(quote.status,200);assert.equal((await quote.json()).version,2);
 assert.equal((await fetch(url,{method:'PATCH',headers,body:JSON.stringify({status:'confirmed',expectedVersion:1})})).status,409);
 assert.equal((await fetch(url,{method:'PATCH',headers,body:JSON.stringify({status:'confirmed',expectedVersion:2})})).status,200);
 const list=await fetch(base+'/api/poc/admin/enquiries',{headers});assert.equal(list.status,200);assert.equal((await list.json()).items.length,1);
 // Firebase Admin SDK bypasses rules; test a direct client request independently.
 const direct='http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/demo-mateshwari-poc/databases/(default)/documents/enquiries_poc/'+id;
 assert.equal((await fetch(direct,{headers:{Authorization:'Bearer '+token}})).status,403);
 assert.equal((await fetch(direct)).status,403);
 assert.equal((await fetch(direct+'-forbidden',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({fields:{name:{stringValue:'Blocked synthetic write'}}})})).status,403);
 // Reinitialize the database client to demonstrate persistence beyond client lifetime.
 const restartedDb=new Firestore({projectId:'demo-mateshwari-poc'});const restarted=createRepository(restartedDb,{serverTimestamp:()=>FieldValue.serverTimestamp(),rateSalt:runtime.rateSalt});
 assert.equal((await restarted.get(id)).quote.amount,1500);assert.equal((await restarted.get(id)).status,'confirmed');await restartedDb.terminate();
 // Actual transactions enforce the per-client write cap, independent of fake limits.
 for(let i=1;i<10;i++)assert.equal((await post('synthetic-budget-key-'+String(i).padStart(4,'0'))).status,201);
 assert.equal((await post('synthetic-budget-key-exhausted')).status,429);
 assert.equal((await post('synthetic-idempotency-key-0001')).status,201,'replays do not consume budget');
 const snapshot=await exportSnapshot(runtime);assert.equal(snapshot.records.length,10);
 const corrupt=structuredClone(snapshot);corrupt.records[0].name='Tampered';await assert.rejects(()=>restoreSnapshot(runtime,corrupt),/refused/);
 await assert.rejects(()=>restoreSnapshot(runtime,snapshot),/empty/);
 // Delete only the fixed demo emulator collection after taking the snapshot.
 const batch=runtime.db.batch();for(const doc of (await runtime.db.collection('enquiries_poc').get()).docs)batch.delete(doc.ref);await batch.commit();
 assert.equal(await restoreSnapshot(runtime,snapshot),10);assert.equal((await runtime.repository.get(id)).status,'confirmed');assert.equal((await runtime.repository.get(id)).quote.amount,1500);
 await runtime.auth.updateUser(uid,{disabled:true});assert.equal((await fetch(url,{headers})).status,401);await runtime.auth.updateUser(uid,{disabled:false});
 await new Promise(r=>setTimeout(r,1100));await runtime.auth.revokeRefreshTokens(uid);assert.equal((await fetch(url,{headers})).status,401);
 console.log('Emulator network assertions passed; no live Firebase/Netlify deployment was contacted.');
});
