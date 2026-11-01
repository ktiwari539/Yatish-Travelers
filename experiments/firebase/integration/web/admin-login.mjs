/** Firebase Web SDK operations are injected for deterministic tests. No secrets,
 * token persistence, or client-side UID grants belong in this controller. */
export function createAdminLogin({auth,sdk,authorize,onChange=()=>{},now=()=>Date.now(),cooldownMs=60000}){
 let epoch=0,phase='signed-out',message='',busy=false,unsubscribe;
 const sentAt=new Map();
 const snapshot=()=>({phase,message,busy,email:auth.currentUser?.email||'',uid:auth.currentUser?.uid||'',verified:auth.currentUser?.emailVerified===true,authorized:phase==='authorized',retryAfterMs:Math.max(0,cooldownMs-(now()-(sentAt.get(auth.currentUser?.uid)??-Infinity)))});
 const publish=()=>onChange(snapshot());
 const stillCurrent=(version,user)=>version===epoch&&user===auth.currentUser;
 const lockedError=()=>new Error('ADMIN_LOCKED');
 async function check(user,{refresh=false}={}){
  const version=++epoch;phase=user?'checking':'signed-out';message='';publish();
  if(!user)return;
  try{
   if(refresh)await sdk.reload(user);
   if(!stillCurrent(version,user))return;
   if(user.emailVerified!==true){phase='unverified';message='Verify your email before opening Admin CRM.';publish();return;}
   const token=await user.getIdToken(true);
   if(!stillCurrent(version,user))return;
   const approved=await authorize(token);
   if(!stillCurrent(version,user))return;
   phase=approved===true?'authorized':'denied';
   message=approved===true?'Verified email and server authorization confirmed.':'Email verified. Admin CRM remains locked: this session was not authorized by the server.';
  }catch{
   if(!stillCurrent(version,user))return;
   phase='denied';message='Admin CRM remains locked. The server could not authorize this session; retry when staging is configured.';
  }
  if(stillCurrent(version,user))publish();
 }
 return {
  snapshot,
  start(){unsubscribe=sdk.onAuthStateChanged(auth,user=>{void check(user);});return ()=>{epoch++;unsubscribe?.();};},
  async signIn(email,password){
   if(busy)return;busy=true;phase='checking';message='';publish();
   try{const credential=await sdk.signInWithEmailAndPassword(auth,email,password);await check(credential.user);}
   catch{phase='signed-out';message='Sign-in failed. Check your credentials and staging configuration.';}
   finally{busy=false;publish();}
  },
  async sendVerification(){
   const user=auth.currentUser;if(!user||user.emailVerified||busy)return;
   if(snapshot().retryAfterMs>0){message='A verification email was already requested. Please wait before resending.';publish();return;}
   const version=epoch;busy=true;publish();
   try{
    await sdk.sendEmailVerification(user);
    sentAt.set(user.uid,now());
    if(stillCurrent(version,user))message='Verification email sent. Check Inbox and Spam, open the link, then select “I’ve verified — refresh status”.';
   }catch(error){
    if(stillCurrent(version,user))message=error?.code==='auth/too-many-requests'?'Firebase limited verification requests. Wait before trying again.':'Verification email could not be sent. Please retry later; Admin CRM remains locked.';
   }finally{busy=false;publish();}
  },
  async refresh(){if(busy)return;busy=true;publish();try{await check(auth.currentUser,{refresh:true});}finally{busy=false;publish();}},
  async signOut(){epoch++;phase='signed-out';message='';publish();try{await sdk.signOut(auth);}finally{phase='signed-out';message='Signed out.';publish();}},
  lock(){epoch++;phase=auth.currentUser?'denied':'signed-out';message='Admin authorization expired or was refused. Refresh your status or sign in again.';publish();},
  async adminToken(){
   const user=auth.currentUser,version=epoch;
   if(phase!=='authorized'||!user||user.emailVerified!==true)throw lockedError();
   const token=await user.getIdToken(true);
   if(!stillCurrent(version,user)||phase!=='authorized')throw lockedError();return token;
  }
 };
}
