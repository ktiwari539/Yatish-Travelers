// Local Chromium interaction test. CI installs Playwright only for this test;
// no browser tooling is shipped in the production bundle.
import { strict as assert } from 'node:assert';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { chromium } from 'playwright';

const testVideo='public/media/mt-scorpio-arrival.mp4';
const fixtureCreated=!existsSync(testVideo);
// CI uses a valid 0.4s H.264 fixture. If the real video is already
// locally installed, smoke tests use it and do not alter those files.
if(fixtureCreated){
 mkdirSync('public/media',{recursive:true});
 execFileSync('ffmpeg',[
  '-hide_banner','-loglevel','error','-y',
  '-f','lavfi','-i','color=c=black:s=64x36:r=24:d=0.4',
  '-an','-c:v','libx264','-preset','ultrafast',
  '-crf','38','-pix_fmt','yuv420p','-movflags','+faststart',testVideo
 ],{stdio:'ignore'});
}
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
 // Scroll narrative uses actual model reference images, not generic 3D or concept art.
 ensure(await page.locator('.fleet-road-story').count()===1,'Scroll storytelling stage is present');
 ensure((await page.locator('.fleet-editorial-picture img').first().getAttribute('alt')||'').includes('Maruti Ertiga'),
  'Ertiga scroll stage must show a model-specific photograph');
 await page.evaluate(()=>{
   const story=document.querySelector('.fleet-road-story');
   if(!story)throw new Error('Scroll story missing');
   window.scrollTo(0,window.scrollY+story.getBoundingClientRect().top+window.innerHeight*.68);
 });
 await page.waitForFunction(()=>document.querySelector('.fleet-road-stage')?.getAttribute('data-drive-step')==='1');
 ensure((await page.locator('.fleet-drive-story-chapter strong').innerText())==='Discover the right fit.','Scroll reveals the detail chapter');
 await page.evaluate(()=>{
   const story=document.querySelector('.fleet-road-story');
   if(!story)throw new Error('Scroll story missing');
   window.scrollTo(0,window.scrollY+story.getBoundingClientRect().top+window.innerHeight*1.12);
 });
 await page.waitForFunction(()=>document.querySelector('.fleet-road-stage')?.getAttribute('data-drive-step')==='2');
 ensure((await page.locator('.fleet-drive-story-chapter strong').innerText())==='Plan your next drive.','Scroll reveals the enquiry chapter');
 // Gallery must use ten distinct model photos or explicit model-specific placeholders.
 const cards=await page.locator('.fleet-editorial-tile').evaluateAll(nodes=>nodes.map(node=>({
  name:node.querySelector('.fleet-editorial-tile-foot strong')?.textContent?.trim(),
  source:node.querySelector('img')?.getAttribute('src')||'',
  placeholder:node.querySelector('.fleet-model-image-missing')?.textContent?.trim()||'',
  category:node.querySelector('.fleet-editorial-tile-photo > span')?.textContent?.trim()
 })));
 ensure(cards.length===10,'Ten distinct fleet cards are shown in local preview');
 ensure(['Mahindra Bolero','Mahindra Scorpio-N','Mahindra Thar','Mahindra XUV700','Kia Carens'].every(name=>cards.some(card=>card.name===name)), 'All five upgraded and added models are visible');
 ensure(cards.find(card=>card.name==='Mahindra Bolero')?.source?.includes('Gen%203')||cards.find(card=>card.name==='Mahindra Bolero')?.placeholder?.includes('Mahindra Bolero'),'Bolero uses updated black model photo');
 ensure(cards.every(card=>card.category!=='TRAVEL INSPIRATION'),'No fake scenic image is labeled as a vehicle');
 ensure(cards.every(card=>Boolean(card.source)||card.placeholder.includes(card.name)),'Every card has its own model photo or named placeholder');
 const sources=cards.map(card=>card.source).filter(Boolean);
 ensure(new Set(sources).size===sources.length,'A photo URL is never recycled across different vehicle names');
 ensure(cards.find(card=>card.name==='Tempo Traveller')?.source?.includes('Traveller')||
  cards.find(card=>card.name==='Tempo Traveller')?.placeholder?.includes('Tempo Traveller'),
  'Tempo Traveller shows its own reference or own placeholder, never a forest or a second MPV');
 // A new model must update the quote state just as existing models do.
 await page.locator('.fleet-editorial-tile').filter({hasText:'Mahindra Scorpio-N'}).click();
 ensure((await page.locator('.fleet-editorial-model h3').innerText())==='Mahindra Scorpio-N','New Scorpio model selection');
 await page.locator('.fleet-scorpio-film.is-ready').waitFor({state:'visible'});
 ensure((await page.locator('.fleet-scorpio-film').getAttribute('src'))==='/media/mt-scorpio-arrival.mp4','Only Scorpio uses approved video source');
 ensure(await page.getByRole('button',{name:'Replay Scorpio-N arrival film'}).isVisible(),'Scorpio video has replay button');
 mkdirSync('artifacts/visual-evidence',{recursive:true});
 await page.locator('.fleet-road-stage').screenshot({path:'artifacts/visual-evidence/scorpio-desktop.png'});
 await page.getByRole('button',{name:'Replay Scorpio-N arrival film'}).click();
 ensure(await page.locator('.fleet-scorpio-film').evaluate(el=>el.readyState>=1),'Scorpio video loads real media metadata in Chromium');

 await page.locator('.fleet-editorial-request').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Mahindra Scorpio-N'),'Scorpio quote remains synchronized');
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Selecting the actual Innova in the fleet must change the current fare/quote vehicle.
 await page.locator('.fleet-editorial-tile').filter({hasText:'Toyota Innova'}).click();
 ensure((await page.locator('.fleet-editorial-model h3').innerText())==='Toyota Innova','Gallery model switched');
 ensure((await page.locator('.fleet-road-stage').getAttribute('data-model'))==='Toyota Innova','Innova has a separate cinematic chapter');
 ensure((await page.locator('.fleet-drive-story-chapter strong').innerText())==='Every detail, arranged.','Innova copy matches current journey chapter');
 ensure(await page.locator('.fleet-innova-visual-note').count()===1,'Innova has its own executive visual');
 await page.locator('.fleet-road-stage').screenshot({path:'artifacts/visual-evidence/innova-desktop.png'});
 ensure(await page.locator('.fleet-scorpio-film').count()===0,'Innova never shows the Scorpio movie');

 await page.locator('.fleet-editorial-request').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Toyota Innova'),'Fleet quote uses selected Toyota Innova');
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Brand takes the visitor back to the actual homepage from a lower-page section.
 await page.locator('#fleet').scrollIntoViewIfNeeded();
 ensure(await page.evaluate(()=>window.scrollY)>150,'Scrolled down to check brand navigation');
 ensure((await page.locator('header.nav a.brand').getAttribute('href'))==='/', 'Header brand links to homepage');
 await page.locator('header.nav a.brand').click();
 await page.waitForURL(url=>url.pathname==='/'&&!url.hash);
 ensure(await page.evaluate(()=>window.scrollY)<100,'Clicking brand returns viewport to homepage top');
 // Story-page brand also navigates home.
 await page.goto('http://127.0.0.1:'+port+'/stories',{waitUntil:'domcontentloaded'});
 await page.locator('.stories-nav a.brand').click();
 await page.waitForURL(url=>url.pathname==='/'&&!url.hash);
 // Mobile: no forced animation, navigation and sticky request bar work.
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Open navigation'}).click();
 ensure(await page.locator('.mobile-nav-panel').isVisible(),'Mobile menu opens');
 await page.locator('.mobile-nav-panel').getByText('Vehicle options').click();
 ensure(!await page.locator('.mobile-nav-panel').count(),'Mobile menu closes on navigation');
 ensure((await page.locator('.mobile-booking-bar a').first().getAttribute('href')||'').includes('wa.me/919340098177'),'Mobile WhatsApp');
 ensure((await page.locator('.mobile-booking-bar a').nth(1).getAttribute('href')||'').startsWith('tel:+919340098177'),'Mobile call');
 await page.screenshot({path:'artifacts/visual-evidence/mobile-quote-cta.png'});
 await page.locator('.mobile-booking-bar button').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Maruti Ertiga'),'Mobile quote defaults to Ertiga');
 await page.locator('.quote-close').click();
 // CRM photo-privacy regression: a current image cannot be published as
 // sanitized without pixelating a region or explicitly reviewing the whole photo.
 const tinyPng='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
 const adminVehicle={id:'preview-car',name:'Toyota Innova',category:'Premium MPV',seats:'6+1',
   tag:'Premium Comfort',capacity:6,image:tinyPng,rateMin:20,rateMax:30,enabled:true,gallery:[tinyPng]};
 let editedImageUrl='',savedCatalogName='',savedGallery='';
 let imageUploads=0;
 await page.route('**/api/admin/**',async route=>{
   const url=new URL(route.request().url());
   let response={};
   if(url.pathname==='/api/admin/catalog'){
     if(route.request().method()==='PUT'){
       const body=route.request().postDataJSON();
       savedCatalogName=body.vehicles?.[0]?.name||'';
       savedGallery=body.vehicles?.[0]?.gallery?.[0]||'';
       response={vehicles:body.vehicles};
     }else response={vehicles:[adminVehicle]};
   }else if(url.pathname==='/api/admin/images'){
     imageUploads++;
     editedImageUrl='/api/uploads/11111111-2222-4333-8444-55555555555'+imageUploads+'.webp';
     response={url:editedImageUrl};
   }else if(url.pathname==='/api/admin/enquiries')response={items:[]};
   else if(url.pathname==='/api/admin/engagement')response={total:0,counts:{},sessions:0,recent:[]};
   else if(url.pathname==='/api/admin/notifications')response={config:{mode:'preview'},items:[]};
   await route.fulfill({status:url.pathname==='/api/admin/images'?201:200,
     contentType:'application/json',body:JSON.stringify(response)});
 });
 await page.addInitScript(()=>sessionStorage.setItem('mt-crm-token','smoke-test-local-only'));
 await page.goto('http://127.0.0.1:'+port+'/admin',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Cars & pricing'}).click();
 await page.getByRole('button',{name:'Review current photo / hide plates'}).click();
 const editor=page.getByRole('dialog',{name:'Vehicle photo privacy editor'});
 await editor.waitFor({state:'visible'});
 const saveSanitized=editor.getByRole('button',{name:'Save sanitized photo'});
 ensure(await saveSanitized.isDisabled(),'Privacy editor must block saving unchecked existing plates');
 await editor.getByRole('checkbox',{name:/No registration number is visible/}).check();
 ensure(await saveSanitized.isEnabled(),'Explicit no-plate review unlocks sanitized image export');
 await saveSanitized.click();
 await editor.waitFor({state:'detached'});
 ensure(Boolean(editedImageUrl),'Sanitized local image uploaded after explicit review');
 await page.getByRole('button',{name:'Review / hide plates · angle 1'}).click();
 await editor.waitFor({state:'visible'});
 ensure(await saveSanitized.isDisabled(),'Alternate gallery image also requires privacy review');
 await editor.getByRole('checkbox',{name:/No registration number is visible/}).check();
 await saveSanitized.click();
 await editor.waitFor({state:'detached'});
 ensure(imageUploads===2,'Main and alternate images uploaded separately');
 await page.locator('.fleet-admin-head .fleet-save').click();
 ensure(savedCatalogName==='Toyota Innova','Fleet catalog save retains identity after privacy review');
 ensure(savedGallery.startsWith('/api/uploads/'),'Alternate gallery angle saved as sanitized local image');
 ensure(failures.length===0,'No unhandled browser errors: '+failures.join('; '));
 console.log('PASS: 10 distinct vehicles, Innova cinematic chapter, Scorpio MP4, quote navigation, mobile CTAs and admin privacy-review gate');
}
try{await smoke();}
finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
 if(fixtureCreated)unlinkSync(testVideo);
}
