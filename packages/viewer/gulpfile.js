/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const process = require("process");
// const KarmaServer = require("karma").Server;
const browserSync = require("browser-sync").create();
const gulp = require("gulp");
const ejs = require("gulp-ejs");
const sass = require("gulp-sass")(require("sass"));
const notify = require("gulp-notify");
const rename = require("gulp-rename");
const changed = require("gulp-changed");
const plumber = require("gulp-plumber");
const packageImporter = require("node-sass-package-importer");
const pkg = require("./package.json");

// Parameters
const SRC_DIR = "src";
const DEST_DIR = "lib";
const RESOURCE_MAP = {
  fonts: { src: "fonts" },
  html: { src: "html", dest: ".", srcPattern: "*.ejs" },
  css: { src: "scss", dest: "css", srcPattern: "**/*.scss" },
  resources: {
    src: "../resources",
    dest: "resources",
  },
};
const VIEWER_HTML_FILES = {
  production: "index.html",
  development: "vivliostyle-viewer-dev.html",
};
const VIEWER_JS_FILES = {
  production: path.relative(DEST_DIR, pkg.main),
  development: "js/vivliostyle-viewer-dev.js",
};
const DEV_SERVER_LOCK_FILE = path.resolve(".cache", "dev-server.json");
const DEV_SERVER_DEFAULT_URL = "http://localhost:3000/core/test/files/";

const VIVLIOSTYLE_VERSION = process.env["VIVLIOSTYLE_VERSION"];
const VERSION =
  VIVLIOSTYLE_VERSION === "canary"
    ? pkg.version +
      "+canary." +
      new Date().toISOString().replace(/[-:]|\.\d+/g, "")
    : VIVLIOSTYLE_VERSION || pkg.version;
console.log(`Building Vivliostyle Viewer [version=${VERSION}]`);

// Utility functions
function destDir(type) {
  const dirs = RESOURCE_MAP[type];
  const dirName = dirs.dest ? dirs.dest : dirs.src;
  return path.join(DEST_DIR, dirName);
}

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

function readDevServerLock() {
  if (!fs.existsSync(DEV_SERVER_LOCK_FILE)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(DEV_SERVER_LOCK_FILE, "utf8"));
  } catch {
    return null;
  }
}

function removeDevServerLock() {
  fs.rmSync(DEV_SERVER_LOCK_FILE, { force: true });
}

function cleanupStaleDevServerLock() {
  const lock = readDevServerLock();
  if (lock && isProcessAlive(lock.pid)) {
    return lock;
  }
  if (fs.existsSync(DEV_SERVER_LOCK_FILE)) {
    removeDevServerLock();
  }
  return null;
}

function writeDevServerLock(url) {
  fs.mkdirSync(path.dirname(DEV_SERVER_LOCK_FILE), { recursive: true });
  fs.writeFileSync(
    DEV_SERVER_LOCK_FILE,
    JSON.stringify({
      pid: process.pid,
      url,
      startedAt: new Date().toISOString(),
    }),
  );
}

let hasRegisteredDevServerCleanup = false;
function registerDevServerCleanup() {
  if (hasRegisteredDevServerCleanup) {
    return;
  }
  hasRegisteredDevServerCleanup = true;

  const cleanup = () => {
    const lock = readDevServerLock();
    if (lock && lock.pid === process.pid) {
      removeDevServerLock();
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
}

function findRunningDevServer() {
  const lock = cleanupStaleDevServerLock();
  if (!lock) {
    return null;
  }
  return {
    url: lock.url || DEV_SERVER_DEFAULT_URL,
  };
}

function getLocalServerOrigin(bs) {
  if (!bs || typeof bs.getOption !== "function") {
    return "http://localhost:3000";
  }
  const urls = bs.getOption("urls");
  if (urls && typeof urls.get === "function") {
    const local = urls.get("local");
    if (local) {
      return local;
    }
  }
  return "http://localhost:3000";
}

function getDevServerUrl(localUrl) {
  if (typeof localUrl !== "string" || !localUrl) {
    return DEV_SERVER_DEFAULT_URL;
  }

  if (localUrl.includes("/core/test/files/")) {
    return localUrl;
  }

  const normalized = localUrl.endsWith("/") ? localUrl.slice(0, -1) : localUrl;
  return `${normalized}/core/test/files/`;
}

const srcPattern = (type) =>
  path.resolve(
    SRC_DIR,
    RESOURCE_MAP[type].src,
    RESOURCE_MAP[type].srcPattern || "**/*",
  );

// create a task simply copying files
function createCopyTask(type) {
  const dest = destDir(type);
  return gulp.task("build:" + type, function () {
    return gulp.src(srcPattern(type)).pipe(changed(dest)).pipe(gulp.dest(dest));
  });
}
createCopyTask("fonts");
createCopyTask("resources");

// Build HTML
function buildHtml(isDevelopment) {
  return gulp
    .src(srcPattern("html"))
    .pipe(
      ejs({
        isDevelopment,
        version: VERSION,
        viewerPath: isDevelopment
          ? VIEWER_JS_FILES.development
          : VIEWER_JS_FILES.production,
        packageRoot: isDevelopment ? "../.." : "//unpkg.com/@vivliostyle",
      }),
    )
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      }),
    )
    .pipe(
      rename(
        isDevelopment
          ? VIEWER_HTML_FILES.development
          : VIEWER_HTML_FILES.production,
      ),
    )
    .pipe(gulp.dest(destDir("html")));
}
gulp.task("build:html", () => buildHtml(false));
gulp.task("build:html-dev", () => buildHtml(true));

