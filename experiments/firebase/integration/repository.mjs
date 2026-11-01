import {createHash,createHmac} from 'node:crypto';
export class PocError extends Error {constructor(code,status){super(code);this.code=code;this.status=status;}}
const fail=()=>{throw new PocError('INVALID_FIELDS',422);};
const str=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export const validId=id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id);
const digest=value=>createHash('sha256').update(value).digest('hex');
export function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const name=str(input.name,100),phone=str(input.phone,24),mode=['quote','callback','corporate'].includes(input.mode)?input.mode:'quote';
 const pickup=str(input.pickup,200),destination=str(input.destination,200),tripDate=str(input.tripDate,10),email=str(input.email,180);
 if(name.length<2||!/^\+?[0-9 ()-]{8,24}$/.test(phone))fail();
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail();
 if(mode!=='callback'&&(!pickup||!destination||!tripDate))fail();
 if(tripDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)||!Number.isFinite(Date.parse(tripDate))||new Date(tripDate).toISOString().slice(0,10)!==tripDate))fail();
 const num=(key,min,max,defaultValue)=>{const n=input[key]===undefined?defaultValue:Number(input[key]);if(!Number.isFinite(n)||!Number.isInteger(n)||n<min||n>max)fail();return n;};
 return {name,phone,email,mode,pickup,destination,tripDate,vehicle:str(input.vehicle,100),notes:str(input.notes,1000),tripType:str(input.tripType,70),passengers:num('passengers',1,40,1),days:num('days',1,90,1),distanceKm:num('distanceKm',0,100000,0),nightStay:input.nightStay===true,estimatedMin:0,estimatedMax:0,source:'isolated-firebase-poc'};
}
const serialize=data=>{
 if(!data)return null;
 const out={...data};delete out.requestHash;
 for(const key of ['createdAt','updatedAt'])if(out[key]?.toDate)out[key]=out[key].toDate().toISOString();
 if(out.quote?.createdAt?.toDate)out.quote={...out.quote,createdAt:out.quote.createdAt.toDate().toISOString()};
 return out;
};
export function createRepository(db,{serverTimestamp,rateSalt,now=()=>Date.now()}={}){
 if(typeof serverTimestamp!=='function'||!rateSalt)throw Error('Timestamp and rate configuration required');
 const collection=db.collection('enquiries_poc');
 return {
  async create(input,key,ip){
   if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw new PocError('IDEMPOTENCY_KEY_REQUIRED',400);
   if(!ip||typeof ip!=='string'||ip.length>100)throw new PocError('CLIENT_CONTEXT_REQUIRED',503);
   const value=normalize(input),requestHash=digest(JSON.stringify(value)),id=digest('poc-enquiry:'+key),ref=collection.doc(id);
   const current=now(),day=new Date(current).toISOString().slice(0,10),window=Math.floor(current/600000);
   const limits=collection.doc('_control').collection('limits');
   const daily=limits.doc('day-'+day),client=limits.doc('ip-'+createHmac('sha256',rateSalt).update(ip).digest('hex'));
   const replay=await db.runTransaction(async tx=>{
    const existing=await tx.get(ref);
    if(existing.exists){if(existing.data().requestHash!==requestHash)throw new PocError('IDEMPOTENCY_CONFLICT',409);return true;}
    const [dailySnap,clientSnap]=await Promise.all([tx.get(daily),tx.get(client)]);
    const count=dailySnap.data()?.count||0,previous=clientSnap.data();
    const hits=previous?.window===window?previous.count:0;
    if(count>=100||hits>=10)throw new PocError('POC_BUDGET_EXHAUSTED',429);
    tx.set(daily,{count:count+1});tx.set(client,{window,count:hits+1});
    tx.create(ref,{...value,id,type:'enquiry',requestHash,status:'new',version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    return false;
   });
   return {id,status:'new',delivery:[],replay};
  },
  async get(id){if(!validId(id))throw new PocError('INVALID_ID',400);const doc=await collection.doc(id).get();return doc.exists?serialize(doc.data()):null;},
  async list(){const snap=await collection.orderBy('createdAt','desc').limit(20).get();return {items:snap.docs.map(doc=>serialize(doc.data())),limit:20};},
  async update(id,input,kind){
   if(!validId(id)||!Number.isInteger(input?.expectedVersion))throw new PocError('EXPECTED_VERSION_REQUIRED',400);
   const statuses=['new','contacted','quoted','confirmed','closed'];
   if(kind==='status'&&!statuses.includes(input.status))throw new PocError('INVALID_STATUS',422);
   if(kind==='quotation'&&(!Number.isFinite(input.amount)||input.amount<=0||input.amount>10000000))throw new PocError('INVALID_AMOUNT',422);
   await db.runTransaction(async tx=>{
    const ref=collection.doc(id),snap=await tx.get(ref);
    if(!snap.exists)throw new PocError('NOT_FOUND',404);
    const current=snap.data();if(current.version!==input.expectedVersion)throw new PocError('VERSION_CONFLICT',409);
    tx.update(ref,{version:current.version+1,updatedAt:serverTimestamp(),...(kind==='status'?{status:input.status}:{status:'quoted',quote:{amount:input.amount,notes:str(input.notes,900),createdAt:serverTimestamp()}})});
   });
   return this.get(id);
  }
 };
}
