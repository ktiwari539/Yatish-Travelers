# Vehicle image and privacy audit — 12 October 2026

Scope: GitHub Actions run [38269540832](https://github.com/ktiwari539/Yatish-Travelers/actions/runs/38269540832), visual evidence artifact `website-visual-qa` (all 10 fleet model screenshots plus Scorpio/Innova/mobile).

## Functional status

- CRM API tests, TypeScript/Vite build, Chromium navigation, selected-vehicle quotation flow, mobile 390/375 spacing and the CRM main/alternate-photo privacy gate passed.
- Mobile hero/booking CTA overlap was fixed; desktop text contrast improved, verified in screenshots.
- These automated tests do **not** establish that every external photo is plate-free, that every source photo is high quality, or that Safari is visually approved.

## Confirmed plate privacy issues from the ten screenshot contact sheet

| Model | Observation | Action |
|---|---|---|
| Mahindra Thar, red | A legible front registration number is clearly visible in the model image | **Redact on the source image** and replace public catalog image with sanitized copy |
| Mahindra XUV700, black | Rear plate characters are visible, partially readable | **Redact on the source image** and replace catalog image |
| Tempo Traveller, white | An orange front registration plate is visible | **Redact** before release |
| Other seven models | No equally clear readable plate was established from the *viewport screenshot*, but background vehicles, galleries, and original-resolution sources require inspection | Inspect every photo at original resolution and every alternate angle independently |

Avoid using CSS blur to claim privacy compliance: the original third-party image would still be served to visitors. The existing React CRM now lets staff review **current photos** and **each alternate angle**. It requires either permanent pixelation of selected regions or a confirmation that no number is visible before creating a sanitized WebP file. This workflow is implemented and tested, but has **not** yet been run on every production-bound source file.

## Cinematic asset caveat

The GitHub Actions model-Scorpio-N screenshot shows a black test-video frame because CI injects a tiny valid black H.264 fixture to exercise video playback and replay; it is **not a screenshot of the reviewed 6.7-second Scorpio movie**. Actual visual approval must use the installed user-provided Scorpio movie in Safari and Chrome.

Toyota Innova's Stage 2 is a still-photo-based scroll motion and executive text reveal, **not** real door-opening footage. Do not claim such footage has been generated.

## Updated with user-supplied replacements (local review only)

The user provided seven higher-resolution reference pictures. An **integrity-checked ZIP** (`mateshwari_fleet_photography_safe_pack.zip`) contains locally processed WebP derivatives with identity-specific names. The user must still install the pack through `npm run fleet:install` after pulling the branch.

- **Thar:** red front and rear studio references show the model word `THAR`, not a registration. The additional grey Thar frontal view had legible red registration markings; these were permanently mosaicked in the exported `mt-thar-grey-front-safe.webp`, while the moving grey side view has no readable plate in the submitted frame.
- **XUV700:** new blue SUV driving photo shows a blank rear registration area. The separate front studio view has `XUV700` model branding, not a real plate. Both are distinct, model-correct references.
- **Tempo Traveller:** the user-uploaded photo showed a yellow registration number on the front and a clipped side plate. Both original-resolution rectangles were permanently pixelated before downsampling and saving `mt-traveller-safe.webp`.
- **No other catalog records, assigned cars or pricing have been altered.** The upgrade only activates if all seven files are installed, and never overwrites a custom CRM primary image or gallery.
- **Rights are not verified.** Do not use these user-supplied reference images in a public release until permissions/attributions are cleared. Remaining default photos/angles still need independent inspection.
- GitHub CI does not contain these licensed/unknown-rights binary photos; browser interactions use fallback sources. Preview the installed local pack in Safari and check every plate at full resolution before declaring the image privacy gate passed.

## Release hold

- [ ] Permanently obscure the Thar, XUV700 and Tempo Traveller plate regions on the original source images and replace photo URLs
- [ ] Inspect/review all other seven primary images at full resolution
- [ ] Review and sanitize **every alternate angle** (main image review does not cover gallery)
- [ ] Verify correct image attribution / derivative license for republished sanitized photos
- [ ] Verify installed Scorpio movie on actual browser (CI fixture only)
- [ ] Review Innova source video if real motion is still required
- [ ] Approve mobile/tablet/Safari design and all booking/CRM flows on target environment

**Status:** PR #1 remains draft, no merge, no Netlify deployment, no live email/WhatsApp activation.
