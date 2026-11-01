import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,setPersistence,inMemoryPersistence,signInWithEmailAndPassword,signOut,sendEmailVerification,onAuthStateChanged,reload} from 'firebase/auth';
const $=id=>document.getElementById(id);
const emulator=import.meta.env.VITE_POC_USE_EMULATORS==='true';
let auth,currentRecord,requestKey,previousPayload;
function message(text){$('message').textContent=text;}
try{
 const config=emulator?{apiKey:'fake-emulator-key',projectId:'demo-mateshwari-poc',authDomain:'localhost',appId:'demo'}:JSON.parse(import.meta.env.VITE_POC_WEB_CONFIG||'null');
 if(!config||(!emulator&&!(config.projectId==='mateshwari-travellers'||/^mateshwari-poc-[a-z0-9-]+$/.test(config.projectId))))throw Error();
 if(emulator&&!['localhost','127.0.0.1','terminal.local'].includes(location.hostname))throw Error();
 auth=getAuth(initializeApp(config));
 if(emulator)connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 await setPersistence(auth,inMemoryPersistence);
 $('environment').textContent=emulator?'Local Auth and Firestore emulator workflow':'Explicit staging Firebase project: '+config.projectId;
 const updateIdentity=user=>{
  $('identity').textContent=user?(user.emailVerified?'Signed in; server authorization still required.':'Verify your email before Admin access.'):'Signed out. Tokens remain in memory.';
  $('login').hidden=Boolean(user);$('logout').hidden=!user;$('verify').hidden=!user||user.emailVerified;$('refresh').hidden=!user||user.emailVerified;$('list').hidden=!user||!user.emailVerified;
 };
 onAuthStateChanged(auth,updateIdentity);
 auth.updatePreviewIdentity=updateIdentity;
}catch{message('Preview not configured. Supply an isolated staging Web configuration or start the local emulators.');for(const button of document.querySelectorAll('button'))button.disabled=true;}
async function run(button,work){button.disabled=true;try{await work();}catch{message('Operation refused or unavailable. Check sign-in, verification, allowlist, input, version and POC limits.');}finally{button.disabled=false;}}
async function api(path,options={},admin=false){
 const headers={'Content-Type':'application/json',...options.headers};
 if(admin){if(!auth?.currentUser)throw Error();headers.Authorization='Bearer '+await auth.currentUser.getIdToken(true);}
 const response=await fetch('/api/poc/'+path,{...options,headers,mode:'same-origin',credentials:'omit'});
 const data=await response.json();if(!response.ok)throw Error(data.error);return data;
}
function show(value){currentRecord=value;$('record').textContent=JSON.stringify(value,null,2);}
$('login').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form);void run(form.querySelector('button'),async()=>{await signInWithEmailAndPassword(auth,data.get('email'),data.get('password'));form.reset();message('Signed in. Privileged requests are checked server-side.');});});
$('logout').onclick=()=>run($('logout'),async()=>{await signOut(auth);show(null);message('Signed out.');});
$('verify').onclick=()=>run($('verify'),async()=>{await sendEmailVerification(auth.currentUser);message('Verification requested. Use your staging verification email; the local emulator prints verification links.');});
$('refresh').onclick=()=>run($('refresh'),async()=>{await reload(auth.currentUser);await auth.currentUser.getIdToken(true);auth.updatePreviewIdentity(auth.currentUser);message('Verification refreshed. Server authorization is still required.');});
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
