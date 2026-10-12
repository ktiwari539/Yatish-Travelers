// Local Chromium interaction test. CI installs Playwright only for this test;
// no browser tooling is shipped in the production bundle.
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port=5173;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{
 stdio:['ignore','pipe','pipe'],env:{...process.env}
});
let browser;
let errors='';
server.stderr.on('data',part=>{errors+=part.toString();});
server.stdout.on('data',()=>{});
function ensure(condition,message){assert.ok(condition,message);}
async function ready(){
 for(let n=0;n<80;n++){
  try{const r=await fetch('http://127.0.0.1:'+port);if(r.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 throw new Error('Vite did not start: '+errors);
}
async function smoke(){
 await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 page.setDefaultTimeout(10000);
 const failures=[];
 page.on('pageerror',e=>failures.push(String(e)));
 await page.goto('http://127.0.0.1:'+port,{waitUntil:'domcontentloaded'});
 ensure(await page.locator('.cinema-arrival-skip').isVisible(),'Fresh desktop load shows skip-enabled car intro');
 await page.locator('.cinema-arrival-skip').click();
 await page.locator('.cinema-arrival').waitFor({state:'detached'});
 ensure(await page.locator('.cinema-director-vehicle strong').innerText()==='Family MPV · Ertiga-inspired concept',
  'Hero must not mislabel Ertiga-inspired concept as Innova');
 ensure((await page.locator('.cinema-director-quote').innerText()).includes('Ertiga'),'Hero quote labels Ertiga');
 await page.locator('.cinema-director-quote').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Maruti Ertiga'),'Hero quote uses Ertiga');
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Homepage conversion actions are genuine links/buttons.
 ensure((await page.locator('.hero-whatsapp').getAttribute('href')||'').includes('wa.me/919340098177'),'WhatsApp destination');
 ensure((await page.locator('.cinematic-landing-email').getAttribute('href')||'').startsWith('mailto:ktiwari539@gmail.com'),'Email destination');
 ensure((await page.locator('.hero-fleet-link').getAttribute('href'))==='#motion-fleet','Explore Fleet destination');
 const chapterBefore=await page.locator('.cinema-director-chapter').innerText();
 await page.getByRole('button',{name:'Next travel scene'}).click();
 ensure((await page.locator('.cinema-director-chapter').innerText())!==chapterBefore,'Scene next button changes scene');
 await page.locator('.hero-copy .primary').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Selecting the actual Innova in the fleet must change the current fare/quote vehicle.
 await page.locator('.fleet-editorial-tile').filter({hasText:'Toyota Innova'}).click();
 ensure((await page.locator('.fleet-editorial-model h3').innerText())==='Toyota Innova','Gallery model switched');
 await page.locator('.fleet-editorial-request').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Toyota Innova'),'Fleet quote uses selected Toyota Innova');
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Mobile: no forced animation, navigation and sticky request bar work.
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Open navigation'}).click();
 ensure(await page.locator('.mobile-nav-panel').isVisible(),'Mobile menu opens');
 await page.locator('.mobile-nav-panel').getByText('Vehicle options').click();
 ensure(!await page.locator('.mobile-nav-panel').count(),'Mobile menu closes on navigation');
 ensure((await page.locator('.mobile-booking-bar a').first().getAttribute('href')||'').includes('wa.me/919340098177'),'Mobile WhatsApp');
 ensure((await page.locator('.mobile-booking-bar a').nth(1).getAttribute('href')||'').startsWith('tel:+919340098177'),'Mobile call');
 await page.locator('.mobile-booking-bar button').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Maruti Ertiga'),'Mobile quote defaults to Ertiga');
 await page.locator('.quote-close').click();
 ensure(failures.length===0,'No unhandled browser errors: '+failures.join('; '));
 console.log('PASS: car intro/skip, hero booking, scene control, fleet quote sync, WhatsApp/email links, mobile menu & sticky quote');
}
try{await smoke();}
finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
