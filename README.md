# Mateshwari Travellers — local review

This work remains on the draft PR branch `feature/mateshwari-cinematic-crm`. It is **not deployed or merged into main**.

## Start the full local website + CRM

Requires Node.js 22 or higher.

```bash
cd ~/Projects/Yatish-Travelers
git fetch origin
git checkout feature/mateshwari-cinematic-crm
git pull origin feature/mateshwari-cinematic-crm
npm install
npm run test:api
npm run build
CRM_ADMIN_TOKEN="YOUR_OWN_LONG_PRIVATE_TOKEN" npm run dev:full
```

Keep the terminal open and enter your **private** token at http://localhost:5173/admin. Do not share the token or commit it in the repo.

| URL | Purpose |
| --- | --- |
| http://localhost:5173 | Customer website, showroom, travel inspiration and quotation |
| http://localhost:5173/stories | Story submission placeholder and scenic inspiration (not fake testimonials) |
| http://localhost:5173/admin | CRM: enquiries, activity tracking, vehicle configuration |

### Email and WhatsApp quotation previews

The website has direct **Email Us**, **Call** and **WhatsApp** contact buttons. Form submissions are saved in the local CRM. In the CRM, open **Enquiries & follow-ups** and click **Prepare & send quotation**, enter the final quoted amount and notes, and submit. Review **Email & WhatsApp outbox** for business and customer email copies and business WhatsApp preview records.

The default notification mode is **preview**, so **nothing is sent externally**. The integration adapters for Resend email and Meta WhatsApp Cloud API are implemented; sender domain, API credentials, approved WhatsApp template and explicit `CRM_NOTIFICATIONS_MODE=live` are required later.

Detailed integration gates: [Email, WhatsApp and visual QA](docs/notification-and-visual-qa.md).

### Premium Hero V6 — restored MPV concept and 2.5D motion (latest)

The home hero now opens with the approved **white MPV / Ertiga-inspired golden-hour concept**, followed by a second mountain-road MPV visual. Both have separate transparent car layers for pointer-responsive depth. A **5-second lightweight muted MP4** animates the first scene on desktop, while CSS parallax and still images provide fallbacks. This is AI-generated illustrative media, **not an actual Maruti Ertiga photo/video or a real 3D OEM model**. The Gallery's Maruti Ertiga selection now features the same concept, clearly marked as travel inspiration.

**The image/video files cannot be embedded in the GitHub text-only code update; one local installation is required.** Download the `mateshwari_cinematic_ertiga_pack.zip` file attached in our chat to your Mac's Downloads folder. Then run:

```bash
cd ~/Projects/Yatish-Travelers
npm run visuals:install
npm run dev:full
```

The installer validates the expected five file names and extracts them into `public/media/`. If the zip file was saved elsewhere, use `npm run visuals:install -- /absolute/path/to/mateshwari_cinematic_ertiga_pack.zip`. Alternatively, extract the ZIP directly into the project root using `unzip -o ~/Downloads/mateshwari_cinematic_ertiga_pack.zip`.

Without this pack, the website falls back to earlier remotely hosted travel references and **cannot show the restored concept or animated video**. The MP4 is only 313 KB, loops silently and pauses when out of view. Mobile and reduced-motion clients receive still images. The original enquiry, CRM, phone, WhatsApp, email and rate features are unchanged.

**Review gate:** Inspect the desktop opening image, foreground movement, smooth image transition and Model tab/Request Quote. Repeat on mobile/tablet; verify imagery is correctly labeled as a concept and the original fleet model photos are treated as references. GitHub CI covers API tests and the production build only, not real browser aesthetics or performance.

### Signature Journeys director's-cut hero — current review (October 2026)

The front-screen design is now **one full-bleed cinematic scene** rather than a box alongside a separate headline. The route photography uses three **crossfading, independently mounted** scenes: mountain road, golden-hour drive and lake landscape. Foreground detail, atmosphere, moving light and background react subtly to pointer/scroll. These are **layered photographic motion effects, not video footage or a 3D vehicle model**.

The hero overlays only the essential marketing message and Get Quote / WhatsApp / Explore Fleet actions, with a less-prominent direct Email link. The fleet selector is now **thin underline tabs**, plus small scene navigation/pause controls and a progress line. A compact vehicle panel shows the current model, passenger capacity and CRM-defined indicative per-km price. Editorial imagery is explicitly distinguished from the selected vehicle.

