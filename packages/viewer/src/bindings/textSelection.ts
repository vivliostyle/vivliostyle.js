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

import ko from "knockout";

const supportTouchEvents = "ontouchstart" in window;

const highlightSelection = (selection: Selection, parent: HTMLElement) => {
  if (selection.type == "Range") {
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    for (const rect of rects) {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.margin = "0";
      div.style.padding = "0";
      div.style.top = `${rect.top - parent.offsetTop}px`;
      div.style.left = `${rect.left - parent.offsetLeft}px`;
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;
      div.style.background = "rgba(255, 0, 0, 0.2)";
      parent.appendChild(div);
    }
    selection.empty();
  }
};

ko.bindingHandlers.textSelection = {
  init(element, valueAccessor): void {
    if (ko.unwrap(valueAccessor())) {
      if (supportTouchEvents) {
        element.addEventListener("touchend", () => {
          highlightSelection(document.getSelection(), element);
        });
      } else {
        element.addEventListener("mouseup", () => {
          highlightSelection(document.getSelection(), element);
        });
      }
    }
  },
};
