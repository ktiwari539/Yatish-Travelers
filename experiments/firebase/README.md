# Netlify + Firebase Spark — isolated proof of concept (2026-11-01)

**Branch:** experiment/netlify-firebase-free-poc, forked from feature/mateshwari-cinematic-crm at current head. Not deployed. Existing production and feature-branch CRM untouched.

## Decision under evaluation
- Keep React/Vite storefront, SEO, and Admin UI on Netlify.
- Test **Firestore Spark** for durable enquiry documents. Firestore Spark currently lists 1 GiB storage, 50K reads/day, 20K writes/day; exceeding the Spark quota can disable affected service until reset.
- Use **Netlify Functions** as trusted API for validation and Admin authorization, never expose Firestore service account credentials in browser code. Verify current Netlify free usage/credit caps and runtime support.
- Firebase Authentication may be considered for individual staff accounts, but this POC deliberately does not claim a complete identity migration.
- **Do not use Firebase Cloud Storage or Firebase Cloud Functions on Spark**: those require billing/Blaze. Existing fleet images can stay on Netlify if licence rights permit, but Admin uploads would require a durable blob store such as Netlify Blobs and signed/authorized server-side handling.
- Backup/export, environment isolation, abuse protection, server-side idempotency, notifications and operational recovery need separate implementations and tests. Firestore persistence does not prove backup/restore readiness.

## Prototype included
`experiments/firebase/firestore-enquiries.mjs` contains an injected Firestore enquiry repository with atomic create and get methods, basic field normalization, input constraints and server-generated IDs. It writes exclusively to the `enquiries_poc` collection.

`experiments/firebase/firestore-enquiries.test.mjs` tests the contract using an in-memory Firestore fake, without credentials. Execute:
```bash
node --test experiments/firebase/firestore-enquiries.test.mjs
```
**These are unit contract tests, not real Firestore, authentication, Netlify Functions, network, rate-limit, backup or production tests.** Do not route `/api/enquiries` to the POC.

## Migration readiness gap
Current CRM includes journals and quotations, Admin list/status edits, catalog changes, media imports/uploads, notification history and engagement events. Migrating only enquiry creation would leave the platform inconsistent. A safe migration must:
1. Inventory all existing API routes and their request/response schemas. Provide compatibility adapters so storefront and Admin callers need no unreviewed changes.
2. Use Firestore server timestamps and atomic transactions/batches where appropriate; implement deterministic idempotency and concurrency checks before accepting real enquiries.
3. Authorize all Admin reads/writes server-side with verified identity and roles. Never trust a public Firestore client or frontend-only route guards. Lock down Firestore Security Rules; Firebase Admin SDK server credentials bypass rules.
4. Build Netlify Function endpoint(s) with deterministic errors and limits, runtime secret injection, and isolated staging Firebase project. Test actual network path and free-tier invocation budgets.
5. Store approved media using durable, access-controlled storage; choose an explicit blob solution that works without Firebase Blaze billing.
6. Implement complete backup/export and restore, reconciliation of old JSONL journals, privacy and retention policies, upload lifecycle, notifications, and monitor usage.
7. Run existing CRM regression suite and new end-to-end synthetic booking -> Admin -> quote -> status -> restart/restore before public launch. Preserve the old CRM for rollback until parity is proven.

## Current conclusion
Firebase Spark is a feasible **database candidate** for low-volume enquiries, but a full Netlify + Firebase CRM migration is not yet implemented or verified. A completely free production-grade end-to-end solution is not guaranteed: free usage policies, limits, backups and media retention are material constraints. No public deployment, API switchover or live customer data mutation is authorized.

Official references:
https://firebase.google.com/pricing
https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
https://firebase.google.com/docs/admin/setup
https://docs.netlify.com/build/functions/overview/
