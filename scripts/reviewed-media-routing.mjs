import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Verified reviewed photos ship as static CDN assets; only absent files fall
 * through to the authorized dynamic media API. A present but altered file is
 * a release-blocking error, never silently replaced by an API response.
 */
export function reviewedMediaRedirects({
  manifest,
  distDir,
  sourceDir,
  apiOrigin = "",
}) {
  const redirects = [];
  for (const [source, expectedSha256] of Object.entries(manifest)) {
    if (!/^public\/media\/[a-z0-9-]+\.webp$/.test(source) ||
        !/^[a-f0-9]{64}$/.test(expectedSha256)) {
      throw Error("Invalid reviewed-media manifest entry");
    }
    const relative = source.slice("public/".length);
    const published = resolve(distDir, relative);
    const original = resolve(sourceDir, source);
    const hasOriginal = existsSync(original);
    const hasPublished = existsSync(published);
    if (hasOriginal || hasPublished) {
      if (!hasOriginal || !hasPublished) {
        throw Error("Reviewed media missing from source or published build: " + relative);
      }
      for (const path of [original, published]) {
        const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
        if (actual !== expectedSha256) {
          throw Error("Reviewed media checksum mismatch: " + relative);
        }
      }
      // Netlify will serve the real file from its CDN without a forced rewrite.
      continue;
    }
    redirects.push(
      "/" + relative + "  " + apiOrigin + "/api/reviewed-media/" +
      relative.split("/").at(-1) + "  200!\n"
    );
  }
  return redirects.join("");
}
