export default {
    start: function(vivliostyle) {
        "use strict";
        function startViewer() {
            var viewerSettings = {
                userAgentRootURL: "resources/",
                viewportElement: document.getElementById("vivliostyle-viewer-viewport")
            };
            var viewer = new vivliostyle.viewer.Viewer(viewerSettings);
            viewer.loadDocument("/test/test.html");
        }

        if(window["__loaded"])
            startViewer();
        else
            window.onload = startViewer;
    }
};
