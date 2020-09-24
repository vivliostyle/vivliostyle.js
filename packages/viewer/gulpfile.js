/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const KarmaServer = require("karma").Server;
const browserSync = require("browser-sync").create();
const gulp = require("gulp");
const ejs = require("gulp-ejs");
const sass = require("gulp-sass");
const notify = require("gulp-notify");
const rename = require("gulp-rename");
const changed = require("gulp-changed");
const plumber = require("gulp-plumber");
const packageImporter = require("node-sass-package-importer");
sass.compiler = require("node-sass");
const pkg = require("./package.json");

// Parameters
const SRC_DIR = "src";
const DEST_DIR = "lib";
const RESOURCE_MAP = {
  fonts: { src: "fonts" },
  html: { src: "html", dest: ".", srcPattern: "*.ejs" },
  css: { src: "scss", dest: "css", srcPattern: "*.scss" },
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

const VIVLIOSTYLE_VERSION = process.env["VIVLIOSTYLE_VERSION"];
const VERSION =
  VIVLIOSTYLE_VERSION === "canary"
    ? pkg.version +
      "-canary-" +
      new Date().toISOString().replace(/[-:]|\.\d+/g, "")
    : VIVLIOSTYLE_VERSION || pkg.version;
console.log(`Building Vivliostyle Viewer [version=${VERSION}]`);

// Utility functions
function destDir(type) {
  const dirs = RESOURCE_MAP[type];
  const dirName = dirs.dest ? dirs.dest : dirs.src;
  return path.join(DEST_DIR, dirName);
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
gulp.task("test-local", function (done) {
  const server = new KarmaServer(
    {
      configFile: process.cwd() + "/test/conf/karma-local.conf",
    },
    function (exitStatus) {
      done(exitStatus ? "Some tests failed" : undefined);
    },
  );
  server.start();
});

gulp.task("test-sauce", function (done) {
  const server = new KarmaServer(
    {
      configFile: process.cwd() + "/test/conf/karma-sauce.conf",
    },
    function (exitStatus) {
      done(exitStatus ? "Some tests failed" : undefined);
    },
  );
  server.start();
});

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
  browserSync.init({
    browser:
      process.platform === "darwin"
        ? "google chrome"
        : process.platform === "win32"
        ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
        : "chromium-browser",
    server: {
      baseDir: "../",
    },
    startPath: "/core/test/files/",
  });
  const target = [DEST_DIR + "/**/*"];
  gulp.watch(target).on("change", browserSync.reload);
}
gulp.task(
  "serve",
  gulp.series("watch", function (done) {
    serve(false);
    done();
  }),
);
gulp.task(
  "serve-dev",
  gulp.series("watch-dev", function (done) {
    serve(true);
    done();
  }),
);

gulp.task("default", gulp.task("serve-dev"));
