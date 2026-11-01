// Vite exposes client-prefixed variables. Never print their values on failure.
const forbidden=Object.keys(process.env).filter(key=>key.startsWith('VITE_')&&/(TOKEN|SECRET|PASSWORD|PRIVATE|API_KEY|CREDENTIAL)/i.test(key));
if(forbidden.length){console.error('Build refused: secret-like VITE_ variable names are forbidden. Move credentials to the CRM host secret manager.');process.exit(1);}
if(process.env.VITE_FIREBASE_CONFIG){
 try{const c=JSON.parse(process.env.VITE_FIREBASE_CONFIG),allowed=['apiKey','authDomain','projectId','appId','messagingSenderId','measurementId'];
  if(!c||Object.keys(c).some(k=>!allowed.includes(k))||!c.apiKey||!c.appId||!c.authDomain||!['mateshwari-travellers','demo-mateshwari-poc'].includes(c.projectId)||(process.env.NETLIFY==='true'&&c.projectId!=='mateshwari-travellers'))throw Error();
 }catch{console.error('Build refused: invalid public Firebase Web configuration. Privileged credentials belong exclusively in provider secret managers.');process.exit(1);}
}
