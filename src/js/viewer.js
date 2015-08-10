import vivliostyle from "vivliostyle/build/vivliostyle.min.js";

function startViewer() {
    var config = {
        uaRoot: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport")
    };
    vivliostyle.viewerapp.main(config);
}

if(window["__loaded"])
    startViewer();
else
    window.onload = startViewer;
