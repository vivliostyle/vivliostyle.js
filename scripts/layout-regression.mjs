#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import yaml from "js-yaml";
import pLimit from "p-limit";
import { createTwoFilesPatch } from "diff";
import prettier from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultLayoutRegressionOutDir = path.join(
  repoRoot,
  "artifacts",
  "layout-regression",
);
const defaultReftestOutDir = path.join(repoRoot, "artifacts", "wpt-reftest");
const defaultReftestDiffOutDir = path.join(
  repoRoot,
  "artifacts",
  "reftest-diff",
);
const defaultWptManifestPath = path.join(defaultReftestOutDir, "MANIFEST.json");
const fileListPath = path.join(
  repoRoot,
  "packages/core/test/files/file-list.js",
);
const testFilesRootPrefix = "packages/core/test/files/";
const localDevServerOrigin = "http://localhost:3300";
const localDevServerTestFilesUrl = `${localDevServerOrigin}/core/test/files/`;

// These params are appended last so that values explicitly specified earlier
// via --extra-viewer-params take precedence: the viewer always uses the first
// occurrence of a repeated parameter, so a user-supplied zoom or spread value
// will win and these fallbacks will be ignored for that parameter.
const fallbackViewerParams = "&zoom=1&spread=false";
const wptReftestViewerParams = "&pixelRatio=0&bookMode=false";

const defaults = {
  mode: "version-diff",
  browser: "chromium",
  outDir: "",
  timeoutSec: 30,
  maxDiffRatio: 0.00002,
  pixelThreshold: 0.1,
  viewportWidth: 1800,
  viewportHeight: 1800,
  skipScreenshots: false,
  concurrency: os.availableParallelism(),
  exportHtml: false,
  exportHtmlDiff: false,
  actualViewer: "https://vivliostyle.vercel.app/",
  baselineViewer: "https://vivliostyle.org/viewer/",
  actualLabel: "canary",
  baselineLabel: "stable",
  extraViewerParams: "",
  actualViewerParams: "",
  baselineViewerParams: "",
  testUrls: [],
  refUrls: [],
  wptManifestPath: defaultWptManifestPath,
  wptBaseUrl: "https://wpt.live/",
  wptPathPrefixes: [],
};

function normalizeCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeTestFilePath(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(new RegExp(`^${testFilesRootPrefix}`), "");
}

function normalizeWptPath(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

function normalizeManualTitle(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function normalizePageRanges(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const ranges = value
    .filter(Array.isArray)
    .map((range) => range.slice(0, 2))
    .filter((range) => range.length > 0);
  return ranges.length > 0 ? ranges : null;
}

function normalizeNumberRange(value) {
  if (Array.isArray(value)) {
    const range = value.slice(0, 2);
    if (range.length === 0) {
      return null;
    }
    if (range.length === 1) {
      range[1] = range[0];
    }
    if (!Number.isFinite(range[0]) || !Number.isFinite(range[1])) {
      return null;
    }
    return range;
  }

  return Number.isFinite(value) ? [value, value] : null;
}

function normalizeFuzzyTolerance(value) {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const maxDifference = normalizeNumberRange(value[0]);
  const totalPixels = normalizeNumberRange(value[1]);
  if (!maxDifference || !totalPixels) {
    return null;
  }

  return {
    maxDifference,
    totalPixels,
  };
}

function fuzzyReferenceKey(referenceFile, relation = "") {
  return `${normalizeWptPath(referenceFile)}\x00${String(relation || "").trim()}`;
}

function normalizeWptFuzzyKey(testPath, rawKey) {
  if (rawKey == null) {
    return null;
  }

  if (typeof rawKey === "string") {
    const referenceFile = normalizeWptPath(rawKey);
    return referenceFile ? { referenceFile, relation: "" } : undefined;
  }

  if (!Array.isArray(rawKey)) {
    return undefined;
  }

  const [rawTestPath, rawReferencePath, rawRelation] = rawKey;
  const normalizedTestPath = normalizeWptPath(rawTestPath);
  if (normalizedTestPath && normalizedTestPath !== testPath) {
    return undefined;
  }

  const referenceFile = normalizeWptPath(rawReferencePath);
  if (!referenceFile) {
    return undefined;
  }

  return {
    referenceFile,
    relation: String(rawRelation || "").trim(),
  };
}

function normalizeWptFuzzyMetadata(testPath, value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const byReference = new Map();
  let defaultFuzzy = null;

  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }

    const fuzzy = normalizeFuzzyTolerance(entry[1]);
    if (!fuzzy) {
      continue;
    }

    const key = normalizeWptFuzzyKey(testPath, entry[0]);
    if (key === null) {
      defaultFuzzy = fuzzy;
      continue;
    }
    if (!key) {
      continue;
    }

    byReference.set(fuzzyReferenceKey(key.referenceFile, key.relation), fuzzy);
  }

  if (!defaultFuzzy && byReference.size === 0) {
    return null;
  }

  return { defaultFuzzy, byReference };
}

function getWptFuzzyTolerance(fuzzyMetadata, referenceFile, relation) {
  if (!fuzzyMetadata) {
    return null;
  }

  return (
    fuzzyMetadata.byReference.get(fuzzyReferenceKey(referenceFile, relation)) ||
    fuzzyMetadata.byReference.get(fuzzyReferenceKey(referenceFile)) ||
    fuzzyMetadata.defaultFuzzy ||
    null
  );
}

function getTestFilesGitRef() {
  const explicitRef = String(
    process.env.LAYOUT_REGRESSION_TEST_REF || "",
  ).trim();
  if (explicitRef) {
    return explicitRef;
  }

  const prHeadRef = String(process.env.GITHUB_HEAD_REF || "").trim();
  if (prHeadRef) {
    return prHeadRef;
  }

  const branchRef = String(process.env.GITHUB_REF_NAME || "").trim();
  // Allow normal branch names that contain "/" (e.g. feature/foo),
  // but avoid PR merge refs like "123/merge".
  if (branchRef && !/^\d+\/merge$/.test(branchRef)) {
    return branchRef;
  }

  return "master";
}

function isLocalViewerUrl(viewerUrl) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\//.test(
    String(viewerUrl || ""),
  );
}

function testFilesBaseUrlForViewer(viewerUrl, gitRef) {
  if (isLocalViewerUrl(viewerUrl)) {
    try {
      const origin = new URL(String(viewerUrl)).origin;
      return `${origin}/core/test/files/`;
    } catch {
      // Fallback for malformed local viewer URL values.
      return localDevServerTestFilesUrl;
    }
  }

  if (isLegacyViewerUrl(viewerUrl)) {
    return `https://raw.githack.com/vivliostyle/vivliostyle.js/${gitRef}/${testFilesRootPrefix}`;
  }

  return `https://raw.githubusercontent.com/vivliostyle/vivliostyle.js/${gitRef}/${testFilesRootPrefix}`;
}

function parseArgs(argv) {
  const opts = {
    categories: [],
    titleIncludes: [],
    files: [],
    limit: null,
    ...defaults,
  };

  let baselineViewerSpec = null;
  let actualViewerSpec = null;
  let baselineLabelSet = false;
  let actualLabelSet = false;
  let baselineViewerSet = false;
  let actualViewerSet = false;
  let outDirSet = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mode") {
      opts.mode = String(argv[++i] || "").trim();
    } else if (a === "--category") {
      opts.categories.push(argv[++i]);
    } else if (a === "--title-includes") {
      opts.titleIncludes.push(argv[++i]);
    } else if (a === "--file") {
      opts.files.push(argv[++i]);
    } else if (a === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (a === "--out-dir") {
      opts.outDir = path.resolve(argv[++i]);
      outDirSet = true;
    } else if (a === "--timeout") {
      opts.timeoutSec = Number(argv[++i]);
    } else if (a === "--max-diff-ratio") {
      opts.maxDiffRatio = Number(argv[++i]);
    } else if (a === "--pixel-threshold") {
      opts.pixelThreshold = Number(argv[++i]);
    } else if (a === "--viewport-width") {
      opts.viewportWidth = Number(argv[++i]);
    } else if (a === "--viewport-height") {
      opts.viewportHeight = Number(argv[++i]);
    } else if (a === "--browser") {
      opts.browser = String(argv[++i] || "")
        .trim()
        .toLowerCase();
    } else if (a === "--skip-screenshots") {
      opts.skipScreenshots = true;
    } else if (a === "--concurrency") {
      opts.concurrency = Number(argv[++i]);
    } else if (a === "--export-html") {
      opts.exportHtml = true;
    } else if (a === "--export-html-diff") {
      opts.exportHtmlDiff = true;
      opts.exportHtml = true;
    } else if (a === "--baseline-viewer") {
      baselineViewerSpec = argv[++i];
      baselineViewerSet = true;
    } else if (a === "--actual-viewer") {
      actualViewerSpec = argv[++i];
      actualViewerSet = true;
    } else if (a === "--baseline-label") {
      opts.baselineLabel = argv[++i];
      baselineLabelSet = true;
    } else if (a === "--actual-label") {
      opts.actualLabel = argv[++i];
      actualLabelSet = true;
    } else if (a === "--extra-viewer-params") {
      opts.extraViewerParams = argv[++i] ?? "";
    } else if (a === "--baseline-viewer-params") {
      opts.baselineViewerParams = argv[++i] ?? "";
    } else if (a === "--actual-viewer-params") {
      opts.actualViewerParams = argv[++i] ?? "";
    } else if (a === "--test-url") {
      opts.testUrls.push(argv[++i]);
    } else if (a === "--ref-url") {
      opts.refUrls.push(argv[++i]);
    } else if (a === "--wpt-manifest" || a === "--manifest") {
      opts.wptManifestPath = path.resolve(argv[++i]);
    } else if (a === "--wpt-base-url") {
      opts.wptBaseUrl = String(argv[++i] ?? "").trim();
    } else if (a === "--wpt-path-prefix") {
      opts.wptPathPrefixes.push(argv[++i]);
    } else if (a === "--help" || a === "-h") {
      printHelpAndExit(0);
    } else {
      console.error(`Unknown option: ${a}`);
      printHelpAndExit(1);
    }
  }

  if (baselineViewerSpec !== null) {
    const resolved = resolveViewerSpec(baselineViewerSpec);
    opts.baselineViewer = resolved.url;
    if (!baselineLabelSet) {
      opts.baselineLabel = resolved.label ?? "baseline";
    }
  }
  if (actualViewerSpec !== null) {
    const resolved = resolveViewerSpec(actualViewerSpec);
    opts.actualViewer = resolved.url;
    if (!actualLabelSet) {
      opts.actualLabel = resolved.label ?? "actual";
    }
  }

  const validBrowsers = ["chromium", "firefox", "webkit"];
  if (!validBrowsers.includes(opts.browser)) {
    throw new Error(`--browser must be one of: ${validBrowsers.join(", ")}`);
  }

  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error("--timeout must be a positive number");
  }
  opts.timeoutMs = opts.timeoutSec * 1000;
  if (!Number.isFinite(opts.maxDiffRatio) || opts.maxDiffRatio < 0) {
    throw new Error("--max-diff-ratio must be a non-negative number");
  }
  if (
    !Number.isFinite(opts.pixelThreshold) ||
    opts.pixelThreshold < 0 ||
    opts.pixelThreshold > 1
  ) {
    throw new Error("--pixel-threshold must be between 0 and 1");
  }
  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  opts.concurrency = Math.floor(opts.concurrency);

  if (opts.mode === "wpt-reftest") {
    opts.mode = "reftest";
  }

  if (
    opts.mode !== "version-diff" &&
    opts.mode !== "reftest" &&
    opts.mode !== "reftest-diff"
  ) {
    throw new Error(
      "--mode must be either 'version-diff', 'reftest', or 'reftest-diff'",
    );
  }

  if (!outDirSet) {
    opts.outDir =
      opts.mode === "reftest"
        ? defaultReftestOutDir
        : opts.mode === "reftest-diff"
          ? defaultReftestDiffOutDir
          : defaultLayoutRegressionOutDir;
  }

  if (
    opts.mode === "version-diff" &&
    (!opts.baselineViewer || !opts.actualViewer)
  ) {
    throw new Error("--baseline-viewer and --actual-viewer are required");
  }

  if (opts.mode === "version-diff" && opts.refUrls.length > 0) {
    throw new Error(
      "--ref-url can only be used in reftest or reftest-diff mode",
    );
  }

  if (opts.mode === "reftest" || opts.mode === "reftest-diff") {
    if (!opts.actualViewer) {
      throw new Error(`--actual-viewer is required in ${opts.mode} mode`);
    }
    const rawWptBaseUrl = String(opts.wptBaseUrl ?? "").trim();
    if (!rawWptBaseUrl) {
      throw new Error(
        "Invalid value for --wpt-base-url: expected a non-empty absolute URL",
      );
    }
    try {
      new URL(rawWptBaseUrl);
    } catch {
      throw new Error(
        `Invalid value for --wpt-base-url: expected a valid absolute URL, got ${JSON.stringify(rawWptBaseUrl)}`,
      );
    }
    opts.wptBaseUrl = normalizeBaseUrl(rawWptBaseUrl);
    const usesManualPairs = opts.testUrls.length > 0 || opts.refUrls.length > 0;
    if (opts.testUrls.length !== opts.refUrls.length) {
      throw new Error(
        `${opts.mode} mode requires the same number of --test-url and --ref-url values`,
      );
    }
    if (!usesManualPairs && !opts.wptManifestPath) {
      throw new Error(
        `--wpt-manifest is required in ${opts.mode} mode when --test-url/--ref-url are not provided`,
      );
    }
    if (!usesManualPairs && !fs.existsSync(opts.wptManifestPath)) {
      throw new Error(
        `WPT manifest not found at ${opts.wptManifestPath}. Run 'yarn download:wpt-manifest' or pass --wpt-manifest.`,
      );
    }
    if (
      opts.mode === "reftest" &&
      baselineViewerSet &&
      opts.baselineViewer !== opts.actualViewer
    ) {
      throw new Error(
        "reftest mode currently compares test and reference with the same viewer; omit --baseline-viewer or set it equal to --actual-viewer",
      );
    }
    if (opts.mode === "reftest") {
      opts.baselineViewer = opts.actualViewer;
      if (!actualLabelSet) {
        opts.actualLabel = "test";
      }
      if (!baselineLabelSet) {
        opts.baselineLabel = "reference";
      }
    }
  }

  return opts;
}

function printHelpAndExit(exitCode) {
  const msg = `
Compare Vivliostyle rendering between two viewer URLs for test files.

Usage:
  yarn test:layout-regression [options]

Options:
  --mode <name>              version-diff (default), reftest, or reftest-diff
  --category <name>          Run only this category (repeatable, case-insensitive)
  --title-includes <text>    Run entries whose title includes text (repeatable, case-insensitive)
  --file <path>              Run entries by file path relative to packages/core/test/files/
                             (repeatable, case-insensitive), e.g. footnotes/footnotes-anywhere.html
  --limit <number>           Stop after N entries
  --out-dir <path>           Output directory
  --timeout <seconds>        Timeout in seconds for page load/waits (default 30)
  --max-diff-ratio <number>  Allowed ratio of diff pixels (default 0.00002)
  --pixel-threshold <0..1>   Pixel diff sensitivity (default 0.1)
  --viewport-width <number>  Browser viewport width
  --viewport-height <number> Browser viewport height
  --browser <name>           Browser to use: chromium (default), firefox, or webkit
  --skip-screenshots         Skip image capture/compare, check page counts only
  --concurrency <number>     Number of entries to capture in parallel (default: os.availableParallelism())
  --export-html              Export rendered HTML snapshot for each entry
  --export-html-diff         Compare prettified rendered HTML and write diff
  --actual-viewer <spec>     Actual viewer: URL, version (v2.35.0 or 2019.11.100),
                             or keyword: canary, stable, dev, prod, git-<branch> (default: canary)
  --baseline-viewer <spec>   Baseline viewer: same format as --actual-viewer (default: stable)
  --actual-label <name>      Label for actual in report (default: derived from viewer spec)
  --baseline-label <name>    Label for baseline in report (default: derived from viewer spec)
  --extra-viewer-params <s>  Extra hash params for both sides, e.g. '&style=...'
  --actual-viewer-params <s> Extra hash params only for actual side
  --baseline-viewer-params <s> Extra hash params only for baseline side
  --test-url <url>           Additional test URL to compare (repeatable)
  --ref-url <url>            Reference URL to compare with the matching --test-url (repeatable)
  --wpt-manifest <path>      WPT MANIFEST.json path (default: artifacts/wpt-reftest/MANIFEST.json)
  --wpt-base-url <url>       Base URL for WPT tests (default: https://wpt.live/)
  --wpt-path-prefix <path>   Restrict WPT paths by prefix (repeatable), e.g. css/css-break/
  -h, --help                 Show this help
`;
  process.stdout.write(msg);
  process.exit(exitCode);
}

function sanitizeName(name) {
  return String(name)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .slice(0, 180);
}

