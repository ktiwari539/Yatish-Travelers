import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function verifyNativeRuntime(dir) {
  const root = resolve(dir, 'node_modules');
  const pkg = JSON.parse(await readFile(`${root}/sharp/package.json`, 'utf8'));
  for (const name of ['sharp-linux-x64', 'sharp-libvips-linux-x64']) {
    const base = `${root}/@img/${name}`;
    const actual = JSON.parse(await readFile(`${base}/package.json`, 'utf8'));
    assert.equal(actual.version, pkg.optionalDependencies[`@img/${name}`]);
    const binaries = (await readdir(`${base}/lib`)).filter(x => /\.node$|\.so\./.test(x));
    assert(binaries.length, `Missing Linux native payload: ${name}`);
    for (const file of binaries) {
      const data = await readFile(`${base}/lib/${file}`);
      assert.equal(data.subarray(0, 4).toString('hex'), '7f454c46', 'Expected Linux ELF');
      assert.equal(data.readUInt16LE(18), 62, 'Expected x86-64 ELF');
    }
  }
  if (process.platform === 'linux' && process.arch === 'x64') {
    const require = createRequire(resolve(dir, 'crm.mjs'));
    const sharp = require('sharp');
    const output = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#123456' } }).webp().toBuffer();
    assert.equal((await sharp(output).metadata()).format, 'webp');
    console.log('PASS: deploy-native Sharp processes a synthetic image on Linux x64');
  } else {
    console.log('PASS: Linux x64 Sharp binaries present; execution requires Linux x64');
  }
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await verifyNativeRuntime(process.argv[2] || 'netlify/generated-functions');
