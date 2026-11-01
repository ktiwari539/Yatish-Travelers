import test from "node:test";
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
test("new process after Firebase emulator export/import recovers complete CRM records", async () => {
  const db = getFirestore(initializeApp({ projectId: "demo-mateshwari-poc" }));
  try {
    const records = await db
      .collection("mt_crm")
      .where("kind", "==", "enquiry")
      .get();
    assert.equal(records.size, 3);
    const confirmed = records.docs
      .map((d) => d.data())
      .find((x) => x.quote?.amount === 8000);
    assert.equal(confirmed.quote.amount, 8000);
    assert.equal(confirmed.version, 4);
    assert.equal(
      (await db.collection("mt_crm").where("kind", "==", "notification").get())
        .size,
      6,
    );
    assert.equal(
      (await db.collection("mt_crm").doc("catalog").get()).data().version,
      1,
    );
  } finally {
    await db.terminate();
  }
});
