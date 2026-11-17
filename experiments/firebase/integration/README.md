# Isolated Netlify + Firebase SDK integration

This subproject is **not a migration or production release**. Root Netlify config, storefront, `/api/enquiries`, existing Admin and disk-backed CRM remain unchanged. The only function route is `/api/poc/*`, and the only data subtree is `enquiries_poc`. No Firebase Storage/Cloud Functions or billing changes are used.

## Implemented

- Actual modular Firebase Web Auth SDK sign-in, memory-only persistence, sign-out, manually requested email verification, bounded staff retrieval and synthetic enquiry/quote/status forms. No account creation UI; no MFA claim.
- Modern Netlify `.mjs` function, actual Firebase Admin SDK ID-token verification with revocation/disabled-user checks, UID allowlist, password-provider check and **strict `email_verified === true`**. The older contract authorizer previously allowed a missing verification claim; that defect is fixed and regression tested.
- Fail-closed configuration: production contexts rejected; local mode requires both loopback emulators and fixed `demo-mateshwari-poc`. Hosted mode requires explicit preview/branch context, staging enable flag and explicit Development/staging project and `POC_PROJECT_PURPOSE=development-only`. The provided `mateshwari-travellers` project is supported only after the owner confirms it is dedicated to this experiment; no connection is made automatically.
- Atomic Firestore transaction: normalized payload hash and deterministic document ID from high-entropy idempotency key; identical retry returns same ID, changed payload returns 409. Server timestamps; client pricing/status ignored. Versioned quote and status edits reject stale versions. Staff list limited to 20 records, no unlimited fetch.
- Transactional synthetic write budgets: 100 new enquiries per UTC day and 10 per IP per ten-minute window. IP comes from Netlify `context.ip`, not request-supplied forwarding headers. IP is HMAC-hashed with a server-only salt. Native Netlify edge rate-limit config is also declared but its deployed enforcement is not tested. Replays do not consume new-write allowance. These controls **do not guarantee** a free quota under abusive reads, failed requests, transaction retries or large numbers of source IPs.
- Deny-all direct-client Firestore rules fixture. Admin SDK bypasses rules; server authorization is independently mandatory. This fixture was not pushed to any real project.
- Bounded emulator snapshot export/restore rehearsal with SHA-256 inventory/content verification, empty-target requirement and atomic create batch; plus Firebase CLI export/import across emulator process restart. This is **not** managed Firestore backup, scheduled off-host backup or production disaster recovery. Snapshot excludes rate-limit subcollection and Auth data; CLI emulator export/import independently covers Auth state. SHA-256 does not protect against an attacker rewriting both data and hash.

## Run without real credentials

Requires Node 22+ and Java 21+ (current Firebase CLI requires it). Emulator fixtures create only synthetic `example.invalid` accounts with test-only passwords. The fixed demo project has no live Firebase resources.

```bash
npm ci --prefix experiments/firebase/integration
node --test experiments/firebase/*.test.mjs
npm test --prefix experiments/firebase/integration
npm run build --prefix experiments/firebase/integration
npm run test:emulators --prefix experiments/firebase/integration
```

The last command starts Auth/Firestore emulators, exercises the real Web/Admin SDKs and the HTTP handler through a local Node HTTP adapter, exports state, stops both emulator processes, restarts with import and verifies enquiry/quotation/status/Auth persistence. It does not deploy or emulate Netlify's hosted runtime/CDN. CI has a separate Java 21 job for this workflow.

For manual local use, start emulators, then an API adapter and preview in separate terminals from this directory:

```bash
npm run emulators
# API terminal — synthetic fixtures only, never real credentials
POC_FIREBASE_PROJECT_ID=demo-mateshwari-poc FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 POC_ADMIN_UIDS=poc-synthetic-admin POC_RATE_SALT=synthetic-local-only-rate-salt-00001 npm run dev:api
# Browser preview terminal
VITE_POC_USE_EMULATORS=true npm run dev
```

Manual emulators start empty; create a synthetic staff account with the Admin emulator SDK or run the tests. The Auth emulator is bound to loopback; a remote/cloud browser cannot use the user's own loopback endpoint. Do not expose the insecure emulator to the internet to work around that.

## Private Netlify preview prerequisites (not deployed)

Use a **dedicated** Netlify project, base/package directory `experiments/firebase/integration`, its own `netlify.toml`, and owner-private visibility. Never point the existing website at this config. Netlify Functions source remains outside `dist`.

Server-only runtime values, entered through provider secret settings with Functions scope:

