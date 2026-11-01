import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const cwd = resolve("experiments/firebase/integration"),
  dir = await mkdtemp(join(tmpdir(), "mt-complete-restart-")),
  snapshot = join(dir, "export");
async function run(args) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/firebase-tools/lib/bin/firebase.js",
      "emulators:exec",
      "--project",
      "demo-mateshwari-poc",
      "--only",
      "auth,firestore",
      ...args,
    ],
    {
      cwd,
      env: {
        ...process.env,
        HTTP_PROXY: "",
        HTTPS_PROXY: "",
        http_proxy: "",
        https_proxy: "",
        NO_PROXY: "127.0.0.1,localhost",
        no_proxy: "127.0.0.1,localhost",
        CI: "true",
        GCLOUD_PROJECT: "demo-mateshwari-poc",
        JAVA_TOOL_OPTIONS: "-Xmx512m",
      },
      stdio: "inherit",
    },
  );
  const code = await new Promise((ok, no) => {
    child.once("error", no);
    child.once("exit", ok);
  });
  if (code !== 0) throw Error("Complete Firebase CRM emulator suite failed");
}
try {
  await run([
    "--export-on-exit",
    snapshot,
    "node --test ../../../server/firebase/tests/emulator.integration.mjs",
  ]);
  await run([
    "--import",
    snapshot,
    "node --test ../../../server/firebase/tests/restart.integration.mjs",
  ]);
} finally {
  await rm(dir, { recursive: true, force: true });
}
