import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {prepareLegacyMigration} from '../server/firebase/migration.mjs';
const [source,out]=process.argv.slice(2);if(!source||!out){console.error('Usage: node scripts/prepare-crm-migration.mjs /secure/legacy-data /secure/migration.json');process.exit(1);}
if(!resolve(out).includes('/.data/'))throw Error('Output must remain in an ignored .data directory, never repository source');
const plan=prepareLegacyMigration(source);writeFileSync(out,JSON.stringify(plan),{mode:0o600,flag:'wx'});console.log(JSON.stringify({counts:plan.counts,sha256:plan.sha256}));
