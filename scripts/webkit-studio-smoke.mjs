// WebKit engine regression for Safari-like studio behavior.
// This is a functional browser check, NOT acceptance of Mac Safari rendering,
// source licences, or number-plate privacy. No API/CRM writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { webkit } from 'playwright';

const port=5186;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
let stderr='';
server.stderr.on('data',c=>{stderr+=String(c);});
const root='http://127.0.0.1:'+port;
async function ready(){
 for(let n=0;n<85;n++){
  try{if((await fetch(root)).ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,180));
 }
 throw Error('Vite not ready: '+stderr);
}
try{
 await ready();
 browser=await webkit.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 page.setDefaultTimeout(12000);
 const photoFixture='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#cbd8ce"/></svg>';
 // The SVG is a test-only network fixture. Never added to a gallery or release.
 // CSS entrance effects can make WebKit consider controls perpetually moving;
 // the Chromium suite separately tests real user-pointer click behavior.
 await page.route('https://commons.wikimedia.org/**',route=>route.fulfill({
  status:200,contentType:'image/svg+xml',body:photoFixture
 }));
 await page.goto(root,{waitUntil:'domcontentloaded'});
 const intro=page.locator('.cinema-arrival-skip');
 if(await intro.count()){
 // Safari/WebKit reports this cinematic button as continuously moving.
 // DOM-activate its real onClick handler rather than waiting for stability.
 await intro.evaluate(button=>(button).click());
 await page.locator('.cinema-arrival').waitFor({state:'detached',timeout:7000});
}
 const card=page.locator('.premium-catalog-card[data-model="Maruti Ertiga"]');
 await card.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 const cover=await card.locator('.premium-catalog-visual img').getAttribute('src');
 assert.ok(cover,'The comparison card has a real catalog photo URL');
 assert.equal(await card.locator('.fleet-photo-preview-strip').count(),0,'No duplicate strip in comparison');
 await card.getByRole('button',{name:'Open full-screen car studio for Maruti Ertiga'}).evaluate(el=>el.click());
 const dialog=page.getByRole('dialog',{name:'Mateshwari full-screen vehicle studio'});
 await dialog.waitFor({state:'visible'});
 const image=dialog.locator('.ride-studio-car-image');
 const studioPhoto=await image.getAttribute('src');
 assert.ok(studioPhoto&&studioPhoto!==cover,'Studio opens on a different source photograph');
 const rail=dialog.locator('.ride-studio-photo-strip');
 assert.equal(await rail.evaluate(el=>getComputedStyle(el).flexDirection),'column','Studio has distinct vertical filmstrip');
 await dialog.getByRole('button',{name:'Inspect photograph of Maruti Ertiga'}).evaluate(el=>el.click());
 assert.equal(await dialog.locator('.ride-studio-vehicle-frame.is-zoomed').count(),1,'Zoom enters');
 await dialog.getByRole('button',{name:'Return to full view of Maruti Ertiga'}).evaluate(el=>el.click());
 assert.equal(await dialog.locator('.ride-studio-vehicle-frame.is-zoomed').count(),0,'Zoom exits');
 assert.ok((await dialog.locator('.ride-studio-turntable-status').innerText()).includes('360° unavailable'),
  'The Safari studio never advertises a real spin without matching photos');
 assert.equal(await dialog.locator('.ride-genuine-turntable').count(),0,
  'No fake turntable renders in Safari when there are no verified assets');
 // Discontinued 360 experiment must not distract customers from the photo gallery.
 assert.equal(await dialog.getByRole('link',{name:/Suzuki manufacturer/}).count(),0,
  'No outbound manufacturer viewer in customer gallery');
 assert.ok((await dialog.locator('.ride-studio-preview-copy').innerText()).includes('tailored quote'),
  'Premium gallery guides visitors to a quotation');

 await dialog.getByRole('button',{name:'Enable automatic photo slideshow'}).evaluate(el=>el.click());
 const before=await image.getAttribute('src');
 try{
  await page.waitForFunction(()=>document.querySelector('.ride-studio-stage')?.getAttribute('data-tour-state')==='playing',
   null,{timeout:10000});
 }catch(error){
  const diagnostic=await page.evaluate(()=>({
   visibility:document.visibilityState,
   reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
   tourState:document.querySelector('.ride-studio-stage')?.getAttribute('data-tour-state'),
   tourControl:document.querySelector('.ride-studio-tour-toggle')?.outerHTML,
   photoCount:document.querySelectorAll('.ride-studio-photo-strip button:not(:disabled)').length,
   currentPhoto:document.querySelector('.ride-studio-car-image')?.getAttribute('src')
  }));
  console.error('WebKit idle tour diagnostics',JSON.stringify(diagnostic));
  throw error;
 }
 const after=await image.getAttribute('src');
 assert.notEqual(before,after,'Auto tour visibly changes angle on WebKit after inactivity');
 await dialog.getByRole('button',{name:'Pause automatic photo slideshow'}).evaluate(el=>el.click());
 const paused=await image.getAttribute('src');
 await page.waitForTimeout(4100);
 assert.equal(await image.getAttribute('src'),paused,'Pause prevents another automatic advance');
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'detached'});
 // Safari OS motion preference is present when a new page mounts. Check that
 // initial setting directly rather than depending on an emulated live OS event.
 const reducedPage=await browser.newPage({
  viewport:{width:1440,height:900},reducedMotion:'reduce'
 });
 await reducedPage.route('https://commons.wikimedia.org/**',route=>route.fulfill({
  status:200,contentType:'image/svg+xml',body:photoFixture
 }));
 await reducedPage.emulateMedia({reducedMotion:'reduce'});
 await reducedPage.goto(root,{waitUntil:'domcontentloaded'});
 assert.equal(await reducedPage.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true,
  'WebKit test context is actually emulating reduced motion');
 const reducedIntro=reducedPage.locator('.cinema-arrival-skip');
 if(await reducedIntro.count())await reducedIntro.evaluate(el=>el.click());
 const reducedCard=reducedPage.locator('.premium-catalog-card[data-model="Maruti Ertiga"]');
 await reducedCard.getByRole('button',{name:'Open full-screen car studio for Maruti Ertiga'}).evaluate(el=>el.click());
 const reducedDialog=reducedPage.getByRole('dialog',{name:'Mateshwari full-screen vehicle studio'});
 await reducedDialog.waitFor({state:'visible'});
 // The browser diagnostic already proved the element becomes disabled.
 // Playwright's browser-side waitForFunction can stall in WebKit even when true;
 // assert the actual control state directly instead.
 const tourToggle=reducedDialog.getByRole('button',{name:'Enable automatic photo slideshow'});
 await tourToggle.waitFor({state:'visible'});
 let disabled=false;
 for(let attempt=0;attempt<20;attempt++){
  disabled=await tourToggle.isDisabled();
  if(disabled)break;
  await reducedPage.waitForTimeout(200);
 }
 assert.equal(disabled,true,'Safari reduced-motion disables the slideshow control');
 assert.equal(await reducedDialog.getByRole('button',{name:'Enable automatic photo slideshow'}).isDisabled(),true,
  'Safari initial reduced-motion preference prevents auto tour');
 await reducedPage.close();
 console.log('PASS WebKit: distinct cover, photographic studio, vertical rail, zoom, idle playback, pause, reduced motion, Escape');
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
