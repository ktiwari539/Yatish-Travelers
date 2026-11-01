# Release evidence — single-project candidate

No public/production deployment, live CRM import, real notification delivery or customer-data mutation was performed. Owner provider configuration and the approved coordinated deployment remain pending. This document distinguishes local execution from live verification.

## Executed locally

- Existing JSONL CRM regression: **12 passed**, including original restart/restore and catalog/photo safety.
- Original injected Firebase contracts: **6 passed**.
- Prior sign-in/controller/runtime boundary tests: **9 passed**.
- New single-project runtime, authenticated backup encryption and strict legacy journal replay contracts: **3 passed**.
- Full new CRM emulator rehearsal: actual Auth and Firestore emulators; official local Netlify Blobs server; synthetic public creation/idempotency conflicts, Admin retrieval, manual creation, optimistic concurrency, quote/status, catalog, paginated lists, engagement, image decoding/delivery, chunked GLB, disabled notification dispatch, maintenance, encrypted media/database backup and empty-target restore; **passed**. The emulator was exported, stopped and re-imported in a new process; confirmed status, quote, version, catalog and outbox recovery **passed**. Later expanded HTTP/restore/migration assertions require the final rerun below.
- TypeScript and Vite production build: **passed**. Admin/Firebase login is lazy-loaded: main JavaScript about 335 kB / 104 kB gzip, Admin chunk about 119 kB / 36 kB gzip before the recovery controls. No new Auth SDK is loaded by the public storefront route.
- `npm audit` for root and isolated emulator tooling: **zero vulnerabilities reported** after patches. This is a point-in-time registry advisory check, not a security certification.

## Final candidate checks

Pending final rerun and GitHub CI; do not interpret prior runs on `545de3b` as evidence for these new changes. Chromium smoke uses explicitly synthetic image pixels and a UI-only Auth fixture for reproducibility; actual Firebase SDK Auth verification/revocation is tested separately against emulators. These screenshot fixtures prove interaction/layout only, not fleet-photo rights, pixel approval or real owner login.

Mobile viewport WCAG automation and local timing evidence are stored in CI's `website-visual-qa` artifact. Automated checks do not establish screen-reader usability, real-device Safari/Chrome QA, Lighthouse field performance or Core Web Vitals. Actual provider cold starts, secret/IAM access, packaged native image code, function path routing, quota consumption, email inbox verification and real business-data reconciliation remain mandatory after the one approved deployment.

## Dependency decisions

| Package | Purpose / licence | Client impact | Review |
|---|---|---|---|
| Firebase Web SDK 13.1.0 | Existing Firebase Auth UI; Apache-2.0 | Lazy Admin chunk only; no Firestore Web access | Official maintained SDK; injected controller + real emulator Auth flow |
| Firebase Admin 14.5.0 | Server verification and Firestore; Apache-2.0 | Server only | Revocation checks; project/UID/email restriction; official Admin SDK |
| @netlify/blobs 11.1.7 | Durable images/models/encrypted backups; MIT | Server only | Official maintained SDK, strong reads and checksum readback; local HTTP server tests; actual hosting still pending |
| Sharp | Decode/bound/re-encode images and strip metadata; Apache-2.0 | Server only | Native binary packaging must pass live verification; tests use actual decoder |
| fflate | Decode only the exact SHA-256-approved archive; MIT | Server only | No generic/untrusted ZIP extraction to disk; existing per-file hashes retained |
| Playwright 1.56.1 / axe-core Playwright 4.11.0 | Local/CI browser and WCAG testing; Apache-2.0 / MPL-2.0 dependencies | Development only | Version pinned for reproducible browser artifacts; test server only |

Transitive security overrides pin gRPC JS 1.14.7, glob 14.0.3 and minimatch 11.0.3 in both dependency trees. Emulator tools additionally pin OpenTelemetry Core 2.8.0 and UUID 11.1.1. The override versions are covered by emulator/regression execution; do not blindly use `npm audit fix --force` to downgrade the Firebase SDK. Advisory sources reviewed: GHSA-m9gg-hp2v-232j, GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249, GHSA-8988-4f7v-96qf and GHSA-w5hq-g745-h8pq. Both lockfiles are committed.

## Recommendation

**NO-GO for public launch until owner provider configuration, existing-data/photo approvals, coordinated deployment approval and mandatory live integration verification are complete.** Offline failures are engineering work and are not delegated to the owner.
