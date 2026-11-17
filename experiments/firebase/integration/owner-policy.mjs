// Server-only identity restriction for the existing Firebase project.
export const OWNER_PROJECT='mateshwari-travellers';
export const OWNER_UID='ejz9iejTasZMZSEc5nKnh7npNk72';
export const OWNER_EMAIL='mateshwaritravellers@gmail.com';
export function identityPolicy(projectId,configuredUids){
 const ids=(configuredUids||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(projectId===OWNER_PROJECT){
  if(ids.some(id=>id!==OWNER_UID))throw Error('Owner project only permits its explicitly approved staff UID');
  return {allowedUids:[OWNER_UID],allowedEmail:OWNER_EMAIL};
 }
 if(!ids.length)throw Error('Server-only Admin UID allowlist required');
 return {allowedUids:ids};
}
