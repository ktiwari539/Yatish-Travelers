import { build } from 'esbuild';
import { mkdir, readFile, rm, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { verifyNativeRuntime } from './verify-crm-native-runtime.mjs';
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
  const app = JSON.parse(await readFile('package.json', 'utf8'));
  const native = JSON.parse(await readFile('netlify/runtime-dependencies/package.json', 'utf8'));
  if (app.dependencies.sharp !== native.dependencies.sharp)
    throw Error('Sharp runtime lock must match the application version');
  // Install deploy-native dependencies separately: npm on macOS otherwise
  // selects Darwin binaries that cannot run in Netlify's Linux x64 runtime.
  for (const name of ['package.json', 'package-lock.json'])
    await copyFile(`netlify/runtime-dependencies/${name}`, `netlify/generated-functions/${name}`);
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'ci', '--prefix', 'netlify/generated-functions', '--os=linux', '--cpu=x64',
    '--libc=glibc', '--include=optional', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund',
  ], { stdio: 'inherit' });
  await verifyNativeRuntime('netlify/generated-functions');
  console.log('Prepared Lambda-compatible CRM Function; no runtime credentials used');
}
