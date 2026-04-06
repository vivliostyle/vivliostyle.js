#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import yaml from "js-yaml";
import { createTwoFilesPatch } from "diff";
import prettier from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const fileListPath = path.join(
  repoRoot,
  "packages/core/test/files/file-list.js",
);
const testFilesRootPrefix = "packages/core/test/files/";

// These params are appended last so that values explicitly specified earlier
// via --extra-viewer-params take precedence: the viewer always uses the first
// occurrence of a repeated parameter, so a user-supplied zoom or spread value
// will win and these fallbacks will be ignored for that parameter.
const fallbackViewerParams = "&zoom=1&spread=false";

const defaults = {
  outDir: path.join(repoRoot, "artifacts", "layout-regression"),
  timeoutSec: 30,
  maxDiffRatio: 0.00002,
  pixelThreshold: 0.1,
  viewportWidth: 1800,
  viewportHeight: 1800,
  skipScreenshots: false,
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
      return "http://localhost:3000/core/test/files/";
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

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--category") {
      opts.categories.push(argv[++i]);
    } else if (a === "--title-includes") {
      opts.titleIncludes.push(argv[++i]);
    } else if (a === "--file") {
      opts.files.push(argv[++i]);
    } else if (a === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (a === "--out-dir") {
      opts.outDir = path.resolve(argv[++i]);
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
    } else if (a === "--skip-screenshots") {
      opts.skipScreenshots = true;
    } else if (a === "--export-html") {
      opts.exportHtml = true;
    } else if (a === "--export-html-diff") {
      opts.exportHtmlDiff = true;
      opts.exportHtml = true;
    } else if (a === "--baseline-viewer") {
      baselineViewerSpec = argv[++i];
    } else if (a === "--actual-viewer") {
      actualViewerSpec = argv[++i];
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
  if (!opts.baselineViewer || !opts.actualViewer) {
    throw new Error("--baseline-viewer and --actual-viewer are required");
  }

  return opts;
}

function printHelpAndExit(exitCode) {
  const msg = `
Compare Vivliostyle rendering between two viewer URLs for test files.

Usage:
  yarn test:layout-regression [options]

Options:
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
  --skip-screenshots         Skip image capture/compare, check page counts only
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
      url: "http://localhost:3000/viewer/lib/vivliostyle-viewer-dev.html",
      label: "dev",
    };
  if (s === "prod")
    return { url: "http://localhost:3000/viewer/lib/", label: "prod" };

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

function collectTargets(fileList, opts, approvedViewerMap = new Map()) {
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
  await page.waitForTimeout(250);
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
  await page.waitForTimeout(120);
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
  await page.waitForTimeout(120);
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
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await waitForViewerReady(page, timeoutMs);

  const errorMsg = await checkViewerError(page);
  if (errorMsg) {
    throw new Error(`Viewer error: ${errorMsg}`);
  }

  const totalPages = await getTotalPages(page);

  if (exportHtml) {
    const html = await page.content();
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
      (await page.locator("#vivliostyle-page-number").count()) > 0;

    for (let p = 1; p <= totalPages; p++) {
      if (useInputNav) {
        await navigateToPageByInput(page, p, timeoutMs);
      } else if (p > 1) {
        // Already on page 1 after initial load; only click for subsequent pages.
        await navigateToNextPage(page, timeoutMs);
      }
      const imagePath = path.join(
        dir,
        `${key}-p${String(p).padStart(4, "0")}.png`,
      );
      await spreadContainer.screenshot({ path: imagePath, scale: "css" });
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

async function captureOneSide({
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
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    // Use device scale factor 2 to get more accurate pixel diffs.
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
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
    await page.close();
  }
}

function comparePngPair(
  baselinePngPath,
  actualPngPath,
  diffPngPath,
  pixelThreshold,
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
      dimensionMismatch: true,
    };
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

  fs.writeFileSync(diffPngPath, PNG.sync.write(diff));
  const allPixels = baseline.width * baseline.height;

  return {
    width: baseline.width,
    height: baseline.height,
    actualWidth: actual.width,
    actualHeight: actual.height,
    diffPixels,
    diffRatio: diffPixels / allPixels,
    dimensionMismatch: false,
  };
}

function getTriageSourcePath(outDir) {
  const yamlPath = path.join(outDir, "triage.yaml");
  const baselinePath = path.join(
    repoRoot,
    "scripts",
    "layout-regression-triage.yaml",
  );
  if (fs.existsSync(yamlPath)) return yamlPath;
  if (fs.existsSync(baselinePath)) return baselinePath;
  return null;
}

function loadTriageStatusMap(outDir) {
  const sourcePath = getTriageSourcePath(outDir);
  if (!sourcePath) return new Map();

  try {
    const entries = yaml.load(fs.readFileSync(sourcePath, "utf8"));
    if (!Array.isArray(entries)) return new Map();

    return new Map(
      entries.map((e) => {
        const key = `${e.category}\x00${e.title}\x00${e.type || "difference"}`;
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
  return (
    triageStatusMap.get(`${category}\x00${title}\x00${type}`) || {
      status: "pending",
      decision: "",
    }
  );
}

function summarizeTriage(items, type, triageStatusMap) {
  let pending = 0;
  let triaged = 0;
  for (const item of items) {
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
    differences: differencesWithTriage,
    errors: errorsWithTriage,
  };

  const jsonPath = path.join(outDir, "report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(resultWithTriage, null, 2), "utf8");

  const lines = [];
  lines.push(
    `# ${result.labels.actual} vs ${result.labels.baseline} comparison report`,
  );
  lines.push("");
  lines.push(`- Compared entries: ${result.summary.totalEntries}`);
  lines.push(
    `- Entries with differences: ${result.summary.entriesWithDifferences} (pending: ${differencesTriage.pending}, triaged: ${differencesTriage.triaged})`,
  );
  lines.push(
    `- Entries with errors: ${result.summary.entriesWithErrors} (pending: ${errorsTriage.pending}, triaged: ${errorsTriage.triaged})`,
  );
  lines.push(`- Timeout entries: ${result.summary.timeoutEntries}`);
  lines.push(`- Page-count mismatches: ${result.summary.pageCountMismatches}`);
  lines.push(`- Screenshot mismatches: ${result.summary.screenshotMismatches}`);
  lines.push("");

  if (resultWithTriage.differences.length === 0) {
    lines.push("No differences found.");
  } else {
    lines.push("## Differences");
    lines.push("");
    for (const diff of resultWithTriage.differences) {
      const triage = diff.triage;
      lines.push(`- [${diff.id}] [${diff.category}] ${diff.title}`);
      lines.push(
        `  triage: ${triage.status}${triage.decision ? ` (${triage.decision})` : ""}`,
      );
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
      lines.push("");
    }
  }

  if (resultWithTriage.errors.length > 0) {
    lines.push("## Errors");
    lines.push("");
    for (const item of resultWithTriage.errors) {
      const triage = item.triage;
      lines.push(`- [${item.id}] [${item.category}] ${item.title}`);
      lines.push(
        `  triage: ${triage.status}${triage.decision ? ` (${triage.decision})` : ""}`,
      );
      lines.push(`  side: ${item.side}`);
      lines.push(`  timeout: ${item.error.timeout}`);
      lines.push(`  error: ${item.error.name}: ${item.error.message}`);
      lines.push(`  ${result.labels.actual}: ${item.actualUrl}`);
      lines.push(`  ${result.labels.baseline}: ${item.baselineUrl}`);
      lines.push("");
    }
  }

  const mdPath = path.join(outDir, "report.md");
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");

  return { jsonPath, mdPath };
}

