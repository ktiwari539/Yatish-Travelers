# Mateshwari Travellers

A premium customer-facing travel website and local booking CRM preview, developed in the existing Yatish-Travelers repository.

## Local preview (no Netlify or production deployment)

Requires Node.js 22+.

```bash
npm install
CRM_ADMIN_TOKEN="use-a-unique-long-local-password" npm run dev:full
```

On the same computer open:

- http://localhost:5173 — customer website, cinematic showroom, fleet and trip calculator
- http://localhost:5173/stories — customer stories
- http://localhost:5173/admin — CRM dashboard

For the CRM login, enter the same token you set in `CRM_ADMIN_TOKEN`. The dashboard is hidden from anonymous users, and API access requires the token. **This is not full user-account authentication.**

## Local booking flow

1. Submit a Request Final Quote, Request Callback or corporate enquiry on the homepage.
2. Once the API saves the request, the customer sees a short enquiry reference.
3. Visit `/admin` and enter the token to review, search, filter and update statuses:
   `new → contacted → quoted → confirmed → closed`.
4. Records persist in `.data/enquiries.jsonl` on your computer, excluded from Git.

All submissions stay **local**. No email, WhatsApp message, payment or external CRM record is sent or created. **Do not use the development server for live customer traffic.** For production, replace local JSONL storage and admin-token access with a managed database, staff authentication/roles, backups, spam protection, retention rules and audit logging.

## Development and checks

```bash
npm run check
npm run build
npm run test:api
```

`npm run dev` starts **only the frontend**; for working booking requests you need `npm run dev:full`, or run `npm run api` and `npm run dev` in two terminals.

## Business rules requiring confirmation

Fare calculator pricing is indicative (₹15–₹25/km, minimum 250 km/day). Driver allowance is added only for overnight stays; toll, parking, permits and GST are separate where applicable. Neither exact vehicles nor partner-vehicle availability can be guaranteed without a live fleet inventory backend.

Fleet photos currently use credited reference imagery and should be replaced with approved professional photography before launching.
