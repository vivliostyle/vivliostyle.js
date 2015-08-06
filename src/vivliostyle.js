/**
 * Copyright 2015 Vivliostyle Inc.
 */

CLOSURE_NO_DEPS = true;

(function() {
    "use strict";

    function getRootPathAndScriptTag(rootScriptName) {
        var pattern = new RegExp("/" + rootScriptName + "$");
        var scriptTags = document.getElementsByTagName("script");
        for (var i = 0; i < scriptTags.length; i++) {
            var tag = scriptTags[i];
            var src = tag.src;
            if (src.match(pattern)) {
                return {
                    path: src.replace(pattern, "/"),
                    tag: tag
                };
            }
        }
        throw new Error("Cannot find a script tag for " + rootScriptName);
    }

    var pathAndTag = getRootPathAndScriptTag("vivliostyle.js");

    function loadScript(relativePath) {
        document.write("<script src='" + pathAndTag.path + relativePath + "' type='text/javascript'></script>");
    }

    window.vivliostyleCallback = function(scriptPaths) {
        scriptPaths.forEach(loadScript);
    };
    loadScript("source-list.js");
})();
