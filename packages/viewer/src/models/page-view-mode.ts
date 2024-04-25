/*
 * Copyright 2016 Daishinsha Inc.
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

import { PageViewMode as CorePageViewMode } from "@vivliostyle/core";

export class PageViewModeInstance {
  toSpreadViewString(): string {
    switch (this) {
      case PageViewMode.SPREAD:
        return "true";
      case PageViewMode.SINGLE_PAGE:
        return "false";
      case PageViewMode.AUTO_SPREAD:
        return "auto";
      default:
        throw new Error("Invalid PageViewMode");
    }
  }
  toString(): string {
    switch (this) {
      case PageViewMode.SPREAD:
        return "spread"; // vivliostyle.viewer.PageViewMode.SPREAD;
      case PageViewMode.SINGLE_PAGE:
        return "singlePage"; // vivliostyle.viewer.PageViewMode.SINGLE_PAGE;
      case PageViewMode.AUTO_SPREAD:
        return "autoSpread"; // vivliostyle.viewer.PageViewMode.AUTO_SPREAD;
      default:
        throw new Error("Invalid PageViewMode");
    }
  }
}

const PageViewMode = {
  AUTO_SPREAD: new PageViewModeInstance(),
  SINGLE_PAGE: new PageViewModeInstance(),
  SPREAD: new PageViewModeInstance(),
  defaultMode(): CorePageViewMode {
    return this.AUTO_SPREAD;
  },
  fromSpreadViewString(str: string): CorePageViewMode {
    switch (str) {
      case "true":
        return this.SPREAD;
      case "false":
        return this.SINGLE_PAGE;
      case "auto":
      default:
        return this.AUTO_SPREAD;
    }
  },
  of(name: string): CorePageViewMode {
    switch (name) {
      case CorePageViewMode.SPREAD:
        return this.SPREAD;
      case CorePageViewMode.SINGLE_PAGE:
        return this.SINGLE_PAGE;
      case CorePageViewMode.AUTO_SPREAD:
        return this.AUTO_SPREAD;
      default:
        throw new Error(`Invalid PageViewMode name: ${name}`);
    }
  },
};

export default PageViewMode;
