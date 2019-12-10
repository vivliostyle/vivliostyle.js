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
            "pageViewMode": "singlePage"
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
