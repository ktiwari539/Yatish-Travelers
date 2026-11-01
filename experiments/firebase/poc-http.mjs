import {createFirestoreEnquiryRepository} from './firestore-enquiries.mjs';

/** Netlify-compatible HTTP handler factory. Inject database and authentication;
 * never load credentials in browser code or turn this on without real IAM tests. */
export function createPocHandler({firestore,verifyAdminToken,clock}){
 const enquiries=createFirestoreEnquiryRepository(firestore,clock||{});
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
 return async function handle(request){
  const path=new URL(request.url).pathname;
  if(path==='/api/poc/health'&&request.method==='GET')return json({ok:true,mode:'isolated-poc'});
  if(path==='/api/poc/enquiries'&&request.method==='POST'){
   const contentType=request.headers.get('content-type')||'';
   if(!contentType.toLowerCase().startsWith('application/json'))return json({error:'JSON required'},415);
   const length=Number(request.headers.get('content-length')||'0');
   if(!Number.isFinite(length)||length>8192)return json({error:'Request too large'},413);
   let input;
   try{
    const raw=await request.text();
    if(Buffer.byteLength(raw,'utf8')>8192)return json({error:'Request too large'},413);
    input=JSON.parse(raw);
   }catch{return json({error:'Invalid JSON'},400);}
   try{return json(await enquiries.create(input),201);}
   catch(e){if(e instanceof TypeError)return json({error:'Invalid fields'},422);return json({error:'Storage unavailable'},503);}
  }
  const match=/^\/api\/poc\/admin\/enquiries\/([a-zA-Z0-9-]{8,80})$/.exec(path);
  if(match&&request.method==='GET'){
   // Every admin request requires server-side verification, never client-supplied role claims.
   if(typeof verifyAdminToken!=='function')return json({error:'Admin auth not configured'},503);
   let authorized=false;
   try{authorized=await verifyAdminToken(request.headers.get('authorization')||'');}
   catch{return json({error:'Unauthorized'},401);}
   if(!authorized)return json({error:'Unauthorized'},401);
   try{const value=await enquiries.get(match[1]);return value?json(value):json({error:'Not found'},404);}
   catch{return json({error:'Storage unavailable'},503);}
  }
  return json({error:'Not found'},404);
 };
}
