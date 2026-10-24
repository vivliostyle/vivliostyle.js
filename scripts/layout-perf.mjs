#!/usr/bin/env node

/**
 * Layout performance tool: measure, profile and compare the full layout of a
 * document with Vivliostyle core builds from git refs or the working tree, or
 * with deployed viewers.
 *
 * Usage: node scripts/layout-perf.mjs <measure|profile|compare> [options] <target>...
 * Run with --help for details.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { SourceMap } from "node:module";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import * as esbuild from "esbuild";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const coreDir = path.join(repoRoot, "packages/core");
// Change when the build settings change, to rebuild the cached bundles.
const buildFormat = 2;
const viewerResourcesDir = path.join(repoRoot, "packages/viewer/resources");

const usage = `Usage: node scripts/layout-perf.mjs <command> [options] <target>...

Commands:
  measure   Time the layout of all pages, for each target (runs interleaved).
  profile   Record a CPU profile for each target and summarize it by function.
            With two or more targets, also show the differences of the
            inclusive time per function from the first target.
  compare   Compare the layout result (per-page DOM and element rects) of each
            target with the first target.

Targets (optionally prefixed with "<label>="):
  core:<git-ref>   Vivliostyle core built from a git ref (e.g. core:v2.45.2,
                   core:master, core:HEAD~1)
  core:worktree    Vivliostyle core built from the working tree
  viewer:<spec>    A deployed viewer: canary, stable, or a viewer URL
                   (measure only; includes loading the viewer itself)

Options:
  --src <url|path>     Document or publication to lay out (required): a URL
                       that allows CORS, or a local file path. A local file is
                       served with its directory, e.g. a publication.json and
                       the files next to it.
  --serve-root <dir>   Directory to serve at the root of the local server for
                       a local --src, to which root-relative URLs in the
                       document resolve (default: the directory of --src).
  --load <auto|document|publication>
                       How the core targets load --src (default: auto:
                       .html/.htm/.xhtml are documents, others publications).
  --runs <n>           measure: runs per target (default: 3); profile: runs
                       per target, the profile of the last run is used
                       (default: 1).
  --warmup <n>         measure, profile: runs per target before the measured
                       runs, not counted; they exclude e.g. the first
                       connection to a remote --src (default: 1).
  --repeat <n>         compare: render each target n times, to detect
                       nondeterministic results (default: 1).
  --top <n>            profile: rows per table (default: 40).
  --callers <regex>    profile: also show the callers of the functions
                       matching the regex.
  --sampling-interval <us>
                       profile: sampling interval in microseconds
                       (default: 200).
  --viewport <WxH>     Browser viewport (default: 1280x900).
  --timeout <sec>      Timeout for one layout (default: 900).
  --out <dir>          Output directory (default: artifacts/layout-perf).
  --no-cache           Fetch remote resources in every run. By default, the
                       responses from remote servers (not localhost) are
                       kept in memory after the first fetch, so that the
                       network does not distort the timing. (A redirect
                       target is not cached; give its final URL instead.)
  --headed             Run the browser headed.
  --channel <name>     Browser channel (default: chrome; "" for Playwright's
                       bundled Chromium).

Examples:
  node scripts/layout-perf.mjs measure --src http://localhost:8080/book/publication.json core:v2.45.2 core:master core:worktree
  node scripts/layout-perf.mjs profile --src ./mybook/publication.json before=core:master after=core:worktree
  node scripts/layout-perf.mjs compare --src ./mybook/publication.json --repeat 2 core:master core:worktree
  node scripts/layout-perf.mjs measure --src https://example.com/book.html viewer:stable viewer:canary
`;

function parseArgs(argv) {
  const opts = {
    command: argv[0],
    src: "",
    serveRoot: "",
    load: "auto",
    runs: undefined,
    warmup: 1,
    repeat: 1,
    top: 40,
    callers: "",
    samplingInterval: 200,
    viewport: { width: 1280, height: 900 },
    timeoutSec: 900,
    outDir: path.join(repoRoot, "artifacts", "layout-perf"),
    headed: false,
    cache: true,
    channel: "chrome",
    targets: [],
  };
  if (!["measure", "profile", "compare"].includes(opts.command)) {
    console.log(usage);
    process.exit(argv.includes("--help") || argv.includes("-h") ? 0 : 1);
  }
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`);
      return argv[++i];
    };
    if (a === "--help" || a === "-h") {
      console.log(usage);
      process.exit(0);
    } else if (a === "--src") opts.src = next();
    else if (a === "--serve-root") opts.serveRoot = next();
    else if (a === "--load") opts.load = next();
    else if (a === "--runs") opts.runs = Number(next());
    else if (a === "--warmup") opts.warmup = Number(next());
    else if (a === "--repeat") opts.repeat = Number(next());
    else if (a === "--top") opts.top = Number(next());
    else if (a === "--callers") opts.callers = next();
    else if (a === "--sampling-interval")
      opts.samplingInterval = Number(next());
    else if (a === "--viewport") {
      const [w, h] = next().split("x").map(Number);
      opts.viewport = { width: w, height: h };
    } else if (a === "--timeout") opts.timeoutSec = Number(next());
    else if (a === "--out") opts.outDir = path.resolve(next());
    else if (a === "--headed") opts.headed = true;
    else if (a === "--no-cache") opts.cache = false;
    else if (a === "--channel") opts.channel = next();
    else if (a.startsWith("--")) throw new Error(`Unknown option: ${a}`);
    else opts.targets.push(parseTarget(a));
  }
  if (!opts.src) throw new Error("--src is required");
  if (!opts.targets.length) throw new Error("No targets");
  opts.runs ??= opts.command === "measure" ? 3 : 1;
  for (const [name, value] of [
    ["--runs", opts.runs],
    ["--repeat", opts.repeat],
    ["--top", opts.top],
    ["--sampling-interval", opts.samplingInterval],
    ["--timeout", opts.timeoutSec],
  ]) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${name} must be a positive integer`);
    }
  }
  if (!Number.isInteger(opts.warmup) || opts.warmup < 0) {
    throw new Error("--warmup must be a non-negative integer");
  }
  if (opts.command !== "measure") {
    const viewers = opts.targets.filter((t) => t.kind === "viewer");
    if (viewers.length) {
      throw new Error(`${opts.command} supports only core:<ref> targets`);
    }
  }
  if (opts.command === "compare" && opts.targets.length * opts.repeat < 2) {
    throw new Error(
      "compare needs two targets, or --repeat 2 or more for one target",
    );
  }
  const labels = opts.targets.map((t) => t.label);
  if (new Set(labels).size !== labels.length) {
    throw new Error(`Duplicate target labels: ${labels.join(", ")}`);
  }
  return opts;
}

function parseTarget(arg) {
  const m = /^(?:([\w.-]+)=)?(core|viewer):(.+)$/.exec(arg);
  if (!m) throw new Error(`Invalid target: ${arg}`);
  const [, label, kind, spec] = m;
  if (kind === "viewer") {
    const url =
      spec === "canary"
        ? "https://vivliostyle.vercel.app/"
        : spec === "stable"
          ? "https://vivliostyle.org/viewer/"
          : // A URL copied from an open viewer can have a fragment, e.g.
            // "#src=...", which would precede the parameters added here.
            spec.replace(/#.*$/, "");
    return { kind, spec, url, label: label || spec };
  }
  return { kind, spec, label: label || spec };
}

// ---------------------------------------------------------------------------
// Core builds

function git(...args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

/**
 * Build the core as an IIFE bundle exposing the global `vivliostyle`.
 * A minified bundle is used for timing, as in production; an unminified one
 * with a source map for profiling, to get readable function names.
 * Builds of a commit are cached by its hash. The core's tsconfig.json of the
 * same revision is used, as its compiler options (e.g. useDefineForClassFields)
 * affect the generated code.
 */
