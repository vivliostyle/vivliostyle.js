import ko from "knockout";
import ViewerOptions from "../models/viewer-options";
import PageSize from "../models/page-size";

function SettingsPanel(viewerOptions, documentOptions, viewer) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.opened = ko.observable(false);
    this.state = {
        viewerOptions: new ViewerOptions(viewerOptions),
        pageSize: new PageSize(documentOptions.pageSize)
    };

    ["toggle", "apply", "reset"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

SettingsPanel.prototype.toggle = function() {
    this.opened(!this.opened());
};

SettingsPanel.prototype.apply = function() {
    if (this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
        this.viewerOptions_.copyFrom(this.state.viewerOptions);
    } else {
        this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
        this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
    }
};

SettingsPanel.prototype.reset = function() {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
};

export default SettingsPanel;
