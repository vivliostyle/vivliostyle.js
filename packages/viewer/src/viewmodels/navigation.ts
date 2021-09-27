/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) unknown later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ReadyState, PageProgression } from "@vivliostyle/core";
import ko, { PureComputed } from "knockout";

import ViewerOptions from "../models/viewer-options";
import keyUtil from "../utils/key-util";
import SettingsPanel from "./settings-panel";
import Viewer from "./viewer";

const { Keys } = keyUtil;

export type NavigationOptions = {
  disableTOCNavigation: boolean;
  disablePageNavigation: boolean;
  disableZoom: boolean;
  disableFontSizeChange: boolean;
  disablePageSlider: boolean;
  disablePrint: boolean;
};

class Navigation {
  fitToScreen: PureComputed<boolean>;
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
  isPageSliderDisabled: PureComputed<boolean>;
  isTOCToggleDisabled: PureComputed<boolean>;
  isToggleFitToScreenDisabled: PureComputed<boolean>;
  isZoomOutDisabled: PureComputed<boolean>;
  isZoomInDisabled: PureComputed<boolean>;
  isZoomToActualSizeDisabled: PureComputed<boolean>;
  isPrintDisabled: PureComputed<boolean>;
  pageNumber: PureComputed<number | string>;
  totalPages: PureComputed<number | string>;
  pageSlider: PureComputed<number | string>;
  pageSliderMax: PureComputed<number | string>;
  hidePageSlider: boolean;
  hideFontSizeChange: boolean;
  hidePageNavigation: boolean;
  hideTOCNavigation: boolean;
  hideZoom: boolean;
  hidePrint: boolean;
  justClicked: boolean;

  constructor(
    private viewerOptions: ViewerOptions,
    private viewer: Viewer,
    private settingsPanel: SettingsPanel,
    navigationOptions: NavigationOptions,
  ) {
    this.justClicked = false; // double click check

    this.isDisabled = ko.pureComputed(() => {
      return (
        (this.settingsPanel.opened() && !this.settingsPanel.pinned()) ||
        !this.viewer.state.navigatable()
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

    this.isPageSliderDisabled = ko.pureComputed(() => {
      if (navigationOptions.disablePageSlider || navigationDisabled()) {
        return true;
      }
      return this.totalPages() <= 1;
    });

    this.isNavigateToPreviousDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      return this.viewer.firstPage();
    });

    this.isNavigateToNextDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (
        this.viewerOptions.renderAllPages() &&
        this.viewer.state.status() != ReadyState.COMPLETE
      ) {
        return false;
      }
      return this.viewer.lastPage();
    });

