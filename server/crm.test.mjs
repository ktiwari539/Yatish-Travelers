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
    env:{...process.env,CRM_PORT:String(port),CRM_DATA_FILE:join(directory,'records.jsonl'),CRM_EVENTS_FILE:join(directory,'events.jsonl'),CRM_CATALOG_FILE:join(directory,'catalog.json'),CRM_UPLOADS_DIR:join(directory,'uploads'),CRM_ADMIN_TOKEN:secret},
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
  const publicCatalog=await fetch(root+'/api/catalog');
  assert.equal(publicCatalog.status,200);
  const catalog=await publicCatalog.json();
  assert.equal(catalog.vehicles.length,6);
  assert.equal(catalog.vehicles.find(v=>v.name==='Toyota Innova').rateMin,15);

  const forbidden=await fetch(root+'/api/admin/catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({vehicles:[]})});
  assert.equal(forbidden.status,401);

  const modified=catalog.vehicles.map(v=>v.name==='Toyota Innova'?{...v,rateMin:21,rateMax:34}:v);
  modified.push({name:'New Premium Example',seats:'4+1',capacity:4,tag:'On request',category:'Premium',image:'https://example.org/vehicle.jpg',rateMin:40,rateMax:60,enabled:true});
  const saved=await fetch(root+'/api/admin/catalog',{method:'PUT',headers,body:JSON.stringify({vehicles:modified})});
  assert.equal(saved.status,200);
  const reloaded=await (await fetch(root+'/api/catalog')).json();
  assert.equal(reloaded.vehicles.length,7);
  assert.equal(reloaded.vehicles.find(v=>v.name==='Toyota Innova').rateMin,21);
  
  const event=await fetch(root+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'quote_open',sessionId:'f5e4a111-2222-4444-8888-1234567890ab',vehicle:'Toyota Innova',source:'hero'})});
  assert.equal(event.status,202);
  const metrics=await (await fetch(root+'/api/admin/engagement',{headers})).json();
  assert.equal(metrics.counts.quote_open,1);
  assert.ok(metrics.counts.quote_submit>=1);

  const second=await fetch(root+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      name:'Second Guest',phone:'9340098177',mode:'quote',pickup:'Jaipur',destination:'Ajmer',tripDate:'2026-12-05',
      vehicle:'Toyota Innova',passengers:3,days:1,distanceKm:250,estimatedMin:1,estimatedMax:2
    })});
  assert.equal(second.status,201);
  const newList=await (await fetch(root+'/api/admin/enquiries',{headers})).json();
  const entry=newList.items.find(x=>x.name==='Second Guest');
  assert.equal(entry.estimatedMin,250*21);
  assert.equal(entry.estimatedMax,250*34);

  const image=Buffer.concat([Buffer.from([255,216,255,224]),Buffer.alloc(300,7)]);
  const upload=await fetch(root+'/api/admin/images',{method:'POST',headers,body:JSON.stringify({mime:'image/jpeg',data:image.toString('base64')})});
  assert.equal(upload.status,201);
  const uploadBody=await upload.json();
  assert.match(uploadBody.url,/^\/api\/uploads\/[0-9a-f-]{36}\.jpg$/);
  const picture=await fetch(root+uploadBody.url);
  assert.equal(picture.status,200);
  assert.equal(picture.headers.get('content-type'),'image/jpeg');
  const updatedWithPhoto=reloaded.vehicles.map((v,i)=>i===0?{...v,image:uploadBody.url}:v);
  const catalogWithPhoto=await fetch(root+'/api/admin/catalog',{method:'PUT',headers,body:JSON.stringify({vehicles:updatedWithPhoto})});
  assert.equal(catalogWithPhoto.status,200);

});
