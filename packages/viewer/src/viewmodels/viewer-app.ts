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

import Vivliostyle from "../vivliostyle";

import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import messageQueue from "../models/message-queue";
import Viewer, { ViewerSettings } from "./viewer";
import Navigation from "./navigation";
import SettingsPanel from "./settings-panel";
import MessageDialog from "./message-dialog";
import urlParameters from "../stores/url-parameters";
import keyUtil from "../utils/key-util";
import stringUtil from "../utils/string-util";

class ViewerApp {
  documentOptions: DocumentOptions;
  viewerOptions: ViewerOptions;
  isDebug: boolean;
  viewerSettings: ViewerSettings;
  viewer: Viewer;
  messageDialog: MessageDialog;
  settingsPanel: SettingsPanel;
  navigation: Navigation;

  constructor() {
    const flags =
      (document.documentElement.getAttribute("data-vivliostyle-viewer-flags") ||
        "") + (urlParameters.getParameter("flags")[0] || "");
    const disableSettings = flags.includes("s");
    const settingsPanelOptions = {
      disablePageStyleChange: disableSettings || flags.includes("g"),
      disablePageViewModeChange: disableSettings || flags.includes("v"),
      disableBookModeChange: disableSettings || flags.includes("b"),
      disableRenderAllPagesChange: disableSettings || flags.includes("a"),
    };
    const navigationOptions = {
      disableTOCNavigation: flags.includes("t"),
      disablePageNavigation: flags.includes("n"),
      disableZoom: flags.includes("z"),
      disableFontSizeChange: flags.includes("f"),
    };
    const disableContextMenu = flags.includes("c");
    const disablePrint = flags.includes("p");

    if (disableSettings) {
      const welcome: HTMLElement = document.getElementById(
        "vivliostyle-welcome",
      );
      if (welcome) {
        welcome.remove();
      }
      const menuDetail: HTMLElement = document.querySelector(
        ".vivliostyle-menu-detail",
      );
      const menuDetailMain: HTMLElement = document.querySelector(
        ".vivliostyle-menu-detail-main",
      );
      if (menuDetail && menuDetailMain) {
        menuDetailMain.style.visibility = "hidden";
        menuDetail.style.height = "auto";
      }
    }
    if (disableContextMenu) {
      document.oncontextmenu = (): boolean => false;
    }
    if (disablePrint) {
      const printStyle = document.createElement("style");
      printStyle.setAttribute("media", "print");
      printStyle.textContent = "*{display:none}";
      document.head.appendChild(printStyle);
    }

    this.documentOptions = new DocumentOptions();
    this.viewerOptions = new ViewerOptions();

    this.documentOptions.pageStyle.setViewerFontSizeObservable(
      this.viewerOptions.fontSize,
    );

    if (this.viewerOptions.profile()) {
      Vivliostyle.profiler.enable();
    }
    this.isDebug = urlParameters.getParameter("debug")[0] === "true";
    this.viewerSettings = {
      userAgentRootURL: `${urlParameters.getBaseURL()}resources/`,
      viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
      debug: this.isDebug,
    };

    // Replace deprecated "b" and "x" to "src" & "bookMode"
    const srcUrls = urlParameters.getParameter("src");
    const bUrls = urlParameters.getParameter("b"); // (deprecated) => src & bookMode=true & renderAllPages=false
    const xUrls = urlParameters.getParameter("x"); // (deprecated) => src
    if (!srcUrls.length) {
      if (bUrls.length) {
        urlParameters.setParameter("src", bUrls[0]);
        urlParameters.setParameter("bookMode", "true");
        if (!urlParameters.hasParameter("renderAllPages")) {
          urlParameters.setParameter("renderAllPages", "false");
        }
      } else if (xUrls.length) {
        xUrls.forEach((x, i) => {
          urlParameters.setParameter("src", x, i);
        });
      }
    }
    // Remove redundant or ineffective URL parameters
    urlParameters.removeParameter("b");
    urlParameters.removeParameter("x");
    urlParameters.removeParameter("f", true); // only first one is effective
    urlParameters.removeParameter("spread", true);
    urlParameters.removeParameter("bookMode", true);
    urlParameters.removeParameter("renderAllPages", true);
    urlParameters.removeParameter("fontSize", true);
    urlParameters.removeParameter("profile", true);
    urlParameters.removeParameter("debug", true);
    urlParameters.removeParameter("flags", true);

    this.viewer = new Viewer(this.viewerSettings, this.viewerOptions);

    this.viewer.inputUrl.subscribe((inputUrl: string) => {
      if (inputUrl != "") {
        if (!urlParameters.hasParameter("src")) {
          // Push current URL to browser history to enable to go back here when browser Back button is clicked.
          if (urlParameters.history.pushState)
            urlParameters.history.pushState(null, "");
        }
        if (inputUrl.startsWith("<")) {
          // seems start tag, so convert to data url
          inputUrl = "data:," + stringUtil.percentEncodeForDataURI(inputUrl);
        } else {
          inputUrl = stringUtil.percentEncodeAmpersandAndUnencodedPercent(
            inputUrl,
          );
        }
        urlParameters.setParameter("src", inputUrl);
        this.documentOptions.srcUrls(urlParameters.getParameter("src"));
      } else {
        urlParameters.removeParameter("src");
      }
    });

    this.messageDialog = new MessageDialog(messageQueue);

    this.settingsPanel = new SettingsPanel(
      this.viewerOptions,
      this.documentOptions,
      this.viewer,
      this.messageDialog,
      settingsPanelOptions,
    );

    this.navigation = new Navigation(
      this.viewerOptions,
      this.viewer,
      this.settingsPanel,
      navigationOptions,
    );

    this.viewer.loadDocument(this.documentOptions);

    window.onhashchange = (): void => {
      if (window.location.href != urlParameters.storedUrl) {
        // Reload when address bar change is detected
        window.location.reload();
      }
    };
  }

  handleKey(data: ViewerApp, event: KeyboardEvent): boolean {
    const key = keyUtil.identifyKeyFromEvent(event);
    if (document.activeElement.id === "vivliostyle-input-url") {
      if (key === "Enter" && event.keyCode === 13) {
        this.viewer.loadDocument(this.documentOptions);
        return false;
      }
      return true;
    }
    if (
      (!(key === "Home" || key === "End") &&
        (event.ctrlKey || event.metaKey)) ||
      event.altKey ||
      event.shiftKey
    ) {
      return true;
    }
    let ret = this.settingsPanel.handleKey(key);
    if (ret) {
      ret = this.navigation.handleKey(key);
    }
    return ret;
  }
}

export default ViewerApp;
