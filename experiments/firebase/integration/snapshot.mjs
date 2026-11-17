import {createHash} from 'node:crypto';
import {Timestamp} from 'firebase-admin/firestore';
import {validId} from './repository.mjs';
const hash=records=>createHash('sha256').update(JSON.stringify(records)).digest('hex');
// Emulator-only rehearsal; not Firestore managed backups or production DR.
export async function exportSnapshot(runtime){
 if(!runtime.emulator)throw Error('Snapshot rehearsal requires emulators');
 const snapshot=await runtime.db.collection('enquiries_poc').limit(101).get();
 if(snapshot.size>100)throw Error('POC export bound exceeded');
 const records=snapshot.docs.map(doc=>{
  const value=doc.data();for(const k of ['createdAt','updatedAt'])value[k]=value[k].toDate().toISOString();
  if(value.quote)value.quote={...value.quote,createdAt:value.quote.createdAt.toDate().toISOString()};return value;
 });
 return {format:1,projectId:runtime.projectId,collection:'enquiries_poc',records,sha256:hash(records)};
}
export async function restoreSnapshot(runtime,snapshot){
 if(!runtime.emulator||snapshot.format!==1||snapshot.projectId!==runtime.projectId||snapshot.collection!=='enquiries_poc'||!Array.isArray(snapshot.records)||snapshot.records.length>100||hash(snapshot.records)!==snapshot.sha256)throw Error('Snapshot refused');
 const collection=runtime.db.collection('enquiries_poc');if(!(await collection.limit(1).get()).empty)throw Error('Restore requires empty collection');
 const batch=runtime.db.batch(),ids=new Set();
 for(const record of snapshot.records){
  if(!validId(record.id)||ids.has(record.id)||record.type!=='enquiry')throw Error('Invalid snapshot record');ids.add(record.id);
  const value={...record};for(const k of ['createdAt','updatedAt'])value[k]=Timestamp.fromDate(new Date(value[k]));
  if(value.quote)value.quote={...value.quote,createdAt:Timestamp.fromDate(new Date(value.quote.createdAt))};
  batch.create(collection.doc(value.id),value);
 }
 await batch.commit();return snapshot.records.length;
}
