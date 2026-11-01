import test from 'node:test';
import assert from 'node:assert/strict';
import {createPocHandler} from './poc-http.mjs';

const fake=()=>{
 const items=new Map();
 return {collection:()=>({doc:id=>({
  create:async v=>{if(items.has(id))throw Error('duplicate');items.set(id,v);},
  get:async()=>({exists:items.has(id),data:()=>items.get(id)})
 })})};
};
const make=()=>createPocHandler({firestore:fake(),verifyAdminToken:token=>token==='Bearer test-only-token',
 clock:{id:()=> '00000000-0000-4000-a000-000000000001',now:()=>new Date('2026-11-01T00:00:00Z')}});
test('synthetic booking -> authenticated retrieval',async()=>{
 const handle=make();
 const submit=await handle(new Request('https://example.invalid/api/poc/enquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Synthetic',phone:'9999999999',pickup:'Station'})}));
 assert.equal(submit.status,201);
 const {id}=await submit.json();
 const url='https://example.invalid/api/poc/admin/enquiries/'+id;
 assert.equal((await handle(new Request(url))).status,401);
 const approved=await handle(new Request(url,{headers:{authorization:'Bearer test-only-token'}}));
 assert.equal(approved.status,200);
 assert.equal((await approved.json()).name,'Synthetic');
});
test('request validation and isolated paths',async()=>{
 const handler=make(),url='https://example.invalid/api/poc/enquiries';
 assert.equal((await handler(new Request(url,{method:'POST',body:'{}'}))).status,415);
 assert.equal((await handler(new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:'broken'}))).status,400);
 assert.equal((await handler(new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:'{}'}))).status,422);
 assert.equal((await handler(new Request('https://example.invalid/api/enquiries'))).status,404);
 assert.equal((await handler(new Request('https://example.invalid/api/poc/health'))).status,200);
});
