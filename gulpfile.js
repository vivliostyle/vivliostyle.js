"use strict";

var babelify = require("babelify");
var browserify = require("browserify");
var browserSync = require('browser-sync').create();
var changed = require("gulp-changed");
var compass = require("gulp-compass");
var gulp = require("gulp");
var gutil = require("gulp-util");
var notify = require("gulp-notify");
var path = require("path");
var plumber = require("gulp-plumber");
var source = require("vinyl-source-stream");
var watchify = require("watchify");

// Parameters
var SRC_DIR = "src";
var DEST_DIR = "build";
var DIRS = {
    fonts: {src: "fonts"},
    html: {src: "html", dest: ""},
    js: {src: "js"},
    css: {src: "scss", dest: "css", srcPattern: "*.scss"}
};
var JS_ENTRY_FILE = "viewer.js";
var SERVER_START_PATH = "/build/vivliostyle-viewer.html#x=/test/empty.html";

// Utility functions
function srcDir(type) {
    return SRC_DIR + "/" + DIRS[type].src;
}
function destDir(type) {
    var dirs = DIRS[type];
    return DEST_DIR + "/" + (dirs.dest || dirs.src);
}
function srcPattern(type) {
    return SRC_DIR + "/" + DIRS[type].src + "/" + (DIRS[type].srcPattern || "*");
}

// JS build
var b = watchify(browserify({
    cache: {},
    packageCache: {},
    entries: [srcDir("js") + "/" + JS_ENTRY_FILE],
    transform: [babelify]
}));
function bundleJs() {
    return b.bundle()
        .on("error", gutil.log.bind(gutil, "Browserify Error"))
        .pipe(source(JS_ENTRY_FILE))
        .pipe(gulp.dest(destDir("js")));
}
gulp.task("build:js", bundleJs);
b.on("log", gutil.log);

// create a task simply copying files
function copyTask(type) {
    var dest = destDir(type);
    return gulp.task("build:" + type, function() {
        gulp.src(srcPattern(type))
            .pipe(changed(dest))
            .pipe(gulp.dest(dest));
    });
}
copyTask("html");
copyTask("fonts");

// CSS build
gulp.task("build:css", function() {
    gulp.src(srcPattern("css"))
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(compass({
            config_file: SRC_DIR + "/config.rb",
            css: path.resolve(destDir("css")),
            sass: path.resolve(srcDir("css"))
        }));
});

// build all
gulp.task("build", [
    "build:js",
    "build:html",
    "build:fonts",
    "build:css"
]);

// watch all
gulp.task("watch", ["build"], function() {
    b.on("update", bundleJs);
    gulp.watch(srcPattern("html"), ["build:html"]);
    gulp.watch(srcPattern("fonts"), ["build:fonts"]);
    gulp.watch(srcPattern("css"), ["build:css"]);
});

// serve
gulp.task("serve", ["watch"], function() {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        startPath: SERVER_START_PATH
    });
    gulp.watch(DEST_DIR + "/**/*").on("change", browserSync.reload);
});

gulp.task("default", ["watch"]);
