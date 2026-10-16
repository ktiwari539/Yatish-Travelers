// Test-only photographic turntable mechanics, NEVER a real-car asset certification.
// Creates a temporary Vite entry and intercepts numbered SVG test frames in browser.
// Nothing is added to public/media or to the approved production rotation registry.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFileSync,unlinkSync,existsSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const html='turntable-fixture-test.html';
const entry='src/turntable-fixture-test.tsx';
const port=5187;
for(const path of [html,entry])assert.ok(!existsSync(path),'Fixture collision: '+path);
writeFileSync(html,'<html><body><div id="root"></div><script type="module" src="/'+entry+'"></script></body></html>');
writeFileSync(entry,`import React from 'react';
import {createRoot} from 'react-dom/client';
import {PhotoTurntable} from './PhotoTurntable';
const frames=Array.from({length:36},(_,i)=>'/__test_frame_'+String(i).padStart(2,'0')+'.svg');
function Test(){const [failed,setFailed]=React.useState(false);return <div>{failed?<p role="alert">Frame failure fallback</p>:<PhotoTurntable model="TEST FIXTURE NOT A CAR" frames={frames} onFailure={()=>setFailed(true)}/>}</div>}
createRoot(document.getElementById('root')!).render(<Test/>);
`);
let server,browser;
const url='http://127.0.0.1:'+port+'/'+html;
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('Fixture server unavailable')}
async function run(engine,name){
 browser=await engine.launch({headless:true,args:name==='Chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:1100,height:820},reducedMotion:'no-preference'});
 const page=await context.newPage();
 await page.route('**/__test_frame_*.svg',route=>{
  const m=route.request().url().match(/__test_frame_(\d+)\.svg/);
  const n=m?Number(m[1]):0;
  // Each deliberately numbered SVG has different test pixels. Never a vehicle.
  return route.fulfill({status:200,contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="rgb(${n*5},100,150)"/><text x="100" y="150" font-size="70">TEST ${n}</text></svg>`});
 });
 await page.goto(url);
 const viewer=page.locator('.ride-genuine-turntable');
 await viewer.waitFor();
 await page.waitForFunction(()=>document.querySelector('.ride-genuine-turntable')?.getAttribute('data-turntable-ready')==='true');
 const image=viewer.locator('img');
 const index=async()=>Number((await image.getAttribute('src')).match(/_(\d+)\.svg$/)?.[1]);
 const first=await index();
 await page.waitForTimeout(850);
 assert.notEqual(await index(),first,name+': automatic frame advancement');
 await viewer.getByRole('button',{name:'Pause 360-degree rotation'}).click();
 const held=await index();await page.waitForTimeout(750);
 assert.equal(await index(),held,name+': explicit pause');
 // Resume first so the drag-hold test cannot pass just because manual pause is on.
 await viewer.getByRole('button',{name:'Resume 360-degree rotation'}).click();
 const viewport=viewer.locator('.ride-turntable-viewport');
 await viewport.focus();await page.keyboard.press('ArrowRight');
 assert.equal(await index(),(held+1)%36,name+': focused arrow advances one frame');
 const pos=await viewport.boundingBox();assert.ok(pos);
 const x=pos.x+pos.width/2,y=pos.y+pos.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+120,y,{steps:5});
 const dragged=await index();assert.notEqual(dragged,(held+1)%36,name+': actual drag changes frame');
 await page.waitForTimeout(3600);
 assert.equal(await index(),dragged,name+': held pointer never restarts autoplay');
 await page.mouse.up();
 await page.waitForTimeout(3950);
 assert.notEqual(await index(),dragged,name+': resumes after drag and idle');
 await context.close();
 const reduced=await browser.newContext({reducedMotion:'reduce'});
 const slow=await reduced.newPage();
 await slow.route('**/__test_frame_*.svg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"/>'}));
 await slow.goto(url);
 await slow.waitForFunction(()=>document.querySelector('.ride-genuine-turntable')?.getAttribute('data-turntable-ready')==='true');
 const reducedImg=slow.locator('.ride-genuine-turntable img');
 const atRest=await reducedImg.getAttribute('src');
 await slow.waitForTimeout(650);
 assert.equal(await reducedImg.getAttribute('src'),atRest,name+': reduced motion disables autoplay');
 assert.equal(await slow.getByRole('button',{name:'Pause 360-degree rotation'}).isDisabled(),true);
 await reduced.close();await browser.close();browser=null;
 console.log('PASS '+name+': 36 distinct test frames, autoplay, pause, keyboard, drag hold, idle resume, reduced motion');
}
try{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});
 await ready();
 await run(chromium,'Chromium');
 await run(webkit,'WebKit');
}finally{
 if(browser)await browser.close();
 if(server)server.kill('SIGTERM');
 for(const file of [entry,html])if(existsSync(file))unlinkSync(file);
}
