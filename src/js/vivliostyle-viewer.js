"use strict";
import ko from "knockout";
import ViewerApp from "./viewmodels/viewer-app";

export default {
    start: function(vivliostyle) {
        function startViewer() {
            ko.applyBindings(new ViewerApp(vivliostyle));
        }

        if(window["__loaded"])
            startViewer();
        else
            window.onload = startViewer;
    }
};
