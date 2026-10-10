import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

async function openPort(){
  const server=net.createServer();
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
test('CRM saves enquiries and protects staff operations',async(t)=>{
  const port=await openPort();
  const directory=mkdtempSync(join(tmpdir(),'mt-crm-test-'));
  const secret='local-admin-test-token';
  const child=spawn(process.execPath,[resolve('server/crm.mjs')],{
    env:{...process.env,CRM_PORT:String(port),CRM_DATA_FILE:join(directory,'records.jsonl'),CRM_ADMIN_TOKEN:secret},
    stdio:'ignore'
  });
  t.after(()=>{child.kill('SIGTERM');rmSync(directory,{recursive:true,force:true});});
  const root='http://127.0.0.1:'+port;
  let healthy=false;
  for(let i=0;i<40;i++){
    try{const r=await fetch(root+'/api/health');healthy=r.ok;if(healthy)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.equal(healthy,true,'CRM server should start');
  const unauth=await fetch(root+'/api/admin/enquiries');
  assert.equal(unauth.status,401);
  const invalid=await fetch(root+'/api/enquiries',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'A',phone:'??'})});
  assert.equal(invalid.status,400);
  const request=await fetch(root+'/api/enquiries',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      name:'Example Guest',phone:'9876543210',mode:'quote',
      pickup:'Jaipur',destination:'Udaipur',tripDate:'2026-12-02',vehicle:'Toyota Innova',
      passengers:4,days:2,distanceKm:410,estimatedMin:6150,estimatedMax:10250
    })});
  assert.equal(request.status,201);
  const {id}=await request.json();
  assert.match(id,/^[0-9a-f-]{36}$/);
  const headers={Authorization:'Bearer '+secret,'Content-Type':'application/json'};
  const list=await fetch(root+'/api/admin/enquiries',{headers});
  assert.equal(list.status,200);
  const before=await list.json();
  assert.equal(before.items.length,1);
  assert.equal(before.items[0].status,'new');
  assert.equal(before.items[0].pickup,'Jaipur');
  const patch=await fetch(root+'/api/admin/enquiries/'+id,{method:'PATCH',headers,body:JSON.stringify({status:'quoted'})});
  assert.equal(patch.status,200);
  const refreshed=await (await fetch(root+'/api/admin/enquiries',{headers})).json();
  assert.equal(refreshed.items[0].status,'quoted');
  const summary=await (await fetch(root+'/api/admin/summary',{headers})).json();
  assert.equal(summary.total,1);
  assert.equal(summary.byStatus.quoted,1);
});
