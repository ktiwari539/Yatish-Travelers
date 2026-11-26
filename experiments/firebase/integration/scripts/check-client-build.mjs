import {readdirSync,readFileSync} from 'node:fs';
const approved=new Set(['VITE_POC_USE_EMULATORS','VITE_POC_WEB_CONFIG']);
if(Object.keys(process.env).some(k=>k.startsWith('VITE_')&&!approved.has(k)))throw Error('Unexpected client environment variable; keep privileged values server-side');
for(const name of readdirSync('dist/assets'))if(name.endsWith('.js')){
 const text=readFileSync('dist/assets/'+name,'utf8');
 if(/BEGIN (?:RSA )?PRIVATE KEY|firebase-admin|POC_ADMIN_UIDS|POC_RATE_SALT|service_account/.test(text))throw Error('Server-only material found in client build');
}
console.log('Client bundle boundary check passed; no privileged Admin SDK/config detected.');
