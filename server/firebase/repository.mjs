import { createHash, createHmac, randomUUID } from "node:crypto";
import {
  defaultCatalog,
  validateVehicle,
  withDisplayOrder,
  isKnownPlateBearingSource,
} from "../catalog.mjs";
import { SUPPORTED_MODELS } from "../fleet-photo-import.mjs";
import { normalize } from "../../experiments/firebase/integration/repository.mjs";
export class ApiError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const statuses = ["new", "contacted", "quoted", "confirmed", "closed"];
export const eventNames = [
  "quote_open",
  "callback_open",
  "corporate_open",
  "whatsapp_click",
  "email_click",
  "vehicle_explore",
  "quote_submit",
];
export const text = (v, n = 100) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
export function plain(value) {
  if (value == null) return value;
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, plain(v)]),
    );
  return value;
}
const checkVersion = (current, expected) => {
  if (!Number.isInteger(expected) || expected !== current)
    throw new ApiError("VERSION_CONFLICT_RELOAD", 409);
};
export function createCrmRepository(
  db,
  {
    timestamp,
    rateSalt,
    now = () => Date.now(),
    businessEmail = "",
    businessWhatsApp = "",
  } = {},
) {
  const docs = db.collection("mt_crm");
  const ref = (id) => docs.doc(id);
  const stateRef = ref("control"),
    catalogRef = ref("catalog");
  const initialCatalog = {
    kind: "catalog",
    catalogVersion: 2,
    version: 0,
    vehicles: withDisplayOrder(
      defaultCatalog.map((v) => ({
        ...v,
        ...(SUPPORTED_MODELS[v.name] || {}),
      })),
    ),
    updatedAt: null,
  };
  const stamp = () => timestamp();
  async function writable(tx) {
    const state = (await tx.get(stateRef)).data();
    if (state?.maintenance) throw new ApiError("MAINTENANCE", 503);
  }
  async function rate(tx, ip, bucket, max) {
    if (!ip || typeof ip !== "string")
      throw new ApiError("CLIENT_CONTEXT_REQUIRED", 503);
    const key =
      "limit_" +
      hash(bucket + Math.floor(now() / 60000)) +
      "_" +
      createHmac("sha256", rateSalt).update(ip).digest("hex");
    const globalRef = ref(
        "daily_" + bucket + "_" + new Date(now()).toISOString().slice(0, 10),
      ),
      global = (await tx.get(globalRef)).data()?.count || 0;
    const cap = { admin: 600, events: 1000, enquiry: 100 }[bucket] || 600;
    if (global >= cap) throw new ApiError("DAILY_BUDGET_EXHAUSTED", 429);
    const r = ref(key),
      s = (await tx.get(r)).data();
    if ((s?.count || 0) >= max) throw new ApiError("RATE_LIMITED", 429);
    // Caller must perform all reads before applying these writes.
    return () => {
      tx.set(r, {
        kind: "limit",
        count: (s?.count || 0) + 1,
        expiresAt: new Date(now() + 86400000),
      });
      tx.set(globalRef, {
        kind: "limit",
        count: global + 1,
        expiresAt: new Date(now() + 172800000),
      });
    };
  }
  function jobs(record, quote) {
    const targets = [
      ["email", businessEmail, quote ? "confirmed_quote" : "new_enquiry"],
      ["whatsapp", businessWhatsApp, quote ? "confirmed_quote" : "new_enquiry"],
    ];
    if (record.email)
      targets.push([
        "email",
        record.email,
        quote ? "confirmed_quote" : "acknowledgement",
      ]);
    return targets
      .filter(([, to]) => to)
      .map(([channel, recipient, purpose]) => ({
        kind: "notification",
        id: randomUUID(),
        enquiryId: record.id,
        channel,
        recipient,
        purpose,
        status: "preview",
        detail: "Saved durably. External delivery disabled.",
        createdAt: stamp(),
        quote: quote || null,
      }));
  }
  const delivery = (items) =>
    items.map(({ channel, purpose, status }) => ({ channel, purpose, status }));
  return {
    db,
    docs,
    async guard(ip, bucket = "admin", max = 40) {
      await db.runTransaction(async (tx) => {
        const write = await rate(tx, ip, bucket, max);
        write();
      });
    },
    async catalog() {
      const s = await catalogRef.get();
      const c = s.exists ? plain(s.data()) : initialCatalog;
      return {
        ...c,
        vehicles: c.vehicles.map((v) =>
          isKnownPlateBearingSource(v.name, v.image)
            ? { ...v, ...(SUPPORTED_MODELS[v.name] || {}) }
            : v,
        ),
      };
    },
    async saveCatalog(input) {
      return db
        .runTransaction(async (tx) => {
          await writable(tx);
          const old = (await tx.get(catalogRef)).data() || initialCatalog;
          checkVersion(old.version, input.expectedVersion);
          if (!Array.isArray(input.vehicles) || input.vehicles.length > 80)
            throw new ApiError("INVALID_CATALOG");
          let vehicles;
          try {
            vehicles = input.vehicles.map((v) =>
              validateVehicle(
                v,
                old.vehicles.find((x) => x.id === v.id),
              ),
            );
          } catch {
            throw new ApiError("INVALID_VEHICLE");
          }
          if (
            new Set(vehicles.map((v) => v.name.toLowerCase())).size !==
            vehicles.length
          )
            throw new ApiError("DUPLICATE_VEHICLE");
          const value = {
            kind: "catalog",
            catalogVersion: 2,
            version: old.version + 1,
            vehicles: withDisplayOrder(vehicles),
            updatedAt: stamp(),
          };
          tx.set(catalogRef, value);
          return value;
        })
        .then(() => this.catalog());
    },
    async create(input, key, ip, { manual = false } = {}) {
      if (typeof key !== "string" || !/^[\w-]{16,100}$/.test(key))
        throw new ApiError("IDEMPOTENCY_KEY_REQUIRED");
      let value;
      try {
        value = normalize({
          ...input,
          ...(manual ? { mode: "callback" } : {}),
        });
      } catch {
        throw new ApiError("INVALID_ENQUIRY");
      }
      value = {
        ...value,
        sessionId: /^[\w-]{8,80}$/.test(input.sessionId || "")
          ? input.sessionId
          : "",
        source: text(input.source, 80) || (manual ? "staff-manual" : "website"),
      };
      const requestHash = hash(JSON.stringify(value)),
        keyRef = ref("request_" + hash("enquiry:" + key)),
        id = randomUUID();
      return db.runTransaction(async (tx) => {
        await writable(tx);
        const existing = (await tx.get(keyRef)).data();
        if (existing) {
          if (existing.requestHash !== requestHash)
            throw new ApiError("IDEMPOTENCY_CONFLICT", 409);
          return { ...existing.result, replay: true };
        }
        const c = (await tx.get(catalogRef)).data() || initialCatalog;
        const counters = (await tx.get(ref("summary"))).data() || {
          kind: "summary",
          total: 0,
          byStatus: {},
        };
        const dayRef = ref(
            "budget_" + new Date(now()).toISOString().slice(0, 10),
          ),
          daily = (await tx.get(dayRef)).data()?.count || 0;
        if (daily >= 100) throw new ApiError("DAILY_BUDGET_EXHAUSTED", 429);
        const writeRate = await rate(tx, ip, "enquiry", 8);
        const car = c.vehicles.find(
          (v) => v.enabled && v.name === value.vehicle,
        );
        if (car) {
          const distance = Math.max(value.distanceKm, value.days * 250),
            allowance = value.nightStay ? 500 : 0;
          value = {
            ...value,
            estimatedMin: distance * car.rateMin + allowance,
            estimatedMax: distance * car.rateMax + allowance,
          };
        }
        const record = {
          ...value,
          id,
          kind: "enquiry",
          status: "new",
          version: 1,
          createdAt: stamp(),
          updatedAt: stamp(),
        };
        const notifications = manual ? [] : jobs(record),
          result = {
            id,
            status: "new",
            version: 1,
            delivery: delivery(notifications),
          };
        writeRate();
        tx.set(dayRef, { kind: "budget", count: daily + 1 });
        tx.create(ref("enquiry_" + id), record);
        tx.set(ref("summary"), {
          ...counters,
          total: counters.total + 1,
          byStatus: {
            ...counters.byStatus,
            new: (counters.byStatus.new || 0) + 1,
          },
        });
        if (!manual) {
          tx.create(ref("event_" + id), {
            kind: "event",
            event: "quote_submit",
            sessionId: record.sessionId,
            source: record.source,
            vehicle: record.vehicle,
            createdAt: stamp(),
          });
          if (record.sessionId)
            tx.set(ref("session_" + hash(record.sessionId)), {
              kind: "session",
            });
        }
        tx.create(keyRef, { kind: "idempotency", requestHash, result });
        for (const n of notifications)
          tx.create(ref("notification_" + n.id), n);
        tx.create(ref("history_" + randomUUID()), {
          kind: "history",
          enquiryId: id,
          event: "created",
          createdAt: stamp(),
          value: record,
        });
        return result;
      });
    },
    async list(kind, cursor = "", limit = 100) {
      if (!/^[\w-]{0,180}$/.test(cursor)) throw new ApiError("INVALID_CURSOR");
      let q = docs
        .where("kind", "==", kind)
        .orderBy("__name__")
        .limit(limit + 1);
      if (cursor) q = q.startAfter(cursor);
      const s = await q.get(),
        more = s.docs.length > limit,
        selected = s.docs.slice(0, limit);
      return {
        items: selected.map((d) => plain(d.data())),
        nextCursor: more ? selected.at(-1).id : null,
      };
    },
    async get(id) {
      if (!/^[\w-]{1,100}$/.test(id)) throw new ApiError("INVALID_ID");
      return plain((await ref("enquiry_" + id).get()).data() || null);
    },
    async update(id, input, kind) {
      if (!/^[\w-]{1,100}$/.test(id)) throw new ApiError("INVALID_ID");
      if (kind === "status" && !statuses.includes(input.status))
        throw new ApiError("INVALID_STATUS");
      if (
        kind === "quotation" &&
        (!Number.isFinite(input.amount) ||
          input.amount <= 0 ||
          input.amount > 1e7)
      )
        throw new ApiError("INVALID_AMOUNT");
      const quoteId = randomUUID();
      await db.runTransaction(async (tx) => {
        await writable(tx);
        const r = ref("enquiry_" + id),
          old = (await tx.get(r)).data();
        if (!old) throw new ApiError("NOT_FOUND", 404);
        checkVersion(old.version, input.expectedVersion);
        const counts = (await tx.get(ref("summary"))).data() || {
          kind: "summary",
          total: 0,
          byStatus: {},
        };
        const status = kind === "status" ? input.status : "quoted";
        const quote =
          kind === "quotation"
            ? {
                id: quoteId,
                amount: input.amount,
                notes: text(input.notes, 900),
                createdAt: stamp(),
              }
            : null;
        tx.update(r, {
          status,
          updatedAt: stamp(),
          version: old.version + 1,
          ...(quote ? { quote } : {}),
        });
        if (old.status !== status)
          tx.set(ref("summary"), {
            ...counts,
            byStatus: {
              ...counts.byStatus,
              [old.status]: Math.max(0, (counts.byStatus[old.status] || 0) - 1),
              [status]: (counts.byStatus[status] || 0) + 1,
            },
          });
        tx.create(ref("history_" + randomUUID()), {
          kind: "history",
          enquiryId: id,
          event: kind,
          version: old.version + 1,
          createdAt: stamp(),
          ...(quote ? { quote } : { status }),
        });
        if (quote)
          for (const n of jobs(old, quote))
            tx.create(ref("notification_" + n.id), n);
      });
      const record = await this.get(id);
      return kind === "quotation"
        ? {
            quote: record.quote,
            version: record.version,
            delivery: delivery(jobs(record, record.quote)),
          }
        : record;
    },
    async event(input, ip) {
      if (!eventNames.includes(input.event))
        throw new ApiError("INVALID_EVENT");
      const entry = {
        kind: "event",
        id: randomUUID(),
        event: input.event,
        vehicle: text(input.vehicle, 80),
        source: text(input.source, 80),
        sessionId: /^[\w-]{8,80}$/.test(input.sessionId || "")
          ? input.sessionId
          : "",
        createdAt: stamp(),
      };
      await db.runTransaction(async (tx) => {
        await writable(tx);
        const write = await rate(tx, ip, "events", 30);
        write();
        tx.create(ref("event_" + entry.id), entry);
        if (entry.sessionId)
          tx.set(ref("session_" + hash(entry.sessionId)), { kind: "session" });
      });
      return { ok: true };
    },
    async engagement() {
      const s = await docs
        .where("kind", "==", "event")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      const total = (
        await docs.where("kind", "==", "event").count().get()
      ).data().count;
      const counts = Object.fromEntries(
        await Promise.all(
          eventNames.map(async (event) => [
            event,
            (
              await docs
                .where("kind", "==", "event")
                .where("event", "==", event)
                .count()
                .get()
            ).data().count,
          ]),
        ),
      );
      const sessions = await docs.where("kind", "==", "session").count().get();
      return {
        total,
        counts,
        sessions: sessions.data().count,
        recent: s.docs.map((d) => plain(d.data())),
      };
    },
    async summary() {
      return {
        ...((await ref("summary").get()).data() || { total: 0, byStatus: {} }),
        engagement: await this.engagement(),
      };
    },
    async maintenance(enabled) {
      await stateRef.set(
        { kind: "control", maintenance: enabled, updatedAt: stamp() },
        { merge: true },
      );
    },
    async cleanup() {
      const s = await docs
        .where("expiresAt", "<", new Date(now()))
        .limit(400)
        .get();
      let deleted = 0;
      const batch = db.batch();
      for (const doc of s.docs) {
        const expiry = doc.data().expiresAt;
        const time = expiry?.toDate
          ? expiry.toDate().getTime()
          : Date.parse(expiry);
        if (time < now()) {
          batch.delete(doc.ref);
          deleted++;
        }
      }
      await batch.commit();
      return { deleted, scanLimit: 400 };
    },
    async snapshot() {
      return db.runTransaction(
        async (tx) => {
          const s = await tx.get(docs);
          return s.docs.map((d) => ({ id: d.id, data: plain(d.data()) }));
        },
        { readOnly: true },
      );
    },
  };
}
