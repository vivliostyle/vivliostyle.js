"use strict";

var gulp = require("gulp");
var compass = require("gulp-compass");
var path = require("path");
var plumber = require("gulp-plumber");
var notify = require("gulp-notify");

var SCSS_FILES = "res-dev/scss/*.scss";

gulp.task("default", ["watch"]);

gulp.task("watch", function() {
    gulp.watch(SCSS_FILES, ["build:css"]);
});

gulp.task("build:css", function() {
    gulp.src(SCSS_FILES)
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(compass({
            config_file: "res-dev/config.rb",
            css: path.resolve("res/css"),
            sass: path.resolve("res-dev/scss")
        }));
});
