"use strict";

var browserSync = require("browser-sync").create();
var changed = require("gulp-changed");
var sass = require("gulp-sass");
var ejs = require("gulp-ejs");
var fs = require("fs");
var gulp = require("gulp");
var KarmaServer = require("karma").Server;
var notify = require("gulp-notify");
var path = require("path");
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");

sass.compiler = require("node-sass");

// Parameters
var SRC_DIR = "src";
var DEST_DIR = "build";
var DIRS = {
    fonts: { src: "fonts" },
    html: { src: "html", dest: "", srcPattern: "*.ejs" },
    css: { src: "scss", dest: "css", srcPattern: "*.scss" },
    resources: {
        src: "../node_modules/vivliostyle/resources",
        dest: "resources"
    },
    mathjax: { src: "../node_modules/mathjax", dest: "mathjax" },
    plugin_resources: {
        src: "../node_modules/vivliostyle/plugins/*/resources",
        dest: "plugins"
    }
};
var VIVLIOSTYLE_JS_SRC_DIR = "node_modules/vivliostyle/src";
var HTML_FILENAMES = {
    production: "vivliostyle-viewer.html",
    development: "vivliostyle-viewer-dev.html"
};

function getVersion(basePath) {
    var version = JSON.parse(fs.readFileSync(basePath + "package.json", "utf8")).version;
    return version.replace(/\.0$/, "");
}
var versions = {
    core: getVersion("node_modules/vivliostyle/"),
    ui: getVersion("")
};

// Utility functions
function destDir(type) {
    var dirs = DIRS[type];
    return DEST_DIR + "/" + (typeof dirs.dest === "string" ? dirs.dest : dirs.src);
}
function srcPattern(type) {
    return SRC_DIR + "/" + DIRS[type].src + "/" + (DIRS[type].srcPattern || "**/*");
}

// create a task simply copying files
function copyTask(type) {
    var dest = destDir(type);
    return gulp.task("build:" + type, function() {
        return gulp
            .src(srcPattern(type))
            .pipe(changed(dest))
            .pipe(gulp.dest(dest));
    });
}
copyTask("fonts");
copyTask("resources");
copyTask("mathjax");
copyTask("plugin_resources");

// HTML build
function buildHtml(development) {
    return gulp
        .src(srcPattern("html"))
        .pipe(ejs({ development: development, versions: versions }))
        .pipe(
            plumber({
                errorHandler: notify.onError("Error: <%= error.message %>")
            })
        )
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
    return gulp
        .src(srcPattern("css"))
        .pipe(
            plumber({
                errorHandler: notify.onError("Error: <%= error.message %>")
            })
        )
        .pipe(
            sass({
                outputStyle: development ? "expanded" : "compressed"
            }).on("error", sass.logError)
        )
        .pipe(gulp.dest(path.resolve(destDir("css"))));
}
gulp.task("build:css", function() {
    return buildCss(false);
});
gulp.task("build:css-dev", function() {
    return buildCss(true);
});

// build all
gulp.task("build", gulp.parallel("build:html", "build:fonts", "build:resources", "build:plugin_resources", "build:css"));
gulp.task("build-dev", gulp.parallel("build:html-dev", "build:fonts", "build:resources", "build:plugin_resources", "build:css-dev"));

// watch
gulp.task("start-watching", function(done) {
    done();
});
gulp.task(
    "watch",
    gulp.series(gulp.parallel("start-watching", "build"), function(done) {
        gulp.watch(srcPattern("html"), gulp.task("build:html"));
        gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
        gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
        gulp.watch(srcPattern("plugin_resources"), gulp.task("build:plugin_resources"));
        gulp.watch(srcPattern("css"), gulp.task("build:css"));
        done();
    })
);
gulp.task(
    "watch-dev",
    gulp.series(gulp.parallel("start-watching", "build-dev"), function(done) {
        gulp.watch(srcPattern("html"), gulp.task("build:html-dev"));
        gulp.watch(srcPattern("fonts"), gulp.task("build:fonts"));
        gulp.watch(srcPattern("resources"), gulp.task("build:resources"));
        gulp.watch(srcPattern("plugin_resources"), gulp.task("build:plugin_resources"));
        gulp.watch(srcPattern("css"), gulp.task("build:css-dev"));
        done();
    })
);

// serve
function serve(development) {
    browserSync.init({
        browser:
            process.platform === "darwin"
                ? "google chrome"
                : process.platform === "win32"
                ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
                : "chromium-browser",
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
gulp.task(
    "serve",
    gulp.series("watch", function(done) {
        serve(false);
        done();
    })
);
gulp.task(
    "serve-dev",
    gulp.series("watch-dev", function(done) {
        serve(true);
        done();
    })
);

gulp.task("default", gulp.task("serve-dev"));

// test
gulp.task("test-local", function(done) {
    var server = new KarmaServer(
        {
            configFile: process.cwd() + "/test/conf/karma-local.conf"
        },
        function(exitStatus) {
            done(exitStatus ? "Some tests failed" : undefined);
        }
    );
    server.start();
});
gulp.task("test-sauce", function(done) {
    var server = new KarmaServer(
        {
            configFile: process.cwd() + "/test/conf/karma-sauce.conf"
        },
        function(exitStatus) {
            done(exitStatus ? "Some tests failed" : undefined);
        }
    );
    server.start();
});
