import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

test('generated Netlify output has per-page metadata, API precedence, true 404 and preview noindex',t=>{
 const dir=mkdtempSync(join(tmpdir(),'mt-release-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 mkdirSync(join(dir,'dist'));mkdirSync(join(dir,'src'));
 copyFileSync('index.html',join(dir,'dist/index.html'));copyFileSync('src/seo-pages.json',join(dir,'src/seo-pages.json'));
 const env={...process.env,VITE_PUBLIC_SITE_ORIGIN:'https://fixture.example',MT_CRM_API_ORIGIN:'https://api.fixture.example',CONTEXT:'production'};
 execFileSync(process.execPath,[resolve('scripts/generate-seo.mjs')],{cwd:dir,env});
 execFileSync(process.execPath,[resolve('scripts/prepare-netlify.mjs')],{cwd:dir,env});
 const read=p=>readFileSync(join(dir,'dist',p),'utf8');
 const pages=JSON.parse(readFileSync('src/seo-pages.json','utf8'));
 for(const [path,seo] of Object.entries(pages)){
  const html=read(path==='/'?'index.html':path.slice(1)+'/index.html');
  assert.ok(html.includes('<title>'+seo.title.replaceAll('&','&amp;')+'</title>'));
  assert.ok(html.includes('rel="canonical" href="https://fixture.example'+path+'"'));
  assert.ok(read('sitemap.xml').includes('https://fixture.example'+path));
  assert.doesNotThrow(()=>JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]));
 }
 assert.match(read('admin/index.html'),/noindex,nofollow/);
 assert.ok(!read('sitemap.xml').includes('/admin'));
 assert.match(read('_redirects'),/^\/api\/\*.*200!/);
 assert.match(read('_redirects'),/\/\*  \/404.html  404/);
 assert.ok(!read('_redirects').includes('/stories  /index.html'));
 assert.equal(spawnSync(process.execPath,[resolve('scripts/prepare-netlify.mjs')],{cwd:dir,env:{...env,MT_CRM_API_ORIGIN:''}}).status,1);
 assert.equal(spawnSync(process.execPath,[resolve('scripts/prepare-netlify.mjs')],{cwd:dir,env:{...env,MT_CRM_API_ORIGIN:'https://user:password@api.fixture.example'}}).status,1);
 execFileSync(process.execPath,[resolve('scripts/prepare-netlify.mjs')],{cwd:dir,env:{...env,CONTEXT:'deploy-preview'}});
 assert.match(read('_headers'),/X-Robots-Tag: noindex/);assert.equal(read('robots.txt'),'User-agent: *\nDisallow: /\n');
});

test('client-prefixed secret variables fail the build without echoing their values',()=>{
 const secret='synthetic-never-output-token';
 const result=spawnSync(process.execPath,[resolve('scripts/validate-public-env.mjs')],{env:{...process.env,VITE_CRM_ADMIN_TOKEN:secret},encoding:'utf8'});
 assert.equal(result.status,1);assert.ok(!(result.stdout+result.stderr).includes(secret));
});
