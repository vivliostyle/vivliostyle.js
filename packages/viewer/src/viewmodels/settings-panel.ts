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

import ko, { Observable, PureComputed } from "knockout";
import i18nextko from "i18next-ko";
import Viewer from "./viewer";
import PageStyle from "../models/page-style";
import PageViewMode from "../models/page-view-mode";
import ViewerOptions from "../models/viewer-options";
import DocumentOptions from "../models/document-options";
import urlParameters from "../stores/url-parameters";
import keyUtil from "../utils/key-util";
import MessageDialog from "./message-dialog";

type State = {
  viewerOptions: ViewerOptions;
  pageStyle: PageStyle;
  pageViewMode: PureComputed<string>;
  bookMode: Observable<boolean>;
  renderAllPages: PureComputed<boolean>;
  restoreView: Observable<boolean>;
};

const { Keys } = keyUtil;

class SettingsPanel {
  isPageStyleChangeDisabled: boolean;
  isPageViewModeChangeDisabled: boolean;
  isBookModeChangeDisabled: boolean;
  isRenderAllPagesChangeDisabled: boolean;
  isRestoreViewChangeDisabled: boolean;
  isUILanguageChangeDisabled: boolean;
  justClicked: boolean; // double click check
  settingsToggle: HTMLElement;
  state: State;
  opened: Observable<boolean>;
  pinned: Observable<boolean>;
  resetCustomStyle: PureComputed<boolean>;
  defaultPageStyle: PageStyle;
  uiLanguage: PureComputed<string>;

  constructor(
    private viewerOptions: ViewerOptions,
    private documentOptions: DocumentOptions,
    private viewer: Viewer,
    messageDialog: MessageDialog,
    settingsPanelOptions: {
      disablePageStyleChange: boolean;
      disablePageViewModeChange: boolean;
      disableBookModeChange: boolean;
      disableRenderAllPagesChange: boolean;
      disableRestoreViewChange: boolean;
      disableUILanguageChange: boolean;
    },
  ) {
    this.uiLanguage = ko.pureComputed({
      read: () => {
        return i18nextko.i18n.language;
      },
      write: (value) => {
        i18nextko.setLanguage(value);
        if (urlParameters.hasParameter("lng")) {
          urlParameters.setParameter("lng", value);
        }
        try {
          window.localStorage.setItem("i18nextLng", value);
        } catch (e) {
          // ignore
        }
      },
    });

    this.isPageStyleChangeDisabled =
      !!settingsPanelOptions.disablePageStyleChange;
    this.isPageViewModeChangeDisabled =
      !!settingsPanelOptions.disablePageViewModeChange;
    this.isBookModeChangeDisabled =
      !!settingsPanelOptions.disableBookModeChange;
    this.isRenderAllPagesChangeDisabled =
      !!settingsPanelOptions.disableRenderAllPagesChange;
    this.isRestoreViewChangeDisabled =
      !!settingsPanelOptions.disableRestoreViewChange;
    this.isUILanguageChangeDisabled =
      !!settingsPanelOptions.disableUILanguageChange;

    this.justClicked = false;
    this.settingsToggle = document.getElementById(
      "vivliostyle-menu-item_settings-toggle",
    );

    this.opened = ko.observable(false);
    this.pinned = ko.observable(false);
    this.state = {
      viewerOptions: new ViewerOptions(viewerOptions),
      pageStyle: new PageStyle(documentOptions.pageStyle),
      pageViewMode: ko.pureComputed({
        read: () => {
          return this.state.viewerOptions.pageViewMode().toString();
        },
        write: (value) => {
          this.state.viewerOptions.pageViewMode(PageViewMode.of(value));
        },
      }),
      bookMode: ko.observable(documentOptions.bookMode()),
      renderAllPages: ko.pureComputed({
        read: () => {
          return this.state.viewerOptions.renderAllPages();
        },
        write: (value) => {
          this.state.viewerOptions.renderAllPages(value);
        },
      }),
      restoreView: ko.observable(urlParameters.isEnabledRestoreView()),
    };

    this.state.pageStyle.setViewerFontSizeObservable(
      this.state.viewerOptions.fontSize,
    );

    this.defaultPageStyle = new PageStyle();
    this.defaultPageStyle.setViewerFontSizeObservable(ko.observable(16));

    messageDialog.visible.subscribe((visible) => {
      if (visible) this.close();
    });

    this.state.bookMode.subscribe((bookMode) => {
      documentOptions.bookMode(bookMode);
    });
    this.state.renderAllPages.subscribe((renderAllPages) => {
      viewerOptions.renderAllPages(renderAllPages);
    });
    this.state.restoreView.subscribe((restoreView) => {
      urlParameters.enableRestoreView(restoreView);
      if (restoreView) {
        urlParameters.setParameter("restoreView", "true");
      } else {
        urlParameters.removeParameter("restoreView");
      }
    });

    this.resetCustomStyle = ko.pureComputed({
      read() {
        const changed = !this.state.pageStyle.equivalentTo(
          this.defaultPageStyle,
        );
        if (changed) {
          return false;
        }
        const elem = document.getElementsByName(
          "vivliostyle-settings_reset-custom-style",
        )[0] as HTMLInputElement;
        return elem.checked;
      },
      write(resetCustomStyle) {
        if (resetCustomStyle) {
          this.state.pageStyle.copyFrom(this.defaultPageStyle);
          this.state.viewerOptions.fontSize(
            ViewerOptions.getDefaultValues().fontSize,
          );
        }
      },
      owner: this,
    });
  }

