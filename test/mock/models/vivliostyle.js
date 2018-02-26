/*
 * Copyright 2015 Trim-marks Inc.
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

import vivliostyle from "../../../src/js/models/vivliostyle";

export default function() {
    beforeAll(function() {
        vivliostyle.setInstance({
            viewer: {
                PageViewMode: {
                    SINGLE_PAGE: "singlePage",
                    SPREAD: "spread",
                    AUTO_SPREAD: "autoSpread"
                },
                ZoomType: {
                    FIT_INSIDE_VIEWPORT: "fit inside viewport"
                }
            },
            constants: null
        });
    });

    afterAll(function() {
        vivliostyle.setInstance({
            viewer: null,
            constants: null
        });
    });
}
