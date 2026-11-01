const allowed=new Set(['VITE_POC_USE_EMULATORS','VITE_POC_WEB_CONFIG']);
if(Object.keys(process.env).some(key=>key.startsWith('VITE_')&&!allowed.has(key)))throw Error('Unexpected public configuration name');
if(process.env.VITE_POC_USE_EMULATORS&&!['true','false'].includes(process.env.VITE_POC_USE_EMULATORS))throw Error('Invalid emulator flag');
if(process.env.VITE_POC_WEB_CONFIG){
 let value;try{value=JSON.parse(process.env.VITE_POC_WEB_CONFIG);}catch{throw Error('Invalid public Firebase Web config');}
 const keys=new Set(['apiKey','authDomain','projectId','appId','messagingSenderId','measurementId']);
 if(!value||Array.isArray(value)||Object.entries(value).some(([k,v])=>!keys.has(k)||typeof v!=='string'||/PRIVATE KEY|service_account/.test(v))||!/^mateshwari-poc-[a-z0-9-]+$/.test(value.projectId||'')||!value.apiKey||!value.appId)throw Error('Only explicit staging Firebase Web config fields are allowed');
}
