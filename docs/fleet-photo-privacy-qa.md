# Fleet photo and cinematic media privacy — review checklist

**Status:** Draft feature branch; no production publication until the entire gallery and alternate-angle set has been reviewed at full resolution.

## Current verification

- **Scorpio-N movie and poster:** inspected the sampled start/middle/end frames and poster; no readable registration number was observed in the inspected frames. The film remains an AI-generated automotive concept with a visible model appearance that must not be represented as owned fleet footage. The cleaned video is supplied as a separate local asset ZIP, not in the repository.
- **Other model-reference images:** currently loaded from third-party Wikimedia Commons or local CRM uploads. **They have not all been visually reviewed or permanently pixelated.** Do **not** claim that all number plates are hidden merely because CI is green.
- **No cosmetic CSS cover** is treated as a permanent privacy fix. Pixelation must be baked into the published image bytes, including every alternate angle.

## Safely prepare all 10 primary and alternate-angle photographs

1. Start the full local CRM using `CRM_ADMIN_TOKEN="YOUR_PRIVATE_TOKEN" npm run dev:full`.
2. Open `http://localhost:5173/admin`, log in and select **Cars & pricing**.
3. For each existing vehicle, click **Review current photo / hide plates**. If the external host blocks browser cross-origin downloads, download the licensed image from its source page and use **Upload / edit vehicle photo · hide plates**.
4. In **Photo studio / Privacy**, drag over each registration plate, including background vehicles and reflections. Choose **Pixelate selected area**, then review the result at maximum canvas size. Repeat until no plate text can be read.
5. If the photograph genuinely contains no visible number, tick the explicit **No registration number is visible** checkbox. Saving without pixelation or this confirmation is blocked.
6. Click **Save sanitized photo**. This uploads a newly encoded WebP into the local CRM; the original photo stays unchanged.
7. Under **Review alternate photo angles**, perform the same independent steps for **every alternate image**. Verify all angle controls still display the correct vehicle after editing.
8. Click **Save Changes** and refresh the public website. Confirm the main image, alternate gallery angles, calculator selection and full-fleet list now reference the cleaned **local** assets.
9. Check the final full-resolution exported assets and confirm all legible characters are hidden, no car is substituted for another model, the links and rate fields still work, and copyright credits/rights remain appropriate.

**Important:** Image URLs under `/api/uploads/...` live on the local CRM machine. They cannot be deployed as-is on Netlify. Before public release, transport the sanitized bytes to authorized persistent hosting and update URLs/credits. The original external URLs must not be used as published substitutes once plate-redacted versions are approved.

## Cinematic step 2 — Toyota Innova

The collection now offers an executive-focused Innova scroll sequence using the vehicle's own reference photo with three distinct chapters (arrival, space and quotation). This is a **photographic scroll experience**, not footage of a physically moving Innova or an opening side door. Replacing the photo with a real licensed Innova video remains a separate media-creation gate; no fake door mechanics or incorrect model film will be displayed.

## Release gates

- [ ] All primary images reviewed or permanently redacted
- [ ] All alternate-angle images reviewed or permanently redacted
- [ ] Correct attribution, derivative image licensing and plate-free exported bytes checked
- [ ] Scorpio original video and poster verified at full resolution, not just frame samples
- [ ] Innova original motion footage approved if a genuine driving/door-opening effect is required
- [ ] Desktop/phone/tablet screenshots reviewed manually, including Safari
- [ ] Quote submissions, vehicle selection, contact links, CRM and all navigation checked
- [ ] Public hosting/persistence and final pricing/inventory accuracy approved

Until these pass, keep PR #1 a **draft** and do not merge, deploy, or activate live notifications.
