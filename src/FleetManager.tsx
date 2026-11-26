import {adminFetch,uploadModelChunks} from './crmApi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2, CheckCircle2, RefreshCw, ArrowUp, ArrowDown, ChevronsUp, ListOrdered, UploadCloud, Images } from 'lucide-react';
import { PhotoPrivacyEditor } from './PhotoPrivacyEditor';

export type CatalogVehicle = {
 id:string;name:string;seats:string;capacity:number;tag:string;category:string;image:string;
 rateMin:number;rateMax:number;enabled:boolean;gallery?:string[];modelUrl?:string;displayOrder?:number;
};
type Props={token:string};
const seatLabels=['1+1','2+1','3+1','4+1','5+1','6+1','7+1','8+1','9+1','10+1','12+1','14+1','17+1','20+1','12+1 / 17+1'];
const categories=['Sedan','Hatchback','MPV','Premium MPV','SUV','Premium SUV','Adventure SUV','Traveller','Mini Bus','Bus','Luxury'];
const capacities=[...Array.from({length:20},(_,i)=>i+1),24,25,30,35,40,45,50];
const tagSuggestions=['Family Favourite','Premium Comfort','City & Airport','Outstation Ready','Executive Travel','Group Travel','Adventure SUV · On request','Spacious Family Vehicle'];
const serverPhoto=/^\/api\/uploads\/[a-f0-9-]{36}\.webp$/;
const photoSource=(path:string)=>serverPhoto.test(path)?'Stored in managed cloud media':path.startsWith('/media/')?'Bundled website reference':'External photo reference';
const newVehicle=(v:CatalogVehicle)=>v.id.startsWith('draft-');
const blank=():CatalogVehicle=>({id:'draft-'+crypto.randomUUID(),name:'',seats:'4+1',capacity:4,tag:'Comfortable travel',category:'Sedan',image:'',rateMin:15,rateMax:25,enabled:false,gallery:[],modelUrl:''});
function validateFleet(vehicles:CatalogVehicle[]):string{
 if(vehicles.length>80)return 'A maximum of 80 vehicles is supported.';
 const used=new Set<string>();
 for(const [index,v] of vehicles.entries()){
  const row='Vehicle '+(index+1);
  if(!v.name.trim()||!v.seats.trim()||!v.category.trim()||!v.tag.trim())return row+': provide name, seating, category and short description.';
  const key=v.name.trim().toLocaleLowerCase();
  if(used.has(key))return 'Duplicate vehicle name: '+v.name+'. Each vehicle must have a unique name.';
  used.add(key);
  if(!v.image)return row+' ('+v.name+'): upload a cover photo before saving. A laptop path is not needed.';
  if(!Number.isInteger(v.capacity)||v.capacity<1||v.capacity>50)return row+': passenger capacity must be between 1 and 50.';
  if(!Number.isFinite(v.rateMin)||!Number.isFinite(v.rateMax)||v.rateMin<1||v.rateMax>10000||v.rateMin>v.rateMax)return row+': check minimum and maximum per-km prices.';
  if((v.gallery||[]).length>5)return row+': no more than five gallery photos are supported.';
 }
 return '';
}

