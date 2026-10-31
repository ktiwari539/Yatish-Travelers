# Exact deployment, recovery and rollback checklist

## Architecture and configuration contract

Netlify serves `dist`; all `/api/*` requests proxy to one HTTPS Node CRM service. `compose.crm.yml` keeps the Node listener off the public interface at host level. A host-managed TLS reverse proxy handles public HTTPS and request limits. Run **one CRM replica only**. Do not use ephemeral disk, Netlify Functions temporary storage, an autoscaled multi-writer service, or commit `.data`.

Backend configuration supplied by Dockerfile (all six paths must remain below `/data`):

| Setting | Value |
| --- | --- |
| NODE_ENV | production |
| CRM_HOST / CRM_PORT | 0.0.0.0 / 8787 inside container |
| CRM_STORAGE_ROOT | /data |
| CRM_DATA_FILE | /data/enquiries.jsonl |
| CRM_EVENTS_FILE | /data/events.jsonl |
| CRM_NOTIFICATIONS_FILE | /data/notification-events.jsonl |
| CRM_CATALOG_FILE | /data/catalog.json |
| CRM_UPLOADS_DIR / CRM_MODELS_DIR | /data/uploads / /data/models |
| CRM_ADMIN_TOKEN | owner-generated secret, never committed |
| CRM_NOTIFICATIONS_MODE | preview until separately tested/approved |

Keep `/app/public/media` on the second named volume because the reviewed-photo importer writes there. Its seven allowed images are proxied by exact Netlify routes; other approved editorial assets must be present during frontend build. Archive checksums attest identity, not publication rights.

## Before any public deployment

1. Review PR #1 and latest Actions results. Keep `feature/mateshwari-cinematic-crm`; do not merge main. Pin the reviewed commit and record prior good commit, backend image digest and Netlify deploy ID. Keep `[skip netlify]` in commits and PR title during preparation.
2. Owner selects host/project and approves media, rates, contacts, terms and retention. Record no secret values in the checklist.
3. Build `docker build -f Dockerfile.crm -t mateshwari-crm:<reviewed-sha> .` on a machine with Docker. Install only approved media before image/build. Verify image scanner results; this image was not built in the coding workspace.
4. Provision persistent named volumes, host TLS reverse proxy, firewall, encrypted off-host backup, disk/health/backup monitoring. Test networking and proxy timeouts. Review per-client abuse controls at ingress (the app deliberately does not trust spoofable forwarded headers).
5. Set `CRM_ADMIN_TOKEN` through the backend host secret manager. Use a fresh random value of at least 32 characters; do not put it in shell history, the Docker image, Netlify frontend variables, source code or chat. Limit staff sharing; rotate on staff changes. Shared bearer auth has no individual roles/MFA audit; use a separately reviewed identity layer if needed.
6. If the existing local CRM contains real customer records, stop its writer, create a protected offline snapshot and migrate into empty new volumes with owner review; reconcile counts, quotes and media before switching. Never overwrite or silently start empty in place of existing data. Start exactly one instance with `docker compose -f compose.crm.yml up -d --build`. Confirm mounts using host inspection and perform an actual replacement/restart test. `/api/health` must return ok/adminConfigured true. Its storage label alone is not evidence of a durable disk.
7. Use an isolated staging dataset: create synthetic enquiry with `example.invalid` email and non-customer phone, read in Admin, generate quote, mark confirmed, restart/recreate instance and retrieve again. Check unauthorized calls, limits and upload survival. No real CRM records may be used or altered for this test.
8. Rehearse offline backup/restore below into separate empty directories, then run staged CRM against restored data and verify enquiry, quote, status, catalog, outbox and image bytes. Record dates/results and backup age. Do not connect the restored test service to live notification credentials.
9. Dedicated Netlify project only: set build environment `VITE_PUBLIC_SITE_ORIGIN=https://<approved-name>.netlify.app` and `MT_CRM_API_ORIGIN=https://<approved-backend-host>`. Use actual assigned origins, no paths/credentials/query. Build `npm ci` then `npm run build:netlify`, Node 22, publish `dist`. Production CRM secrets belong only on backend. Preview contexts use a separate backend/dataset; never point a public preview at production data.
10. Check generated public HTML, sitemap/canonical host, Admin noindex, unknown 404, API proxy order, reviewed-photo delivery, compression/cache headers, no secret-like VITE_ keys, JS bundle and production network errors. Test direct `/stories`, all three journey URLs and `/admin`. API failures must stay JSON, never become homepage HTML.
11. Test customer UI submission and Admin on the actual HTTPS configuration, provider delivery if enabled, mobile screen sizes, keyboard/screen-reader use and real iPhone/Android browsers. Run production Lighthouse and fix confirmed failures; do not infer real-world CWV from build size. Confirm all photos/videos and credits. Ask for explicit public deployment approval only after evidence is reviewable.
12. Only after approval, release the pinned frontend/backend versions through the selected providers. Remove skip markers intentionally for the approved build. Verify health, API and synthetic lifecycle again; record IDs/times and monitor. Do not merge main unless separately authorized. Add the approved site to Search Console and submit sitemap; owner handles account verification.

