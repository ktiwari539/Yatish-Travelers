import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const raw=(process.env.VITE_PUBLIC_SITE_ORIGIN||'').trim();
if(!raw){console.log('[SEO] Production origin not set; skipping absolute SEO generation.');process.exit(0);}
let base;
try{base=new URL(raw);if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error();}
catch{console.error('[SEO] VITE_PUBLIC_SITE_ORIGIN must be an HTTPS origin without credentials.');process.exit(1);}
const origin=base.origin;
const pages=JSON.parse(readFileSync('src/seo-pages.json','utf8'));
const routes=Object.keys(pages);
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template=readFileSync('dist/index.html','utf8');
for(const [path,seo] of [...Object.entries(pages),['/admin',{title:'Staff access | Mateshwari Travellers',description:'Authorized staff access.',index:false}]]){
 let html=template.replace(/<title>.*?<\/title>/,'<title>'+esc(seo.title)+'</title>');
 for(const [key,value] of [['description',seo.description],['robots',seo.index?'index,follow,max-image-preview:large':'noindex,nofollow'],['googlebot',seo.index?'index,follow,max-image-preview:large':'noindex,nofollow']]) html=html.replace(new RegExp('<meta name="'+key+'"[^>]*>'),'<meta name="'+key+'" content="'+esc(value)+'" />');
 for(const key of ['title','description'])html=html.replace(new RegExp('<meta property="og:'+key+'"[^>]*>'),'<meta property="og:'+key+'" content="'+esc(seo[key])+'" />');
 if(seo.index){
  const url=origin+path;
  html=html.replace('</head>','<link rel="canonical" href="'+esc(url)+'" />\n<meta property="og:url" content="'+esc(url)+'" />\n</head>');
  html=html.replace('<div id="root"></div>','<div id="root"></div><noscript><main><h1>'+esc(seo.title.split(' | ')[0])+'</h1><p>'+esc(seo.description)+'</p><p>Enable JavaScript to compare vehicles and send an enquiry. An enquiry is not a confirmed booking.</p><nav>'+routes.map(route=>'<a href="'+route+'">'+esc(pages[route].title.split(' | ')[0])+'</a>').join(' · ')+'</nav></main></noscript>');
 }
 const file=resolve('dist',path==='/'?'index.html':path.slice(1)+'/index.html');mkdirSync(dirname(file),{recursive:true});writeFileSync(file,html);
}
writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(p=>'  <url><loc>'+esc(origin+p)+'</loc></url>').join('\n')+'\n</urlset>\n');
writeFileSync('dist/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard\n\nSitemap: '+origin+'/sitemap.xml\n');
// Let crawlers see Admin's noindex. Authorization is enforced by the API.
writeFileSync('dist/404.html',template.replace(/content="index,follow,max-image-preview:large"/g,'content="noindex,nofollow"').replace(/<title>.*?<\/title>/,'<title>Page unavailable | Mateshwari Travellers</title>'));
console.log('[SEO] Generated metadata, canonical HTML, sitemap, and noindex Admin for '+routes.length+' public pages.');
