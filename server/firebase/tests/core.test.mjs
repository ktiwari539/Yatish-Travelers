import test from "node:test";
import assert from "node:assert/strict";
import { validateCrmConfig } from "../runtime.mjs";
import { seal, unseal } from "../backup.mjs";
const base = {
  NETLIFY: "true",
  CRM_FIREBASE_PROJECT_ID: "mateshwari-travellers",
  CRM_RELEASE_ENABLED: "true",
  CRM_RATE_SALT: "a".repeat(64),
  CRM_BACKUP_KEY: "b".repeat(64),
};
const context = {
  site: { id: "20dab8cd-fdc1-4196-937f-7c779661cf47" },
  deploy: { context: "production" },
};
test("single owner project must be explicitly enabled; emulators never accepted hosted", () => {
  assert.equal(
    validateCrmConfig(base, context).projectId,
    "mateshwari-travellers",
  );
  for (const env of [
    { ...base, CRM_RELEASE_ENABLED: "false" },
    { ...base, CRM_FIREBASE_PROJECT_ID: "other" },
    { ...base, FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
    { ...base, CRM_NOTIFICATIONS_MODE: "live" },
  ])
    assert.throws(() => validateCrmConfig(env, context));
  assert.throws(() =>
    validateCrmConfig(base, {
      ...context,
      deploy: { context: "deploy-preview" },
    }),
  );
  assert.throws(() => validateCrmConfig(base, {}));
});
test("backup authenticated encryption rejects damaged contents and wrong keys", () => {
  const key = "d".repeat(64),
    bytes = seal({ documents: [{ kind: "synthetic" }] }, key);
  assert.equal(unseal(bytes, key).documents[0].kind, "synthetic");
  assert.throws(() => unseal(bytes, "e".repeat(64)));
  const v = JSON.parse(bytes);
  v.data = "AAAA";
  assert.throws(() => unseal(Buffer.from(JSON.stringify(v)), key));
});

test("migration replays journals in order and keeps original IDs/history", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { prepareLegacyMigration } = await import("../migration.mjs");
  const dir = await mkdtemp("/tmp/mt-migration-");
  try {
    await writeFile(
      dir + "/enquiries.jsonl",
      [
        {
          type: "created",
          value: { id: "legacy-uuid", name: "Synthetic", status: "new" },
        },
        {
          type: "quotation",
          id: "legacy-uuid",
          quote: { id: "old-quote", amount: 99 },
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          type: "status",
          id: "legacy-uuid",
          status: "confirmed",
          updatedAt: "2026-01-02T00:00:00Z",
        },
      ]
        .map((x) => JSON.stringify(x))
        .join("\n"),
    );
    const plan = prepareLegacyMigration(dir);
    const record = plan.documents.find(
      (x) => x.id === "enquiry_legacy-uuid",
    ).data;
    assert.equal(record.id, "legacy-uuid");
    assert.equal(record.quote.id, "old-quote");
    assert.equal(record.status, "confirmed");
    assert.equal(record.version, 3);
    assert.equal(plan.counts.history, 3);
    await writeFile(dir + "/events.jsonl", "corrupt");
    assert.throws(() => prepareLegacyMigration(dir), /Invalid events.jsonl/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("real Function entry refuses missing release configuration without exposing values", async () => {
  const { default: handler } = await import(
    "../../../netlify/functions/crm.mjs"
  );
  globalThis.Netlify = { env: { get: () => undefined } };
  try {
    const response = await handler(
      new Request("https://synthetic.invalid/api/admin/session"),
      {},
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "SERVICE_UNAVAILABLE" });
  } finally {
    delete globalThis.Netlify;
  }
});
