import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const stub=`#!/usr/bin/env python3
import json,os,sys
args=sys.argv[1:]
with open(os.environ['IAM_CALLS'],'a') as f: f.write(json.dumps(args)+'\\n')
s=os.environ['IAM_SCENARIO']
project='mateshwari-travellers'
email='netlify-crm-runtime@'+project+'.iam.gserviceaccount.com'
role='projects/'+project+'/roles/crmFirebaseAuthLookup'
if args[:3]==['iam','service-accounts','list']:
 if s=='inventory-failure': sys.exit(1)
 print(json.dumps([] if s=='new' else [{'email':email,'disabled':s=='disabled'}]))
elif args[:3]==['iam','roles','list']: print(json.dumps([] if s=='new' else [{'name':role}]))
elif args[:3]==['iam','roles','describe']:
 print(json.dumps({'includedPermissions':['firebaseauth.users.get']+(['firebaseauth.users.delete'] if s=='broad-role' else []),'stage':'GA'}))
elif args[:2]==['projects','get-iam-policy']:
 bindings=[{'role':'roles/datastore.user','members':['serviceAccount:'+email]},{'role':role,'members':['serviceAccount:'+email]}]
 if s=='broad-account': bindings.append({'role':'roles/editor','members':['serviceAccount:'+email]})
 if s=='conditional': bindings[0]['condition']={'expression':'true'}
 if s=='new': bindings=[]
 print(json.dumps({'bindings':bindings}))
else: print('{}')
`;
function run(t,scenario,mode='--plan') {
 const dir=mkdtempSync(join(tmpdir(),'mt-iam-script-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 writeFileSync(join(dir,'gcloud'),stub,{mode:0o700});
 const log=join(dir,'calls');
 const r=spawnSync('bash',[resolve('scripts/configure-google-service-account.sh'),mode],{env:{...process.env,PATH:dir+':'+process.env.PATH,IAM_SCENARIO:scenario,IAM_CALLS:log},encoding:'utf8'});
 const calls=readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);
 return {...r,calls};
}
const writes=calls=>calls.filter(c=>c.includes('create')||c.includes('add-iam-policy-binding'));
test('IAM default plan inventories and reuses earlier runtime account without writes',t=>{
 const r=run(t,'existing');assert.equal(r.status,0,r.stderr);assert.equal(writes(r.calls).length,0);assert.match(r.stdout,/netlify-crm-runtime@/);
});
test('IAM apply verifies existing Auth role and reads back grants without duplicate accounts or keys',t=>{
 const r=run(t,'existing','--apply');assert.equal(r.status,0,r.stderr);
 assert.equal(r.calls.filter(c=>c.includes('create')).length,0);
 assert.equal(r.calls.filter(c=>c.includes('add-iam-policy-binding')).length,2);
 assert.ok(!r.calls.some(c=>c.includes('keys')));assert.match(r.stdout,/Verified both/);
});
for(const scenario of ['inventory-failure','broad-account','broad-role','disabled','conditional']) test('IAM fails closed before writes: '+scenario,t=>{
 const r=run(t,scenario,'--apply');assert.notEqual(r.status,0);assert.equal(writes(r.calls).length,0);
});
test('IAM plan for absent runtime identity still never creates resources',t=>{
 const r=run(t,'new');assert.equal(r.status,0,r.stderr);assert.equal(writes(r.calls).length,0);assert.match(r.stdout,/mateshwari-netlify-crm@/);
});
