/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

const browserSync = require("browser-sync").create();
const changed = require("gulp-changed");
const sass = require("gulp-sass");
const ejs = require("gulp-ejs");
const fs = require("fs");
const gulp = require("gulp");
const KarmaServer = require("karma").Server;
const notify = require("gulp-notify");
const path = require("path");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const packageImporter = require("node-sass-package-importer");

sass.compiler = require("node-sass");

// Parameters
const SRC_DIR = "src";
const DEST_DIR = "lib";
const DIRS = {
  fonts: { src: "fonts" },
  html: { src: "html", dest: ".", srcPattern: "*.ejs" },
  css: { src: "scss", dest: "css", srcPattern: "*.scss" },
  resources: {
    src: "../core/resources",
    dest: "resources",
  },
  pluginResources: {
    src: "../core/plugins/*/resources",
    dest: "plugins",
  },
};
const VIVLIOSTYLE_JS_SRC_DIR = "../core/lib";
const HTML_FILENAMES = {
  production: "vivliostyle-viewer.html",
  development: "vivliostyle-viewer-dev.html",
};

function getVersion(basePath) {
  const { version } = JSON.parse(
    fs.readFileSync(path.join(basePath, "package.json"), "utf8"),
  );
  return version;
}
const VERSION = getVersion(".");

// Utility functions
function destDir(type) {
  const dirs = DIRS[type];
  const dirName = dirs.dest || dirs.src;
  return path.join(DEST_DIR, dirName);
}

const srcPattern = (type) =>
  path.join(SRC_DIR, DIRS[type].src, DIRS[type].srcPattern || "**/*");

// create a task simply copying files
function copyTask(type) {
  const dest = destDir(type);
  return gulp.task("build:" + type, function() {
    return gulp
      .src(srcPattern(type))
      .pipe(changed(dest))
      .pipe(gulp.dest(dest));
  });
}
copyTask("fonts");
copyTask("resources");
copyTask("pluginResources");

// HTML build
function buildHtml(isDevelopment) {
  return gulp
    .src(srcPattern("html"))
    .pipe(
      ejs({
        version: VERSION,
        isDevelopment: isDevelopment,
        viewerPath: isDevelopment
          ? "js/vivliostyle-viewer.dev.js"
          : "js/vivliostyle-viewer.min.js",
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
        isDevelopment ? HTML_FILENAMES.development : HTML_FILENAMES.production,
      ),
    )
    .pipe(gulp.dest(destDir("html")));
}
gulp.task("build:html", () => buildHtml(false));
gulp.task("build:html-dev", () => buildHtml(true));

// CSS build
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
  gulp.parallel(
    "build:html",
    "build:css",
    "build:fonts",
    "build:resources",
    "build:pluginResources",
  ),
);
gulp.task(
  "build-dev",
  gulp.parallel(
    "build:html-dev",
    "build:css-dev",
    "build:fonts",
    "build:resources",
    "build:pluginResources",
  ),
);

// watch
gulp.task("start-watching", (done) => done());
gulp.task(
  "watch",
  gulp.series(gulp.parallel("start-watching", "build"), function(done) {
    gulp.watch(srcPattern("html"), gulp.task("build:html"));
    gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
    gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
    gulp.watch(
      srcPattern("pluginResources"),
      gulp.task("build:pluginResources"),
    );
    gulp.watch(srcPattern("css"), gulp.task("build:css"));
    done();
  }),
);
gulp.task(
  "watch-dev",
  gulp.series(gulp.parallel("start-watching", "build-dev"), function(done) {
    gulp.watch(srcPattern("html"), gulp.task("build:html-dev"));
    gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
    gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
    gulp.watch(
      srcPattern("pluginResources"),
      gulp.task("build:pluginResources"),
    );
    gulp.watch(srcPattern("css"), gulp.task("build:css-dev"));
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
  if (isDevelopment) {
    target.push(VIVLIOSTYLE_JS_SRC_DIR + "/**/*");
  }
  gulp.watch(target).on("change", browserSync.reload);
}
gulp.task(
  "serve",
  gulp.series("watch", function(done) {
    serve(false);
    done();
  }),
);
gulp.task(
  "serve-dev",
  gulp.series("watch-dev", function(done) {
    serve(true);
    done();
  }),
);

gulp.task("default", gulp.task("serve-dev"));

// Test
gulp.task("test-local", function(done) {
  const server = new KarmaServer(
    {
      configFile: process.cwd() + "/test/conf/karma-local.conf",
    },
    function(exitStatus) {
      done(exitStatus ? "Some tests failed" : undefined);
    },
  );
  server.start();
});

gulp.task("test-sauce", function(done) {
  const server = new KarmaServer(
    {
      configFile: process.cwd() + "/test/conf/karma-sauce.conf",
    },
    function(exitStatus) {
      done(exitStatus ? "Some tests failed" : undefined);
    },
  );
  server.start();
});
