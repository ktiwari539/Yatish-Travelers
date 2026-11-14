import { ApiError, plain } from "./repository.mjs";

const defaults = Object.freeze({
  brand: { name: "", tagline: "", bannerTitle: "", bannerText: "", logoUrl: "" },
  stories: [],
  ambassadors: [],
  testimonials: [],
});

const string = (value, max) => {
  if (typeof value !== "string" || value.length > max * 2) throw new ApiError("INVALID_SITE_CONTENT", 422);
  return value.trim().slice(0, max);
};
// Images must be uploaded to this site's managed media store or bundled with the
// website. Arbitrary remote URLs and javascript/data schemes are not published.
const image = (value) => {
  const path = string(value ?? "", 256);
  if (path && !/^\/(?:api\/uploads\/[a-zA-Z0-9_-]{8,100}\.webp|media\/[a-zA-Z0-9_-]{1,100}\.webp)$/.test(path))
    throw new ApiError("INVALID_CONTENT_IMAGE", 422);
  return path;
};
const items = (value, max, validator) => {
  if (!Array.isArray(value) || value.length > max) throw new ApiError("INVALID_SITE_CONTENT", 422);
  return value.map(validator);
};
export function normalizeSiteContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError("INVALID_SITE_CONTENT", 422);
  const brand = value.brand || {};
  if (!brand || typeof brand !== "object" || Array.isArray(brand))
    throw new ApiError("INVALID_SITE_CONTENT", 422);
  const safe = {
    brand: {
      name: string(brand.name ?? "", 70),
      tagline: string(brand.tagline ?? "", 150),
      bannerTitle: string(brand.bannerTitle ?? "", 130),
      bannerText: string(brand.bannerText ?? "", 400),
      logoUrl: image(brand.logoUrl),
    },
    stories: items(value.stories ?? [], 8, (v) => ({
      title: string(v?.title ?? "", 100),
      text: string(v?.text ?? "", 1500),
      imageUrl: image(v?.imageUrl),
    })),
    ambassadors: items(value.ambassadors ?? [], 8, (v) => ({
      name: string(v?.name ?? "", 90),
      description: string(v?.description ?? "", 350),
      imageUrl: image(v?.imageUrl),
    })),
    testimonials: items(value.testimonials ?? [], 12, (v) => {
      if (v?.consentConfirmed !== true) throw new ApiError("TESTIMONIAL_CONSENT_REQUIRED", 422);
      return {
        name: string(v.name ?? "", 90),
        quote: string(v.quote ?? "", 500),
        consentConfirmed: true,
      };
    }),
  };
  return safe;
}

export function createSiteContentStore(db, timestamp) {
  const doc = db.collection("mt_crm").doc("site_content");
  const control = db.collection("mt_crm").doc("control");
  const initial = () => ({
    kind: "siteContent",
    version: 0,
    publishedVersion: 0,
    draft: defaults,
    published: defaults,
    updatedAt: null,
    publishedAt: null,
  });
  const read = (data) => ({ ...initial(), ...(data || {}) });
  const check = (expected, actual) => {
    if (!Number.isInteger(expected) || expected !== actual)
      throw new ApiError("VERSION_CONFLICT_RELOAD", 409);
  };
  return {
    async readAdmin() {
      return plain(read((await doc.get()).data()));
    },
    async readPublic() {
      const current = read((await doc.get()).data());
      // No draft, unpublished testimonials or internal timestamps in public response.
      return { content: plain(current.published), publishedVersion: current.publishedVersion };
    },
    async saveDraft(input) {
      const draft = normalizeSiteContent(input.content);
      return db.runTransaction(async (tx) => {
        const state = (await tx.get(control)).data();
        const current = read((await tx.get(doc)).data());
        if (state?.maintenance) throw new ApiError("MAINTENANCE", 503);
        check(input.expectedVersion, current.version);
        const next = { ...current, draft, version: current.version + 1, updatedAt: timestamp() };
        tx.set(doc, next);
        return plain(next);
      });
    },
    async publish(input) {
      return db.runTransaction(async (tx) => {
        const state = (await tx.get(control)).data();
        const current = read((await tx.get(doc)).data());
        if (state?.maintenance) throw new ApiError("MAINTENANCE", 503);
        check(input.expectedVersion, current.version);
        const next = {
          ...current,
          version: current.version + 1,
          publishedVersion: current.publishedVersion + 1,
          published: normalizeSiteContent(current.draft),
          publishedAt: timestamp(),
          updatedAt: timestamp(),
        };
        tx.set(doc, next);
        return plain(next);
      });
    },
  };
}