async function buildCore(target, opts, { minify }) {
  const buildsDir = path.join(opts.outDir, "builds");
  fs.mkdirSync(buildsDir, { recursive: true });
  let dir = coreDir;
  let key;
  if (target.spec === "worktree") {
    key = "worktree";
  } else {
    const sha = git("rev-parse", "--verify", `${target.spec}^{commit}`);
    key = sha.slice(0, 12);
    dir = path.join(buildsDir, `rev-${key}`);
    // Written after a complete extraction, so that a partial one is redone.
    const completeMarker = path.join(dir, ".complete");
    if (!fs.existsSync(completeMarker)) {
      const extractDir = path.join(buildsDir, `tmp-${key}`);
      const tarFile = `${extractDir}.tar`;
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.mkdirSync(extractDir, { recursive: true });
      const paths = ["packages/core/src"];
      try {
        git("cat-file", "-e", `${sha}:packages/core/tsconfig.json`);
        paths.push("packages/core/tsconfig.json");
      } catch {
        // An old revision without the core's own tsconfig.json.
      }
      git("archive", "--format=tar", "-o", tarFile, sha, ...paths);
      execFileSync("tar", ["-xf", tarFile, "-C", extractDir]);
      fs.rmSync(tarFile);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.renameSync(path.join(extractDir, "packages/core"), dir);
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.writeFileSync(completeMarker, "");
    }
  }
  const file = `core-${key}-b${buildFormat}${minify ? "" : "-dev"}.js`;
  const outfile = path.join(buildsDir, file);
  if (key === "worktree" || !fs.existsSync(outfile)) {
    await esbuild.build({
      entryPoints: [path.join(dir, "src", "vivliostyle.ts")],
      tsconfig: fs.existsSync(path.join(dir, "tsconfig.json"))
        ? path.join(dir, "tsconfig.json")
        : undefined,
      bundle: true,
      format: "iife",
      globalName: "vivliostyle",
      define: { VIVLIOSTYLE_DEBUG: "false" },
      target: "es2022",
      minify,
      sourcemap: !minify,
      outfile,
      nodePaths: [
        path.join(repoRoot, "packages/core/node_modules"),
        path.join(repoRoot, "node_modules"),
      ],
      logLevel: "warning",
    });
  }
  return { file, outfile, key };
}

