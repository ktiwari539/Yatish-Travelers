# Mateshwari Travellers — release evidence, 1 November 2026 (IST)

**Decision: NO-GO for public release.** Code is prepared on `feature/mateshwari-cinematic-crm`; infrastructure and owner gates below are not complete. No merge, public deploy, production data modification, or live notification activation was performed.

## Verified starting point and changes

Audited actual checkout `4c4bc364c0c497a3e13cc560b377b2fc3b8267a1`, not just prior reports. React/Vite storefront and Admin use a Node HTTP API with filesystem journals, atomic catalog updates and local uploads. Netlify cannot run that persistent process as a static website.

Selected architecture: **Netlify static frontend + one Node 22 CRM container behind HTTPS, with two persistent volumes** (`/data` and `/app/public/media`). This is durable-storage architecture rather than a database migration; it preserves existing CRM/catalog/upload/import/quotation features and avoids a rushed rewrite. It requires a host that guarantees persistence across container replacement. It is single-instance, not a distributed or high-availability database. Node's synchronous journal access fits a small initial operation; load-test before scaling and migrate to transactional SQL/object storage if volume grows.

- Added Docker/Compose deployment definition, loopback-only published backend port, non-root container, resource limit, health check and graceful shutdown.
- Production startup rejects weak Admin tokens, missing/outside storage paths, symlink escapes and corrupt journals. Disk writes flush before acknowledging them. The health field identifies configured storage; it does **not** prove a host has mounted durable disks.
- Offline backup/restore covers records, quotations/status events, notification history, engagement, catalog, image/model uploads and separately imported reviewed media. Restore checks file inventory and SHA-256 before writing; refuses nonempty destinations. Tampered snapshot regression executed.
- Admin token remains an operator-entered bearer credential held in memory; removed sessionStorage persistence and clears legacy stored tokens. No token was added to bundles/config/logs. Client-prefixed secret-like environment names fail the build. Backend errors log no request bodies or credentials. Failed sign-ins are rate limited.
- Notifications run concurrently (10-second provider timeouts) so three sequential calls cannot exceed Netlify's 26-second proxy window. Preview mode remains the default. Statuses distinguish provider acceptance from delivery. There is no automatic durable retry worker: staff must monitor failed/pending items; do not promise guaranteed delivery.
- Real calendar validation and finite numeric validation added; client-supplied prices are ignored. Known enabled vehicle estimates are calculated on server. UTF-8 request parsing and byte limits fixed.
- Netlify API proxy precedes public routes; reviewed fleet media has explicit backend proxy paths so Admin imports are visible without rebuilding the frontend. Public pages have separate generated metadata/canonicals; unknown paths return 404. Admin HTML and JSON APIs carry noindex; preview builds block indexing. Robots is not authorization.
- Existing Organization schema retained without invented location, reviews, ratings or other business details. Owner must approve the existing contact details/languages before publishing. Added text/link fallback for JavaScript-disabled crawlers; this is not full React SSR and complete page content still relies on JavaScript rendering.
- Quote dialog now traps keyboard focus, restores opener focus and locks background scrolling. Accepted styling and 360-degree behavior were not redesigned.
- Lockfile added; CI uses npm ci and covers feature-branch pushes. No new production package added.

## Executed evidence

