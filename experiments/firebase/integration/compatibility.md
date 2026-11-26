# API parity inventory — audited against server/crm.mjs

These are source contracts, not live-network results. No production caller has been redirected. Existing staff routes use shared bearer-token auth; POC staff routes use verified Firebase ID tokens. `id` changes from UUID to a 64-character derived POC identifier, quote/status updates require `expectedVersion`, and POC lists are capped. **These differences require a reviewed compatibility adapter before migration.**

| Existing route | Methods | Existing request / success response | POC parity |
| --- | --- | --- | --- |
| `/api/health` | GET | `{ok,storage,adminConfigured}` | Separate POC health with different schema |
| `/api/enquiries` | POST | name, phone, email?, mode, pickup, destination, tripDate, vehicle, passengers, days, distanceKm, nightStay, tripType, notes, sessionId/source; returns 201 `{id,status,delivery:[{channel,purpose,status}]}` | Separate create with mandatory Idempotency-Key; delivery empty; estimates zero; no catalog integration |
| `/api/catalog` | GET | `{vehicles:[enabled catalog entries],updatedAt}` | Missing |
| `/api/events` | POST | `{event,sessionId,vehicle,source}`; 202 `{ok:true}` | Missing |
| `/api/uploads/:uuid.jpg|png|webp` | GET | Image bytes with MIME/cache headers | Missing durable blob adapter |
| `/api/models/:uuid.glb` | GET | GLB bytes with MIME/cache headers | Missing durable blob adapter |
| `/api/reviewed-media/:allowed-name` | GET | Reviewed WebP bytes | Existing host only; no POC replacement |
| `/api/admin/enquiries` | GET | `{items:[all replayed journal enquiries including quote/status]}` | Separate POC list limited to 20; no pagination parity |
| `/api/admin/enquiries` | POST | Staff manual name/phone/details; 201 `{id,status:'new'}` | Missing staff manual-create adapter |
| `/api/admin/enquiries/:uuid` | PATCH | `{status}`; `{id,status,updatedAt}` | Separate POC versioned edit returns record, different ID/response |
| `/api/admin/enquiries/:uuid/quotation` | POST | `{amount,notes}`; 201 `{quote:{id,amount,notes,createdAt},delivery:[...]}` | Separate POC versioned quotation; record response, no quote UUID/delivery; no history parity |
| `/api/admin/summary` | GET | `{total,byStatus,engagement}` | Missing |
| `/api/admin/engagement` | GET | `{total,counts,sessions,recent:[events]}` | Missing |
| `/api/admin/notifications` | GET | `{config:{mode,businessEmail,businessWhatsApp,emailReady,whatsappReady},items:[outbox history]}` | Missing; no notification provider activated |
| `/api/admin/catalog` | GET, PUT | GET catalog; PUT `{vehicles:[<=80 validated entries]}` → `{catalogVersion,vehicles,updatedAt}` | Missing |
| `/api/admin/images` | POST | `{mime,data:base64}` verified JPG/PNG/WebP <=3MB → 201 `{url}` | Missing; requires authorized durable blob storage |
| `/api/admin/models` | POST | `{data:base64}` verified self-contained glTF2 GLB <=8MB → 201 `{url}` | Missing; Netlify function payload limits also require review |
| `/api/admin/fleet-media/status` | GET | `{ready,installed,total,missing,invalid,catalogApplied,persistedCatalogApplied,modelLinks}` | Missing |
| `/api/admin/fleet-media/import` | POST | `{zipBase64,confirmReplace:true}`; hash/path-verified exact pack → `{ok,installed,applied,images}` | Missing; durable import lifecycle required |

Enquiry records contain `id`, `createdAt`, `updatedAt`, `status`, `mode`, contact details, trip details, estimate fields, session/source and optional quote. Catalog entries contain persistent order/id, name, capacity/seats, category/tag, enabled flag, rates, image/gallery and model URL. Read `server/catalog.mjs` validation and `server/notifications.mjs` before implementing adapters; preserving field names alone is not full behaviour parity.

Migration gates: reconcile JSONL events in order; retain stable legacy IDs and quote/status history; snapshot and verify counts/checksums; handle images/models separately; implement complete staff authorization and revocation; preserve notification/engagement history and retention; test old caller contracts and rollback. The old CRM remains the source of truth until the entire workflow passes review and synthetic staging E2E tests.
