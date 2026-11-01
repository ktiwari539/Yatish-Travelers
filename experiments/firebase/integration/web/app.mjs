import {initializeApp} from 'firebase/app';
import {initializeAuth,connectAuthEmulator,inMemoryPersistence,signInWithEmailAndPassword,signOut,sendEmailVerification,onAuthStateChanged,reload} from 'firebase/auth';
import {createAdminLogin} from './admin-login.mjs';
const $=id=>document.getElementById(id);
const emulator=import.meta.env.VITE_POC_USE_EMULATORS==='true';
let auth,login,currentRecord,requestKey,previousPayload;
function message(text){$('message').textContent=text;}
function renderIdentity(state){
 $('identity').textContent=state.email?(state.authorized?'Admin CRM access approved.':state.verified?'Email verified; Admin CRM is locked pending server approval.':'Email verification required. Admin CRM is locked.'):'Signed out. Tokens remain in memory.';
 $('login').querySelector('button').disabled=state.busy;
 $('login').hidden=Boolean(state.email);$('logout').hidden=!state.email;
 $('verify').hidden=!state.email||state.verified;
 $('refresh').hidden=!state.email;$('refresh').disabled=state.busy;
 $('verify').disabled=state.busy||state.retryAfterMs>0;
 $('verify').textContent=state.retryAfterMs>0?'Resend available in '+Math.ceil(state.retryAfterMs/1000)+'s':'Send verification email';
 $('list').hidden=!state.authorized;$('list').disabled=state.busy;
 $('admin-workspace').hidden=!state.authorized;$('admin-controls').disabled=!state.authorized||state.busy;
 if(!state.authorized){currentRecord=null;$('record').textContent='No enquiry loaded';}
 message(state.message);
}
try{
 const config=emulator?{apiKey:'fake-emulator-key',projectId:'demo-mateshwari-poc',authDomain:'localhost',appId:'demo'}:JSON.parse(import.meta.env.VITE_POC_WEB_CONFIG||'null');
 if(!config||(!emulator&&!(config.projectId==='mateshwari-travellers'||/^mateshwari-poc-[a-z0-9-]+$/.test(config.projectId))))throw Error();
 if(emulator&&!['localhost','127.0.0.1','terminal.local'].includes(location.hostname))throw Error();
 auth=initializeAuth(initializeApp(config),{persistence:inMemoryPersistence});
 if(emulator)connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 $('environment').textContent=emulator?'Local Auth and Firestore emulator workflow':'Isolated staging sign-in — existing Firebase account';
 login=createAdminLogin({auth,sdk:{signInWithEmailAndPassword,signOut,sendEmailVerification,onAuthStateChanged,reload},authorize:async token=>{
  const response=await fetch('/api/poc/admin/session',{headers:{Authorization:'Bearer '+token},mode:'same-origin',credentials:'omit',cache:'no-store'});
  return response.ok&&(await response.json()).authorized===true;
 },onChange:renderIdentity});
 login.start();
 // Only updates the resend countdown; it never sends email automatically.
 setInterval(()=>{const state=login.snapshot();$('verify').disabled=state.busy||state.retryAfterMs>0;$('verify').textContent=state.retryAfterMs>0?'Resend available in '+Math.ceil(state.retryAfterMs/1000)+'s':'Send verification email';},1000);
}catch{message('Staging sign-in is not configured. Admin CRM remains locked.');for(const button of document.querySelectorAll('button'))button.disabled=true;}
async function run(button,work){button.disabled=true;try{await work();}catch{message('Operation refused or unavailable. Admin access requires verified email and server approval.');}finally{button.disabled=false;}}
async function api(path,options={},admin=false){
 const headers={'Content-Type':'application/json',...options.headers};
 if(admin)headers.Authorization='Bearer '+await login.adminToken();
 const response=await fetch('/api/poc/'+path,{...options,headers,mode:'same-origin',credentials:'omit'});
 const data=await response.json();
 if(!response.ok){if(admin&&[401,403,503].includes(response.status))login.lock();throw Error(data.error);}return data;
}
function show(value){currentRecord=value;$('record').textContent=JSON.stringify(value,null,2);}
$('login').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form);void login?.signIn(data.get('email'),data.get('password')).finally(()=>{form.elements.namedItem('password').value='';});});
$('logout').onclick=()=>login?.signOut();
$('verify').onclick=()=>login?.sendVerification();
$('refresh').onclick=()=>login?.refresh();
$('list').onclick=()=>run($('list'),async()=>{const value=await api('admin/enquiries',{},true);$('record').textContent=JSON.stringify(value,null,2);currentRecord=null;message('Latest bounded list loaded.');});
$('enquiry').onsubmit=event=>{event.preventDefault();const form=event.currentTarget;void run(form.querySelector('button'),async()=>{
 const payload=JSON.stringify({...Object.fromEntries(new FormData(form)),mode:'quote'});
 if(payload!==previousPayload){requestKey=crypto.randomUUID();previousPayload=payload;}
 const value=await api('enquiries',{method:'POST',headers:{'Idempotency-Key':requestKey},body:payload});
 $('retrieve').elements.namedItem('id').value=value.id;message('Synthetic enquiry saved. Reference: '+value.id);
});};
$('retrieve').onsubmit=event=>{event.preventDefault();const form=event.currentTarget;void run(form.querySelector('button'),async()=>{show(await api('admin/enquiries/'+new FormData(form).get('id'),{},true));message('Retrieved after server authorization.');});};
for(const [formId,method,suffix] of [['quote','POST','/quotation'],['status','PATCH','']])$(formId).onsubmit=event=>{
 event.preventDefault();const form=event.currentTarget;void run(form.querySelector('button'),async()=>{
  if(!currentRecord?.id)throw Error();const input=Object.fromEntries(new FormData(form));if(formId==='quote')input.amount=Number(input.amount);
  show(await api('admin/enquiries/'+currentRecord.id+suffix,{method,body:JSON.stringify({...input,expectedVersion:currentRecord.version})},true));message('Versioned synthetic update saved.');
 });
};
