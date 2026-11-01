import {useEffect} from 'react';
import pageData from './seo-pages.json';
const pages:Record<string,PageSeo>=pageData;

type PageSeo={title:string;description:string;index:boolean};
const setMeta=(key:'name'|'property',value:string,content:string)=>{
 let node=document.head.querySelector<HTMLMetaElement>('meta['+key+'="'+value+'"]');
 if(!node){node=document.createElement('meta');node.setAttribute(key,value);document.head.appendChild(node);}
 node.content=content;
};
const publicOrigin=((import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_PUBLIC_SITE_ORIGIN||'').trim().replace(/\/$/,'');
export function PageSEO(){
 useEffect(()=>{
  const path=window.location.pathname.replace(/\/+$/,'')||'/';
  const seo=pages[path]||{title:'Page unavailable | Mateshwari Travellers',description:'Explore Mateshwari Travellers and request an enquiry for your next trip.',index:false};
  const isPrivate=/^(\/admin(?:\/|$)|\/dashboard(?:\/|$)|\/api(?:\/|$))/.test(path);
  const index=seo.index&&!isPrivate;
  document.title=seo.title;
  setMeta('name','description',seo.description);
  setMeta('name','robots',index?'index,follow,max-image-preview:large':'noindex,nofollow');
  setMeta('name','googlebot',index?'index,follow,max-image-preview:large':'noindex,nofollow');
  setMeta('property','og:title',seo.title);
  setMeta('property','og:description',seo.description);
  setMeta('name','twitter:title',seo.title);
  setMeta('name','twitter:description',seo.description);
  if(publicOrigin&&/^https:\/\/[^/]+$/.test(publicOrigin)&&index){
   const canonical=publicOrigin+path;
   let link=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
   if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}
   link.href=canonical;
   setMeta('property','og:url',canonical);
  }
 },[]);
 return null;
}
