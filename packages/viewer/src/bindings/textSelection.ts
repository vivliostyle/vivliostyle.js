/*
 * Copyright 2023 Vivliostyle Foundation
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

import ko from "knockout";
import {
  marksMenuStatus,
  marksStore,
  processSelection,
} from "../viewmodels/marks-store";

ko.bindingHandlers.textSelection = {
  init(element, valueAccessor): void {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let mousedown = false;
    if (ko.unwrap(valueAccessor())) {
      element.addEventListener("mousedown", () => {
        if (!mousedown && document.getSelection().type !== "Range") {
          mousedown = true;
        }
      });
      document.addEventListener("mouseup", () => {
        if (mousedown) {
          if (marksStore.enabled()) {
            processSelection(document.getSelection());
          }
          mousedown = false;
        }
      });

      const pageNavLeft = document.getElementById(
        "vivliostyle-page-navigation-left",
      );
      const pageNavRight = document.getElementById(
        "vivliostyle-page-navigation-right",
      );
      if (pageNavLeft && pageNavRight) {
        // Prevent wrong text selection touching page-left/right navigation buttons
        pageNavLeft.onpointermove = pageNavRight.onpointermove = (): boolean =>
          false;
        pageNavLeft.ontouchmove = pageNavRight.ontouchmove = (): boolean =>
          false;
      }
      let timeoutID = 0;

      document.addEventListener("selectionchange", () => {
        const selection = document.getSelection();
        if (selection.type !== "Range") {
          return;
        }
        const range = selection.getRangeAt(0);
        const pageArea = range.commonAncestorContainer.parentElement.closest(
          "[data-vivliostyle-page-box] > div",
        ) as HTMLElement;
        const zIndex = pageArea?.style.zIndex;

        // To prevent wrong text selection
        // - minimize page-left/right navigation buttons
        // - increase z-index of pageArea
        if (!timeoutID) {
          if (pageNavLeft && pageNavRight) {
            if (iOS) {
              // On iOS, `.ontouchmove = () => false` does not work to prevent
              // wrong text selection, so we need to hide navigation buttons.
              pageNavLeft.style.display = "none";
              pageNavRight.style.display = "none";
            } else {
              pageNavLeft.style.height = "min-content";
              pageNavRight.style.height = "min-content";
            }
          }
          if (pageArea && zIndex === "0") {
            pageArea.style.zIndex = "1";
          }
          timeoutID = window.setTimeout(() => {
            // Restore changed styles after 1 second
            if (pageNavLeft && pageNavRight) {
              pageNavLeft.style.display = "";
              pageNavRight.style.display = "";
              pageNavLeft.style.height = "";
              pageNavRight.style.height = "";
            }
            if (pageArea) {
              pageArea.style.zIndex = zIndex;
            }
            timeoutID = 0;
          }, 1000);
        }

        if (!mousedown && marksStore.enabled()) {
          // For touch devices
          if (marksMenuStatus.menuOpened()) {
            marksMenuStatus.applyEditing();
          }
          if (marksMenuStatus.startButtonOpened()) {
            marksMenuStatus.startButtonOpened(false);
          }
          processSelection(selection);
        }
      });
    }
  },
};
