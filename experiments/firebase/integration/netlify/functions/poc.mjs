import {getRuntime} from '../../runtime.mjs';
import {createHandler,json} from '../../handler.mjs';
export default async (request,context)=>{
 try {
  // No Admin SDK objects or credentials cross into the browser module graph.
  const names=['CONTEXT','NETLIFY','POC_FIREBASE_PROJECT_ID','POC_ADMIN_UIDS','POC_RATE_SALT','POC_ENABLE_STAGING','POC_PROJECT_PURPOSE','FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST'];
  const env=Object.fromEntries(names.map(key=>[key,globalThis.Netlify?.env?.get(key)??process.env[key]]));
  return await createHandler(getRuntime(env))(request,context);
 }catch{return json({error:'POC_NOT_CONFIGURED'},503);}
};
export const config={path:'/api/poc/*',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:'ip',action:'rate_limit'}};
