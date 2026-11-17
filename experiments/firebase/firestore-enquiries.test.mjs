import test from 'node:test';
import assert from 'node:assert/strict';
import {createFirestoreEnquiryRepository} from './firestore-enquiries.mjs';

function fakeFirestore(){
 const docs=new Map();
 return {collection(name){
  assert.equal(name,'enquiries_poc');
  return {doc(id){return {
   async create(value){if(docs.has(id))throw Error('duplicate');docs.set(id,structuredClone(value));},
   async get(){return docs.has(id)?{exists:true,data:()=>structuredClone(docs.get(id))}:{exists:false};}
  };}};
 }};
}

test('synthetic enquiry persists and can be retrieved',async()=>{
 const repo=createFirestoreEnquiryRepository(fakeFirestore(),{
  id:()=> '00000000-0000-4000-a000-000000000001',
  now:()=>new Date('2026-11-01T00:00:00.000Z')
 });
 const created=await repo.create({name:'Test Person',phone:'9999999999',pickup:'Station',vehicle:'Maruti Ertiga',destination:'Hotel'});
 assert.deepEqual(created,{id:'00000000-0000-4000-a000-000000000001',status:'new'});
 const record=await repo.get(created.id);
 assert.equal(record.name,'Test Person');
 assert.equal(record.createdAt,'2026-11-01T00:00:00.000Z');
 assert.equal(record.status,'new');
 await assert.rejects(()=>repo.create({name:'Test Person',phone:'9999999999',pickup:'Station'}),/duplicate/);
});
test('invalid enquiries are rejected without writes',async()=>{
 const repo=createFirestoreEnquiryRepository(fakeFirestore());
 await assert.rejects(()=>repo.create({name:'',phone:'abc',pickup:''}),/Invalid enquiry fields/);
 await assert.rejects(()=>repo.create(null),/Invalid enquiry/);
 await assert.rejects(()=>repo.get('../admin'),/Invalid id/);
});
