import {initializeApp,getApps,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {createFirebaseAdminAuthorizer} from '../firebase-admin-auth.mjs';
import {createRepository} from './repository.mjs';

export function validateConfig(env) {
 const projectId=env.POC_FIREBASE_PROJECT_ID;
 const firestore=env.FIRESTORE_EMULATOR_HOST,auth=env.FIREBASE_AUTH_EMULATOR_HOST;
 if(env.CONTEXT==='production')throw Error('POC production context is forbidden');
 const emulator=Boolean(firestore||auth);
 if(emulator){
  if(env.NETLIFY==='true'||projectId!=='demo-mateshwari-poc'||![firestore,auth].every(v=>/^127\.0\.0\.1:\d+$/.test(v||'')))throw Error('Both loopback emulators and demo project are required locally');
 }else{
  if(!['deploy-preview','branch-deploy'].includes(env.CONTEXT)||env.POC_ENABLE_STAGING!=='true'||env.POC_PROJECT_PURPOSE!=='development-only'||!(projectId==='mateshwari-travellers'||/^mateshwari-poc-[a-z0-9-]+$/.test(projectId||'')))throw Error('Explicit isolated staging configuration required');
 }
 const allowedUids=(env.POC_ADMIN_UIDS||'').split(',').map(v=>v.trim()).filter(Boolean);
 if(!allowedUids.length)throw Error('Server-only Admin UID allowlist required');
 if(!env.POC_RATE_SALT||env.POC_RATE_SALT.length<32)throw Error('Server-only rate salt of at least 32 characters required');
 return {projectId,emulator,allowedUids,rateSalt:env.POC_RATE_SALT};
}
let cached;
export function getRuntime(env=process.env){
 const config=validateConfig(env);
 if(cached){if(cached.projectId!==config.projectId||cached.emulator!==config.emulator)throw Error('Runtime project change refused');return cached;}
 const app=getApps().find(a=>a.name==='mateshwari-isolated-poc')||initializeApp({projectId:config.projectId,...(!config.emulator?{credential:applicationDefault()}:{})},'mateshwari-isolated-poc');
 const auth=getAuth(app),db=getFirestore(app);
 const authorize=createFirebaseAdminAuthorizer({verifyIdToken:(token,revoked)=>auth.verifyIdToken(token,revoked),allowedUids:config.allowedUids});
 cached={...config,db,auth,authorize,repository:createRepository(db,{serverTimestamp:()=>FieldValue.serverTimestamp(),rateSalt:config.rateSalt})};
 return cached;
}
