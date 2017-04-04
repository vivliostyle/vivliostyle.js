/**
 * Copyright 2015 Vivliostyle Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
/*eslint-env node */
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
        "vivliostyle/logging.js",
        "vivliostyle/profile.js",
        "vivliostyle/constants.js",
        "vivliostyle/util.js",
        "vivliostyle/diff.js",
        "vivliostyle/urls.js",
        "vivliostyle/plugin.js",
        "vivliostyle/logical.js",
        "vivliostyle/selectors.js",
        "adapt/base.js",
        "adapt/sha1.js",
        "adapt/geom.js",
        "adapt/task.js",
        "adapt/taskutil.js",
        "adapt/net.js",
        "adapt/xmldoc.js",
        "adapt/expr.js",
        "adapt/css.js",
        "vivliostyle/display.js",
        "vivliostyle/break.js",
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
        "vivliostyle/layoututil.js",
        "vivliostyle/table.js",
        "vivliostyle/page.js",
        "vivliostyle/counters.js",
        "adapt/ops.js",
        "adapt/cfi.js",
        "adapt/toc.js",
        "adapt/epub.js",
        "adapt/viewer.js",
        "vivliostyle/viewer.js"
    ];

    var commonJsModuleList = [
        "node_modules/fast-diff/diff.js"
    ];

    if (typeof window === "object" && typeof window.vivliostyleCallback === "function") {
        window.vivliostyleCallback(list, commonJsModuleList);
    }

    if (typeof module === "object" && module.exports) {
        module.exports = {
            list: list,
            commonJsModuleList: commonJsModuleList
        };
    }
})();
