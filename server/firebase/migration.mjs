import { revive } from "./backup.mjs";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { ApiError, hash, plain } from "./repository.mjs";
/** Read-only legacy reconciliation. Malformed JSONL is a hard failure, never silently skipped. */
export function prepareLegacyMigration(directory) {
  const records = new Map(),
    history = [],
    events = [],
    notifications = new Map();
  const lines = (file) =>
    existsSync(resolve(directory, file))
      ? readFileSync(resolve(directory, file), "utf8")
          .split("\n")
          .filter((x) => x.trim())
          .map((line, index) => {
            try {
              return JSON.parse(line);
            } catch {
              throw Error("Invalid " + file + " line " + (index + 1));
            }
          })
      : [];
  for (const [index, event] of lines("enquiries.jsonl").entries()) {
    if (event.type === "created") {
      if (records.has(event.value?.id))
        throw Error("Duplicate created enquiry");
      records.set(event.value.id, {
        ...event.value,
        kind: "enquiry",
        version: 1,
      });
    } else if (["status", "quotation"].includes(event.type)) {
      const record = records.get(event.id);
      if (!record) throw Error("Orphan journal event");
      Object.assign(record, {
        version: record.version + 1,
        updatedAt: event.updatedAt,
        ...(event.type === "status"
          ? { status: event.status }
          : { quote: event.quote, status: "quoted" }),
      });
    } else throw Error("Unknown enquiry event");
    history.push({
      id: "legacy_history_" + String(index).padStart(9, "0"),
      data: { kind: "history", ...event },
    });
  }
  for (const event of lines("notification-events.jsonl")) {
    if (event.type === "created")
      notifications.set(event.item.id, { ...event.item, kind: "notification" });
    else if (event.type === "delivery" && notifications.has(event.id))
      Object.assign(notifications.get(event.id), event.patch);
    else throw Error("Invalid notification journal");
  }
  for (const [index, event] of lines("events.jsonl").entries())
    events.push({
      id: "legacy_event_" + String(index).padStart(9, "0"),
      data: { ...event, kind: "event" },
    });
  const documents = [...records.values()].map((data) => ({
    id: "enquiry_" + data.id,
    data,
  }));
  documents.push(
    ...history,
    ...events,
    ...[...notifications.values()].map((data) => ({
      id: "notification_" + data.id,
      data,
    })),
  );
  const sessions = new Set(events.map((e) => e.data.sessionId).filter(Boolean));
  for (const session of sessions)
    documents.push({
      id: "session_" + hash(session),
      data: { kind: "session" },
    });
  const catalogPath = resolve(directory, "catalog.json");
  if (existsSync(catalogPath))
    documents.push({
      id: "catalog",
      data: {
        ...JSON.parse(readFileSync(catalogPath, "utf8")),
        kind: "catalog",
        version: 1,
      },
    });
  const byStatus = {};
  for (const record of records.values())
    byStatus[record.status] = (byStatus[record.status] || 0) + 1;
  documents.push({
    id: "summary",
    data: { kind: "summary", total: records.size, byStatus },
  });
  const media = [];
  for (const [folder, mime] of [
    ["uploads", ""],
    ["models", "model/gltf-binary"],
  ]) {
    const path = resolve(directory, folder);
    if (!existsSync(path)) continue;
    for (const name of readdirSync(path)) {
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp|glb)$/.test(name))
        throw Error("Unexpected legacy media file");
      const bytes = readFileSync(resolve(path, name));
      media.push({
        key: folder + "/" + name,
        data: bytes.toString("base64"),
        metadata: {
          sha256: hash(bytes),
          mime:
            mime ||
            { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[
              name.split(".").at(-1)
            ],
        },
      });
    }
  }
  return {
    schema: 1,
    documents,
    media,
    counts: {
      enquiries: records.size,
      history: history.length,
      notifications: notifications.size,
      events: events.length,
      media: media.length,
    },
    sha256: hash(JSON.stringify({ documents, media })),
  };
}
export async function importLegacyBatch(runtime, input) {
  if (runtime.env.CRM_MIGRATION_APPROVAL !== "owner-approved")
    throw new ApiError("MIGRATION_APPROVAL_REQUIRED", 403);
  if (
    !Array.isArray(input.documents) ||
    input.documents.length > 200 ||
    !Array.isArray(input.media) ||
    input.media.length > 1
  )
    throw new ApiError("INVALID_MIGRATION_BATCH");
  const allowed = [
    "enquiry",
    "history",
    "event",
    "notification",
    "catalog",
    "summary",
    "session",
  ];
  for (const row of input.documents)
    if (!/^[\w-]{1,200}$/.test(row.id) || !allowed.includes(row.data?.kind))
      throw new ApiError("INVALID_MIGRATION_DOCUMENT");
  const state = runtime.repository.docs.doc("control");
  await runtime.db.runTransaction(async (tx) => {
    const control = (await tx.get(state)).data();
    if (control?.migrationClosed) throw new ApiError("MIGRATION_CLOSED", 403);
    if (!control?.maintenance) throw new ApiError("MAINTENANCE_REQUIRED", 409);
    const refs = input.documents.map((row) =>
        runtime.repository.docs.doc(row.id),
      ),
      existing = refs.length ? await tx.getAll(...refs) : [];
    for (let i = 0; i < existing.length; i++) {
      if (
        existing[i].exists &&
        !isDeepStrictEqual(
          plain(existing[i].data()),
          plain(revive(input.documents[i].data)),
        )
      )
        throw new ApiError("MIGRATION_CONFLICT", 409);
    }
    for (let i = 0; i < refs.length; i++)
      if (!existing[i].exists)
        tx.create(refs[i], revive(input.documents[i].data));
  });
  await runtime.media.restore(input.media);
  return {
    ok: true,
    documents: input.documents.length,
    media: input.media.length,
  };
}
