import { useEffect, useRef, useState } from 'react';
import { ScanLine, CheckCircle2, RotateCcw, X } from 'lucide-react';

type Rect={x:number;y:number;w:number;h:number};
type Props={file:File;onCancel:()=>void;onComplete:(file:File)=>Promise<void>};
export function PhotoPrivacyEditor({file,onCancel,onComplete}:Props){
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const original=useRef<ImageBitmap|null>(null);
 const [selection,setSelection]=useState<Rect|null>(null);
 const start=useRef<{x:number;y:number}|null>(null);
 const [applied,setApplied]=useState(0);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
   let alive=true;
   setLoading(true);setSelection(null);setApplied(0);setError('');
   createImageBitmap(file).then(image=>{
     if(!alive){image.close();return;}
     original.current?.close();original.current=image;
     const max=1600,ratio=Math.min(1,max/Math.max(image.width,image.height));
     const c=canvas.current;
     if(c){
       c.width=Math.round(image.width*ratio);c.height=Math.round(image.height*ratio);
       c.getContext('2d')?.drawImage(image,0,0,c.width,c.height);
     }
     setLoading(false);
   }).catch(()=>{if(alive){setError('Unable to open this photo. Please use JPG, PNG or WebP.');setLoading(false);}});
   return()=>{alive=false;original.current?.close();original.current=null;};
 },[file]);
 const point=(ev:React.PointerEvent<HTMLCanvasElement>)=>{
   const c=ev.currentTarget,b=c.getBoundingClientRect();
   return{x:Math.max(0,Math.min(c.width,(ev.clientX-b.left)*c.width/b.width)),
     y:Math.max(0,Math.min(c.height,(ev.clientY-b.top)*c.height/b.height))};
 };
 const onStart=(e:React.PointerEvent<HTMLCanvasElement>)=>{
   start.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);
   setSelection({x:start.current.x,y:start.current.y,w:0,h:0});
 };
 const onMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{
   if(!start.current)return;
   const p=point(e),a=start.current;
   setSelection({x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),w:Math.abs(p.x-a.x),h:Math.abs(p.y-a.y)});
 };
 const onEnd=()=>{start.current=null;};
 const selected=(selection&&canvas.current)?{
   left:100*selection.x/canvas.current.width+'%',
   top:100*selection.y/canvas.current.height+'%',
   width:100*selection.w/canvas.current.width+'%',
   height:100*selection.h/canvas.current.height+'%'
 }:undefined;
 const mosaic=()=>{
   const c=canvas.current,r=selection;if(!c||!r||r.w<6||r.h<6)return;
   const context=c.getContext('2d');if(!context)return;
   const x=Math.round(r.x),y=Math.round(r.y),w=Math.round(r.w),h=Math.round(r.h);
   const buffer=document.createElement('canvas');
   buffer.width=Math.max(1,Math.floor(w/18));buffer.height=Math.max(1,Math.floor(h/18));
   buffer.getContext('2d')?.drawImage(c,x,y,w,h,0,0,buffer.width,buffer.height);
   context.save();
   context.imageSmoothingEnabled=false;
   context.drawImage(buffer,0,0,buffer.width,buffer.height,x,y,w,h);
   context.restore();
   setApplied(n=>n+1);setSelection(null);
 };
 const reset=()=>{
   const image=original.current,c=canvas.current;
   if(image&&c){c.getContext('2d')?.drawImage(image,0,0,c.width,c.height);setApplied(0);setSelection(null);}
 };
 const finish=async()=>{
   const c=canvas.current;if(!c)return;
   setSaving(true);setError('');
   try{
     const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Image export failed')),'image/webp',.82));
     await onComplete(new File([blob],file.name.replace(/\.[^.]+$/,'')+'-privacy.webp',{type:'image/webp'}));
     onCancel();
   }catch(e){setError(e instanceof Error?e.message:'Unable to save image');}
   finally{setSaving(false);}
 };
 return <div className="privacy-modal" role="dialog" aria-modal="true" aria-label="Vehicle photo privacy editor">
   <div className="privacy-sheet">
     <header><div><span className="crm-eyebrow">Photo studio / Privacy</span><h2>Remove registration details.</h2><p>Drag a rectangle over the actual number plate. Apply pixelation before saving the vehicle photo. Repeat for additional sensitive details.</p></div><button type="button" aria-label="Close editor" onClick={onCancel}><X size={19}/></button></header>
     {error&&<p className="crm-error" role="alert">{error}</p>}
     <div className="privacy-canvas-wrap">
       <canvas ref={canvas} style={{width:'100%',height:'auto',display:'block',touchAction:'none',cursor:'crosshair'}}
          onPointerDown={onStart} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd}/>
       {selected&&<div className="privacy-selected" style={selected} aria-hidden="true"/>}
       {loading&&<span className="privacy-loading">Loading image...</span>}
     </div>
     <div className="privacy-toolbar">
       <span>{applied} region{applied===1?'':'s'} pixelated</span>
       <div><button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
       <button type="button" disabled={!selection||selection.w<6||selection.h<6} onClick={mosaic}><ScanLine size={15}/> Pixelate selected area</button>
       <button type="button" className="fleet-save" disabled={saving||loading||!!selection} onClick={()=>void finish()}><CheckCircle2 size={15}/>{saving?'Uploading...':'Save sanitized photo'}</button></div>
     </div>
     <small>Review the whole image before saving. This permanently pixelates the selected area in the uploaded copy; there is no conspicuous grey bar. The original on your Mac is unchanged.</small>
   </div>
 </div>;
}
