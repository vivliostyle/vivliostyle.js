#!/usr/bin/env node
/**
 * triage-summary.mjs
 *
 * Read a triage.yaml produced by layout-regression.mjs and print a summary.
 *
 * Usage:
 *   node scripts/triage-summary.mjs [--triage <path>] [--show-pending] [--show-expected]
 *   yarn test:layout-regression:triage [options]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const defaultTriagePath = path.join(
  repoRoot,
  "artifacts",
  "layout-regression",
  "triage.yaml",
);

function parseArgs(argv) {
  const opts = {
    triagePath: defaultTriagePath,
    showPending: false,
    showExpected: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--triage") {
      opts.triagePath = path.resolve(argv[++i]);
    } else if (a === "--show-pending") {
      opts.showPending = true;
    } else if (a === "--show-expected") {
      opts.showExpected = true;
    } else if (a === "--help" || a === "-h") {
      printHelpAndExit(0);
    } else {
      console.error(`Unknown option: ${a}`);
      printHelpAndExit(1);
    }
  }
  return opts;
}

function printHelpAndExit(exitCode) {
  process.stdout.write(`
Summarize a triage.yaml file produced by layout-regression.mjs.

Usage:
  yarn test:layout-regression:triage [options]

Options:
  --triage <path>   Path to triage.yaml (default: artifacts/layout-regression/triage.yaml)
  --show-pending    Also list entries with no decision yet
  --show-expected   Also list entries marked as expected
  -h, --help        Show this help
`);
  process.exit(exitCode);
}

function pad(str, width) {
  return String(str).padEnd(width);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(opts.triagePath)) {
    console.error(`triage.yaml not found: ${opts.triagePath}`);
    console.error("Run `yarn test:layout-regression` first.");
    process.exit(1);
  }

  const raw = fs.readFileSync(opts.triagePath, "utf8");
  const entries = yaml.load(raw);

  if (!Array.isArray(entries) || entries.length === 0) {
    console.log("triage.yaml is empty — no entries to summarize.");
    return;
  }

  // Count by decision value (normalize empty string → "pending")
  const counts = { regression: 0, expected: 0, skip: 0, pending: 0, other: 0 };
  for (const e of entries) {
    const d = String(e.decision || "")
      .trim()
      .toLowerCase();
    if (d === "regression") counts.regression++;
    else if (d === "expected") counts.expected++;
    else if (d === "skip") counts.skip++;
    else if (d === "") counts.pending++;
    else counts.other++;
  }

  // ── Summary table ──────────────────────────────────────────────────────────
  console.log("\n=== Triage summary ===");
  console.log(`  total      : ${entries.length}`);
  if (counts.pending)
    console.log(`  pending    : ${counts.pending}  ← not yet triaged`);
  if (counts.regression)
    console.log(`  regression : ${counts.regression}  ← needs fix / issue`);
  if (counts.expected) console.log(`  expected   : ${counts.expected}`);
  if (counts.skip) console.log(`  skip       : ${counts.skip}`);
  if (counts.other) console.log(`  other      : ${counts.other}`);

  // ── Detail sections ────────────────────────────────────────────────────────
  const regressions = entries.filter(
    (e) =>
      String(e.decision || "")
        .trim()
        .toLowerCase() === "regression",
  );
  const pending = entries.filter((e) => !String(e.decision || "").trim());
  const expected = entries.filter(
    (e) =>
      String(e.decision || "")
        .trim()
        .toLowerCase() === "expected",
  );

  if (regressions.length > 0) {
    console.log("\n--- Regressions (" + regressions.length + ") ---");
    for (const e of regressions) {
      printEntry(e);
    }
  }

  if (opts.showPending && pending.length > 0) {
    console.log("\n--- Pending (" + pending.length + ") ---");
    for (const e of pending) {
      printEntry(e);
    }
  }

  if (opts.showExpected && expected.length > 0) {
    console.log("\n--- Expected (" + expected.length + ") ---");
    for (const e of expected) {
      printEntry(e);
    }
  }

  console.log("");

  // Exit code 2 when regressions or unreviewed pending entries remain.
  if (counts.regression > 0 || counts.pending > 0) {
    process.exitCode = 2;
  }
}

function printEntry(e) {
  const type = e.type === "error" ? "[error]" : "[diff] ";
  const notes = e.notes ? `  notes: ${e.notes}` : "";
  console.log(`  ${type} [${e.category}] ${e.title}`);
  if (e.diffPages && e.diffPages.length > 0) {
    console.log(`         diff pages: ${e.diffPages.join(", ")}`);
  }
  if (e.pageCountActual != null) {
    console.log(
      `         page count: ${e.actualLabel ?? "actual"}=${e.pageCountActual}, ${e.baselineLabel ?? "baseline"}=${e.pageCountBaseline}`,
    );
  }
  if (e.errorMessage) {
    console.log(`         error: ${e.errorName}: ${e.errorMessage}`);
  }
  if (notes) {
    console.log(`        ${notes}`);
  }
  if (e.actualUrl) {
    console.log(`         actual  : ${e.actualUrl}`);
  }
  if (e.baselineUrl) {
    console.log(`         baseline: ${e.baselineUrl}`);
  }
}

main();
