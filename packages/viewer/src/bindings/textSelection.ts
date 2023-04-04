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
    let mousedown = false;
    if (ko.unwrap(valueAccessor())) {
      element.addEventListener("mousedown", () => {
        if (!mousedown && document.getSelection().type !== "Range") {
          mousedown = true;
        }
      });
      element.addEventListener("mouseup", () => {
        if (mousedown) {
          if (marksStore.enabled()) {
            processSelection(document.getSelection());
          }
          mousedown = false;
        }
      });
      document.addEventListener("selectionchange", () => {
        if (!marksStore.enabled()) return;
        if (document.activeElement.id !== "vivliostyle-viewer-viewport") return;

        if (!mousedown && document.getSelection().type === "Range") {
          // For touch devices
          if (marksMenuStatus.menuOpened()) {
            marksMenuStatus.applyEditing();
          }
          if (marksMenuStatus.startButtonOpened()) {
            marksMenuStatus.startButtonOpened(false);
          }
          processSelection(document.getSelection());
        }
      });
    }
  },
};
