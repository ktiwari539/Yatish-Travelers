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
- The showroom uses layered CSS perspective and scroll-based transitions, **not actual 3D car models**.

## Developer commands

```bash
npm run dev:full  # website and CRM API (set CRM_ADMIN_TOKEN)
npm run dev       # frontend only, not enough for submissions
npm run test:api
npm run check
npm run build
```
