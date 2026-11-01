import { ApiError } from "./repository.mjs";
/** Explicit owner-approved dispatch only. No scheduler, background sends or automatic retries. */
export async function dispatchNotification(runtime, id) {
  const env = runtime.env;
  if (
    env.CRM_NOTIFICATIONS_MODE !== "live" ||
    env.CRM_NOTIFICATION_APPROVAL !== "owner-approved"
  )
    throw new ApiError("NOTIFICATIONS_DISABLED", 403);
  const ref = runtime.repository.docs.doc("notification_" + id);
  const job = await runtime.db.runTransaction(async (tx) => {
    const control = (
      await tx.get(runtime.repository.docs.doc("control"))
    ).data();
    if (control?.maintenance) throw new ApiError("MAINTENANCE", 503);
    const doc = await tx.get(ref);
    if (!doc.exists) throw new ApiError("NOT_FOUND", 404);
    const value = doc.data();
    if (value.status !== "preview")
      throw new ApiError("ALREADY_ATTEMPTED_RECONCILE_PROVIDER", 409);
    if (
      value.channel === "email" &&
      (!env.RESEND_API_KEY || !env.CRM_EMAIL_FROM)
    )
      throw new ApiError("EMAIL_NOT_CONFIGURED", 503);
    if (
      value.channel === "whatsapp" &&
      (!env.WHATSAPP_BUSINESS_TOKEN ||
        !env.WHATSAPP_PHONE_NUMBER_ID ||
        !env.WHATSAPP_TEMPLATE_NAME ||
        !env.WHATSAPP_GRAPH_VERSION)
    )
      throw new ApiError("WHATSAPP_NOT_CONFIGURED", 503);
    tx.update(ref, {
      status: "sending",
      attemptedAt: new Date().toISOString(),
      detail: "One attempt reserved. Reconcile provider before any retry.",
    });
    return value;
  });
  const record = await runtime.repository.get(job.enquiryId),
    reference = job.enquiryId.slice(0, 8).toUpperCase();
  const message = [
    "Mateshwari Travellers",
    "Reference: " + reference,
    "Customer: " + record.name,
    record.pickup + " → " + record.destination,
    job.quote
      ? "Quotation: ₹" + job.quote.amount
      : "Enquiry received. Staff will confirm availability.",
    "This is not a confirmed booking.",
  ].join("\n");
  let outcome;
  try {
    const response =
      job.channel === "email"
        ? await fetch("https://api.resend.com/emails", {
            method: "POST",
            signal: AbortSignal.timeout(10000),
            headers: {
              Authorization: "Bearer " + env.RESEND_API_KEY,
              "Content-Type": "application/json",
              "Idempotency-Key": job.id,
            },
            body: JSON.stringify({
              from: env.CRM_EMAIL_FROM,
              to: [job.recipient],
              subject: "Mateshwari Travellers — " + reference,
              text: message,
            }),
          })
        : await fetch(
            "https://graph.facebook.com/" +
              encodeURIComponent(env.WHATSAPP_GRAPH_VERSION) +
              "/" +
              encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID) +
              "/messages",
            {
              method: "POST",
              signal: AbortSignal.timeout(10000),
              headers: {
                Authorization: "Bearer " + env.WHATSAPP_BUSINESS_TOKEN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: job.recipient,
                type: "template",
                template: {
                  name: env.WHATSAPP_TEMPLATE_NAME,
                  language: { code: env.WHATSAPP_TEMPLATE_LANG || "en" },
                  components: [
                    {
                      type: "body",
                      parameters: [{ type: "text", text: reference }],
                    },
                  ],
                },
              }),
            },
          );
    const result = await response.json().catch(() => ({}));
    outcome = response.ok
      ? {
          status: "accepted",
          providerId: result.id || result.messages?.[0]?.id || "",
          detail: "Provider accepted; inbox/device delivery is not confirmed.",
        }
      : {
          status: "failed",
          detail: "Provider rejected request. Reconcile before retry.",
        };
  } catch {
    outcome = {
      status: "unknown",
      detail:
        "Network outcome unknown. Reconcile provider before retry; no automatic resend.",
    };
  }
  await ref.update(outcome);
  return { id, ...outcome };
}
