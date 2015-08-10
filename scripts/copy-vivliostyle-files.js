"use strict";

var fs = require("fs-extra");
var path = require("path");

var BUILD_DIR = "build";
var RES_DIR = "resources";
var SRC_DIR = path.join("node_modules", "vivliostyle");
var JS_LIB_DIR = path.join(BUILD_DIR, "js", "lib");
var JS_FILENAME = "vivliostyle.min.js";

fs.ensureDirSync(JS_LIB_DIR);
fs.copySync(path.join(SRC_DIR, BUILD_DIR, JS_FILENAME), path.join(JS_LIB_DIR, JS_FILENAME));
fs.copySync(path.join(SRC_DIR, RES_DIR), path.join(BUILD_DIR, RES_DIR));