## Offline backup and restore

The script is deliberately offline: `CRM_OFFLINE=true` is an operator assertion, not a mechanism that stops writes. Stop the service, ensure it is stopped, mount both volumes on an operations container/host and use their actual paths. Never run a backup while a writer is active. Use scheduled maintenance and host disk snapshots where available; the journal's contents are PII.

```bash
# On the operations host: stop CRM first (brief enquiry downtime).
docker compose -f compose.crm.yml stop crm
# Replace the three paths with real mounted paths; output must be outside both roots.
CRM_OFFLINE=true node scripts/crm-backup.mjs backup /mounted/crm-data /mounted/reviewed-media /secure-backups/snapshot-YYYYMMDD-HHMM
# After successful capture, restart service and verify health.
docker compose -f compose.crm.yml start crm
```

Encrypt the entire snapshot and copy it off-host using the chosen provider's protected backup tooling. Restrict files to authorized staff. A manifest detects corruption, not malicious rewriting of both manifest and files; protect backup integrity/access at the storage-provider layer. Proposed policy for owner approval: nightly off-host backups, 7 daily + 4 weekly copies; maximum 24-hour RPO, recovery-time target to be measured in host rehearsal. Shorter RPO requires more frequent infrastructure snapshots or database migration. No backup schedule was created by this work.

```bash
# With CRM stopped, restore to EMPTY new directories, never over live records.
CRM_OFFLINE=true node scripts/crm-backup.mjs restore /secure-backups/snapshot-YYYYMMDD-HHMM /recovery/crm-data /recovery/reviewed-media
```

All file hashes and the inventory are checked before writing. Keep originals/suspect data intact. Start an isolated preview-mode CRM against the new directories, verify records and uploaded files, then switch the service's mounts only after the operator validates the result. A corrupt journal makes production startup fail; restore from a verified snapshot and reconcile any newer records rather than silently discarding lines. Recovery can lose writes after the snapshot; record and reconcile that interval.

## Rollback

- If frontend release fails: restore the previously recorded successful Netlify deployment by ID. Keep the backend and volumes running; frontend rollback must not restore/delete customer data. Verify all API route contracts.
- If backend code fails: stop the new instance, preserve current volumes and capture a protected snapshot, then run the prior pinned image against those volumes if its data format is compatible. This change adds no schema migration, but verify compatibility before switching. Never run two writers during rollback.
- Restore data only for confirmed corruption/loss, with separate operator review: preserve the failed volumes, restore into new volumes, reconcile post-snapshot enquiries, then switch mounts. Code rollback alone never implies data rollback.
- If token exposure is suspected: rotate in the backend secret manager, restart one instance and require staff to sign in again; inspect access logs without copying credentials/customer PII to chat.
- Keep public release on hold if any acceptance gate fails. Record the rollback version, reason, health checks and recovery outcome.
