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

ko.bindingHandlers.clickOutside = {
  init(element, valueAccessor): void {
    const callback = ko.utils.unwrapObservable(valueAccessor());
    document.addEventListener("mousedown", (e: Event) => {
      if (window.getComputedStyle(element).display == "none") {
        return;
      }
      if (!(element.contains(e.target) || element === e.target)) {
        callback();
      }
    });
  },
};
