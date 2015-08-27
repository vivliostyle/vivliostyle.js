import ko from "knockout";
import ViewerOptions from "../models/viewer-options";

function SettingsPanel(viewerOptions) {
    this.viewerOptions_ = viewerOptions;

    this.opened = ko.observable(false);
    this.state = {
        viewerOptions: new ViewerOptions(viewerOptions)
    };

    ["toggle", "apply", "reset"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

SettingsPanel.prototype.toggle = function() {
    this.opened(!this.opened());
};

SettingsPanel.prototype.apply = function() {
    this.viewerOptions_.copyFrom(this.state.viewerOptions);
};

SettingsPanel.prototype.reset = function() {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
};

export default SettingsPanel;
