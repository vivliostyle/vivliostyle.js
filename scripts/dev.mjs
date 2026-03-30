import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const DEV_SERVER_LOCK_FILE = resolve(
  process.cwd(),
  "packages/viewer/.cache/dev-server.json",
);

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getExistingDevServerUrl() {
  if (!existsSync(DEV_SERVER_LOCK_FILE)) {
    return null;
  }

  try {
    const lock = JSON.parse(readFileSync(DEV_SERVER_LOCK_FILE, "utf8"));
    if (isProcessAlive(lock.pid)) {
      return lock.url || "http://localhost:3000/core/test/files/";
    }
  } catch {
    // Ignore parse/read errors and remove broken lock file below.
  }

  rmSync(DEV_SERVER_LOCK_FILE, { force: true });
  return null;
}

const existingUrl = getExistingDevServerUrl();
if (existingUrl) {
  console.log(
    `[dev] Vivliostyle dev server is already running at ${existingUrl}.`,
  );
  console.log("[dev] Skipping a new dev server start.");
  process.exit(0);
}

const child = spawn(
  "lerna",
  ["run", "dev", "--parallel", "--ignore", "@vivliostyle/react"],
  {
    stdio: "inherit",
    shell: true,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("[dev] Failed to start lerna:", err);
  process.exit(1);
});
