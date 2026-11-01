import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminLogin} from '../web/admin-login.mjs';
import {identityPolicy,OWNER_UID,OWNER_EMAIL,OWNER_PROJECT} from '../owner-policy.mjs';
import {createFirebaseAdminAuthorizer} from '../../firebase-admin-auth.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture(options={}){
 let time=100000,listener;const calls=[];
 const user={uid:'synthetic-staff',email:'synthetic@example.invalid',emailVerified:false,async getIdToken(force){calls.push(['token',force]);return 'synthetic-token';}};
 const auth={currentUser:user};
 const sdk={onAuthStateChanged(_auth,fn){listener=fn;return ()=>{};},async reload(){calls.push(['reload']);if(options.reload)await options.reload(user);},async sendEmailVerification(value){calls.push(['send',value.uid]);if(options.send)await options.send();},async signInWithEmailAndPassword(){return {user};},async signOut(){auth.currentUser=null;listener?.(null);}};
 const login=createAdminLogin({auth,sdk,authorize:async token=>{calls.push(['authorize',token]);return options.authorize?options.authorize(token):true;},now:()=>time});
 return {user,auth,sdk,login,calls,advance(ms){time+=ms;}};
}
test('verification is explicit, cooldown limits repeat sends, refresh forces new token before server unlock',async()=>{
 const f=fixture({reload:user=>{user.emailVerified=true;}});
 await f.login.refresh();assert.equal(f.login.snapshot().authorized,true);
 assert.deepEqual(f.calls.map(x=>x[0]),['reload','token','authorize']);
 assert.equal(f.calls[1][1],true);
 const unverified=fixture();await unverified.login.refresh();assert.equal(unverified.login.snapshot().phase,'unverified');
 assert.equal(unverified.calls.some(c=>c[0]==='authorize'),false);
 await assert.rejects(()=>unverified.login.adminToken(),/ADMIN_LOCKED/);
 await unverified.login.sendVerification();await unverified.login.sendVerification();assert.equal(unverified.calls.filter(c=>c[0]==='send').length,1);
 assert.equal(unverified.login.snapshot().authorized,false);unverified.advance(60001);await unverified.login.sendVerification();assert.equal(unverified.calls.filter(c=>c[0]==='send').length,2);
});
test('verified email cannot bypass failed/unavailable server authorization',async()=>{
 for(const authorize of [async()=>false,async()=>{throw Error('unavailable');}]){
  const f=fixture({authorize,reload:user=>{user.emailVerified=true;}});await f.login.refresh();assert.equal(f.login.snapshot().phase,'denied');assert.equal(f.login.snapshot().authorized,false);
  await assert.rejects(()=>f.login.adminToken(),/ADMIN_LOCKED/);
 }
});
test('signing out while server check is pending cannot unlock the new session',async()=>{
 const pending=deferred(),f=fixture({authorize:()=>pending.promise,reload:user=>{user.emailVerified=true;}});
 const refreshing=f.login.refresh();while(!f.calls.some(c=>c[0]==='authorize'))await Promise.resolve();
 await f.login.signOut();pending.resolve(true);await refreshing;
 assert.equal(f.login.snapshot().phase,'signed-out');assert.equal(f.login.snapshot().authorized,false);
});
test('email send failure remains locked and reports throttling without leaking SDK details',async()=>{
 const f=fixture({send:()=>{const error=new Error('private provider diagnostic');error.code='auth/too-many-requests';throw error;}});
 await f.login.sendVerification();assert.equal(f.login.snapshot().authorized,false);assert.match(f.login.snapshot().message,/limited/);assert.ok(!f.login.snapshot().message.includes('private provider'));
});
test('owner identity is fixed on server; verified email or caller-supplied UID cannot grant access',async()=>{
 const policy=identityPolicy(OWNER_PROJECT,'');assert.deepEqual(policy,{allowedUids:[OWNER_UID],allowedEmail:OWNER_EMAIL});
 assert.throws(()=>identityPolicy(OWNER_PROJECT,'attacker'));
 const claims={uid:OWNER_UID,email:OWNER_EMAIL,email_verified:true,firebase:{sign_in_provider:'password'}};
 const authorize=createFirebaseAdminAuthorizer({...policy,verifyIdToken:async(_token,revoked)=>{assert.equal(revoked,true);return claims;}});
 assert.equal(await authorize('Bearer synthetic'),true);
 claims.email_verified=false;assert.equal(await authorize('Bearer synthetic'),false);
 claims.email_verified=true;claims.uid='attacker';assert.equal(await authorize('Bearer synthetic'),false);
 claims.uid=OWNER_UID;claims.email='wrong@example.invalid';assert.equal(await authorize('Bearer synthetic'),false);
});
