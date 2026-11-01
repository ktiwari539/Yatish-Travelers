import {readFileSync,readdirSync} from 'node:fs';
const files=readdirSync('dist/assets').filter(x=>x.endsWith('.js'));const text=files.map(x=>readFileSync('dist/assets/'+x,'utf8')).join('\n');
for(const marker of ['ejz9iejTasZMZSEc5nKnh7npNk72','FIREBASE_PRIVATE_KEY','CRM_BACKUP_KEY','CRM_RATE_SALT','firebase-admin/firestore'])if(text.includes(marker))throw Error('Server-only marker detected in browser assets');
console.log('PASS: privileged configuration and owner UID absent from browser assets');