export function FleetManager({token}:Props) {
 const [version,setVersion]=useState(0);
 const [vehicles,setVehicles]=useState<CatalogVehicle[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [uploading,setUploading]=useState<number|null>(null);
 const [uploadingModel,setUploadingModel]=useState<number|null>(null);
 const [editingPhoto,setEditingPhoto]=useState<{index:number;file:File;angleIndex?:number;addToGallery?:boolean}|null>(null);
 const photoQueue=useRef<File[]>([]);
 const [reviewingPhoto,setReviewingPhoto]=useState<number|null>(null);
 const [mediaStatus,setMediaStatus]=useState<{ready:boolean;installed:number;total:number;missing:string[];invalid:string[];catalogApplied:boolean;persistedCatalogApplied:boolean|null;modelLinks:{name:string;present:boolean;matches:boolean;persistedMatches:boolean|null}[]}|null>(null);
 const [importFile,setImportFile]=useState<File|null>(null);
 const [confirmImport,setConfirmImport]=useState(false);
 const [importBusy,setImportBusy]=useState(false);
 const load=useCallback(async()=>{
   setError('');
   try {
     const response=await adminFetch('/api/admin/catalog',{headers:{Authorization:'Bearer '+token}});
     const body=await response.json();
     if(!response.ok) throw new Error(body.error||'Failed to load fleet');
     setVersion(body.version??0);setVehicles(body.vehicles||[]);setLoaded(true);setDirty(false);
     const status=await adminFetch('/api/admin/fleet-media/status',{headers:{Authorization:'Bearer '+token}});
     if(status.ok)setMediaStatus(await status.json());
   } catch(e){setError(e instanceof Error?e.message:'Failed to load fleet');}
 },[token]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
   if(!dirty)return;
   const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
   window.addEventListener('beforeunload',warn);
   return ()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);
 const importFleetPhotos=async()=>{
   if(!importFile||!confirmImport||importBusy)return;
   if(dirty){
     setError('Save or reload your pending vehicle changes before applying the photo pack.');
     return;
   }
   if(importFile.size>1_800_000||importFile.size<100){
     setError('Select the original reviewed seven-photo ZIP (maximum 1.8 MB).');return;
   }
   setImportBusy(true);setError('');setSuccess('');
   try{
     const encoded=await new Promise<string>((resolve,reject)=>{
       const reader=new FileReader();
       reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
       reader.onerror=()=>reject(new Error('Could not read ZIP.'));
       reader.readAsDataURL(importFile);
     });
     const response=await adminFetch('/api/admin/fleet-media/import',{
       method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
       body:JSON.stringify({zipBase64:encoded,confirmReplace:true,expectedVersion:version})
     });
     const result=await response.json();
     if(!response.ok)throw new Error(result.error||'Photo installation failed');
     setImportFile(null);setConfirmImport(false);
     await load();
     setSuccess('Installed '+result.installed+' photos and activated '+result.applied.join(', ')+'. Refresh the customer website to see them.');
   }catch(e){setError(e instanceof Error?e.message:'Photo installation failed.');}
   finally{setImportBusy(false);}
 };
 const change=(index:number,patch:Partial<CatalogVehicle>)=>{
  setVehicles(current=>current.map((v,i)=>i===index?{...v,...patch}:v));
  setSuccess('');setDirty(true);
 };
 const moveVehicle=(from:number,to:number)=>{
  if(to<0||to>=vehicles.length||from===to)return;
  setVehicles(current=>{
    const next=[...current];
    const [item]=next.splice(from,1);
    next.splice(to,0,item);
    return next.map((car,index)=>({...car,displayOrder:index+1}));
  });
  setSuccess('');
  setDirty(true);
 };
 const beginCoverUpload=(index:number,file:File|undefined)=>{
   if(!file||uploading!==null)return;
   photoQueue.current=[];
   setEditingPhoto({index,file});
 };
 const beginGalleryUpload=(index:number,files:FileList|null)=>{
   if(!files?.length||uploading!==null)return;
   const available=5-(vehicles[index].gallery||[]).length;
   if(available<=0){setError('This vehicle already has five additional photos. Replace or remove an angle to add another.');return;}
   const selected=Array.from(files);
   if(selected.some(file=>file.size>3_000_000||!['image/jpeg','image/png','image/webp'].includes(file.type))){
     setError('Choose JPG, PNG or WebP images smaller than 3 MB each. No files were uploaded.');return;
   }
   if(selected.length>available){setError('You selected '+selected.length+' photos; only '+available+' more fit. Choose fewer photos.');return;}
   setError('');
   photoQueue.current=selected.slice(1);
   setEditingPhoto({index,file:selected[0],addToGallery:true});
 };
 const finishPhotoReview=()=>{
   const next=photoQueue.current.shift();
   setEditingPhoto(current=>next&&current?{...current,file:next}:null);
 };
 const cancelPhotoReview=()=>{photoQueue.current=[];setEditingPhoto(null);};
 const galleryChange=(index:number,urls:string[])=>change(index,{gallery:urls});
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
     setError('Could not open the current photo for privacy review. Choose a replacement image from your device instead. Existing photos are unchanged.');
   }finally{setReviewingPhoto(null);}
 };
 const uploadPhoto=async(index:number,file:File|undefined,angleIndex?:number,addToGallery=false)=>{
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
     const response=await adminFetch('/api/admin/images',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({mime:file.type,data:encoded})});
     const body=await response.json();
     if(!response.ok)throw new Error(body.error||'Image upload failed');
     if(!serverPhoto.test(String(body.url||'')))throw new Error('Upload completed but no valid server media path was returned.');
     setVehicles(current=>current.map((v,i)=>{
       if(i!==index)return v;
       if(addToGallery)return {...v,gallery:[...(v.gallery||[]),body.url].slice(0,5)};
       if(angleIndex!==undefined)return {...v,gallery:(v.gallery||[]).map((src,j)=>j===angleIndex?body.url:src)};
       return {...v,image:body.url};
     }));
     setDirty(true);
     setSuccess((addToGallery?'Gallery photo':angleIndex===undefined?'Cover photo':'Gallery angle '+(angleIndex+1))+' uploaded to managed cloud media. Save the fleet to link it to this vehicle.');
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
     const body=await uploadModelChunks(file,token);
     change(index,{modelUrl:body.url});
     setSuccess('3D model uploaded to the media store. Save fleet settings, then reload the public showroom.');
   }catch(e){setError(e instanceof Error?e.message:'Upload failed.');}
   finally{setUploadingModel(null);}
 };
 const save=async()=>{
   if(uploading!==null||editingPhoto||uploadingModel!==null||importBusy){setError('Finish uploads and photo reviews before saving the fleet.');return;}
   const invalid=validateFleet(vehicles);
   if(invalid){setError(invalid);setSuccess('');return;}
   setError('');setSuccess('');setSaving(true);
   try{
     const response=await adminFetch('/api/admin/catalog',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({vehicles,expectedVersion:version})});
     const body=await response.json();
     if(!response.ok)throw new Error(body.error||'Unable to save fleet');
     setVersion(body.version);setVehicles(body.vehicles);setDirty(false);setSuccess('Vehicle priority, visibility, images and rates saved. Refresh the public website to see the new featured order.');
   }catch(e){setError(e instanceof Error?e.message:'Save failed');}
   finally{setSaving(false);}
 };
 return <section className="fleet-admin">
   <div className="fleet-admin-head"><div><span className="crm-eyebrow">Fleet control · display priority</span><h2>Manage vehicles, prices & order.</h2>
      <p>Add and edit vehicles using guided fields and photo uploads. Pictures are stored in Netlify's managed cloud media, and fleet details are saved in Firestore. No photo URL or laptop file path is required. Saving a visible vehicle updates the public website.</p></div>
      <div><button className="crm-refresh" onClick={()=>{if(!dirty||window.confirm('Discard unsaved fleet changes and reload from the server?'))void load();}} type="button"><RefreshCw size={16}/> Reload</button>
        <button className="fleet-save" onClick={()=>void save()} type="button" disabled={saving||uploading!==null||!!editingPhoto||importBusy}>{saving?'Saving...':<><Save size={16}/> Save Changes</>}</button></div>
   </div>
   {error&&<div role="alert" className="crm-error">{error}</div>}
   {success&&<div role="status" className="fleet-admin-success"><CheckCircle2 size={17}/>{success}</div>}
   {!loaded&&<p>Loading fleet...</p>}
   {loaded&&<div className="fleet-order-help" role="status">
      <ListOrdered size={18}/>
      <span><strong>Website featured order</strong> · Position 01 displays first in the Fleet and cinematic vehicle reel. Hidden models keep their position but do not appear publicly.</span>
      {dirty&&<span className="fleet-unsaved">Unsaved changes</span>}
   </div>}
   <section className="fleet-photo-pack-manager" aria-label="Fleet photography import">
     <div className="fleet-pack-heading">
       <Images size={22}/>
       <div><strong>Approved photo pack</strong>
         <p>Import the seven photos you shared, directly from Admin. No terminal or separate ZIP extraction required.</p>
       </div>
     </div>
     {mediaStatus&&<div className="fleet-pack-status" role="status">
       <p>{mediaStatus.ready
         ?'All seven reviewed image files passed their SHA-256 integrity checks.'
         :'Only '+mediaStatus.installed+' of '+mediaStatus.total+' reviewed images are verified on the media store.'}</p>
       {!!mediaStatus.missing.length&&<p>Missing files: {mediaStatus.missing.join(', ')}</p>}
       {!!mediaStatus.invalid?.length&&<p>Incorrect or unreadable files: {mediaStatus.invalid.join(', ')}. Reinstall the original reviewed ZIP.</p>}
       {mediaStatus.ready&&!mediaStatus.catalogApplied&&<p>The images are installed, but not all three public vehicle entries use this pack. Import and confirm replacement below.</p>}
       {mediaStatus.persistedCatalogApplied===false&&<p>Your saved CRM catalog still points at different photos for one or more of these models. Use the confirmed import below to replace only those three photo sets without changing order or pricing.</p>}
       {mediaStatus.ready&&mediaStatus.catalogApplied&&mediaStatus.persistedCatalogApplied!==false&&<p>Thar, XUV700 and Traveller photo links match the reviewed pack. Refresh the customer site and inspect all gallery angles.</p>}
     </div>}
     <label>Choose `mateshwari_fleet_photography_safe_pack.zip`
       <input type="file" accept=".zip,application/zip" onChange={e=>{
         setImportFile(e.target.files?.[0]||null);setConfirmImport(false);e.target.value='';
       }}/>
     </label>
     <label className="fleet-pack-confirm">
       <input type="checkbox" checked={confirmImport} onChange={e=>setConfirmImport(e.target.checked)}/>
       <span>Replace only the Thar, XUV700 and Tempo Traveller photographs and alternate angles with the reviewed pack. Keep all other vehicles, order, rates and visibility unchanged.</span>
     </label>
     <button type="button" disabled={!importFile||!confirmImport||importBusy||dirty} onClick={()=>void importFleetPhotos()}>
       <UploadCloud size={17}/> {importBusy?'Importing verified photos…':'Install and apply photo pack'}
     </button>
     {dirty&&<small>Save the current fleet sequence and other unsaved edits before importing photos.</small>}
     <small>Only the exact reviewed archive is accepted. Usage rights and remaining vehicle photos must be approved separately before public release.</small>
   </section>
   <div className="fleet-admin-grid">{vehicles.map((v,index)=><article className="fleet-editor" key={v.id||index}>
      <div className="fleet-editor-visual">{v.image?<img src={v.image} alt={v.name} loading="lazy"/>:<div><ImagePlus size={26}/> Upload a cover photo</div>}
       <span>{v.enabled?'Visible on website':'Hidden from website'}</span></div>
      <div className="fleet-editor-fields">
        <div className="fleet-order-controls" role="group" aria-label={'Display priority controls for '+v.name}>
          <span className="fleet-order-number" aria-label={'Position '+(index+1)}>#{String(index+1).padStart(2,'0')} <small>DISPLAY ORDER</small></span>
          <button type="button" disabled={index===0} aria-label={'Move '+v.name+' to first'} title="Move to first" onClick={()=>moveVehicle(index,0)}><ChevronsUp size={15}/> First</button>
          <button type="button" disabled={index===0} aria-label={'Move '+v.name+' up'} title="Move up" onClick={()=>moveVehicle(index,index-1)}><ArrowUp size={16}/> Up</button>
          <button type="button" disabled={index===vehicles.length-1} aria-label={'Move '+v.name+' down'} title="Move down" onClick={()=>moveVehicle(index,index+1)}><ArrowDown size={16}/> Down</button>
        </div>
        <label>Vehicle name<input value={v.name} maxLength={80} onChange={e=>change(index,{name:e.target.value})} placeholder="e.g. Toyota Fortuner"/></label>
        {newVehicle(v)&&<p className="fleet-new-tip">New vehicle · hidden until you add a cover photo, save and enable public visibility.</p>}
        <div className="fleet-editor-row">
          <label>Seats label
            <select value={seatLabels.includes(v.seats)?v.seats:'custom'} onChange={e=>{
              const seats=e.target.value;
              const count=seats==='12+1 / 17+1'?17:parseInt(seats.split('+')[0],10);
              change(index,{seats:seats==='custom'?'':seats,...(Number.isInteger(count)?{capacity:count}:{})});
            }}>
              {seatLabels.map(label=><option key={label} value={label}>{label}</option>)}<option value="custom">Custom seating label…</option>
            </select>
            {!seatLabels.includes(v.seats)&&<input aria-label="Custom seating label" value={v.seats} maxLength={30} placeholder="e.g. 13+1" onChange={e=>change(index,{seats:e.target.value})}/>}
          </label>
          <label>Passenger capacity (excluding driver)
            <select value={capacities.includes(v.capacity)?String(v.capacity):'custom'} onChange={e=>change(index,{capacity:e.target.value==='custom'?0:Number(e.target.value)})}>
              {capacities.map(count=><option value={count} key={count}>{count} passengers</option>)}<option value="custom">Other capacity…</option>
            </select>
            {!capacities.includes(v.capacity)&&<input aria-label="Custom passenger capacity" type="number" min={1} max={50} value={v.capacity||''} onChange={e=>change(index,{capacity:Number(e.target.value)})}/>}
          </label>
        </div>
        <div className="fleet-editor-row">
          <label>Vehicle category
            <select value={categories.includes(v.category)?v.category:'custom'} onChange={e=>change(index,{category:e.target.value==='custom'?'':e.target.value})}>
              {categories.map(category=><option key={category} value={category}>{category}</option>)}<option value="custom">Other category…</option>
            </select>
            {!categories.includes(v.category)&&<input aria-label="Custom vehicle category" maxLength={50} placeholder="Enter category" value={v.category} onChange={e=>change(index,{category:e.target.value})}/>}
          </label>
          <label>Short description
            <input list={'fleet-tag-'+index} value={v.tag} maxLength={80} placeholder="e.g. Premium family comfort" onChange={e=>change(index,{tag:e.target.value})}/>
            <datalist id={'fleet-tag-'+index}>{tagSuggestions.map(tag=><option key={tag} value={tag}/>)}</datalist>
            <small>Choose a suggestion or write your own customer-friendly description.</small>
          </label>
        </div>
        <div className="fleet-admin-media-workspace">
          <div className="fleet-admin-media-heading"><Images size={18}/><div><strong>Vehicle photography</strong><p>Upload a cover and up to five gallery angles. Every file is reviewed for registration numbers and publication rights, then stored on the server. No URL entry is needed.</p></div></div>
          <div className="fleet-cover-manager">
            <div className="fleet-media-section-title"><strong>Cover photo</strong><small>{v.image?photoSource(v.image):'Required before saving'}</small></div>
            <div className="fleet-cover-preview">
              {v.image?<img src={v.image} alt={'Current cover for '+(v.name||'new vehicle')} loading="lazy"/>:<div className="fleet-empty-photo"><ImagePlus size={24}/> No cover uploaded</div>}
            </div>
            <label className="fleet-photo-upload">
              <UploadCloud size={17}/> {v.image?'Replace cover photo':'Upload cover photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading!==null||!!editingPhoto} onChange={e=>{beginCoverUpload(index,e.target.files?.[0]);e.target.value='';}}/>
            </label>
            {!!v.image&&<button className="fleet-media-secondary" type="button" disabled={reviewingPhoto!==null||uploading!==null} onClick={()=>void reviewCurrentPhoto(index,v.image)}>Review existing cover / hide plates</button>}
          </div>
          <div className="fleet-gallery-manager">
            <div className="fleet-media-section-title"><strong>Additional gallery photos</strong><small>{(v.gallery||[]).length} / 5 angles</small></div>
            {(v.gallery||[]).length>0?<div className="fleet-gallery-list">
              {(v.gallery||[]).map((src,angleIndex)=><div className="fleet-gallery-item" key={src+'-'+angleIndex}>
                <img src={src} alt={'Angle '+(angleIndex+1)+' of '+(v.name||'vehicle')} loading="lazy"/>
                <div><strong>Angle {angleIndex+1}</strong><small>{photoSource(src)}</small>
                  <div className="fleet-gallery-actions">
                    <label className="fleet-media-secondary">Replace<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading!==null||!!editingPhoto} onChange={e=>{const file=e.target.files?.[0];if(file){photoQueue.current=[];setEditingPhoto({index,file,angleIndex});}e.target.value='';}}/></label>
                    <button type="button" disabled={reviewingPhoto!==null||uploading!==null} onClick={()=>void reviewCurrentPhoto(index,src,angleIndex)}>Review</button>
                    <button type="button" disabled={angleIndex===0} aria-label={'Move angle '+(angleIndex+1)+' earlier'} onClick={()=>{const a=[...(v.gallery||[])];[a[angleIndex-1],a[angleIndex]]=[a[angleIndex],a[angleIndex-1]];galleryChange(index,a);}}>←</button>
                    <button type="button" disabled={angleIndex===(v.gallery||[]).length-1} aria-label={'Move angle '+(angleIndex+1)+' later'} onClick={()=>{const a=[...(v.gallery||[])];[a[angleIndex+1],a[angleIndex]]=[a[angleIndex],a[angleIndex+1]];galleryChange(index,a);}}>→</button>
                    <button type="button" className="fleet-gallery-remove" onClick={()=>{if(window.confirm('Remove this gallery angle from the vehicle? The original stored file and other images are not deleted.'))galleryChange(index,(v.gallery||[]).filter((_,i)=>i!==angleIndex));}}>Remove</button>
                  </div>
                </div>
              </div>)}
            </div>:<p className="fleet-gallery-empty">No extra images yet. Add front, side, interior or rear views to help customers inspect the vehicle.</p>}
            <label className="fleet-photo-upload">
              <Images size={17}/> Add gallery photos · {(v.gallery||[]).length} of 5
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={(v.gallery||[]).length>=5||uploading!==null||!!editingPhoto} onChange={e=>{beginGalleryUpload(index,e.target.files);e.target.value='';}}/>
            </label>
            <small>You may select multiple photos at once. Each one opens for privacy review before being uploaded. The gallery is saved only when you press Save Changes.</small>
          </div>
          {uploading===index&&<p role="status" className="fleet-media-uploading">Uploading sanitized image to managed cloud media…</p>}
          {reviewingPhoto===index&&<p role="status">Loading existing image for review…</p>}
        </div>
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
          {newVehicle(v)?<button type="button" onClick={()=>{if(window.confirm('Discard this unsaved vehicle?')){setVehicles(current=>current.filter((_,i)=>i!==index));setDirty(true);setSuccess('');}}}><Trash2 size={14}/> Discard new vehicle</button>:
          <button type="button" disabled={!v.enabled} onClick={()=>change(index,{enabled:false})}><Trash2 size={14}/> Hide vehicle (keep record)</button>}
        </div>
      </div>
   </article>)}</div>
   <div className="fleet-admin-bottom">
     <button type="button" className="fleet-add" disabled={vehicles.length>=80} onClick={()=>{setVehicles(current=>[...current,blank()]);setDirty(true);setSuccess('');}}><Plus size={16}/> Add another vehicle</button>
     <button type="button" className="fleet-save" disabled={saving||uploading!==null||!!editingPhoto||importBusy} onClick={()=>void save()}><Save size={16}/> {saving?'Saving...':'Save fleet & pricing'}</button>
   </div>
   {editingPhoto&&<PhotoPrivacyEditor key={editingPhoto.file.name+editingPhoto.file.lastModified} file={editingPhoto.file} requireRights onCancel={cancelPhotoReview} onSaved={finishPhotoReview} onComplete={f=>uploadPhoto(editingPhoto.index,f,editingPhoto.angleIndex,editingPhoto.addToGallery)}/>}
   <p className="fleet-admin-note">Images uploaded through this panel are processed and stored in Netlify Blobs. Your computer is needed only to choose a file; after upload, public photo links and vehicle settings are served from the cloud. Save Changes commits vehicle details to Firestore. Existing remote reference images remain visible until replaced. Hiding a vehicle retains its record; backups are still necessary to protect against administrator deletion or service loss. Approve image rights and review every visible registration number before publishing.</p>
 </section>;
}