// ---------------------------------------------------------------------------
// Local server for the harness, the builds and a local --src

const harnessHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>layout-perf</title>
<style>html,body{margin:0;height:100%}#vp{width:100%;height:100%;position:relative}</style>
</head><body><div id="vp"></div><script>
const q = new URLSearchParams(location.search);
const s = document.createElement("script");
s.src = "builds/" + q.get("build");
s.onload = () => {
  const viewer = new vivliostyle.CoreViewer(
    {
      viewportElement: document.getElementById("vp"),
      userAgentRootURL: new URL("resources/", location.href).href,
    },
    { renderAllPages: true, autoResize: false, pageViewMode: "singlePage" },
  );
  viewer.addListener("error", (p) => console.error("vivliostyle error:", p.content));
  const t0 = performance.now();
  viewer.addListener("readystatechange", () => {
    if (viewer.readyState === "complete") {
      window.__layoutPerf = {
        ms: performance.now() - t0,
        pages: document.querySelectorAll("[data-vivliostyle-page-container]").length,
      };
    }
  });
  const src = q.get("src");
  if (q.get("load") === "document") viewer.loadDocument({ url: src });
  else viewer.loadPublication(src);
};
document.head.appendChild(s);
</script></body></html>`;

const contentTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".xhtml": "application/xhtml+xml",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".opf": "application/oebps-package+xml",
  ".xml": "application/xml",
};

/** Whether a path relative to a directory is outside of it. */
const isOutside = (rel) =>
  rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);

function serveFile(res, root, relPath) {
  const filePath = path.resolve(root, relPath);
  // path.relative() also works for a root such as "/", unlike a prefix check.
  const rel = path.relative(root, filePath);
  if (isOutside(rel)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(filePath).toLowerCase()] ??
        "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  });
}

/** Start a server on a free port, calling handle() with the decoded path. */
async function listen(handle) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let p;
    try {
      p = decodeURIComponent(url.pathname);
    } catch {
      // A malformed escape, e.g. a literal "%" in a relative resource URL.
      res.writeHead(400).end();
      return;
    }
    handle(res, p);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, origin: `http://localhost:${server.address().port}` };
}

/**
 * Start the server for the harness and the builds, and for a local --src a
 * separate server with --serve-root at its root, so that root-relative URLs
 * in the document (e.g. "/styles.css") resolve as when it is published.
 */
async function startServers(opts, serveRoot) {
  const buildsDir = path.join(opts.outDir, "builds");
  const app = await listen((res, p) => {
    if (p === "/harness.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(harnessHtml);
    } else if (p.startsWith("/builds/")) {
      serveFile(res, buildsDir, p.slice("/builds/".length));
    } else if (p.startsWith("/resources/")) {
      serveFile(res, viewerResourcesDir, p.slice("/resources/".length));
    } else {
      res.writeHead(404).end();
    }
  });
  const src = serveRoot
    ? await listen((res, p) => serveFile(res, serveRoot, p.slice(1)))
    : null;
  return {
    origin: app.origin,
    srcOrigin: src?.origin,
    close: () => {
      app.server.close();
      src?.server.close();
    },
  };
}

