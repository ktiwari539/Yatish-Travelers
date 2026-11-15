import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./crmApi";
import { ImagePlus, ImageOff, LayoutTemplate, ShieldCheck } from "lucide-react";
import { blankSiteMedia, blankSiteVisibility, safeSiteImagePath, siteMediaSlots, siteVisibilitySections,
  type SiteMediaSlot, type SiteMediaPlacement, type SiteVisibilitySection } from "./siteMediaSlots";

export type SiteContent = {
  brand: { name: string; tagline: string; bannerTitle: string; bannerText: string; logoUrl: string };
  stories: Array<{ title: string; text: string; imageUrl: string }>;
  ambassadors: Array<{ name: string; description: string; imageUrl: string }>;
  testimonials: Array<{ name: string; quote: string; consentConfirmed: boolean }>;
  media: Record<SiteMediaSlot, SiteMediaPlacement>;
  visibility: Record<SiteVisibilitySection, boolean>;
};

const blank: SiteContent = {
  brand: { name: "", tagline: "", bannerTitle: "", bannerText: "", logoUrl: "" },
  stories: [],
  ambassadors: [],
  testimonials: [],
  media: blankSiteMedia(),
  visibility: blankSiteVisibility(),
};

function withDefaults(value: Partial<SiteContent>): SiteContent {
  return {
    ...blank, ...value,
    brand: { ...blank.brand, ...value.brand },
    stories: Array.isArray(value.stories) ? value.stories : [],
    ambassadors: Array.isArray(value.ambassadors) ? value.ambassadors : [],
    testimonials: Array.isArray(value.testimonials) ? value.testimonials : [],
    media: { ...blankSiteMedia(), ...value.media },
    visibility: { ...blankSiteVisibility(), ...value.visibility },
  };
}

export function usePublishedSiteContent() {
  const [published, setPublished] = useState<SiteContent>(blank);
  useEffect(() => {
    let active = true;
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((v) => { if (active && v.content) setPublished(withDefaults(v.content as Partial<SiteContent>)); })
      .catch(() => { /* Existing editorial remains visible if the API is unavailable. */ });
    return () => { active = false; };
  }, []);
  return published;
}

function ContentImageControl({ label, hint, url, defaultUrl, alt, token, disabled, onChange, onAltChange, onClear, onUploadChange }: {
  label: string; hint: string; url: string; defaultUrl?: string; alt?: string; token: string; disabled: boolean;
  onChange: (url: string) => void; onAltChange?: (alt: string) => void; onClear: () => void;
  onUploadChange?: (active: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const upload = async () => {
    if (!file || !reviewed || disabled) return;
    if (file.size > 3_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPG, PNG or WebP image smaller than 3 MB.'); return;
    }
    setUploading(true); onUploadChange?.(true); setError(''); setNotice('');
    try {
      const encoded = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(Error('Could not read the selected image'));
        reader.readAsDataURL(file);
      });
      const response = await adminFetch('/api/admin/images', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mime: file.type, data: encoded }),
      });
      const body = await response.json();
      if (!response.ok || !safeSiteImagePath(body.url || '')) throw Error(body.error || 'Image upload failed');
      onChange(body.url);
      setNotice('Photo securely uploaded. Save private draft, review it, then publish when approved.');
      setFile(null); setReviewed(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload image'); }
    finally { setUploading(false); onUploadChange?.(false); }
  };
  return <div className="crm-content-image-control">
    <div className="crm-content-image-preview">{safeSiteImagePath(url) ? <img src={url} alt="Selected website placement preview" loading="lazy" /> : defaultUrl ? <img src={defaultUrl} alt="Current default placement preview" loading="lazy" /> : <span><ImageOff size={24} aria-hidden="true"/> Default website image / no override</span>}</div>
    <div className="crm-content-image-fields">
      <strong>{label}</strong><small>{hint}</small>
      <label>Approved image path<input type="text" maxLength={256} value={url} placeholder="/api/uploads/…webp or /media/…webp" disabled={disabled || uploading} onChange={(e) => onChange(e.target.value)} /></label>
      {onAltChange && <label>Accessible image description<input maxLength={180} value={alt || ''} placeholder="Describe what is actually visible in this photo" disabled={disabled || uploading} onChange={(e) => onAltChange(e.target.value)} /></label>}
      <label>Upload a replacement from your computer<input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || uploading} onChange={(e) => { setFile(e.target.files?.[0] || null); setReviewed(false); setNotice(''); setError(''); }} /></label>
      {file && <label className="crm-content-review"><input type="checkbox" checked={reviewed} disabled={disabled || uploading} onChange={(e) => setReviewed(e.target.checked)} /> I confirm publication rights and have checked for visible plates, faces and private information.</label>}
      <div className="crm-content-image-actions"><button type="button" disabled={!file || !reviewed || disabled || uploading} onClick={() => void upload()}><ImagePlus size={15} aria-hidden="true"/>{uploading ? 'Uploading…' : 'Upload reviewed photo'}</button><button type="button" className="crm-content-reset" disabled={disabled || uploading || !url} onClick={() => { onClear(); setFile(null); setNotice(''); }}>Use default image</button></div>
      {error && <small role="alert" className="crm-error">{error}</small>}{notice && <small role="status" className="crm-content-upload-ok">{notice}</small>}
    </div>
  </div>;
}

