"use strict";
import ko from "knockout";

function Viewer(vivliostyle, viewerSettings, opt_viewerOptions) {
    this.viewer = new vivliostyle.viewer.Viewer(viewerSettings, opt_viewerOptions);
    this.state = {
        cfi: ko.observable(""),
        status: ko.observable("loading"),
        pageProgression: ko.observable(vivliostyle.constants.LTR)
    };

    this.setupViewerEventHandler();

    ["navigateToLeft", "navigateToRight"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Viewer.prototype.setupViewerEventHandler = function() {
    this.viewer.addListener("loaded", function() {
        this.state.pageProgression(this.viewer.getCurrentPageProgression());
        this.state.status("complete");
    }.bind(this));
    this.viewer.addListener("nav", function(payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.state.cfi(cfi);
        }
    }.bind(this));
};

Viewer.prototype.loadDocument = function(url, opt_documentOptions) {
    this.viewer.loadDocument(url, opt_documentOptions);
};

Viewer.prototype.navigateToLeft = function() {
    this.viewer.navigateToPage("left");
};

Viewer.prototype.navigateToRight = function() {
    this.viewer.navigateToPage("right");
};

export default Viewer;
