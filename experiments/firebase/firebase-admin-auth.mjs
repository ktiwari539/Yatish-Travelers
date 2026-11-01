/** Verify Firebase ID token server-side and restrict CRM admin to one explicit UID.
 * Token verification provider is injected for offline tests. No email-only grants.
 */
export function createFirebaseAdminAuthorizer({verifyIdToken,allowedUids,allowedEmail}){
 if(typeof verifyIdToken!=='function')throw Error('A Firebase Admin SDK verifier is required');
 const ids=new Set((allowedUids||[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()));
 if(ids.size===0)throw Error('At least one allowed UID required');
 return async authorization=>{
  if(typeof authorization!=='string')return false;
  const match=/^Bearer ([^\s]+)$/.exec(authorization);
  if(!match||match[1].length>8192)return false;
  try{
   const decoded=await verifyIdToken(match[1],true);
   return Boolean(decoded?.uid&&ids.has(decoded.uid)&&decoded.firebase?.sign_in_provider==='password'&&decoded.email_verified===true&&(!allowedEmail||decoded.email?.toLowerCase()===allowedEmail.toLowerCase()));
  }catch{return false;}
 };
}
