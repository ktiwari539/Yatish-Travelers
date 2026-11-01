import {PocError} from './repository.mjs';
export const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
async function body(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw new PocError('JSON_REQUIRED',415);
 const reader=request.body?.getReader();if(!reader)throw new PocError('INVALID_JSON',400);
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new PocError('REQUEST_TOO_LARGE',413);}chunks.push(Buffer.from(value));}
 let parsed;try{parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new PocError('INVALID_JSON',400);}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new PocError('INVALID_FIELDS',422);return parsed;
}
export function createHandler(runtime){
 return async (request,context={})=>{
  try{
   const path=new URL(request.url).pathname;
   if(!path.startsWith('/api/poc/'))return json({error:'NOT_FOUND'},404);
   if(path==='/api/poc/health'&&request.method==='GET')return json({ok:true,mode:'isolated-poc',backend:runtime.emulator?'emulators':'staging'});
   if(path==='/api/poc/enquiries'&&request.method==='POST')return json(await runtime.repository.create(await body(request),request.headers.get('idempotency-key'),context.ip),201);
   if(path.startsWith('/api/poc/admin/')){
    if(!await runtime.authorize(request.headers.get('authorization')))return json({error:'UNAUTHORIZED'},401);
    if(path==='/api/poc/admin/session'&&request.method==='GET')return json({authorized:true});
    if(path==='/api/poc/admin/enquiries'&&request.method==='GET')return json(await runtime.repository.list());
    const match=/^\/api\/poc\/admin\/enquiries\/([a-f0-9]{64})(?:\/(quotation))?$/.exec(path);
    if(match){
     if(request.method==='GET'&&!match[2]){const value=await runtime.repository.get(match[1]);return value?json(value):json({error:'NOT_FOUND'},404);}
     if((request.method==='PATCH'&&!match[2])||(request.method==='POST'&&match[2]))return json(await runtime.repository.update(match[1],await body(request),match[2]?'quotation':'status'));
    }
   }
   return json({error:'NOT_FOUND'},404);
  }catch(error){return error instanceof PocError?json({error:error.code},error.status):json({error:'SERVICE_UNAVAILABLE'},503);}
 };
}