/** Resolve --src to a URL, serving a local file with its directory. */
function resolveSrc(opts) {
  if (/^https?:\/\//.test(opts.src)) {
    return { srcPath: null, serveRoot: null };
  }
  const file = path.resolve(opts.src);
  if (!fs.statSync(file).isFile()) {
    throw new Error(`--src must be a URL or a file: ${opts.src}`);
  }
  const serveRoot = path.resolve(opts.serveRoot || path.dirname(file));
  const rel = path.relative(serveRoot, file);
  if (isOutside(rel)) {
    throw new Error(`--src is outside --serve-root: ${opts.src}`);
  }
  // Encode each segment, so that e.g. "#" or "?" in a file name is not taken
  // as a URL delimiter.
  const srcPath = rel.split(path.sep).map(encodeURIComponent).join("/");
  return { srcPath, serveRoot };
}

function loadMode(opts, srcUrl) {
  if (opts.load !== "auto") return opts.load;
  // Only the path: the query or fragment may contain other file names.
  return /\.x?html?$/i.test(new URL(srcUrl).pathname)
    ? "document"
    : "publication";
}

// ---------------------------------------------------------------------------
// Browser

async function launchBrowser(opts) {
  return chromium.launch({
    channel: opts.channel || undefined,
    headless: !opts.headed,
    // Allow a deployed https viewer to load a document from localhost.
    args: [
      "--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests",
    ],
  });
}

/**
 * Encode a URL for the viewer's src parameter as the viewer does for a URL
 * entered in it: the viewer reads the parameter up to the next "&" without
 * decoding it, so only "&" and a "%" that is not an escape are encoded.
 */
function viewerSrcParam(url) {
  return url.replace(/%(?![0-9A-Fa-f]{2})/g, "%25").replace(/&/g, "%26");
}

/**
 * Serve the responses from remote servers from memory after the first fetch,
 * so that the network does not distort the timing: each layout runs in a new
 * browser context, which would otherwise fetch everything again. Nothing is
 * saved to disk.
 */
const remoteCache = new Map();
async function cacheRemoteResponses(context) {
  await context.route(/^https?:/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() !== "GET" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      return route.continue();
    }
    // The same URL can get a different response for a different origin, e.g.
    // with "Access-Control-Allow-Origin: <origin>" and "Vary: Origin".
    const key = `${request.headers()["origin"] ?? ""} ${url.href}`;
    let entry = remoteCache.get(key);
    if (!entry) {
      // Keep a redirect as it is, so that the browser follows it and the
      // document gets its final URL as its base URL. (The request to the
      // redirect target is not routed here, so it is not cached.)
      const response = await route.fetch({ maxRedirects: 0 });
      // The body is decoded, so drop the headers of the encoded one.
      const headers = { ...response.headers() };
      delete headers["content-encoding"];
      delete headers["content-length"];
      entry = {
        status: response.status(),
        headers,
        body: await response.body(),
      };
      remoteCache.set(key, entry);
    }
    return route.fulfill(entry);
  });
}

/** Lay out all pages; return the layout time in ms and the page count. */
async function layoutOnce(browser, ctx, target, build, { onPage } = {}) {
  const context = await browser.newContext({ viewport: ctx.opts.viewport });
  if (ctx.opts.cache) await cacheRemoteResponses(context);
  try {
    const page = await context.newPage();
    page.on("console", (m) => {
      if (m.type() === "error" && /vivliostyle error/.test(m.text())) {
        console.error(`  [${target.label}] ${m.text()}`);
      }
    });
    if (onPage) await onPage.before?.(page);
    const timeout = ctx.opts.timeoutSec * 1000;
    let result;
    if (target.kind === "viewer") {
      const t0 = Date.now();
      // renderAllPages=true: a viewer can be configured not to lay out all
      // pages by default (the "a" flag), and would never be complete.
      await page.goto(
        `${target.url}#src=${viewerSrcParam(ctx.srcUrl)}&bookMode=${ctx.load === "publication"}&renderAllPages=true`,
        { waitUntil: "domcontentloaded", timeout },
      );
      await page.waitForFunction(
        () =>
          document.body?.getAttribute("data-vivliostyle-viewer-status") ===
          "complete",
        undefined,
        { timeout, polling: 100 },
      );
      const pages = await page.evaluate(
        () =>
          document.querySelector(
            "#vivliostyle-viewer-viewport [data-vivliostyle-spread-container]",
          )?.children.length ?? 0,
      );
      result = { ms: Date.now() - t0, pages };
    } else {
      const q = new URLSearchParams({
        build: build.file,
        src: ctx.srcUrl,
        load: ctx.load,
      });
      await page.goto(`${ctx.origin}/harness.html?${q}`, { timeout });
      await page.waitForFunction(() => window.__layoutPerf, undefined, {
        timeout,
        polling: 100,
      });
      result = await page.evaluate(() => window.__layoutPerf);
    }
    if (onPage) result.extra = await onPage.after?.(page);
    return result;
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Commands

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Print a table, padding the first column to the left and others to the right. */
function printColumns(header, rows) {
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => String(row[i]).length)),
  );
  for (const row of [header, ...rows]) {
    console.log(
      row
        .map((cell, i) =>
          i === 0
            ? String(cell).padEnd(widths[i])
            : String(cell).padStart(widths[i]),
        )
        .join("  ")
        .trimEnd(),
    );
  }
}

