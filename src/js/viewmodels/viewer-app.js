import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import Viewer from "./viewer";
import Navigation from "./navigation";
import SettingsPanel from "./settings-panel";
import keyUtil from "../utils/key-util";

function ViewerApp(vivliostyle) {
    this.documentOptions = new DocumentOptions();
    this.viewerOptions = new ViewerOptions();
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport")
    };
    this.viewer = new Viewer(vivliostyle, this.viewerSettings, this.viewerOptions);
    this.settingsPanel = new SettingsPanel(this.viewerOptions, this.documentOptions, this.viewer);
    this.navigation = new Navigation(this.viewerOptions, this.viewer, this.settingsPanel);

    this.handleKey = function(data, event) {
        var key = keyUtil.identifyKeyFromEvent(event);
        var ret = this.settingsPanel.handleKey(key);
        if (ret) {
            ret = this.navigation.handleKey(key);
        }
        return ret;
    }.bind(this);

    this.viewer.loadDocument(this.documentOptions);
}

export default ViewerApp;
