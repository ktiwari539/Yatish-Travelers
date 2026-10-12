import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { PhotoPrivacyEditor } from './PhotoPrivacyEditor';

export type CatalogVehicle = {
 id:string;name:string;seats:string;capacity:number;tag:string;category:string;image:string;
 rateMin:number;rateMax:number;enabled:boolean;gallery?:string[];modelUrl?:string;
};
type Props={token:string};
const blank=():CatalogVehicle=>({id:'',name:'',seats:'4+1',capacity:4,tag:'Comfortable travel',category:'Sedan',image:'',rateMin:15,rateMax:25,enabled:false,gallery:[],modelUrl:''});

export function FleetManager({token}:Props) {
 const [vehicles,setVehicles]=useState<CatalogVehicle[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [uploading,setUploading]=useState<number|null>(null);
 const [uploadingModel,setUploadingModel]=useState<number|null>(null);
 const [editingPhoto,setEditingPhoto]=useState<{index:number;file:File;angleIndex?:number}|null>(null);
 const [reviewingPhoto,setReviewingPhoto]=useState<number|null>(null);
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
 const reviewCurrentPhoto=async(index:number,src:string,angleIndex?:number)=>{
   setError('');setSuccess('');setReviewingPhoto(index);
   try{
     // Browser CORS: no credentials or untrusted internal proxy. Wikimedia allows
     // downloads where its response headers permit cross-origin image access.
     const response=await fetch(src,{mode:'cors',credentials:'omit'});
     if(!response.ok)throw new Error('Image host returned '+response.status);
     const bytes=await response.blob();
     if(!bytes.type.startsWith('image/')||bytes.size>15_000_000)
       throw new Error('The image cannot be safely opened for review.');
     const type=/^image\/(jpeg|png|webp)$/.test(bytes.type)?bytes.type:'image/jpeg';
     setEditingPhoto({index,angleIndex,file:new File([bytes],
       'review-'+vehicles[index].name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.jpg',{type})});
   }catch(e){
     setError('Cannot load this external image into the privacy editor. Download its licensed photo to your Mac and choose Upload / edit vehicle photo. This is a browser cross-origin restriction, not proof the image is plate-free.');
   }finally{setReviewingPhoto(null);}
 };
 const uploadPhoto=async(index:number,file:File|undefined,angleIndex?:number)=>{
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
     if(angleIndex===undefined)change(index,{image:body.url});
     else change(index,{gallery:(vehicles[index].gallery||[]).map((url,i)=>i===angleIndex?body.url:url)});
     setSuccess((angleIndex===undefined?'Main photo':'Alternate angle '+(angleIndex+1))+' reviewed and uploaded locally. Press Save Changes to use the privacy-safe copy.');
   }catch(e){setError(e instanceof Error?e.message:'Upload failed');throw e;}
   finally{setUploading(null);}
 };
 const uploadModel=async(index:number,file:File|undefined)=>{
   if(!file)return;
   setError('');setSuccess('');
   if(file.size>8_000_000||!file.name.toLowerCase().endsWith('.glb')){
     setError('Choose a self-contained .glb model smaller than 8 MB.');return;
   }
   setUploadingModel(index);
   try{
     const encoded=await new Promise<string>((resolve,reject)=>{
       const reader=new FileReader();
       reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
       reader.onerror=()=>reject(new Error('Unable to read GLB model.'));
       reader.readAsDataURL(file);
     });
     const response=await fetch('/api/admin/models',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data:encoded})});
     const body=await response.json();
     if(!response.ok)throw new Error(body.error||'GLB model upload failed.');
     change(index,{modelUrl:body.url});
     setSuccess('3D model uploaded to this computer. Save fleet settings, then reload the public showroom.');
   }catch(e){setError(e instanceof Error?e.message:'Upload failed.');}
   finally{setUploadingModel(null);}
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
        <label>Additional vehicle angles (up to 5 URLs, one per line)
          <textarea rows={3} value={(v.gallery||[]).join('\n')} placeholder="https://.../side-view.jpg" onChange={e=>change(index,{gallery:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})}/>
        </label>
                <div className="fleet-photo-review-actions">
          <button type="button" disabled={!v.image||reviewingPhoto===index}
            onClick={()=>void reviewCurrentPhoto(index,v.image)}>
            {reviewingPhoto===index?'Loading image for review…':'Review current photo / hide plates'}
          </button>
          <small>Inspect original registration details before allowing this photo into production. Edited copy replaces the linked photo after Save changes.</small>
        </div>
        {(v.gallery||[]).length>0&&<div className="fleet-photo-review-actions fleet-alternate-reviews">
          <strong>Review alternate photo angles</strong>
          {(v.gallery||[]).map((src,angleIndex)=><button type="button" key={angleIndex}
            disabled={!src||reviewingPhoto===index}
            onClick={()=>void reviewCurrentPhoto(index,src,angleIndex)}>
            {reviewingPhoto===index?'Loading photo…':'Review / hide plates · angle '+(angleIndex+1)}
          </button>)}
          <small>Every alternate angle is a separate photograph and needs a full privacy review.</small>
        </div>}
        <label className="fleet-photo-upload">Upload / edit vehicle photo · hide plates (JPG/PNG/WebP up to 3 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading===index} onChange={e=>{const selected=e.target.files?.[0];if(selected)setEditingPhoto({index,file:selected});e.target.value='';}}/>
          {uploading===index&&<span>Uploading image locally...</span>}
        </label>
        <div className="fleet-model-upload">
          <span>True 3D model (optional / licensed GLB)</span>
          <small>Show a detailed branded vehicle model in the interactive showroom. Without one, the site renders an unbranded 3D concept silhouette.</small>
          <label>Choose self-contained GLB (up to 8 MB)
            <input type="file" accept=".glb,model/gltf-binary" disabled={uploadingModel===index} onChange={e=>{void uploadModel(index,e.target.files?.[0]);e.target.value='';}}/>
          </label>
          {v.modelUrl&&<div className="fleet-model-present"><span>Local model configured: {v.modelUrl}</span><button type="button" onClick={()=>change(index,{modelUrl:''})}>Remove 3D model</button></div>}
          {uploadingModel===index&&<span>Uploading 3D model...</span>}
        </div>
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
   {editingPhoto&&<PhotoPrivacyEditor file={editingPhoto.file} onCancel={()=>setEditingPhoto(null)} onComplete={f=>uploadPhoto(editingPhoto.index,f,editingPhoto.angleIndex)}/>}
   <p className="fleet-admin-note">Prices are indicative until your final commercial rules are approved. Images can be uploaded from your computer (stored only on your Mac) or linked using HTTPS URLs. Every existing external photo and every alternate angle must be reviewed separately before production. A link alone does not anonymize plate numbers. Use only images you are licensed to publish; externally hosted images may expose visitor requests to their hosting provider. Inventory updates stay on this Mac during local testing.</p>
 </section>;
}