- `POC_FIREBASE_PROJECT_ID`: the provided `mateshwari-travellers` project **only after confirming it is Development/staging**, or a separate `mateshwari-poc-*` project. A duplicate project is not required just to continue the existing setup.
- `POC_ENABLE_STAGING=true`, `POC_PROJECT_PURPOSE=development-only` and an actual preview/branch deploy context (production is refused). The purpose flag is an operator assertion, not a lookup of Firebase console state.
- `POC_ADMIN_UIDS`: server-side staging staff UIDs. The supplied `ejz9iejTasZMZSEc5nKnh7npNk72` is for the provided project; if a separate project is chosen, use that project's UID instead. No account is created or altered automatically.
- `POC_RATE_SALT`: fresh random secret, at least 32 characters, never VITE-prefixed.
- Firebase Admin **Application Default Credentials** via a restricted service identity/workload federation configured for the runtime. Netlify does not automatically supply Google ADC. Issuer/audience/IAM and secure credential injection must be designed and verified on the selected account. This code does not download/bundle service-account private keys or claim keyless federation is already working.
- Never set emulator environment variables on a hosted project. No real credential is needed or accepted by the emulator tests.

Browser-only build setting `VITE_POC_WEB_CONFIG` is the JSON **public Web app configuration**, allowing only `apiKey`, `authDomain`, `projectId`, `appId`, optional `messagingSenderId`/`measurementId`. A Firebase Web API key is not an Admin private key. Do not put any service-account JSON/private key/UID allowlist/rate salt here. Build validation rejects unknown public fields and unexpected VITE variables; compiled JS is checked for Admin SDK/config leakage. Do not set `VITE_POC_USE_EMULATORS=true` for a hosted build. Use the approved project's existing Web app public configuration, registering a Web app only if absent, and authorize the private preview domain when ready. Do not recreate the owner's existing account or Web app without checking its state.

This page can send verification emails only when a signed-in user explicitly clicks the button. No real emails are sent by automated tests. Existing user `mateshwaritravellers@gmail.com` and its verified status, Auth provider, database creation, region and project billing state were **not** inspected or changed.

## Endpoint contracts

| POC endpoint | Method | Authorization / response |
| --- | --- | --- |
| `/api/poc/health` | GET | Configured mode; no secrets |
| `/api/poc/enquiries` | POST | JSON <=8 KiB; `Idempotency-Key` 16–100 letters/digits/underscore/hyphen; returns `{id,status,delivery:[],replay}` |
| `/api/poc/admin/enquiries` | GET | Verified allowlisted staff; `{items,limit:20}` |
| `/api/poc/admin/enquiries/:id` | GET | Same authorization; normalized record, server times, version |
| `/api/poc/admin/enquiries/:id` | PATCH | Same authorization; `{status,expectedVersion}` |
| `/api/poc/admin/enquiries/:id/quotation` | POST | Same authorization; `{amount,notes,expectedVersion}` |

Errors are deterministic JSON codes: 400 malformed JSON/missing key/version, 401 unauthorized, 404 absent route/record, 409 key/version conflict, 413 size, 415 content type, 422 fields, 429 POC budget, 503 unavailable/unconfigured. Function responses carry no-store/noindex/nosniff and no added CORS. `config.path` is POC only; the legacy handler and this actual SDK integration are intentionally distinct.

## Current limits and remaining parity

Verified official docs on 1 Nov 2026:
- Netlify **credit-based Free**: 300 credits/month hard limit, no recharge; function compute 10 credits/GB-hour, bandwidth 20 credits/GB, web requests 2 credits/10,000, production deployment 15 credits. Preview/branch deployments do not incur the production-deploy charge, but traffic/compute still meter. Existing accounts may be Legacy; actual account plan/usage has not been inspected. These are shared budgets, not unlimited free function invocations.
- Netlify uses build Node version for functions with supported runtime/fallback rules. This project pins build Node 22; real function deployment/runtime invocation still requires a test. No speculative memory/region overrides.
- Firestore Spark: one free database/project, 1 GiB, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day, 10 GiB outbound/month. Managed backup/restore/PITR/TTL billing is excluded from free quota. Firebase Storage and Firebase Cloud Functions are not part of this free-only POC.
- Successful fresh enquiry uses at least 3 document reads + 3 writes (record and quota docs), plus retries. Identical replay uses a read. Auth revocation checks and list reads also have usage/latency implications. Quota exhaustion and billing behaviour require actual staging measurements; no uptime/free-forever claim.

Still missing: production catalog/pricing compatibility, engagement and notification history adapters, durable media/uploads, real notification delivery/retries, complete JSONL reconciliation, retention/deletion workflows, production-grade scheduled encrypted backups/recovery, account-level free-budget observability/alerts and full production compatibility. Keep the old CRM for rollback. No live `/api/*` switchover, Firebase billing upgrade or public deployment is authorized by this work.

Official sources:
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/emulator-suite/connect_firestore
- https://firebase.google.com/support/release-notes/cli
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
- https://docs.netlify.com/build/functions/configuration/

## Dependency and test evidence notes

Pinned Firebase Web 13.1.0 and Firebase Admin 14.5.0 (Apache-2.0), Firebase CLI 15.34.2 (MIT, development only), Vite 7.3.7 (MIT). The Web preview imports only app/auth; production Firestore writes use Admin SDK. Browser build measured about 110 kB JS / 33 kB gzip with no privileged SDK/config in the output. No package is added to the existing storefront manifest or lockfile.

