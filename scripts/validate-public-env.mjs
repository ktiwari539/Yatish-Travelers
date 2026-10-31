// Vite exposes client-prefixed variables. Never print their values on failure.
const forbidden=Object.keys(process.env).filter(key=>key.startsWith('VITE_')&&/(TOKEN|SECRET|PASSWORD|PRIVATE|API_KEY|CREDENTIAL)/i.test(key));
if(forbidden.length){console.error('Build refused: secret-like VITE_ variable names are forbidden. Move credentials to the CRM host secret manager.');process.exit(1);}
