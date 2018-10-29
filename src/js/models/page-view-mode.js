/*
 * Copyright 2016 Trim-marks Inc.
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

import vivliostyle from "../models/vivliostyle";

class PageViewModeInstance {
    toSpreadViewString() {
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
    toString() {
        switch (this) {
            case PageViewMode.SPREAD:
                return "spread";     // vivliostyle.viewer.PageViewMode.SPREAD;
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
    defaultMode() {
        return this.AUTO_SPREAD;
    },
    fromSpreadViewString(str) {
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
    of(name) {
        switch (name) {
            case vivliostyle.viewer.PageViewMode.SPREAD:
                return this.SPREAD;
            case vivliostyle.viewer.PageViewMode.SINGLE_PAGE:
                return this.SINGLE_PAGE;
            case vivliostyle.viewer.PageViewMode.AUTO_SPREAD:
                return this.AUTO_SPREAD;
            default:
                throw new Error(`Invalid PageViewMode name: ${name}`)
        }
    }
};

export default PageViewMode;
