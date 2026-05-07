import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Suppress deprecation warnings from dependencies (gulp, browsersync, etc.)
const suppressedWarnings = ["DEP0169", "DEP0180"];
const existingNodeOptions = process.env.NODE_OPTIONS || "";
const extraOptions = suppressedWarnings
  .map((w) => `--disable-warning=${w}`)
  .join(" ");
process.env.NODE_OPTIONS = existingNodeOptions
  ? `${existingNodeOptions} ${extraOptions}`
  : extraOptions;

const DEV_SERVER_PORT = 3300;
const DEV_SERVER_DEFAULT_URL = `http://localhost:${DEV_SERVER_PORT}/core/test/files/`;

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
      return lock.url || DEV_SERVER_DEFAULT_URL;
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

// Build core first so that viewer and reftest always see a fresh core bundle.
// After the initial build completes, start core watcher and viewer in parallel.
console.log("[dev] Building core...");
const coreBuild = spawn("yarn workspace @vivliostyle/core build-dev", {
  stdio: "inherit",
  shell: true,
});

coreBuild.on("exit", (code) => {
  if (code !== 0) {
    console.error(`[dev] Core build failed with exit code ${code}`);
    process.exit(code ?? 1);
  }
  console.log("[dev] Core build complete. Starting watchers...");
  startWatchers();
});

coreBuild.on("error", (err) => {
  console.error("[dev] Failed to build core:", err);
  process.exit(1);
});

function startWatchers() {
  const child = spawn("lerna run dev --parallel --ignore @vivliostyle/react", {
    stdio: "inherit",
    shell: true,
  });

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
}
