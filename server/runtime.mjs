import { mkdirSync, realpathSync, statSync, writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve, relative } from 'node:path';
import { randomUUID } from 'node:crypto';

// Single writer only. A durable mount is an infrastructure guarantee; this
// validates paths/writability, not whether a provider truly persists its disk.
export function validateRuntime(env=process.env) {
  if(env.NODE_ENV!=='production') return {storage:'local'};
  if(!env.CRM_ADMIN_TOKEN || env.CRM_ADMIN_TOKEN.length<32) throw Error('Production requires a random CRM_ADMIN_TOKEN of at least 32 characters.');
  if(!env.CRM_STORAGE_ROOT || !isAbsolute(env.CRM_STORAGE_ROOT)) throw Error('Production requires an absolute CRM_STORAGE_ROOT on a persistent volume.');
  const root=resolve(env.CRM_STORAGE_ROOT);
  mkdirSync(root,{recursive:true,mode:0o700});
  const actualRoot=realpathSync(root);
  for(const key of ['CRM_DATA_FILE','CRM_EVENTS_FILE','CRM_NOTIFICATIONS_FILE','CRM_CATALOG_FILE','CRM_UPLOADS_DIR','CRM_MODELS_DIR']) {
    if(!env[key] || !isAbsolute(env[key]) || !relative(root,resolve(env[key])) || relative(root,resolve(env[key])).startsWith('..')) throw Error(key+' must be inside CRM_STORAGE_ROOT.');
    // Reject symlink escapes in existing ancestors.
    let path=resolve(env[key]);
    while(path!==root) {
      try {const actual=realpathSync(path);if(relative(actualRoot,actual).startsWith('..'))throw Error('Storage path escapes durable root.');break;} catch(e) {if(e.code!=='ENOENT')throw e;}
      path=resolve(path,'..');
    }
  }
  for(const key of ['CRM_DATA_FILE','CRM_EVENTS_FILE','CRM_NOTIFICATIONS_FILE']) {
    if(existsSync(env[key]))for(const line of readFileSync(env[key],'utf8').split('\n').filter(Boolean))JSON.parse(line);
  }
  const probe=resolve(root,'.write-probe-'+randomUUID());
  writeFileSync(probe,'ok',{mode:0o600,flag:'wx'});unlinkSync(probe);
  if(!statSync(root).isDirectory()) throw Error('Storage root must be a directory.');
  return {storage:'persistent-volume'};
}