  close = (): void => {
    this.opened(false);
    this.pinned(false);
    const viewportElement = document.getElementById(
      "vivliostyle-viewer-viewport",
    );
    if (viewportElement) viewportElement.focus();
  };

  toggle = (): void => {
    if (!this.opened()) {
      if (!this.viewer.tocPinned()) {
        this.viewer.showTOC(false); // Hide TOC box
      }
      this.opened(true);

      if (this.justClicked) {
        this.justClicked = false;
        this.pinned(true);
      } else {
        this.pinned(false);
        this.justClicked = true;
        this.focusToFirstItem();
        window.setTimeout(() => {
          this.justClicked = false;
        }, 300);
      }
    } else if (this.justClicked) {
      // Double click to keep Settings panel open when Apply is clicked.
      this.justClicked = false;
      this.pinned(true);
    } else {
      this.close();

      this.justClicked = true;
      window.setTimeout(() => {
        this.justClicked = false;
      }, 300);
    }
  };

  apply = (): void => {
    const customStyleAsUserStyleChanged =
      this.documentOptions.pageStyle.customStyleAsUserStyle() !==
      this.state.pageStyle.customStyleAsUserStyle();
    this.documentOptions.pageStyle.copyFrom(this.state.pageStyle);
    if (customStyleAsUserStyleChanged) {
      this.documentOptions.switchCustomStyleUserOrAuthorStyleSheets();
    }
    if (this.documentOptions.pageStyle.baseFontSizeSpecified()) {
      // Update custom style when base font-size is specified
      this.documentOptions.updateCustomStyleSheetFromCSSText();
    }
    this.viewer.loadDocument(this.documentOptions, this.state.viewerOptions);
    if (this.pinned()) {
      this.focusToFirstItem();
    } else {
      this.close();
    }
  };

  cancel = (): void => {
    this.state.viewerOptions.copyFrom(this.viewerOptions);
    this.state.pageStyle.copyFrom(this.documentOptions.pageStyle);
    this.close();
  };

  focusToFirstItem(outerElemParam?: Element): void {
    const outerElem = outerElemParam || this.settingsToggle;
    const inputElem = ["input", "textarea", "summary", "select"].includes(
      outerElem.localName,
    )
      ? outerElem
      : Array.from(outerElem.getElementsByTagName("input")).find(
          (e: HTMLInputElement) => {
            return !e.disabled && (e.type != "radio" || e.checked);
          },
        );
    if (inputElem) {
      for (
        let e = inputElem.parentElement as HTMLDetailsElement;
        e && e != this.settingsToggle;
        e = e.parentElement as HTMLDetailsElement
      ) {
        if (e.localName == "details") {
          e.open = true;
        }
      }
      (inputElem as HTMLInputElement | HTMLTextAreaElement).focus();
    }
  }

  handleKey(key: string): boolean {
    const isSettingsActive =
      this.opened() && this.settingsToggle.contains(document.activeElement);
    const isInInput =
      isSettingsActive &&
      ((document.activeElement as HTMLInputElement).type == "text" ||
        document.activeElement.localName == "select");
    const isInTextArea =
      isSettingsActive && document.activeElement.localName == "textarea";
    const isHotKeyEnabled = isSettingsActive && !isInInput && !isInTextArea;

    switch (key) {
      case Keys.Escape:
        if (this.opened()) {
          this.cancel();
          this.close();
        }
        return true;
      case "s":
      case "S":
        if (!this.opened() || isHotKeyEnabled || !isSettingsActive) {
          this.toggle();
          return false;
        }
        return true;
      case "l":
      case "L":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName("vivliostyle-settings_ui-language")[0],
          );
          return false;
        }
        return true;
      case "p":
      case "P":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById(
              "vivliostyle-settings_page-view-and-rendering",
            ).firstElementChild,
          );
          return false;
        }
        return true;
      case "v":
      case "V":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_page-view-mode"),
          );
          return false;
        }
        return true;
      case "b":
      case "B":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName("vivliostyle-settings_book-mode")[0],
          );
          return false;
        }
        return true;
      case "a":
      case "A":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName(
              "vivliostyle-settings_render-all-pages",
            )[0],
          );
          return false;
        }
        return true;
      case "c":
      case "C":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_custom-style")
              .firstElementChild,
          );
          return false;
        }
        return true;
      case "m":
      case "M":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_custom-style_more")
              .firstElementChild,
          );
          return false;
        }
        return true;
      case "z":
      case "Z":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_page-size"),
          );
          return false;
        }
        return true;
      case "o":
      case "O":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_crop-marks"),
          );
          return false;
        }
        return true;
      case "g":
      case "G":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_page-margin"),
          );
          return false;
        }
        return true;
      case "k":
      case "K":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_page-breaks"),
          );
          return false;
        }
        return true;
      case "i":
      case "I":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_images"),
          );
          return false;
        }
        return true;
      case "t":
      case "T":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_text"),
          );
          return false;
        }
        return true;
      case "y":
      case "Y":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_priority"),
          );
          return false;
        }
        return true;
      case "e":
      case "E":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName("vivliostyle-settings_edit-css")[0],
          );
          return false;
        }
        return true;
      case "r":
      case "R":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName(
              "vivliostyle-settings_reset-custom-style",
            )[0],
          );
          return false;
        }
        return true;
      case Keys.Enter:
        if (
          isInInput ||
          (isHotKeyEnabled &&
            document.activeElement.id !== "vivliostyle-menu-button_apply" &&
            document.activeElement.id !== "vivliostyle-menu-button_cancel")
        ) {
          document.getElementById("vivliostyle-menu-button_apply").focus();
          return false;
        }
        return true;
      default:
        return true;
    }
  }
}

export default SettingsPanel;
