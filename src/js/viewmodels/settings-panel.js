import ko from "knockout";
import ViewerOptions from "../models/viewer-options";
import PageSize from "../models/page-size";
import {Keys} from "../utils/key-util";

function SettingsPanel(viewerOptions, documentOptions, viewer) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.opened = ko.observable(false);
    this.state = {
        viewerOptions: new ViewerOptions(viewerOptions),
        pageSize: new PageSize(documentOptions.pageSize)
    };

    ["close", "toggle", "apply", "reset"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

SettingsPanel.prototype.close = function() {
    this.opened(false);
};

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
    this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
};

SettingsPanel.prototype.handleKey = function(key) {
    switch (key) {
        case Keys.Escape:
            this.close();
            return true;
        default:
            return true;
    }
};

export default SettingsPanel;
