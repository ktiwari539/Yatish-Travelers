import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('new showcase models migrate once without changing staff-managed inventory', async t => {
  const directory=mkdtempSync(join(tmpdir(),'mt-catalog-upgrade-'));
  t.after(()=>rmSync(directory,{recursive:true,force:true}));
  process.env.CRM_CATALOG_FILE=join(directory,'catalog.json');
  // Simulates the actual six-model catalog saved by a previous local CRM.
  const savedBolero={
    id:'staff-bolero',name:'Mahindra Bolero',seats:'6+1',capacity:6,
    tag:'Our own black Bolero',category:'SUV',image:'https://example.org/custom-bolero.jpg',
    rateMin:28,rateMax:34,enabled:true,gallery:[],modelUrl:''
  };
  writeFileSync(process.env.CRM_CATALOG_FILE,JSON.stringify({
    vehicles:[savedBolero],updatedAt:'2026-10-01T00:00:00Z'
  }));
  const {defaultCatalog,readCatalog,writeCatalog}=await import('./catalog.mjs?test=showcase-upgrade');
  const first=readCatalog();
  assert.equal(first.catalogVersion,2);
  assert.ok(!first.vehicles.some(v=>v.name==='Toyota Innova'),'A previously removed model must not be silently reintroduced');
  assert.equal(first.vehicles.length,5);
  assert.deepEqual(first.vehicles.find(v=>v.name==='Mahindra Bolero'),savedBolero);
  assert.equal(first.updatedAt,'2026-10-01T00:00:00Z');
  for(const name of ['Mahindra Scorpio-N','Mahindra Thar','Mahindra XUV700','Kia Carens']){
    assert.ok(first.vehicles.find(v=>v.name===name),'New model missing: '+name);
  }
  assert.equal(new Set(defaultCatalog.map(v=>v.image)).size,defaultCatalog.length);
  writeCatalog(first.vehicles.filter(v=>v.name!=='Mahindra Thar'));
  const later=readCatalog();
  assert.equal(later.catalogVersion,2);
  assert.equal(later.vehicles.length,4);
  assert.ok(!later.vehicles.some(v=>v.name==='Mahindra Thar'),'Staff removal must remain removed');
  assert.equal(JSON.parse(readFileSync(process.env.CRM_CATALOG_FILE,'utf8')).catalogVersion,2);
});