export function SiteContentManager({ token }: { token: string }) {
  const [draft, setDraft] = useState<SiteContent>(blank);
  const [saved, setSaved] = useState<SiteContent>(blank);
  const [version, setVersion] = useState(0);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await adminFetch("/api/admin/site-content", { headers: { Authorization: "Bearer " + token } });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || "Unable to load content");
      setDraft(withDefaults(value.draft as Partial<SiteContent>));
      setSaved(withDefaults(value.draft as Partial<SiteContent>));
      setVersion(value.version);
      setPublishedVersion(value.publishedVersion);
      setNotice("");
    } catch (e) { setError(e instanceof Error ? e.message : "Content unavailable"); }
    finally { setBusy(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const uploadChanged = (active: boolean) => setActiveUploads(count => Math.max(0, count + (active ? 1 : -1)));
  const updateBrand = (field: keyof SiteContent["brand"], value: string) =>
    setDraft((v) => ({ ...v, brand: { ...v.brand, [field]: value } }));
  const updateMedia = (id: SiteMediaSlot, field: keyof SiteMediaPlacement, value: string) =>
    setDraft((v) => ({ ...v, media: { ...v.media, [id]: { ...v.media[id], [field]: value } } }));
  const updateVisibility = (id: SiteVisibilitySection, value: boolean) =>
    setDraft((v) => ({ ...v, visibility: { ...v.visibility, [id]: value } }));
  const updateRow = <K extends "stories" | "ambassadors" | "testimonials">(
    group: K, index: number, field: string, value: string | boolean,
  ) => setDraft((v) => ({
    ...v,
    [group]: v[group].map((row, i) => i === index ? { ...row, [field]: value } : row),
  }));
  const removeRow = (group: "stories" | "ambassadors" | "testimonials", index: number) =>
    setDraft((v) => ({ ...v, [group]: v[group].filter((_, i) => i !== index) }));
  const addRow = (group: "stories" | "ambassadors" | "testimonials") =>
    setDraft((v) => ({
      ...v,
      [group]: [...v[group], group === "stories"
        ? { title: "", text: "", imageUrl: "" }
        : group === "ambassadors"
          ? { name: "", description: "", imageUrl: "" }
          : { name: "", quote: "", consentConfirmed: false }],
    }));
  const save = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await adminFetch("/api/admin/site-content", {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version, content: draft }),
      });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || "Draft not saved");
      setVersion(value.version); setSaved(withDefaults(value.draft)); setDraft(withDefaults(value.draft));
      setNotice("Private draft saved. Visitors still see the last published version.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(false); }
  };
  const publish = async () => {
    if (dirty || !window.confirm("Publish the saved content to the public website?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await adminFetch("/api/admin/site-content/publish", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: version }),
      });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || "Publish failed");
      setVersion(value.version); setPublishedVersion(value.publishedVersion);
      setNotice("Published. Visitors will see this content on their next page load.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally { setBusy(false); }
  };

  return <section className="crm-content-manager" aria-label="Website publishing">
    <div className="crm-heading">
      <div><span className="crm-eyebrow">WEBSITE / VISUAL PUBLISHING</span><h1>Website studio</h1>
        <p>Choose the photos for each website placement, control visible sections, edit stories and branding. Changes stay in a private draft until staff publish.</p></div>
      <button className="crm-refresh" onClick={() => void load()} disabled={busy} type="button">Reload from server</button>
    </div>
    <p role="status">Draft revision {version} · Published revision {publishedVersion}{dirty ? " · Unsaved edits" : ""}</p>
    {error && <p role="alert" className="crm-error">{error}{error === "VERSION_CONFLICT_RELOAD" ? " Reload to review another Admin's changes." : ""}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="crm-content-guide"><LayoutTemplate size={23} aria-hidden="true"/><div><strong>How image placement works</strong><p>Pick a section below, select an approved photo, check its rights and privacy, upload it, then save your draft. You can preview each selected image before publishing. Homepage hero vehicle photographs and fleet ordering are controlled separately under <b>Cars & pricing</b>.</p></div></div>
    <div className="crm-content-fields">
      <fieldset className="crm-content-visibility"><legend>Section visibility · Choose what appears</legend>
        <p>Turning a section off hides it from visitors after publishing; content and photos are kept for later reuse.</p>
        <div className="crm-content-visibility-grid">{siteVisibilitySections.map(section => <label key={section.id} className="crm-content-visibility-option"><input type="checkbox" disabled={busy || activeUploads>0} checked={draft.visibility[section.id] !== false} onChange={(e) => updateVisibility(section.id, e.target.checked)}/><span><strong>{section.label}</strong><small>{section.description}</small></span></label>)}</div>
      </fieldset>
      <fieldset className="crm-content-media-slots"><legend>Image placement · Homepage, stories and journeys</legend>
        <p>Each photo is linked to one named position. Uploaded photos are processed by the secure image service and stored in the existing project.</p>
        {Array.from(new Set(siteMediaSlots.map(slot => slot.section))).map(section => <div className="crm-content-slot-group" key={section}>
          <h2>{section}</h2><div className="crm-content-slot-grid">{siteMediaSlots.filter(slot => slot.section === section).map(slot =>
            <ContentImageControl key={slot.id} label={slot.label} hint={slot.tip} defaultUrl={slot.defaultUrl} token={token} disabled={busy} onUploadChange={uploadChanged} url={draft.media[slot.id].imageUrl} alt={draft.media[slot.id].alt}
              onChange={(value) => updateMedia(slot.id, 'imageUrl', value)} onAltChange={(value) => updateMedia(slot.id, 'alt', value)}
              onClear={() => setDraft(v => ({...v, media: {...v.media, [slot.id]: {imageUrl:'',alt:''}}}))}/>)}</div>
        </div>)}
      </fieldset>
      <fieldset><legend>Brand and homepage banner</legend>
        <label>Brand name<input maxLength={70} value={draft.brand.name} onChange={(e) => updateBrand("name", e.target.value)} /></label>
        <label>Tagline<input maxLength={150} value={draft.brand.tagline} onChange={(e) => updateBrand("tagline", e.target.value)} /></label>
        <label>Banner heading<input maxLength={130} value={draft.brand.bannerTitle} onChange={(e) => updateBrand("bannerTitle", e.target.value)} /></label>
        <label>Banner description<textarea maxLength={400} rows={3} value={draft.brand.bannerText} onChange={(e) => updateBrand("bannerText", e.target.value)} /></label>
        <ContentImageControl label="Brand logo" hint="Displayed beside the business name in the public navigation." token={token} disabled={busy} onUploadChange={uploadChanged} url={draft.brand.logoUrl} onChange={(value) => updateBrand('logoUrl',value)} onClear={() => updateBrand('logoUrl','')}/>
      </fieldset>
      <fieldset><legend>Travel stories ({draft.stories.length}/8)</legend>
        {draft.stories.map((story, i) => <div key={i} className="crm-content-row">
          <label>Title<input maxLength={100} value={story.title} onChange={(e) => updateRow("stories", i, "title", e.target.value)} /></label>
          <label>Story<textarea rows={3} maxLength={1500} value={story.text} onChange={(e) => updateRow("stories", i, "text", e.target.value)} /></label>
          <ContentImageControl label={'Story '+(i+1)+' photo'} hint="Appears with this published travel story on the Stories page." token={token} disabled={busy} onUploadChange={uploadChanged} url={story.imageUrl} onChange={(value) => updateRow('stories',i,'imageUrl',value)} onClear={() => updateRow('stories',i,'imageUrl','')}/>
          <button type="button" onClick={() => removeRow("stories", i)}>Remove story</button>
        </div>)}
        <button type="button" disabled={draft.stories.length >= 8} onClick={() => addRow("stories")}>Add story</button>
      </fieldset>
      <fieldset><legend>Ambassadors ({draft.ambassadors.length}/8)</legend>
        {draft.ambassadors.map((person, i) => <div key={i} className="crm-content-row">
          <label>Name<input maxLength={90} value={person.name} onChange={(e) => updateRow("ambassadors", i, "name", e.target.value)} /></label>
          <label>Description<textarea rows={2} maxLength={350} value={person.description} onChange={(e) => updateRow("ambassadors", i, "description", e.target.value)} /></label>
          <ContentImageControl label={'Ambassador '+(i+1)+' photo'} hint="Use only a portrait approved by the person depicted." token={token} disabled={busy} onUploadChange={uploadChanged} url={person.imageUrl} onChange={(value) => updateRow('ambassadors',i,'imageUrl',value)} onClear={() => updateRow('ambassadors',i,'imageUrl','')}/>
          <button type="button" onClick={() => removeRow("ambassadors", i)}>Remove ambassador</button>
        </div>)}
        <button type="button" disabled={draft.ambassadors.length >= 8} onClick={() => addRow("ambassadors")}>Add ambassador</button>
      </fieldset>
      <fieldset><legend>Customer testimonials ({draft.testimonials.length}/12)</legend>
        {draft.testimonials.map((review, i) => <div key={i} className="crm-content-row">
          <label>Customer display name<input maxLength={90} value={review.name} onChange={(e) => updateRow("testimonials", i, "name", e.target.value)} /></label>
          <label>Approved quote<textarea rows={2} maxLength={500} value={review.quote} onChange={(e) => updateRow("testimonials", i, "quote", e.target.value)} /></label>
          <label><input type="checkbox" checked={review.consentConfirmed} onChange={(e) => updateRow("testimonials", i, "consentConfirmed", e.target.checked)} /> Publication consent has been obtained</label>
          <button type="button" onClick={() => removeRow("testimonials", i)}>Remove testimonial</button>
        </div>)}
        <button type="button" disabled={draft.testimonials.length >= 12} onClick={() => addRow("testimonials")}>Add testimonial</button>
      </fieldset>
    </div>
    <div className="crm-content-actions">
      <button type="button" onClick={() => void save()} disabled={busy || activeUploads>0 || !dirty}>Save private draft</button>
      <button type="button" onClick={() => void publish()} disabled={busy || activeUploads>0 || dirty || version === 0}>Publish saved draft</button>
    </div>
    <p className="crm-content-publication-note"><ShieldCheck size={16} aria-hidden="true"/><small>Upload alone never publishes a placement. Save and publish are separate authorized steps. Keep photos rights-cleared and privacy-reviewed. Fleet images have separate controls under Cars & pricing; this action does not send customer notifications.</small></p>
  </section>;
}
