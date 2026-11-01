import test from 'node:test';
import assert from 'node:assert/strict';
import {createFirebaseAdminAuthorizer} from './firebase-admin-auth.mjs';
const uid='ejz9iejTasZMZSEc5nKnh7npNk72';
test('only verified allowlisted password user passes',async()=>{
 let revocationChecked=false;
 const verifyIdToken=async (token,checkRevoked)=>{revocationChecked=checkRevoked===true;return ({
  good:{uid,email_verified:true,firebase:{sign_in_provider:'password'}},
  wrong:{uid:'another-user',email_verified:true,firebase:{sign_in_provider:'password'}},
  unverified:{uid,email_verified:false,firebase:{sign_in_provider:'password'}},
  missing:{uid,firebase:{sign_in_provider:'password'}},
  anonymous:{uid,email_verified:true,firebase:{sign_in_provider:'anonymous'}}
 }[token]);};
 const authorized=createFirebaseAdminAuthorizer({verifyIdToken,allowedUids:[uid]});
 assert.equal(await authorized('Bearer good'),true);
 assert.equal(revocationChecked,true);
 for(const header of ['Bearer missing','Bearer wrong','Bearer unverified','Bearer anonymous','Bearer bad','Basic good','Bearer','Bearer good extra','']){
  assert.equal(await authorized(header),false,header);
 }
});
test('configuration fails closed',()=>{
 assert.throws(()=>createFirebaseAdminAuthorizer({verifyIdToken:async()=>null,allowedUids:[]}),/allowed UID/);
 assert.throws(()=>createFirebaseAdminAuthorizer({allowedUids:[uid]}),/verifier/);
});
