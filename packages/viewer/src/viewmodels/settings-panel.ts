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

import Viewer from "./viewer";
import PageStyle from "../models/page-style";
import PageViewMode from "../models/page-view-mode";
import ViewerOptions from "../models/viewer-options";
import DocumentOptions from "../models/document-options";
import keyUtil from "../utils/key-util";

type State = {
  viewerOptions: ViewerOptions;
  pageStyle: PageStyle;
  pageViewMode: PureComputed<string>;
  bookMode: Observable<boolean>;
  renderAllPages: PureComputed<boolean>;
};

const { Keys } = keyUtil;

class SettingsPanel {
  private viewerOptions_: ViewerOptions;
  private documentOptions_: DocumentOptions;
  private viewer_: Viewer;

  isPageStyleChangeDisabled: boolean;
  isOverrideDocumentStyleSheetDisabled: boolean;
  isPageViewModeChangeDisabled: boolean;
  isBookModeChangeDisabled: boolean;
  isRenderAllPagesChangeDisabled: boolean;
  justClicked: boolean; // double click check
  settingsToggle: HTMLElement;
  state: State;
  opened: Observable<boolean>;
  pinned: Observable<boolean>;
  defaultPageStyle: PageStyle;

  constructor(
    viewerOptions: ViewerOptions,
    documentOptions: DocumentOptions,
    viewer: Viewer,
    messageDialog,
    settingsPanelOptions,
  ) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.isPageStyleChangeDisabled = !!settingsPanelOptions.disablePageStyleChange;
    this.isOverrideDocumentStyleSheetDisabled = this.isPageStyleChangeDisabled;
    this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;
    this.isBookModeChangeDisabled = !!settingsPanelOptions.disableBookModeChange;
    this.isRenderAllPagesChangeDisabled = !!settingsPanelOptions.disableRenderAllPagesChange;

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
    };

    this.state.pageStyle.setViewerFontSizeObservable(
      this.state.viewerOptions.fontSize,
    );

    this.defaultPageStyle = new PageStyle();

    ["close", "toggle", "apply", "cancel", "resetUserStyle"].forEach(function(
      methodName,
    ) {
      this[methodName] = this[methodName].bind(this);
    },
    this);

    messageDialog.visible.subscribe(function(visible) {
      if (visible) this.close();
    }, this);

    this.state.bookMode.subscribe((bookMode) => {
      documentOptions.bookMode(bookMode);
    });
    this.state.renderAllPages.subscribe((renderAllPages) => {
      viewerOptions.renderAllPages(renderAllPages);
    });
  }

  close(): boolean {
    this.opened(false);
    this.pinned(false);
    const viewportElement = document.getElementById(
      "vivliostyle-viewer-viewport",
    );
    if (viewportElement) viewportElement.focus();
    return true;
  }

  toggle(): void {
    if (!this.opened()) {
      if (!this.viewer_.tocPinned()) {
        this.viewer_.showTOC(false); // Hide TOC box
      }
      this.opened(true);

      if (this.justClicked) {
        this.justClicked = false;
        this.pinned(true);
      } else {
        this.pinned(false);
        this.justClicked = true;
        this.focusToFirstItem();
        setTimeout(() => {
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
      setTimeout(() => {
        this.justClicked = false;
      }, 300);
    }
  }

  apply(): void {
    this.documentOptions_.pageStyle.copyFrom(this.state.pageStyle);
    if (this.documentOptions_.pageStyle.baseFontSizeSpecified()) {
      // Update userStylesheet when base font-size is specified
      this.documentOptions_.updateUserStyleSheetFromCSSText();
    }
    this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
    if (this.pinned()) {
      this.focusToFirstItem();
    } else {
      this.close();
    }
  }

  cancel(): void {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
    this.state.pageStyle.copyFrom(this.documentOptions_.pageStyle);
    this.close();
  }

  resetUserStyle(): boolean {
    this.state.pageStyle.copyFrom(this.defaultPageStyle);
    this.state.viewerOptions.fontSize(
      ViewerOptions.getDefaultValues().fontSize,
    );
    setTimeout(() => {
      const elem = document.getElementsByName(
        "vivliostyle-settings_reset-user-style",
      )[0] as HTMLInputElement;
      elem.checked = false;
    }, 200);
    return true;
  }

  focusToFirstItem(outerElemParam?: Element): void {
    const outerElem = outerElemParam || this.settingsToggle;
    const inputElem = ["input", "textarea", "summary"].includes(
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
        let e = inputElem.parentElement;
        e && e != this.settingsToggle;
        e = e.parentElement
      ) {
        if (e.localName == "details") {
          // FIXME: Remove ts-ignore comment
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          e.open = true;
        }
      }
      (inputElem as HTMLInputElement | HTMLTextAreaElement).focus();
    }
  }

  handleKey(key): boolean {
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
      case "u":
      case "U":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementById("vivliostyle-settings_user-style")
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
      case "m":
      case "M":
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
      case "o":
      case "O":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName(
              "vivliostyle-settings_override-document-stylesheets",
            )[0],
          );
          return false;
        }
        return true;
      case "c":
      case "C":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName("vivliostyle-settings_css-details")[0],
          );
          return false;
        }
        return true;
      case "r":
      case "R":
        if (isHotKeyEnabled) {
          this.focusToFirstItem(
            document.getElementsByName(
              "vivliostyle-settings_reset-user-style",
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
            document.activeElement.id !== "vivliostyle-menu-button_reset")
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
