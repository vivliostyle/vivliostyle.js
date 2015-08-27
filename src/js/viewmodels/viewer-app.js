import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import Viewer from "./viewer";
import Navigation from "./navigation";

function ViewerApp(vivliostyle) {
    this.documentOptions = new DocumentOptions();
    this.viewerOptions = new ViewerOptions();
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport")
    };
    this.viewer = new Viewer(vivliostyle, this.viewerSettings, this.viewerOptions);
    this.navigation = new Navigation(this.viewerOptions, this.viewer);

    this.setupActions();

    this.viewer.loadDocument(this.documentOptions.url(), this.documentOptions.toObject());
}

ViewerApp.prototype.setupActions = function() {
    var viewerState = this.viewer.state;
    viewerState.cfi.subscribe(function(cfi) {
        this.documentOptions.fragment(cfi);
    }, this);
};

export default ViewerApp;
