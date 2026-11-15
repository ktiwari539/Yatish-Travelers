import { build } from 'esbuild';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Netlify traces .mjs Functions rather than necessarily transforming their
// dependencies. Prebundle Auth's CommonJS -> ESM edge before that tracing step.
export async function buildCrmFunction(outdir = 'netlify/generated-functions') {
  const config = await readFile('netlify.toml', 'utf8');
  const external = JSON.parse(config.match(/^external_node_modules\s*=\s*(\[.*\])/m)[1]);
  if (external.includes('firebase-admin')) throw Error('Firebase Auth must be bundled');
  await mkdir(outdir, { recursive: true });
  const outfile = resolve(outdir, 'crm.mjs');
  await build({
    entryPoints: ['netlify/functions/crm.mjs'], outfile,
    bundle: true, platform: 'node', target: 'node22', format: 'esm', external,
    banner: { js: 'import "@google-cloud/firestore"; import { createRequire as __crmCreateRequire } from "node:module"; const require = __crmCreateRequire(import.meta.url);' },
    logLevel: 'silent',
  });
  return outfile;
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await rm('netlify/generated-functions', { recursive: true, force: true });
  await buildCrmFunction();
  console.log('Prepared Lambda-compatible CRM Function; no runtime credentials used');
}
