import { Timestamp } from "firebase-admin/firestore";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ApiError, hash } from "./repository.mjs";
export function seal(value, key) {
  if (!/^[a-f0-9]{64}$/.test(key || ""))
    throw new ApiError("BACKUP_KEY_REQUIRED", 503);
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  return Buffer.from(
    JSON.stringify({
      format: 1,
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
      sha256: hash(payload),
      data: payload.toString("base64"),
    }),
  );
}
export function unseal(bytes, key) {
  const v = JSON.parse(Buffer.from(bytes).toString());
  if (v.format !== 1 || hash(Buffer.from(v.data, "base64")) !== v.sha256)
    throw new ApiError("CORRUPT_BACKUP");
  const c = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(v.iv, "hex"),
  );
  c.setAuthTag(Buffer.from(v.tag, "hex"));
  return JSON.parse(
    Buffer.concat([
      c.update(Buffer.from(v.data, "base64")),
      c.final(),
    ]).toString(),
  );
}
export async function createBackup(runtime) {
  const control = (await runtime.repository.docs.doc("control").get()).data();
  if (!control?.maintenance) throw new ApiError("MAINTENANCE_REQUIRED", 409);
  const documents = (await runtime.repository.snapshot()).filter(
      (row) => row.data.kind !== "limit",
    ),
    media = await runtime.media.export();
  const value = {
    schema: 1,
    project: runtime.projectId,
    createdAt: new Date().toISOString(),
    documents,
    media,
  };
  const bytes = seal(value, runtime.backupKey),
    id = "backup-" + Date.now() + "-" + hash(bytes).slice(0, 12) + ".json";
  await runtime.backups.set(id, bytes, { metadata: { sha256: hash(bytes) } });
  const saved = await runtime.backups.get(id, { type: "arrayBuffer" });
  if (!saved || hash(Buffer.from(saved)) !== hash(bytes))
    throw new ApiError("BACKUP_WRITE_FAILED", 503);
  return {
    id,
    documents: documents.length,
    media: media.length,
    sha256: hash(bytes),
    bytes: bytes.length,
  };
}
export async function restoreBackup(
  runtime,
  bytes,
  { emulatorOnly = true } = {},
) {
  if (emulatorOnly && !runtime.emulator)
    throw new ApiError("OFFLINE_RESTORE_ONLY", 403);
  const value = unseal(bytes, runtime.backupKey);
  if (
    value.schema !== 1 ||
    !Array.isArray(value.documents) ||
    !Array.isArray(value.media)
  )
    throw new ApiError("INVALID_BACKUP");
  const control = (await runtime.repository.docs.doc("control").get()).data();
  if (!control?.maintenance) throw new ApiError("MAINTENANCE_REQUIRED", 409);
  if (!runtime.emulator && value.project !== runtime.projectId)
    throw new ApiError("PROJECT_MISMATCH");
  // Empty target only. Never silently overwrite records newer than a snapshot.
  const existing = await runtime.repository.docs.get();
  if (
    existing.docs.some((d) => d.id !== "control" && d.data().kind !== "limit")
  )
    throw new ApiError("RESTORE_TARGET_NOT_EMPTY", 409);
  for (const row of value.documents)
    if (!/^[\w-]{1,200}$/.test(row.id) || !row.data?.kind)
      throw new ApiError("INVALID_BACKUP_DOCUMENT");
  await runtime.media.restore(value.media);
  for (let offset = 0; offset < value.documents.length; offset += 400) {
    const batch = runtime.db.batch();
    for (const row of value.documents.slice(offset, offset + 400)) {
      if (row.id === "control") continue;
      batch.create(runtime.repository.docs.doc(row.id), revive(row.data));
    }
    await batch.commit();
  }
  return {
    documents: value.documents.length,
    media: value.media.length,
    maintenance: true,
  };
}

export function revive(value, key = "") {
  if (
    typeof value === "string" &&
    /At$/.test(key) &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value))
  )
    return Timestamp.fromDate(new Date(value));
  if (Array.isArray(value)) return value.map((v) => revive(v));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, revive(v, k)]),
    );
  return value;
}
