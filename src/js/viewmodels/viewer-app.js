/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import vivliostyle from "../models/vivliostyle";
import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import messageQueue from "../models/message-queue";
import Viewer from "./viewer";
import Navigation from "./navigation";
import SettingsPanel from "./settings-panel";
import MessageDialog from "./message-dialog";
import keyUtil from "../utils/key-util";
import stringUtil from "../utils/string-util";
import urlParameters from "../stores/url-parameters";

function ViewerApp() {
    this.documentOptions = new DocumentOptions();
    this.viewerOptions = new ViewerOptions();

    this.documentOptions.pageStyle.setViewerFontSizeObservable(this.viewerOptions.fontSize);

    if (this.viewerOptions.profile()) {
        vivliostyle.profile.profiler.enable();
    }
    this.isDebug = urlParameters.getParameter("debug")[0] === "true";
    this.viewerSettings = {
        userAgentRootURL: `${urlParameters.getBaseURL()}resources/`,
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: this.isDebug
    };

    // Remove redundant or ineffective URL parameters
    if (urlParameters.getParameter("b")[0]) {
        urlParameters.removeParameter("b", true);   // only first one is effective
        urlParameters.removeParameter("x");         // x= is ineffective when b= is given
    }
    urlParameters.removeParameter("f", true);       // only first one is effective
    urlParameters.removeParameter("spread", true);
    urlParameters.removeParameter("renderAllPages", true);
    urlParameters.removeParameter("fontSize", true);
    urlParameters.removeParameter("profile", true);
    urlParameters.removeParameter("debug", true);

    this.viewer = new Viewer(this.viewerSettings, this.viewerOptions);

    this.viewer.inputUrl.subscribe(inputUrl => {
        if (inputUrl != "") {
            if (!urlParameters.hasParameter("b")) {
                // Push current URL to browser history to enable to go back here when browser Back button is clicked.
                if (urlParameters.history.pushState)
                    urlParameters.history.pushState(null, "");
            }
            if (inputUrl.startsWith("<")) {
                // seems start tag, so convert to data url
                inputUrl = "data:," + encodeURI(inputUrl);
            } else {
                inputUrl = stringUtil.percentEncodeAmpersandAndUnencodedPercent(inputUrl);
            }
            urlParameters.setParameter("b", inputUrl, true);
        } else {
            urlParameters.removeParameter("b");
        }
    });

    this.messageDialog = new MessageDialog(messageQueue);

    const settingsPanelOptions = {
        disablePageStyleChange: false,
        disablePageViewModeChange: false,
        disableRenderAllPagesChange: false
    };

    this.settingsPanel = new SettingsPanel(this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog,
        settingsPanelOptions);

    const navigationOptions = {
        disableTOCNavigation: false,
        disablePageNavigation: false,
        disableZoom: false,
        disableFontSizeChange: false
    };

    this.navigation = new Navigation(this.viewerOptions, this.viewer, this.settingsPanel, navigationOptions);

    this.handleKey = (data, event) => {
        const key = keyUtil.identifyKeyFromEvent(event);
        if (document.activeElement.id === "vivliostyle-input-url") {
            if (key === "Enter" && event.keyCode === 13) {
                this.documentOptions.bookUrl(urlParameters.getParameter("b", true)[0]);
                this.viewer.loadDocument(this.documentOptions);
                return false;
            }
            return true;
        }
        if (!(key === "Home" || key === "End") && (event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
            return true;
        }
        let ret = this.settingsPanel.handleKey(key);
        if (ret) {
            ret = this.navigation.handleKey(key);
        }
        return ret;
    };

    this.viewer.loadDocument(this.documentOptions);

    window.onhashchange = () => {
        if (window.location.href != urlParameters.storedUrl) {
            // Reload when address bar change is detected
            window.location.reload();
        }
    };
}

export default ViewerApp;
