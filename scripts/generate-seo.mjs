import {writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const raw=(process.env.VITE_PUBLIC_SITE_ORIGIN||'').trim().replace(/\/$/,'');
if(!raw){console.log('[SEO] Production origin not set; skipping absolute sitemap and canonical HTML generation.');process.exit(0);}
let base;
try{base=new URL(raw);if(base.protocol!=='https:'||base.pathname!=='/'||base.search||base.hash)throw Error('origin must be HTTPS site root');}
catch{console.error('[SEO] VITE_PUBLIC_SITE_ORIGIN must be a valid HTTPS origin, e.g. https://your-domain.example');process.exit(1);}
const origin=base.origin;
const routes=['/','/stories','/journeys/mountain-roads','/journeys/sunset-drive','/journeys/green-adventure'];
const escapeXml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(p=>'  <url><loc>'+escapeXml(origin+p)+'</loc></url>').join('\n')+'\n</urlset>\n';
writeFileSync(resolve('dist/sitemap.xml'),xml);
const robots=resolve('dist/robots.txt');
if(existsSync(robots)){
 const text=readFileSync(robots,'utf8');
 writeFileSync(robots,text.replace(/\n?Sitemap:.*\n/g,'\n').trimEnd()+'\n\nSitemap: '+origin+'/sitemap.xml\n');
}
console.log('[SEO] Generated sitemap for '+origin+' ('+routes.length+' public pages).');
