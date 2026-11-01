# Choose Your Ride — asset acceptance register (15 October 2026)

**Scope:** Existing draft PR #1, `feature/mateshwari-cinematic-crm`. **Not** a production clearance. This file tracks the actual gap between configured gallery URLs and accepted vehicle photography. No CRM, operator pricing, visibility, order, uploads, or notification state was changed.

## Verified software checks

- Baseline PR HEAD: `e65c0b4bd1aa0be57d8d2368c5c7432f0bf1c6a5`; green workflow [38618393818](https://github.com/ktiwari539/Yatish-Travelers/actions/runs/38618393818).
- Photo failure handling: card and full-screen studio now mark failed URLs as *Photo pending*, skip them during navigation, retain only same-model fallbacks, and keep the large 3/2/1-column photographic design.
- [38730053123](https://github.com/ktiwari539/Yatish-Travelers/actions/runs/38730053123) passed TypeScript/Vite, API and Chromium tests. The browser regression deliberately aborted Commons requests: the Ertiga card and full-screen studio then disabled failed photo angles. Evidence is `photo-load-failure-proof.png` inside that run's `website-visual-qa` artifact.
- The known plate-bearing legacy Commons URLs for Thar, XUV700, Traveller, and Innova are now denied by the client as well as the existing server/reference guard. This **does not** certify all other sources as plate-safe.
- CI screenshots do not contain the user's private reviewed ZIP packs; absent CI photos and synthetic black Scorpio film are not evidence of the actual Mac appearance.

## Ten-model photo inventory — candidates are not accepted photographs

| Named model | Current catalog / local-preview candidate sources | Status and primary gap |
|---|---|---|
| Maruti Dzire | Main Commons + catalog alternate + local-review motor-show angle | Up to 3 configured; exact trim, all image bytes, plate/background and licensing credit still need full review. |
| Maruti Ertiga | Weak street main + Commons rear + local-review motor-show front | Up to 3 configured; street main is not visually strong. Replace with three genuinely complementary accepted views. |
| Toyota Innova | Commons Crysta side + local-review different-trim cabin view | Two original plate-bearing angles are intentionally blocked. Not enough approved distinct full-vehicle views. |
| Mahindra TUV | Existing streetscape reference + local 2016 front + local alternate | Up to 3 configured; 2016 trim and masking need full-pixel review; existing shot is weak. |
| Mahindra Bolero | Main Commons reference + GLX front and rear candidates | Up to 3 configured; GLX trim may differ from model description. Plates and licences not certified. |
| Tempo Traveller | 1 reviewed-pack WebP + Commons older side candidate | Only 1 safe-pack image historically checked; second differs in variant. Private WebP absent from CI, so actual Mac load needs repeat verification. |
| Mahindra Scorpio-N | Commons front + rear reference; concept video/poster separate | 2 still candidates; cinematic film is edited concept, not authentic vehicle capture. Main/rear privacy and variant pending. |
| Mahindra Thar | 4 user-supplied WebP views in exact safe ZIP | Four local-pack assets were previously checksum-verified on user's Mac. Not present in Git; recheck current installation and full-resolution mask before approval. |
| Mahindra XUV700 | 2 user-supplied WebP views in exact safe ZIP | Two local-pack assets were previously checksum-verified on user's Mac. Still need independent Mac loaded-image and plate/privacy sign-off. |
| Kia Carens | Commons main + local 2022 motor-show front/rear candidates | Up to 3 configured; model variant/year, plate/background pixels and CC BY-SA attribution pending. |

**Important:** “Up to 3” counts source URL candidates in `src/fleetGallery.ts` on localhost, not photographs confirmed loaded, independent, rights-cleared, or physically masked. The default `.data/catalog.json` on the user's Mac may override every count. The seven reviewed local WebPs cover only **three model families**; the combined 14-media pack contains additional editorial assets/videos, **not** 14 independent fleet photographs.

## Required individual photo sign-off

For **each** requested main/alternate angle record the source page, author/permission, licence/derivative requirements, real model and trim, view direction, original resolution, locally installed review-path, SHA-256, HTTP/display status, and whether *all* registration plates (including background cars) are unrecognizable in the **image bytes**. Photograph and derivative attribution must remain linked.

Only promote an image into public `/media/` or staff `/api/uploads/` after plate redaction and approval. Do not call a CSS cover/mask or blurred webpage a permanently sanitized photograph. For 2–3 photos per model, a duplicate crop, a broken URL, a concept render, or a different car does not qualify.

## User Mac / Safari acceptance

In the **existing checkout** run `git status --short` first; preserve local modifications. Then fast-forward the draft branch only if clean. With the user's private token configured locally, run `npm run dev:full`; in another terminal run `npm run verify:fleet`, `npm run test:api`, and `npm run build`. Confirm `/api/catalog` order/visibility and each actual local `/media/` response, not just installer messages.

In Safari inspect `http://localhost:5173/#fleet` at desktop 1440+, tablet 1024, mobile 390/375; visit every card and full-screen angle; check actual vehicle identity, distinctness, clarity, full framing, thumb loading, arrow behavior, fallback, rate/quote model consistency, reduced motion and number plates. Recheck the intro and lower continuous reel without duplicating existing features. Do not rewrite `.data/catalog.json` or any staff uploads to perform this review.

**Release remains blocked:** fewer than 2–3 *accepted* real photographs per model, full source attribution/privacy not signed off, Safari with private packs not yet visually accepted, and real fleet/price/inventory not owner-approved. PR #1 must remain draft; no merge, deployment, live dispatch, or destructive CRM changes without explicit user approval.
