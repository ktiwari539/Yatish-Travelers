// Offline snapshots only: stop CRM before backup AND restore. Snapshots contain
// customer PII; encrypt and copy off-host using your infrastructure backup tool.
import {mkdirSync,readdirSync,lstatSync,readFileSync,writeFileSync,copyFileSync,existsSync,chmodSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
function files(root,prefix='') {
 const out=[];
 for(const entry of readdirSync(join(root,prefix),{withFileTypes:true})) {
  const name=join(prefix,entry.name),path=join(root,name);
  if(lstatSync(path).isSymbolicLink())throw Error('Symlinks are forbidden in snapshots.');
  if(entry.isDirectory())out.push(...files(root,name));
  else if(entry.isFile())out.push(name);
  else throw Error('Unsupported snapshot entry.');
 }
 return out.sort();
}
function empty(root) {if(existsSync(root)&&readdirSync(root).length)throw Error('Destination must be empty.');}
function disjoint(roots) {
 for(const a of roots)for(const b of roots)if(a!==b&&(!relative(a,b).startsWith('..')))throw Error('Paths must be separate, non-nested directories.');
 if(new Set(roots).size!==roots.length)throw Error('Paths must differ.');
}
export function snapshot(mode,first,second,third) {
 if(process.env.CRM_OFFLINE!=='true')throw Error('Stop CRM first, then set CRM_OFFLINE=true for this offline operation.');
 const roots=[first,second,third].map(p=>resolve(p));disjoint(roots);
 for(const root of roots)if(existsSync(root)&&lstatSync(root).isSymbolicLink())throw Error('Symlink roots are forbidden.');
 if(mode==='backup') {
  const [data,media,destination]=roots;empty(destination);
  const manifest={version:1,createdAt:new Date().toISOString(),files:[]};
  // Validate journals before copying; never certify a corrupt journal as good.
  for(const name of files(data).filter(p=>p.endsWith('.jsonl')))for(const line of readFileSync(join(data,name),'utf8').split('\n').filter(Boolean))JSON.parse(line);
  mkdirSync(destination,{recursive:true,mode:0o700});
  for(const [kind,root] of [['data',data],['media',media]])for(const name of files(root)) {
   const target=join(destination,kind,name);mkdirSync(resolve(target,'..'),{recursive:true,mode:0o700});
   copyFileSync(join(root,name),target);chmodSync(target,0o600);
   manifest.files.push({path:kind+'/'+name,sha256:digest(target)});
  }
  writeFileSync(join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});
  return manifest.files.length;
 }
 if(mode==='restore') {
  const [source,data,media]=roots;empty(data);empty(media);
  const manifest=JSON.parse(readFileSync(join(source,'manifest.json'),'utf8'));
  if(manifest.version!==1||!Array.isArray(manifest.files))throw Error('Unsupported manifest.');
  const actual=files(source).filter(p=>p!=='manifest.json');
  const expected=manifest.files.map(f=>f.path).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Snapshot file set mismatch.');
  for(const item of manifest.files) {
   if(!/^(data|media)\//.test(item.path)||item.path.split('/').some(s=>s==='..'||s==='.')||digest(join(source,item.path))!==item.sha256)throw Error('Snapshot integrity check failed.');
  }
  for(const root of [data,media])mkdirSync(root,{recursive:true,mode:0o700});
  for(const item of manifest.files) {
   const [kind,...parts]=item.path.split('/'),target=join(kind==='data'?data:media,...parts);
   mkdirSync(resolve(target,'..'),{recursive:true,mode:0o700});
   writeFileSync(target,readFileSync(join(source,item.path)),{mode:0o600,flag:'wx',flush:true});
  }
  return manifest.files.length;
 }
 throw Error('Use backup <data-root> <media-root> <snapshot-dir> OR restore <snapshot-dir> <empty-data-root> <empty-media-root>.');
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 try {if(process.argv.length!==6)throw Error('Exactly one operation and three paths required.');console.log('Snapshot operation complete; files:',snapshot(...process.argv.slice(2)));}
 catch {console.error('Snapshot refused: check offline state, separate paths, empty destinations and integrity.');process.exitCode=1;}
}
