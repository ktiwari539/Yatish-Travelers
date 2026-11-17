import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reviewedMediaRedirects } from "./reviewed-media-routing.mjs";

test("only missing reviewed photos route to API; verified static files stay on CDN", () => {
  const root = mkdtempSync(join(tmpdir(), "mt-static-media-"));
  const distDir = join(root, "dist"), sourceDir = join(root, "source");
  const relative = "media/mt-thar-red-front.webp";
  const original = join(sourceDir, "public", relative);
  const published = join(distDir, relative);
  const bytes = Buffer.from("synthetic test image fixture; not a licensed fleet photo");
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const manifest = { ["public/" + relative]: checksum };
  const redirects = (apiOrigin) => reviewedMediaRedirects({ manifest, distDir, sourceDir, apiOrigin });
  try {
    assert.equal(redirects(""), "/" + relative + "  /api/reviewed-media/mt-thar-red-front.webp  200!\n");
    assert.equal(redirects("https://api.example.invalid"), "/" + relative + "  https://api.example.invalid/api/reviewed-media/mt-thar-red-front.webp  200!\n");
    mkdirSync(join(sourceDir, "public", "media"), { recursive: true });
    mkdirSync(join(distDir, "media"), { recursive: true });
    writeFileSync(original, bytes);
    assert.throws(() => redirects(""), /missing from source or published build/);
    writeFileSync(published, bytes);
    assert.equal(redirects(""), "", "Netlify must serve included verified files directly");
    writeFileSync(published, Buffer.from("altered published file"));
    assert.throws(() => redirects(""), /checksum mismatch/);
    writeFileSync(published, bytes);
    writeFileSync(original, Buffer.from("altered original file"));
    assert.throws(() => redirects(""), /checksum mismatch/);
    unlinkSync(original);
    assert.throws(() => redirects(""), /missing from source or published build/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unexpected manifest paths and digests", () => {
  for (const manifest of [
    { "public/../secret.webp": "a".repeat(64) },
    { "public/media/approved.webp": "not-a-hash" },
  ]) {
    assert.throws(() => reviewedMediaRedirects({ manifest, distDir: "dist", sourceDir: "." }), /Invalid reviewed-media manifest/);
  }
});
