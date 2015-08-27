function Navigation(viewerOptions, viewer) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;

    ["navigateToLeft", "navigateToRight", "increaseFontSize", "decreaseFontSize"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Navigation.prototype.navigateToLeft = function() {
    this.viewer_.navigateToLeft();
};

Navigation.prototype.navigateToRight = function() {
    this.viewer_.navigateToRight();
};

Navigation.prototype.increaseFontSize = function() {
    var fontSize = this.viewerOptions_.fontSize();
    this.viewerOptions_.fontSize(fontSize * 1.25);
};

Navigation.prototype.decreaseFontSize = function() {
    var fontSize = this.viewerOptions_.fontSize();
    this.viewerOptions_.fontSize(fontSize * 0.8);
};

export default Navigation;
