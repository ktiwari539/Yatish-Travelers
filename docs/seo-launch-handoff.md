# Mateshwari Travellers — SEO launch handoff

## Implemented in review branch
- Public route-specific title, description, social metadata, canonical URL when configured, and explicit noindex metadata for private/unknown routes.
- Existing index.html includes Organization JSON-LD with published phone/email, site-name, OG and image preview rules.
- robots.txt allows the public site and excludes admin/dashboard/API crawl paths.
- `npm run build` produces `dist/sitemap.xml` and appends `Sitemap:` to `dist/robots.txt` **only when** `VITE_PUBLIC_SITE_ORIGIN` is a valid HTTPS origin.
- Five public URL entries: /, /stories, /journeys/mountain-roads, /journeys/sunset-drive, /journeys/green-adventure.

## Before launch
1. Confirm the real production domain and hosting destination (do not use localhost as a canonical). Set `VITE_PUBLIC_SITE_ORIGIN=https://your-real-domain` in the production build environment. Run `npm run build`; inspect `dist/sitemap.xml` and `dist/robots.txt`.
2. Confirm physical city/region, business name and verified public address/Google Business Profile if applicable **before** adding LocalBusiness/location fields. Do not claim service coverage or local ranking in an unverified area.
3. Confirm distinct production pages return proper HTTP status codes, especially admin and unknown URLs. A Vite SPA fallback may serve 200 for unknown routes; adjust hosting rewrites or prerendering.
4. Confirm crawlers receive useful content for the homepage, stories, and adventure routes. This app is primarily client-rendered; Google may render JS, but server prerender/SSR is preferable for immediate HTML discoverability. Don't assume social link unfurlers execute JS.
5. Use Google Search Console: verify property, submit /sitemap.xml, inspect public URLs, request indexing, and monitor indexing and Core Web Vitals. Indexing and rankings cannot be guaranteed.
6. Validate mobile performance, images, contact info, and quotation actions on deployed HTTPS site; ensure the CRM API endpoint and environment are configured securely.

## Local verification
```bash
git checkout feature/mateshwari-cinematic-crm
git pull --ff-only origin feature/mateshwari-cinematic-crm
npm install
npm run build
# Once your actual domain is decided:
VITE_PUBLIC_SITE_ORIGIN=https://YOUR-ACTUAL-DOMAIN npm run build
cat dist/sitemap.xml
cat dist/robots.txt
```
Note: Vite embeds client-side `VITE_PUBLIC_SITE_ORIGIN` at build time. If your production hostname changes, rebuild.

## Safety
No automatic deployment, merge, production CRM writes, invented reviews, or fabricated LocalBusiness address.
