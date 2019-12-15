/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
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

import ko, { PureComputed } from "knockout";

import ViewerOptions from "../models/viewer-options";
import keyUtil from "../utils/key-util";
import Vivliostyle from "../vivliostyle";
import SettingsPanel from "./settings-panel";
import Viewer from "./viewer";
import { CoreViewer, ReadyState, PageProgression } from "@vivliostyle/core";

const { Keys } = keyUtil;

export type NavigationOptions = {
  disableTOCNavigation: boolean;
  disablePageNavigation: boolean;
  disableZoom: boolean;
  disableFontSizeChange: boolean;
};

class Navigation {
  static PREVIOUS(PREVIOUS: any) {
    throw new Error("Method not implemented.");
  }
  static NEXT(NEXT: any) {
    throw new Error("Method not implemented.");
  }
  static LEFT(LEFT: any) {
    throw new Error("Method not implemented.");
  }
  static RIGHT(RIGHT: any) {
    throw new Error("Method not implemented.");
  }
  static FIRST(FIRST: any) {
    throw new Error("Method not implemented.");
  }
  static LAST(LAST: any) {
    throw new Error("Method not implemented.");
  }
  static EPAGE(EPAGE: any, epage: any) {
    throw new Error("Method not implemented.");
  }
  private viewerOptions_: ViewerOptions;
  private viewer_: Viewer;
  private settingsPanel_: SettingsPanel;

  fitToScreen: PureComputed<unknown>;
  isDecreaseFontSizeDisabled: PureComputed<boolean>;
  isDefaultFontSizeDisabled: PureComputed<boolean>;
  isDisabled: PureComputed<boolean>;
  isIncreaseFontSizeDisabled: PureComputed<boolean>;
  isNavigateToNextDisabled: PureComputed<boolean>;
  isNavigateToPreviousDisabled: PureComputed<boolean>;
  isNavigateToLeftDisabled: PureComputed<boolean>;
  isNavigateToRightDisabled: PureComputed<boolean>;
  isNavigateToFirstDisabled: PureComputed<boolean>;
  isNavigateToLastDisabled: PureComputed<boolean>;
  isPageNumberDisabled: PureComputed<boolean>;
  isTOCToggleDisabled: PureComputed<boolean>;
  isToggleFitToScreenDisabled: PureComputed<boolean>;
  isZoomOutDisabled: PureComputed<boolean>;
  isZoomInDisabled: PureComputed<boolean>;
  isZoomToActualSizeDisabled: PureComputed<boolean>;
  pageNumber: PureComputed<number | string>;
  totalPages: PureComputed<unknown>;
  hideFontSizeChange: boolean;
  hidePageNavigation: boolean;
  hideTOCNavigation: boolean;
  hideZoom: boolean;
  justClicked: boolean;

  constructor(
    viewerOptions: ViewerOptions,
    viewer: Viewer,
    settingsPanel: SettingsPanel,
    navigationOptions: NavigationOptions,
  ) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;
    this.settingsPanel_ = settingsPanel;
    this.justClicked = false; // double click check

    this.isDisabled = ko.pureComputed(() => {
      return (
        (this.settingsPanel_.opened() && !this.settingsPanel_.pinned()) ||
        !this.viewer_.state.navigatable()
      );
    });

    const navigationDisabled = ko.pureComputed(() => {
      return navigationOptions.disablePageNavigation || this.isDisabled();
    });

    navigationDisabled.subscribe((disabled) => {
      const pageNumberElem = document.getElementById(
        "vivliostyle-page-number",
      ) as HTMLInputElement;
      if (pageNumberElem) {
        pageNumberElem.disabled = disabled;
      }
    });

    this.isPageNumberDisabled = ko.pureComputed(() => {
      return navigationDisabled();
    });

