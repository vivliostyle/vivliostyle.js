/*
 * Copyright 2021 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */

import ko, { Observable } from "knockout";

import Viewer from "./viewer";
import Navigation from "./navigation";
import urlParameters from "../stores/url-parameters";
import keyUtil from "../utils/key-util";
import stringUtil from "../utils/string-util";
import { scaleRect, applyTransformToRect } from "../utils/scale-util";

const { Keys } = keyUtil;

type WindowWithFind = typeof window & {
  // Window.find()
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/find
  find: (
    aString: string,
    aCaseSensitive?: boolean,
    aBackwards?: boolean,
    aWrapAround?: boolean,
    aWholeWord?: boolean,
    aSearchInFrames?: boolean,
    aShowDialog?: boolean,
  ) => boolean;
};

enum FindStatus {
  Default = "",
  Searching = "Searching",
  Found = "Found",
  NotFound = "Not Found",
}

class FindBox {
  opened: Observable<boolean>;
  text: Observable<string>;
  status: Observable<string>;
  cancel = false;
  intervalID = 0;
  foundRange: Range | null = null;

  constructor(public viewer: Viewer, public navigation: Navigation) {
    this.opened = ko.observable();
    this.text = ko.observable("");
    this.status = ko.observable(FindStatus.Default);

    this.text.subscribe((text: string) => {
      if (text != "") {
        urlParameters.setParameter(
          "find",
          stringUtil.percentEncodeAmpersandAndUnencodedPercent(text),
        );
      } else {
        urlParameters.removeParameter("find");
      }
    });
  }

  toggle = (): boolean => {
    if (this.opened()) {
      return this.close();
    } else {
      return this.open();
    }
  };

  open = (): boolean => {
    if (this.navigation.isFindBoxDisabled()) {
      return false;
    }
    this.opened(true);
    window.setTimeout(() => {
      document.getElementById("vivliostyle-find-box").focus();
    }, 0);
    return true;
  };

  close = (): boolean => {
    if (this.navigation.isFindBoxDisabled()) {
      return false;
    }
    this.opened(false);
    if (this.status() === FindStatus.Searching) {
      this.cancel = true;
    }
    this.status(FindStatus.Default);
    this.foundRange = null;
    this.fixHighlight();
    return true;
  };

  findPrevious = (): boolean => {
    return this.findSub(true);
  };

  findNext = (): boolean => {
    return this.findSub(false);
  };

  private findSub(backwards: boolean): boolean {
    if (
      this.navigation.isFindBoxDisabled() ||
      this.status() === FindStatus.Searching
    ) {
      return false;
    }
    if (this.intervalID) {
      window.clearInterval(this.intervalID);
      this.intervalID = 0;
      return true;
    }
    const text = this.text();
    if (!text) {
      return false;
    }
    const currentEPage = this.viewer.epage();
    let epage = -1;
    let afterWrappedAround = false;
    this.status(FindStatus.Searching);

    this.intervalID = window.setInterval(() => {
      if (this.cancel) {
        this.cancel = false;
        this.status(FindStatus.Default);
        window.clearInterval(this.intervalID);
        this.intervalID = 0;
        return;
      }
      if (epage === this.viewer.epage()) {
        // page not changed yet, then continue
        return;
      }
      epage = this.viewer.epage();
      if (afterWrappedAround || epage !== currentEPage) {
        window.getSelection().empty();
      }
      const found = this.findText(text, backwards);
      if (found) {
        this.status(FindStatus.Found);
        window.clearInterval(this.intervalID);
        this.intervalID = 0;
        return;
      }
      if (
        !afterWrappedAround &&
        (backwards ? this.viewer.firstPage() : this.viewer.lastPage())
      ) {
        afterWrappedAround = true;
        if (this.viewer.firstPage() && this.viewer.lastPage()) {
          epage = -1;
        } else if (backwards) {
          this.viewer.navigateToLast();
        } else {
          this.viewer.navigateToFirst();
        }
      } else if (
        !afterWrappedAround ||
        (backwards ? epage > currentEPage : epage < currentEPage)
      ) {
        if (backwards) {
          this.viewer.navigateToPrevious();
        } else {
          this.viewer.navigateToNext();
        }
      } else {
        this.status(FindStatus.NotFound);
        window.clearInterval(this.intervalID);
        this.intervalID = 0;
        return;
      }
    }, 4);

    return true;
  }

