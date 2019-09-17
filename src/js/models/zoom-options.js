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

class ZoomOptions {
    constructor(zoom) {
        this.zoom = zoom;
    }
    zoomIn(viewer) {
        return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
    }
    zoomOut(viewer) {
        return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
    }
    zoomToActualSize() {
        return new FixedZoomFactor(1);
    }
    static createDefaultOptions() {
        return new FitToScreen();
    }
    static createFromZoomFactor(zoom) {
        return new FixedZoomFactor(zoom);
    }
}

class FitToScreen extends ZoomOptions {
    constructor() {
        super(1);
    }
    get fitToScreen() {
        return true;
    }
    toggleFitToScreen() {
        return new FixedZoomFactor(1);
    }
    getCurrentZoomFactor(viewer) {
        return viewer.queryZoomFactor(vivliostyle.viewer.ZoomType.FIT_INSIDE_VIEWPORT);
    }
}
class FixedZoomFactor extends ZoomOptions {
    get fitToScreen() {
        return false;
    }
    toggleFitToScreen() {
        return new FitToScreen();
    }
    getCurrentZoomFactor(viewer) {
        return this.zoom;
    }
}

export default ZoomOptions;