/** Lay out the document with each target, without counting the time. */
async function warmUp(browser, ctx) {
  for (let r = 0; r < ctx.opts.warmup; r++) {
    for (const target of ctx.opts.targets) {
      const { ms } = await layoutOnce(
        browser,
        ctx,
        target,
        ctx.builds.get(target.label),
      );
      console.log(`  warm-up ${target.label}: ${Math.round(ms)} ms`);
    }
  }
}

async function measure(browser, ctx) {
  await warmUp(browser, ctx);
  const times = new Map(ctx.opts.targets.map((t) => [t.label, []]));
  const pages = new Map();
  for (let r = 0; r < ctx.opts.runs; r++) {
    for (const target of ctx.opts.targets) {
      const { ms, pages: n } = await layoutOnce(
        browser,
        ctx,
        target,
        ctx.builds.get(target.label),
      );
      times.get(target.label).push(ms);
      pages.set(target.label, n);
      console.log(
        `  run ${r + 1} ${target.label}: ${Math.round(ms)} ms, ${n} pages`,
      );
    }
  }
  const rows = ctx.opts.targets.map((t) => {
    const ts = times.get(t.label);
    return {
      target: t.label,
      median: Math.round(median(ts)),
      min: Math.round(Math.min(...ts)),
      max: Math.round(Math.max(...ts)),
      pages: pages.get(t.label),
    };
  });
  const base = rows[0].median;
  console.log();
  printColumns(
    ["target", "median ms", "min ms", "max ms", "pages", "vs first"],
    rows.map((r) => {
      const diff = ((r.median / base - 1) * 100).toFixed(1);
      return [
        r.target,
        r.median,
        r.min,
        r.max,
        r.pages,
        r === rows[0] ? "" : `${diff > 0 ? "+" : ""}${diff}%`,
      ];
    }),
  );
  writeJson(ctx, "measure.json", { src: ctx.opts.src, rows, times });
}

const classPattern =
  /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([\w$]+)/;
const functionPattern =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)/;
const methodPattern =
  /^ {2}(?:(?:public|private|protected|static|async|override|get|set)\s+)*\*?(?!(?:if|for|while|switch|catch|return|await|new|super)\b)([\w$]+)\s*(?:<[^>]*>)?\(/;

/**
 * Name a function from its source, e.g. "NodeContext.clone",
 * "Column.layoutNext/(anonymous)", or "supportsTrim/measure": the profile has
 * only the bundle's function name ("clone", or "measure2" if esbuild renamed
 * it), which can be shared by different functions or differ between builds.
 * The enclosing top-level class and method or function are found by
 * indentation, as formatted by Prettier.
 */
function functionIdentity(lines, line, column, bundleName) {
  const text = lines[line] ?? "";
  // A function assigned to a variable or property: the name in the source.
  const assigned = /([\w$]+)\s*[:=]\s*(?:async\s*)?(?:function\b.*)?$/.exec(
    text.slice(0, column),
  )?.[1];
  let name = assigned ?? (bundleName || "(anonymous)");
  let owner = null;
  let cls = null;
  // Set when the function is the method or function defined on its line, so
  // that the preceding (sibling) methods are not taken as its owner.
  let defined = false;
  for (let i = line; i >= 0; i--) {
    const l = lines[i];
    if (i < line && /^\}/.test(l)) break; // Left a top-level block.
    let m;
    if ((m = classPattern.exec(l))) {
      cls = m[1];
      break;
    }
    if ((m = functionPattern.exec(l) ?? methodPattern.exec(l))) {
      if (i === line && !assigned) {
        name = m[1];
        defined = true;
      } else if (!defined) {
        owner ??= m[1];
      }
      if (functionPattern.test(l)) break;
    }
  }
  return `${cls ? `${cls}.` : ""}${owner && owner !== name ? `${owner}/` : ""}${name}`;
}