An executed audit found a vulnerable gRPC dependency pulled by the umbrella Web package. A scoped override selects patched `@grpc/grpc-js` 1.14.7 rather than accepting npm's proposed downgrade to Firebase 9. Additional transitive moderate advisories in Google transport/glob/rimraf and CLI dependencies need review; no broad breaking overrides or claim of zero vulnerabilities. Check latest audit output/CI before any hosted use.

Local execution: original six contract tests, four new runtime/HTTP boundary tests, the POC Web build and existing 12 CRM tests/typecheck were run. Local emulator execution was attempted but blocked by Java 17; current Firebase CLI requires Java 21. Downloading Java 21 was unavailable in this environment. The dedicated CI workflow installs Java 21; its actual result must be checked before claiming emulator/restart tests pass. No real Firebase connectivity or deployed Netlify function test has been executed. API parity inventory: [compatibility.md](compatibility.md).


## Verified CI evidence

Commit `8729f2c2065a3b3e566419b7b6fbe801a656bcc4` passed the Java 21 emulator workflow: https://github.com/ktiwari539/Yatish-Travelers/actions/runs/41312459147 . The actual Web/Admin SDK, local HTTP handler, concurrent idempotency, email/provider/allowlist checks, direct-client rule denial, quote/status version conflicts, write cap, disabled/revoked tokens, snapshot restore and **emulator process** restart/import all passed. This supersedes the earlier local Java limitation as the overall emulator test result; that local limitation still exists. No deployed Netlify runtime, actual owner Firebase project or cloud backup/restore was tested. Production-dependency audit after the scoped gRPC patch reported zero high/critical and six moderate findings. Local fail-closed preview screenshot inspected.

## Existing-owner verification login — PR #2 continuation

The sign-in view uses the existing `mateshwaritravellers@gmail.com` account; it never creates or resets it. For the `mateshwari-travellers` project, server policy pins UID `ejz9iejTasZMZSEc5nKnh7npNk72`, requires that account's email, the password provider, `email_verified === true`, and Firebase Admin SDK token verification with revocation checks. Attempting to configure another UID for that project fails closed. The existing UID is not a browser-side authorization grant.

After signing in, an unverified user sees **Send verification email**. A deliberate click calls Firebase Web SDK `sendEmailVerification(user)`. It never sets `emailVerified` itself, sends automatically, changes a password or creates an account. A 60-second in-memory resend cooldown and Firebase throttling feedback prevent accidental repeated clicks (this UI cooldown is not a server-side abuse barrier).

The user opens Firebase's default verification link, returns to the same sign-in tab and selects **I’ve verified — refresh status**. The client calls `reload(user)`, forces `getIdToken(true)`, then requests `GET /api/poc/admin/session`. Admin CRM controls remain hidden and disabled until that endpoint returns `{authorized:true}` after server verification. Network/configuration errors, a wrong UID/email, stale token, unverified email, disabled/revoked account or signing out during the check leave the workspace locked. Every data endpoint still independently authorizes its request. Signing out clears visible records. Firebase Auth is initialized with in-memory persistence; no passwords/tokens are written to browser storage or logs.

This continuation adds controller tests for send/resend, forced refresh order, unauthorized/unavailable backend, logout races and the fixed owner policy. The real emulator suite now sends a verification action through the Web SDK, captures it only from the fixed demo Auth emulator, applies the email action, proves the old token still fails, then reloads/refreshes and proves server authorization succeeds. No real verification email or owner password is used in tests.

The existing public Firebase Web configuration has already been recovered from the previously supplied setup; do not ask the owner to recreate the Web app or paste any password/private key. A hosted staging preview also needs a dedicated protected Netlify project, deploy access, the configured preview domain and the existing server-side service identity. A dedicated empty Netlify project `mateshwari-auth-staging` was created (site ID `20dab8cd-fdc1-4196-937f-7c779661cf47`) for this task; no content or function was deployed. Dashboard privacy/deploy setup is blocked by the Netlify sign-in screen and no CLI deploy credential is configured. Unrelated projects were left untouched. Missing deployment/service credentials must never be bypassed with a fake successful Admin response. An internal/local preview is not evidence of a protected Netlify deployment.


Staging dashboard: https://app.netlify.com/projects/mateshwari-auth-staging/configuration/general/#project-visibility . The project must be set to **Private / production and previews** before any upload; its empty default hostname is not a working preview. Configure the nested base/package directory `experiments/firebase/integration`, the already-supplied public Firebase Web config, and the secured Functions runtime identity. Use only a Deploy Preview/branch/draft deployment, never a production deploy or merge. Until that provider sign-in/private setting/deploy access and server identity are completed, no secure hosted preview URL can be truthfully supplied. The provided owner UID is now fixed server-side for its project, so no duplicate account or UID request is needed.
