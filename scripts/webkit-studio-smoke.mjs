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
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.setDefaultTimeout(12000);
 const photoFixture='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#cbd8ce"/></svg>';
 // The SVG is a test-only network fixture. Never added to a gallery or release.
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
 await card.scrollIntoViewIfNeeded();
 const cover=await card.locator('.premium-catalog-visual img').getAttribute('src');
 assert.ok(cover,'The comparison card has a real catalog photo URL');
 assert.equal(await card.locator('.fleet-photo-preview-strip').count(),0,'No duplicate strip in comparison');
 await card.getByRole('button',{name:'Open full-screen car studio for Maruti Ertiga'}).click();
 const dialog=page.getByRole('dialog',{name:'Mateshwari full-screen vehicle studio'});
 await dialog.waitFor({state:'visible'});
 const image=dialog.locator('.ride-studio-car-image');
 const studioPhoto=await image.getAttribute('src');
 assert.ok(studioPhoto&&studioPhoto!==cover,'Studio opens on a different source photograph');
 const rail=dialog.locator('.ride-studio-photo-strip');
 assert.equal(await rail.evaluate(el=>getComputedStyle(el).flexDirection),'column','Studio has distinct vertical filmstrip');
 await dialog.getByRole('button',{name:'Inspect photograph of Maruti Ertiga'}).click();
 assert.equal(await dialog.locator('.ride-studio-vehicle-frame.is-zoomed').count(),1,'Zoom enters');
 await dialog.getByRole('button',{name:'Return to full view of Maruti Ertiga'}).click();
 assert.equal(await dialog.locator('.ride-studio-vehicle-frame.is-zoomed').count(),0,'Zoom exits');
 const before=await image.getAttribute('src');
 await page.waitForFunction(()=>document.querySelector('.ride-studio-stage')?.getAttribute('data-tour-state')==='playing',
  null,{timeout:7500});
 const after=await image.getAttribute('src');
 assert.notEqual(before,after,'Auto tour visibly changes angle on WebKit after inactivity');
 await dialog.getByRole('button',{name:'Pause automatic photo tour'}).click();
 const paused=await image.getAttribute('src');
 await page.waitForTimeout(4100);
 assert.equal(await image.getAttribute('src'),paused,'Pause prevents another automatic advance');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.querySelector('.ride-studio-tour-toggle')?.hasAttribute('disabled'));
 assert.equal(await dialog.getByRole('button',{name:'Enable automatic photo tour'}).isDisabled(),true,
  'Reduced-motion prevents auto tour');
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'detached'});
 console.log('PASS WebKit: distinct cover, photographic studio, vertical rail, zoom, idle playback, pause, reduced motion, Escape');
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
