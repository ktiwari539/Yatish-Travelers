import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {validateRuntime} from './runtime.mjs';
import {snapshot} from '../scripts/crm-backup.mjs';

test('production startup refuses weak secrets and paths outside durable root',()=>{
 assert.throws(()=>validateRuntime({NODE_ENV:'production'}),/CRM_ADMIN_TOKEN/);
 assert.throws(()=>validateRuntime({NODE_ENV:'production',CRM_ADMIN_TOKEN:'x'.repeat(40),CRM_STORAGE_ROOT:'/tmp',CRM_DATA_FILE:'/elsewhere'}),/CRM_DATA_FILE/);
});
test('synthetic enquiry, quotation, confirmation, media and catalog survive restart and verified restore',async(t)=>{
 const root=mkdtempSync(join(tmpdir(),'mt-recovery-')),data=join(root,'data'),media=join(root,'media');
 mkdirSync(data);mkdirSync(media);
 const token='synthetic-test-only-'+'x'.repeat(32);
 const env={...process.env,NODE_ENV:'production',CRM_PORT:'0',CRM_ADMIN_TOKEN:token,CRM_STORAGE_ROOT:data,CRM_DATA_FILE:join(data,'enquiries.jsonl'),CRM_EVENTS_FILE:join(data,'events.jsonl'),CRM_NOTIFICATIONS_FILE:join(data,'notifications.jsonl'),CRM_CATALOG_FILE:join(data,'catalog.json'),CRM_UPLOADS_DIR:join(data,'uploads'),CRM_MODELS_DIR:join(data,'models'),CRM_NOTIFICATIONS_MODE:'preview'};
 let child;
 t.after(async()=>{if(child&&child.exitCode===null){child.kill();await once(child,'exit');}rmSync(root,{recursive:true,force:true});});
 // Port 0 is requested; announce assigned port for collision-free integration.
 async function start(values=env){
  child=spawn(process.execPath,[resolve('server/crm.mjs')],{env:values,stdio:['ignore','pipe','pipe']});
  let output='';
  const port=await new Promise((done,reject)=>{
   const timer=setTimeout(()=>reject(Error('Startup timed out')),5000);
   child.once('exit',()=>{clearTimeout(timer);reject(Error('CRM exited before startup'));});
   child.stdout.on('data',chunk=>{output+=chunk;const m=output.match(/listening on port (\d+)/);if(m){clearTimeout(timer);done(m[1]);}});
  });
  return 'http://127.0.0.1:'+port;
 }
 async function stop(){child.kill('SIGTERM');await once(child,'exit');child=null;}
 let url=await start();
 const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
 assert.equal((await fetch(url+'/api/admin/enquiries',{headers:{Authorization:'Bearer wrong'}})).status,401);
 for(const body of [null,{name:'Synthetic',phone:'0000000000',mode:'quote',pickup:'A',destination:'B',tripDate:'2026-02-31'}]){
  assert.equal((await fetch(url+'/api/enquiries',{method:'POST',headers,body:JSON.stringify(body)})).status,400);
 }
 const created=await fetch(url+'/api/enquiries',{method:'POST',headers,body:JSON.stringify({name:'Synthetic recovery test',phone:'0000000000',email:'synthetic@example.invalid',mode:'callback',estimatedMin:999999})});
 assert.equal(created.status,201);const {id,delivery}=await created.json();assert.ok(delivery.every(d=>d.status==='preview'));
 assert.equal((await fetch(url+'/api/admin/enquiries/'+id+'/quotation',{method:'POST',headers,body:JSON.stringify({amount:1500,notes:'Synthetic only'})})).status,201);
 assert.equal((await fetch(url+'/api/admin/enquiries/'+id,{method:'PATCH',headers,body:JSON.stringify({status:'confirmed'})})).status,200);
 const photo=Buffer.concat([Buffer.from([255,216,255,224]),Buffer.alloc(300,7)]);
 const image=await (await fetch(url+'/api/admin/images',{method:'POST',headers,body:JSON.stringify({mime:'image/jpeg',data:photo.toString('base64')})})).json();
 const catalog=await (await fetch(url+'/api/admin/catalog',{headers})).json();
 catalog.vehicles[0].rateMin=22;catalog.vehicles[0].rateMax=30;
 assert.equal((await fetch(url+'/api/admin/catalog',{method:'PUT',headers,body:JSON.stringify(catalog)})).status,200);
 await stop();url=await start();
 async function verify(){
  const items=(await (await fetch(url+'/api/admin/enquiries',{headers})).json()).items;
  assert.equal(items.length,1);assert.equal(items[0].id,id);assert.equal(items[0].status,'confirmed');assert.equal(items[0].quote.amount,1500);assert.equal(items[0].estimatedMin,0);
  assert.deepEqual(Buffer.from(await (await fetch(url+image.url)).arrayBuffer()),photo);
  assert.equal((await (await fetch(url+'/api/admin/catalog',{headers})).json()).vehicles[0].rateMin,22);
  assert.ok((await (await fetch(url+'/api/admin/notifications',{headers})).json()).items.length>=5);
 }
 await verify();await stop();
 process.env.CRM_OFFLINE='true';
 const backup=join(root,'backup');snapshot('backup',data,media,backup);
 const restored=join(root,'restored'),restoredMedia=join(root,'restored-media');snapshot('restore',backup,restored,restoredMedia);
 const recovered={...env,CRM_STORAGE_ROOT:restored};for(const key of ['CRM_DATA_FILE','CRM_EVENTS_FILE','CRM_NOTIFICATIONS_FILE','CRM_CATALOG_FILE','CRM_UPLOADS_DIR','CRM_MODELS_DIR'])recovered[key]=env[key].replace(data,restored);
 url=await start(recovered);await verify();await stop();
 writeFileSync(join(backup,'data/enquiries.jsonl'),'tampered');
 assert.throws(()=>snapshot('restore',backup,join(root,'bad'),join(root,'bad-media')),/integrity/);
 delete process.env.CRM_OFFLINE;
});
