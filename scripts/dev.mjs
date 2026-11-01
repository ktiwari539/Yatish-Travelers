import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';

// The reviewed user-provided binary photo pack is not committed to GitHub.
// When the user has downloaded the exact ZIP to Downloads, install it safely
// before starting Vite/API. The installer verifies the archive SHA-256 and
// refuses to overwrite customized media files.
const completePack=join(homedir(),'Downloads','mateshwari_complete_media_review.zip');
const safePack=join(homedir(),'Downloads','mateshwari_fleet_photography_safe_pack.zip');
const fleetFiles=['mt-thar-red-front.webp','mt-xuv700-driving.webp','mt-traveller-safe.webp'];
if(existsSync(completePack)){
  try{
    execFileSync(process.execPath,[resolve('scripts/install-complete-media.mjs')],{stdio:'inherit'});
  }catch{
    console.warn('Complete media install was skipped. Run npm run media:install for details.');
  }
}else if(existsSync(safePack)){
  try{
    execFileSync(process.execPath,[resolve('scripts/install-fleet-media.mjs')],{stdio:'inherit'});
  }catch{
    console.warn('Fleet media automatic install skipped. Run npm run fleet:install for details.');
  }
}
if(fleetFiles.some(file=>!existsSync(resolve('public/media',file)))){
  console.warn('\n[FLEET PHOTO PACK MISSING] Thar, XUV700 and Traveller will show safe model placeholders, not old photos with registration numbers.');
  console.warn('Download mateshwari_complete_media_review.zip from the chat into ~/Downloads and restart npm run dev:full.\n');
}

// Stage authentic, attributed review images outside public/ and dist. These
// local-only images cannot be shipped accidentally by Vite production builds.
try{
 execFileSync(process.execPath,[resolve('scripts/install-studio-review.mjs')],{stdio:'inherit',timeout:50000});
 process.env.VITE_STUDIO_REVIEW_READY='1';
}catch{
 console.warn('[studio] Preview photo cache incomplete; Wikimedia fallback references remain available.');
 process.env.VITE_STUDIO_REVIEW_READY='0';
}

const children = [
  spawn(process.execPath, [resolve('server/crm.mjs')], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js')], { stdio: 'inherit', env: process.env }),
];
let exiting = false;
function stop(signal='SIGTERM') {
  if (exiting) return;
  exiting = true;
  for (const child of children) if (!child.killed) child.kill(signal);
}
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>stop(signal));
for (const child of children) child.on('exit',(code)=>{
  if (!exiting) { stop(); process.exitCode = code || 1; }
});
console.log('Local preview: public site at http://localhost:5173 and staff CRM at http://localhost:5173/admin');
