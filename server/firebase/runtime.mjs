import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStore } from "@netlify/blobs";
import { identityPolicy } from "../../experiments/firebase/integration/owner-policy.mjs";
import { createFirebaseAdminAuthorizer } from "../../experiments/firebase/firebase-admin-auth.mjs";
import { createCrmRepository } from "./repository.mjs";
import { createMedia } from "./media.mjs";
export function validateCrmConfig(env, context = {}) {
  const emulator = Boolean(
    env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  if (emulator) {
    if (
      env.NETLIFY === "true" ||
      env.CRM_FIREBASE_PROJECT_ID !== "demo-mateshwari-poc" ||
      ![env.FIRESTORE_EMULATOR_HOST, env.FIREBASE_AUTH_EMULATOR_HOST].every(
        (v) => /^127\.0\.0\.1:\d+$/.test(v || ""),
      )
    )
      throw Error(
        "Only both loopback emulators and demo project allowed locally",
      );
  } else if (
    env.NETLIFY !== "true" ||
    context.site?.id !== "20dab8cd-fdc1-4196-937f-7c779661cf47" ||
    context.deploy?.context !== "production" ||
    env.CRM_FIREBASE_PROJECT_ID !== "mateshwari-travellers" ||
    env.CRM_RELEASE_ENABLED !== "true"
  )
    throw Error("Explicit single-project release configuration required");
  if (!/^[a-f0-9]{64}$/.test(env.CRM_RATE_SALT || ""))
    throw Error("Runtime rate salt required");
  if (!/^[a-f0-9]{64}$/.test(env.CRM_BACKUP_KEY || ""))
    throw Error("Runtime backup key required");
  if (!["disabled", "live"].includes(env.CRM_NOTIFICATIONS_MODE || "disabled"))
    throw Error("Invalid notification mode");
  if (
    env.CRM_NOTIFICATIONS_MODE === "live" &&
    env.CRM_NOTIFICATION_APPROVAL !== "owner-approved"
  )
    throw Error("Notification approval required");
  return {
    emulator,
    projectId: env.CRM_FIREBASE_PROJECT_ID,
    backupKey: env.CRM_BACKUP_KEY,
  };
}
export function createRuntime(env, context, { mediaStore, backupStore } = {}) {
  const config = validateCrmConfig(env, context),
    policy = identityPolicy(config.projectId, env.CRM_ADMIN_UIDS);
  // Privileged credentials are consumed only inside the provider runtime.
  const credential = !config.emulator
    ? env.FIREBASE_PRIVATE_KEY
      ? cert({
          projectId: config.projectId,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        })
      : applicationDefault()
    : undefined;
  const app =
    getApps().find((a) => a.name === "mateshwari-crm") ||
    initializeApp(
      { projectId: config.projectId, ...(credential ? { credential } : {}) },
      "mateshwari-crm",
    );
  const db = getFirestore(app),
    auth = getAuth(app);
  const repository = createCrmRepository(db, {
    timestamp: () => FieldValue.serverTimestamp(),
    rateSalt: env.CRM_RATE_SALT,
    businessEmail: env.CRM_EMAIL_TO,
    businessWhatsApp: env.CRM_WHATSAPP_TO,
  });
  const authorize = createFirebaseAdminAuthorizer({
    verifyIdToken: (token, revoked) => auth.verifyIdToken(token, revoked),
    ...policy,
  });
  const media = createMedia(
    mediaStore ||
      getStore({ name: "mateshwari-crm-media", consistency: "strong" }),
    repository,
  );
  return {
    ...config,
    db,
    auth,
    repository,
    authorize,
    media,
    backups:
      backupStore ||
      getStore({ name: "mateshwari-crm-backups", consistency: "strong" }),
    notificationConfig: {
      mode: env.CRM_NOTIFICATIONS_MODE || "disabled",
      businessEmail: env.CRM_EMAIL_TO || "",
      businessWhatsApp: env.CRM_WHATSAPP_TO || "",
      emailReady: Boolean(env.RESEND_API_KEY && env.CRM_EMAIL_FROM),
      whatsappReady: Boolean(
        env.WHATSAPP_BUSINESS_TOKEN &&
          env.WHATSAPP_PHONE_NUMBER_ID &&
          env.WHATSAPP_TEMPLATE_NAME,
      ),
    },
    env,
  };
}
