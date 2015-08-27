import ko from "knockout";

function Navigation(viewerOptions, viewer) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;

    this.isDisabled = ko.pureComputed(function() {
        return !this.viewer_.state.navigatable();
    }, this);
    this.isNavigateToLeftDisabled = this.isDisabled;
    this.isNavigateToRightDisabled = this.isDisabled;
    this.isZoomOutDisabled = this.isDisabled;
    this.isZoomInDisabled = this.isDisabled;
    this.isZoomDefaultDisabled = this.isDisabled;
    this.isIncreaseFontSizeDisabled = this.isDisabled;
    this.isDecreaseFontSizeDisabled = this.isDisabled;

    ["navigateToLeft", "navigateToRight", "increaseFontSize", "decreaseFontSize"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Navigation.prototype.navigateToLeft = function() {
    if (!this.isNavigateToLeftDisabled()) {
        this.viewer_.navigateToLeft();
    }
};

Navigation.prototype.navigateToRight = function() {
    if (!this.isNavigateToRightDisabled()) {
    this.viewer_.navigateToRight();
    }
};

Navigation.prototype.increaseFontSize = function() {
    if (!this.isIncreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 1.25);
    }
};

Navigation.prototype.decreaseFontSize = function() {
    if (!this.isDecreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 0.8);
    }
};

export default Navigation;
