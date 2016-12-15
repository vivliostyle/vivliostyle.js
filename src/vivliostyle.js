/**
 * Copyright 2015 Vivliostyle Inc.
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
