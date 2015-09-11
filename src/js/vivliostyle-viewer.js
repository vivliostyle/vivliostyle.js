import ko from "knockout";
import menuButtonBinding from "./bindings/menuButton.js";
import ViewerApp from "./viewmodels/viewer-app";

export default {
    start: function() {
        function startViewer() {
            ko.applyBindings(new ViewerApp());
        }

        if(window["__loaded"])
            startViewer();
        else
            window.onload = startViewer;
    }
};
