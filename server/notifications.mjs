import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const store=resolve(process.env.CRM_NOTIFICATIONS_FILE||'.data/notification-events.jsonl');
const adminEmail=process.env.CRM_EMAIL_TO||'ktiwari539@gmail.com';
const adminWhatsApp=process.env.CRM_WHATSAPP_TO||'919340098177';
const live=process.env.CRM_NOTIFICATIONS_MODE==='live';
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=(s,max=200)=>String(s??'').trim().slice(0,max);

function log(item){
  mkdirSync(dirname(store),{recursive:true,mode:0o700});
  appendFileSync(store,JSON.stringify(item)+'\n',{encoding:'utf8',mode:0o600});
}
export function notifications(){
  if(!existsSync(store))return [];
  const entries=new Map();
  for(const line of readFileSync(store,'utf8').split('\n')){
    if(!line)continue;
    try{
      const event=JSON.parse(line);
      if(event.type==='created')entries.set(event.item.id,event.item);
      if(event.type==='delivery'&&entries.has(event.id))Object.assign(entries.get(event.id),event.patch);
    }catch {/* keep valid events */}
  }
  return [...entries.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function notificationConfig(){
  return {mode:live?'live':'preview',businessEmail:adminEmail,businessWhatsApp:adminWhatsApp,
    emailReady:Boolean(process.env.RESEND_API_KEY&&process.env.CRM_EMAIL_FROM),
    whatsappReady:Boolean(process.env.WHATSAPP_BUSINESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_TEMPLATE_NAME)};
}
const niceMoney=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});

export function quoteText(record,quote){
  const amount=quote?.amount;
  const label=quote?'Quotation':'New travel enquiry';
  return [
    'MATESHWARI TRAVELLERS — '+label.toUpperCase(),
    'Reference: '+record.id.slice(0,8).toUpperCase(),
    'Customer: '+record.name,
    'Vehicle: '+(record.vehicle||'To be confirmed'),
    'From: '+(record.pickup||'To be confirmed'),
    'To: '+(record.destination||'To be confirmed'),
    'Travel date: '+(record.tripDate||'To be confirmed'),
    'Passengers: '+(record.passengers||1),
    'Days: '+(record.days||1),
    quote ? 'Quotation amount: '+niceMoney(amount) : 'Indicative range: '+niceMoney(record.estimatedMin)+' – '+niceMoney(record.estimatedMax),
    quote ? 'Quote notes: '+(quote.notes||'Final schedule to be confirmed') : '',
    'Tolls, permits, parking and GST are additional where applicable unless explicitly included in the confirmed quotation.',
    'WhatsApp: +91 93400 98177',
    'Email: ktiwari539@gmail.com',
    'This is a quotation, not a confirmed booking.'
  ].filter(Boolean).join('\n');
}
const toHtml=(body)=>'<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:30px;background:#faf6ee;color:#18372f"><h1 style="font-size:26px">Mateshwari Travellers</h1><div style="border-top:3px solid #ad7c42;margin:20px 0"></div><p style="white-space:pre-line;line-height:1.9">'+esc(body)+'</p><p style="font-size:12px;color:#766d62">This is not a booking confirmation.</p></div>';

async function deliver(item){
  const config=notificationConfig();
  if(!live) return {status:'preview',detail:'Saved to local outbox; live delivery disabled.'};
  if(item.channel==='email'){
    if(!config.emailReady) return {status:'needs_configuration',detail:'Set RESEND_API_KEY and CRM_EMAIL_FROM.'};
    const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),
      headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.CRM_EMAIL_FROM,to:[item.recipient],subject:item.subject,html:toHtml(item.text),text:item.text})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error('Email provider returned '+response.status);
    return {status:'sent',providerId:data.id||'',detail:'Accepted by email provider; not a guarantee of inbox delivery.'};
  }
  if(item.channel==='whatsapp'){
    if(!config.whatsappReady)return {status:'needs_configuration',detail:'Provide WhatsApp Cloud API token, phone ID and approved template name.'};
    const id=process.env.WHATSAPP_PHONE_NUMBER_ID;
    const response=await fetch('https://graph.facebook.com/v21.0/'+encodeURIComponent(id)+'/messages',{
      method:'POST',signal:AbortSignal.timeout(10000),
      headers:{Authorization:'Bearer '+process.env.WHATSAPP_BUSINESS_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({
        messaging_product:'whatsapp',to:item.recipient,type:'template',
        template:{name:process.env.WHATSAPP_TEMPLATE_NAME,language:{code:process.env.WHATSAPP_TEMPLATE_LANG||'en'},
          components:[{type:'body',parameters:[{type:'text',text:item.reference}]}]}
      })
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error('WhatsApp provider returned '+response.status);
    return {status:'sent',providerId:data.messages?.[0]?.id||'',detail:'Accepted by WhatsApp API; delivery not confirmed.'};
  }
  return {status:'needs_configuration',detail:'Unknown channel.'};
}

async function makeJob({record,channel,recipient,purpose,quote}){
  if(!recipient)return null;
  const reference=record.id.slice(0,8).toUpperCase();
  const createdAt=new Date().toISOString();
  const item={
    id:randomUUID(),enquiryId:record.id,createdAt,channel,recipient,purpose,reference,
    subject:(purpose==='confirmed_quote'?'Quotation':'New enquiry')+' '+reference+' — Mateshwari Travellers',
    text:quoteText(record,quote),status:'pending',detail:'Waiting',providerId:''
  };
  log({type:'created',item});
  let outcome;
  try{outcome=await deliver(item);}catch(error){
    outcome={status:'failed',detail:error instanceof Error?error.message:'Provider request failed'};
  }
  log({type:'delivery',id:item.id,patch:{...outcome,attemptedAt:new Date().toISOString()}});
  return {...item,...outcome};
}
export async function notifyNewEnquiry(record){
  const tasks=[
    {record,channel:'email',recipient:adminEmail,purpose:'new_enquiry'},
    {record,channel:'whatsapp',recipient:adminWhatsApp,purpose:'new_enquiry'},
  ];
  if(record.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))tasks.push({
    record,channel:'email',recipient:record.email,purpose:'acknowledgement'
  });
  const results=[];
  for(const task of tasks)results.push(await makeJob(task));
  return results;
}
export async function prepareQuote(record,quote){
  const results=[];
  if(record.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)){
    results.push(await makeJob({record,quote,channel:'email',recipient:record.email,purpose:'confirmed_quote'}));
  }
  results.push(await makeJob({record,quote,channel:'email',recipient:adminEmail,purpose:'confirmed_quote'}));
  results.push(await makeJob({record,quote,channel:'whatsapp',recipient:adminWhatsApp,purpose:'confirmed_quote'}));
  return results;
}
