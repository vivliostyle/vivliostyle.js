/**
 * Copyright 2015 Vivliostyle Inc.
 */
(function() {
    "use strict";

    var list = [
        "debug-param.js",

        "closure/goog/base.js",
        "closure/goog/debug/error.js",
        "closure/goog/dom/nodetype.js",
        "closure/goog/string/string.js",
        "closure/goog/asserts/asserts.js",

        "vivliostyle/namespace.js",
        "vivliostyle/constants.js",
        "vivliostyle/util.js",
        "vivliostyle/logical.js",
        "adapt/base.js",
        "adapt/sha1.js",
        "adapt/geom.js",
        "adapt/task.js",
        "adapt/taskutil.js",
        "adapt/net.js",
        "adapt/xmldoc.js",
        "adapt/expr.js",
        "adapt/css.js",
        "adapt/csstok.js",
        "adapt/cssparse.js",
        "adapt/cssvalid.js",
        "adapt/cssprop.js",
        "adapt/csscasc.js",
        "adapt/vtree.js",
        "vivliostyle/sizing.js",
        "adapt/cssstyler.js",
        "adapt/font.js",
        "adapt/pm.js",
        "vivliostyle/pagefloat.js",
        "adapt/vgen.js",
        "adapt/layout.js",
        "vivliostyle/page.js",
        "adapt/ops.js",
        "adapt/cfi.js",
        "adapt/toc.js",
        "adapt/epub.js",
        "adapt/devel.js",
        "adapt/viewer.js",
        "vivliostyle/viewer.js"
    ];

    if (typeof window === "object" && typeof window.vivliostyleCallback === "function") {
        window.vivliostyleCallback(list);
    }

    if (typeof module === "object" && module.exports) {
        module.exports = list;
    }
})();
