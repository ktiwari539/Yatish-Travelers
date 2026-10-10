import http from 'node:http';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readCatalog, writeCatalog, validateVehicle } from './catalog.mjs';

const port = Number(process.env.CRM_PORT || 8787);
const dataPath = resolve(process.env.CRM_DATA_FILE || '.data/enquiries.jsonl');
const secret = process.env.CRM_ADMIN_TOKEN || '';
const eventsPath=resolve(process.env.CRM_EVENTS_FILE || '.data/events.jsonl');
const ALLOWED_EVENTS=new Set(['quote_open','callback_open','corporate_open','whatsapp_click','email_click','vehicle_explore','quote_submit']);
const VALID_STATUS = new Set(['new','contacted','quoted','confirmed','closed']);
const rate = new Map();
const eventRate=new Map();
const compareToken=(given)=>{
  if (!secret || typeof given !== 'string') return false;
  const a=Buffer.from(given),b=Buffer.from(secret);
  return a.length===b.length && timingSafeEqual(a,b);
};
const session=(raw)=>typeof raw==='string'&&/^[a-z0-9-]{8,80}$/i.test(raw)?raw:'';
const logEvent=(item)=>{mkdirSync(dirname(eventsPath),{recursive:true,mode:0o700});appendFileSync(eventsPath,JSON.stringify(item)+'\n',{encoding:'utf8',mode:0o600});};
function engagement(){
  if(!existsSync(eventsPath)) return {total:0,counts:{},recent:[],sessions:0};
  const entries=readFileSync(eventsPath,'utf8').split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return []}});
  return {total:entries.length,counts:Object.fromEntries([...ALLOWED_EVENTS].map(t=>[t,entries.filter(e=>e.event===t).length])),sessions:new Set(entries.map(e=>e.sessionId).filter(Boolean)).size,recent:entries.slice(-50).reverse()};
}

