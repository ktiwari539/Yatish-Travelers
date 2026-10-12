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
