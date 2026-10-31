import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const origin=(process.env.MT_SITE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const output=resolve('artifacts/visual-evidence');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
let errors=0;
try {
 for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:20000});
  const skip=page.locator('.cinema-arrival-skip');
  if(await skip.count())await skip.evaluate(el=>el.click());
  const fleet=page.locator('#fleet');
  await fleet.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const cards=page.locator('.premium-catalog-card');
  const count=await cards.count();
  const result=[];
  for(let n=0;n<count;n++){
    const card=cards.nth(n);
    await card.scrollIntoViewIfNeeded();
    const image=card.locator('.premium-catalog-visual img');
    if(await image.count()){
      await image.evaluate(img=>img.decode().catch(()=>{}));
    }
    const item=await card.evaluate(el=>{
      const img=el.querySelector('.premium-catalog-visual img');
      const placeholder=el.querySelector('.premium-catalog-fallback');
      return {model:el.getAttribute('data-model'),photoLoaded:!!img&&img.complete&&img.naturalWidth>0,
        width:img?.naturalWidth||0,source:img?.getAttribute('src')||'',placeholder:!!placeholder};
    });
    result.push(item);
  }
  await fleet.screenshot({path:resolve(output,'fleet-'+label+'-current.png'),animations:'disabled'});
  console.log('\n'+label.toUpperCase()+' ('+width+'x'+height+') — '+count+' vehicle cards');
  console.table(result);
  const failures=result.filter(x=>!x.photoLoaded);
  if(count!==10||failures.length){errors+=1;console.error('BLOCKED: '+(count!==10?'Expected 10 cards. ':'')+failures.length+' photos not loaded');}
  else console.log('PASS: all ten fleet-card photos loaded.');
  await page.close();
 }
} finally {await browser.close();}
console.log('\nSaved actual browser screenshots under artifacts/visual-evidence/.');
console.log('This checks loading and layout evidence only; not image rights, plate privacy or exact model ownership.');
if(errors)process.exitCode=1;
