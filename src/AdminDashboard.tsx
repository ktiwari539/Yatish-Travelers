import { FleetManager } from './FleetManager';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, LogIn, LogOut, RefreshCw, Search, Users, Plus, Mail, Send, MessageCircle, FileText } from 'lucide-react';

type Enquiry={
  id:string;createdAt:string;updatedAt:string;status:string;mode:string;
  name:string;phone:string;pickup:string;destination:string;tripDate:string;
  tripType:string;notes:string;vehicle:string;passengers:number;days:number;
  distanceKm:number;estimatedMin:number;estimatedMax:number;email?:string;source?:string;sessionId?:string;quote?:{id:string;amount:number;notes:string;createdAt:string};
};
const statuses=['new','contacted','quoted','confirmed','closed'];
export function AdminDashboard() {
  const [token,setToken]=useState(()=>sessionStorage.getItem('mt-crm-token')||'');
  const [entered,setEntered]=useState('');
  const [items,setItems]=useState<Enquiry[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [saving,setSaving]=useState<string|null>(null);
  const [manualOpen,setManualOpen]=useState(false);
  const [manualSaving,setManualSaving]=useState(false);
  const [tab,setTab]=useState<'bookings'|'fleet'|'engagement'|'notifications'>('bookings');
  const [delivery,setDelivery]=useState<{config:{mode:string;emailReady:boolean;whatsappReady:boolean;businessEmail:string;businessWhatsApp:string};items:Array<{id:string;createdAt:string;enquiryId:string;channel:string;purpose:string;recipient:string;status:string;detail:string}>}|null>(null);
  const [quoteEditing,setQuoteEditing]=useState<string|null>(null);
  const [quoteSaving,setQuoteSaving]=useState(false);
  const [quoteFeedback,setQuoteFeedback]=useState('');
  const [engagement,setEngagement]=useState<{total:number;counts:Record<string,number>;sessions:number;recent:Array<{event:string;vehicle:string;source:string;createdAt:string}>}>({total:0,counts:{},sessions:0,recent:[]});
  const load=useCallback(async()=>{
    if(!token)return;
    setLoading(true);setError('');
    try{
      const response=await fetch('/api/admin/enquiries',{headers:{Authorization:'Bearer '+token}});
      const body=await response.json();
      if(!response.ok) throw new Error(body.error||'Unable to load enquiries');
      setItems(body.items||[]);
      const eventsResponse=await fetch('/api/admin/engagement',{headers:{Authorization:'Bearer '+token}});
      if(eventsResponse.ok) setEngagement(await eventsResponse.json());
      const deliveriesResponse=await fetch('/api/admin/notifications',{headers:{Authorization:'Bearer '+token}});
      if(deliveriesResponse.ok)setDelivery(await deliveriesResponse.json());
    }catch(e){setError(e instanceof Error?e.message:'Network error');}
    finally{setLoading(false);}
  },[token]);
  useEffect(()=>{void load();},[load]);
  const login=(event:React.FormEvent)=>{
    event.preventDefault();
    const value=entered.trim();
    sessionStorage.setItem('mt-crm-token',value);
    setToken(value);setEntered('');
  };
  const logout=()=>{sessionStorage.removeItem('mt-crm-token');setToken('');setItems([]);setError('');setEngagement({total:0,counts:{},sessions:0,recent:[]});setDelivery(null);};
  const update=async(id:string,status:string)=>{
    setSaving(id);setError('');
    try{
      const response=await fetch('/api/admin/enquiries/'+id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({status})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Unable to update');
      setItems(existing=>existing.map(item=>item.id===id?{...item,status}:item));
    }catch(e){setError(e instanceof Error?e.message:'Update failed');}
    finally{setSaving(null);}
  };
  const createManual=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    setManualSaving(true);setError('');
    try{
      const response=await fetch('/api/admin/enquiries',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(data.entries()))});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Unable to save manual lead.');
      setManualOpen(false);void load();
    }catch(e){setError(e instanceof Error?e.message:'Save failed');}
    finally{setManualSaving(false);}
  };
  const sendQuotation=async(event:React.FormEvent<HTMLFormElement>,id:string)=>{
    event.preventDefault();
    const fields=new FormData(event.currentTarget);
    const amount=Number(fields.get('amount')),notes=String(fields.get('notes')||'');
    setQuoteSaving(true);setQuoteFeedback('');
    try{
      const response=await fetch('/api/admin/enquiries/'+id+'/quotation',{method:'POST',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({amount,notes})});
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Unable to prepare quotation.');
      const preview=body.delivery?.map((d:{channel:string;status:string})=>d.channel+': '+d.status).join(' • ')||'';
      setQuoteFeedback('Quotation saved to CRM. '+preview);
      setQuoteEditing(null);void load();
    }catch(e){setError(e instanceof Error?e.message:'Quote could not be saved.');}
    finally{setQuoteSaving(false);}
  };
  const visible=items.filter(item=>(filter==='all'||item.status===filter)&&(
    [item.name,item.phone,item.pickup,item.destination,item.vehicle,item.tripType,item.id].some(text=>
      String(text||'').toLowerCase().includes(search.trim().toLowerCase()))
  ));
  return <main className="crm-page">
    <header className="crm-header"><a href="/"><ArrowLeft size={17}/> <strong>MATESHWARI <span>TRAVELLERS</span></strong></a>
      <div><span>LOCAL CRM / STAFF ACCESS</span>{token&&<button onClick={logout} type="button"><LogOut size={15}/> Sign out</button>}</div>
    </header>
    {!token?<section className="crm-sign-in">
      <div className="crm-sign-icon"><Users size={28}/></div>
      <span className="crm-eyebrow">Operations workspace</span>
      <h1>Bookings deserve a better workflow.</h1>
      <p>Sign in with your locally configured CRM admin token to review enquiries and keep follow-ups organized.</p>
      <form onSubmit={login}><label>Admin token<input type="password" autoComplete="off" value={entered} onChange={e=>setEntered(e.target.value)} required placeholder="CRM_ADMIN_TOKEN"/></label><button type="submit"><LogIn size={17}/> Open dashboard</button></form>
      <small>This local-preview CRM is not yet a production staff authentication system.</small>
    </section>:
    <section className="crm-main">
      <div className="crm-tabs" role="group" aria-label="Dashboard section">
        <button type="button" className={tab==='bookings'?'active':''} onClick={()=>setTab('bookings')}>Enquiries & follow-ups</button>
        <button type="button" className={tab==='engagement'?'active':''} onClick={()=>setTab('engagement')}>Visitor activity</button>
        <button type="button" className={tab==='fleet'?'active':''} onClick={()=>setTab('fleet')}>Cars & pricing</button>
        <button type="button" className={tab==='notifications'?'active':''} onClick={()=>setTab('notifications')}>Email & WhatsApp outbox</button>
      </div>
      {tab==='fleet' ? <FleetManager token={token}/> : tab==='notifications' ? (
        <div className="crm-notifications">
          <div className="crm-heading"><div><span className="crm-eyebrow">Messaging / Test Mode</span><h1>Email & WhatsApp outbox.</h1><p>See every email and WhatsApp notification prepared by the backend, with accurate delivery states.</p></div><button className="crm-refresh" type="button" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
          <div className="crm-delivery-config">
            <div><Mail size={20}/><strong>Business email</strong><span>{delivery?.config.businessEmail||'Not configured'}</span><small>{delivery?.config.emailReady?'Provider configured':'Provider credentials not connected'}</small></div>
            <div><MessageCircle size={20}/><strong>WhatsApp Business API</strong><span>+{delivery?.config.businessWhatsApp||'919340098177'}</span><small>{delivery?.config.whatsappReady?'Provider configured':'Provider credentials and approved template required'}</small></div>
            <div><FileText size={20}/><strong>Delivery mode</strong><span>{delivery?.config.mode||'preview'}</span><small>Preview mode never sends messages outside the local computer</small></div>
          </div>
          <div className="crm-outbox">
            {(delivery?.items||[]).length===0?<div className="crm-empty">No messages prepared yet. Submit a test enquiry or prepare a quotation.</div>:
            delivery?.items.map(item=><article key={item.id}>
              <div><span className="crm-message-kind">{item.channel==='email'?<Mail size={15}/>:<MessageCircle size={15}/>} {item.purpose.replaceAll('_',' ')}</span>
                <strong>{item.recipient}</strong><small>Enquiry #{item.enquiryId.slice(0,8).toUpperCase()} · {new Date(item.createdAt).toLocaleString('en-IN')}</small></div>
              <div><span className={'crm-delivery-state '+item.status}>{item.status.replaceAll('_',' ')}</span><small>{item.detail}</small></div>
            </article>)}
          </div>
        </div>
      ) : tab==='engagement' ? (
        <div className="crm-activity">
          <div className="crm-heading"><div><span className="crm-eyebrow">Visitor activity</span><h1>Understand the enquiry journey.</h1><p>Anonymous interactions recorded locally. Customer identity appears only after form submission.</p></div><button className="crm-refresh" type="button" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
          <div className="crm-metrics crm-activity-metrics">
            {[
              ['All interactions',engagement.total],
              ['Quote opens',engagement.counts.quote_open||0],
              ['Callback opens',engagement.counts.callback_open||0],
              ['WhatsApp clicks',engagement.counts.whatsapp_click||0],
              ['Submitted',engagement.counts.quote_submit||0],
              ['Unique sessions',engagement.sessions],
            ].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}
          </div>
          <div className="crm-activity-list">
            <h2>Recent interactions</h2>
            {engagement.recent.length===0?<p>No tracked interactions yet. Try a quote or WhatsApp button on the public website.</p>:
              engagement.recent.map((ev,index)=><div key={index}><strong>{ev.event.replaceAll('_',' ')}</strong><span>{ev.vehicle||'General enquiry'}</span><span>{ev.source||'website'}</span><small>{new Date(ev.createdAt).toLocaleString('en-IN')}</small></div>)}
          </div>
          <p className="crm-footnote">These are local interaction counts, not individually identified visitors or accurate production analytics. Counts can include repeated clicks and testing.</p>
        </div>
      ) : (
      <div className="crm-booking-panel">
      <div className="crm-heading"><div><span className="crm-eyebrow">Enquiry management</span><h1>Every journey starts here.</h1><p>Follow-ups from the website and manually logged inbound WhatsApp or calls.</p></div><div className="crm-heading-actions"><button className="fleet-add" type="button" onClick={()=>setManualOpen(x=>!x)}><Plus size={16}/> {manualOpen?'Close form':'Log incoming lead'}</button><button className="crm-refresh" type="button" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Refresh</button></div></div>
       {manualOpen&&<form className="crm-manual-form" onSubmit={e=>void createManual(e)}>
         <h2>Log an enquiry received outside the website</h2>
         <p>Use this when a customer contacts you directly through WhatsApp, phone or email, so the conversation can be followed up in the CRM.</p>
         <div className="crm-manual-grid">
           <label>Customer name<input name="name" required minLength={2} placeholder="Name"/></label>
           <label>Phone number<input name="phone" required inputMode="tel" placeholder="+91..."/></label>
           <label>Lead source<select name="source"><option value="staff-whatsapp">WhatsApp conversation</option><option value="staff-call">Phone call</option><option value="staff-email">Email</option><option value="staff-other">Other</option></select></label>
           <label>Email (optional)<input name="email" type="email" placeholder="customer@example.com"/></label>
           <label>Pickup<input name="pickup" placeholder="Pickup area"/></label>
           <label>Destination<input name="destination" placeholder="Destination"/></label>
           <label>Travel date<input name="tripDate" type="date"/></label>
           <label>Vehicle requested<input name="vehicle" placeholder="Vehicle or class"/></label>
         </div>
         <label>Notes<textarea name="notes" rows={3} placeholder="Quoted price, time to call back, special instructions..."/></label>
         <button className="fleet-save" type="submit" disabled={manualSaving}>{manualSaving?'Saving...':'Save incoming lead'}</button>
       </form>}
      {error&&<div className="crm-error" role="alert">{error}</div>}
      {quoteFeedback&&<div className="fleet-admin-success" role="status">{quoteFeedback}</div>}
      <div className="crm-metrics">{[['Total enquiries',items.length],...statuses.map(s=>[s,items.filter(i=>i.status===s).length])].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="crm-toolbar"><label><Search size={16}/><input aria-label="Search enquiries" placeholder="Search customer, phone, route or vehicle..." value={search} onChange={e=>setSearch(e.target.value)} /></label><select aria-label="Filter by status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      {loading&&<p className="crm-loading">Loading enquiries...</p>}
      {!loading&&visible.length===0&&<div className="crm-empty">No matching enquiries yet. Submit a test request on the homepage, then refresh here.</div>}
      <div className="crm-list">{visible.map(item=><article className="crm-card" key={item.id}>
        <div className="crm-card-head"><div><small>{new Date(item.createdAt).toLocaleString('en-IN')} · {item.mode}</small><h2>{item.name}</h2><a href={'tel:'+item.phone}>{item.phone}</a></div><label>Follow-up status<select value={item.status} aria-label={'Status for '+item.name} disabled={saving===item.id} onChange={e=>void update(item.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label></div>
        <div className="crm-card-body"><div><small>ROUTE</small><strong>{item.pickup||'—'} → {item.destination||'—'}</strong></div><div><small>TRAVEL DATE</small><strong>{item.tripDate||'Not specified'}</strong></div><div><small>TRIP & VEHICLE</small><strong>{item.tripType||item.mode} · {item.vehicle||'Flexible'}</strong></div><div><small>TRAVELLERS / DAYS</small><strong>{item.passengers} / {item.days}</strong></div></div>
        <div className="crm-card-meta"><span><strong>Origin:</strong> {item.source||'Website form'}</span><span><strong>Session:</strong> {item.sessionId?item.sessionId.slice(0,8):'Not captured'}</span>{item.email&&<a href={'mailto:'+item.email}>{item.email}</a>}</div>
        {item.notes&&<p className="crm-card-notes">{item.notes}</p>}
        {item.quote&&<div className="crm-saved-quote"><FileText size={17}/><span>Latest quotation: <strong>₹{item.quote.amount.toLocaleString('en-IN')}</strong> · {new Date(item.quote.createdAt).toLocaleDateString('en-IN')}</span></div>}
        <div className="crm-quote-actions">
          <button type="button" onClick={()=>{setQuoteEditing(quoteEditing===item.id?null:item.id);setQuoteFeedback('');setError('');}}>
            <Send size={15}/> {quoteEditing===item.id?'Close quotation':'Prepare & send quotation'}
          </button>
          {item.email&&<a href={'mailto:'+item.email+'?subject='+encodeURIComponent('Mateshwari Travellers — Quotation '+item.id.slice(0,8).toUpperCase())}>Email customer <Mail size={14}/></a>}
          <a href={'https://wa.me/'+item.phone.replace(/\D/g,'')+'?text='+encodeURIComponent('Hello '+item.name+', following up on your Mateshwari Travellers enquiry #'+item.id.slice(0,8).toUpperCase())} target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> WhatsApp customer</a>
        </div>
        {quoteEditing===item.id&&<form className="crm-quotation-editor" onSubmit={e=>void sendQuotation(e,item.id)}>
          <div><label>Final quoted price (₹)<input name="amount" type="number" step=".01" min="1" max="10000000" defaultValue={item.quote?.amount||item.estimatedMax||''} required/></label>
            <label>Quotation notes & conditions<textarea name="notes" rows={3} defaultValue={item.quote?.notes||''} placeholder="Duration, tolls, GST, driver stay, vehicle details..."/></label></div>
          <p>{item.email?'Customer email: '+item.email:'No customer email collected. This will prepare a business copy only.'} Business email and WhatsApp copies are included in the local outbox. Actual sending stays disabled until providers are configured and live mode is explicitly enabled.</p>
          <button className="fleet-save" type="submit" disabled={quoteSaving}><Send size={15}/>{quoteSaving?'Preparing...':'Save quotation & prepare notifications'}</button>
        </form>}
                {item.notes&&<p className="crm-card-notes">{item.notes}</p>}
        <div className="crm-card-foot"><span>Reference: {item.id.slice(0,8).toUpperCase()}</span>{item.estimatedMax>0&&<span>Indicative: ₹{item.estimatedMin.toLocaleString('en-IN')}–₹{item.estimatedMax.toLocaleString('en-IN')}</span>}</div>
      </article>)}</div>
      </div>
      )}
    </section>}
  </main>;
}
