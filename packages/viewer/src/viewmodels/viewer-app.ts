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

import { t } from "i18next";
import Vivliostyle from "../vivliostyle";
import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import messageQueue from "../models/message-queue";
import Viewer, { ViewerSettings } from "./viewer";
import Navigation from "./navigation";
import SettingsPanel from "./settings-panel";
import FindBox from "./find-box";
import MessageDialog from "./message-dialog";
import urlParameters from "../stores/url-parameters";
import keyUtil from "../utils/key-util";
import stringUtil from "../utils/string-util";
import {
  marksStore,
  MarksStoreFacade,
  MarksMenuStatus,
  MarksBox,
} from "./marks-store";

const { Keys } = keyUtil;

class ViewerApp {
  documentOptions: DocumentOptions;
  viewerOptions: ViewerOptions;
  isDebug: boolean;
  viewerSettings: ViewerSettings;
  viewer: Viewer;
  messageDialog: MessageDialog;
  settingsPanel: SettingsPanel;
  navigation: Navigation;
  findBox: FindBox;
  marksStore: MarksStoreFacade;
  marksMenuStatus: MarksMenuStatus;
  marksBox: MarksBox;
  t = t;

  constructor() {
    // Configuration flags
    const flags = []
      .concat(
        document.documentElement.getAttribute(
          "data-vivliostyle-viewer-flags",
        ) ?? [],
        urlParameters.getParameter("flags"),
      )
      .join();
    const disableSettings = flags.includes("S");
    const settingsPanelOptions = {
      disablePageStyleChange: disableSettings || flags.includes("P"),
      disablePageViewModeChange: disableSettings || flags.includes("V"),
      disableBookModeChange: disableSettings || flags.includes("B"),
      disableRenderAllPagesChange: disableSettings || flags.includes("A"),
    };
    const navigationOptions = {
      disableTOCNavigation: flags.includes("T"),
      disableFind: flags.includes("f"),
      disableMarker: flags.includes("m"),
      disablePageNavigation: flags.includes("N"),
      disableZoom: flags.includes("Z"),
      disableFontSizeChange: flags.includes("F"),
      disablePageSlider: flags.includes("s"),
      disablePrint: flags.includes("p"),
    };
    const disableContextMenu = flags.includes("c");
    // const defaultBookMode = flags.includes("b");
    // Changed to default true (Issue #992)
    const defaultBookMode = !flags.includes("k");
    const defaultRenderAllPages = !flags.includes("a");
    const disableScripts = flags.includes("d");

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

    this.documentOptions = new DocumentOptions(defaultBookMode);
    this.viewerOptions = new ViewerOptions(defaultRenderAllPages);

    if (disableScripts) {
      this.viewerOptions.allowScripts(false);
    }

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
    const xUrls = urlParameters.getParameter("x"); // (deprecated) => src & bookMode=false
    if (!srcUrls.length) {
      if (bUrls.length) {
        urlParameters.setParameter("src", bUrls[0]);
        if (!urlParameters.hasParameter("bookMode")) {
          urlParameters.setParameter("bookMode", "true");
        }
        if (!urlParameters.hasParameter("renderAllPages")) {
          urlParameters.setParameter("renderAllPages", "false");
        }
      } else if (xUrls.length) {
        xUrls.forEach((x, i) => {
          urlParameters.setParameter("src", x, i);
        });
        if (!urlParameters.hasParameter("bookMode")) {
          urlParameters.setParameter("bookMode", "false");
        }
      }
    }
    // Remove redundant or ineffective URL parameters
    urlParameters.removeParameter("b");
    urlParameters.removeParameter("x");
    urlParameters.removeParameter("f", true); // only first one is effective
    urlParameters.removeParameter("spread", true);
    urlParameters.removeParameter("bookMode", true);
    urlParameters.removeParameter("allowScripts", true);
    urlParameters.removeParameter("renderAllPages", true);
    urlParameters.removeParameter("fontSize", true);
    urlParameters.removeParameter("zoom", true);
    urlParameters.removeParameter("find", true);
    urlParameters.removeParameter("profile", true);
    urlParameters.removeParameter("debug", true);

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
          inputUrl =
            stringUtil.percentEncodeAmpersandAndUnencodedPercent(inputUrl);
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

    this.findBox = new FindBox(this.viewer, this.navigation);

    const findingText = decodeURIComponent(
      urlParameters.getParameter("find")[0] ?? "",
    );
    if (findingText) {
      this.findBox.text(findingText);

      // TODO(?): Do find after the document is loaded
      // this.findBox.open();
      // this.findBox.findNext();
    }

    this.marksStore = marksStore;
    this.marksStore.init(this.viewerOptions, this.viewer);
    this.marksMenuStatus = marksStore.menuStatus;
    this.marksBox = marksStore.marksBox;
    this.viewer.rerenderTrigger.subscribe(() => {
      this.marksStore.retryHighlightMarks();
    });

    this.viewer.loadDocument(this.documentOptions);

    window.onhashchange = (): void => {
      if (window.location.href != urlParameters.storedUrl) {
        // Reload when address bar change is detected
        window.location.reload();
      }
    };
  }

  /**
   * @returns true if the key remains unconsumed
   */
  handleKey(data: ViewerApp, event: KeyboardEvent): boolean {
    if (
      event.isComposing ||
      (event.keyCode &&
        ((event.key === "Enter" &&
          event.keyCode !== 13 &&
          event.keyCode !== 16) ||
          (event.key === "Escape" && event.keyCode !== 27)))
    ) {
      // Enter/Escape key may be pressed to confirm/cancel kana-kanji conversion.
      return true;
    }
    const key = keyUtil.identifyKeyFromEvent(event);
    if (document.activeElement.id === "vivliostyle-input-url") {
      if (key === "Enter") {
        this.viewer.loadDocument(this.documentOptions);
        return false;
      }
      return true;
    }
    if (document.activeElement.id === "vivliostyle-find-box") {
      return this.findBox.handleKey(key, event, true);
    }
    let ret = this.findBox.handleKey(key, event, false);
    if (!ret) {
      return false;
    }
    if (
      key !== Keys.Escape &&
      document.activeElement.closest(
        "#vivliostyle-marks-box, #vivliostyle-text-selection-start-button, #vivliostyle-text-selection-edit-menu, [data-vivliostyle-page-container]",
      )
    ) {
      return true;
    }
    if (
      (!(key === "Home" || key === "End" || key === "p" || key === "P") &&
        (event.ctrlKey || event.metaKey)) ||
      event.altKey ||
      event.shiftKey
    ) {
      return true;
    }
    ret = this.settingsPanel.handleKey(key);
    if (ret) {
      ret = this.navigation.handleKey(key);
    }
    return ret;
  }
}

export default ViewerApp;
