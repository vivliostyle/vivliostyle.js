"use strict";

var babelify = require("babelify");
var browserify = require("browserify");
var browserSync = require('browser-sync').create();
var changed = require("gulp-changed");
var compass = require("gulp-compass");
var ejs = require("gulp-ejs");
var gulp = require("gulp");
var gutil = require("gulp-util");
var KarmaServer = require("karma").Server;
var notify = require("gulp-notify");
var path = require("path");
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");
var source = require("vinyl-source-stream");
var watchify = require("watchify");

// Parameters
var SRC_DIR = "src";
var DEST_DIR = "build";
var DIRS = {
    fonts: {src: "fonts"},
    html: {src: "html", dest: "", srcPattern: "*.ejs"},
    js: {src: "js"},
    css: {src: "scss", dest: "css", srcPattern: "*.scss"},
    resources: {src: "../node_modules/vivliostyle/resources", dest: "resources"},
    mathjax: {src: "../node_modules/mathjax", dest: "mathjax"}
};
var JS_ENTRIES = {
    production: "main.js",
    development: "main-dev.js"
};
var VIVLIOSTYLE_JS_SRC_DIR = "node_modules/vivliostyle/src";
var HTML_FILENAMES = {
    production: "vivliostyle-viewer.html",
    development: "vivliostyle-viewer-dev.html"
};
var SERVER_START_PATH = "/vivliostyle-ui/build/%viewer-html%#x=/vivliostyle.js/samples/gon/index.html";

// Utility functions
function srcDir(type) {
    return SRC_DIR + "/" + DIRS[type].src;
}
function destDir(type) {
    var dirs = DIRS[type];
    return DEST_DIR + "/" + (typeof dirs.dest === "string" ? dirs.dest : dirs.src);
}
function srcPattern(type) {
    return SRC_DIR + "/" + DIRS[type].src + "/" + (DIRS[type].srcPattern || "**/*");
}
function serverStartPath(development) {
    var name = development ? HTML_FILENAMES.development : HTML_FILENAMES.production;
    return SERVER_START_PATH.replace("%viewer-html%", name);
}

// JS build
function getBrowserify(development, watch) {
    var b = browserify({
        cache: {},
        packageCache: {},
        entries: [srcDir("js") + "/" + (development ? JS_ENTRIES.development : JS_ENTRIES.production)],
        transform: [babelify],
        debug: development
    });
    if (watch) {
        b = watchify(b);
    }
    b.on("log", gutil.log);
    return b;
}
function bundleJs(b, name) {
    return b.bundle()
            .on("error", gutil.log.bind(gutil, "Browserify Error"))
            .pipe(source(name))
            .pipe(gulp.dest(destDir("js")));
}
var b;
var watching = false;
function bundleJsProd() {
    var name = JS_ENTRIES.production;
    return bundleJs(b, name);
}
function bundleJsDev() {
    var name = JS_ENTRIES.development;
    return bundleJs(b, name);
}
gulp.task("build:js", function() {
    b = getBrowserify(false, watching);
    bundleJsProd();
});
gulp.task("build:js-dev", function() {
    b = getBrowserify(true, watching);
    bundleJsDev();
});

// create a task simply copying files
function copyTask(type) {
    var dest = destDir(type);
    return gulp.task("build:" + type, function() {
        return gulp.src(srcPattern(type))
            .pipe(changed(dest))
            .pipe(gulp.dest(dest));
    });
}
copyTask("fonts");
copyTask("resources");
copyTask("mathjax");

// HTML build
function buildHtml(development) {
    return gulp.src(srcPattern("html"))
        .pipe(ejs({development: development}))
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(rename(development ? HTML_FILENAMES.development : HTML_FILENAMES.production))
        .pipe(gulp.dest(destDir("html")));
}
gulp.task("build:html", function() {
    return buildHtml(false);
});
gulp.task("build:html-dev", function() {
    return buildHtml(true);
});

// CSS build
function buildCss(development) {
    return gulp.src(srcPattern("css"))
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(compass({
            config_file: SRC_DIR + "/config.rb",
            css: path.resolve(destDir("css")),
            sass: path.resolve(srcDir("css")),
            environment: development ? "development" : "production"
        }));
}
gulp.task("build:css", function() {
    return buildCss(false);
});
gulp.task("build:css-dev", function() {
    return buildCss(true);
});

// build all
gulp.task("build", [
    "build:js",
    "build:html",
    "build:fonts",
    "build:resources",
//    "build:mathjax",
    "build:css"
]);
gulp.task("build-dev", [
    "build:js-dev",
    "build:html-dev",
    "build:fonts",
    "build:resources",
    "build:css-dev"
]);

// watch
gulp.task("start-watching", function() {
    watching = true;
});
gulp.task("watch", ["start-watching", "build"], function() {
    b.on("update", bundleJsProd);
    gulp.watch(srcPattern("html"), ["build:html"]);
    gulp.watch(srcPattern("fonts"), ["build:fonts"]);
    gulp.watch(srcPattern("resources"), ["build:resources"]);
    gulp.watch(srcPattern("css"), ["build:css"]);
});
gulp.task("watch-dev", ["start-watching", "build-dev"], function() {
    b.on("update", bundleJsDev);
    gulp.watch(srcPattern("html"), ["build:html-dev"]);
    gulp.watch(srcPattern("fonts"), ["build:fonts"]);
    gulp.watch(srcPattern("resources"), ["build:resources"]);
    gulp.watch(srcPattern("css"), ["build:css-dev"]);
});

// serve
function serve(development) {
    browserSync.init({
        browser: process.platform === "darwin" ? "google chrome": "chromium-browser",
        server: {
            baseDir: "../"
        },
        startPath: "/vivliostyle.js/test/files/"
    });
    var target = [DEST_DIR + "/**/*"];
    if (development) {
        target.push(VIVLIOSTYLE_JS_SRC_DIR + "/**/*");
    }
    gulp.watch(target).on("change", browserSync.reload);
}
gulp.task("serve", ["watch"], function() {
    serve(false);
});
gulp.task("serve-dev", ["watch-dev"], function() {
    serve(true);
});

gulp.task("default", ["serve-dev"]);

// test
gulp.task("test-local", function(done) {
    var server = new KarmaServer({
        configFile: process.cwd() + "/test/conf/karma-local.conf"
    }, function(exitStatus) {
        done(exitStatus ? "Some tests failed" : undefined);
    });
    server.start();
});
gulp.task("test-sauce", function(done) {
    var server = new KarmaServer({
        configFile: process.cwd() + "/test/conf/karma-sauce.conf"
    }, function(exitStatus) {
        done(exitStatus ? "Some tests failed" : undefined);
    });
    server.start();
});
