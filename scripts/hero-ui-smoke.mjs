// Local Chromium interaction test. CI installs Playwright only for this test;
// no browser tooling is shipped in the production bundle.
import { strict as assert } from 'node:assert';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { chromium } from 'playwright';
import { defaultCatalog } from '../server/catalog.mjs';

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
 ensure(await page.locator('#motion-fleet').evaluate(el=>el.nextElementSibling?.id==='contact'),
   'The rolling cinematic fleet reel is the final section immediately before the footer');
 ensure((await page.locator('.sort-control select').inputValue())==='featured',
   'Operator-managed priority is the default customer vehicle sequence');
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
 const primaryRailTiles=page.locator('.fleet-reel-group[data-copy="0"] .fleet-editorial-tile');
 const cards=await primaryRailTiles.evaluateAll(nodes=>nodes.map(node=>({
  name:node.querySelector('.fleet-editorial-tile-foot strong')?.textContent?.trim(),
  source:node.querySelector('img')?.getAttribute('src')||'',
  placeholder:node.querySelector('.fleet-model-image-missing')?.textContent?.trim()||'',
  category:node.querySelector('.fleet-editorial-tile-photo > span')?.textContent?.trim()
 })));
 ensure(cards.length===10,'Ten distinct fleet cards are shown in local preview');
 const rail=page.locator('.fleet-editorial-rail');
 const track=page.locator('.fleet-reel-track');
 ensure(await rail.evaluate(el=>el.scrollWidth>el.clientWidth),'Fleet reel contains more than one viewport of vehicles');
 ensure(await page.locator('.fleet-reel-group').count()===2,
   'Seamless reel renders two identical vehicle sets');
 ensure(await page.locator('.fleet-reel-group[data-copy="1"]').getAttribute('aria-hidden')==='true',
   'Duplicate visuals are hidden from screen readers');
 ensure(await page.locator('.fleet-reel-group[data-copy="1"] .fleet-editorial-tile').count()===cards.length,
   'Cloned group contains exactly the original ten models');
 ensure(await track.evaluate(el=>getComputedStyle(el).animationName==='mtFleetReelScroll'),
   'Fleet uses continuous GPU transform animation, not scrollBy timer jumps');
 const seam=await track.evaluate(el=>{
   const groups=el.querySelectorAll('.fleet-reel-group');
   return {first:groups[0].getBoundingClientRect().width,
     second:groups[1].getBoundingClientRect().width,
     track:el.scrollWidth};
 });
 ensure(Math.abs(seam.first-seam.second)<1&&Math.abs(seam.track-2*seam.first)<2,
   'Two equal-width photo groups provide a seamless 50% loop boundary');
 ensure(await page.getByRole('button',{name:'Pause fleet reel'}).isVisible(),
   'Optional pause control is available');
 ensure(await page.getByRole('button',{name:'Scroll fleet right'}).count()===0,
   'Stepped next/previous gallery controls are absent');
 await rail.scrollIntoViewIfNeeded();
 await page.mouse.move(0,0);
 await page.waitForFunction(()=>document.querySelector('.fleet-reel-track')?.getBoundingClientRect().left!==undefined);
 const xBefore=await track.evaluate(el=>el.getBoundingClientRect().left);
 await page.waitForTimeout(1000);
 const xAfter=await track.evaluate(el=>el.getBoundingClientRect().left);
 ensure(xAfter<xBefore-5,'Fleet reel moves continuously without any click');
 ensure((await page.locator('.fleet-editorial-model h3').innerText())==='Maruti Ertiga',
   'Reel motion never changes selected or quoted vehicle');
 await page.getByRole('button',{name:'Pause fleet reel'}).click();
 ensure(await page.getByRole('button',{name:'Resume fleet reel'}).isVisible(),
   'User can pause the continuous reel');
 // Freeze the track at its initial transform for subsequent deterministic
 // card interactions and screenshots; the motion itself was already tested.
 await page.addStyleTag({content:'.fleet-reel-track{animation:none!important;transform:none!important;}'});
 ensure(['Mahindra Bolero','Mahindra Scorpio-N','Mahindra Thar','Mahindra XUV700','Kia Carens'].every(name=>cards.some(card=>card.name===name)), 'All five upgraded and added models are visible');
 ensure(cards.find(card=>card.name==='Mahindra Bolero')?.source?.includes('Gen%203')||cards.find(card=>card.name==='Mahindra Bolero')?.placeholder?.includes('Mahindra Bolero'),'Bolero uses updated black model photo');
 ensure(cards.every(card=>card.category!=='TRAVEL INSPIRATION'),'No fake scenic image is labeled as a vehicle');
 ensure(cards.every(card=>Boolean(card.source)||card.placeholder.includes(card.name)),'Every card has its own model photo or named placeholder');
 const sources=cards.map(card=>card.source).filter(Boolean);
 ensure(new Set(sources).size===sources.length,'A photo URL is never recycled across different vehicle names');
 ensure(cards.find(card=>card.name==='Tempo Traveller')?.source?.includes('mt-traveller-safe.webp')||
  cards.find(card=>card.name==='Tempo Traveller')?.placeholder?.includes('Tempo Traveller'),
  'Tempo Traveller must use the reviewed photo path or its named safe placeholder, not an old plate-bearing source');
 // A new model must update the quote state just as existing models do.
 await primaryRailTiles.filter({hasText:'Mahindra Scorpio-N'}).click();
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
 await primaryRailTiles.filter({hasText:'Toyota Innova'}).click();
 ensure((await page.locator('.fleet-editorial-model h3').innerText())==='Toyota Innova','Gallery model switched');
 ensure((await page.locator('.fleet-road-stage').getAttribute('data-model'))==='Toyota Innova','Innova has a separate cinematic chapter');
 ensure((await page.locator('.fleet-drive-story-chapter strong').innerText())==='Every detail, arranged.','Innova copy matches current journey chapter');
 ensure(await page.locator('.fleet-innova-visual-note').count()===1,'Innova has its own executive visual');
 ensure(await page.locator('.fleet-editorial-angles button').count()===3,
   'Innova offers three distinct model-reference angles');
 ensure(await page.getByRole('button',{name:'View photo angle 3'}).getAttribute('aria-pressed')==='true',
   'Innova third scroll chapter points to its third reference slot');
 ensure((await page.locator('.fleet-road-stage .fleet-model-image-missing').innerText()).includes('Registration-plate review pending'),
   'Unreviewed Innova front-right reference with readable plate is never rendered');
 await page.locator('.fleet-road-stage').screenshot({path:'artifacts/visual-evidence/innova-desktop.png'});
 ensure(await page.locator('.fleet-scorpio-film').count()===0,'Innova never shows the Scorpio movie');
 await page.getByRole('button',{name:'View photo angle 2'}).click();
 await page.evaluate(()=>{
   const story=document.querySelector('.fleet-road-story');
   window.scrollTo(0,window.scrollY+story.getBoundingClientRect().top);
 });
 await page.waitForFunction(()=>document.querySelector('.fleet-road-stage')?.getAttribute('data-drive-step')==='0');
 ensure(await page.getByRole('button',{name:'View photo angle 2'}).getAttribute('aria-pressed')==='true',
   'Innova visitor-chosen angle overrides subsequent story scrolling');

 await page.locator('.fleet-editorial-request').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Toyota Innova'),'Fleet quote uses selected Toyota Innova');
 await page.locator('.quote-close').click();
 await page.locator('.quote-modal').waitFor({state:'detached'});
 // Full gallery visual-evidence audit: the privacy reviewer must inspect every
 // model and all configured angles. These are screenshots, NOT sanitized images.
 for(const card of cards){
   const name=card.name;
   await primaryRailTiles.filter({hasText:name}).click();
   await page.waitForTimeout(180);
   const slug=String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-');
   await page.locator('.fleet-road-stage').screenshot({
     path:'artifacts/visual-evidence/model-'+slug+'.png',
     animations:'disabled'
   });
 }
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
 const mobileEmail=await page.locator('.cinematic-landing-email').boundingBox();
 const mobileBooking=await page.locator('.cinema-director-bottom').boundingBox();
 ensure(mobileEmail&&mobileBooking&&mobileEmail.y+mobileEmail.height+6<mobileBooking.y,
   'Mobile email CTA must not overlap the Ertiga booking panel');
 await page.screenshot({path:'artifacts/visual-evidence/mobile-quote-cta.png'});
 await page.locator('.mobile-booking-bar button').click();
 await page.locator('.quote-modal').waitFor({state:'visible'});
 ensure((await page.locator('.quote-trip-card').innerText()).includes('Maruti Ertiga'),'Mobile quote defaults to Ertiga');
 await page.locator('.quote-close').click();
 await page.setViewportSize({width:375,height:812});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
   await document.fonts.ready;
   // Mobile reload can restore a scrolled document instead of the hero.
   history.scrollRestoration='manual';
   window.scrollTo({top:0,behavior:'instant'});
 });
 await page.waitForFunction(()=>window.scrollY<2);
 await page.waitForTimeout(120);
 const narrowEmail=await page.locator('.cinematic-landing-email').boundingBox();
 const narrowBooking=await page.locator('.cinema-director-bottom').boundingBox();
 // Preserve the image even when a CSS or font timing regression fails, so
 // the actual overlap can be diagnosed instead of dismissed as flaky.
 await page.screenshot({path:'artifacts/visual-evidence/mobile-375px.png'});
 if(!(narrowEmail&&narrowBooking&&narrowEmail.y+narrowEmail.height+4<narrowBooking.y)){
   console.error('375px hero layout:',JSON.stringify({
     email:narrowEmail,booking:narrowBooking,
     gap:narrowEmail&&narrowBooking?narrowBooking.y-narrowEmail.y-narrowEmail.height:null,
     url:page.url()
   }));
 }
 ensure(narrowEmail&&narrowBooking&&narrowEmail.y+narrowEmail.height+4<narrowBooking.y,
   '375px hero must not overlap the booking panel');
 // Verify the actual PUBLIC catalog feed controls first card, selected fare, gallery
 // and visibility, rather than checking only a mocked Admin PUT request.
 await page.setViewportSize({width:1440,height:900});
 const innova=defaultCatalog.find(car=>car.name==='Toyota Innova');
 const orderedFixture=[innova,...defaultCatalog.filter(car=>car.name!=='Toyota Innova')]
   .map(car=>car.name==='Mahindra Bolero'?{...car,enabled:false}:car);
 await page.route('**/api/catalog',route=>route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({vehicles:orderedFixture.filter(car=>car.enabled),updatedAt:'2026-10-13T00:00:00Z'})
 }));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.selected-vehicle strong')?.textContent==='Toyota Innova');
 ensure((await page.locator('.sort-control select').inputValue())==='featured',
   'Public site still defaults to Admin Featured order');
 ensure((await page.locator('.premium-catalog-card').first().getAttribute('data-model'))==='Toyota Innova',
   'Public fleet first card reflects saved priority');
 ensure((await page.locator('.fleet-editorial-tile').first().innerText()).includes('Toyota Innova'),
   'Cinematic rail follows the same admin order');
 ensure((await page.locator('.premium-catalog-card[data-model="Mahindra Bolero"]').count())===0,
   'Hidden admin fleet entry is not rendered publicly');
 const innovaCard=page.locator('.premium-catalog-card[data-model="Toyota Innova"]');
 const cardAngle=innovaCard.getByRole('button',{name:'Show another angle of Toyota Innova'});
 ensure((await cardAngle.innerText()).includes('1/3'),'Innova gallery starts at the first of three photos');
 await cardAngle.click();
 ensure((await cardAngle.innerText()).includes('2/3'),'Public card gallery advances to the second photo');
 ensure((await innovaCard.locator('.premium-catalog-fallback').innerText()).includes('Registration plate review pending'),
   'Innova rear reference is withheld until plate-safe replacement');
 await cardAngle.click();
 ensure((await cardAngle.innerText()).includes('3/3'),'Public gallery can reach third photo slot');
 ensure((await innovaCard.locator('.premium-catalog-fallback').innerText()).includes('Registration plate review pending'),
   'Innova front reference with visible registration is withheld');
 await page.locator('.fleet-editorial-angles').getByRole('button',{name:'View photo angle 2'}).click();
 ensure(await page.locator('.fleet-editorial-angles').getByRole('button',{name:'View photo angle 2'}).getAttribute('aria-pressed')==='true',
   'Cinematic gallery activates the requested alternate angle even if external photo delivery fails');
 await page.locator('.sort-control select').selectOption('seats-desc');
 ensure((await page.locator('.premium-catalog-card').first().getAttribute('data-model'))==='Tempo Traveller',
   'Most Seats sorting remains functional as a visitor override');
 await page.locator('.sort-control select').selectOption('featured');
 ensure((await page.locator('.premium-catalog-card').first().getAttribute('data-model'))==='Toyota Innova',
   'Featured order correctly restores admin sequencing');
 await innovaCard.getByRole('button',{name:'Estimate fare'}).click();
 ensure((await page.locator('.selected-vehicle strong').innerText())==='Toyota Innova',
   'Fare calculator retains the correct first model');

 // CRM photo-privacy regression: a current image cannot be published as
 // sanitized without pixelating a region or explicitly reviewing the whole photo.
 const tinyPng='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
 const adminVehicle={id:'preview-car',name:'Toyota Innova',category:'Premium MPV',seats:'6+1',
   tag:'Premium Comfort',capacity:6,image:tinyPng,rateMin:20,rateMax:30,enabled:true,gallery:[tinyPng]};
 const nextVehicle={...adminVehicle,id:'preview-ertiga',name:'Maruti Ertiga',category:'MPV',gallery:[]};
 let editedImageUrl='',savedCatalogName='',savedGallery='',savedVehicleOrder=[];
 let serverVehicles=[adminVehicle,nextVehicle];
 let packRequest=null;
 let imageUploads=0;
 await page.route('**/api/admin/**',async route=>{
   const url=new URL(route.request().url());
   let response={};
   if(url.pathname==='/api/admin/fleet-media/status'){
     response={ready:false,installed:0,total:7,missing:['/media/mt-thar-red-front.webp']};
   }else if(url.pathname==='/api/admin/fleet-media/import'){
     packRequest=route.request().postDataJSON();
     response={ok:true,installed:7,applied:['Mahindra Thar','Mahindra XUV700','Tempo Traveller']};
   }else if(url.pathname==='/api/admin/catalog'){
     if(route.request().method()==='PUT'){
       const body=route.request().postDataJSON();
       savedCatalogName=body.vehicles?.[0]?.name||'';
       savedVehicleOrder=(body.vehicles||[]).map(v=>v.name);
       savedGallery=body.vehicles?.[0]?.gallery?.[0]||'';
       serverVehicles=body.vehicles;
       response={vehicles:serverVehicles};
     }else response={vehicles:serverVehicles};
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
 // Frontend cannot silently claim the user's ZIP is installed. Staff must
 // actively upload and confirm it before the server receives photo bytes.
 const install=page.getByRole('button',{name:'Install and apply photo pack'});
 ensure(await install.isDisabled(),'Verified ZIP activation is disabled until file and consent');
 await page.locator('.fleet-photo-pack-manager input[type=file]').setInputFiles({
   name:'mateshwari_fleet_photography_safe_pack.zip',mimeType:'application/zip',
   buffer:Buffer.alloc(120,65)
 });
 ensure(await install.isDisabled(),'Upload button still requires explicit overwrite confirmation');
 await page.locator('.fleet-pack-confirm input[type=checkbox]').check();
 ensure(await install.isEnabled(),'File and explicit consent enable Admin import');
 await install.click();
 await page.waitForFunction(()=>document.querySelector('.fleet-admin-success')?.textContent?.includes('Installed 7 photos'));
 ensure(packRequest?.confirmReplace===true,'Admin submitted explicit model photo replacement consent');
 ensure(typeof packRequest?.zipBase64==='string'&&packRequest.zipBase64.length>100,
   'Admin sent the selected zip bytes rather than a filename');

 await page.getByRole('button',{name:'Review current photo / hide plates'}).first().click();
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
 await page.getByRole('button',{name:'Move Maruti Ertiga to first'}).click();
 ensure((await page.locator('.fleet-editor-fields input').first().inputValue())==='Maruti Ertiga',
   'Admin move-to-first visibly changes the first fleet card');
 await page.locator('.fleet-admin-head .fleet-save').click();
 ensure(savedVehicleOrder[0]==='Maruti Ertiga'&&savedVehicleOrder[1]==='Toyota Innova',
   'Admin save posts the exact vehicle ordering to backend');
 ensure(await page.locator('.fleet-order-number').first().innerText().then(x=>x.includes('#01')),
   'First priority is visibly labeled #01');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Cars & pricing'}).click();
 await page.waitForFunction(()=>document.querySelector('.fleet-editor-fields input')?.value==='Maruti Ertiga');
 ensure((await page.locator('.fleet-editor-fields input').first().inputValue())==='Maruti Ertiga',
   'Admin order survives browser reload');
 ensure((await page.locator('.fleet-order-number').first().innerText()).includes('#01'),
   'Reloaded first vehicle retains priority #01');
 // Each editorial image navigates to its own detailed adventure page.
 const journeyPage=await browser.newPage({viewport:{width:1280,height:800}});
 await journeyPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 const adventureLinks=await journeyPage.locator('.route-tile-image-link').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
 ensure(JSON.stringify(adventureLinks)===JSON.stringify([
   '/journeys/mountain-roads','/journeys/sunset-drive','/journeys/green-adventure']),
   'All three photographic cards link to different route/adventure pages');
 ensure((await journeyPage.locator('.route-tile-2 .scenic-image').getAttribute('src'))==='/media/mt-thar-grey-road.webp',
   'The third travel card now shows a reviewed vehicle-on-road photo, not forest scenery alone');
 const expectedTitles=['Beyond the familiar.','Take the scenic route.','Where the road breathes.'];
 for(let i=0;i<adventureLinks.length;i++){
   await journeyPage.goto('http://127.0.0.1:'+port+adventureLinks[i],{waitUntil:'domcontentloaded'});
   ensure((await journeyPage.locator('.adventure-hero h1').innerText())===expectedTitles[i],
     'Adventure '+(i+1)+' opens its distinct journey page');
   ensure(await journeyPage.locator('.adventure-chapter-grid article').count()===3,
     'Adventure '+(i+1)+' includes three route-specific planning stages');
   ensure((await journeyPage.locator('.adventure-hero-copy>a').getAttribute('href'))==='/#fare',
     'Adventure '+(i+1)+' safely continues to existing quotation form');
 }
 await journeyPage.close();
 ensure(failures.length===0,'No unhandled browser errors: '+failures.join('; '));
 console.log('PASS: three distinct adventure pages, auto-rolling fleet, 10 vehicles, Innova/Scorpio, quotes, mobile and Admin gates');
}
try{await smoke();}
finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
 if(fixtureCreated)unlinkSync(testVideo);
}