| Check | Result / scope |
| --- | --- |
| API, catalog, media integrity, production guard, restart/restore, routing/SEO, public secret guard | 12 tests passed with `npm run test:api`; see branch CI for remote result |
| Synthetic lifecycle | Created enquiry; rejected missing/wrong authentication; quoted; changed to confirmed; retrieved after process restart; verified uploaded bytes and catalog prices; restored into new directories and retrieved same record/quotation/status/outbox |
| Provider behaviour | Preview only, using `example.invalid` email and synthetic phone; no real email/WhatsApp delivery tested |
| TypeScript + Netlify build | Executed using reserved `.example` fixture origins, not a claimed deployment |
| npm audit | Executed, zero reported vulnerabilities for locked dependencies; advisory database is time dependent |
| Visual QA | Cloud Chromium desktop storefront and quotation screenshots inspected; dialog Shift+Tab/Tab wrap and Escape verified |
| Media | Existing complete pack found and SHA-256 installed locally: 14 assets. Not committed or approved for publication. CI's synthetic frames only test mechanics, not photo quality or rights |
| GitHub CI | Verify exact head via PR #1 Actions checks. Baseline run 41231289628 passed; that is not evidence for new changes. Final run URLs/status are supplied in delivery message |
| Container / live host | Docker unavailable in this workspace; image build, real volume persistence, ingress/TLS, live Netlify proxy and host restore rehearsal NOT executed |
| Mobile / accessibility / speed | Real iPhone/Android/Safari, screen-reader and production Lighthouse/Core Web Vitals NOT signed off. Existing CI includes Chromium mobile and WebKit engine smoke; engine emulation is not real-device QA |

## Dependency decision

No speculative dependency was added. Reuse Node built-ins for durability checks/backups, existing React for UI and existing Playwright CI for browser testing. Locked dependency metadata identifies React/ReactDOM, Vite and Three as MIT; lucide-react declares ISC; TypeScript and its DefinitelyTyped types are Apache-2.0/MIT as declared. npm audit returned zero advisories. Locking permits reproducible review; it does not prove absence of vulnerabilities. Production build is approximately 370 kB JS / 114 kB gzip and 336 kB CSS / 67 kB gzip before later edits (see exact build output). No maintenance or bundle-weight benefit justified a new package. Media licences are separate from software licences and remain an approval gate.

## Remaining gates and exact owner inputs

1. **Infrastructure choice/access:** identify the dedicated Netlify project or authorize a new one and approve its `.netlify.app` hostname. Connected project searches for Mateshwari/Yatish returned no matches; no unrelated project was changed. Choose a Docker-capable always-on host with persistent volumes, HTTPS reverse proxy, monitoring and encrypted off-host backup. Approve any host cost; Netlify free frontend does not make the persistent backend free.
2. **Secrets entered by owner in host/provider secret managers:** random `CRM_ADMIN_TOKEN` of at least 32 characters (generate 32 random bytes or more); notification-provider secrets only if automated delivery is wanted. Never paste secrets into chat or use VITE_ variables. Grant access through the provider's normal account connection/team controls.
3. **Notification decision:** either launch with saved enquiries + staff follow-up and clearly operational preview outbox, or configure/test Resend sender verification (`RESEND_API_KEY`, `CRM_EMAIL_FROM`, `CRM_EMAIL_TO`) and optional WhatsApp approved template/token/phone ID. Owner confirms monitored inbox/phone and service expectations. Provider acceptance/inbox delivery not verified here.
4. **Business/media approvals:** confirm contacts, actual fleet, rates/allowances/taxes, operational coverage, cancellation/privacy/retention policy and rights/privacy of every image/video. Existing local asset pack is available; no need to ask for it again. Stage only approved bytes into Netlify build and backend image/volume; GitHub checkout alone contains none of these binaries.
5. **Verification:** build container on selected host; test synthetic booking through actual Netlify HTTPS origin, Admin retrieval, container replacement and host-volume restore. Evaluate ingress abuse controls: current per-socket limits can group Netlify visitors together. Do not trust arbitrary forwarded IP headers; configure sanitized client identity/rate limits at the trusted ingress and verify shared-proxy load before release. Complete real-device/accessibility/mobile performance checks with approved media. Configure uptime/disk-capacity/backup-failure monitoring.
6. **Final explicit public deployment approval.** Keep PR draft, main untouched and deploy skip markers until all gates are reviewed.

See `docs/production-runbook.md` for deployment, backup, recovery and rollback steps.
