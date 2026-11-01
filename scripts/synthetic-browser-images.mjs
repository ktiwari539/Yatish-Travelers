import sharp from 'sharp';
/** Stable synthetic pixels for browser mechanics; never evidence of real fleet-photo approval. */
export async function installSyntheticImages(page){
 const image=await sharp(Buffer.from('<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="640" fill="#28463e"/><text x="100" y="320" fill="#fff" font-size="32">Synthetic test image</text></svg>')).png().toBuffer();
 await page.route('https://**/*',async route=>{if(route.request().resourceType()==='image')await route.fulfill({contentType:'image/png',body:image});else await route.continue();});
}
