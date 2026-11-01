import {ApiError} from './repository.mjs';
import {importLegacyBatch} from './migration.mjs';
import {dispatchNotification} from './notifications.mjs';
import {createBackup,restoreBackup} from './backup.mjs';
export const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
async function body(req,limit=8192){
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))throw new ApiError('JSON_REQUIRED',415);
 const reader=req.body?.getReader();if(!reader)throw new ApiError('INVALID_JSON');const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new ApiError('PAYLOAD_TOO_LARGE',413);}chunks.push(Buffer.from(value));}
 let data;try{data=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new ApiError('INVALID_JSON');}if(!data||typeof data!=='object'||Array.isArray(data))throw new ApiError('INVALID_JSON');return data;
}
export function createCrmHandler(runtime){return async(req,context={})=>{
 try{
  const url=new URL(req.url),p=url.pathname,m=req.method,r=runtime.repository;
  // Browser writes must originate on this same site. Bearer auth still required for staff.
  if(!['GET','HEAD'].includes(m)&&req.headers.get('origin')&&req.headers.get('origin')!==url.origin)throw new ApiError('ORIGIN_DENIED',403);
  if(p==='/api/health'&&m==='GET')return json({ok:true,storage:'firestore',adminConfigured:true,notifications:runtime.notificationConfig.mode});
  if(p==='/api/catalog'&&m==='GET'){const c=await r.catalog();return json({...c,vehicles:c.vehicles.filter(v=>v.enabled)});}
  if(p==='/api/enquiries'&&m==='POST')return json(await r.create(await body(req),req.headers.get('idempotency-key'),context.ip),201);
  if(p==='/api/events'&&m==='POST')return json(await r.event(await body(req),context.ip),202);
  if(/^\/api\/(uploads|models|reviewed-media)\//.test(p)&&m==='GET')return await runtime.media.read(p.slice(5))||json({error:'NOT_FOUND'},404);
  if(p.startsWith('/api/admin/')){
   await r.guard(context.ip,'admin',60);
   if(!await runtime.authorize(req.headers.get('authorization')))throw new ApiError('UNAUTHORIZED',401);
   if(p==='/api/admin/session'&&m==='GET')return json({authorized:true});
   if(p==='/api/admin/enquiries'&&m==='GET')return json(await r.list('enquiry',url.searchParams.get('cursor')||''));
   if(p==='/api/admin/enquiries'&&m==='POST')return json(await r.create(await body(req),req.headers.get('idempotency-key'),context.ip,{manual:true}),201);
   const match=/^\/api\/admin\/enquiries\/([\w-]{1,100})(?:\/(quotation))?$/.exec(p);
   if(match&&((!match[2]&&m==='PATCH')||(match[2]&&m==='POST')))return json(await r.update(match[1],await body(req),match[2]?'quotation':'status'),match[2]?201:200);
   if(p==='/api/admin/catalog'&&m==='GET')return json(await r.catalog());
   if(p==='/api/admin/catalog'&&m==='PUT')return json(await r.saveCatalog(await body(req,120000)));
   if(p==='/api/admin/summary'&&m==='GET')return json(await r.summary());
   if(p==='/api/admin/engagement'&&m==='GET')return json(await r.engagement());
   if(p==='/api/admin/notifications'&&m==='GET')return json({config:runtime.notificationConfig,...await r.list('notification',url.searchParams.get('cursor')||'')});
   const dispatch=/^\/api\/admin\/notifications\/([a-f0-9-]{36})\/dispatch$/.exec(p);
   if(dispatch&&m==='POST')return json(await dispatchNotification(runtime,dispatch[1]));
   if(p==='/api/admin/images'&&m==='POST')return json(await runtime.media.image(await body(req,4100000)),201);
   if(p==='/api/admin/media/chunks'&&m==='POST')return json(await runtime.media.chunk(await body(req,330000),'owner'),201);
   if(p==='/api/admin/models'&&m==='POST')return json(await runtime.media.model(await body(req,4100000),'owner'),201);
   if(p==='/api/admin/fleet-media/status'&&m==='GET')return json(await runtime.media.status());
   if(p==='/api/admin/fleet-media/import'&&m==='POST')return json(await runtime.media.import(await body(req,2500000)));
   if(p==='/api/admin/cleanup'&&m==='POST')return json({...await r.cleanup(),...await runtime.media.cleanup()});
   if(p==='/api/admin/migration/model'&&m==='POST'){if(runtime.env.CRM_MIGRATION_APPROVAL!=='owner-approved')throw new ApiError('MIGRATION_APPROVAL_REQUIRED',403);if(!(await r.docs.doc('control').get()).data()?.maintenance)throw new ApiError('MAINTENANCE_REQUIRED',409);return json(await runtime.media.model(await body(req),'owner',{legacy:true}));}
   if(p==='/api/admin/restore'&&m==='POST'){if(runtime.env.CRM_RESTORE_APPROVAL!=='owner-approved')throw new ApiError('RESTORE_APPROVAL_REQUIRED',403);const b=await body(req,4100000);if(!/^backup-[\w-]+\.json$/.test(b.id||''))throw new ApiError('INVALID_BACKUP_ID');const bytes=b.archiveBase64?Buffer.from(b.archiveBase64,'base64'):await runtime.backups.get(b.id,{type:'arrayBuffer'});if(!bytes)throw new ApiError('NOT_FOUND',404);return json(await restoreBackup(runtime,Buffer.from(bytes),{emulatorOnly:!runtime.emulator&&runtime.env.CRM_RESTORE_APPROVAL!=='owner-approved'}));}
   if(p==='/api/admin/migration'&&m==='POST')return json(await importLegacyBatch(runtime,await body(req,4100000)));
   if(p==='/api/admin/maintenance'&&m==='POST'){const b=await body(req);if(typeof b.enabled!=='boolean')throw new ApiError('INVALID_FIELDS');await r.maintenance(b.enabled);return json({maintenance:b.enabled});}
   if(p==='/api/admin/backups'&&m==='POST')return json(await createBackup(runtime),201);
   const backup=/^\/api\/admin\/backups\/(backup-[\w-]+\.json)$/.exec(p);
   if(backup&&m==='GET'){const bytes=await runtime.backups.get(backup[1],{type:'stream'});return bytes?new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+backup[1]+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):json({error:'NOT_FOUND'},404);}
  }
  return json({error:'NOT_FOUND'},404);
 }catch(e){return json({error:e instanceof ApiError?e.code:'SERVICE_UNAVAILABLE'},e instanceof ApiError?e.status:503);}
};}
