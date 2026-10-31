# Mateshwari Travellers — Safe Netlify architecture and launch checklist

## Current architecture (verified in source)
- **Storefront:** React 19 + Vite. Netlify serves the built `dist/` static frontend.
- **CRM:** `server/crm.mjs` is a **persistent Node HTTP server**, bound to `127.0.0.1:8787` by default. It currently writes enquiries, engagement events, media and catalog updates to local filesystem paths under `.data/`.
- **Admin:** React route `/admin`, served by the same frontend, calls the CRM `/api/admin/*` endpoints; admin API requires `CRM_ADMIN_TOKEN`.
- **Quotations:** browser sends `POST /api/enquiries` — customers must get real persistence, not a simulated success.

## Hosting decisions
1. Netlify can safely host the **frontend**, but not the existing disk-backed CRM process unchanged. **Do not deploy frontend-only as a completed booking website.**
2. Before public release, move CRM to a continuously running, properly secured Node host **with persistent storage** or migrate the storage layer to a reliable database/object store. Provision backup/restore, monitoring and retention. Avoid ephemeral instance disks.
3. Use an HTTPS CRM origin distinct from the Netlify URL. Netlify `/api/*` requests proxy to this origin through `dist/_redirects`. Set `MT_CRM_API_ORIGIN` in Netlify build environment; configure the backend to listen on a suitable server interface behind TLS/reverse proxy. Do not publish the CRM admin token in Vite `VITE_*` env vars.
4. Set `VITE_PUBLIC_SITE_ORIGIN` to the **actual** Netlify hostname (later update to the purchased .com domain and rebuild). Build: `npm run build:netlify`. Missing or malformed origins fail the build intentionally.
5. Netlify `netlify.toml` uses Node 22, publishes `dist`, and adds security headers. Build emits `_redirects`, `sitemap.xml`, `robots.txt` when correctly configured.
6. Restrict admin through authenticated backend authorization. A client-only hidden route, robots exclusion or noindex is **not** access control.
7. Confirm trusted domains, rate limits, input validation, upload size/type, CORS/CSRF behavior if cookies are used, notification secrets and abuse handling. Audit the persistence and auth paths before public availability.

## Release gates
- CRM `GET /api/health` returns `ok: true`, with `adminConfigured: true` when admin access is intended; confirm durable storage rather than `storage: local` before production.
- `GET /api/catalog` returns correct fleet and approved photos.
- `POST /api/enquiries` tested with **synthetic** user data: successful submission persisted, displayed in authenticated Admin, status update verified, and persistence survives backend restart.
- Unauthorized `/api/admin/*` request rejected; wrong token rejected; authorized access tested without leaking token.
- Uploads survive restart and deployment; backup and restore rehearsed.
- Netlify live URL serves homepage and direct `/stories` and journey routes; `/api/*` never falls back to HTML.
- Confirm pricing and vehicle image licences, Google Search Console indexing, mobile accessibility, page performance, and actual-device QA.
- Separate approval required to merge, deploy, change production CRM records or switch a custom domain.

## Open-source dependency discipline
Prefer existing tested React, Vite, Playwright, Node and browser APIs over adding speculative third-party widgets or heavy SEO plugins. Review licence, activity, security advisories, bundle size and maintenance before introducing packages. GitHub popularity alone is not evidence that a library fits this project.

## Netlify release configuration
Netlify environment settings (build-time, no secrets committed):
```text
VITE_PUBLIC_SITE_ORIGIN=https://<real-netlify-site>.netlify.app
MT_CRM_API_ORIGIN=https://<separately-deployed-persistent-crm-host>
```
These are **examples**, not addresses to copy literally. Do not set a fake origin just to bypass the build guard.

**Current decision:** frontend is configurable for Netlify; backend hosting/data durability and real end-to-end booking must be verified first. No public deploy authorization is implied by this document.