The scene interval is now **4.8 seconds** (previously 9.6 seconds), with a **1.05-second dissolve** and a matching progress bar. Scene images are preloaded at low priority before they are shown, avoiding blank transitions when the file or fallback takes time to load. The next scene waits for its photo to be available. Animation does not auto-cycle when the section is out of view or on small phone screens, and it respects reduced-motion settings. Layout breakpoints rearrange the selector and contact controls for phones and tablets. The hero's small top label clears the fixed navigation, and its redundant decorative scroll cue has been hidden. The enquiry modal and staff CRM are not changed by this component.

**Local visual QA remains mandatory** for Safari, Chrome, iPhone, tablet and widths 375 / 768 / 1024 / 1440 before this is suitable to merge. If images from `public/media` are not installed, remote photo fallbacks load; remote-only media and local image licensing must be reviewed before production. No Netlify deployment or live notification activation.

### Cinematic fleet redesign — latest local review

The old hero with enlarged low-quality catalog photography, **duplicate side cards and two repeated marquees has been removed**. The current first screen is a full-bleed travel film with soft scene transitions and a separate, honest vehicle selector. TUV/Bolero/Traveller reference photos no longer become oversized hero posters.

Below the hero is a single premium **vehicle gallery**, a quiet left-to-right editorial composition with one selected image, clear model information, seat class, **rate read from local CRM**, next/previous controls and a quotation button. Its bottom rail shows **six unique entries, once each**, and supports touch scrolling on phones/tablets. The three catalog references previously unsuitable for enlargement show **explicitly labeled editorial travel scenes** until locally uploaded, approved vehicle photography is available. The vehicle comparison lower on the page continues to identify each exact model, and the CRM allows staff to replace its images.

The first-screen scenic film is **illustrative**: a selected car name in the separate booking area does not mean the background image depicts that precise car. Scene rotation pauses on request, respects reduced-motion settings and is manually controlled on phones.

Fare calculator, Why Mateshwari, corporate, stories, manual lead logging, customer forms, outbound message preview and responsive mobile WhatsApp/Call/Quote actions remain.

Review at 360px, 390px, 768px, 1024px and 1440px. Check image aspect ratio, hero scene controls, the fleet gallery, the selected car quotation flow and /admin. **CI validates code but not Safari/mobile image quality.** No deployment or merge without approval.

### Scenic luxury visual refresh — current review
The opening now emphasizes **editorial mountain-road photography** with a separate accurate fleet selector. Photos labeled travel inspiration must never be represented as the actual TUV, Bolero, Traveller or other assigned vehicle.

**Approved cinematic image pack (optional for local preview):** Download `mateshwari_visual_pack.zip` from the project conversation, then extract it into your local repository root:

```bash
cd ~/Projects/Yatish-Travelers
unzip -o ~/Downloads/mateshwari_visual_pack.zip
```

This installs `public/media/mt-hero-sunset.webp` and `public/media/mt-mountain-sunset.webp`, optimized from the two approved scenic concept visuals for the **journey editorial sections** (the front-screen hero now uses the vehicle reel). They are **generated marketing concepts**, not photos of actual customer trips or the business's assigned vehicles. They are intentionally not included as binary assets in the draft PR. If the files are absent, the website falls back to the separately credited Unsplash photos.

The site also includes:
- panoramic Himalayan-road image interlude with working **Explore journeys** and **Plan a trip** CTAs;
- image-led Local, Outstation, Airport and Events service tiles;
- a photographic airport/corporate travel panel;
- three landscape-led Stories teaser cards and a credited Mountain / Golden Hour / Green Escapes travel editorial;
- desktop/tablet/mobile layouts and reduced-motion support in `src/scenic-luxury.css`.

Photo metadata and URLs live in `src/luxuryMedia.ts`. The current externally hosted scenic photographs are **development references**, licensed through Unsplash and accompanied by source/creator links; replace them with approved, locally hosted creative assets before launch. The design is influenced by the two previously generated sunset/SUV image references, but those generated files are **not currently bundled in Git**, so the website does not pretend they are.

**Review these on your Mac:** first-screen hero crop, selected vehicle card, image-loaded states, mountain interlude, 4 service cards, Stories and corporate panorama. Test at 375px, 768px, 1024px and 1440px widths. Accessibility and real-device visual acceptance are separate from passing CI.

### Visual direction: photographic luxury rather than toy-like concepts

