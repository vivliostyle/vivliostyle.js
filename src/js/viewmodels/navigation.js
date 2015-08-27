function Navigation(viewer) {
    this.viewer = viewer;

    ["navigateToLeft", "navigateToRight"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Navigation.prototype.navigateToLeft = function() {
    this.viewer.navigateToLeft();
};

Navigation.prototype.navigateToRight = function() {
    this.viewer.navigateToRight();
};

export default Navigation;