function reply(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}
function records() {
  if (!existsSync(dataPath)) return [];
  const byId = new Map();
  for (const line of readFileSync(dataPath,'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'created') byId.set(event.value.id,event.value);
      if (event.type === 'status' && byId.has(event.id)) {
        Object.assign(byId.get(event.id), { status:event.status,updatedAt:event.updatedAt });
      }
    } catch { /* Ignore a truncated event, preserve previous records */ }
  }
  return [...byId.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
function writeEvent(event) {
  mkdirSync(dirname(dataPath), { recursive:true, mode:0o700 });
  appendFileSync(dataPath,JSON.stringify(event)+'\n',{encoding:'utf8',mode:0o600});
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8192) throw new Error('Request too large.');
  }
  return JSON.parse(body || '{}');
}
const trim = (v,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';

const server = http.createServer(async (req,res)=>{
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health' && req.method === 'GET') return reply(res,200,{ok:true,storage:'local',adminConfigured:Boolean(secret)});
    if (url.pathname === '/api/catalog' && req.method === 'GET') {
      const config=readCatalog();
      return reply(res,200,{vehicles:config.vehicles.filter(v=>v.enabled),updatedAt:config.updatedAt});
    }
    if(url.pathname==='/api/events' && req.method==='POST') {
      const address=req.socket.remoteAddress||'local',now=Date.now();
      const seen=(eventRate.get(address)||[]).filter(t=>now-t<60000);
      if(seen.length>=60) return reply(res,429,{error:'Rate limit exceeded.'});
      seen.push(now);eventRate.set(address,seen);
      if (!String(req.headers['content-type']||'').includes('application/json')) return reply(res,415,{error:'JSON required.'});
      const body=await readBody(req),event=trim(body.event,40);
      if(!ALLOWED_EVENTS.has(event)) return reply(res,400,{error:'Unknown event.'});
      logEvent({event,sessionId:session(body.sessionId),vehicle:trim(body.vehicle,80),source:trim(body.source,80),createdAt:new Date().toISOString()});
      return reply(res,202,{ok:true});
    }
    if (url.pathname === '/api/enquiries' && req.method === 'POST') {
      const address = req.socket.remoteAddress || 'local';
      const now = Date.now();
      const recent = (rate.get(address)||[]).filter(t=>now-t<60000);
      if (recent.length>=8) return reply(res,429,{error:'Too many requests. Please try again later.'});
      recent.push(now);rate.set(address,recent);
      if (!String(req.headers['content-type']||'').includes('application/json')) return reply(res,415,{error:'Use JSON content type.'});
      const incoming = await readBody(req);
      const name=trim(incoming.name,100),phone=trim(incoming.phone,24);
      if(name.length<2 || !/^\+?[0-9 ()-]{8,24}$/.test(phone)) return reply(res,400,{error:'Enter a valid name and phone number.'});
      const mode=['quote','callback','corporate'].includes(incoming.mode)?incoming.mode:'quote';
      const tripDate=trim(incoming.tripDate,10);
      if (tripDate && !/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) return reply(res,400,{error:'Invalid travel date.'});
      const date=new Date().toISOString();
      const record={
        id:randomUUID(), createdAt:date, updatedAt:date, status:'new', mode,
        name,phone, email:trim(incoming.email,180), sessionId:session(incoming.sessionId), source:trim(incoming.source,80), pickup:trim(incoming.pickup,200), destination:trim(incoming.destination,200),
        tripDate,tripType:trim(incoming.tripType,70),notes:trim(incoming.notes,1000),
        vehicle:trim(incoming.vehicle,100),
        passengers:Math.max(1,Math.min(40,Number(incoming.passengers)||1)),
        days:Math.max(1,Math.min(90,Number(incoming.days)||1)),
        distanceKm:Math.max(0,Math.min(100000,Number(incoming.distanceKm)||0)),
        estimatedMin:Math.max(0,Number(incoming.estimatedMin)||0),
        estimatedMax:Math.max(0,Number(incoming.estimatedMax)||0),
      };
      if(mode!=='callback' && (!record.pickup || !record.destination || !record.tripDate)) {
        return reply(res,400,{error:'Pickup, destination and travel date are required.'});
      }
      const configured=readCatalog().vehicles.find(v=>v.name===record.vehicle && v.enabled);
      if(configured) {
        const totalKm=Math.max(record.distanceKm,record.days*250);
        record.estimatedMin=totalKm*configured.rateMin;
        record.estimatedMax=totalKm*configured.rateMax;
      }
      writeEvent({type:'created',value:record});
      logEvent({event:'quote_submit',sessionId:record.sessionId,vehicle:record.vehicle,source:record.source,createdAt:date});
      return reply(res,201,{id:record.id,status:record.status});
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if(!secret) return reply(res,503,{error:'Admin access not configured. Set CRM_ADMIN_TOKEN.'});
      const provided=req.headers.authorization?.replace(/^Bearer /,'')||'';
      if (!compareToken(provided)) return reply(res,401,{error:'Invalid admin token.'});
      if(url.pathname==='/api/admin/engagement' && req.method==='GET') return reply(res,200,engagement());
      if(url.pathname==='/api/admin/catalog' && req.method==='GET') return reply(res,200,readCatalog());
      if(url.pathname==='/api/admin/catalog' && req.method==='PUT') {
        const incoming=await readBody(req);
        if(!Array.isArray(incoming.vehicles)||incoming.vehicles.length>80) return reply(res,400,{error:'Expected up to 80 vehicles.'});
        const current=readCatalog().vehicles;
        try {
          const next=incoming.vehicles.map(item=>validateVehicle(item,current.find(v=>v.id===item.id)));
          if(new Set(next.map(v=>v.name.toLowerCase())).size!==next.length) return reply(res,400,{error:'Vehicle names must be unique.'});
          return reply(res,200,writeCatalog(next));
        } catch(e) {return reply(res,400,{error:e.message});}
      }
      if(url.pathname==='/api/admin/enquiries' && req.method==='GET') return reply(res,200,{items:records()});
      if(url.pathname==='/api/admin/summary' && req.method==='GET') {
        const items=records();
        return reply(res,200,{total:items.length,byStatus:Object.fromEntries([...VALID_STATUS].map(s=>[s,items.filter(i=>i.status===s).length])),engagement:engagement()});
      }
      const matched=url.pathname.match(/^\/api\/admin\/enquiries\/([0-9a-f-]{36})$/);
      if(matched && req.method==='PATCH') {
        const incoming=await readBody(req);
        if(!VALID_STATUS.has(incoming.status)) return reply(res,400,{error:'Invalid status.'});
        if(!records().some(item=>item.id===matched[1])) return reply(res,404,{error:'Enquiry not found.'});
        const updatedAt=new Date().toISOString();
        writeEvent({type:'status',id:matched[1],status:incoming.status,updatedAt});
        return reply(res,200,{id:matched[1],status:incoming.status,updatedAt});
      }
    }
    return reply(res,404,{error:'Not found.'});
  } catch(error) {
    if(error instanceof SyntaxError) return reply(res,400,{error:'Invalid JSON.'});
    if(error.message==='Request too large.') return reply(res,413,{error:error.message});
    console.error('CRM API request error:',error);
    return reply(res,500,{error:'An internal error occurred.'});
  }
});
server.listen(port,'127.0.0.1',()=>{
  console.log('Local CRM API listening on http://127.0.0.1:'+port);
  console.log('Admin dashboard '+(secret?'enabled':'disabled (set CRM_ADMIN_TOKEN)'));
  console.log('Data stored at '+dataPath);
});
