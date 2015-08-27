import ko from "knockout";

function Viewer(vivliostyle, viewerSettings, opt_viewerOptions) {
    this.viewer_ = new vivliostyle.viewer.Viewer(viewerSettings, opt_viewerOptions);
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
    this.viewer_.addListener("loaded", function() {
        this.state.pageProgression(this.viewer_.getCurrentPageProgression());
        this.state.status("complete");
    }.bind(this));
    this.viewer_.addListener("nav", function(payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.state.cfi(cfi);
        }
    }.bind(this));
};

Viewer.prototype.loadDocument = function(url, opt_documentOptions) {
    this.viewer_.loadDocument(url, opt_documentOptions);
};

Viewer.prototype.navigateToLeft = function() {
    this.viewer_.navigateToPage("left");
};

Viewer.prototype.navigateToRight = function() {
    this.viewer_.navigateToPage("right");
};

export default Viewer;
