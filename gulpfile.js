"use strict";

var gulp = require("gulp");
var browserSync = require('browser-sync');
var changed = require("gulp-changed");
var compass = require("gulp-compass");
var path = require("path");
var plumber = require("gulp-plumber");
var notify = require("gulp-notify");

var SRC_FILES = {
    html: "src/html/*",
    fonts: "src/fonts/*",
    scss: "src/scss/*.scss"
};

var serving = false;

function reload(stream) {
    if (serving) {
        stream.pipe(browserSync.reload({stream: true}));
    }
}

function copyTask(name, dest) {
    dest = "build/" + dest;
    return gulp.task("build:" + name, function() {
        reload(
            gulp.src(SRC_FILES[name])
                .pipe(changed(dest))
                .pipe(gulp.dest(dest))
        );
    });
}

// HTML files are copied to the root
copyTask("html", "");
copyTask("fonts", "fonts");

gulp.task("build:css", function() {
    reload(
        gulp.src(SRC_FILES["scss"])
            .pipe(plumber({
                errorHandler: notify.onError("Error: <%= error.message %>")
            }))
            .pipe(compass({
                config_file: "src/config.rb",
                css: path.resolve("build/css"),
                sass: path.resolve("src/scss")
            }))
    );
});

gulp.task("build", [
    "build:html",
    "build:fonts",
    "build:css"
]);

gulp.task("watch", ["build"], function() {
    gulp.watch(SRC_FILES["html"], ["build:html"]);
    gulp.watch(SRC_FILES["fonts"], ["build:fonts"]);
    gulp.watch(SRC_FILES["scss"], ["build:css"]);
});

gulp.task("serve", ["watch"], function() {
    browserSync({
        server: {
            baseDir: "build"
        },
        startPath: "/vivliostyle-viewer.xhtml"
    });
});

gulp.task("default", ["watch"]);
