import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { PhotoPrivacyEditor } from './PhotoPrivacyEditor';

export type CatalogVehicle = {
 id:string;name:string;seats:string;capacity:number;tag:string;category:string;image:string;
 rateMin:number;rateMax:number;enabled:boolean;
};
type Props={token:string};
const blank=():CatalogVehicle=>({id:'',name:'',seats:'4+1',capacity:4,tag:'Comfortable travel',category:'Sedan',image:'',rateMin:15,rateMax:25,enabled:false});

export function FleetManager({token}:Props) {
 const [vehicles,setVehicles]=useState<CatalogVehicle[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [uploading,setUploading]=useState<number|null>(null);
 const [editingPhoto,setEditingPhoto]=useState<{index:number;file:File}|null>(null);
 const load=useCallback(async()=>{
   setError('');
   try {
     const response=await fetch('/api/admin/catalog',{headers:{Authorization:'Bearer '+token}});
     const body=await response.json();
     if(!response.ok) throw new Error(body.error||'Failed to load fleet');
     setVehicles(body.vehicles||[]);setLoaded(true);
   } catch(e){setError(e instanceof Error?e.message:'Failed to load fleet');}
 },[token]);
 useEffect(()=>{void load();},[load]);
 const change=(index:number,patch:Partial<CatalogVehicle>)=>{
  setVehicles(current=>current.map((v,i)=>i===index?{...v,...patch}:v));
  setSuccess('');
 };
 const uploadPhoto=async(index:number,file:File|undefined)=>{
   if(!file)return;
   setError('');setSuccess('');
   if(file.size>3_000_000||!['image/jpeg','image/png','image/webp'].includes(file.type)){
     setError('Choose a JPG, PNG or WebP photo smaller than 3 MB.');return;
   }
   setUploading(index);
   try{
     const encoded=await new Promise<string>((resolve,reject)=>{
       const reader=new FileReader();
       reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
       reader.onerror=()=>reject(new Error('Could not read image file'));
       reader.readAsDataURL(file);
     });
     const response=await fetch('/api/admin/images',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({mime:file.type,data:encoded})});
     const body=await response.json();
     if(!response.ok)throw new Error(body.error||'Image upload failed');
     change(index,{image:body.url});setSuccess('Image uploaded locally. Press Save Changes to publish the new vehicle photo in the local preview.');
   }catch(e){setError(e instanceof Error?e.message:'Upload failed');}
   finally{setUploading(null);}
 };
 const save=async()=>{
   setError('');setSuccess('');setSaving(true);
   try{
     const response=await fetch('/api/admin/catalog',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({vehicles})});
     const body=await response.json();
     if(!response.ok)throw new Error(body.error||'Unable to save fleet');
     setVehicles(body.vehicles);setSuccess('Fleet and rates saved. Refresh the public website to see changes.');
   }catch(e){setError(e instanceof Error?e.message:'Save failed');}
   finally{setSaving(false);}
 };
 return <section className="fleet-admin">
   <div className="fleet-admin-head"><div><span className="crm-eyebrow">Fleet control</span><h2>Manage vehicles & pricing.</h2>
      <p>Edit the actual inventory, vehicle details, reference image URL, visibility and indicative per-km range.</p></div>
      <div><button className="crm-refresh" onClick={()=>void load()} type="button"><RefreshCw size={16}/> Reload</button>
        <button className="fleet-save" onClick={()=>void save()} type="button" disabled={saving}>{saving?'Saving...':<><Save size={16}/> Save Changes</>}</button></div>
   </div>
   {error&&<div role="alert" className="crm-error">{error}</div>}
   {success&&<div role="status" className="fleet-admin-success"><CheckCircle2 size={17}/>{success}</div>}
   {!loaded&&<p>Loading fleet...</p>}
   <div className="fleet-admin-grid">{vehicles.map((v,index)=><article className="fleet-editor" key={v.id||index}>
      <div className="fleet-editor-visual">{v.image?<img src={v.image} alt={v.name} loading="lazy"/>:<div><ImagePlus size={26}/> Add HTTPS photo URL below</div>}
       <span>{v.enabled?'Visible on website':'Hidden from website'}</span></div>
      <div className="fleet-editor-fields">
        <label>Vehicle name<input value={v.name} onChange={e=>change(index,{name:e.target.value})} placeholder="e.g. Toyota Fortuner"/></label>
        <div className="fleet-editor-row">
          <label>Seats label<input value={v.seats} onChange={e=>change(index,{seats:e.target.value})}/></label>
          <label>Passenger capacity<input type="number" min={1} max={50} value={v.capacity} onChange={e=>change(index,{capacity:Number(e.target.value)})}/></label>
        </div>
        <div className="fleet-editor-row">
          <label>Category<input value={v.category} onChange={e=>change(index,{category:e.target.value})}/></label>
          <label>Short description<input value={v.tag} onChange={e=>change(index,{tag:e.target.value})}/></label>
        </div>
        <label>Photo URL or uploaded local path<input type="text" value={v.image} onChange={e=>change(index,{image:e.target.value})} placeholder="https://.../vehicle.jpg"/></label>
        <label className="fleet-photo-upload">Upload / edit vehicle photo · blur plates (JPG/PNG/WebP up to 3 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading===index} onChange={e=>{const selected=e.target.files?.[0];if(selected)setEditingPhoto({index,file:selected});e.target.value='';}}/>
          {uploading===index&&<span>Uploading image locally...</span>}
        </label>
        <div className="fleet-editor-row">
          <label>Minimum ₹ / km<input type="number" min={1} step=".5" value={v.rateMin} onChange={e=>change(index,{rateMin:Number(e.target.value)})}/></label>
          <label>Maximum ₹ / km<input type="number" min={1} step=".5" value={v.rateMax} onChange={e=>change(index,{rateMax:Number(e.target.value)})}/></label>
        </div>
        <div className="fleet-editor-actions">
          <label className="fleet-visible-toggle"><input type="checkbox" checked={v.enabled} onChange={e=>change(index,{enabled:e.target.checked})}/> Display on public website</label>
          <button type="button" onClick={()=>setVehicles(current=>current.filter((_,i)=>i!==index))}><Trash2 size={14}/> Remove</button>
        </div>
      </div>
   </article>)}</div>
   <div className="fleet-admin-bottom">
     <button type="button" className="fleet-add" onClick={()=>setVehicles(current=>[...current,blank()])}><Plus size={16}/> Add another vehicle</button>
     <button type="button" className="fleet-save" disabled={saving} onClick={()=>void save()}><Save size={16}/> {saving?'Saving...':'Save fleet & pricing'}</button>
   </div>
   {editingPhoto&&<PhotoPrivacyEditor file={editingPhoto.file} onCancel={()=>setEditingPhoto(null)} onComplete={f=>uploadPhoto(editingPhoto.index,f)}/>}
   <p className="fleet-admin-note">Prices are indicative until your final commercial rules are approved. Images can be uploaded from your computer (stored only on your Mac) or linked using HTTPS URLs. Use only images you are licensed to publish; externally hosted images may expose visitor requests to their hosting provider. Inventory updates stay on this Mac during local testing.</p>
 </section>;
}
