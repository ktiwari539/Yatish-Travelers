/**
 * Verified per-model photographic turntables only.
 *
 * No model is registered until its own matching 24–72 image sequence has
 * been independently reviewed, licensed and permanently plate-redacted.
 * A 2–3-image gallery is NEVER expanded or interpolated into fake 360° views.
 *
 * To enable one later: put the ORIGINAL approved frame files under
 * /media/360/<model-slug>/ and explicitly add their paths to this registry
 * in a reviewed commit. No staff catalog or live upload is mutated here.
 */
export type VerifiedTurntable={
  model:string;
  frames:readonly string[];
  evidenceId:string; // internal photo/rights/plate review record
};
const approved:Readonly<Record<string,VerifiedTurntable>>=Object.freeze({});
export function verifiedTurntableFor(model:string):VerifiedTurntable|null{
 const asset=approved[model];
 if(!asset||asset.model!==model||!asset.evidenceId.trim())return null;
 if(asset.frames.length<24||asset.frames.length>72)return null;
 const slug=model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const prefix='/media/360/'+slug+'/';
 if(new Set(asset.frames).size!==asset.frames.length)return null;
 if(asset.frames.some(src=>!src.startsWith(prefix)||!/\.webp$/.test(src)||src.includes('..')))return null;
 return asset;
}
