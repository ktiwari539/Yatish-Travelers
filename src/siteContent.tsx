import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./crmApi";

export type SiteContent = {
  brand: { name: string; tagline: string; bannerTitle: string; bannerText: string; logoUrl: string };
  stories: Array<{ title: string; text: string; imageUrl: string }>;
  ambassadors: Array<{ name: string; description: string; imageUrl: string }>;
  testimonials: Array<{ name: string; quote: string; consentConfirmed: boolean }>;
};

const blank: SiteContent = {
  brand: { name: "", tagline: "", bannerTitle: "", bannerText: "", logoUrl: "" },
  stories: [],
  ambassadors: [],
  testimonials: [],
};

export function usePublishedSiteContent() {
  const [published, setPublished] = useState<SiteContent>(blank);
  useEffect(() => {
    let active = true;
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((v) => { if (active && v.content) setPublished(v.content as SiteContent); })
      .catch(() => { /* Existing editorial remains visible if the API is unavailable. */ });
    return () => { active = false; };
  }, []);
  return published;
}

export function SiteContentManager({ token }: { token: string }) {
  const [draft, setDraft] = useState<SiteContent>(blank);
  const [saved, setSaved] = useState<SiteContent>(blank);
  const [version, setVersion] = useState(0);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await adminFetch("/api/admin/site-content", { headers: { Authorization: "Bearer " + token } });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || "Unable to load content");
      setDraft(value.draft as SiteContent);
      setSaved(value.draft as SiteContent);
      setVersion(value.version);
      setPublishedVersion(value.publishedVersion);
      setNotice("");
    } catch (e) { setError(e instanceof Error ? e.message : "Content unavailable"); }
    finally { setBusy(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const updateBrand = (field: keyof SiteContent["brand"], value: string) =>
    setDraft((v) => ({ ...v, brand: { ...v.brand, [field]: value } }));
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
      setVersion(value.version); setSaved(value.draft); setDraft(value.draft);
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
      <div><span className="crm-eyebrow">WEBSITE / PUBLISHING</span><h1>Stories, branding and ambassadors.</h1>
        <p>Edit privately, save a draft, then publish explicitly. Public visitors cannot see drafts.</p></div>
      <button className="crm-refresh" onClick={() => void load()} disabled={busy} type="button">Reload from server</button>
    </div>
    <p role="status">Draft revision {version} · Published revision {publishedVersion}{dirty ? " · Unsaved edits" : ""}</p>
    {error && <p role="alert" className="crm-error">{error}{error === "VERSION_CONFLICT_RELOAD" ? " Reload to review another Admin's changes." : ""}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="crm-content-fields">
      <fieldset><legend>Brand and homepage banner</legend>
        <label>Brand name<input maxLength={70} value={draft.brand.name} onChange={(e) => updateBrand("name", e.target.value)} /></label>
        <label>Tagline<input maxLength={150} value={draft.brand.tagline} onChange={(e) => updateBrand("tagline", e.target.value)} /></label>
        <label>Banner heading<input maxLength={130} value={draft.brand.bannerTitle} onChange={(e) => updateBrand("bannerTitle", e.target.value)} /></label>
        <label>Banner description<textarea maxLength={400} rows={3} value={draft.brand.bannerText} onChange={(e) => updateBrand("bannerText", e.target.value)} /></label>
        <label>Logo image path<input maxLength={256} placeholder="/media/your-approved-logo.webp" value={draft.brand.logoUrl} onChange={(e) => updateBrand("logoUrl", e.target.value)} /></label>
      </fieldset>
      <fieldset><legend>Travel stories ({draft.stories.length}/8)</legend>
        {draft.stories.map((story, i) => <div key={i} className="crm-content-row">
          <label>Title<input maxLength={100} value={story.title} onChange={(e) => updateRow("stories", i, "title", e.target.value)} /></label>
          <label>Story<textarea rows={3} maxLength={1500} value={story.text} onChange={(e) => updateRow("stories", i, "text", e.target.value)} /></label>
          <label>Approved image path<input maxLength={256} value={story.imageUrl} onChange={(e) => updateRow("stories", i, "imageUrl", e.target.value)} /></label>
          <button type="button" onClick={() => removeRow("stories", i)}>Remove story</button>
        </div>)}
        <button type="button" disabled={draft.stories.length >= 8} onClick={() => addRow("stories")}>Add story</button>
      </fieldset>
      <fieldset><legend>Ambassadors ({draft.ambassadors.length}/8)</legend>
        {draft.ambassadors.map((person, i) => <div key={i} className="crm-content-row">
          <label>Name<input maxLength={90} value={person.name} onChange={(e) => updateRow("ambassadors", i, "name", e.target.value)} /></label>
          <label>Description<textarea rows={2} maxLength={350} value={person.description} onChange={(e) => updateRow("ambassadors", i, "description", e.target.value)} /></label>
          <label>Approved image path<input maxLength={256} value={person.imageUrl} onChange={(e) => updateRow("ambassadors", i, "imageUrl", e.target.value)} /></label>
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
      <button type="button" onClick={() => void save()} disabled={busy || !dirty}>Save private draft</button>
      <button type="button" onClick={() => void publish()} disabled={busy || dirty || version === 0}>Publish saved draft</button>
    </div>
    <p><small>Use only media you have rights to publish. Existing fleet media can be managed under Cars & pricing. Publication is not an automatic notification.</small></p>
  </section>;
}
