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
ko.bindingHandlers.textSelection = {
  init(element, valueAccessor): void {
    if (ko.unwrap(valueAccessor())) {
      if (supportTouchEvents) {
        element.addEventListener("touchend", () => {
          console.log(document.getSelection());
        });
      } else {
        element.addEventListener("mouseup", () => {
          console.log(document.getSelection());
        });
      }
    }
  },
};
