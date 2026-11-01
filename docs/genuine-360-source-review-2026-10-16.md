# Real vehicle 360° asset research — 16 October 2026

Status: **RESEARCH ONLY — NO APPROVED 360° ASSET**. Do not register these as verified, copy third-party image sequences, hotlink them, embed commercial viewers as the Mateshwari studio, or infer vehicle ownership. Keep public still-photo fallback until licensing, model/variant, quality and plate checks pass.

## Concrete candidates

| Priority | Model | Source | What exists | Decision / next gate |
|---|---|---|---|---|
| 1 | Maruti/Suzuki Ertiga | https://www.suzukicaribbean.com/assets/360viewer/ertiga/large/main.html | Genuine Suzuki-branded exterior/interior interactive 360 viewer | **NOT LICENSED FOR REUSE.** Contact Suzuki/content owner for written permission to serve/export all frames commercially; verify Latin America/Caribbean trim against the user's India fleet. |
| 2 | Maruti Ertiga | https://www.cardekho.com/maruti-ertiga-360-view.htm | Interactive commercial 360 exterior viewer | **NOT LICENSED FOR REUSE.** Permission from the image rights owner required. |
| 3 | Mahindra Thar | https://www.cardekho.com/mahindra-thar-360-view.htm | Interactive commercial vehicle view | **NOT LICENSED FOR REUSE.** Verify precise Thar year/variant. |
| 4 | Ertiga (2025) | https://sketchfab.com/3d-models/suzuki-ertiga-2025-6e7f2c7c9b184945891a90927839028c | Downloadable CC Attribution-labelled model, 482k triangles | Review underlying original creator/asset provenance, commercial reuse scope, exact Indian trim, render quality, attribution, file size and mobile performance; don't replace authentic car photos until visual review. |
| 5 | Mahindra Thar 4x4 | https://sketchfab.com/3d-models/thar-4x4-66ee970b18014c98a1750064b65657b0 | Downloadable CC Attribution-labelled rigged model, 203k triangles | Check creator rights, realistic fidelity, trim, commercial rights, attribution and mobile performance; no generic placeholder. |
| 6 | Toyota Innova | https://sketchfab.com/3d-models/toyota-kijang-innova-zenix-2023-highpoly-c8e1bbc9292b4e198dba839c32f02fa9 | CC Attribution-labelled high-poly third-generation Zenix 3D candidate | **MODEL MISMATCH RISK:** Zenix/HyCross is not Innova Crysta. Do not map to generic `Toyota Innova` without operator confirming variant. |

## Primary rights warning

Suzuki Motor Corporation's terms for its official Global Suzuki website reserve site content copyrights and state that reproducing/modifying material beyond permitted uses requires express permission: https://www.globalsuzuki.com/foruse/ . This is not proof of the exact Caribbean site's license; independently obtain authorization from that asset's rights owner rather than assuming reproduction rights.

Some Sketchfab uploads mention exports from game mods or simulators. A creator applying CC BY does not necessarily establish that they own the original game/model rights. Prefer separately authored, high-quality model files with verifiable rights.

## Required enablement checklist

1. Identify the actual Mateshwari vehicle, model year, trim, color and owner's authorization. Reference imagery must be labeled as such and not imply the pictured car is the dispatched car.
2. Obtain written commercial web-use permission for the complete exact-model 360 sequence or original high-fidelity model; record author, source URL, license, derivative/export permissions and credits.
3. Verify **24–72 sequential unique frame angles** of one consistent vehicle, including a full cycle and stable alignment/background; if GLB, inspect mesh, scale, textures and license.
4. Permanently mask all legible registration plates in exported frame pixels and check background faces/plates; capture an evidence ID and per-file SHA-256 inventory.
5. Optimize for desktop/mobile with visual checks on Chromium, WebKit and real macOS Safari, correct reduced-motion behavior and manual controls.
6. Only then add matching static local `/media/360/<model-slug>/` assets and a documented evidence ID to `src/verifiedTurntables.ts`. Preserve existing staff catalog/order/photos.
7. Run API tests, TypeScript production build, browser interaction/screenshot tests, and manual Safari review before requesting release approval.

**Do not enable a fake spinner in lieu of evidence.** Existing frame engine can operate with actual approved assets; it cannot manufacture missing physically correct views.
