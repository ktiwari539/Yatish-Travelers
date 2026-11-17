import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const temporary=mkdtempSync(join(tmpdir(),'mateshwari-poc-emulators-'));
const snapshot=join(temporary,'export');
async function run(args){
 const child=spawn(process.execPath,[resolve('node_modules/firebase-tools/lib/bin/firebase.js'),'emulators:exec','--project','demo-mateshwari-poc','--only','auth,firestore',...args],{stdio:'inherit',env:{...process.env,HTTP_PROXY:'',HTTPS_PROXY:'',http_proxy:'',https_proxy:'',NO_PROXY:'127.0.0.1,localhost',no_proxy:'127.0.0.1,localhost',CI:'true',GCLOUD_PROJECT:'demo-mateshwari-poc',JAVA_TOOL_OPTIONS:'-Xmx512m'}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});if(code!==0)throw Error('Emulator suite failed');
}
try{
 await run(['--export-on-exit',snapshot,'node --test tests/emulator.integration.mjs']);
 await run(['--import',snapshot,'node --test tests/restart.integration.mjs']);
}finally{rmSync(temporary,{recursive:true,force:true});}
