import sharp from "sharp";
import { unzipSync } from "fflate";
import { randomUUID } from "node:crypto";
import { ApiError, hash } from "./repository.mjs";
import {
  MEDIA_FILES,
  REQUIRED_ZIP_SHA256,
  SUPPORTED_MODELS,
} from "../fleet-photo-import.mjs";
export function decodeBase64(value, max) {
  if (
    typeof value !== "string" ||
    value.length > Math.ceil(max / 3) * 4 ||
    !value.length ||
    value.length % 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    throw new ApiError("INVALID_UPLOAD");
  const data = Buffer.from(value, "base64");
  if (data.length > max || data.toString("base64") !== value)
    throw new ApiError("INVALID_UPLOAD");
  return data;
}
export function validateGlb(file) {
  if (
    file.length < 28 ||
    file.length > 8e6 ||
    file.toString("ascii", 0, 4) !== "glTF" ||
    file.readUInt32LE(4) !== 2 ||
    file.readUInt32LE(8) !== file.length
  )
    throw new ApiError("INVALID_GLB");
  const length = file.readUInt32LE(12);
  if (
    length > 1e6 ||
    20 + length > file.length ||
    file.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new ApiError("INVALID_GLB");
  let meta;
  try {
    meta = JSON.parse(file.subarray(20, 20 + length).toString());
  } catch {
    throw new ApiError("INVALID_GLB");
  }
  if (
    meta.asset?.version !== "2.0" ||
    !meta.meshes?.length ||
    [...(meta.buffers || []), ...(meta.images || [])].some(
      (x) => x.uri && !x.uri.startsWith("data:"),
    )
  )
    throw new ApiError("EXTERNAL_GLB_RESOURCE");
}
export function createMedia(store, repository) {
  async function put(key, data, mime) {
    await store.set(key, data, {
      metadata: { mime, sha256: hash(data), createdAt: Date.now() },
    });
    const saved = await store.get(key, { type: "arrayBuffer" });
    if (!saved || hash(Buffer.from(saved)) !== hash(data))
      throw new ApiError("MEDIA_WRITE_FAILED", 503);
  }
  return {
    async image(input) {
      const bytes = decodeBase64(input.data, 3e6);
      if (!["image/jpeg", "image/png", "image/webp"].includes(input.mime))
        throw new ApiError("INVALID_IMAGE");
      let safe;
      try {
        safe = await sharp(bytes, { limitInputPixels: 24e6, animated: false })
          .rotate()
          .resize({
            width: 1920,
            height: 1440,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 88 })
          .toBuffer();
      } catch {
        throw new ApiError("INVALID_IMAGE");
      }
      const key = "uploads/" + randomUUID() + ".webp";
      await put(key, safe, "image/webp");
      return { url: "/api/" + key };
    },
    async chunk(input, uid) {
      if (
        !/^[\w-]{16,80}$/.test(input.uploadId || "") ||
        !Number.isInteger(input.index) ||
        !Number.isInteger(input.total) ||
        input.total < 1 ||
        input.total > 40 ||
        input.index < 0 ||
        input.index >= input.total
      )
        throw new ApiError("INVALID_CHUNK");
      const data = decodeBase64(input.data, 1500000);
      await put(
        "chunks/" + uid + "/" + input.uploadId + "/" + input.index,
        data,
        "application/octet-stream",
      );
      return { ok: true };
    },
    async model(input, uid, { legacy = false } = {}) {
      let bytes;
      if (input.uploadId) {
        if (
          !/^[\w-]{16,80}$/.test(input.uploadId) ||
          !Number.isInteger(input.total) ||
          input.total < 1 ||
          input.total > 40
        )
          throw new ApiError("INVALID_UPLOAD");
        const chunks = [];
        let size = 0;
        for (let i = 0; i < input.total; i++) {
          const b = await store.get(
            "chunks/" + uid + "/" + input.uploadId + "/" + i,
            { type: "arrayBuffer" },
          );
          if (!b) throw new ApiError("MISSING_CHUNK");
          size += b.byteLength;
          if (size > 8e6) throw new ApiError("UPLOAD_TOO_LARGE", 413);
          chunks.push(Buffer.from(b));
        }
        bytes = Buffer.concat(chunks);
      } else bytes = decodeBase64(input.data, 3e6);
      validateGlb(bytes);
      if (legacy && !/^[a-f0-9-]{36}\.glb$/.test(input.legacyName || ""))
        throw new ApiError("INVALID_LEGACY_MODEL");
      const key =
        "models/" + (legacy ? input.legacyName : randomUUID() + ".glb");
      const existing = await store.get(key, { type: "arrayBuffer" });
      if (existing && hash(Buffer.from(existing)) !== hash(bytes))
        throw new ApiError("MEDIA_CONFLICT", 409);
      await put(key, bytes, "model/gltf-binary");
      if (input.uploadId)
        for (let i = 0; i < input.total; i++)
          await store.delete("chunks/" + uid + "/" + input.uploadId + "/" + i);
      return { url: "/api/" + key };
    },
    async read(path) {
      if (
        !/^(uploads\/[a-f0-9-]{36}\.(jpg|png|webp)|models\/[a-f0-9-]{36}\.glb|reviewed-media\/[\w-]+\.webp)$/.test(
          path,
        )
      )
        throw new ApiError("NOT_FOUND", 404);
      const entry = await store.getWithMetadata(path, { type: "arrayBuffer" });
      if (!entry) return null;
      const bytes = Buffer.from(entry.data);
      if (hash(bytes) !== entry.metadata.sha256)
        throw new ApiError("MEDIA_INTEGRITY_FAILED", 503);
      return new Response(bytes, {
        headers: {
          "Content-Type": entry.metadata.mime,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
        },
      });
    },
    async status() {
      const catalog = await repository.catalog(),
        missing = [],
        invalid = [];
      for (const [path, expected] of Object.entries(MEDIA_FILES)) {
        const key = "reviewed-media/" + path.split("/").at(-1),
          file = await store.get(key, { type: "arrayBuffer" });
        if (!file) missing.push("/" + path.replace(/^public\//, ""));
        else if (hash(Buffer.from(file)) !== expected) invalid.push(path);
      }
      const modelLinks = Object.entries(SUPPORTED_MODELS).map(
        ([name, photos]) => {
          const v = catalog.vehicles.find((x) => x.name === name);
          return {
            name,
            present: Boolean(v),
            matches:
              v?.image === photos.image &&
              JSON.stringify(v.gallery || []) ===
                JSON.stringify(photos.gallery),
            persistedMatches:
              v?.image === photos.image &&
              JSON.stringify(v.gallery || []) ===
                JSON.stringify(photos.gallery),
          };
        },
      );
      return {
        ready: !missing.length && !invalid.length,
        installed: 7 - missing.length - invalid.length,
        total: 7,
        missing,
        invalid,
        modelLinks,
        catalogApplied: modelLinks.every((x) => x.matches),
        persistedCatalogApplied: modelLinks.every((x) => x.persistedMatches),
      };
    },
    async import(input) {
      if (input.confirmReplace !== true)
        throw new ApiError("CONFIRM_REPLACEMENT");
      const zip = decodeBase64(input.zipBase64, 1800000);
      if (hash(zip) !== REQUIRED_ZIP_SHA256)
        throw new ApiError("UNAPPROVED_ARCHIVE");
      const files = unzipSync(zip);
      for (const [path, expected] of Object.entries(MEDIA_FILES)) {
        if (!files[path] || hash(files[path]) !== expected)
          throw new ApiError("INVALID_PHOTO_PACK");
      }
      for (const path of Object.keys(MEDIA_FILES))
        await put(
          "reviewed-media/" + path.split("/").at(-1),
          files[path],
          "image/webp",
        );
      const old = await repository.catalog();
      await repository.saveCatalog({
        expectedVersion: input.expectedVersion,
        vehicles: old.vehicles.map((v) => ({
          ...v,
          ...(SUPPORTED_MODELS[v.name] || {}),
        })),
      });
      return { ok: true, installed: 7, applied: Object.keys(SUPPORTED_MODELS) };
    },
    async export() {
      const { blobs } = await store.list();
      const files = [];
      for (const { key } of blobs) {
        if (!/^(uploads|models|reviewed-media)\//.test(key)) continue;
        const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
        files.push({
          key,
          metadata: entry.metadata,
          data: Buffer.from(entry.data).toString("base64"),
        });
      }
      return files;
    },
    async cleanup() {
      const { blobs } = await store.list({ prefix: "chunks/" });
      let chunksDeleted = 0;
      for (const { key } of blobs.slice(0, 200)) {
        const meta = await store.getMetadata(key);
        if (meta?.metadata?.createdAt < Date.now() - 86400000) {
          await store.delete(key);
          chunksDeleted++;
        }
      }
      return { chunksDeleted };
    },
    async restore(files) {
      for (const file of files) {
        if (!/^(uploads|models|reviewed-media)\/[\w.-]+$/.test(file.key))
          throw new ApiError("INVALID_BACKUP_MEDIA");
        const data = Buffer.from(file.data, "base64");
        if (hash(data) !== file.metadata.sha256)
          throw new ApiError("INVALID_BACKUP_MEDIA");
        const existing = await store.get(file.key, { type: "arrayBuffer" });
        if (existing && hash(Buffer.from(existing)) !== hash(data))
          throw new ApiError("MEDIA_CONFLICT", 409);
        await put(file.key, data, file.metadata.mime);
      }
    },
  };
}
