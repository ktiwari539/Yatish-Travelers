/**
 * Isolated Firestore contract experiment; not wired into production.
 * Firestore client is injected so unit tests run without credentials or charges.
 */
import {randomUUID} from 'node:crypto';

const safeString=(value,max=300)=>typeof value==='string'?value.trim().slice(0,max):'';
const collection='enquiries_poc';

export function createFirestoreEnquiryRepository(firestore,{now=()=>new Date(),id=()=>randomUUID()}={}){
 if(!firestore?.collection)throw new Error('Firestore connection required');
 const ref=firestore.collection(collection);
 return {
  async create(input){
   if(!input||typeof input!=='object')throw new TypeError('Invalid enquiry');
   const name=safeString(input.name,100),phone=safeString(input.phone,30);
   const vehicle=safeString(input.vehicle,100),pickup=safeString(input.pickup,200);
   if(!name||!/^\+?[0-9\s()-]{7,20}$/.test(phone)||!pickup)throw new TypeError('Invalid enquiry fields');
   const key=id();
   const record={id:key,name,phone,vehicle,pickup,destination:safeString(input.destination,200),
      date:safeString(input.date,30),status:'new',createdAt:now().toISOString()};
   await ref.doc(key).create(record); // Firestore atomic create rejects duplicate document IDs.
   return {id:key,status:'new'};
  },
  async get(idValue){
   if(typeof idValue!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(idValue))throw new TypeError('Invalid id');
   const snap=await ref.doc(idValue).get();
   return snap.exists?snap.data():null;
  }
 };
}
