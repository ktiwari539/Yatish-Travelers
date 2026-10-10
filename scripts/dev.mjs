import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

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