    this.isNavigateToPreviousDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer_.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      return this.viewer_.firstPage();
    });

    this.isNavigateToNextDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer_.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (
        this.viewerOptions_.renderAllPages() &&
        this.viewer_.state.status() != ReadyState.COMPLETE
      ) {
        return false;
      }
      return this.viewer_.lastPage();
    });

    this.isNavigateToLeftDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer_.state.pageProgression === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (this.viewer_.state.pageProgression() === PageProgression.LTR) {
        return this.isNavigateToPreviousDisabled();
      } else {
        return this.isNavigateToNextDisabled();
      }
    });

    this.isNavigateToRightDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer_.state.pageProgression === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (this.viewer_.state.pageProgression() === PageProgression.LTR) {
        return this.isNavigateToNextDisabled();
      } else {
        return this.isNavigateToPreviousDisabled();
      }
    });

    this.isNavigateToFirstDisabled = this.isNavigateToPreviousDisabled;

    this.isNavigateToLastDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer_.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (
        this.viewerOptions_.renderAllPages() &&
        this.viewer_.state.status() != ReadyState.COMPLETE
      ) {
        return true;
      }
      return this.viewer_.lastPage();
    });

    this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

    const zoomDisabled = ko.pureComputed(() => {
      return navigationOptions.disableZoom || this.isDisabled();
    });

    this.isZoomOutDisabled = zoomDisabled;
    this.isZoomInDisabled = zoomDisabled;
    this.isZoomToActualSizeDisabled = zoomDisabled;
    this.isToggleFitToScreenDisabled = zoomDisabled;
    this.hideZoom = !!navigationOptions.disableZoom;

    this.fitToScreen = ko.pureComputed(() => viewerOptions.zoom().fitToScreen);

    const fontSizeChangeDisabled = ko.pureComputed(() => {
      return navigationOptions.disableFontSizeChange || this.isDisabled();
    });

    // Font size limit (max:72, min:5) is hard coded in vivliostyle.js/src/adapt/viewer.js.
    this.isIncreaseFontSizeDisabled = ko.pureComputed(() => {
      if (fontSizeChangeDisabled()) {
        return true;
      }
      if (this.viewerOptions_.fontSize() >= 72) {
        return true;
      }
      return false;
    });
    this.isDecreaseFontSizeDisabled = ko.pureComputed(() => {
      if (fontSizeChangeDisabled()) {
        return true;
      }
      if (this.viewerOptions_.fontSize() <= 5) {
        return true;
      }
      return false;
    });
    this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
    this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

    this.isTOCToggleDisabled = ko.pureComputed(() => {
      return (
        navigationOptions.disableTOCNavigation ||
        this.isDisabled() ||
        this.viewer_.tocVisible() == null
      );
    });
    this.hideTOCNavigation = !!navigationOptions.disableTOCNavigation;

    this.pageNumber = ko.pureComputed({
      read() {
        return this.viewer_.epageToPageNumber(this.viewer_.epage());
      },
      write(pageNumberText: number | string) {
        const epageOld = this.viewer_.epage();
        const pageNumberOld = this.viewer_.epageToPageNumber(epageOld);

        // Accept non-integer, convert fullwidth to ascii
        let pageNumber =
          parseFloat(
            pageNumberText
              .toString()
              .replace(/[０-９]/g, (s) =>
                String.fromCharCode(s.charCodeAt(0) - 0xfee0),
              ),
          ) || 0;
        if (/^[-+]/.test(pageNumberText.toString())) {
          // "+number" and "-number" to relative move.
          pageNumber = pageNumberOld + pageNumber;
        }
        if (pageNumber < 1) {
          pageNumber = 1;
        } else {
          const epageCount = this.viewer_.epageCount();
          if (this.viewerOptions_.renderAllPages()) {
            if (pageNumber > epageCount) {
              pageNumber = epageCount;
            }
          } else if (pageNumber > epageCount + 1) {
            // Accept "epageCount + 1" because the last epage may equal epageCount.
            pageNumber = epageCount + 1;
          }
        }
        const epageNav = this.viewer_.epageFromPageNumber(pageNumber);
        const pageNumberElem = document.getElementById(
          "vivliostyle-page-number",
        ) as HTMLInputElement;
        pageNumberElem.value = pageNumber.toString();
        this.viewer_.navigateToEPage(epageNav);

        setTimeout(() => {
          if (
            this.viewer_.state.status() != ReadyState.LOADING &&
            this.viewer_.epage() === epageOld
          ) {
            pageNumberElem.value = pageNumberOld.toString();
          }
          document.getElementById("vivliostyle-viewer-viewport").focus();
        }, 10);
      },
      owner: this,
    });

    this.totalPages = ko.pureComputed(() => {
      let totalPages = this.viewer_.epageCount();
      if (!totalPages) {
        return totalPages;
      }
      const pageNumber = Number(this.pageNumber());
      if (this.viewer_.lastPage()) {
        totalPages = pageNumber;
      } else if (pageNumber >= totalPages) {
        totalPages++;
      }
      return totalPages;
    });

    [
      "navigateToPrevious",
      "navigateToNext",
      "navigateToLeft",
      "navigateToRight",
      "navigateToFirst",
      "navigateToLast",
      "zoomIn",
      "zoomOut",
      "zoomToActualSize",
      "toggleFitToScreen",
      "increaseFontSize",
      "decreaseFontSize",
      "defaultFontSize",
      "onclickViewport",
      "toggleTOC",
    ].forEach((methodName) => {
      this[methodName] = this[methodName].bind(this);
    });
  }

  navigateToPrevious(): boolean {
    if (!this.isNavigateToPreviousDisabled()) {
      this.viewer_.navigateToPrevious();
      return true;
    } else {
      return false;
    }
  }

  navigateToNext(): boolean {
    if (!this.isNavigateToNextDisabled()) {
      this.viewer_.navigateToNext();
      return true;
    } else {
      return false;
    }
  }

  navigateToLeft(): boolean {
    if (!this.isNavigateToLeftDisabled()) {
      this.viewer_.navigateToLeft();
      return true;
    } else {
      return false;
    }
  }

  navigateToRight(): boolean {
    if (!this.isNavigateToRightDisabled()) {
      this.viewer_.navigateToRight();
      return true;
    } else {
      return false;
    }
  }

  navigateToFirst(): boolean {
    if (!this.isNavigateToFirstDisabled()) {
      this.viewer_.navigateToFirst();
      return true;
    } else {
      return false;
    }
  }

  navigateToLast(): boolean {
    if (!this.isNavigateToLastDisabled()) {
      this.viewer_.navigateToLast();
      return true;
    } else {
      return false;
    }
  }

  zoomIn(): boolean {
    if (!this.isZoomInDisabled()) {
      const zoom = this.viewerOptions_.zoom();
      this.viewerOptions_.zoom(
        zoom.zoomIn((this.viewer_ as unknown) as CoreViewer),
      ); // TODO: test if it's ok to treat viewer_ as CoreViewer
      return true;
    } else {
      return false;
    }
  }

  zoomOut(): boolean {
    if (!this.isZoomOutDisabled()) {
      const zoom = this.viewerOptions_.zoom();
      this.viewerOptions_.zoom(
        zoom.zoomOut((this.viewer_ as unknown) as CoreViewer),
      ); // TODO: test if it's ok to treat viewer_ as CoreViewer
      return true;
    } else {
      return false;
    }
  }

  zoomToActualSize(): boolean {
    if (!this.isZoomToActualSizeDisabled()) {
      const zoom = this.viewerOptions_.zoom();
      this.viewerOptions_.zoom(zoom.zoomToActualSize());
      return true;
    } else {
      return false;
    }
  }

  toggleFitToScreen(): boolean {
    if (!this.isToggleFitToScreenDisabled()) {
      const zoom = this.viewerOptions_.zoom();
      this.viewerOptions_.zoom(zoom.toggleFitToScreen());
      return true;
    } else {
      return false;
    }
  }

  increaseFontSize(): boolean {
    if (!this.isIncreaseFontSizeDisabled()) {
      let fontSize = Number(this.viewerOptions_.fontSize());
      // fontSize *= 1.25;
      if (fontSize < 10) {
        fontSize = Math.floor(fontSize) + 1;
      } else if (fontSize < 20) {
        fontSize = (Math.floor(fontSize / 2) + 1) * 2;
      } else if (fontSize < 40) {
        fontSize = (Math.floor(fontSize / 4) + 1) * 4;
      } else if (fontSize < 72) {
        fontSize = (Math.floor(fontSize / 8) + 1) * 8;
      } else {
        fontSize = 72;
      }
      this.viewerOptions_.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  decreaseFontSize(): boolean {
    if (!this.isDecreaseFontSizeDisabled()) {
      let fontSize = Number(this.viewerOptions_.fontSize());
      // fontSize *= 0.8;
      if (fontSize > 40) {
        fontSize = (Math.ceil(fontSize / 8) - 1) * 8;
      } else if (fontSize > 20) {
        fontSize = (Math.ceil(fontSize / 4) - 1) * 4;
      } else if (fontSize > 10) {
        fontSize = (Math.ceil(fontSize / 2) - 1) * 2;
      } else if (fontSize > 5) {
        fontSize = Math.ceil(fontSize) - 1;
      } else {
        fontSize = 5;
      }
      this.viewerOptions_.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  defaultFontSize(): boolean {
    if (!this.isDefaultFontSizeDisabled()) {
      const fontSize = ViewerOptions.getDefaultValues().fontSize;
      this.viewerOptions_.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  updateFontSizeSettings(): void {
    // Update setting panel "Font Size".
    this.settingsPanel_.state.viewerOptions.fontSize(
      this.viewerOptions_.fontSize(),
    );

    if (this.viewer_.documentOptions_.pageStyle.baseFontSizeSpecified()) {
      // Update userStylesheet when base font-size is specified
      this.viewer_.documentOptions_.updateUserStyleSheetFromCSSText();
      this.viewer_.loadDocument(
        this.viewer_.documentOptions_,
        this.viewerOptions_,
      );
    }
  }

  onclickViewport(): boolean {
    if (this.settingsPanel_.justClicked) {
      return true;
    }
    if (this.viewer_.tocVisible() && !this.viewer_.tocPinned()) {
      const tocBox = document.querySelector("[data-vivliostyle-toc-box]");
      if (tocBox && !tocBox.contains(document.activeElement)) {
        this.toggleTOC();
      }
    }
    if (this.settingsPanel_.opened() && !this.settingsPanel_.pinned()) {
      this.settingsPanel_.close();
    }
    return true;
  }

  toggleTOC(): boolean {
    if (!this.isTOCToggleDisabled()) {
      let intervalID: NodeJS.Timeout | null = null;

      if (!this.viewer_.tocVisible()) {
        if (this.justClicked) {
          this.viewer_.showTOC(true, false); // autohide=false
          this.justClicked = false;
        } else {
          this.viewer_.showTOC(true, true); // autohide=true
          this.justClicked = true;
        }
        // Here use timer for two purposes:
        // - Check double click to make TOC box pinned.
        // - Move focus to TOC box when TOC box becomes visible.
        intervalID = setInterval(() => {
          const tocBox = document.querySelector(
            "[data-vivliostyle-toc-box]",
          ) as HTMLElement;
          if (tocBox && tocBox.style.visibility === "visible") {
            tocBox.tabIndex = 0;
            tocBox.focus();

            clearInterval(intervalID);
            intervalID = null;
          }
          this.justClicked = false;
        }, 300);
      } else if (this.justClicked) {
        // Double click to keep TOC box visible during TOC navigation
        this.viewer_.showTOC(true, false); // autohide=false
        this.justClicked = false;
      } else {
        if (intervalID !== null) {
          clearInterval(intervalID);
          intervalID = null;
        }
        this.viewer_.showTOC(false);

        this.justClicked = true;
        setTimeout(() => {
          if (this.justClicked) {
            document.getElementById("vivliostyle-viewer-viewport").focus();
            this.justClicked = false;
          }
        }, 300);
      }
      return true;
    } else {
      return false;
    }
  }

  navigateTOC(key): boolean {
    const selecter =
      "[data-vivliostyle-toc-box]>*>*>*>*>*:not([hidden]) [tabindex='0']," +
      "[data-vivliostyle-toc-box]>*>*>*>*>*:not([hidden]) a[href]:not([tabindex='-1'])";
    const nodes = Array.from(document.querySelectorAll(selecter));
    let index = nodes.indexOf(document.activeElement);

    const isButton = (index): boolean => {
      return nodes[index] && nodes[index].getAttribute("role") === "button";
    };
    const isExpanded = (index): boolean => {
      return (
        nodes[index] && nodes[index].getAttribute("aria-expanded") === "true"
      );
    };

    switch (key) {
      case Keys.ArrowLeft:
        if (index == -1) {
          index = nodes.length - 1;
          break;
        }
        if (!isButton(index) && isButton(index - 1)) {
          index--;
        }
        if (isButton(index) && isExpanded(index)) {
          (nodes[index] as HTMLElement).click();
        } else {
          for (let i = index - 1; i >= 0; i--) {
            if (isButton(i) && nodes[i].parentElement.contains(nodes[index])) {
              index = i;
              break;
            }
          }
        }
        break;
      case Keys.ArrowRight:
        if (index == -1) {
          index = 0;
          break;
        }
        if (!isButton(index) && isButton(index - 1)) {
          index--;
        }
        if (isButton(index)) {
          if (isExpanded(index)) {
            index += 2;
          } else {
            (nodes[index] as HTMLElement).click();
          }
        }
        break;
      case Keys.ArrowDown:
        index++;
        break;
      case Keys.ArrowUp:
        if (index == -1) {
          index = nodes.length - 1;
          break;
        }
        if (index > 0) {
          if (isButton(--index)) {
            index--;
          }
        }
        break;
      case Keys.Home:
        index = 0;
        break;
      case Keys.End:
        index = nodes.length - 1;
        break;
      case Keys.Space:
        if (!isButton(index) && isButton(index - 1)) {
          index--;
        }
        if (isButton(index)) {
          (nodes[index] as HTMLElement).click();
        }
        break;
    }

    if (isButton(index)) {
      index++;
    }

    if (nodes[index]) {
      (nodes[index] as HTMLElement).focus();
    }

    return true;
  }

  handleKey(key): boolean {
    const isSettingsActive =
      this.settingsPanel_.opened() &&
      this.settingsPanel_.settingsToggle.contains(document.activeElement);

    if (isSettingsActive) {
      return true;
    }

    const pageNumberElem = document.getElementById("vivliostyle-page-number");
    const viewportElement = document.getElementById(
      "vivliostyle-viewer-viewport",
    );
    const horizontalScrollable =
      viewportElement.scrollWidth > viewportElement.clientWidth;
    const verticalScrollable =
      viewportElement.scrollHeight > viewportElement.clientHeight;
    const isPageNumberInput = pageNumberElem === document.activeElement;
    const isTOCActive =
      this.viewer_.tocVisible() &&
      !isPageNumberInput &&
      viewportElement != document.activeElement;

    switch (key) {
      case "+":
        return isPageNumberInput || !this.increaseFontSize();
      case "-":
        return isPageNumberInput || !this.decreaseFontSize();
      case "0":
        return isPageNumberInput || !this.defaultFontSize();
      case "1":
        return isPageNumberInput || !this.zoomToActualSize();
      case Keys.ArrowLeft:
        if (isTOCActive) return !this.navigateTOC(key);
        return (
          isPageNumberInput || horizontalScrollable || !this.navigateToLeft()
        );
      case Keys.ArrowRight:
        if (isTOCActive) return !this.navigateTOC(key);
        return (
          isPageNumberInput || horizontalScrollable || !this.navigateToRight()
        );
      case Keys.ArrowDown:
        if (isTOCActive) return !this.navigateTOC(key);
        viewportElement.focus();
        return verticalScrollable || !this.navigateToNext();
      case Keys.ArrowUp:
        if (isTOCActive) return !this.navigateTOC(key);
        viewportElement.focus();
        return verticalScrollable || !this.navigateToPrevious();
      case Keys.PageDown:
        if (isTOCActive) return true;
        viewportElement.focus();
        return !this.navigateToNext();
      case Keys.PageUp:
        if (isTOCActive) return true;
        viewportElement.focus();
        return !this.navigateToPrevious();
      case Keys.Home:
        if (isTOCActive) return !this.navigateTOC(key);
        viewportElement.focus();
        return !this.navigateToFirst();
      case Keys.End:
        if (isTOCActive) return !this.navigateTOC(key);
        viewportElement.focus();
        return !this.navigateToLast();
      case "o":
      case "O":
        viewportElement.focus();
        return !this.zoomOut();
      case "i":
      case "I":
        viewportElement.focus();
        return !this.zoomIn();
      case "f":
      case "F":
        viewportElement.focus();
        return !this.toggleFitToScreen();
      case "g":
      case "G":
        pageNumberElem.focus();
        return false;
      case "t":
      case "T":
        viewportElement.focus();
        return !this.toggleTOC();
      case Keys.Escape:
        if (this.viewer_.tocVisible()) {
          return !this.toggleTOC();
        }
        viewportElement.focus();
        return true;
      case Keys.Space:
        if (isTOCActive) return !this.navigateTOC(key);
        if (document.activeElement.getAttribute("role") === "button") {
          (document.activeElement as HTMLElement).click();
          return false;
        }
        return true;
      default:
        return true;
    }
  }
}

export default Navigation;
