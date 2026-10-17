# Email and WhatsApp integration — future activation guide

This is a **local development preview**. It records notification jobs and message bodies in the protected CRM outbox, but does not deliver messages by default.

## What is already implemented

1. Customer completes quote/callback/corporate form and it is saved with a reference.
2. Backend creates outbox entries for the business email and business WhatsApp number. If a valid customer email was provided, a customer acknowledgement email is also prepared.
3. Admin opens `/admin` → **Enquiries & follow-ups**, enters a final quote amount and terms, and chooses **Save quotation & prepare notifications**.
4. Backend persists quote amount and notes, then prepares a branded HTML/text quotation email for customer and a business copy, plus a WhatsApp business notification.
5. `/admin` → **Email & WhatsApp outbox** shows actual job states: `preview`, `needs_configuration`, `sent`, or `failed`.

**Meaning of `sent`:** a provider accepted an API request; it does not mean the recipient read the email or WhatsApp message.

## Local testing without external delivery

```bash
CRM_ADMIN_TOKEN="YOUR_SECRET" CRM_NOTIFICATIONS_MODE=preview npm run dev:full
npm run test:api
```

The default mode is `preview`. In preview mode, the backend never calls an email or WhatsApp provider, even if credentials happen to be present in the environment. Do not paste tokens into chat or check them into Git.

## Email adapter — Resend

Once you have a verified sending domain, set these variables **locally and securely**:

- `RESEND_API_KEY` — scoped API key from your email provider
- `CRM_EMAIL_FROM` — verified sender, e.g. `bookings@yourdomain.com`
- `CRM_EMAIL_TO` — admin/business copy; default `ktiwari539@gmail.com`

The backend sends two distinct kinds of email: acknowledgement after form submission and the **staff-approved quotation** after a quote amount is recorded. Sending failures are stored in the outbox.

## WhatsApp — Meta WhatsApp Cloud API

A standard WhatsApp personal number and a `wa.me` link **cannot** send unattended messages. The WhatsApp Cloud API requires a WhatsApp Business Platform account, phone-number ID, API token, approved recipient and a pre-approved message template for business-initiated notifications.

Later configure:

- `WHATSAPP_BUSINESS_TOKEN` — secure Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID` — configured business phone-number ID
- `WHATSAPP_TEMPLATE_NAME` — **approved** template name
- `WHATSAPP_TEMPLATE_LANG` — matching approved template language, default `en`
- `CRM_WHATSAPP_TO` — business recipient in international digits, default `919340098177`

The adapter expects an approved body template with **one** text parameter (the enquiry reference). Other approved template layouts require adapting the message payload. No customer WhatsApp messages are automated in this version; the default notification recipient is the business number. Users can still start their own conversation through the visible WhatsApp button.

## Explicit activation — not part of this review

Only after consent, business account verification, provider test accounts and production approval:

```bash
CRM_NOTIFICATIONS_MODE=live CRM_ADMIN_TOKEN="YOUR_SECRET" ... npm run dev:full
```

Never enable `live` with real customer records until end-to-end deliverability testing passes. Automatic sends and staff quotation sends **will** call external providers in live mode.

## Production gates

- Managed database with durable outbox and idempotent retry worker; single-file JSONL is not production-grade.
- Real staff authentication/roles, TLS, privacy notices, opt-in/consent records, audit logs, backups and retention.
- Validated per-model rates and server-side price calculation; detailed GST, route, cancellation and refund policy.
- Delivery webhooks for genuine delivered/bounced/read states instead of assuming acceptance means delivered.
- Template approval and sender reputation/domain verification; rate limits and abuse prevention.
- Fully sanitized/approved vehicle imagery and published image licenses.

## Photo privacy workflow

In **Cars & pricing** choose a vehicle → **Upload / edit vehicle photo** → drag a rectangle around the actual registration plate → **Pixelate selected area** → repeat for any other sensitive region → **Save sanitized photo** → **Save fleet & pricing**. This alters the image pixels in a local copy; no grey overlay is drawn on the live page.

Existing reference Wikimedia photos are still **not** guaranteed plate-free until visually reviewed or replaced with sanitized approved photographs. The upgraded car portraits are representative model photographs, not actual vehicles available for immediate hire.
