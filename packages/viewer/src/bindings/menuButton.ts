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

ko.bindingHandlers.menuButton = {
  init(element, valueAccessor): void {
    if (ko.unwrap(valueAccessor())) {
      if (supportTouchEvents) {
        element.addEventListener("touchstart", () => {
          ko.utils.toggleDomNodeCssClass(element, "hover active", true);
        });
        element.addEventListener("touchend", () => {
          ko.utils.toggleDomNodeCssClass(element, "hover active", false);
        });
      } else {
        element.addEventListener("mouseover", () => {
          ko.utils.toggleDomNodeCssClass(element, "hover", true);
        });
        element.addEventListener("mousedown", () => {
          ko.utils.toggleDomNodeCssClass(element, "active", true);
        });
        element.addEventListener("mouseup", () => {
          ko.utils.toggleDomNodeCssClass(element, "active", false);
        });
        element.addEventListener("mouseout", () => {
          ko.utils.toggleDomNodeCssClass(element, "hover", false);
          ko.utils.toggleDomNodeCssClass(element, "active", false);
          window.getSelection().removeAllRanges(); // prevent unwanted text selection
        });
      }
    }
  },
};
