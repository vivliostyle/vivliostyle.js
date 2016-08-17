/**
 * Copyright 2015 Vivliostyle Inc.
 */
(function() {
    function getURLParams() {
        var params = {};
        var r = /([^=]+)=(.*)/;
        var a = window.location.search.substring(1).split("&");
        a.forEach(function(pair) {
            var m = pair.match(r);
            if (m) {
                params[m[1]] = m[2];
            }
        });
        return params;
    }

    function callback(msg) {
        switch (msg["t"]) {
            case "loaded":
                document.documentElement.classList.remove("reftest-wait");
                break;
        }
    }

    function main(arg) {
        var params = getURLParams();
        var docURL = params["x"];
        var uaRoot = (arg && arg["uaRoot"]) || null;

        var config = {
            "a": "loadXML",
            "url": [{"url": docURL, "startPage": null, "skipPagesBefore": null}],
            "autoresize": false,
            "fragment": null,
            "renderAllPages": true,
            "userAgentRootURL": uaRoot,
            "spreadView": false
        };

        var viewer = new adapt.viewer.Viewer(window, arg["viewportElement"], "main", callback);
        viewer.initEmbed(config);
    }

    function startViewer() {
        var config = {
            viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
            uaRoot: "../../resources/"
        };
        main(config);
    }

    if (window["__loaded"])
        startViewer();
    else
        window.onload = startViewer;
})();
