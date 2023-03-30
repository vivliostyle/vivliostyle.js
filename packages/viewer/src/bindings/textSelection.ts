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
import { marksMenuStatus, processSelection } from "../viewmodels/marks-store";

ko.bindingHandlers.textSelection = {
  init(element, valueAccessor): void {
    if (ko.unwrap(valueAccessor())) {
      element.addEventListener("mouseup", (e: MouseEvent) => {
        e.stopPropagation();
        processSelection(document.getSelection());
      });
      document.addEventListener("selectionchange", () => {
        if (document.getSelection().type != "Range") {
          setTimeout(() => {
            marksMenuStatus.startButtonOpened(false);
          }, 150);
        }
      });
    }
  },
};