function toArray(v) {
  return Array.isArray(v) ? v : [v];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadFileList() {
  const loaded = requireFromPath(fileListPath);
  if (!Array.isArray(loaded)) {
    throw new Error("file-list.js did not export an array");
  }
  return loaded;
}

function requireFromPath(absPath) {
  // `file-list.js` is CommonJS, so load it via a small wrapper from ESM.
  const module = { exports: {} };
  const source = fs.readFileSync(absPath, "utf8");
  const wrapped = new Function("module", "exports", source);
  wrapped(module, module.exports);
  return module.exports;
}

function normalizeViewerUrl(url) {
  return String(url || "").trim();
}

function normalizeExtraParams(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  let normalized = raw;
  if (normalized.startsWith("#") || normalized.startsWith("?")) {
    normalized = normalized.slice(1);
  }
  if (!normalized) {
    return "";
  }
  if (normalized.startsWith("&")) {
    return normalized;
  }
  return `&${normalized}`;
}

function isLegacyViewerUrl(viewerUrl) {
  return /\/vivliostyle-viewer\.html(?:$|[#?])/.test(viewerUrl);
}

/**
 * Resolve a viewer spec string to { url, label }.
 * Accepts a raw URL, a version string (v2.35.0 or 2019.11.100), or a keyword.
 * Returns label=null when the spec is a raw URL (caller keeps the default label).
 */
function resolveViewerSpec(spec) {
  const s = String(spec || "").trim();

  // Named keywords
  if (s === "canary")
    return { url: "https://vivliostyle.vercel.app/", label: "canary" };
  if (s === "stable")
    return { url: "https://vivliostyle.org/viewer/", label: "stable" };
  if (s === "dev")
    return {
      url: `${localDevServerOrigin}/viewer/lib/vivliostyle-viewer-dev.html`,
      label: "dev",
    };
  if (s === "prod")
    return { url: `${localDevServerOrigin}/viewer/lib/`, label: "prod" };

  // git-<branch> or git:<branch> → Vercel PR preview URL (e.g. git-fix-issue1775)
  if (/^git[-:]/.test(s)) {
    const branch = s.slice(4);
    // Vercel sanitizes branch names: sequences of non-alphanumeric chars → single hyphen,
    // lowercase, leading/trailing hyphens removed.
    const sanitized = branch
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const label = `git-${sanitized}`;
    return {
      url: `https://vivliostyle-git-${sanitized}-vivliostyle.vercel.app/`,
      label,
    };
  }

  // Modern version: v2.35.0 etc.
  if (/^v\d/.test(s)) {
    return { url: `https://vivliostyle.github.io/viewer/${s}/`, label: s };
  }

  // Legacy version: 2019.11.100, 2018.2 etc.
  if (/^\d{4}[.\d]/.test(s)) {
    return {
      url: `https://vivliostyle.github.io/viewer/${s}/vivliostyle-viewer.html`,
      label: s,
    };
  }

  // Known URL patterns: extract a meaningful label
  // canary/stable/dev/prod URLs
  if (/^https?:\/\/vivliostyle\.vercel\.app\/?$/.test(s))
    return { url: s, label: "canary" };
  if (/^https?:\/\/vivliostyle\.org\/viewer\/?$/.test(s))
    return { url: s, label: "stable" };
  if (/vivliostyle-viewer-dev\.html/.test(s)) return { url: s, label: "dev" };
  if (/localhost.*\/viewer\/lib\/?$/.test(s)) return { url: s, label: "prod" };

  // https://vivliostyle.github.io/viewer/v2.19.0/ → "v2.19.0"
  // https://vivliostyle.github.io/viewer/2019.11.100/vivliostyle-viewer.html → "2019.11.100"
  const githubViewerMatch = s.match(
    /\/\/vivliostyle\.github\.io\/viewer\/(v[\d.]+|\d{4}[\d.]*)/,
  );
  if (githubViewerMatch) {
    return { url: s, label: githubViewerMatch[1] };
  }

  // https://vivliostyle-git-fix-issue1775-vivliostyle.vercel.app/ → "git-fix-issue1775"
  const vercelPrMatch = s.match(
    /\/\/vivliostyle-git-(.+?)-vivliostyle\.vercel\.app/,
  );
  if (vercelPrMatch) {
    return { url: s, label: `git-${vercelPrMatch[1]}` };
  }

  // Unrecognized URL — return null; caller will use the default label
  return { url: s, label: null };
}

function buildViewerParams(entry, testFileBaseUrl, extraParams) {
  const baseUrl = testFileBaseUrl;

  let pathPart = "";
  if (Array.isArray(entry.file)) {
    pathPart = entry.file
      .map((f) => `${baseUrl}${normalizeTestFilePath(f)}`)
      .join("&src=");
  } else if (entry.file) {
    pathPart = `${baseUrl}${normalizeTestFilePath(entry.file)}`;
  }

  if (!pathPart) {
    return null;
  }

  const parameterOnline =
    `#src=${pathPart}${entry.options || ""}` +
    `${extraParams}${fallbackViewerParams}`;
  const parameterOld = parameterOnline.replace(
    /\bsrc=/g,
    /\bbookMode=true\b/.test(entry.options) ? "b=" : "x=",
  );

  return {
    parameterOnline,
    parameterOld,
  };
}

function buildViewerParamsForTestUrl(testUrl, extraParams) {
  const normalizedUrl = String(testUrl || "").trim();
  if (!normalizedUrl) {
    return null;
  }

  // Do NOT percent-encode the URL - the viewer's hash parser expects it as-is.
  const parameterOnline = `#src=${normalizedUrl}${extraParams}${fallbackViewerParams}`;
  const parameterOld = `#x=${normalizedUrl}${extraParams}${fallbackViewerParams}`;

  return {
    parameterOnline,
    parameterOld,
  };
}

function buildViewerUrl(viewerUrl, entry, extraParams, testFileBaseUrl) {
  const params = buildViewerParams(entry, testFileBaseUrl, extraParams);
  if (!params) {
    return null;
  }

  const normalizedViewer = normalizeViewerUrl(viewerUrl);
  if (isLegacyViewerUrl(normalizedViewer)) {
    return `${normalizedViewer}${params.parameterOld}`;
  }

  return `${normalizedViewer}${params.parameterOnline}`;
}

function buildPrimarySourceUrl(entry, testFileBaseUrl) {
  const primaryFile = Array.isArray(entry.file) ? entry.file[0] : entry.file;
  const normalizedFile = normalizeTestFilePath(primaryFile);
  return normalizedFile ? `${testFileBaseUrl}${normalizedFile}` : null;
}

function buildViewerUrlForTestUrl(viewerUrl, testUrl, extraParams) {
  const params = buildViewerParamsForTestUrl(testUrl, extraParams);
  if (!params) {
    return null;
  }

  const normalizedViewer = normalizeViewerUrl(viewerUrl);
  if (isLegacyViewerUrl(normalizedViewer)) {
    return `${normalizedViewer}${params.parameterOld}`;
  }

  return `${normalizedViewer}${params.parameterOnline}`;
}

function isManifestLeaf(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "string" &&
    Array.isArray(value[1])
  );
}

function collectManifestLeaves(tree, pathParts = [], rows = []) {
  if (!tree || typeof tree !== "object") {
    return rows;
  }
  for (const [key, value] of Object.entries(tree)) {
    const nextPath = [...pathParts, key];
    if (isManifestLeaf(value)) {
      rows.push({ path: nextPath.join("/"), value });
      continue;
    }
    if (value && typeof value === "object") {
      collectManifestLeaves(value, nextPath, rows);
    }
  }
  return rows;
}

function loadWptReftestEntries(manifestPath, { includeManual = false } = {}) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const reftests = collectManifestLeaves(manifest?.items?.reftest || {}).map(
    (entry) => ({ ...entry, testType: "reftest" }),
  );
  const printReftests = collectManifestLeaves(
    manifest?.items?.["print-reftest"] || {},
  ).map((entry) => ({ ...entry, testType: "print-reftest" }));
  const manualTests = includeManual
    ? collectManifestLeaves(manifest?.items?.manual || {}).map((entry) => ({
        ...entry,
        testType: "manual",
      }))
    : [];
  return [...reftests, ...printReftests, ...manualTests];
}

function joinUrl(baseUrl, relativePath) {
  return new URL(normalizeWptPath(relativePath), normalizeBaseUrl(baseUrl))
    .href;
}

function collectManualReftestTargets(opts) {
  const sharedExtra = normalizeExtraParams(opts.extraViewerParams);
  const actualExtra = `${sharedExtra}${normalizeExtraParams(opts.actualViewerParams)}`;
  const baselineExtra = `${sharedExtra}${normalizeExtraParams(opts.baselineViewerParams)}`;
  const titleFilters = opts.titleIncludes
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const fileFilters = opts.files.map((v) => normalizeCase(v)).filter(Boolean);
  const targets = [];

  for (let i = 0; i < opts.testUrls.length; i++) {
    const testUrl = String(opts.testUrls[i] || "").trim();
    const refUrl = String(opts.refUrls[i] || "").trim();
    if (!testUrl || !refUrl) {
      continue;
    }
    if (
      titleFilters.length > 0 &&
      !titleFilters.some((needle) => normalizeCase(testUrl).includes(needle))
    ) {
      continue;
    }
    if (
      fileFilters.length > 0 &&
      !fileFilters.includes(normalizeCase(testUrl))
    ) {
      continue;
    }

    const actualUrl = buildViewerUrlForTestUrl(
      opts.actualViewer,
      testUrl,
      actualExtra,
    );
    const baselineUrl = buildViewerUrlForTestUrl(
      opts.baselineViewer,
      refUrl,
      baselineExtra,
    );
    if (!actualUrl || !baselineUrl) {
      continue;
    }

    targets.push({
      category: "Custom reftest",
      title: testUrl,
      file: testUrl,
      sourceUrl: testUrl,
      actualUrl,
      actualPageRanges: null,
      references: [
        {
          referenceFile: refUrl,
          relation: "==",
          baselineUrl,
          baselinePageRanges: null,
        },
      ],
      sourceType: "custom-reftest",
      usedApprovedViewer: false,
    });
    if (opts.limit && targets.length >= opts.limit) {
      break;
    }
  }

  return targets;
}

function collectWptReftestTargets(opts) {
  const sharedExtra = normalizeExtraParams(opts.extraViewerParams);
  const actualExtra = `${sharedExtra}${normalizeExtraParams(opts.actualViewerParams)}${wptReftestViewerParams}`;
  const baselineExtra = `${sharedExtra}${normalizeExtraParams(opts.baselineViewerParams)}${wptReftestViewerParams}`;
  const titleFilters = opts.titleIncludes
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const fileFilters = opts.files
    .map((v) => normalizeCase(normalizeWptPath(v)))
    .filter(Boolean);
  const pathPrefixes = opts.wptPathPrefixes
    .map((v) => normalizeWptPath(v))
    .filter(Boolean);
  const targets = [];
  const unsupported = [];

  for (const entry of loadWptReftestEntries(opts.wptManifestPath)) {
    const testPath = normalizeWptPath(entry.path);
    if (!testPath) {
      continue;
    }
    if (
      pathPrefixes.length > 0 &&
      !pathPrefixes.some((prefix) => testPath.startsWith(prefix))
    ) {
      continue;
    }
    if (
      titleFilters.length > 0 &&
      !titleFilters.some((needle) => normalizeCase(testPath).includes(needle))
    ) {
      continue;
    }
    if (
      fileFilters.length > 0 &&
      !fileFilters.includes(normalizeCase(testPath))
    ) {
      continue;
    }

    const [, manifestData] = entry.value;
    const references = Array.isArray(manifestData?.[1]) ? manifestData[1] : [];
    const extras =
      manifestData?.[2] && typeof manifestData[2] === "object"
        ? manifestData[2]
        : {};
    const fuzzyMetadata = normalizeWptFuzzyMetadata(testPath, extras.fuzzy);
    const pageRanges =
      extras.page_ranges && typeof extras.page_ranges === "object"
        ? extras.page_ranges
        : {};
    const actualPathKey = `/${testPath}`;

    if (references.length === 0) {
      unsupported.push(testPath);
      continue;
    }
    const actualUrl = buildViewerUrlForTestUrl(
      opts.actualViewer,
      joinUrl(opts.wptBaseUrl, testPath),
      actualExtra,
    );
    if (!actualUrl) {
      continue;
    }

    const referenceTargets = [];
    let hasUnsupportedReference = false;
    for (const reference of references) {
      if (!Array.isArray(reference) || reference.length < 2) {
        hasUnsupportedReference = true;
        break;
      }
      const [referenceRawPath, relation] = reference;
      if (relation !== "==" && relation !== "!=") {
        hasUnsupportedReference = true;
        break;
      }

      const referencePath = normalizeWptPath(referenceRawPath);
      const baselineUrl = buildViewerUrlForTestUrl(
        opts.baselineViewer,
        joinUrl(opts.wptBaseUrl, referencePath),
        baselineExtra,
      );
      if (!baselineUrl) {
        continue;
      }

      referenceTargets.push({
        referenceFile: referencePath,
        relation,
        baselineUrl,
        baselinePageRanges: normalizePageRanges(pageRanges[referenceRawPath]),
        fuzzy: getWptFuzzyTolerance(fuzzyMetadata, referencePath, relation),
      });
    }

    if (hasUnsupportedReference || referenceTargets.length === 0) {
      unsupported.push(testPath);
      continue;
    }

    targets.push({
      category: `WPT ${entry.testType}`,
      title: testPath,
      file: testPath,
      sourceUrl: joinUrl(opts.wptBaseUrl, testPath),
      actualUrl,
      actualPageRanges: normalizePageRanges(pageRanges[actualPathKey]),
      references: referenceTargets,
      sourceType: entry.testType,
      usedApprovedViewer: false,
    });
    if (opts.limit && targets.length >= opts.limit) {
      break;
    }
  }

  if (unsupported.length > 0) {
    console.log(
      `Skipped ${unsupported.length} WPT ref entr${unsupported.length === 1 ? "y" : "ies"} with unsupported reference shape.`,
    );
  }

  return targets;
}

function collectManualReftestDiffTargets(opts) {
  const sharedExtra = normalizeExtraParams(opts.extraViewerParams);
  const actualExtra = `${sharedExtra}${normalizeExtraParams(opts.actualViewerParams)}`;
  const baselineExtra = `${sharedExtra}${normalizeExtraParams(opts.baselineViewerParams)}`;
  const titleFilters = opts.titleIncludes
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const fileFilters = opts.files.map((v) => normalizeCase(v)).filter(Boolean);
  const targets = [];

  for (let i = 0; i < opts.testUrls.length; i++) {
    const testUrl = String(opts.testUrls[i] || "").trim();
    const refUrl = String(opts.refUrls[i] || "").trim();
    if (!testUrl || !refUrl) {
      continue;
    }
    if (
      titleFilters.length > 0 &&
      !titleFilters.some((needle) => normalizeCase(testUrl).includes(needle))
    ) {
      continue;
    }
    if (
      fileFilters.length > 0 &&
      !fileFilters.includes(normalizeCase(testUrl))
    ) {
      continue;
    }

    const actualUrl = buildViewerUrlForTestUrl(
      opts.actualViewer,
      testUrl,
      actualExtra,
    );
    const baselineUrl = buildViewerUrlForTestUrl(
      opts.baselineViewer,
      testUrl,
      baselineExtra,
    );
    const actualReferenceUrl = buildViewerUrlForTestUrl(
      opts.actualViewer,
      refUrl,
      actualExtra,
    );
    const baselineReferenceUrl = buildViewerUrlForTestUrl(
      opts.baselineViewer,
      refUrl,
      baselineExtra,
    );
    if (
      !actualUrl ||
      !baselineUrl ||
      !actualReferenceUrl ||
      !baselineReferenceUrl
    ) {
      continue;
    }

    targets.push({
      category: "Custom reftest diff",
      title: normalizeManualTitle(testUrl),
      file: testUrl,
      sourceUrl: testUrl,
      actualUrl,
      baselineUrl,
      actualPageRanges: null,
      references: [
        {
          referenceFile: refUrl,
          relation: "==",
          actualReferenceUrl,
          baselineReferenceUrl,
          baselinePageRanges: null,
          fuzzy: null,
        },
      ],
      sourceType: "custom-reftest-diff",
      usedApprovedViewer: false,
    });
    if (opts.limit && targets.length >= opts.limit) {
      break;
    }
  }

  return targets;
}

function collectWptReftestDiffTargets(opts) {
  const sharedExtra = normalizeExtraParams(opts.extraViewerParams);
  const actualExtra = `${sharedExtra}${normalizeExtraParams(opts.actualViewerParams)}${wptReftestViewerParams}`;
  const baselineExtra = `${sharedExtra}${normalizeExtraParams(opts.baselineViewerParams)}${wptReftestViewerParams}`;
  const titleFilters = opts.titleIncludes
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const fileFilters = opts.files
    .map((v) => normalizeCase(normalizeWptPath(v)))
    .filter(Boolean);
  const pathPrefixes = opts.wptPathPrefixes
    .map((v) => normalizeWptPath(v))
    .filter(Boolean);
  const targets = [];
  const unsupported = [];

  for (const entry of loadWptReftestEntries(opts.wptManifestPath, {
    includeManual: true,
  })) {
    const testPath = normalizeWptPath(entry.path);
    if (!testPath) {
      continue;
    }
    if (
      pathPrefixes.length > 0 &&
      !pathPrefixes.some((prefix) => testPath.startsWith(prefix))
    ) {
      continue;
    }
    if (
      titleFilters.length > 0 &&
      !titleFilters.some((needle) => normalizeCase(testPath).includes(needle))
    ) {
      continue;
    }
    if (
      fileFilters.length > 0 &&
      !fileFilters.includes(normalizeCase(testPath))
    ) {
      continue;
    }

    const [, manifestData] = entry.value;
    const references = Array.isArray(manifestData?.[1]) ? manifestData[1] : [];
    const extras =
      manifestData?.[2] && typeof manifestData?.[2] === "object"
        ? manifestData[2]
        : {};
    const fuzzyMetadata = normalizeWptFuzzyMetadata(testPath, extras.fuzzy);
    const pageRanges =
      extras.page_ranges && typeof extras.page_ranges === "object"
        ? extras.page_ranges
        : {};
    const actualPathKey = `/${testPath}`;

    if (entry.testType === "manual") {
      const actualUrl = buildViewerUrlForTestUrl(
        opts.actualViewer,
        joinUrl(opts.wptBaseUrl, testPath),
        actualExtra,
      );
      const baselineUrl = buildViewerUrlForTestUrl(
        opts.baselineViewer,
        joinUrl(opts.wptBaseUrl, testPath),
        baselineExtra,
      );
      if (!actualUrl || !baselineUrl) {
        continue;
      }

      targets.push({
        category: "WPT manual",
        title: testPath,
        file: testPath,
        sourceUrl: joinUrl(opts.wptBaseUrl, testPath),
        actualUrl,
        baselineUrl,
        actualPageRanges: normalizePageRanges(pageRanges[actualPathKey]),
        references: [],
        sourceType: entry.testType,
        usedApprovedViewer: false,
      });
      if (opts.limit && targets.length >= opts.limit) {
        break;
      }
      continue;
    }

    if (references.length === 0) {
      unsupported.push(testPath);
      continue;
    }

    const actualUrl = buildViewerUrlForTestUrl(
      opts.actualViewer,
      joinUrl(opts.wptBaseUrl, testPath),
      actualExtra,
    );
    const baselineUrl = buildViewerUrlForTestUrl(
      opts.baselineViewer,
      joinUrl(opts.wptBaseUrl, testPath),
      baselineExtra,
    );
    if (!actualUrl || !baselineUrl) {
      continue;
    }

    const referenceTargets = [];
    let hasUnsupportedReference = false;
    for (const reference of references) {
      if (!Array.isArray(reference) || reference.length < 2) {
        hasUnsupportedReference = true;
        break;
      }
      const [referenceRawPath, relation] = reference;
      if (relation !== "==" && relation !== "!=") {
        hasUnsupportedReference = true;
        break;
      }

      const referencePath = normalizeWptPath(referenceRawPath);
      const actualReferenceUrl = buildViewerUrlForTestUrl(
        opts.actualViewer,
        joinUrl(opts.wptBaseUrl, referencePath),
        actualExtra,
      );
      const baselineReferenceUrl = buildViewerUrlForTestUrl(
        opts.baselineViewer,
        joinUrl(opts.wptBaseUrl, referencePath),
        baselineExtra,
      );
      if (!actualReferenceUrl || !baselineReferenceUrl) {
        continue;
      }

      referenceTargets.push({
        referenceFile: referencePath,
        relation,
        actualReferenceUrl,
        baselineReferenceUrl,
        baselinePageRanges: normalizePageRanges(pageRanges[referenceRawPath]),
        fuzzy: getWptFuzzyTolerance(fuzzyMetadata, referencePath, relation),
      });
    }

    if (hasUnsupportedReference || referenceTargets.length === 0) {
      unsupported.push(testPath);
      continue;
    }

    targets.push({
      category: `WPT ${entry.testType}`,
      title: testPath,
      file: testPath,
      sourceUrl: joinUrl(opts.wptBaseUrl, testPath),
      actualUrl,
      baselineUrl,
      actualPageRanges: normalizePageRanges(pageRanges[actualPathKey]),
      references: referenceTargets,
      sourceType: entry.testType,
      usedApprovedViewer: false,
    });
    if (opts.limit && targets.length >= opts.limit) {
      break;
    }
  }

  if (unsupported.length > 0) {
    console.log(
      `Skipped ${unsupported.length} WPT ref entr${unsupported.length === 1 ? "y" : "ies"} with unsupported reference shape.`,
    );
  }

  return targets;
}

function collectTargets(fileList, opts, approvedViewerMap = new Map()) {
  if (opts.mode === "reftest") {
    if (opts.testUrls.length > 0 || opts.refUrls.length > 0) {
      return collectManualReftestTargets(opts);
    }
    return collectWptReftestTargets(opts);
  }

  if (opts.mode === "reftest-diff") {
    if (opts.testUrls.length > 0 || opts.refUrls.length > 0) {
      return collectManualReftestDiffTargets(opts);
    }
    return collectWptReftestDiffTargets(opts);
  }

  const gitRef = getTestFilesGitRef();
  // Test HTML source must be common to both sides and follows actualViewer.
  const testFileBaseUrl = testFilesBaseUrlForViewer(opts.actualViewer, gitRef);
  const sharedExtra = normalizeExtraParams(opts.extraViewerParams);
  const baselineExtra = `${sharedExtra}${normalizeExtraParams(opts.baselineViewerParams)}`;
  const actualExtra = `${sharedExtra}${normalizeExtraParams(opts.actualViewerParams)}`;
  const categoryFilters = opts.categories
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const titleFilters = opts.titleIncludes
    .map((v) => normalizeCase(v))
    .filter(Boolean);
  const fileFilters = opts.files
    .map((v) => normalizeCase(normalizeTestFilePath(v)))
    .filter(Boolean);
  const hasExplicitEntryFilter =
    titleFilters.length > 0 || fileFilters.length > 0;

  const rows = [];

  // When --test-url is given, skip file-list.js entirely and use only custom URLs.
  if (opts.testUrls.length > 0) {
    const customCategory = "Custom URL";
    for (const rawUrl of opts.testUrls) {
      const testUrl = String(rawUrl || "").trim();
      if (!testUrl) {
        continue;
      }
      if (
        categoryFilters.length > 0 &&
        !categoryFilters.includes(normalizeCase(customCategory))
      ) {
        continue;
      }
      if (
        titleFilters.length > 0 &&
        !titleFilters.some((needle) => normalizeCase(testUrl).includes(needle))
      ) {
        continue;
      }
      const approvedViewerSpec = approvedViewerMap.get(
        `${customCategory}\x00${testUrl}`,
      );
      const approvedViewerUrl = approvedViewerSpec
        ? resolveViewerSpec(approvedViewerSpec).url
        : null;
      const baselineUrl =
        (approvedViewerUrl &&
          buildViewerUrlForTestUrl(
            approvedViewerUrl,
            testUrl,
            baselineExtra,
          )) ||
        buildViewerUrlForTestUrl(opts.baselineViewer, testUrl, baselineExtra);
      const actualUrl = buildViewerUrlForTestUrl(
        opts.actualViewer,
        testUrl,
        actualExtra,
      );
      if (!baselineUrl || !actualUrl) {
        continue;
      }
      rows.push({
        category: customCategory,
        title: testUrl,
        file: [testUrl],
        sourceUrl: testUrl,
        baselineUrl,
        actualUrl,
        sourceType: "custom-url",
        usedApprovedViewer: !!approvedViewerUrl,
      });
      if (opts.limit && rows.length >= opts.limit) {
        return rows;
      }
    }
    return rows;
  }

  for (const group of fileList) {
    if (
      categoryFilters.length > 0 &&
      !categoryFilters.includes(normalizeCase(group.category))
    ) {
      continue;
    }

    for (const entry of group.files) {
      if (!entry?.file) {
        continue;
      }

      if (entry.skipLayoutRegression && !hasExplicitEntryFilter) {
        continue;
      }

      const entryFiles = toArray(entry.file).map((f) =>
        normalizeTestFilePath(f),
      );

      if (
        titleFilters.length > 0 &&
        !titleFilters.some((needle) =>
          normalizeCase(String(entry.title || "")).includes(needle),
        )
      ) {
        continue;
      }

      if (
        fileFilters.length > 0 &&
        !entryFiles.some((f) => fileFilters.includes(normalizeCase(f)))
      ) {
        continue;
      }

      const approvedViewerSpec = approvedViewerMap.get(
        `${group.category}\x00${String(entry.title || "")}`,
      );
      const approvedViewerUrl = approvedViewerSpec
        ? resolveViewerSpec(approvedViewerSpec).url
        : null;
      const baselineUrl =
        (approvedViewerUrl &&
          buildViewerUrl(
            approvedViewerUrl,
            entry,
            baselineExtra,
            testFileBaseUrl,
          )) ||
        buildViewerUrl(
          opts.baselineViewer,
          entry,
          baselineExtra,
          testFileBaseUrl,
        );
      const actualUrl = buildViewerUrl(
        opts.actualViewer,
        entry,
        actualExtra,
        testFileBaseUrl,
      );
      if (!baselineUrl || !actualUrl) {
        continue;
      }

      rows.push({
        category: group.category,
        title: entry.title,
        file: entry.file,
        sourceUrl: buildPrimarySourceUrl(entry, testFileBaseUrl),
        baselineUrl,
        actualUrl,
        usedApprovedViewer: !!approvedViewerUrl,
      });

      if (opts.limit && rows.length >= opts.limit) {
        return rows;
      }
    }
  }

  return rows;
}

async function waitForViewerReady(page, timeoutMs) {
  await page.waitForFunction(
    () => {
      const status = document.body?.getAttribute(
        "data-vivliostyle-viewer-status",
      );
      if (status === "complete") return true;
      // Also return true if the error dialog has message text.
      const dialog = document.getElementById("vivliostyle-message-dialog");
      return !!dialog?.textContent?.trim();
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function checkViewerError(page) {
  return page.evaluate(() => {
    const dialog = document.getElementById("vivliostyle-message-dialog");
    return dialog?.textContent?.trim() || null;
  });
}

async function getTotalPages(page) {
  return page.evaluate(() => {
    const totalPages =
      document.querySelector(
        "#vivliostyle-viewer-viewport [data-vivliostyle-spread-container]",
      )?.children.length ?? 0;
    if (totalPages > 0) {
      return totalPages;
    }

    throw new Error(
      "Could not detect total pages (no spread container found).",
    );
  });
}

function createWallClockTimeoutError(timeoutMs, action) {
  const error = new Error(`Timeout (${timeoutMs}ms): ${action}`);
  error.name = "TimeoutError";
  return error;
}

async function withWallClockTimeout(task, timeoutMs, action) {
  let timer;

  try {
    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback) => (value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        callback(value);
      };

      timer = setTimeout(
        finish(() => reject(createWallClockTimeoutError(timeoutMs, action))),
        timeoutMs,
      );

      Promise.resolve().then(task).then(finish(resolve), finish(reject));
    });
  } finally {
    clearTimeout(timer);
  }
}

async function closeContextSafely(context, timeoutMs) {
  if (!context) {
    return;
  }

  try {
    await withWallClockTimeout(
      () => context.close(),
      Math.max(1000, Math.min(timeoutMs, 5000)),
      "closing browser context",
    );
  } catch (closeErr) {
    console.warn("Failed to close browser context:", closeErr);
  }
}

async function navigateToPageByInput(page, pageNumber, timeoutMs) {
  const input = page.locator("#vivliostyle-page-number");
  await input.fill(String(pageNumber), { timeout: timeoutMs });
  await input.press("Enter");
  await page.waitForFunction(
    (target) => {
      const status = document.body?.getAttribute(
        "data-vivliostyle-viewer-status",
      );
      const elem = document.getElementById("vivliostyle-page-number");
      const value = Number(elem && "value" in elem ? elem.value : "0");
      return status === "complete" && value === target;
    },
    pageNumber,
    { timeout: timeoutMs },
  );
}

async function navigateToNextPage(page, timeoutMs) {
  // For old viewers that have no page-number input, use the Move Next button.
  await page.click("#vivliostyle-menu-item_move-next", { timeout: timeoutMs });
  await page.waitForFunction(
    () =>
      document.body?.getAttribute("data-vivliostyle-viewer-status") ===
      "complete",
    undefined,
    { timeout: timeoutMs },
  );
}

async function capturePages({
  page,
  url,
  key,
  dir,
  timeoutMs,
  skipScreenshots,
  exportHtml,
}) {
  await withWallClockTimeout(
    () => page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs }),
    timeoutMs,
    "loading page",
  );
  await withWallClockTimeout(
    () => waitForViewerReady(page, timeoutMs),
    timeoutMs,
    "waiting for viewer ready",
  );

  // Hide Vercel's live-feedback widget that gets injected into Vercel preview
  // deployments — it would appear in screenshots and cause spurious diffs.
  await withWallClockTimeout(
    () =>
      page.addStyleTag({
        content: "vercel-live-feedback { display: none !important; }",
      }),
    timeoutMs,
    "injecting viewer styles",
  );

  const errorMsg = await withWallClockTimeout(
    () => checkViewerError(page),
    timeoutMs,
    "checking viewer errors",
  );
  if (errorMsg) {
    throw new Error(`Viewer error: ${errorMsg}`);
  }

  const totalPages = await withWallClockTimeout(
    () => getTotalPages(page),
    timeoutMs,
    "reading total pages",
  );

  if (exportHtml) {
    const html = await withWallClockTimeout(
      () => page.content(),
      timeoutMs,
      "reading rendered HTML",
    );
    const snapshotPath = path.join(dir, `${key}.html`);
    fs.writeFileSync(snapshotPath, html, "utf8");
  }

  if (!skipScreenshots) {
    const spreadContainer = page.locator(
      "#vivliostyle-viewer-viewport [data-vivliostyle-spread-container]",
    );
    // Detect navigation capability once: prefer input-based jump, fall back to
    // sequential Move-Next clicks for old viewers without the page-number field.
    const useInputNav =
      (await withWallClockTimeout(
        () => page.locator("#vivliostyle-page-number").count(),
        timeoutMs,
        "checking page navigation input",
      )) > 0;

    for (let p = 1; p <= totalPages; p++) {
      if (useInputNav) {
        await withWallClockTimeout(
          () => navigateToPageByInput(page, p, timeoutMs),
          timeoutMs,
          `navigating to page ${p}`,
        );
      } else if (p > 1) {
        // Already on page 1 after initial load; only click for subsequent pages.
        await withWallClockTimeout(
          () => navigateToNextPage(page, timeoutMs),
          timeoutMs,
          `navigating to next page ${p}`,
        );
      }
      const imagePath = path.join(
        dir,
        `${key}-p${String(p).padStart(4, "0")}.png`,
      );
      await withWallClockTimeout(
        () => spreadContainer.screenshot({ path: imagePath, scale: "css" }),
        timeoutMs,
        `capturing page ${p}`,
      );
    }
  }

  return { totalPages };
}