/** Summarize a CPU profile by function, mapping core frames to sources. */
function summarizeProfile(profile, build) {
  const map = build
    ? new SourceMap(JSON.parse(fs.readFileSync(`${build.outfile}.map`)))
    : null;
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  for (const n of profile.nodes) {
    for (const c of n.children ?? []) nodes.get(c).parent = n.id;
  }
  const sources = new Map();
  const sourceLines = (source) => {
    if (!sources.has(source)) {
      const file = path.resolve(path.dirname(build.outfile), source);
      sources.set(
        source,
        fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n") : [],
      );
    }
    return sources.get(source);
  };
  // The name with the source line, and the key to match a function across
  // versions (without the line).
  const names = new Map();
  const keys = new Map();
  const nameOf = (n) => {
    if (names.has(n.id)) return names.get(n.id);
    const cf = n.callFrame;
    let name = cf.functionName || (cf.url ? "(anonymous)" : "(native)");
    let key = name;
    if (map && cf.url.endsWith(`/builds/${build.file}`)) {
      const e = map.findEntry(cf.lineNumber, cf.columnNumber);
      // Strip the build-specific directory, so that the names of a function
      // are the same in the builds of different versions.
      const file = e?.originalSource?.replace(/^(.*\/)?src[^/]*\//, "");
      if (file) {
        const id = functionIdentity(
          sourceLines(e.originalSource),
          e.originalLine,
          e.originalColumn,
          cf.functionName,
        );
        key = `${id} ${file}`;
        name = `${key}:${e.originalLine + 1}`;
      }
    }
    names.set(n.id, name);
    keys.set(name, key);
    return name;
  };
  const self = new Map();
  const total = new Map();
  // Inclusive time per function key, for the comparison between versions.
  const totalByKey = new Map();
  const callers = [];
  let sum = 0;
  // timeDeltas[i] is the time from the previous sample to sample i. Each
  // sample is given the time until the next one (as in Chrome DevTools), and
  // the last one the time until the end of the profile.
  let lastTimestamp = profile.startTime;
  for (const delta of profile.timeDeltas) lastTimestamp += delta;
  for (let i = 0; i < profile.samples.length; i++) {
    const dt =
      i + 1 < profile.samples.length
        ? profile.timeDeltas[i + 1]
        : Math.max(0, profile.endTime - lastTimestamp);
    sum += dt;
    let n = nodes.get(profile.samples[i]);
    self.set(nameOf(n), (self.get(nameOf(n)) ?? 0) + dt);
    const stack = [];
    for (; n; n = n.parent != null ? nodes.get(n.parent) : null) {
      stack.push(nameOf(n));
    }
    for (const name of new Set(stack)) {
      total.set(name, (total.get(name) ?? 0) + dt);
    }
    for (const key of new Set(stack.map((name) => keys.get(name)))) {
      totalByKey.set(key, (totalByKey.get(key) ?? 0) + dt);
    }
    callers.push([stack, dt]);
  }
  return { sum, self, total, totalByKey, callers };
}

function printTable(title, map, top, filter = () => true) {
  console.log(`\n== ${title} ==`);
  for (const [name, us] of [...map]
    .filter(([name]) => filter(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)) {
    console.log(`${(us / 1000).toFixed(0).padStart(8)}  ${name}`);
  }
}

// Frames of the task scheduler that only obscure the actual callers.
const isSchedulerFrame = (name) =>
  /[\s/]task\.ts(:|$)|^\((root|program|idle)\)$/.test(name);

async function profile(browser, ctx) {
  await warmUp(browser, ctx);
  const summaries = [];
  for (const target of ctx.opts.targets) {
    const build = ctx.builds.get(target.label);
    let saved;
    for (let r = 0; r < ctx.opts.runs; r++) {
      let cdp;
      const { ms, pages, extra } = await layoutOnce(
        browser,
        ctx,
        target,
        build,
        {
          onPage: {
            before: async (page) => {
              cdp = await page.context().newCDPSession(page);
              await cdp.send("Profiler.enable");
              await cdp.send("Profiler.setSamplingInterval", {
                interval: ctx.opts.samplingInterval,
              });
              await cdp.send("Profiler.start");
            },
            after: async () => (await cdp.send("Profiler.stop")).profile,
          },
        },
      );
      saved = extra;
      console.log(
        `  run ${r + 1} ${target.label}: ${Math.round(ms)} ms (profiled), ${pages} pages`,
      );
    }
    const file = path.join(
      ctx.opts.outDir,
      "profiles",
      `${fileLabel(target.label)}.cpuprofile`,
    );
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(saved));
    const summary = summarizeProfile(saved, build);
    summaries.push([target, summary]);
    console.log(
      `\n### ${target.label}: ${(summary.sum / 1000).toFixed(0)} ms sampled (profile: ${path.relative(repoRoot, file)})`,
    );
    printTable("self time (ms)", summary.self, ctx.opts.top);
    printTable(
      "inclusive time (ms)",
      summary.total,
      ctx.opts.top,
      (name) => !isSchedulerFrame(name),
    );
    if (ctx.opts.callers) printCallers(summary, ctx.opts);
  }
  if (summaries.length > 1) {
    const [base, baseSummary] = summaries[0];
    const baseTotal = baseSummary.totalByKey;
    for (const [target, summary] of summaries.slice(1)) {
      const total = summary.totalByKey;
      const rows = [...new Set([...baseTotal.keys(), ...total.keys()])]
        .filter((name) => !isSchedulerFrame(name))
        .map((name) => [
          name,
          (total.get(name) ?? 0) - (baseTotal.get(name) ?? 0),
        ]);
      console.log(
        `\n== inclusive time: ${target.label} minus ${base.label} (ms) ==`,
      );
      const top = ctx.opts.top >> 1;
      const sorted = rows.sort((a, b) => b[1] - a[1]);
      for (const [name, us] of [
        ...sorted.slice(0, top),
        ...sorted.slice(-top).filter(([, us]) => us < 0),
      ].filter(([, us]) => us > 0 || us < 0)) {
        console.log(
          `${((us > 0 ? "+" : "") + (us / 1000).toFixed(0)).padStart(8)}  ${name}`,
        );
      }
    }
  }
}

function printCallers(summary, opts) {
  const re = new RegExp(opts.callers);
  const agg = new Map();
  for (const [stack, dt] of summary.callers) {
    const i = stack.findIndex((name) => re.test(name));
    if (i < 0) continue;
    const chain = stack
      .slice(i + 1)
      .filter((name) => !isSchedulerFrame(name))
      .slice(0, 3);
    const key = `${stack[i]} <- ${chain.join(" <- ")}`;
    agg.set(key, (agg.get(key) ?? 0) + dt);
  }
  printTable(`callers of /${opts.callers}/ (ms)`, agg, opts.top);
}

async function compare(browser, ctx) {
  const compareDir = path.join(ctx.opts.outDir, "compare");
  fs.rmSync(compareDir, { recursive: true, force: true });
  const results = [];
  for (const target of ctx.opts.targets) {
    for (let r = 0; r < ctx.opts.repeat; r++) {
      const { pages, extra } = await layoutOnce(
        browser,
        ctx,
        target,
        ctx.builds.get(target.label),
        {
          onPage: {
            after: (page) =>
              page.evaluate(() =>
                [
                  ...document.querySelectorAll(
                    "[data-vivliostyle-page-container]",
                  ),
                ].map((p) => {
                  // Pages other than the current one are hidden; show each
                  // page to measure the rects of its elements.
                  const display = p.style.display;
                  p.style.display = "block";
                  // One line per element: its tag, its source offset if any,
                  // and its rect rounded to 1/4px.
                  const rects = [...p.querySelectorAll("*")]
                    .map((e) => {
                      const b = e.getBoundingClientRect();
                      const offset = e.getAttribute("data-adapt-eloff");
                      return `${e.localName}${offset ? `@${offset}` : ""} ${[
                        b.x,
                        b.y,
                        b.width,
                        b.height,
                      ]
                        .map((v) => Math.round(v * 4) / 4)
                        .join(",")}`;
                    })
                    .join("\n");
                  p.style.display = display;
                  // Sort the attributes: the order in which some are set
                  // depends on timing, e.g. the load of an image.
                  const escape = (str, re) =>
                    str.replace(re, (c) => `&#${c.charCodeAt(0)};`);
                  const serialize = (node) =>
                    node.nodeType === Node.TEXT_NODE
                      ? escape(node.data, /[&<>]/g)
                      : node.nodeType === Node.ELEMENT_NODE
                        ? `<${node.localName}${[...node.attributes]
                            .map(
                              (a) => ` ${a.name}="${escape(a.value, /[&"]/g)}"`,
                            )
                            .sort()
                            .join("")}>${[...node.childNodes]
                            .map(serialize)
                            .join("")}</${node.localName}>`
                        : "";
                  // Include the page container itself, which has page-level
                  // state such as the page side and size.
                  const html = serialize(p);
                  return { html, rects };
                }),
              ),
          },
        },
      );
      const label =
        ctx.opts.repeat > 1 ? `${target.label}#${r + 1}` : target.label;
      results.push({
        label,
        pages: extra.map(({ html, rects }) => ({
          html,
          rects,
          htmlHash: hash(html),
          rectsHash: hash(rects),
        })),
      });
      console.log(`  ${label}: ${pages} pages`);
    }
  }
  const [base, ...others] = results;
  const report = [];
  console.log();
  for (const other of others) {
    const n = Math.max(base.pages.length, other.pages.length);
    const html = [];
    const rects = [];
    for (let i = 0; i < n; i++) {
      if (base.pages[i]?.htmlHash !== other.pages[i]?.htmlHash)
        html.push(i + 1);
      if (base.pages[i]?.rectsHash !== other.pages[i]?.rectsHash)
        rects.push(i + 1);
    }
    const same = !html.length && !rects.length;
    console.log(
      `${other.label} vs ${base.label}: ${same ? "identical" : `DOM differs on pages [${html.join(", ")}], rects differ on pages [${rects.join(", ")}]`}` +
        (base.pages.length !== other.pages.length
          ? ` (page count ${base.pages.length} vs ${other.pages.length})`
          : ""),
    );
    // Save the DOM and the element rects of the first differing pages; the
    // rects can differ with the same DOM, e.g. after a stylesheet change.
    const differing = [...new Set([...html, ...rects])].sort((a, b) => a - b);
    for (const p of differing.slice(0, 5)) {
      fs.mkdirSync(compareDir, { recursive: true });
      for (const res of [base, other]) {
        const page = res.pages[p - 1];
        if (page) {
          const name = `${fileLabel(res.label)}-p${p}`;
          fs.writeFileSync(
            path.join(compareDir, `${name}.html`),
            page.html.replace(/></g, ">\n<"),
          );
          fs.writeFileSync(
            path.join(compareDir, `${name}.rects.txt`),
            `${page.rects}\n`,
          );
        }
      }
    }
    report.push({ label: other.label, base: base.label, html, rects });
  }
  if (report.some((r) => r.html.length || r.rects.length)) {
    console.log(
      `\nDOM (.html) and element rects (.rects.txt) of the first differing pages: ${path.relative(repoRoot, compareDir)}/`,
    );
  }
  writeJson(ctx, "compare.json", { src: ctx.opts.src, report });
  if (report.some((r) => r.html.length || r.rects.length)) process.exitCode = 2;
}

const hash = (s) => crypto.createHash("md5").update(s).digest("hex");

/**
 * A target label usable in a file name. When characters had to be replaced,
 * a hash of the label is appended, so that e.g. "feature/foo" and
 * "feature_foo" do not get the same file name.
 */
function fileLabel(label) {
  const safe = label.replace(/[^\w.-]+/g, "_");
  return safe === label ? safe : `${safe}-${hash(label).slice(0, 8)}`;
}

function writeJson(ctx, name, data) {
  fs.mkdirSync(ctx.opts.outDir, { recursive: true });
  fs.writeFileSync(
    path.join(ctx.opts.outDir, name),
    JSON.stringify(
      data,
      (k, v) => (v instanceof Map ? Object.fromEntries(v) : v),
      2,
    ),
  );
}

// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { srcPath, serveRoot } = resolveSrc(opts);
  const builds = new Map();
  for (const target of opts.targets) {
    if (target.kind !== "core") continue;
    console.log(`Building ${target.label} (${target.spec})...`);
    builds.set(
      target.label,
      await buildCore(target, opts, { minify: opts.command !== "profile" }),
    );
  }
  const servers = await startServers(opts, serveRoot);
  const { origin } = servers;
  const srcUrl = srcPath ? `${servers.srcOrigin}/${srcPath}` : opts.src;
  const ctx = { opts, builds, origin, srcUrl, load: loadMode(opts, srcUrl) };
  console.log(`Source: ${srcUrl} (${ctx.load})\n`);
  const browser = await launchBrowser(opts);
  try {
    if (opts.command === "measure") await measure(browser, ctx);
    else if (opts.command === "profile") await profile(browser, ctx);
    else await compare(browser, ctx);
  } finally {
    await browser.close();
    servers.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
