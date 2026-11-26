// Local-only smoke: real React form and browser upload pipeline; mocked HTTP prevents production writes.
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const port=5181;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{
  stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_FIREBASE_CONFIG:'{}'}
});
let errors='',browser;
server.stderr.on('data',part=>{errors+=part.toString();});
const initial=[{id:'existing-vehicle',name:'Toyota Innova',seats:'6+1',capacity:6,tag:'Premium Comfort',category:'Premium MPV',image:'/api/uploads/11111111-2222-4333-8444-555555555555.webp',gallery:[],rateMin:15,rateMax:25,enabled:true}];
let stored=structuredClone(initial),version=0,imageCount=0,postBody;
async function ready(){
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:'+port+'/scripts/fleet-editor-ui-fixture.html')).ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error('Vite failed to start: '+errors);
}
const png=async(r,g,b)=>sharp({create:{width:100,height:60,channels:3,background:{r,g,b}}}).png().toBuffer();
const webp=await sharp({create:{width:100,height:60,channels:3,background:{r:50,g:80,b:60}}}).webp().toBuffer();
const review=async(page)=>{
  const dialog=page.getByRole('dialog',{name:'Vehicle photo privacy editor'});
  await dialog.waitFor({state:'visible'});
  await dialog.getByRole('checkbox',{name:/No registration number is visible/}).check();
  await dialog.getByRole('checkbox',{name:/permission to publish this photograph commercially/}).check();
  await dialog.getByRole('button',{name:'Save sanitized photo'}).click();
};
try{
  await ready();
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:920}});
  page.setDefaultTimeout(12000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('**/api/admin/catalog',async route=>{
    if(route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,vehicles:stored})});
    const incoming=route.request().postDataJSON();
    postBody=incoming;
    assert.equal(incoming.expectedVersion,version);
    version++;
    stored=incoming.vehicles.map((v,i)=>({...v,id:v.id.startsWith('draft-')?'server-vehicle-'+i:v.id}));
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,vehicles:stored})});
  });
  await page.route('**/api/admin/fleet-media/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ready:true,installed:7,total:7,missing:[],invalid:[],catalogApplied:true,persistedCatalogApplied:true,modelLinks:[]})}));
  await page.route('**/api/admin/images',async route=>{
    const posted=route.request().postDataJSON();
    assert.match(posted.mime,/^image\/(jpeg|png|webp)$/);
    assert.ok(posted.data.length>30,'Sanitized WebP bytes posted to authenticated media endpoint');
    imageCount++;
    const suffix=String(imageCount).padStart(12,'0');
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({url:'/api/uploads/aaaaaaaa-bbbb-4ccc-8ddd-'+suffix+'.webp'})});
  });
  await page.route('**/api/uploads/*.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:webp}));
  await page.goto('http://127.0.0.1:'+port+'/scripts/fleet-editor-ui-fixture.html',{waitUntil:'domcontentloaded'});
  await page.locator('.fleet-editor').first().waitFor();
  assert.equal(await page.locator('.fleet-editor').count(),1,'Existing CRM fleet is initially loaded');
  await page.getByRole('button',{name:'Add another vehicle'}).click();
  const card=page.locator('.fleet-editor').last();
  await card.getByLabel('Vehicle name').fill('Toyota Fortuner');
  await card.getByLabel('Seats label').selectOption('7+1');
  assert.equal(await card.getByLabel('Passenger capacity (excluding driver)').inputValue(),'7');
  await card.getByLabel('Vehicle category').selectOption('Premium SUV');
  await card.getByLabel('Short description').fill('Premium outstation travel');
  await card.locator('.fleet-cover-manager input[type=file]').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:await png(12,70,130)});
  await review(page);
  await page.getByRole('dialog',{name:'Vehicle photo privacy editor'}).waitFor({state:'detached'});
  assert.equal(imageCount,1,'Cover photo stored through server endpoint');
  const galleryInput=card.locator('.fleet-gallery-manager>label input[type=file]');
  await galleryInput.setInputFiles([
    {name:'side.png',mimeType:'image/png',buffer:await png(70,140,12)},
    {name:'interior.png',mimeType:'image/png',buffer:await png(160,70,70)}
  ]);
  await review(page);
  await page.getByRole('dialog',{name:'Vehicle photo privacy editor'}).waitFor({state:'detached'});
  await page.getByRole('dialog',{name:'Vehicle photo privacy editor'}).waitFor({state:'visible'});
  await review(page);
  await page.getByRole('dialog',{name:'Vehicle photo privacy editor'}).waitFor({state:'detached'});
  assert.equal(imageCount,3,'Main photo plus two gallery photos uploaded separately');
  assert.equal(await card.locator('.fleet-gallery-item').count(),2,'Gallery previews render without manual URLs');
  await card.getByLabel('Display on public website').check();
  await page.locator('.fleet-editor').first().getByRole('button',{name:'Hide vehicle (keep record)'}).click();
  await page.getByRole('button',{name:'Save fleet & pricing'}).click();
  await page.getByText(/saved\. Refresh the public website/).waitFor();
  assert.equal(postBody.vehicles.length,2,'Previously configured vehicle is retained');
  assert.equal(postBody.vehicles[0].enabled,false,'Hide does not remove the existing record');
  assert.equal(postBody.vehicles[1].name,'Toyota Fortuner');
  assert.equal(postBody.vehicles[1].category,'Premium SUV');
  assert.equal(postBody.vehicles[1].capacity,7);
  assert.equal(postBody.vehicles[1].gallery.length,2);
  assert.match(postBody.vehicles[1].image,/^\/api\/uploads\//);
  assert.ok(postBody.vehicles[1].gallery.every(url=>url.startsWith('/api/uploads/')),'Every gallery image is cloud-stored');
  await page.getByRole('button',{name:'Reload',exact:true}).click();
  assert.equal(await page.locator('.fleet-editor').count(),2,'Saved fleet survives fresh server reload');
  assert.equal(await page.locator('.fleet-editor').last().locator('.fleet-gallery-item').count(),2,'Saved gallery survives reload');
  assert.deepEqual(pageErrors,[],'No browser runtime errors');
  console.log('PASS fleet admin: dropdowns, main image upload, multi-angle queue, rights review, hide, Firestore save payload and reload');
}catch(error){
  console.error('FAIL fleet admin smoke:',error,errors);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