function writeTriageTemplate(outDir, result) {
  const entries = [];

  for (const diff of result.differences) {
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
      baselineUrl: diff.baseline.url,
    };
    if (diff.pageCountMismatch) {
      entry.pageCountActual = diff.actual.totalPages;
      entry.pageCountBaseline = diff.baseline.totalPages;
    }
    if (diff.pages.length > 0) {
      entry.diffPages = diff.pages.map((p) => p.page);
    }
    entries.push(entry);
  }

  for (const err of result.errors) {
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
      errorName: err.error.name,
      errorMessage: err.error.message,
    });
  }

  const yamlPath = path.join(outDir, "triage.yaml");
  const baselinePath = path.join(
    repoRoot,
    "scripts",
    "layout-regression-triage.yaml",
  );
  // The committed baseline file serves as carry-over source when no local triage.yaml exists yet.
  const carrySourcePath = getTriageSourcePath(outDir);

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
        prev.map((e) => [
          `${e.category}\x00${e.title}\x00${e.type || "difference"}`,
          e,
        ]),
      );
      let carried = 0;
      for (const entry of entries) {
        const old = prevMap.get(
          `${entry.category}\x00${entry.title}\x00${entry.type || "difference"}`,
        );
        if (old) {
          if (old.approvedViewer) {
            // approvedViewer was set: this entry was compared against an approved snapshot.
            // If it appears again in differences, canary has drifted → reset decision.
            entry.approvedViewer = old.approvedViewer;
            // decision is intentionally NOT carried over (needs re-evaluation)
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

      // Re-append entries that had approvedViewer + decision but are not in the current
      // diff results (they matched approvedViewer = no diff this run).
      // Keep them so approvedViewer is remembered on the next run.
      const currentKeys = new Set(
        entries.map(
          (e) => `${e.category}\x00${e.title}\x00${e.type || "difference"}`,
        ),
      );
      let reappended = 0;
      for (const old of prev) {
        if (
          old.approvedViewer &&
          old.decision &&
          !currentKeys.has(
            `${old.category}\x00${old.title}\x00${old.type || "difference"}`,
          )
        ) {
          // Re-append with normalized field order (user-editable fields first).
          const {
            id: _id,
            category,
            title,
            file,
            type,
            decision,
            notes,
            approvedViewer,
            ...rest
          } = old;
          entries.push({
            category,
            title,
            file,
            type,
            decision,
            notes,
            approvedViewer,
            ...rest,
          });
          reappended++;
        }
      }

      const reappendMsg =
        reappended > 0
          ? `, ${reappended} preserved (no diff vs approvedViewer)`
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
  const sourcePath = getTriageSourcePath(outDir);
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
  const fileList = loadFileList();
  const testFilesGitRef = getTestFilesGitRef();
  const testFilesBaseUrl = testFilesBaseUrlForViewer(
    opts.actualViewer,
    testFilesGitRef,
  );
  if (isLocalViewerUrl(opts.actualViewer)) {
    console.log(`Using local test files: ${testFilesBaseUrl}`);
  } else {
    console.log(`Using test files ref: ${testFilesGitRef}`);
  }
  const approvedViewerMap = loadApprovedViewerMap(opts.outDir);
  if (approvedViewerMap.size > 0) {
    console.log(
      `Using approvedViewer override for ${approvedViewerMap.size} entry/entries.`,
    );
  }
  const triageStatusMap = loadTriageStatusMap(opts.outDir);
  const targets = collectTargets(fileList, opts, approvedViewerMap);

  if (targets.length === 0) {
    throw new Error(
      "No matching test entries found. Check category/title/file filters.",
    );
  }

  ensureDir(opts.outDir);
  const baselineDir = path.join(opts.outDir, "baseline");
  const actualDir = path.join(opts.outDir, "actual");
  const diffDir = path.join(opts.outDir, "diff");
  // Clear previous run artifacts so stale files don't linger between runs.
  for (const dir of [baselineDir, actualDir, diffDir]) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(baselineDir);
  ensureDir(actualDir);
  ensureDir(diffDir);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-web-security"],
  });

  const differences = [];
  const errors = [];
  let pageCountMismatches = 0;
  let screenshotMismatches = 0;
  let timeoutEntries = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const id = String(i + 1).padStart(4, "0");
    const slug = `${id}-${sanitizeName(target.category)}-${sanitizeName(target.title)}`;
    console.log(
      `[${i + 1}/${targets.length}] ${target.category} :: ${target.title}`,
    );

    const baseline = await captureOneSide({
      browser,
      url: target.baselineUrl,
      key: slug,
      dir: baselineDir,
      timeoutMs: opts.timeoutMs,
      skipScreenshots: opts.skipScreenshots,
      exportHtml: opts.exportHtml,
      viewportWidth: opts.viewportWidth,
      viewportHeight: opts.viewportHeight,
    });

    const actual = await captureOneSide({
      browser,
      url: target.actualUrl,
      key: slug,
      dir: actualDir,
      timeoutMs: opts.timeoutMs,
      skipScreenshots: opts.skipScreenshots,
      exportHtml: opts.exportHtml,
      viewportWidth: opts.viewportWidth,
      viewportHeight: opts.viewportHeight,
    });

    if (!baseline.ok || !actual.ok) {
      if (!baseline.ok) {
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
          side: opts.baselineLabel,
          error: baseline.error,
          baselineUrl: target.baselineUrl,
          actualUrl: target.actualUrl,
          triage,
        });
        if (baseline.error.timeout) {
          timeoutEntries += 1;
        }
        console.log(
          `  -> ${opts.baselineLabel} error: ${baseline.error.message} (triage: ${triage.status}${triage.decision ? `/${triage.decision}` : ""})`,
        );
      }
      if (!actual.ok) {
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
          side: opts.actualLabel,
          error: actual.error,
          actualUrl: target.actualUrl,
          baselineUrl: target.baselineUrl,
          triage,
        });
        if (actual.error.timeout) {
          timeoutEntries += 1;
        }
        console.log(
          `  -> ${opts.actualLabel} error: ${actual.error.message} (triage: ${triage.status}${triage.decision ? `/${triage.decision}` : ""})`,
        );
      }
      continue;
    }

    const diffEntry = {
      id,
      category: target.category,
      title: target.title,
      file: toArray(target.file),
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

    if (diffEntry.pageCountMismatch || diffEntry.pages.length > 0) {
      const rawTriage = getTriageStatus(
        triageStatusMap,
        diffEntry.category,
        diffEntry.title,
        "difference",
      );
      // If compared against approvedViewer and a difference was found, canary has
      // drifted from the approved snapshot → needs re-triage regardless of prior decision.
      const triage = target.usedApprovedViewer
        ? { status: "pending", decision: "" }
        : rawTriage;
      diffEntry.triage = triage;
      differences.push(diffEntry);
      console.log(
        `  -> difference found (pageCountMismatch=${diffEntry.pageCountMismatch}, pageDiffs=${diffEntry.pages.length}, triage=${triage.status}${triage.decision ? `/${triage.decision}` : ""})`,
      );
    }
  }

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
    },
    differences,
    errors,
  };

  const { jsonPath, mdPath } = writeReports(
    opts.outDir,
    result,
    triageStatusMap,
  );
  const triagePath = writeTriageTemplate(opts.outDir, result);

  console.log("\nDone.");
  console.log(`Report JSON: ${jsonPath}`);
  console.log(`Report MD:   ${mdPath}`);
  console.log(`Triage YAML: ${triagePath}`);

  const pendingTriage =
    differences.filter((d) => d.triage?.status === "pending").length +
    errors.filter((e) => e.triage?.status === "pending").length;
  console.log(`${pendingTriage} entry/entries need triage (decision is empty)`);

  if (differences.length > 0 || errors.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