function toComparableError(err) {
  const removeAnsi = (value) =>
    String(value || "").replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");

  return {
    name: String(err?.name || "Error"),
    message: removeAnsi(err?.message || err),
    timeout:
      err?.name === "TimeoutError" ||
      /timeout/i.test(String(err?.message || "")),
  };
}

/**
 * A pool of reusable BrowserContexts.  Pages within the same context share
 * the browser's HTTP cache, so reusing a context across multiple captures
 * lets subsequent pages benefit from resources already fetched by earlier
 * ones (e.g. WPT reference images hosted on wpt.live).  This reduces
 * redundant network requests and lowers the chance of transient failures
 * during large batch runs.
 *
 * Contexts are checked out exclusively via acquire() and must be returned
 * via release() after use.
 */
class ContextPool {
  constructor(browser, { viewportWidth, viewportHeight, poolSize }) {
    this._browser = browser;
    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;
    this._poolSize = poolSize;
    /** @type {Array<import('playwright').BrowserContext>} */
    this._all = [];
    /** @type {Array<import('playwright').BrowserContext>} */
    this._available = [];
    /** @type {Array<(ctx: import('playwright').BrowserContext) => void>} */
    this._waiters = [];
  }

  async acquire() {
    // Return an idle context if one is available
    if (this._available.length > 0) {
      return this._available.pop();
    }
    // Create a new context if the pool has room
    if (this._all.length < this._poolSize) {
      const ctx = await this._browser.newContext({
        viewport: {
          width: this._viewportWidth,
          height: this._viewportHeight,
        },
        deviceScaleFactor: 2,
      });
      this._all.push(ctx);
      return ctx;
    }
    // All contexts are in use — wait for one to be released
    return new Promise((resolve) => {
      this._waiters.push(resolve);
    });
  }

  release(ctx) {
    if (this._waiters.length > 0) {
      const resolve = this._waiters.shift();
      resolve(ctx);
    } else {
      this._available.push(ctx);
    }
  }

  async closeAll(timeoutMs) {
    for (const ctx of this._all) {
      await closeContextSafely(ctx, timeoutMs);
    }
    this._all = [];
    this._available = [];
    this._waiters = [];
  }
}

async function captureOneSide({
  contextPool,
  browser,
  url,
  key,
  dir,
  timeoutMs,
  skipScreenshots,
  exportHtml,
  viewportWidth,
  viewportHeight,
}) {
  // When a context pool is available, check out a context exclusively and
  // use a dedicated page (closed after capture).  The context is returned
  // to the pool in the finally block.  Otherwise fall back to creating an
  // isolated context per capture (legacy behaviour).
  if (contextPool) {
    let context;
    let page;
    try {
      context = await contextPool.acquire();
      // Clear per-origin state so captures within the same context are
      // independent (cookies, localStorage, sessionStorage).  HTTP cache
      // is intentionally preserved to reduce redundant network fetches.
      await context.clearCookies();
      page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.clear();
        } catch (_) {}
        try {
          sessionStorage.clear();
        } catch (_) {}
      });
      const captured = await capturePages({
        page,
        url,
        key,
        dir,
        timeoutMs,
        skipScreenshots,
        exportHtml,
      });
      return { ok: true, ...captured };
    } catch (err) {
      return { ok: false, error: toComparableError(err) };
    } finally {
      if (page) {
        try {
          await withWallClockTimeout(
            () => page.close(),
            Math.max(1000, Math.min(timeoutMs, 5000)),
            "closing page",
          );
        } catch {
          // ignore
        }
      }
      if (context) {
        contextPool.release(context);
      }
    }
  }

  // Legacy path: one context per capture
  let context;
  try {
    context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
      // Use device scale factor 2 to get more accurate pixel diffs.
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const captured = await capturePages({
      page,
      url,
      key,
      dir,
      timeoutMs,
      skipScreenshots,
      exportHtml,
    });
    return { ok: true, ...captured };
  } catch (err) {
    return { ok: false, error: toComparableError(err) };
  } finally {
    await closeContextSafely(context, timeoutMs);
  }
}

function comparePngPair(
  baselinePngPath,
  actualPngPath,
  diffPngPath,
  pixelThreshold,
  maxAllowedChannelDifference = null,
) {
  const baseline = PNG.sync.read(fs.readFileSync(baselinePngPath));
  const actual = PNG.sync.read(fs.readFileSync(actualPngPath));

  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    return {
      width: baseline.width,
      height: baseline.height,
      actualWidth: actual.width,
      actualHeight: actual.height,
      diffPixels: Number.POSITIVE_INFINITY,
      diffRatio: Number.POSITIVE_INFINITY,
      exactDiffPixels: Number.POSITIVE_INFINITY,
      exactDiffRatio: Number.POSITIVE_INFINITY,
      exceededDiffPixels: Number.POSITIVE_INFINITY,
      maxChannelDifference: Number.POSITIVE_INFINITY,
      dimensionMismatch: true,
    };
  }

  let exactDiffPixels = 0;
  let exceededDiffPixels = 0;
  let maxChannelDifference = 0;
  for (let index = 0; index < baseline.data.length; index += 4) {
    const pixelDifference = Math.max(
      Math.abs(baseline.data[index] - actual.data[index]),
      Math.abs(baseline.data[index + 1] - actual.data[index + 1]),
      Math.abs(baseline.data[index + 2] - actual.data[index + 2]),
    );
    if (pixelDifference > 0) {
      exactDiffPixels += 1;
      if (pixelDifference > maxChannelDifference) {
        maxChannelDifference = pixelDifference;
      }
    }
    if (
      Number.isFinite(maxAllowedChannelDifference) &&
      pixelDifference > maxAllowedChannelDifference
    ) {
      exceededDiffPixels += 1;
    }
  }

  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const diffPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: pixelThreshold },
  );

  if (diffPngPath) {
    fs.writeFileSync(diffPngPath, PNG.sync.write(diff));
  }
  const allPixels = baseline.width * baseline.height;

  return {
    width: baseline.width,
    height: baseline.height,
    actualWidth: actual.width,
    actualHeight: actual.height,
    diffPixels,
    diffRatio: diffPixels / allPixels,
    exactDiffPixels,
    exactDiffRatio: exactDiffPixels / allPixels,
    exceededDiffPixels,
    maxChannelDifference,
    dimensionMismatch: false,
  };
}

function isWithinWptFuzzyTolerance(compared, fuzzy) {
  if (compared.dimensionMismatch) {
    return false;
  }

  if (compared.exactDiffPixels === 0 && compared.maxChannelDifference === 0) {
    return true;
  }

  // If pixelmatch (with threshold) reports zero diffPixels, the differences
  // are imperceptible (e.g. sub-pixel antialiasing artifacts).  Treat as PASS
  // even when no fuzzy metadata is declared for the test.
  if (compared.diffPixels === 0) {
    return true;
  }

  if (!fuzzy) {
    return false;
  }

  const allowedPerChannel = fuzzy.maxDifference;
  const allowedDifferent = fuzzy.totalPixels;
  const differentPixels =
    compared.exceededDiffPixels ?? compared.exactDiffPixels;

  return (
    allowedPerChannel[0] <= compared.maxChannelDifference &&
    compared.maxChannelDifference <= allowedPerChannel[1] &&
    allowedDifferent[0] <= differentPixels &&
    differentPixels <= allowedDifferent[1]
  );
}