// Build CSS
function buildCss(isDevelopment) {
  return gulp
    .src(srcPattern("css"))
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      }),
    )
    .pipe(
      sass({
        silenceDeprecations: [
          "global-builtin",
          "import",
          "legacy-js-api",
          "slash-div",
        ],
        importer: packageImporter({
          extensions: [".scss", ".css"],
        }),
        outputStyle: isDevelopment ? "expanded" : "compressed",
      }).on("error", sass.logError),
    )
    .pipe(gulp.dest(path.resolve(destDir("css"))));
}
gulp.task("build:css", () => buildCss(false));
gulp.task("build:css-dev", () => buildCss(true));

// build all
gulp.task(
  "build",
  gulp.parallel("build:html", "build:css", "build:fonts", "build:resources"),
);
gulp.task(
  "build-dev",
  gulp.parallel(
    "build:html-dev",
    "build:css-dev",
    "build:fonts",
    "build:resources",
  ),
);

// Test
// These tests have been disabled. See issue #618.
//
// gulp.task("test-local", function (done) {
//   const server = new KarmaServer(
//     {
//       configFile: process.cwd() + "/test/conf/karma-local.conf",
//     },
//     function (exitStatus) {
//       done(exitStatus ? "Some tests failed" : undefined);
//     },
//   );
//   server.start();
// });
//
// gulp.task("test-sauce", function (done) {
//   const server = new KarmaServer(
//     {
//       configFile: process.cwd() + "/test/conf/karma-sauce.conf",
//     },
//     function (exitStatus) {
//       done(exitStatus ? "Some tests failed" : undefined);
//     },
//   );
//   server.start();
// });

// watch
gulp.task("start-watching", (done) => done());
gulp.task(
  "watch",
  gulp.series(gulp.parallel("start-watching", "build"), function (done) {
    gulp.watch(srcPattern("html"), gulp.task("build:html"));
    gulp.watch(srcPattern("css"), gulp.task("build:css"));
    gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
    gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
    done();
  }),
);
gulp.task(
  "watch-dev",
  gulp.series(gulp.parallel("start-watching", "build-dev"), function (done) {
    gulp.watch(srcPattern("html"), gulp.task("build:html-dev"));
    gulp.watch(srcPattern("css"), gulp.task("build:css-dev"));
    gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
    gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
    done();
  }),
);

// serve
function serve(isDevelopment) {
  const runningDevServer = findRunningDevServer();
  if (runningDevServer) {
    console.log(
      `[dev] Vivliostyle dev server is already running at ${runningDevServer.url}.`,
    );
    console.log("[dev] Skipping a new dev server start.");
    return false;
  }

  browserSync.init(
    {
      server: {
        baseDir: "../",
      },
      startPath: "/core/test/files/",
      ghostMode: false, // do not mirror clicks, scrolls etc. between multiple browsers
      notify: false, // do not show any notifications in the browser
      port: 3000,
    },
    (_, bs) => {
      const localOrigin = getLocalServerOrigin(bs);
      const devServerUrl = getDevServerUrl(localOrigin);
      writeDevServerLock(devServerUrl);
      registerDevServerCleanup();
    },
  );
  const target = [DEST_DIR + "/**/*"];
  gulp.watch(target).on("change", browserSync.reload);
  return true;
}
gulp.task("serve", function (done) {
  const runningDevServer = findRunningDevServer();
  if (runningDevServer) {
    console.log(
      `[dev] Vivliostyle dev server is already running at ${runningDevServer.url}.`,
    );
    console.log("[dev] Skipping a new dev server start.");
    done();
    return;
  }

  return gulp.series("watch", function (next) {
    serve(false);
    next();
  })(done);
});
gulp.task("serve-dev", function (done) {
  const runningDevServer = findRunningDevServer();
  if (runningDevServer) {
    console.log(
      `[dev] Vivliostyle dev server is already running at ${runningDevServer.url}.`,
    );
    console.log("[dev] Skipping a new dev server start.");
    done();
    return;
  }

  return gulp.series("watch-dev", function (next) {
    serve(true);
    next();
  })(done);
});

gulp.task("default", gulp.task("serve-dev"));