    this.isNavigateToLeftDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer.state.pageProgression === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (this.viewer.state.pageProgression() === PageProgression.LTR) {
        return this.isNavigateToPreviousDisabled();
      } else {
        return this.isNavigateToNextDisabled();
      }
    });

    this.isNavigateToRightDisabled = ko.pureComputed(() => {
      if (navigationDisabled()) {
        return true;
      }
      if (this.viewer.state.pageProgression === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (this.viewer.state.pageProgression() === PageProgression.LTR) {
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
      if (this.viewer.state.status === undefined) {
        return false; // needed for test/spec/viewmodels/navigation-spec.js
      }
      if (
        this.viewerOptions.renderAllPages() &&
        this.viewer.state.status() != ReadyState.COMPLETE
      ) {
        return true;
      }
      return this.viewer.lastPage();
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
      if (this.viewerOptions.fontSize() >= 72) {
        return true;
      }
      return false;
    });
    this.isDecreaseFontSizeDisabled = ko.pureComputed(() => {
      if (fontSizeChangeDisabled()) {
        return true;
      }
      if (this.viewerOptions.fontSize() <= 5) {
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
        this.viewer.tocVisible() == null
      );
    });
    this.hideTOCNavigation = !!navigationOptions.disableTOCNavigation;
    this.hidePageSlider = !!navigationOptions.disablePageSlider;

    this.isPrintDisabled = ko.pureComputed(() => {
      if (
        navigationOptions.disablePrint ||
        this.isDisabled() ||
        this.viewer.state.status() != ReadyState.COMPLETE
      ) {
        return true;
      }
      return false;
    });

    this.hidePrint = !!navigationOptions.disablePrint;

    if (navigationOptions.disablePrint) {
      const printStyle = document.createElement("style");
      printStyle.setAttribute("media", "print");
      printStyle.textContent = "*{display:none}";
      document.head.appendChild(printStyle);
    }

    this.pageNumber = ko.pureComputed({
      read() {
        return this.viewer.epageToPageNumber(this.viewer.epage());
      },
      write(pageNumberText: number | string) {
        const epageOld = this.viewer.epage();
        const pageNumberOld = this.viewer.epageToPageNumber(epageOld);

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
          const epageCount = this.viewer.epageCount();
          if (this.viewerOptions.renderAllPages()) {
            if (pageNumber > epageCount) {
              pageNumber = epageCount;
            }
          } else if (pageNumber > epageCount + 1) {
            // Accept "epageCount + 1" because the last epage may equal epageCount.
            pageNumber = epageCount + 1;
          }
        }
        const epageNav = this.viewer.epageFromPageNumber(pageNumber);
        const pageNumberElem = document.getElementById(
          "vivliostyle-page-number",
        ) as HTMLInputElement;
        pageNumberElem.value = pageNumber.toString();
        this.viewer.navigateToEPage(epageNav);

        setTimeout(() => {
          if (
            this.viewer.state.status() != ReadyState.LOADING &&
            this.viewer.epage() === epageOld
          ) {
            pageNumberElem.value = pageNumberOld.toString();
          }
          document.getElementById("vivliostyle-viewer-viewport").focus();
        }, 10);
      },
      owner: this,
    });

    this.totalPages = ko.pureComputed(() => {
      let totalPages = this.viewer.epageCount();
      if (!totalPages) {
        return totalPages;
      }
      const pageNumber = Number(this.pageNumber());
      if (this.viewer.lastPage()) {
        totalPages = pageNumber;
      } else if (pageNumber >= totalPages) {
        totalPages++;
      }
      return totalPages;
    });

    this.pageSlider = ko.pureComputed({
      read() {
        return this.pageNumber();
      },
      write(pageNumberText: number | string) {
        if (this.viewerOptions.renderAllPages()) {
          const pageNumber = Number(pageNumberText);
          const epageNav = this.viewer.epageFromPageNumber(pageNumber);
          this.viewer.navigateToEPage(epageNav);
        } else {
          const pageNumberElem = document.getElementById(
            "vivliostyle-page-number",
          ) as HTMLInputElement;
          pageNumberElem.value = String(pageNumberText);
          // Here, changes `pageNumberElem.value` but not do `navigateToEPage()`.
          // `navigateToEPage()` is called in `onmouseupPageSlider()` later.
        }
      },
      owner: this,
    });

    this.pageSliderMax = this.totalPages;

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
      "onfocusPageNumber",
      "onmouseupPageSlider",
      "onwheelPageSlider",
      "onwheelViewport",
      "onclickViewport",
      "toggleTOC",
      "print",
    ].forEach((methodName) => {
      this[methodName] = this[methodName].bind(this);
    });
  }

  navigateToPrevious(): boolean {
    if (!this.isNavigateToPreviousDisabled()) {
      this.viewer.navigateToPrevious();
      return true;
    } else {
      return false;
    }
  }

  navigateToNext(): boolean {
    if (!this.isNavigateToNextDisabled()) {
      this.viewer.navigateToNext();
      return true;
    } else {
      return false;
    }
  }

  navigateToLeft(): boolean {
    if (!this.isNavigateToLeftDisabled()) {
      this.viewer.navigateToLeft();
      return true;
    } else {
      return false;
    }
  }

  navigateToRight(): boolean {
    if (!this.isNavigateToRightDisabled()) {
      this.viewer.navigateToRight();
      return true;
    } else {
      return false;
    }
  }

  navigateToFirst(): boolean {
    if (!this.isNavigateToFirstDisabled()) {
      this.viewer.navigateToFirst();
      return true;
    } else {
      return false;
    }
  }

  navigateToLast(): boolean {
    if (!this.isNavigateToLastDisabled()) {
      this.viewer.navigateToLast();
      return true;
    } else {
      return false;
    }
  }

  zoomIn(): boolean {
    if (!this.isZoomInDisabled()) {
      const zoom = this.viewerOptions.zoom();
      this.viewerOptions.zoom(zoom.zoomIn(this.viewer));
      return true;
    } else {
      return false;
    }
  }

  zoomOut(): boolean {
    if (!this.isZoomOutDisabled()) {
      const zoom = this.viewerOptions.zoom();
      this.viewerOptions.zoom(zoom.zoomOut(this.viewer));
      return true;
    } else {
      return false;
    }
  }

  zoomToActualSize(): boolean {
    if (!this.isZoomToActualSizeDisabled()) {
      const zoom = this.viewerOptions.zoom();
      this.viewerOptions.zoom(zoom.zoomToActualSize());
      return true;
    } else {
      return false;
    }
  }

  toggleFitToScreen(): boolean {
    if (!this.isToggleFitToScreenDisabled()) {
      const zoom = this.viewerOptions.zoom();
      this.viewerOptions.zoom(zoom.toggleFitToScreen());
      return true;
    } else {
      return false;
    }
  }

  increaseFontSize(): boolean {
    if (!this.isIncreaseFontSizeDisabled()) {
      let fontSize = Number(this.viewerOptions.fontSize());
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
      this.viewerOptions.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  decreaseFontSize(): boolean {
    if (!this.isDecreaseFontSizeDisabled()) {
      let fontSize = Number(this.viewerOptions.fontSize());
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
      this.viewerOptions.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  defaultFontSize(): boolean {
    if (!this.isDefaultFontSizeDisabled()) {
      const fontSize = ViewerOptions.getDefaultValues().fontSize;
      this.viewerOptions.fontSize(fontSize);
      this.updateFontSizeSettings();
      return true;
    } else {
      return false;
    }
  }

  updateFontSizeSettings(): void {
    // Update setting panel "Font Size".
    this.settingsPanel.state.viewerOptions.fontSize(
      this.viewerOptions.fontSize(),
    );

    if (this.viewer.documentOptions.pageStyle.baseFontSizeSpecified()) {
      // Update userStylesheet when base font-size is specified
      this.viewer.documentOptions.updateUserStyleSheetFromCSSText();
      this.viewer.loadDocument(this.viewer.documentOptions, this.viewerOptions);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onfocusPageNumber(obj: unknown, event: Event): boolean {
    const inputElem = event.currentTarget as HTMLInputElement;
    setTimeout(() => {
      inputElem.setSelectionRange(0, inputElem.value.length);
    }, 0);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onmouseupPageSlider(obj: unknown, event: MouseEvent): boolean {
    if (this.viewerOptions.renderAllPages()) {
      // already moved in `this.pageSlider.write()`
      return true;
    }
    const pageNumberElem = document.getElementById(
      "vivliostyle-page-number",
    ) as HTMLInputElement;
    const pageNumber = Number(pageNumberElem.value);
    const epageNav = this.viewer.epageFromPageNumber(pageNumber);
    this.viewer.navigateToEPage(epageNav);

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onwheelPageSlider(obj: unknown, event: WheelEvent): boolean {
    event.preventDefault();
    if (
      event.deltaMode === 0 &&
      Math.abs(event.deltaX) < 2 &&
      Math.abs(event.deltaY) < 2
    ) {
      // ignore small move less than 2px
      return true;
    }
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      if (event.deltaX < 0) {
        this.navigateToLeft();
      } else {
        this.navigateToRight();
      }
    } else {
      if (event.deltaY < 0) {
        this.navigateToPrevious();
      } else {
        this.navigateToNext();
      }
    }
    return true;
  }

  onwheelViewport(obj: unknown, event: WheelEvent): boolean {
    const viewportElement = document.getElementById(
      "vivliostyle-viewer-viewport",
    );
    const isTOCActive =
      this.viewer.tocVisible() && viewportElement != document.activeElement;
    if (
      isTOCActive ||
      viewportElement.scrollWidth > viewportElement.clientWidth ||
      viewportElement.scrollHeight > viewportElement.clientHeight
    ) {
      // When TOC is active or page is scrollable, wheel is used for those
      return true;
    }
    return this.onwheelPageSlider(obj, event);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onclickViewport(obj: unknown, event: MouseEvent): boolean {
    this.pageNumber();
    if (this.settingsPanel.justClicked) {
      return true;
    }
    if (this.viewer.tocVisible() && !this.viewer.tocPinned()) {
      const tocBox = document.querySelector("[data-vivliostyle-toc-box]");
      if (tocBox && !tocBox.contains(document.activeElement)) {
        this.toggleTOC();
      }
    }
    if (this.settingsPanel.opened() && !this.settingsPanel.pinned()) {
      this.settingsPanel.close();
    }
    return true;
  }

  toggleTOC(): boolean {
    if (!this.isTOCToggleDisabled()) {
      let intervalID: ReturnType<typeof setTimeout> | null = null;

      if (!this.viewer.tocVisible()) {
        if (this.justClicked) {
          this.viewer.showTOC(true, false); // autohide=false
          this.justClicked = false;
        } else {
          this.viewer.showTOC(true, true); // autohide=true
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
        this.viewer.showTOC(true, false); // autohide=false
        this.justClicked = false;
      } else {
        if (intervalID !== null) {
          clearInterval(intervalID);
          intervalID = null;
        }
        this.viewer.showTOC(false);

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

  navigateTOC(key: string): boolean {
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

  handleKey(key: string): boolean {
    const isSettingsActive =
      this.settingsPanel.opened() &&
      this.settingsPanel.settingsToggle.contains(document.activeElement);

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
      this.viewer.tocVisible() &&
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
      case "p":
      case "P":
        viewportElement.focus();
        return !this.print();
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
        if (this.viewer.tocVisible()) {
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

  print(): boolean {
    if (!this.isPrintDisabled()) {
      window.print();
      return true;
    } else {
      return false;
    }
  }
}

export default Navigation;