function getSelectedPageNumbers(rangesValue, totalPages) {
  if (!rangesValue) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set();

  for (const rawRange of rangesValue) {
    const range = Array.isArray(rawRange) ? rawRange.slice(0, 2) : [rawRange];
    if (range.length === 0) {
      continue;
    }
    if (range.length === 1) {
      range[1] = range[0];
    }

    let [start, end] = range;
    if (start == null) {
      start = 1;
    }
    if (end == null) {
      end = totalPages;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      continue;
    }
    if (start > totalPages) {
      continue;
    }

    const from = Math.max(1, start);
    const to = Math.min(totalPages, end);
    for (let page = from; page <= to; page++) {
      pages.add(page);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

function capturePageImagePath(dir, key, pageNumber) {
  return path.join(dir, `${key}-p${String(pageNumber).padStart(4, "0")}.png`);
}

function compareCapturedReference({
  actual,
  actualDir,
  actualKey,
  actualPageRanges,
  baseline,
  baselineDir,
  baselineKey,
  baselinePageRanges,
  diffDir,
  diffKey,
  fuzzy,
  maxDiffRatio,
  pixelThreshold,
  relation,
  skipScreenshots,
  useWptMatching,
  writeDiffs,
}) {
  const actualPageNumbers = getSelectedPageNumbers(
    actualPageRanges,
    actual.totalPages,
  );
  const baselinePageNumbers = getSelectedPageNumbers(
    baselinePageRanges,
    baseline.totalPages,
  );

  const comparison = {
    relation,
    fuzzy,
    actualPageNumbers,
    baselinePageNumbers,
    pageCountMismatch: actualPageNumbers.length !== baselinePageNumbers.length,
    pages: [],
    unexpectedEquality: false,
    pass: false,
  };

  if (comparison.pageCountMismatch) {
    comparison.pass = relation === "!=";
    return comparison;
  }

  if (skipScreenshots) {
    comparison.pass = relation === "==";
    comparison.unexpectedEquality = relation === "!=";
    return comparison;
  }

  let foundDifference = false;

  for (let index = 0; index < actualPageNumbers.length; index++) {
    const actualPageNumber = actualPageNumbers[index];
    const baselinePageNumber = baselinePageNumbers[index];
    const diffPngPath =
      writeDiffs && relation === "=="
        ? path.join(
            diffDir,
            `${diffKey}-p${String(index + 1).padStart(4, "0")}.png`,
          )
        : null;

    const compared = comparePngPair(
      capturePageImagePath(baselineDir, baselineKey, baselinePageNumber),
      capturePageImagePath(actualDir, actualKey, actualPageNumber),
      diffPngPath,
      pixelThreshold,
      fuzzy?.maxDifference?.[1] ?? null,
    );
    const differs = useWptMatching
      ? !isWithinWptFuzzyTolerance(compared, fuzzy)
      : compared.diffRatio > maxDiffRatio;

    if (relation === "==") {
      if (differs) {
        comparison.pages.push({
          page: index + 1,
          actualPage: actualPageNumber,
          baselinePage: baselinePageNumber,
          ...compared,
          ...(diffPngPath ? { diffImage: diffPngPath } : {}),
        });
      } else if (diffPngPath) {
        fs.rmSync(diffPngPath, { force: true });
      }
    } else if (differs) {
      foundDifference = true;
    }
  }

  if (relation === "==") {
    comparison.pass = comparison.pages.length === 0;
    return comparison;
  }

  comparison.pass = foundDifference;
  comparison.unexpectedEquality = !comparison.pass;
  return comparison;
}

function compareCapturedViewerPair({
  actual,
  actualDir,
  actualKey,
  baseline,
  baselineDir,
  baselineKey,
  diffDir,
  diffKey,
  maxDiffRatio,
  pixelThreshold,
  skipScreenshots,
}) {
  const result = {
    pageCountMismatch: baseline.totalPages !== actual.totalPages,
    pages: [],
  };

  if (skipScreenshots) {
    return result;
  }

  const compareCount = Math.min(baseline.totalPages, actual.totalPages);
  for (let page = 1; page <= compareCount; page++) {
    const diffPngPath = path.join(
      diffDir,
      `${diffKey}-p${String(page).padStart(4, "0")}.png`,
    );
    const compared = comparePngPair(
      capturePageImagePath(baselineDir, baselineKey, page),
      capturePageImagePath(actualDir, actualKey, page),
      diffPngPath,
      pixelThreshold,
    );

    if (compared.diffRatio > maxDiffRatio) {
      result.pages.push({ page, ...compared, diffImage: diffPngPath });
    } else {
      fs.rmSync(diffPngPath, { force: true });
    }
  }

  return result;
}

function evaluateReferenceComparisons({
  testCapture,
  testDir,
  testKey,
  testPageRanges,
  referenceCaptures,
  referenceDir,
  diffDir,
  diffKeyPrefix,
  sourceType,
  maxDiffRatio,
  pixelThreshold,
  skipScreenshots,
  writeDiffs,
}) {
  let comparisonResults = referenceCaptures.map((item, referenceIndex) => ({
    referenceIndex,
    referenceFile: item.reference.referenceFile,
    referenceUrl: item.reference.referenceUrl || item.reference.baselineUrl,
    referenceTotalPages: item.result.totalPages,
    testTotalPages: testCapture.totalPages,
    ...compareCapturedReference({
      actual: testCapture,
      actualDir: testDir,
      actualKey: testKey,
      actualPageRanges: testPageRanges,
      baseline: item.result,
      baselineDir: referenceDir,
      baselineKey: item.referenceKey,
      baselinePageRanges: item.reference.baselinePageRanges,
      diffDir,
      diffKey: `${diffKeyPrefix}-r${String(referenceIndex + 1).padStart(2, "0")}`,
      fuzzy: item.reference.fuzzy || null,
      maxDiffRatio,
      pixelThreshold,
      relation: item.reference.relation,
      skipScreenshots,
      useWptMatching:
        sourceType !== "custom-reftest" && sourceType !== "custom-reftest-diff",
      writeDiffs: false,
    }),
  }));

  const failedMismatchs = comparisonResults.filter(
    (item) => item.relation === "!=" && !item.pass,
  );
  const matchResults = comparisonResults.filter(
    (item) => item.relation === "==",
  );
  const overallPass =
    failedMismatchs.length === 0 &&
    (matchResults.length === 0 || matchResults.some((item) => item.pass));

  let failingComparisons = [];
  if (!overallPass) {
    const failingReferenceIndexes = new Set(
      (failedMismatchs.length > 0
        ? failedMismatchs
        : matchResults.filter((item) => !item.pass)
      ).map((item) => item.referenceIndex),
    );

    if (writeDiffs) {
      comparisonResults = comparisonResults.map((item) => {
        if (
          item.relation === "==" &&
          !item.pass &&
          failingReferenceIndexes.has(item.referenceIndex)
        ) {
          const referenceItem = referenceCaptures[item.referenceIndex];
          return {
            referenceIndex: item.referenceIndex,
            referenceFile: item.referenceFile,
            referenceUrl: item.referenceUrl,
            referenceTotalPages: item.referenceTotalPages,
            testTotalPages: item.testTotalPages,
            ...compareCapturedReference({
              actual: testCapture,
              actualDir: testDir,
              actualKey: testKey,
              actualPageRanges: testPageRanges,
              baseline: referenceItem.result,
              baselineDir: referenceDir,
              baselineKey: referenceItem.referenceKey,
              baselinePageRanges: referenceItem.reference.baselinePageRanges,
              diffDir,
              diffKey: `${diffKeyPrefix}-r${String(item.referenceIndex + 1).padStart(2, "0")}`,
              fuzzy: referenceItem.reference.fuzzy || null,
              maxDiffRatio,
              pixelThreshold,
              relation: referenceItem.reference.relation,
              skipScreenshots,
              useWptMatching:
                sourceType !== "custom-reftest" &&
                sourceType !== "custom-reftest-diff",
              writeDiffs: true,
            }),
          };
        }
        return item;
      });
    }

    failingComparisons = comparisonResults.filter((item) =>
      failedMismatchs.length > 0
        ? item.relation === "!=" && !item.pass
        : item.relation === "==" && !item.pass,
    );
  }

  return {
    pass: overallPass,
    comparisonResults,
    failingComparisons,
    pageCountMismatch: comparisonResults.some((item) => item.pageCountMismatch),
    screenshotMismatch: comparisonResults.some((item) => item.pages.length > 0),
  };
}

function getCombinedChangeType({
  actualStatus,
  baselineStatus,
  viewerChanged,
}) {
  if (actualStatus === "ERROR" || baselineStatus === "ERROR") {
    // baseline=ERROR with actual=PASS is an improvement, just like FAIL→PASS.
    if (baselineStatus === "ERROR" && actualStatus === "PASS") {
      return "improvement";
    }
    // actual=ERROR → always an error regardless of baseline.
    if (actualStatus === "ERROR") {
      return "error";
    }
    // baseline=ERROR with actual=FAIL → treat as known-fail; we cannot
    // determine whether this is a regression since the baseline errored.
    return viewerChanged ? "changed-fail" : "known-fail";
  }
  if (actualStatus === "FAIL" && baselineStatus === "PASS") {
    return "regression";
  }
  if (actualStatus === "PASS" && baselineStatus === "FAIL") {
    return "improvement";
  }
  if (actualStatus === "PASS" && baselineStatus === "PASS") {
    return viewerChanged ? "expected-change" : "pass";
  }
  return viewerChanged ? "changed-fail" : "known-fail";
}

function getManualCombinedChangeType(viewerChanged) {
  return viewerChanged ? "changed" : "unchanged";
}

function summarizeCombinedEntries(entries) {
  const changeTypes = {};
  const statusPairs = {};

  for (const entry of entries) {
    changeTypes[entry.changeType] = (changeTypes[entry.changeType] || 0) + 1;
    const pairKey = `${entry.baselineStatus}->${entry.actualStatus}`;
    statusPairs[pairKey] = (statusPairs[pairKey] || 0) + 1;
  }

  return {
    changeTypes,
    statusPairs,
  };
}

const summaryCardOrder = [
  "pass",
  "improvement",
  "regression",
  "known-fail",
  "changed-fail",
  "expected-change",
  "changed",
  "unchanged",
  "fail",
  "error",
];

function formatChangeLabel(value) {
  if (value === "pass") return "PASS";
  if (value === "fail") return "FAIL";
  if (value === "error") return "ERROR";
  return String(value || "");
}

function statusClass(value) {
  if (value === "PASS") return "pass";
  if (value === "FAIL") return "fail";
  if (value === "ERROR") return "error";
  if (value === "MANUAL") return "neutral";
  if (value === "VIEW") return "neutral";
  return "neutral";
}

function changeClass(value) {
  if (value === "regression") return "regression";
  if (value === "improvement") return "improvement";
  if (value === "fail") return "fail";
  if (value === "changed") return "fail";
  if (value === "changed-fail") return "fail";
  if (value === "known-fail") return "known-fail";
  if (value === "unchanged") return "pass";
  if (value === "pass" || value === "expected-change") return "pass";
  if (value === "error") return "error";
  return "neutral";
}

function getOrderedChangeTypes(changeTypes) {
  const keys = Object.keys(changeTypes || {});
  const seen = new Set();
  const ordered = [];

  for (const key of summaryCardOrder) {
    if (keys.includes(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }

  return ordered.concat(keys.filter((key) => !seen.has(key)).sort());
}

const ansiEnabled =
  !process.env.NO_COLOR &&
  (Boolean(process.stdout?.isTTY) ||
    process.env.GITHUB_ACTIONS === "true" ||
    process.env.CI === "true" ||
    ["1", "2", "3", "true"].includes(
      String(process.env.FORCE_COLOR || "").toLowerCase(),
    ));
const ansiByTone = {
  pass: "\u001b[32m",
  improvement: "\u001b[32m",
  fail: "\u001b[31m",
  regression: "\u001b[31m",
  error: "\u001b[31m",
  "known-fail": "\u001b[33m",
  neutral: "\u001b[90m",
  info: "\u001b[36m",
  warning: "\u001b[33m",
  bold: "\u001b[1m",
};

function colorize(text, tone = "neutral") {
  const value = String(text ?? "");
  if (!ansiEnabled) {
    return value;
  }
  const color = ansiByTone[tone] || "";
  return color ? `${color}${value}\u001b[0m` : value;
}

function formatStatusForCli(status) {
  return colorize(status, statusClass(status));
}

function formatChangeForCli(changeType) {
  const tone = changeClass(changeType);
  return colorize(formatChangeLabel(changeType), tone);
}

function formatPathForCli(filePath) {
  return colorize(filePath, "info");
}

function formatPageList(pageNumbers) {
  if (!Array.isArray(pageNumbers) || pageNumbers.length === 0) {
    return "none";
  }
  if (pageNumbers.length <= 10) {
    return pageNumbers.join(", ");
  }
  return `${pageNumbers.slice(0, 10).join(", ")} ... (${pageNumbers.length} pages)`;
}

function getTriageSourcePath(outDir, baselinePath = null) {
  const yamlPath = path.join(outDir, "triage.yaml");
  if (fs.existsSync(yamlPath)) return yamlPath;
  if (baselinePath && fs.existsSync(baselinePath)) return baselinePath;
  return null;
}

function loadTriageStatusMap(outDir, baselinePath = null) {
  const sourcePath = getTriageSourcePath(outDir, baselinePath);
  if (!sourcePath) return new Map();

  try {
    const entries = yaml.load(fs.readFileSync(sourcePath, "utf8"));
    if (!Array.isArray(entries)) return new Map();

    return new Map(
      entries.map((e) => {
        // Use empty string for type-less entries (re-appended approvedViewer entries
        // stored without a type field), consistent with writeTriageTemplate's prevMap.
        const key = `${e.category}\x00${e.title}\x00${e.type || ""}`;
        const decision = String(e.decision || "").trim();
        return [
          key,
          {
            status: decision ? "triaged" : "pending",
            decision,
          },
        ];
      }),
    );
  } catch {
    return new Map();
  }
}

function getTriageStatus(triageStatusMap, category, title, type) {
  // 3-stage fallback: same type → type-less (re-appended approvedViewer entry) → other type.
  // Mirrors the prevMap lookup in writeTriageTemplate so runtime status is consistent
  // with the carry-over logic even when an entry switches between difference and error.
  return (
    triageStatusMap.get(`${category}\x00${title}\x00${type || "difference"}`) ||
    triageStatusMap.get(`${category}\x00${title}\x00`) ||
    triageStatusMap.get(
      `${category}\x00${title}\x00${type === "error" ? "difference" : "error"}`,
    ) || { status: "pending", decision: "" }
  );
}

function summarizeTriage(items, type, triageStatusMap) {
  let pending = 0;
  let triaged = 0;
  for (const item of items) {
    if (item.triageRequired === false) {
      continue;
    }
    // Prefer already-computed triage (may include approvedViewer drift override)
    const status =
      item.triage ??
      getTriageStatus(triageStatusMap, item.category, item.title, type);
    if (status.status === "triaged") {
      triaged += 1;
    } else {
      pending += 1;
    }
  }
  return { pending, triaged };
}

function withTriageInfo(items, type, triageStatusMap) {
  return items.map((item) => {
    if (item.triageRequired === false) {
      return {
        ...item,
        triage: { status: "not-needed", decision: "" },
      };
    }
    // Prefer already-computed triage (may include approvedViewer drift override)
    const triage =
      item.triage ??
      getTriageStatus(triageStatusMap, item.category, item.title, type);
    return {
      ...item,
      triage,
    };
  });
}

function writeReports(outDir, result, triageStatusMap) {
  const differencesWithTriage = withTriageInfo(
    result.differences,
    "difference",
    triageStatusMap,
  );
  const errorsWithTriage = withTriageInfo(
    result.errors,
    "error",
    triageStatusMap,
  );
  const differencesTriage = summarizeTriage(
    differencesWithTriage,
    "difference",
    triageStatusMap,
  );
  const errorsTriage = summarizeTriage(
    errorsWithTriage,
    "error",
    triageStatusMap,
  );

  // Build a lookup from diff/error arrays keyed by entry id
  const diffByIdMap = new Map(
    differencesWithTriage.map((item) => [item.id, item]),
  );
  const errorByIdMap = new Map();
  for (const item of errorsWithTriage) {
    const items = errorByIdMap.get(item.id) || [];
    items.push(item);
    errorByIdMap.set(item.id, items);
  }

  // Merge difference and error info into each entry, stripping fields
  // that are already present at the entry's top level to avoid duplication.
  const entryDuplicateKeys = new Set([
    "id",
    "category",
    "title",
    "file",
    "actualStatus",
    "baselineStatus",
    "sourceUrl",
    "actualUrl",
    "baselineUrl",
  ]);
  const stripDuplicateFields = (obj) => {
    const stripped = {};
    for (const [key, value] of Object.entries(obj)) {
      if (entryDuplicateKeys.has(key)) {
        continue;
      }
      // Strip redundant url from actual/baseline sub-objects
      if (
        (key === "actual" || key === "baseline") &&
        value &&
        typeof value === "object" &&
        "url" in value
      ) {
        const { url, ...rest } = value;
        stripped[key] = Object.keys(rest).length > 0 ? rest : undefined;
        if (stripped[key] === undefined) delete stripped[key];
      } else {
        stripped[key] = value;
      }
    }
    return stripped;
  };
  const entriesWithDetails = Array.isArray(result.entries)
    ? result.entries.map((entry) => {
        const diff = diffByIdMap.get(entry.id) || null;
        const entryErrors = errorByIdMap.get(entry.id) || [];
        return {
          ...entry,
          ...(diff ? { difference: stripDuplicateFields(diff) } : {}),
          ...(entryErrors.length > 0
            ? { errors: entryErrors.map(stripDuplicateFields) }
            : {}),
        };
      })
    : null;

  const resultWithTriage = {
    ...result,
    summary: {
      ...result.summary,
      triage: {
        differences: differencesTriage,
        errors: errorsTriage,
        pendingEntries: differencesTriage.pending + errorsTriage.pending,
        triagedEntries: differencesTriage.triaged + errorsTriage.triaged,
      },
    },
    ...(entriesWithDetails ? { entries: entriesWithDetails } : {}),
    differences: differencesWithTriage,
    errors: errorsWithTriage,
  };

  const jsonPath = path.join(outDir, "report.json");
  // Normalize file paths in JSON: convert absolute OS paths to
  // forward-slash relative paths from the report directory.
  const toRelPath = (p) =>
    p ? path.relative(outDir, p).split(path.sep).join("/") : p;
  const jsonReplacer = (key, value) => {
    if (key === "diffImage" && typeof value === "string") {
      return toRelPath(value);
    }
    if (key === "outDir" && typeof value === "string") {
      return path.relative(process.cwd(), value).split(path.sep).join("/");
    }
    if (key === "wptManifestPath" && typeof value === "string") {
      return path.relative(process.cwd(), value).split(path.sep).join("/");
    }
    return value;
  };
  // When entries array exists, difference/error info is merged into each entry,
  // so omit the separate top-level differences/errors arrays from the JSON.
  if (entriesWithDetails) {
    const { differences: _d, errors: _e, ...jsonResult } = resultWithTriage;
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(jsonResult, jsonReplacer, 2),
      "utf8",
    );
  } else {
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(resultWithTriage, jsonReplacer, 2),
      "utf8",
    );
  }

  const lines = [];
  const formatTriageLabel = (triage) =>
    triage.status === "not-needed"
      ? "not-needed"
      : `${triage.status}${triage.decision ? ` (${triage.decision})` : ""}`;
  lines.push(
    `# ${result.labels.actual} vs ${result.labels.baseline} comparison report`,
  );
  lines.push("");
  lines.push(`- Compared entries: ${result.summary.totalEntries}`);
  {
    const improvementCount =
      result.summary.outcomes?.changeTypes?.improvement ?? 0;
    const diffSuffix =
      improvementCount > 0
        ? ` (improvement: ${improvementCount}, pending: ${differencesTriage.pending}, triaged: ${differencesTriage.triaged})`
        : ` (pending: ${differencesTriage.pending}, triaged: ${differencesTriage.triaged})`;
    lines.push(
      `- Entries with differences: ${result.summary.entriesWithDifferences}${diffSuffix}`,
    );
  }
  lines.push(
    `- Entries with errors: ${result.summary.entriesWithErrors} (pending: ${errorsTriage.pending}, triaged: ${errorsTriage.triaged})`,
  );
  lines.push(`- Timeout entries: ${result.summary.timeoutEntries}`);
  lines.push(`- Page count changed: ${result.summary.pageCountMismatches}`);
  lines.push(`- Screenshot mismatches: ${result.summary.screenshotMismatches}`);
  if (result.summary.outcomes) {
    lines.push(
      `- Outcome summary: ${JSON.stringify(result.summary.outcomes.changeTypes)}`,
    );
  }
  lines.push("");

  if (resultWithTriage.differences.length === 0) {
    lines.push("No differences found.");
  } else {
    lines.push("## Differences");
    lines.push("");
    for (const diff of resultWithTriage.differences) {
      const triage = diff.triage;
      lines.push(`- [${diff.id}] [${diff.category}] ${diff.title}`);
      lines.push(`  triage: ${formatTriageLabel(triage)}`);
      if (diff.classification) {
        lines.push(
          `  outcome: ${diff.classification} (baseline=${diff.baselineStatus}, actual=${diff.actualStatus})`,
        );
      }
      if (Array.isArray(diff.comparisons) && diff.comparisons.length > 0) {
        if (diff.comparisons.some((comparison) => comparison.side)) {
          const uniqueReferences = diff.comparisons.filter(
            (comparison, index, comparisons) =>
              comparisons.findIndex(
                (item) =>
                  item.referenceFile === comparison.referenceFile &&
                  item.relation === comparison.relation,
              ) === index,
          );
          const hasMultipleReferences = uniqueReferences.length > 1;
          const comparisonsBySide = new Map();
          for (const comparison of diff.comparisons) {
            const side = comparison.side || "reference";
            const items = comparisonsBySide.get(side) || [];
            items.push(comparison);
            comparisonsBySide.set(side, items);
          }
          for (const comparison of uniqueReferences) {
            lines.push(
              `  reference: ${comparison.referenceFile} (${comparison.relation})`,
            );
          }
          for (const [side, comparisons] of comparisonsBySide) {
            const sideStatus =
              side === result.labels.actual
                ? diff.actualStatus
                : side === result.labels.baseline
                  ? diff.baselineStatus
                  : null;
            const sideTestUrl =
              side === result.labels.actual
                ? diff.actual.url
                : side === result.labels.baseline
                  ? diff.baseline?.url
                  : null;
            if (sideStatus) {
              lines.push(`  ${side} result: ${sideStatus}`);
            }
            if (sideTestUrl) {
              lines.push(`  ${side} test: ${sideTestUrl}`);
            }
            for (const comparison of comparisons) {
              if (comparison.pageCountMismatch) {
                lines.push(
                  `  ${side} selected pages${
                    hasMultipleReferences
                      ? ` (${comparison.referenceFile})`
                      : ""
                  }: test=[${formatPageList(comparison.actualPageNumbers)}], reference=[${formatPageList(comparison.baselinePageNumbers)}]`,
                );
              }
              if (comparison.unexpectedEquality) {
                lines.push(
                  `  ${side} unexpected equality${
                    hasMultipleReferences
                      ? ` (${comparison.referenceFile})`
                      : ""
                  }: comparison matched but relation is !=`,
                );
              }
              for (const p of comparison.pages) {
                const pageLabel =
                  p.actualPage === p.baselinePage
                    ? `page ${p.actualPage}`
                    : `test page ${p.actualPage} vs reference page ${p.baselinePage}`;
                lines.push(
                  `  ${side} ${pageLabel}${
                    hasMultipleReferences
                      ? ` (${comparison.referenceFile})`
                      : ""
                  }: diffRatio=${p.diffRatio}, diffPixels=${p.diffPixels}${
                    p.dimensionMismatch ? " (dimension mismatch)" : ""
                  }`,
                );
              }
              lines.push(
                `  ${side} reference render${
                  hasMultipleReferences ? ` (${comparison.referenceFile})` : ""
                }: ${comparison.baselineUrl}`,
              );
            }
          }
        } else {
          for (const comparison of diff.comparisons) {
            lines.push(
              `  reference: ${comparison.referenceFile} (${comparison.relation})`,
            );
            if (comparison.pageCountMismatch) {
              lines.push(
                `  selected pages: ${result.labels.actual}=[${formatPageList(comparison.actualPageNumbers)}], ${result.labels.baseline}=[${formatPageList(comparison.baselinePageNumbers)}]`,
              );
            }
            if (comparison.unexpectedEquality) {
              lines.push(
                "  unexpected equality: comparison matched but relation is !=",
              );
            }
            for (const p of comparison.pages) {
              const pageLabel =
                p.actualPage === p.baselinePage
                  ? `page ${p.actualPage}`
                  : `${result.labels.actual} page ${p.actualPage} vs ${result.labels.baseline} page ${p.baselinePage}`;
              lines.push(
                `  ${pageLabel}: diffRatio=${p.diffRatio}, diffPixels=${p.diffPixels}${
                  p.dimensionMismatch ? " (dimension mismatch)" : ""
                }`,
              );
            }
            lines.push(`  ${result.labels.actual}: ${diff.actual.url}`);
            lines.push(
              `  ${result.labels.baseline} render: ${comparison.baselineUrl}`,
            );
          }
        }
      } else {
        if (diff.pageCountMismatch) {
          lines.push(
            `  page count: ${result.labels.actual}=${diff.actual.totalPages}, ${result.labels.baseline}=${diff.baseline.totalPages}`,
          );
        }
        for (const p of diff.pages) {
          lines.push(
            `  page ${p.page}: diffRatio=${p.diffRatio}, diffPixels=${p.diffPixels}${
              p.dimensionMismatch ? " (dimension mismatch)" : ""
            }`,
          );
        }
        lines.push(`  ${result.labels.actual}: ${diff.actual.url}`);
        lines.push(`  ${result.labels.baseline}: ${diff.baseline.url}`);
      }
      lines.push("");
    }
  }

  if (resultWithTriage.errors.length > 0) {
    lines.push("## Errors");
    lines.push("");
    for (const item of resultWithTriage.errors) {
      const triage = item.triage;
      lines.push(`- [${item.id}] [${item.category}] ${item.title}`);
      lines.push(`  triage: ${formatTriageLabel(triage)}`);
      lines.push(`  side: ${item.side}`);
      if (item.sideErrors) {
        for (const se of item.sideErrors) {
          if (se.referenceFile) {
            lines.push(`  ${se.side} reference: ${se.referenceFile}`);
          }
          lines.push(`  ${se.side} timeout: ${se.error.timeout}`);
          lines.push(
            `  ${se.side} error: ${se.error.name}: ${se.error.message}`,
          );
        }
      } else {
        if (item.referenceFile) {
          lines.push(`  reference: ${item.referenceFile}`);
        }
        lines.push(`  timeout: ${item.error.timeout}`);
        lines.push(`  error: ${item.error.name}: ${item.error.message}`);
      }
      lines.push(`  ${result.labels.actual}: ${item.actualUrl}`);
      lines.push(`  ${result.labels.baseline}: ${item.baselineUrl}`);
      lines.push("");
    }
  }

  const htmlPath = path.join(outDir, "report.html");
  const mdPath = path.join(outDir, "report.md");
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  const renderAnchor = (url, body, className = "", target = "_blank") =>
    url
      ? `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}" target="${target}">${body}</a>`
      : body;
  const renderBadge = (label, className, url, target) =>
    renderAnchor(
      url,
      `<span class="badge ${className}">${escapeHtml(label)}</span>`,
      "badge-link",
      target,
    );
  const toReportRelativePath = (filePath) =>
    escapeHtml(path.relative(outDir, filePath).split(path.sep).join("/"));
  const collectDiffImageLinks = (diff) => {
    if (!diff) return [];

    const links = [];
    const seen = new Set();
    const pushLink = (label, filePath) => {
      if (!filePath || seen.has(filePath)) {
        return;
      }
      seen.add(filePath);
      links.push({ label, href: toReportRelativePath(filePath) });
    };

    if (Array.isArray(diff.pages)) {
      for (const page of diff.pages) {
        const label =
          result.options.mode === "reftest-diff"
            ? `${result.labels.baseline} vs ${result.labels.actual} p${page.page}`
            : `p${page.page}`;
        pushLink(label, page.diffImage);
      }
    }
    if (Array.isArray(diff.comparisons)) {
      const comparisonsPerSide = new Map();
      for (const comparison of diff.comparisons) {
        const sideKey = comparison.side || "";
        comparisonsPerSide.set(
          sideKey,
          (comparisonsPerSide.get(sideKey) || 0) + 1,
        );
      }
      const seenPerSide = new Map();
      diff.comparisons.forEach((comparison, comparisonIndex) => {
        const sideKey = comparison.side || "";
        const sideIndex = (seenPerSide.get(sideKey) || 0) + 1;
        seenPerSide.set(sideKey, sideIndex);
        comparison.pages.forEach((page, pageIndex) => {
          const pageNumber = page.actualPage || page.page || pageIndex + 1;
          let prefix;
          if (comparison.side) {
            const refLabel =
              (comparisonsPerSide.get(sideKey) || 0) > 1
                ? `ref${sideIndex}`
                : "ref";
            prefix = `${comparison.side} ${refLabel} p${pageNumber}`;
          } else {
            prefix =
              diff.comparisons.length > 1
                ? `ref${comparisonIndex + 1} p${pageNumber}`
                : `p${pageNumber}`;
          }
          pushLink(prefix, page.diffImage);
        });
      });
    }

    return links;
  };
  const renderChangeCell = (changeType, diff) => {
    const badge = renderBadge(
      formatChangeLabel(changeType),
      changeClass(changeType),
    );
    const diffLinks = collectDiffImageLinks(diff);
    if (diffLinks.length === 0) {
      return badge;
    }
    const linksHtml = diffLinks
      .map(
        (item) =>
          `<a class="diff-link" href="${item.href}" target="lr-diff">${escapeHtml(item.label)}</a>`,
      )
      .join("");
    return `<div class="change-cell">${badge}<span class="diff-links">${linksHtml}</span></div>`;
  };
  const renderStatusBadge = (status, url, fallbackLabel, target) => {
    const label = status === "VIEW" ? fallbackLabel : status;
    return renderBadge(label, statusClass(status), url, target);
  };
  const renderFallbackViewerBadge = (url, target) =>
    renderBadge(
      result.options.mode === "version-diff" ? "view" : "-",
      "neutral",
      url,
      target,
    );
  const renderFallbackActualDifferenceBadge = (url, target) =>
    result.options.mode === "version-diff"
      ? renderBadge("view", "neutral", url, target)
      : renderBadge("FAIL", "fail", url, target);
  const diffById = new Map(
    resultWithTriage.differences.map((item) => [item.id, item]),
  );
  const errorById = new Map();
  for (const item of resultWithTriage.errors) {
    const items = errorById.get(item.id) || [];
    items.push(item);
    errorById.set(item.id, items);
  }
  const getEntryFilterMeta = (entryId) => {
    const diff = diffById.get(entryId);
    const entryErrors = errorById.get(entryId) || [];
    const hasError = entryErrors.length > 0;
    const hasTimeout = entryErrors.some((err) =>
      err.sideErrors
        ? err.sideErrors.some((sideError) => sideError.error.timeout)
        : err.error.timeout,
    );
    const hasPageCountMismatch = Boolean(diff?.pageCountMismatch);
    const hasScreenshotMismatch = Boolean(
      (diff?.pages?.length || 0) > 0 ||
      diff?.comparisons?.some((comparison) => comparison.pages.length > 0),
    );
    return {
      hasError,
      hasTimeout,
      hasPageCountMismatch,
      hasScreenshotMismatch,
    };
  };
  const entryFilterMetaList = Array.isArray(resultWithTriage.entries)
    ? resultWithTriage.entries.map((entry) => ({
        entry,
        meta: getEntryFilterMeta(entry.id),
      }))
    : [];
  const entryFilterMetaById = new Map(
    Array.isArray(resultWithTriage.entries)
      ? entryFilterMetaList.map(({ entry, meta }) => [entry.id, meta])
      : [],
  );
  const countEntriesBy = (predicate, fallback) => {
    if (entryFilterMetaList.length === 0) {
      return fallback;
    }
    let count = 0;
    for (const { entry, meta } of entryFilterMetaList) {
      if (predicate(entry, meta)) {
        count += 1;
      }
    }
    return count;
  };
  const changeCounts = result.summary.outcomes?.changeTypes || {};
  const errorChangeCount = changeCounts.error ?? 0;
  const errorCount = countEntriesBy(
    (_, meta) => meta.hasError,
    result.summary.entriesWithErrors,
  );
  const pageCountMismatchCount = countEntriesBy(
    (_, meta) => meta.hasPageCountMismatch,
    result.summary.pageCountMismatches,
  );
  const screenshotMismatchCount = countEntriesBy(
    (_, meta) => meta.hasScreenshotMismatch,
    result.summary.screenshotMismatches,
  );
  const timeoutCount = countEntriesBy(
    (_, meta) => meta.hasTimeout,
    result.summary.timeoutEntries,
  );
  const showEntryErrorsCard = errorCount > 0 && errorCount !== errorChangeCount;
  const renderRowFilterAttributes = ({
    changeType,
    hasError = false,
    hasTimeout = false,
    hasPageCountMismatch = false,
    hasScreenshotMismatch = false,
  }) =>
    `data-filter-change-type="${escapeHtml(changeType)}" data-filter-error="${hasError ? "1" : "0"}" data-filter-timeout="${hasTimeout ? "1" : "0"}" data-filter-page-count-mismatch="${hasPageCountMismatch ? "1" : "0"}" data-filter-screenshot-mismatch="${hasScreenshotMismatch ? "1" : "0"}"`;
  const summaryCards = [
    {
      label: "Compared",
      value: Array.isArray(resultWithTriage.entries)
        ? resultWithTriage.entries.length
        : result.summary.totalEntries,
      className: "neutral",
      filter: { kind: "clear", value: "", label: "Compared" },
    },
    ...getOrderedChangeTypes(changeCounts).map((changeType) => ({
      label: formatChangeLabel(changeType),
      value: changeCounts[changeType],
      className: changeClass(changeType),
      filter: {
        kind: "change-type",
        value: changeType,
        label: formatChangeLabel(changeType),
      },
    })),
    ...(showEntryErrorsCard
      ? [
          {
            label: "Entry errors",
            value: errorCount,
            className: "error",
            filter: { kind: "error", value: "1", label: "Entry errors" },
          },
        ]
      : []),
    {
      label: "Page count changed",
      value: pageCountMismatchCount,
      className: pageCountMismatchCount > 0 ? "fail" : "neutral",
      filter: {
        kind: "page-count-mismatch",
        value: "1",
        label: "Page count changed",
      },
    },
    {
      label: "Screenshot mismatches",
      value: screenshotMismatchCount,
      className: screenshotMismatchCount > 0 ? "fail" : "neutral",
      filter: {
        kind: "screenshot-mismatch",
        value: "1",
        label: "Screenshot mismatches",
      },
    },
    {
      label: "Timeout entries",
      value: timeoutCount,
      className: timeoutCount > 0 ? "error" : "neutral",
      filter: { kind: "timeout", value: "1", label: "Timeout entries" },
    },
  ];
  const rows = Array.isArray(resultWithTriage.entries)
    ? resultWithTriage.entries
        .map((entry) => {
          const diff = diffById.get(entry.id);
          const entryErrors = errorById.get(entry.id) || [];
          const entryMeta = entryFilterMetaById.get(entry.id) || {
            hasError: false,
            hasTimeout: false,
            hasPageCountMismatch: false,
            hasScreenshotMismatch: false,
          };
          const notes = [];
          if (diff?.pageCountMismatch) {
            notes.push("page count changed");
          }
          if (diff?.pages?.length > 0) {
            notes.push(`${diff.pages.length} viewer diff page(s)`);
          }
          if (entryErrors.length > 0) {
            for (const err of entryErrors) {
              const noteText = err.sideErrors
                ? err.sideErrors
                    .map((se) => {
                      const sideLabel = se.referenceFile
                        ? `${se.side} (${se.referenceFile})`
                        : se.side;
                      return `${sideLabel}: ${se.error.message}`;
                    })
                    .join(" | ")
                : `${err.referenceFile ? `${err.side} (${err.referenceFile})` : err.side}: ${err.error.message}`;
              notes.push(noteText);
            }
          }
          const titleHtml = renderAnchor(
            entry.sourceUrl,
            escapeHtml(entry.title),
            "test-link",
            "lr-source",
          );
          const entryFiles = Array.isArray(entry.file)
            ? entry.file
            : entry.file
              ? [entry.file]
              : [];
          const fileText = entryFiles.join(", ");
          const titleMatchesFile =
            fileText && normalizeCase(entry.title) === normalizeCase(fileText);
          // Build file links for version-diff mode (derive base URL from sourceUrl and first file)
          const fileLinksHtml = (() => {
            if (titleMatchesFile || !fileText) return "";
            if (!entry.sourceUrl || entryFiles.length === 0)
              return `<div class="entry-file">${escapeHtml(fileText)}</div>`;
            const firstFile = normalizeTestFilePath(entryFiles[0]);
            const baseUrl =
              firstFile && entry.sourceUrl.endsWith(firstFile)
                ? entry.sourceUrl.slice(0, -firstFile.length)
                : null;
            if (!baseUrl)
              return `<div class="entry-file">${escapeHtml(fileText)}</div>`;
            const links = entryFiles.map((f) => {
              const normalized = normalizeTestFilePath(f);
              const url = normalized ? `${baseUrl}${normalized}` : null;
              return url
                ? renderAnchor(url, escapeHtml(f), "ref-link", "lr-source")
                : escapeHtml(f);
            });
            return `<div class="entry-file">${links.join(", ")}</div>`;
          })();
          // Reference file links (raw file URL, not viewer URL)
          const refsHtml = (entry.references || [])
            .map((ref) => {
              const rawRefUrl = result.options.wptBaseUrl
                ? joinUrl(result.options.wptBaseUrl, ref.referenceFile)
                : null;
              return `<div class="entry-ref">${ref.relation || "=="} ${rawRefUrl ? renderAnchor(rawRefUrl, escapeHtml(ref.referenceFile), "ref-link", "lr-source") : escapeHtml(ref.referenceFile)}</div>`;
            })
            .join("");
          // Reference viewer links for Baseline/Actual columns (reftest-diff mode only)
          const refs = entry.references || [];
          const hasRefDiffUrls = refs.some(
            (ref) => ref.actualReferenceUrl && ref.baselineReferenceUrl,
          );
          const renderRefViewerLink = (label, url, target = "_blank") =>
            `<a class="ref-viewer-link" href="${escapeHtml(url)}" target="${target}">${escapeHtml(label)}</a>`;
          const baselineRefLinks = hasRefDiffUrls
            ? refs
                .filter((ref) => ref.baselineReferenceUrl)
                .map((ref, i, arr) =>
                  renderRefViewerLink(
                    `${result.labels.baseline} ref${arr.length > 1 ? i + 1 : ""}`,
                    ref.baselineReferenceUrl,
                    "lr-baseline",
                  ),
                )
            : [];
          const actualRefLinks = hasRefDiffUrls
            ? refs
                .filter((ref) => ref.actualReferenceUrl)
                .map((ref, i, arr) =>
                  renderRefViewerLink(
                    `${result.labels.actual} ref${arr.length > 1 ? i + 1 : ""}`,
                    ref.actualReferenceUrl,
                    "lr-actual",
                  ),
                )
            : [];
          const notesText = notes.length > 0 ? notes.join(" | ") : "-";
          return `<tr ${renderRowFilterAttributes({
            changeType: entry.changeType,
            hasError: entryMeta.hasError,
            hasTimeout: entryMeta.hasTimeout,
            hasPageCountMismatch: entryMeta.hasPageCountMismatch,
            hasScreenshotMismatch: entryMeta.hasScreenshotMismatch,
          })}>
          <td class="entry-id">${escapeHtml(entry.id)}</td>
          <td class="test-path"><div class="entry-category">${escapeHtml(entry.category || "")}</div><div class="entry-title">${titleHtml}</div>${fileLinksHtml}${refsHtml}</td>
  <td>${baselineRefLinks.length > 0 ? `<div class="status-cell">${renderStatusBadge(entry.baselineStatus, entry.baselineUrl, result.labels.baseline, "lr-baseline")}${baselineRefLinks.join("")}</div>` : renderStatusBadge(entry.baselineStatus, entry.baselineUrl, result.labels.baseline, "lr-baseline")}</td>
  <td>${actualRefLinks.length > 0 ? `<div class="status-cell">${renderStatusBadge(entry.actualStatus, entry.actualUrl, result.labels.actual, "lr-actual")}${actualRefLinks.join("")}</div>` : renderStatusBadge(entry.actualStatus, entry.actualUrl, result.labels.actual, "lr-actual")}</td>
          <td>${renderChangeCell(entry.changeType, diff)}</td>
          <td>${escapeHtml(notesText)}</td>
</tr>`;
        })
        .join("\n")
    : resultWithTriage.differences
        .map(
          (diff) => `<tr ${renderRowFilterAttributes({
            changeType: "difference",
            hasPageCountMismatch: Boolean(diff.pageCountMismatch),
            hasScreenshotMismatch: Boolean(
              (diff.pages?.length || 0) > 0 ||
              diff.comparisons?.some(
                (comparison) => comparison.pages.length > 0,
              ),
            ),
          })}>
          <td class="entry-id">${escapeHtml(diff.id)}</td>
          <td class="test-path"><div class="entry-category">${escapeHtml(diff.category || "")}</div><div class="entry-title">${renderAnchor(diff.sourceUrl, escapeHtml(diff.title), "test-link", "lr-source")}</div>${diff.file && normalizeCase(diff.title) !== normalizeCase(Array.isArray(diff.file) ? diff.file.join(", ") : diff.file) ? `<div class="entry-file">${escapeHtml(Array.isArray(diff.file) ? diff.file.join(", ") : diff.file)}</div>` : ""}</td>
  <td>${renderFallbackViewerBadge(diff.baseline?.url, "lr-baseline")}</td>
  <td>${renderFallbackActualDifferenceBadge(diff.actual?.url, "lr-actual")}</td>
          <td>${renderChangeCell("difference", diff)}</td>
  <td>${escapeHtml(diff.pageCountMismatch ? "page count changed" : `${diff.pages.length} page diff(s)`)}</td>
</tr>`,
        )
        .concat(
          resultWithTriage.errors.map((item) => {
            const isBaselineError = item.sideErrors
              ? item.sideErrors.some(
                  (se) =>
                    se.side === result.labels.baseline ||
                    se.side.startsWith(result.labels.baseline + "-"),
                )
              : item.side === result.labels.baseline ||
                item.side.startsWith(result.labels.baseline + "-");
            const isActualError = item.sideErrors
              ? item.sideErrors.some(
                  (se) =>
                    se.side === result.labels.actual ||
                    se.side.startsWith(result.labels.actual + "-"),
                )
              : item.side === result.labels.actual ||
                item.side.startsWith(result.labels.actual + "-");
            const noteText = item.sideErrors
              ? item.sideErrors
                  .map((se) => {
                    const sideLabel = se.referenceFile
                      ? `${se.side} (${se.referenceFile})`
                      : se.side;
                    return `${sideLabel}: ${se.error.message}`;
                  })
                  .join(" | ")
              : `${item.referenceFile ? `${item.side} (${item.referenceFile})` : item.side}: ${item.error.message}`;
            return `<tr ${renderRowFilterAttributes({
              changeType: "error",
              hasError: true,
              hasTimeout: item.sideErrors
                ? item.sideErrors.some((sideError) => sideError.error.timeout)
                : item.error.timeout,
            })}>
  <td class="entry-id">${escapeHtml(item.id)}</td>
  <td class="test-path"><div class="entry-category">${escapeHtml(item.category || "")}</div><div class="entry-title">${renderAnchor(item.sourceUrl, escapeHtml(item.title), "test-link", "lr-source")}</div>${item.file && normalizeCase(item.title) !== normalizeCase(Array.isArray(item.file) ? item.file.join(", ") : item.file) ? `<div class="entry-file">${escapeHtml(Array.isArray(item.file) ? item.file.join(", ") : item.file)}</div>` : ""}</td>
  <td>${isBaselineError ? renderBadge("ERROR", "error", item.baselineUrl, "lr-baseline") : renderFallbackViewerBadge(item.baselineUrl, "lr-baseline")}</td>
  <td>${isActualError ? renderBadge("ERROR", "error", item.actualUrl, "lr-actual") : renderFallbackViewerBadge(item.actualUrl, "lr-actual")}</td>
  <td>${renderChangeCell("error")}</td>
  <td>${escapeHtml(noteText)}</td>
</tr>`;
          }),
        )
        .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(result.labels.actual)} vs ${escapeHtml(result.labels.baseline)} report</title>
  <style>
    :root { color-scheme: light; --bg:#f6f4ef; --panel:#fffdf8; --ink:#222; --muted:#6b665c; --line:#ddd4c4; --pass:#1f7a4d; --fail:#b65f4f; --known-fail:#c07a6c; --regression:#8f1d14; --error:#8a2323; --improvement:#0b5d3b; --neutral:#7a6f5a; }
    html, body { height:100%; }
    body { margin:0; overflow:hidden; font:14px/1.4 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:linear-gradient(180deg,#f3efe6 0%,#f8f6f1 100%); }
    main { box-sizing:border-box; max-width:1200px; height:100vh; margin:0 auto; padding:20px 16px 24px; display:flex; flex-direction:column; }
    h1 { margin:0 0 4px; font-size:20px; }
    p { margin:0; color:var(--muted); font-size:13px; }
    .header-link { color:var(--muted); text-decoration:none; }
    .header-link:hover { text-decoration:underline; }
    .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:6px; margin:10px 0; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:8px 10px; box-shadow:0 4px 12px rgba(0,0,0,.03); }
    .summary-card { appearance:none; width:100%; text-align:left; font:inherit; color:inherit; }
    .summary-card.is-filterable { cursor:pointer; transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
    .summary-card.is-filterable:hover { transform:translateY(-1px); }
    .summary-card.is-filterable.is-active { box-shadow:0 0 0 2px rgba(0,0,0,.08), 0 10px 24px rgba(0,0,0,.08); }
    .summary-card.pass { border-color:color-mix(in srgb, var(--pass) 30%, var(--line)); background:color-mix(in srgb, var(--pass) 10%, var(--panel)); }
    .summary-card.improvement { border-color:color-mix(in srgb, var(--improvement) 44%, var(--line)); background:color-mix(in srgb, var(--improvement) 18%, var(--panel)); }
    .summary-card.fail { border-color:color-mix(in srgb, var(--fail) 30%, var(--line)); background:color-mix(in srgb, var(--fail) 10%, var(--panel)); }
    .summary-card.known-fail { border-color:color-mix(in srgb, var(--known-fail) 30%, var(--line)); background:color-mix(in srgb, var(--known-fail) 10%, var(--panel)); }
    .summary-card.regression { border-color:color-mix(in srgb, var(--regression) 46%, var(--line)); background:color-mix(in srgb, var(--regression) 18%, var(--panel)); }
    .summary-card.error { border-color:color-mix(in srgb, var(--error) 46%, var(--line)); background:color-mix(in srgb, var(--error) 18%, var(--panel)); }
    .summary-card.neutral { border-color:color-mix(in srgb, var(--neutral) 20%, var(--line)); background:var(--panel); }
    .label { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.07em; }
    .value { font-size:18px; font-weight:700; margin-top:2px; }
    .table-wrap { flex:1; min-height:0; background:var(--panel); border:1px solid var(--line); border-radius:18px; overflow:auto; box-shadow:0 8px 24px rgba(0,0,0,.04); }
    table { width:100%; border-collapse:separate; border-spacing:0; background:var(--panel); }
    th, td { padding:12px 14px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; background:var(--panel); }
    th { position:sticky; top:0; z-index:2; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); background:#f5f0e6; }
    tr:last-child td { border-bottom:none; }
    .badge { display:inline-block; padding:3px 9px; border-radius:999px; font-size:12px; font-weight:700; color:#fff; }
    .badge.pass { background:var(--pass); }
    .badge.fail { background:var(--fail); }
    .badge.known-fail { background:var(--known-fail); }
    .badge.regression { background:var(--regression); }
    .badge.error { background:var(--error); }
    .badge.improvement { background:var(--improvement); }
    .badge.neutral { background:var(--neutral); }
    .badge-link, .test-link { color:inherit; text-decoration:none; }
    .badge-link:hover .badge { filter:brightness(.94); }
    .test-link:hover { text-decoration:underline; }
    .change-cell { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .status-cell { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .diff-links { display:flex; gap:6px; flex-wrap:wrap; }
    .diff-link { color:var(--muted); text-decoration:none; font-size:12px; border:1px solid var(--line); border-radius:999px; padding:2px 8px; background:#f5f0e6; }
    .diff-link:hover { text-decoration:underline; }
    .ref-viewer-link { color:var(--muted); text-decoration:none; font-size:12px; border:1px solid var(--line); border-radius:999px; padding:2px 8px; background:#f5f0e6; }
    .ref-viewer-link:hover { text-decoration:underline; }
    .toolbar { display:flex; align-items:center; gap:10px; margin:0 0 10px; color:var(--muted); }
    .toolbar[hidden] { display:none; }
    .filter-reset { border:1px solid var(--line); background:var(--panel); border-radius:999px; padding:4px 10px; cursor:pointer; }
    .is-hidden { display:none; }
    .test-path { font-family:ui-monospace, SFMono-Regular, monospace; }
    .entry-id { color:var(--muted); font-weight:700; font-family:ui-monospace, SFMono-Regular, monospace; text-align:right; white-space:nowrap; }
    .entry-category { color:var(--muted); font-size:12px; margin-bottom:1px; }
    .entry-title { }
    .entry-file { color:var(--muted); font-size:11px; font-family:ui-monospace, SFMono-Regular, monospace; margin-top:2px; word-break:break-all; }
    .entry-ref { color:var(--muted); font-size:11px; font-family:ui-monospace, SFMono-Regular, monospace; margin-top:1px; word-break:break-all; }
    .ref-link { color:var(--muted); text-decoration:none; }
    .ref-link:hover { text-decoration:underline; }
    .breakdown { font-size:12px; color:var(--muted); margin-top:6px; line-height:1.6; }
    @media (max-height: 760px), (max-width: 760px) {
      body { overflow:auto; }
      main { height:auto; min-height:100vh; }
      .table-wrap { flex:none; min-height:auto; overflow-x:auto; overflow-y:visible; }
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(result.labels.actual)} vs ${escapeHtml(result.labels.baseline)}</h1>
    <p>${escapeHtml(result.options.mode)} mode report generated at ${escapeHtml(result.generatedAt)} · <a class="header-link" href="report.json">JSON</a> · <a class="header-link" href="report.md">Markdown</a> · <a class="header-link" href="triage.yaml">Triage</a></p>
    <section class="summary">
      ${summaryCards
        .map((card) => {
          const attrs = card.filter
            ? ` data-filter-kind="${escapeHtml(card.filter.kind)}" data-filter-value="${escapeHtml(card.filter.value)}" data-filter-label="${escapeHtml(card.filter.label)}"`
            : "";
          const filterableClass = card.filter ? " is-filterable" : "";
          return `<button type="button" class="card summary-card ${card.className}${filterableClass}"${attrs}>
        <div class="label">${escapeHtml(card.label)}</div>
        <div class="value">${escapeHtml(card.value)}</div>
      </button>`;
        })
        .join("\n")}
    </section>
    <div class="toolbar" id="filter-toolbar" hidden>
      <span>Filtered by: <strong id="filter-value"></strong></span>
      <button type="button" class="filter-reset" id="filter-reset">Clear</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Test</th>
            <th>${escapeHtml(result.labels.baseline)}</th>
            <th>${escapeHtml(result.labels.actual)}</th>
            <th>Change</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
  </main>
  <script>
    (() => {
      const rows = Array.from(document.querySelectorAll("tbody tr"));
      const summaryCards = Array.from(
        document.querySelectorAll(".summary-card[data-filter-kind]"),
      );
      const toolbar = document.getElementById("filter-toolbar");
      const filterValueEl = document.getElementById("filter-value");
      const resetButton = document.getElementById("filter-reset");
      let currentFilterKind = "clear";
      let currentFilterValue = "";

      const matchesFilter = (row, filterKind, expectedValue) => {
        if (!filterKind || filterKind === "clear") {
          return true;
        }
        return row.getAttribute("data-filter-" + filterKind) === expectedValue;
      };

      const applyFilter = (filterKind, filterValue, nextLabel) => {
        currentFilterKind = filterKind || "clear";
        currentFilterValue = filterValue || "";
        rows.forEach((row) => {
          row.classList.toggle(
            "is-hidden",
            !matchesFilter(row, currentFilterKind, currentFilterValue),
          );
        });
        summaryCards.forEach((card) => {
          card.classList.toggle(
            "is-active",
            (card.dataset.filterKind || "clear") === currentFilterKind &&
              (card.dataset.filterValue || "") === currentFilterValue,
          );
        });
        toolbar.hidden = currentFilterKind === "clear";
        if (filterValueEl) {
          filterValueEl.textContent = nextLabel || "Compared";
        }
      };

      summaryCards.forEach((button) => {
        button.addEventListener("click", () => {
          const nextKind = button.dataset.filterKind || "clear";
          const nextValue = button.dataset.filterValue || "";
          const isSameFilter =
            nextKind === currentFilterKind && nextValue === currentFilterValue;
          if (nextKind === "clear" || isSameFilter) {
            applyFilter("clear", "", "Compared");
            return;
          }
          applyFilter(nextKind, nextValue, button.dataset.filterLabel || "Compared");
        });
      });
      resetButton?.addEventListener("click", () =>
        applyFilter("clear", "", "Compared"),
      );
      applyFilter("clear", "", "Compared");
    })();
  </script>
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, "utf8");

  return { jsonPath, mdPath, htmlPath };
}

function writeTriageTemplate(outDir, result) {
  const entries = [];

  for (const diff of result.differences) {
    if (diff.triageRequired === false) {
      continue;
    }
    const uniqueComparisons = Array.isArray(diff.comparisons)
      ? diff.comparisons.filter(
          (comparison, index, comparisons) =>
            comparisons.findIndex(
              (item) =>
                item.referenceFile === comparison.referenceFile &&
                item.relation === comparison.relation,
            ) === index,
        )
      : [];
    const entry = {
      id: diff.id,
      category: diff.category,
      title: diff.title,
      file: diff.file.length === 1 ? diff.file[0] : diff.file,
      type: "difference",
      decision: "", // regression / expected / skip
      notes: "",
      approvedViewer: "", // viewer spec to use as baseline (e.g. git-fix-issue1775, v2.35.0)
      actualLabel: result.labels.actual,
      actualUrl: diff.actual.url,
      baselineLabel: result.labels.baseline,
      baselineUrl: diff.baseline?.url,
    };
    if (uniqueComparisons.length > 0) {
      if (uniqueComparisons.length === 1) {
        entry.referenceFile = uniqueComparisons[0].referenceFile;
        entry.relation = uniqueComparisons[0].relation;
      } else {
        entry.referenceFiles = uniqueComparisons.map(
          (item) => item.referenceFile,
        );
        entry.relations = uniqueComparisons.map((item) => item.relation);
      }
      const unexpectedMatches = [
        ...new Set(
          diff.comparisons
            .filter((item) => item.unexpectedEquality)
            .map((item) => item.referenceFile),
        ),
      ];
      if (unexpectedMatches.length > 0) {
        entry.unexpectedMatches = unexpectedMatches;
      }
      const diffPages = [
        ...new Set(
          diff.comparisons.flatMap((item) =>
            item.pages.map((page) =>
              page.actualPage === page.baselinePage
                ? `${item.referenceFile}#${page.actualPage}`
                : `${item.referenceFile}#${page.actualPage}:${page.baselinePage}`,
            ),
          ),
        ),
      ];
      if (diffPages.length > 0) {
        entry.diffPages = diffPages;
      }
      const pageSelections = [
        ...new Map(
          diff.comparisons
            .filter((item) => item.pageCountMismatch)
            .map((item) => [
              JSON.stringify([
                item.referenceFile,
                item.actualPageNumbers,
                item.baselinePageNumbers,
              ]),
              {
                referenceFile: item.referenceFile,
                actualPages: item.actualPageNumbers,
                baselinePages: item.baselinePageNumbers,
              },
            ]),
        ).values(),
      ];
      if (pageSelections.length > 0) {
        entry.pageSelections = pageSelections;
      }
      // Add reference viewer URLs for each side (useful for verifying FAIL results)
      const referenceViewerUrls = [];
      const seenRefUrls = new Set();
      for (const comparison of diff.comparisons) {
        if (
          comparison.baselineUrl &&
          !seenRefUrls.has(comparison.baselineUrl)
        ) {
          seenRefUrls.add(comparison.baselineUrl);
          referenceViewerUrls.push({
            side: comparison.side,
            referenceFile: comparison.referenceFile,
            url: comparison.baselineUrl,
          });
        }
      }
      if (referenceViewerUrls.length > 0) {
        entry.referenceViewerUrls = referenceViewerUrls;
      }
    }
    if (diff.pageCountMismatch) {
      entry.pageCountActual = diff.actual.totalPages;
      entry.pageCountBaseline = diff.baseline?.totalPages;
    }
    if (diff.pages.length > 0 && !entry.diffPages) {
      entry.diffPages = diff.pages.map((p) => p.page);
    }
    entries.push(entry);
  }

  // Track ids already covered by a difference entry so that error entries for
  // the same test (e.g. baseline timeout when actual=FAIL) are not emitted
  // separately and don't produce duplicate ids in the triage YAML. Also skip
  // error entries when the corresponding difference is already marked
  // triage-not-needed, such as improvement cases with actual=PASS.
  const differenceIds = new Set(entries.map((e) => e.id));
  const nonTriageDifferenceIds = new Set(
    result.differences
      .filter((diff) => diff.triageRequired === false)
      .map((diff) => diff.id),
  );

  for (const err of result.errors) {
    if (differenceIds.has(err.id) || nonTriageDifferenceIds.has(err.id)) {
      // A difference entry with this id was already emitted; skip the
      // redundant error entry to avoid duplicate ids in the YAML.
      continue;
    }
    entries.push({
      id: err.id,
      category: err.category,
      title: err.title,
      file: err.file.length === 1 ? err.file[0] : err.file,
      type: "error",
      decision: "", // regression / expected / skip
      notes: "",
      approvedViewer: "", // viewer spec to use as baseline (e.g. git-fix-issue1775, v2.35.0)
      actualLabel: result.labels.actual,
      actualUrl: err.actualUrl,
      baselineLabel: result.labels.baseline,
      baselineUrl: err.baselineUrl,
      errorSide: err.side,
      ...(err.sideErrors
        ? (() => {
            // Emit common fields when all sides have the same error AND none
            // has per-side context (referenceFile, timeout) that would be lost
            // by collapsing; emit sideErrors otherwise.
            const allSame =
              err.sideErrors.every(
                (se) =>
                  se.error.name === err.sideErrors[0].error.name &&
                  se.error.message === err.sideErrors[0].error.message,
              ) && !err.sideErrors.some((se) => se.referenceFile);
            if (allSame) {
              return {
                errorName: err.sideErrors[0].error.name,
                errorMessage: err.sideErrors[0].error.message,
              };
            }
            return {
              sideErrors: err.sideErrors.map((se) => ({
                side: se.side,
                ...(se.referenceFile
                  ? { referenceFile: se.referenceFile }
                  : {}),
                errorName: se.error.name,
                errorMessage: se.error.message,
                timeout: se.error.timeout,
              })),
            };
          })()
        : {
            ...(err.referenceFile ? { referenceFile: err.referenceFile } : {}),
            errorName: err.error.name,
            errorMessage: err.error.message,
          }),
    });
  }

  const yamlPath = path.join(outDir, "triage.yaml");
  const baselinePath =
    result.options.mode === "version-diff"
      ? path.join(repoRoot, "scripts", "layout-regression-triage.yaml")
      : null;
  // The committed baseline file serves as carry-over source when no local triage.yaml exists yet.
  const carrySourcePath = getTriageSourcePath(outDir, baselinePath);

  // Carry over decision/notes from a previous triage.yaml so that re-runs
  // don't wipe out already-triaged entries.
  if (carrySourcePath) {
    const prev = yaml.load(fs.readFileSync(carrySourcePath, "utf8"));
    if (carrySourcePath === baselinePath) {
      console.log(
        `  (loading triage decisions from scripts/layout-regression-triage.yaml)`,
      );
    }
    if (Array.isArray(prev)) {
      const prevMap = new Map(
        prev.map((e) => [`${e.category}\x00${e.title}\x00${e.type || ""}`, e]),
      );
      let carried = 0;
      for (const entry of entries) {
        // Primary lookup by category+title+type; fall back to type-less entry
        // (stored without type when the entry matched approvedViewer last run),
        // then fall back to the other type (difference↔error can switch between runs).
        const old =
          prevMap.get(
            `${entry.category}\x00${entry.title}\x00${entry.type || "difference"}`,
          ) ||
          prevMap.get(`${entry.category}\x00${entry.title}\x00`) ||
          prevMap.get(
            `${entry.category}\x00${entry.title}\x00${entry.type === "error" ? "difference" : "error"}`,
          );
        if (old) {
          if (old.approvedViewer) {
            // approvedViewer was set: this entry was compared against an approved snapshot.
            // If it appears again in differences, canary has drifted from approvedViewer.
            entry.approvedViewer = old.approvedViewer;
            if (old.decision && old.decision !== "expected") {
              // Decision was set to "regression" or "skip" by the user: carry it over.
              // "expected" is not carried over because it meant the entry matched approvedViewer
              // — but now there's a new diff, so it needs re-evaluation.
              entry.decision = old.decision;
              carried++;
            }
            // If decision is empty or was "expected", leave it empty → pending, needs triage
          } else {
            if (old.decision) {
              entry.decision = old.decision;
              carried++;
            }
          }
          if (old.notes) {
            entry.notes = old.notes;
          }
        }
      }
      let resetMsg = "";
      const resetCount = entries.filter(
        (e) => e.approvedViewer && !e.decision,
      ).length;
      if (resetCount > 0)
        resetMsg = `, ${resetCount} reset (canary drifted from approvedViewer)`;

      // Re-append entries that had approvedViewer but have no diff/error in the current run
      // (they matched approvedViewer). Keep them so approvedViewer is remembered on the next run.
      // Use category+title (no type) so that ANY current diff/error for this entry
      // prevents re-appending (we don't want duplicates across types).
      const currentKeysNoType = new Set(
        entries.map((e) => `${e.category}\x00${e.title}`),
      );
      let reappended = 0;
      let restored = 0;
      for (const old of prev) {
        if (
          old.approvedViewer &&
          !currentKeysNoType.has(`${old.category}\x00${old.title}`)
        ) {
          // Re-append keeping only metadata needed to track approvedViewer.
          // Strip type (difference/error) and all stale result-specific fields
          // so the entry doesn't falsely suggest a current diff or error.
          const {
            id: _id,
            type: _type,
            pageCountActual: _pca,
            pageCountBaseline: _pcb,
            diffPages: _dp,
            errorSide: _es,
            errorName: _en,
            errorMessage: _em,
            sideErrors: _se,
            category,
            title,
            file,
            decision,
            notes,
            approvedViewer,
            ...rest
          } = old;
          // Always restore to "expected" since the entry now matches approvedViewer again.
          // This covers: empty decision, "regression" (bug was fixed), "skip", etc.
          const restoredDecision = "expected";
          if (decision !== "expected") restored++;
          entries.push({
            category,
            title,
            file,
            // no "type" field: entry matched approvedViewer (no current diff or error)
            decision: restoredDecision,
            notes,
            approvedViewer,
            ...rest,
          });
          reappended++;
        }
      }

      const reappendMsg =
        reappended > 0
          ? `, ${reappended} preserved (no diff vs approvedViewer${restored > 0 ? `, ${restored} restored to expected` : ""})`
          : "";
      if (carried > 0 || resetCount > 0 || reappended > 0) {
        console.log(
          `  (carried over ${carried} triage decision(s) from previous run${resetMsg}${reappendMsg})`,
        );
      }
    }
  }

  let yamlStr = yaml.dump(entries, { lineWidth: 120, quotingType: '"' });
  // Add hint comment after each decision field
  yamlStr = yamlStr.replace(
    /^(  decision: .*)$/gm,
    "$1  # regression / expected / skip",
  );
  // Add hint comment after every approvedViewer line (including empty placeholder)
  yamlStr = yamlStr.replace(
    /^(  approvedViewer: .*)$/gm,
    "$1  # viewer spec: git-<branch>, v2.35.0, canary, stable, URL...",
  );
  fs.writeFileSync(yamlPath, yamlStr, "utf8");
  return yamlPath;
}

/**
 * Load a map of category+title → approvedViewer spec from triage.yaml (or
 * the committed scripts/layout-regression-triage.yaml as fallback).
 * Used to substitute the baseline viewer on a per-entry basis.
 */
function loadApprovedViewerMap(outDir) {
  const sourcePath = getTriageSourcePath(
    outDir,
    path.join(repoRoot, "scripts", "layout-regression-triage.yaml"),
  );
  if (!sourcePath) return new Map();
  try {
    const entries = yaml.load(fs.readFileSync(sourcePath, "utf8"));
    if (!Array.isArray(entries)) return new Map();
    return new Map(
      entries
        .filter((e) => e.approvedViewer)
        .map((e) => [`${e.category}\x00${e.title}`, String(e.approvedViewer)]),
    );
  } catch {
    return new Map();
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const fileList = opts.mode === "version-diff" ? loadFileList() : [];
  if (opts.mode === "version-diff") {
    const testFilesGitRef = getTestFilesGitRef();
    const testFilesBaseUrl = testFilesBaseUrlForViewer(
      opts.actualViewer,
      testFilesGitRef,
    );
    if (isLocalViewerUrl(opts.actualViewer)) {
      console.log(
        `Using local test files: ${formatPathForCli(testFilesBaseUrl)}`,
      );
    } else {
      console.log(`Using test files ref: ${colorize(testFilesGitRef, "info")}`);
    }
  } else {
    if (opts.testUrls.length > 0 || opts.refUrls.length > 0) {
      console.log(
        `Using ${colorize(opts.testUrls.length, "info")} manual test/reference pair(s).`,
      );
    } else {
      console.log(
        `Using WPT manifest: ${formatPathForCli(opts.wptManifestPath)}`,
      );
      console.log(`Using WPT base URL: ${formatPathForCli(opts.wptBaseUrl)}`);
    }
  }
  const approvedViewerMap =
    opts.mode === "version-diff"
      ? loadApprovedViewerMap(opts.outDir)
      : new Map();
  if (approvedViewerMap.size > 0) {
    console.log(
      `Using approvedViewer override for ${colorize(approvedViewerMap.size, "info")} entry/entries.`,
    );
  }
  const triageStatusMap = loadTriageStatusMap(
    opts.outDir,
    opts.mode === "version-diff"
      ? path.join(repoRoot, "scripts", "layout-regression-triage.yaml")
      : null,
  );
  const targets = collectTargets(fileList, opts, approvedViewerMap);

  if (targets.length === 0) {
    throw new Error(
      "No matching test entries found. Check category/title/file filters.",
    );
  }

  ensureDir(opts.outDir);
  const actualDir = path.join(
    opts.outDir,
    opts.mode === "reftest" ? "test" : "actual",
  );
  const baselineDir = path.join(
    opts.outDir,
    opts.mode === "reftest" ? "reference" : "baseline",
  );
  const diffDir = path.join(opts.outDir, "diff");
  const actualReferenceDir = path.join(opts.outDir, "actual-reference");
  const baselineReferenceDir = path.join(opts.outDir, "baseline-reference");
  const actualReferenceDiffDir = path.join(
    opts.outDir,
    "actual-reference-diff",
  );
  const baselineReferenceDiffDir = path.join(
    opts.outDir,
    "baseline-reference-diff",
  );
  // Clear previous run artifacts so stale files don't linger between runs.
  const runDirs =
    opts.mode === "reftest-diff"
      ? [
          baselineDir,
          actualDir,
          diffDir,
          actualReferenceDir,
          baselineReferenceDir,
          actualReferenceDiffDir,
          baselineReferenceDiffDir,
        ]
      : [baselineDir, actualDir, diffDir];
  for (const dir of runDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const dir of runDirs) {
    ensureDir(dir);
  }

  const browserEngines = { chromium, firefox, webkit };
  const browserEngine = browserEngines[opts.browser] ?? chromium;
  const launchArgs =
    opts.browser === "chromium" ? { args: ["--disable-web-security"] } : {};
  const browser = await browserEngine.launch({
    headless: true,
    ...launchArgs,
  });

  // Create a pool of reusable BrowserContexts.  Pages within the same
  // context share the browser's HTTP cache, so reusing contexts lets later
  // captures skip redundant fetches to wpt.live for common reference images.
  // Pool size equals concurrency so every in-flight task gets its own
  // exclusive context via checkout/release.
  const contextPool = new ContextPool(browser, {
    viewportWidth: opts.viewportWidth,
    viewportHeight: opts.viewportHeight,
    poolSize: opts.concurrency,
  });

  const differences = [];
  const errors = [];
  const entries = [];
  let pageCountMismatches = 0;
  let screenshotMismatches = 0;
  let timeoutEntries = 0;

  // Dispatch all captures into a bounded concurrency pool.
  // Each entry produces a Promise that resolves with [baseline, actual].
  const limit = pLimit(opts.concurrency);

  // Handle Ctrl+C: exit immediately so pending async tasks can't keep logging.
  // The browser subprocess will be cleaned up by the OS when this process exits.
  process.once("SIGINT", () => {
    process.stdout.write(`\n${colorize("Interrupted.", "warning")}\n`);
    process.exit(130);
  });

  const entryPromises = targets.map((target, i) => {
    const id = String(i + 1).padStart(4, "0");
    const slug = `${id}-${sanitizeName(target.category)}-${sanitizeName(target.title)}`;
    const captureOpts = {
      contextPool,
      browser,
      timeoutMs: opts.timeoutMs,
      skipScreenshots: opts.skipScreenshots,
      exportHtml: opts.exportHtml,
      viewportWidth: opts.viewportWidth,
      viewportHeight: opts.viewportHeight,
    };

    if (opts.mode === "reftest-diff") {
      const actualTestPromise = limit(() =>
        captureOneSide({
          ...captureOpts,
          url: target.actualUrl,
          key: slug,
          dir: actualDir,
        }),
      );
      const baselineTestPromise = limit(() =>
        captureOneSide({
          ...captureOpts,
          url: target.baselineUrl,
          key: slug,
          dir: baselineDir,
        }),
      );
      const actualReferencePromises = target.references.map(
        (reference, referenceIndex) => {
          const referenceKey = `${slug}-r${String(referenceIndex + 1).padStart(2, "0")}`;
          return {
            reference: {
              ...reference,
              referenceUrl: reference.actualReferenceUrl,
            },
            referenceKey,
            promise: limit(() =>
              captureOneSide({
                ...captureOpts,
                url: reference.actualReferenceUrl,
                key: referenceKey,
                dir: actualReferenceDir,
              }),
            ),
          };
        },
      );
      const baselineReferencePromises = target.references.map(
        (reference, referenceIndex) => {
          const referenceKey = `${slug}-r${String(referenceIndex + 1).padStart(2, "0")}`;
          return {
            reference: {
              ...reference,
              referenceUrl: reference.baselineReferenceUrl,
            },
            referenceKey,
            promise: limit(() =>
              captureOneSide({
                ...captureOpts,
                url: reference.baselineReferenceUrl,
                key: referenceKey,
                dir: baselineReferenceDir,
              }),
            ),
          };
        },
      );
      return {
        id,
        slug,
        target,
        actualTestPromise,
        baselineTestPromise,
        actualReferencePromises,
        baselineReferencePromises,
      };
    }

    const actualP = limit(() =>
      captureOneSide({
        ...captureOpts,
        url: target.actualUrl,
        key: slug,
        dir: actualDir,
      }),
    );
    const referencePromises = Array.isArray(target.references)
      ? target.references.map((reference, referenceIndex) => {
          const referenceKey = `${slug}-r${String(referenceIndex + 1).padStart(2, "0")}`;
          return {
            reference,
            referenceKey,
            promise: limit(() =>
              captureOneSide({
                ...captureOpts,
                url: reference.baselineUrl,
                key: referenceKey,
                dir: baselineDir,
              }),
            ),
          };
        })
      : [
          {
            reference: {
              referenceFile: target.referenceFile,
              relation: target.relation,
              baselineUrl: target.baselineUrl,
              baselinePageRanges: null,
            },
            referenceKey: slug,
            promise: limit(() =>
              captureOneSide({
                ...captureOpts,
                url: target.baselineUrl,
                key: slug,
                dir: baselineDir,
              }),
            ),
          },
        ];
    return { id, slug, target, actualPromise: actualP, referencePromises };
  });

  // Process results in order: logs stay sequential while captures run ahead.
  for (let i = 0; i < entryPromises.length; i++) {
    const entryPlan = entryPromises[i];
    const { id, slug, target } = entryPlan;
    console.log(
      `${colorize(`[${i + 1}/${targets.length}]`, "info")} ${colorize(target.category, "bold")} :: ${target.title}`,
    );

    if (opts.mode === "reftest-diff") {
      const actual = await entryPlan.actualTestPromise;
      const baseline = await entryPlan.baselineTestPromise;
      const actualReferences = await Promise.all(
        (entryPlan.actualReferencePromises || []).map(async (item) => ({
          ...item,
          result: await item.promise,
        })),
      );
      const baselineReferences = await Promise.all(
        (entryPlan.baselineReferencePromises || []).map(async (item) => ({
          ...item,
          result: await item.promise,
        })),
      );
      const hasReferences =
        actualReferences.length > 0 && baselineReferences.length > 0;

      // Separate actual-side errors from baseline-side errors so that
      // baseline-side errors can be suppressed when actual=PASS (improvement).
      const actualSideErrors = [];
      const baselineSideErrors = [];
      if (!actual.ok) {
        actualSideErrors.push({ side: opts.actualLabel, error: actual.error });
      }
      if (!baseline.ok) {
        baselineSideErrors.push({
          side: opts.baselineLabel,
          error: baseline.error,
        });
      }
      for (const item of actualReferences) {
        if (!item.result.ok) {
          actualSideErrors.push({
            side: `${opts.actualLabel}-reference`,
            error: item.result.error,
            referenceFile: item.reference.referenceFile,
            baselineUrl: item.reference.referenceUrl,
          });
        }
      }
      for (const item of baselineReferences) {
        if (!item.result.ok) {
          baselineSideErrors.push({
            side: `${opts.baselineLabel}-reference`,
            error: item.result.error,
            referenceFile: item.reference.referenceFile,
            baselineUrl: item.reference.referenceUrl,
          });
        }
      }

      // Combine actual-side errors (always reported) with baseline-side errors
      // into a single entry per test so that only one triage decision is needed
      // for the pair. Suppress baseline-side errors only for the improvement
      // case where baseline=ERROR and actual=PASS.
      const actualOutcome =
        hasReferences &&
        actual.ok &&
        actualReferences.every((item) => item.result.ok)
          ? evaluateReferenceComparisons({
              testCapture: actual,
              testDir: actualDir,
              testKey: slug,
              testPageRanges: target.actualPageRanges,
              referenceCaptures: actualReferences,
              referenceDir: actualReferenceDir,
              diffDir: actualReferenceDiffDir,
              diffKeyPrefix: slug,
              sourceType: target.sourceType,
              maxDiffRatio: opts.maxDiffRatio,
              pixelThreshold: opts.pixelThreshold,
              skipScreenshots: opts.skipScreenshots,
              writeDiffs: true,
            })
          : null;
      const baselineOutcome =
        hasReferences &&
        baseline.ok &&
        baselineReferences.every((item) => item.result.ok)
          ? evaluateReferenceComparisons({
              testCapture: baseline,
              testDir: baselineDir,
              testKey: slug,
              testPageRanges: target.actualPageRanges,
              referenceCaptures: baselineReferences,
              referenceDir: baselineReferenceDir,
              diffDir: baselineReferenceDiffDir,
              diffKeyPrefix: slug,
              sourceType: target.sourceType,
              maxDiffRatio: opts.maxDiffRatio,
              pixelThreshold: opts.pixelThreshold,
              skipScreenshots: opts.skipScreenshots,
              writeDiffs: true,
            })
          : null;

      const actualStatus = !actual.ok
        ? "ERROR"
        : hasReferences
          ? actualOutcome?.pass
            ? "PASS"
            : "FAIL"
          : "MANUAL";
      const baselineStatus = !baseline.ok
        ? "ERROR"
        : hasReferences
          ? baselineOutcome?.pass
            ? "PASS"
            : "FAIL"
          : "MANUAL";

      {
        const shouldSuppressBaselineSideErrors =
          actualStatus === "PASS" && baselineStatus === "ERROR";
        const allSideErrors = [
          ...actualSideErrors,
          ...(shouldSuppressBaselineSideErrors ? [] : baselineSideErrors),
        ];
        if (allSideErrors.length > 0) {
          const triage = getTriageStatus(
            triageStatusMap,
            target.category,
            target.title,
            "error",
          );
          errors.push({
            id,
            category: target.category,
            title: target.title,
            file: toArray(target.file),
            side: allSideErrors.map((e) => e.side).join(", "),
            error: allSideErrors[0].error,
            ...(allSideErrors.length > 1
              ? {
                  sideErrors: allSideErrors.map((e) => ({
                    side: e.side,
                    error: e.error,
                    ...(e.referenceFile
                      ? { referenceFile: e.referenceFile }
                      : {}),
                  })),
                }
              : {
                  ...(allSideErrors[0].referenceFile
                    ? { referenceFile: allSideErrors[0].referenceFile }
                    : {}),
                }),
            actualUrl: target.actualUrl,
            baselineUrl: allSideErrors[0].baselineUrl || target.baselineUrl,
            triage,
          });
          if (allSideErrors.some((item) => item.error.timeout)) {
            timeoutEntries += 1;
          }
        }
      }

      const viewerDiff =
        actual.ok && baseline.ok
          ? compareCapturedViewerPair({
              actual,
              actualDir,
              actualKey: slug,
              baseline,
              baselineDir,
              baselineKey: slug,
              diffDir,
              diffKey: slug,
              maxDiffRatio: opts.maxDiffRatio,
              pixelThreshold: opts.pixelThreshold,
              skipScreenshots: opts.skipScreenshots,
            })
          : { pageCountMismatch: false, pages: [] };
      const viewerChanged =
        viewerDiff.pageCountMismatch || viewerDiff.pages.length > 0;
      const changeType = getCombinedChangeType({
        actualStatus,
        baselineStatus,
        viewerChanged,
      });
      const combinedChangeType = hasReferences
        ? changeType
        : actualStatus === "ERROR" || baselineStatus === "ERROR"
          ? changeType // respect error-aware result for MANUAL tests with errors
          : getManualCombinedChangeType(viewerChanged);

      entries.push({
        id,
        category: target.category,
        title: target.title,
        file: toArray(target.file),
        sourceUrl: target.sourceUrl,
        actualStatus,
        baselineStatus,
        changeType: combinedChangeType,
        viewerChanged,
        actualUrl: target.actualUrl,
        baselineUrl: target.baselineUrl,
        references: (target.references || []).map((ref) => ({
          referenceFile: ref.referenceFile,
          relation: ref.relation,
          actualReferenceUrl: ref.actualReferenceUrl,
          baselineReferenceUrl: ref.baselineReferenceUrl,
        })),
      });

      if (viewerDiff.pageCountMismatch) {
        pageCountMismatches += 1;
      }
      if (viewerDiff.pages.length > 0) {
        screenshotMismatches += 1;
      }

      const shouldRecordDifference =
        combinedChangeType !== "error" &&
        (hasReferences
          ? actualStatus !== "PASS" ||
            baselineStatus !== "PASS" ||
            viewerChanged
          : viewerChanged);

      if (shouldRecordDifference) {
        const triageRequired = combinedChangeType !== "improvement";
        const triage = triageRequired
          ? getTriageStatus(
              triageStatusMap,
              target.category,
              target.title,
              "difference",
            )
          : { status: "not-needed", decision: "" };
        differences.push({
          id,
          category: target.category,
          title: target.title,
          file: toArray(target.file),
          classification: combinedChangeType,
          triageRequired,
          actualStatus,
          baselineStatus,
          pageCountMismatch: viewerDiff.pageCountMismatch,
          actual: {
            totalPages: actual.ok ? actual.totalPages : null,
            url: target.actualUrl,
          },
          baseline: {
            totalPages: baseline.ok ? baseline.totalPages : null,
            url: target.baselineUrl,
          },
          pages: viewerDiff.pages,
          comparisons: [
            ...(actualOutcome?.failingComparisons || []).map((item) => ({
              ...item,
              side: opts.actualLabel,
              baselineUrl: item.referenceUrl,
            })),
            ...(baselineOutcome?.failingComparisons || []).map((item) => ({
              ...item,
              side: opts.baselineLabel,
              baselineUrl: item.referenceUrl,
            })),
          ],
          triage,
        });
      }
      console.log(
        `  -> outcome=${formatChangeForCli(combinedChangeType)} (baseline=${formatStatusForCli(baselineStatus)}, actual=${formatStatusForCli(actualStatus)}, viewerChanged=${viewerChanged})`,
      );

      continue;
    }

    const { actualPromise, referencePromises } = entryPlan;

    const actual = await actualPromise;
    const baselines = await Promise.all(
      referencePromises.map(async (item) => ({
        ...item,
        result: await item.promise,
      })),
    );

    if (!actual.ok || baselines.some((item) => !item.result.ok)) {
      const actualSideErr = !actual.ok ? actual.error : null;
      const baselineSideErrs = baselines
        .filter((item) => !item.result.ok)
        .map((item) => ({
          error: item.result.error,
          referenceFile: item.reference.referenceFile,
          baselineUrl: item.reference.baselineUrl,
        }));
      const errorBaselineUrl =
        baselineSideErrs[0]?.baselineUrl ||
        baselines[0]?.reference?.baselineUrl ||
        target.baselineUrl;
      entries.push({
        id,
        category: target.category,
        title: target.title,
        file: toArray(target.file),
        sourceUrl: target.sourceUrl,
        actualStatus: actualSideErr
          ? "ERROR"
          : opts.mode === "reftest"
            ? "PASS"
            : "VIEW",
        baselineStatus:
          baselineSideErrs.length > 0
            ? "ERROR"
            : opts.mode === "reftest"
              ? "REFERENCE"
              : "VIEW",
        changeType: "error",
        viewerChanged: false,
        actualUrl: target.actualUrl,
        baselineUrl: errorBaselineUrl,
      });

      // Combine actual + baseline errors into one entry per test.
      const allSideErrors = [
        ...(actualSideErr
          ? [
              {
                side: opts.actualLabel,
                error: actualSideErr,
                baselineUrl: baselines[0]?.reference?.baselineUrl,
              },
            ]
          : []),
        ...(actualSideErr
          ? baselineSideErrs.map((e) => ({
              side: opts.baselineLabel,
              error: e.error,
              referenceFile: e.referenceFile,
              baselineUrl: e.baselineUrl,
            }))
          : []),
      ];

      if (allSideErrors.length > 0) {
        const rawTriage = getTriageStatus(
          triageStatusMap,
          target.category,
          target.title,
          "error",
        );
        const triage =
          target.usedApprovedViewer && rawTriage.decision === "expected"
            ? { status: "pending", decision: "" }
            : rawTriage;
        errors.push({
          id,
          category: target.category,
          title: target.title,
          file: toArray(target.file),
          sourceUrl: target.sourceUrl,
          side: allSideErrors.map((e) => e.side).join(", "),
          error: allSideErrors[0].error,
          ...(allSideErrors.length > 1
            ? {
                sideErrors: allSideErrors.map((e) => ({
                  side: e.side,
                  error: e.error,
                  ...(e.referenceFile
                    ? { referenceFile: e.referenceFile }
                    : {}),
                })),
              }
            : {
                ...(allSideErrors[0].referenceFile
                  ? { referenceFile: allSideErrors[0].referenceFile }
                  : {}),
              }),
          actualUrl: target.actualUrl,
          baselineUrl: allSideErrors[0].baselineUrl || errorBaselineUrl,
          triage,
        });
        if (allSideErrors.some((item) => item.error.timeout)) {
          timeoutEntries += 1;
        }
        for (const item of allSideErrors) {
          console.log(
            `  -> ${colorize(item.side, "error")} error${item.referenceFile ? ` (${item.referenceFile})` : ""}: ${colorize(item.error.message, "error")} (triage: ${colorize(`${triage.status}${triage.decision ? `/${triage.decision}` : ""}`, triage.status === "pending" ? "warning" : "neutral")})`,
          );
        }
      }

      // Baseline-only errors (actual was ok): one entry each.
      if (!actualSideErr) {
        for (const item of baselineSideErrs) {
          const rawTriage = getTriageStatus(
            triageStatusMap,
            target.category,
            target.title,
            "error",
          );
          const triage =
            target.usedApprovedViewer && rawTriage.decision === "expected"
              ? { status: "pending", decision: "" }
              : rawTriage;
          errors.push({
            id,
            category: target.category,
            title: target.title,
            file: toArray(target.file),
            sourceUrl: target.sourceUrl,
            side: opts.baselineLabel,
            error: item.error,
            actualUrl: target.actualUrl,
            baselineUrl: item.baselineUrl,
            ...(item.referenceFile
              ? { referenceFile: item.referenceFile }
              : {}),
            triage,
          });
          if (item.error.timeout) {
            timeoutEntries += 1;
          }
          console.log(
            `  -> ${colorize(opts.baselineLabel, "error")} error${item.referenceFile ? ` (${item.referenceFile})` : ""}: ${colorize(item.error.message, "error")} (triage: ${colorize(`${triage.status}${triage.decision ? `/${triage.decision}` : ""}`, triage.status === "pending" ? "warning" : "neutral")})`,
          );
        }
      }
      continue;
    }

    if (Array.isArray(target.references)) {
      let comparisonResults = baselines.map((item, referenceIndex) => ({
        referenceIndex,
        referenceFile: item.reference.referenceFile,
        baselineUrl: item.reference.baselineUrl,
        baselineTotalPages: item.result.totalPages,
        actualUrl: target.actualUrl,
        actualTotalPages: actual.totalPages,
        ...compareCapturedReference({
          actual,
          actualDir,
          actualKey: slug,
          actualPageRanges: target.actualPageRanges,
          baseline: item.result,
          baselineDir,
          baselineKey: item.referenceKey,
          baselinePageRanges: item.reference.baselinePageRanges,
          diffDir,
          diffKey: `${slug}-r${String(referenceIndex + 1).padStart(2, "0")}`,
          fuzzy: item.reference.fuzzy || null,
          maxDiffRatio: opts.maxDiffRatio,
          pixelThreshold: opts.pixelThreshold,
          relation: item.reference.relation,
          skipScreenshots: opts.skipScreenshots,
          useWptMatching: target.sourceType !== "custom-reftest",
          writeDiffs: false,
        }),
      }));

      const failedMismatchs = comparisonResults.filter(
        (item) => item.relation === "!=" && !item.pass,
      );
      const matchResults = comparisonResults.filter(
        (item) => item.relation === "==",
      );
      const overallPass =
        failedMismatchs.length === 0 &&
        (matchResults.length === 0 || matchResults.some((item) => item.pass));

      entries.push({
        id,
        category: target.category,
        title: target.title,
        file: toArray(target.file),
        sourceUrl: target.sourceUrl,
        actualStatus: overallPass ? "PASS" : "FAIL",
        baselineStatus: "REFERENCE",
        changeType: overallPass ? "pass" : "fail",
        viewerChanged: !overallPass,
        actualUrl: target.actualUrl,
        baselineUrl: baselines[0]?.reference?.baselineUrl || target.baselineUrl,
        references: (target.references || []).map((ref) => ({
          referenceFile: ref.referenceFile,
          relation: ref.relation,
          referenceUrl: ref.baselineUrl,
        })),
      });

      if (!overallPass) {
        const failingReferenceIndexes = new Set(
          (failedMismatchs.length > 0
            ? failedMismatchs
            : matchResults.filter((item) => !item.pass)
          ).map((item) => item.referenceIndex),
        );

        comparisonResults = comparisonResults.map((item) => {
          if (
            item.relation === "==" &&
            !item.pass &&
            failingReferenceIndexes.has(item.referenceIndex)
          ) {
            const baselineItem = baselines[item.referenceIndex];
            return {
              referenceIndex: item.referenceIndex,
              referenceFile: item.referenceFile,
              baselineUrl: item.baselineUrl,
              baselineTotalPages: item.baselineTotalPages,
              actualUrl: item.actualUrl,
              actualTotalPages: item.actualTotalPages,
              ...compareCapturedReference({
                actual,
                actualDir,
                actualKey: slug,
                actualPageRanges: target.actualPageRanges,
                baseline: baselineItem.result,
                baselineDir,
                baselineKey: baselineItem.referenceKey,
                baselinePageRanges: baselineItem.reference.baselinePageRanges,
                diffDir,
                diffKey: `${slug}-r${String(item.referenceIndex + 1).padStart(2, "0")}`,
                fuzzy: baselineItem.reference.fuzzy || null,
                maxDiffRatio: opts.maxDiffRatio,
                pixelThreshold: opts.pixelThreshold,
                relation: baselineItem.reference.relation,
                skipScreenshots: opts.skipScreenshots,
                useWptMatching: target.sourceType !== "custom-reftest",
                writeDiffs: true,
              }),
            };
          }
          return item;
        });

        const failingComparisons = comparisonResults.filter((item) =>
          failedMismatchs.length > 0
            ? item.relation === "!=" && !item.pass
            : item.relation === "==" && !item.pass,
        );

        const diffEntry = {
          id,
          category: target.category,
          title: target.title,
          file: toArray(target.file),
          sourceUrl: target.sourceUrl,
          pageCountMismatch: failingComparisons.some(
            (item) => item.pageCountMismatch,
          ),
          actual: { totalPages: actual.totalPages, url: target.actualUrl },
          baseline: failingComparisons[0]
            ? {
                totalPages: failingComparisons[0].baselineTotalPages,
                url: failingComparisons[0].baselineUrl,
              }
            : null,
          pages:
            failingComparisons.length === 1 ? failingComparisons[0].pages : [],
          comparisons: failingComparisons,
        };

        if (diffEntry.pageCountMismatch) {
          pageCountMismatches += 1;
        }
        if (failingComparisons.some((item) => item.pages.length > 0)) {
          screenshotMismatches += 1;
        }

        if (opts.exportHtmlDiff) {
          for (const comparison of failingComparisons) {
            if (comparison.relation !== "==" || comparison.pages.length === 0) {
              continue;
            }
            try {
              const baselineHtml = fs.readFileSync(
                path.join(
                  baselineDir,
                  `${slug}-r${String(comparison.referenceIndex + 1).padStart(2, "0")}.html`,
                ),
                "utf8",
              );
              const actualHtml = fs.readFileSync(
                path.join(actualDir, `${slug}.html`),
                "utf8",
              );
              const formatOpts = { parser: "html", printWidth: 120 };
              const baselineFormatted = await prettier.format(
                baselineHtml,
                formatOpts,
              );
              const actualFormatted = await prettier.format(
                actualHtml,
                formatOpts,
              );
              const patch = createTwoFilesPatch(
                `baseline/${slug}-r${String(comparison.referenceIndex + 1).padStart(2, "0")}.html`,
                `actual/${slug}.html`,
                baselineFormatted,
                actualFormatted,
              );
              if (/^[+-][^+-]/m.test(patch)) {
                fs.writeFileSync(
                  path.join(
                    diffDir,
                    `${slug}-r${String(comparison.referenceIndex + 1).padStart(2, "0")}.diff`,
                  ),
                  patch,
                  "utf8",
                );
              }
            } catch (error) {
              console.warn(
                `  -> skipped HTML diff export for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
        }

        const rawTriage = getTriageStatus(
          triageStatusMap,
          diffEntry.category,
          diffEntry.title,
          "difference",
        );
        const triage =
          target.usedApprovedViewer && rawTriage.decision === "expected"
            ? { status: "pending", decision: "" }
            : rawTriage;
        diffEntry.triage = triage;
        differences.push(diffEntry);
        console.log(
          `  -> outcome=${formatChangeForCli("fail")} (failedRefs=${failingComparisons.length}, pageCountMismatch=${colorize(diffEntry.pageCountMismatch, diffEntry.pageCountMismatch ? "fail" : "neutral")}, triage=${colorize(`${triage.status}${triage.decision ? `/${triage.decision}` : ""}`, triage.status === "pending" ? "warning" : "neutral")})`,
        );
      } else {
        console.log(`  -> outcome=${formatChangeForCli("pass")}`);
      }

      continue;
    }

    const baseline = baselines[0].result;
    const diffEntry = {
      id,
      category: target.category,
      title: target.title,
      file: toArray(target.file),
      sourceUrl: target.sourceUrl,
      pageCountMismatch: baseline.totalPages !== actual.totalPages,
      actual: { totalPages: actual.totalPages, url: target.actualUrl },
      baseline: { totalPages: baseline.totalPages, url: target.baselineUrl },
      pages: [],
    };

    if (diffEntry.pageCountMismatch) {
      pageCountMismatches += 1;
    }

    if (!opts.skipScreenshots) {
      const compareCount = Math.min(baseline.totalPages, actual.totalPages);
      for (let p = 1; p <= compareCount; p++) {
        const baselinePng = path.join(
          baselineDir,
          `${slug}-p${String(p).padStart(4, "0")}.png`,
        );
        const actualPng = path.join(
          actualDir,
          `${slug}-p${String(p).padStart(4, "0")}.png`,
        );
        const diffPng = path.join(
          diffDir,
          `${slug}-p${String(p).padStart(4, "0")}.png`,
        );

        const compared = comparePngPair(
          baselinePng,
          actualPng,
          diffPng,
          opts.pixelThreshold,
        );

        if (compared.diffRatio > opts.maxDiffRatio) {
          diffEntry.pages.push({ page: p, ...compared, diffImage: diffPng });
        } else {
          fs.rmSync(diffPng, { force: true });
        }
      }
    }

    if (diffEntry.pages.length > 0) {
      screenshotMismatches += 1;

      if (opts.exportHtmlDiff) {
        try {
          const baselineHtml = fs.readFileSync(
            path.join(baselineDir, `${slug}.html`),
            "utf8",
          );
          const actualHtml = fs.readFileSync(
            path.join(actualDir, `${slug}.html`),
            "utf8",
          );
          const formatOpts = { parser: "html", printWidth: 120 };
          const baselineFormatted = await prettier.format(
            baselineHtml,
            formatOpts,
          );
          const actualFormatted = await prettier.format(actualHtml, formatOpts);
          const patch = createTwoFilesPatch(
            `baseline/${slug}.html`,
            `actual/${slug}.html`,
            baselineFormatted,
            actualFormatted,
          );
          // createTwoFilesPatch always returns a header even if identical;
          // only write when there are actual changes (lines starting with + or -)
          if (/^[+-][^+-]/m.test(patch)) {
            fs.writeFileSync(path.join(diffDir, `${slug}.diff`), patch, "utf8");
          }
        } catch (error) {
          console.warn(
            `  -> skipped HTML diff export for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    const viewerChanged =
      diffEntry.pageCountMismatch || diffEntry.pages.length > 0;
    entries.push({
      id,
      category: target.category,
      title: target.title,
      file: toArray(target.file),
      sourceUrl: target.sourceUrl,
      actualStatus: "VIEW",
      baselineStatus: "VIEW",
      changeType: viewerChanged ? "changed" : "unchanged",
      viewerChanged,
      actualUrl: target.actualUrl,
      baselineUrl: target.baselineUrl,
    });

    if (viewerChanged) {
      const rawTriage = getTriageStatus(
        triageStatusMap,
        diffEntry.category,
        diffEntry.title,
        "difference",
      );
      // If compared against approvedViewer and a difference was found:
      // - if prior decision was "expected" (entry previously matched approvedViewer),
      //   treat as pending — it has drifted and needs re-triage.
      // - if prior decision was "regression" or "skip", keep it — user already knows.
      const triage =
        target.usedApprovedViewer && rawTriage.decision === "expected"
          ? { status: "pending", decision: "" }
          : rawTriage;
      diffEntry.triage = triage;
      differences.push(diffEntry);
      console.log(
        `  -> outcome=${formatChangeForCli("changed")} (pageCountMismatch=${colorize(diffEntry.pageCountMismatch, diffEntry.pageCountMismatch ? "fail" : "neutral")}, pageDiffs=${colorize(diffEntry.pages.length, diffEntry.pages.length > 0 ? "fail" : "neutral")}, triage=${colorize(`${triage.status}${triage.decision ? `/${triage.decision}` : ""}`, triage.status === "pending" ? "warning" : "neutral")})`,
      );
    } else {
      console.log(`  -> outcome=${formatChangeForCli("unchanged")}`);
    }
  }

  await contextPool.closeAll(opts.timeoutMs);
  await browser.close();

  const result = {
    generatedAt: new Date().toISOString(),
    labels: {
      actual: opts.actualLabel,
      baseline: opts.baselineLabel,
    },
    options: opts,
    summary: {
      totalEntries: targets.length,
      entriesWithDifferences: differences.length,
      entriesWithErrors: new Set(errors.map((e) => `${e.category}::${e.title}`))
        .size,
      timeoutEntries,
      pageCountMismatches,
      screenshotMismatches,
      outcomes: summarizeCombinedEntries(entries),
    },
    entries,
    differences,
    errors,
  };

  const { jsonPath, mdPath, htmlPath } = writeReports(
    opts.outDir,
    result,
    triageStatusMap,
  );
  const triagePath = writeTriageTemplate(opts.outDir, result);

  console.log(`\n${colorize("Done.", "pass")}`);
  console.log(`Report JSON: ${formatPathForCli(jsonPath)}`);
  console.log(`Report MD:   ${formatPathForCli(mdPath)}`);
  console.log(`Report HTML: ${formatPathForCli(htmlPath)}`);
  console.log(`Triage YAML: ${formatPathForCli(triagePath)}`);

  const pendingTriage =
    differences.filter((d) => d.triage?.status === "pending").length +
    errors.filter((e) => e.triage?.status === "pending").length;
  console.log(
    `${colorize(pendingTriage, pendingTriage > 0 ? "warning" : "pass")} entry/entries need triage (decision is empty)`,
  );

  const actionableDifferences = differences.filter(
    (difference) => difference.triageRequired !== false,
  ).length;
  if (actionableDifferences > 0 || errors.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