  private findText(text: string, backwards: boolean): boolean {
    const selection = window.getSelection();
    if (selection.type !== "Range") {
      selection.empty();
    }
    const windowF = window as WindowWithFind;
    const findBoxElem = document.getElementById("vivliostyle-menu-find-box");
    findBoxElem.style.visibility = "hidden";
    if (this.foundRange && selection.rangeCount === 0) {
      // Restore selection. This is needed because on iOS the selection is
      // cleared by touching the Find Next/Previous button in the Find box.
      selection.addRange(this.foundRange);
      this.foundRange = null;
      this.fixHighlight();
    }
    const found = windowF.find(text, false, backwards);
    findBoxElem.style.visibility = "";

    if (found) {
      // Check if the found range is in the page content excluding generated page margin box content.
      if (selection.anchorNode?.parentElement?.closest("[data-adapt-eloff]")) {
        this.foundRange = selection.getRangeAt(0);
        this.fixHighlight();
        return true;
      } else {
        return this.findText(text, backwards);
      }
    }
    return false;
  }

  private fixHighlight(): void {
    // Workaround for the WebKit bug on iOS:
    // Selection highlight not shown on programmatic focus after initial load
    // https://bugs.webkit.org/show_bug.cgi?id=199211

    if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // No problem on non-iOS.
      return;
    }

    const oldHighlightElements = document.querySelectorAll(
      "[data-viv-found-highlight='true']",
    );
    for (const oldHighlightElement of oldHighlightElements) {
      oldHighlightElement.remove();
    }
    if (!this.foundRange) {
      return;
    }
    const parent = this.foundRange.startContainer.parentElement.closest(
      "[data-vivliostyle-page-container='true']",
    );
    const parentRect = scaleRect(parent.getBoundingClientRect());
    for (const clientRect of this.foundRange.getClientRects()) {
      const rect = applyTransformToRect(scaleRect(clientRect), parentRect);
      const highlightElement = document.createElement("div");
      highlightElement.setAttribute("data-viv-found-highlight", "true");
      highlightElement.style.position = "absolute";
      highlightElement.style.left = `${rect.left}px`;
      highlightElement.style.top = `${rect.top}px`;
      highlightElement.style.width = `${rect.width}px`;
      highlightElement.style.height = `${rect.height}px`;
      highlightElement.style.backgroundColor = "#0080ff33";
      parent.appendChild(highlightElement);
    }
  }

  /**
   * @returns true if the key remains unconsumed
   */
  handleKey(
    key: string,
    event: KeyboardEvent,
    findBoxActive: boolean,
  ): boolean {
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    switch (key) {
      case Keys.Escape:
        if (ctrlOrMeta || !this.opened()) {
          return true;
        }
        if (this.status() === FindStatus.Searching) {
          this.cancel = true;
          return false;
        }
        if (findBoxActive && this.text() !== "") {
          this.text("");
          this.status(FindStatus.Default);
          return false;
        }
        if (this.close()) {
          return false;
        }
        break;
      case "Enter":
        if (ctrlOrMeta || !this.opened()) {
          return true;
        }
        if (findBoxActive) {
          document.getElementById("vivliostyle-find-box").blur();
        }
        if (event.shiftKey ? this.findPrevious() : this.findNext()) {
          return false;
        }
        break;
      case "f":
      case "F":
        if (!ctrlOrMeta) {
          return true;
        }
        if (this.open()) {
          return false;
        }
        break;
      default:
        this.status(FindStatus.Default);
    }
    return true;
  }
}

export default FindBox;
