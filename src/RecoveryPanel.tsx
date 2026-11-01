import { useState } from "react";
import { adminFetch, uploadModelChunks } from "./crmApi";
export function RecoveryPanel({ token }: { token: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [backupId, setBackupId] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  async function request(path: string, data: unknown) {
    const r = await adminFetch("/api/admin/" + path, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await r.json();
    if (!r.ok) throw Error(result.error || "Operation failed");
    return result;
  }
  async function action(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }
  async function importPlan(file: File) {
    const plan = JSON.parse(await file.text());
    if (
      plan.schema !== 1 ||
      !Array.isArray(plan.documents) ||
      !Array.isArray(plan.media)
    )
      throw Error("Invalid migration plan");
    for (let i = 0; i < plan.documents.length; i += 200)
      await request("migration", {
        documents: plan.documents.slice(i, i + 200),
        media: [],
      });
    for (const item of plan.media) {
      if (item.key?.startsWith("models/") && item.data?.length > 4000000) {
        const binary = atob(item.data),
          bytes = Uint8Array.from(binary, (x) => x.charCodeAt(0));
        await uploadModelChunks(
          new File([bytes], item.key.slice(7), { type: "model/gltf-binary" }),
          token,
          item.key.slice(7),
        );
      } else await request("migration", { documents: [], media: [item] });
    }
    setMessage(
      "Import completed. Keep maintenance enabled until source counts and media hashes are reconciled.",
    );
  }
  return (
    <section className="crm-notifications">
      <h1>Backup & recovery</h1>
      <p>
        Maintenance blocks business changes. Migration and restore also require
        explicit provider-side owner approval. Backups contain encrypted
        customer data; retain a copy outside this provider.
      </p>
      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />{" "}
        I have reviewed the release/recovery checklist and intend to perform the
        selected operation.
      </label>
      <fieldset className="crm-recovery-controls" disabled={busy || !confirmed}>
        <button
          type="button"
          onClick={() =>
            void action(async () => {
              await request("maintenance", { enabled: true });
              setMessage("Maintenance enabled.");
            })
          }
        >
          Enable maintenance
        </button>
        <button
          type="button"
          onClick={() =>
            void action(async () => {
              await request("maintenance", { enabled: false });
              setMessage("Maintenance disabled.");
            })
          }
        >
          Disable maintenance
        </button>
        <button
          type="button"
          onClick={() =>
            void action(async () => {
              const result = await request("backups", {});
              setBackupId(result.id);
              setMessage(
                "Encrypted backup verified: " +
                  result.documents +
                  " documents, " +
                  result.media +
                  " media objects. SHA-256: " +
                  result.sha256,
              );
            })
          }
        >
          Create encrypted backup
        </button>
        <label>
          Backup ID
          <input
            value={backupId}
            onChange={(e) => setBackupId(e.target.value)}
            placeholder="backup-…json"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            void action(async () => {
              await request("migration/complete", {});
              setMessage(
                "Migration access is closed in durable control state. No redeployment is needed.",
              );
            })
          }
        >
          Close migration access after reconciliation
        </button>
        <button
          type="button"
          disabled={!/^backup-[\w-]+\.json$/.test(backupId)}
          onClick={() =>
            void action(async () => {
              const r = await adminFetch("/api/admin/backups/" + backupId, {
                headers: { Authorization: "Bearer " + token },
              });
              if (!r.ok) throw Error("Backup download failed");
              const url = URL.createObjectURL(await r.blob()),
                a = document.createElement("a");
              a.href = url;
              a.download = backupId;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setMessage(
                "Encrypted archive downloaded. Verify its hash and preserve it in the recovery vault.",
              );
            })
          }
        >
          Download encrypted archive
        </button>
        <label>
          Import reconciled legacy plan
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void action(() => importPlan(file));
            }}
          />
        </label>
        <button
          type="button"
          disabled={!/^backup-[\w-]+\.json$/.test(backupId)}
          onClick={() =>
            void action(async () => {
              await request("restore", { id: backupId });
              setMessage(
                "Restore completed. Maintenance remains enabled; reconcile before reopening.",
              );
            })
          }
        >
          Restore backup into empty target
        </button>
        <label>
          Recover an off-provider encrypted archive (up to 60 MB)
          <input
            type="file"
            accept=".json,application/octet-stream"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file)
                void action(async () => {
                  if (file.size > 60000000)
                    throw Error("Archive exceeds the 60 MB recovery bound.");
                  const uploadId = crypto.randomUUID(),
                    total = Math.ceil(file.size / 1500000);
                  for (let index = 0; index < total; index++) {
                    const bytes = new Uint8Array(
                      await file
                        .slice(index * 1500000, (index + 1) * 1500000)
                        .arrayBuffer(),
                    );
                    let text = "";
                    for (const b of bytes) text += String.fromCharCode(b);
                    await request("recovery/chunks", {
                      uploadId,
                      index,
                      data: btoa(text),
                    });
                  }
                  await request("restore", { id: file.name, uploadId, total });
                  setMessage(
                    "Off-provider archive restored into empty target. Reconcile before disabling maintenance.",
                  );
                });
            }}
          />
        </label>
        <button
          type="button"
          onClick={() =>
            void action(async () => {
              const result = await request("cleanup", {});
              setMessage(
                "Expired counters removed: " +
                  result.deleted +
                  "; abandoned upload chunks: " +
                  result.chunksDeleted,
              );
            })
          }
        >
          Clean expired operational data
        </button>
      </fieldset>
      <p role="status" aria-live="polite">
        {busy ? "Working…" : message}
      </p>
    </section>
  );
}
