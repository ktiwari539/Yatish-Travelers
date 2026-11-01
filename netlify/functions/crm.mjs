import {createRuntime} from '../../server/firebase/runtime.mjs';
import {createCrmHandler,json} from '../../server/firebase/handler.mjs';
const keys=['NETLIFY','CRM_FIREBASE_PROJECT_ID','CRM_RELEASE_ENABLED','CRM_MIGRATION_APPROVAL','CRM_RESTORE_APPROVAL','CRM_RATE_SALT','CRM_BACKUP_KEY','CRM_ADMIN_UIDS','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','GOOGLE_APPLICATION_CREDENTIALS','CRM_NOTIFICATIONS_MODE','CRM_NOTIFICATION_APPROVAL','CRM_EMAIL_TO','CRM_WHATSAPP_TO','CRM_EMAIL_FROM','RESEND_API_KEY','WHATSAPP_BUSINESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_TEMPLATE_NAME','WHATSAPP_TEMPLATE_LANG','WHATSAPP_GRAPH_VERSION'];
let runtime;
export default async(req,context)=>{
 try{const env=Object.fromEntries(keys.map(k=>[k,Netlify.env.get(k)]));runtime||=createRuntime(env,context);return await createCrmHandler(runtime)(req,context);}catch{return json({error:'SERVICE_UNAVAILABLE'},503);}
};
export const config={path:'/api/*',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:120}};
