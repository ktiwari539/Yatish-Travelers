import assert from 'node:assert/strict';
import { buildCrmFunction } from './build-crm-function.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// Match the deployed Lambda setting, not desktop Node's require(ESM) default.
// No credentials, provider calls, or customer records are used.
const config = await readFile('netlify.toml', 'utf8');
const external = JSON.parse(config.match(/^external_node_modules\s*=\s*(\[.*\])/m)[1]);
assert(!external.includes('firebase-admin'), 'Firebase Auth must be bundled with jose');
const dir = await mkdtemp(resolve('.function-smoke-'));
try {
  const outfile = await buildCrmFunction(dir);
  const child = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    globalThis.Netlify = { env: { get: () => undefined } };
    const { default: handler } = await import(${JSON.stringify(outfile)});
    const response = await handler(new Request('https://example.invalid/api/admin/session'), {});
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'SERVICE_UNAVAILABLE' });
    console.log('PASS: bundled Function boots with Lambda module restrictions and fails closed without configuration');
  `], { encoding: 'utf8', timeout: 30000, env: { PATH: process.env.PATH } });
  assert.equal(child.status, 0, child.stderr || child.error?.message);
  process.stdout.write(child.stdout);
} finally {
  await rm(dir, { recursive: true, force: true });
}
