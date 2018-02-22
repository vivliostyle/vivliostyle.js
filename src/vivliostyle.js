/**
 * Copyright 2015 Trim-marks Inc.
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
(function() {
    "use strict";

    function getRootPathAndScriptTag(rootScriptName) {
        var pattern = new RegExp("/src/" + rootScriptName + "$");
        var scriptTags = document.getElementsByTagName("script");
        for (var i = 0; i < scriptTags.length; i++) {
            var tag = scriptTags[i];
            var src = tag.src;
            if (src.match(pattern)) {
                var base = src.replace(pattern, "/");
                return {
                    path: base +  "src/",
                    commonJsModuleBasePath: base,
                    tag: tag
                };
            }
        }
        throw new Error("Cannot find a script tag for " + rootScriptName);
    }

    // An emulation of nodejs require (only for internal modules).
    var m = window.module = {};
    window.require = function(name) {
        if (m[name]) {
            return m[name];
        }
        throw new Error("module '" + name + "' not found!");
    };

    var pathAndTag = getRootPathAndScriptTag("vivliostyle.js");

    function loadScript(relativePath) {
        document.write("<script src='" + pathAndTag.path + relativePath + "' type='text/javascript'></script>");
    }
    function loadCommonJsModule(relativePath) {
        document.write("<script src='" + pathAndTag.commonJsModuleBasePath
            + relativePath + "' type='text/javascript'></script>"
            + "<script type='text/javascript'>"
            + "var moduleName = \"" + relativePath.replace(/\.[a-zA-Z0-9]*$/, '') + "\";"
            + "module[moduleName] = module.exports;"
            + "</script>");
    }

    window.vivliostyleCallback = function(scriptPaths, commonJsModulePaths) {
        commonJsModulePaths.forEach(loadCommonJsModule);
        scriptPaths.forEach(loadScript);
    };
    loadScript("source-list.js");
})();