The current local review intentionally **does not show the low-poly 3D car by default**. It had an incorrect visual relationship to vehicle names such as Toyota Innova. The hero now uses model-reference photography, a lighter editorial palette and pointer-responsive depth. A separate immersive fleet gallery has animated multi-angle photography, prior/next vehicle previews, manual model selection and quotation actions. The gallery remains interactive without misrepresenting generated concept geometry as an OEM vehicle.

The actual Three.js WebGL implementation remains available **only when you upload a licensed, model-accurate GLB** using CRM → Cars & pricing → 3D model. Without this asset, accurate photos are shown. A studio-quality photorealistic 3D representation cannot be reliably constructed procedurally. Travel editorial and Journey Studio still supply interactive route changes and parallax.

**Photo privacy:** Side-view images reduce the exposure of registration plates, but the full existing reference photo catalog has **not** been independently guaranteed plate-free. Before public launch, use the admin photo privacy editor to pixelate visible registration details or replace photos with licensed images. No conspicuous grey overlays are used.

**Review criteria:** desktop and mobile photo framing; legible controls and CTAs; loading/fallback for remote Wikimedia image URLs; no misleading model representation; check each photo for any visible plate; functioning quote/CRM and WhatsApp paths.

### Test the booking funnel

1. Visit the homepage and click **Request Final Quote**, **Request Callback**, or **Plan this trip**.
2. The visitor-activity tab records anonymous quote opens and clicks if the local backend is running. **A click is not an identified customer.**
3. Submit the form using test details; a server-generated enquiry reference appears **only after the backend saves it**.
4. In `/admin`, choose **Enquiries & follow-ups** and refresh. Confirm the customer, phone, optional email, route, vehicle, travel date, notes, estimated fare and source are present.
5. Change the status: `new → contacted → quoted → confirmed → closed`, and reload to verify persistence.
6. Visit **Visitor activity** for anonymous quote opens, WhatsApp clicks, sources and submission events. Analytics only starts collecting from this version forward; it cannot reconstruct past clicks.

### Update vehicles / pricing / images

1. In `/admin`, choose **Cars & pricing**.
2. Edit vehicle name, category, seating capacity, tag, minimum and maximum indicative rate, or visibility.
3. Upload an authorized JPG, PNG or WebP photo (max **3 MB**) from your Mac. Before uploading, the photo privacy studio lets you drag-select real number plates and pixelate the actual image pixels. Or provide an authorized **HTTPS** image URL.
4. Add up to five alternate-angle photo URLs per car for the rotating showroom. Add another vehicle, remove a vehicle, or toggle whether it is displayed.
5. Click **Save changes**, then refresh the public website. The public fleet and selected vehicle's indicative estimate read the new configuration.

**Images, catalog and enquiries are stored on your Mac** under `.data/`, which is gitignored. Uploaded photo URLs such as `/api/uploads/...` only work while the local CRM server is running.

### Contacts

- WhatsApp and phone: **+91 93400 98177**
- Temporary email: **ktiwari539@gmail.com**

WhatsApp opens a user-controlled external chat; it does **not** guarantee an enquiry record or message has been sent. The local CRM tracks the click, but a customer is identified only when submitting the form.

### Travel content

Road-trip and mountain-drive cards use attributed Wikimedia Commons scenery as **editorial inspiration**. They do not claim the trips were performed by the business, and they are not fabricated customer reviews. Vehicle pictures are still temporary and should be replaced with approved, consistent premium photography before release.

### Important limitations

- Local prototype; not approved for public customer traffic or Netlify backend hosting.
- The CRM uses a single admin token, JSONL event storage, local catalog JSON and image files; production requires real staff accounts and RBAC, a managed DB, protected uploads, audit logs, backups, abuse controls and privacy/retention policies.
- Prices remain **indicative**, with a current 250 km/day minimum and optional driver night-stay allowance. Final pricing, GST and extras require approval. Price editing doesn't currently change the 250 km/day rule.
- Requests do not send staff email notifications automatically. Direct WhatsApp and email links are available for customers.
- The showroom now uses live WebGL rendering and authored procedural 3D vehicle shapes; **exact manufacturer models and photorealism still require licensed GLB assets**. GitHub CI validates code, not appearance or physical-device performance.

## Developer commands

```bash
npm run dev:full  # website and CRM API (set CRM_ADMIN_TOKEN)
npm run dev       # frontend only, not enough for submissions
npm run test:api
npm run check
npm run build
```
