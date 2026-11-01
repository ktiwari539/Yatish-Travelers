# Release evidence — single-project candidate

No public/production deployment, live CRM import, real notification delivery or customer-data mutation was performed. Owner provider configuration and the approved coordinated deployment remain pending. This document distinguishes local execution from live verification.

## Executed locally

- Existing JSONL CRM regression: **12 passed**, including original restart/restore and catalog/photo safety.
- Original injected Firebase contracts: **6 passed**.
- Prior sign-in/controller/runtime boundary tests: **9 passed**.
- New single-project runtime, authenticated backup encryption and strict legacy journal replay contracts and real Function fail-closed entry: **4 passed**.
- Full new CRM emulator rehearsal: actual Auth and Firestore emulators; official local Netlify Blobs server; synthetic public creation/idempotency conflicts, Admin retrieval, manual creation, optimistic concurrency, quote/status, catalog, paginated lists, engagement, image decoding/delivery, full 8 MB chunked synthetic GLB, disabled notification dispatch, maintenance, encrypted media/database backup and empty-target restore; **passed**. The emulator was exported, stopped and re-imported in a new process; confirmed status, quote, version, catalog and outbox recovery **passed**. The expanded suite uses the actual local Node HTTP path into the API handler, migrates synthetic legacy IDs without overwrites, deletes the provider backup copy, uploads the external encrypted archive in bounded chunks and verifies complete model/image recovery. These expanded assertions passed locally, including byte-for-byte recovery of the 8 MB synthetic GLB, and are included in the final CI rerun.
- TypeScript and Vite production build: **passed**. Admin/Firebase login is lazy-loaded: main JavaScript about 335 kB / 104 kB gzip, Admin chunk about 119 kB / 36 kB gzip before the recovery controls. No new Auth SDK is loaded by the public storefront route.
- `npm audit` for root and isolated emulator tooling: **zero vulnerabilities reported** after patches. This is a point-in-time registry advisory check, not a security certification.

## Final candidate checks

The new Firebase GitHub CI passed on candidate `bc2b070`: https://github.com/ktiwari539/Yatish-Travelers/actions/runs/41344247484. Frontend CI initially stopped at browser installation because `ubuntu-latest` selected unsupported Ubuntu 26.04. The job is now pinned to Ubuntu 24.04; its final rerun must pass. Do not interpret prior runs on `545de3b` as evidence for these new changes.

Local Chromium interaction smoke passed after the Firebase login fixture adaptation; existing fleet/photo editor/reordering, customer form success/error, mobile and studio mechanics all remain covered. Mobile homepage and locked Admin automated WCAG A/AA checks passed with **zero violations**, 390px viewport/390px scroll width, and recorded zero local layout shift in the sampled run. Small-label contrast, route-map semantics and decorative horizontal overflow were corrected. Local WebKit could not launch because system libraries are missing; WebKit must pass in GitHub CI, which installs them. Chromium smoke uses explicitly synthetic image pixels and a UI-only Auth fixture for reproducibility; actual Firebase SDK Auth verification/revocation is tested separately against emulators. These screenshot fixtures prove interaction/layout only, not fleet-photo rights, pixel approval or real owner login.

Mobile viewport WCAG automation and local timing evidence are stored in CI's `website-visual-qa` artifact. Automated checks do not establish screen-reader usability, real-device Safari/Chrome QA, Lighthouse field performance or Core Web Vitals. Actual provider cold starts, secret/IAM access, packaged native image code, function path routing, quota consumption, email inbox verification and real business-data reconciliation remain mandatory after the one approved deployment.

## Dependency decisions

| Package | Purpose / licence | Client impact | Review |
|---|---|---|---|
| Firebase Web SDK 13.1.0 | Existing Firebase Auth UI; Apache-2.0 | Lazy Admin chunk only; no Firestore Web access | Official maintained SDK; injected controller + real emulator Auth flow |
| Firebase Admin 14.5.0 | Server verification and Firestore; Apache-2.0 | Server only | Revocation checks; project/UID/email restriction; official Admin SDK |
| @netlify/blobs 11.1.7 | Durable images/models/encrypted backups; MIT | Server only | Official maintained SDK, strong reads and checksum readback; local HTTP server tests; actual hosting still pending |
| Sharp 0.35.5 (native libvips dependencies retain their own notices) | Decode/bound/re-encode images and strip metadata; Apache-2.0 | Server only | Native binary packaging must pass live verification; tests use actual decoder |
| fflate 0.8.3 | Decode only the exact SHA-256-approved archive; MIT | Server only | No generic/untrusted ZIP extraction to disk; existing per-file hashes retained |
| Playwright 1.56.1 / axe-core Playwright 4.11.0 | Local/CI browser and WCAG testing; Apache-2.0 / MPL-2.0 dependencies | Development only | Version pinned for reproducible browser artifacts; test server only |

Transitive security overrides pin gRPC JS 1.14.7, glob 14.0.3 and minimatch 11.0.3 in both dependency trees. Emulator tools additionally pin OpenTelemetry Core 2.8.0 and UUID 11.1.1. The override versions are covered by emulator/regression execution; do not blindly use `npm audit fix --force` to downgrade the Firebase SDK. Advisory sources reviewed: GHSA-m9gg-hp2v-232j, GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249, GHSA-8988-4f7v-96qf and GHSA-w5hq-g745-h8pq. Both lockfiles are committed.

## Recommendation

**NO-GO for public launch until owner provider configuration, existing-data/photo approvals, coordinated deployment approval and mandatory live integration verification are complete.** Offline failures are engineering work and are not delegated to the owner.
