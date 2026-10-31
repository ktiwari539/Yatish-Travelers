import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const site=(process.env.VITE_PUBLIC_SITE_ORIGIN||'').trim().replace(/\/$/,'');
const backend=(process.env.MT_CRM_API_ORIGIN||'').trim().replace(/\/$/,'');
const allowed=(value,label)=>{
 let url;
 try{url=new URL(value);}catch{throw Error(label+' must be a full HTTPS URL');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)
   throw Error(label+' must be an HTTPS origin without paths, credentials or query');
 return url.origin;
};
try{
 if(!site||!backend)throw Error('Set VITE_PUBLIC_SITE_ORIGIN and MT_CRM_API_ORIGIN in Netlify build environment. The CRM needs separate persistent hosting.');
 const website=allowed(site,'VITE_PUBLIC_SITE_ORIGIN');
 const api=allowed(backend,'MT_CRM_API_ORIGIN');
 if(website===api)throw Error('The public static site and the persistent CRM API must have separate origins.');
 const folder=resolve('dist');
 if(!existsSync(resolve(folder,'index.html')))throw Error('Vite build is missing dist/index.html');
 const robots=resolve(folder,'robots.txt');
 if(!existsSync(resolve(folder,'sitemap.xml'))||!existsSync(robots))throw Error('SEO sitemap/robots missing; check the public origin.');
 // Preserve API paths ahead of the SPA rewrite. Netlify's proxy does not
 // convert the existing file-based Node server into a durable service.
 const redirects='/api/*  '+api+'/api/:splat  200\n'+
                  '/admin  /index.html  200\n'+
                  '/stories  /index.html  200\n'+
                  '/journeys/*  /index.html  200\n'+
                  '/*  /index.html  200\n';
 writeFileSync(resolve(folder,'_redirects'),redirects);
 console.log('[netlify] Gated static build prepared for '+website);
 console.log('[netlify] External CRM proxy configured. Verify backend authentication, persistent storage and CORS on the actual deployment.');
}catch(error){
 console.error('[netlify] REFUSED TO BUILD:',error instanceof Error?error.message:String(error));
 process.exitCode=1;
}
