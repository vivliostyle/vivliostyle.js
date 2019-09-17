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

import ZoomOptions from "../../../src/js/models/zoom-options";
import vivliostyleMock from "../../mock/models/vivliostyle";

describe("ZoomOptions", () => {
    vivliostyleMock();

    const viewer = {
        queryZoomFactor() {
            return 2;
        }
    };

    describe("#createDefaultOptions", () => {
        it("create a default zoom options.", () => {
            const options = ZoomOptions.createDefaultOptions();
            expect(options.zoom).toBe(1);
            expect(options.fitToScreen).toBe(true);
        });
    });

    describe("FitToScreen", () => {
        describe("#zoomIn", () => {
            it("returns a zoom options that has decreased zoom factor stored in viewer.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomIn(viewer);
                expect(options.zoom).toBe(2.5);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#zoomOut", () => {
            it("returns a zoom options that has increased zoom factor stored in viewer.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomOut(viewer);
                expect(options.zoom).toBe(1.6);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#zoomToActualSize", () => {
            it("returns a zoom options to display the document at actual size.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomToActualSize();
                expect(options.zoom).toBe(1);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#toggleFitToScreen", () => {
            it("returns a zoom options to display the document at actual size.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.toggleFitToScreen();
                expect(options.zoom).toBe(1);
                expect(options.fitToScreen).toBe(false);
            });
        });
    });

    describe("FixedZoomFactor", () => {
        describe("#zoomIn", () => {
            it("returns a zoom options that has decreased zoom factor stored in options.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomToActualSize();
                options = options.zoomIn(viewer);
                expect(options.zoom).toBe(1.25);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#zoomOut", () => {
            it("returns a zoom options that has increased zoom factor stored in options.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomToActualSize();
                options = options.zoomOut(viewer);
                expect(options.zoom).toBe(0.8);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#zoomToActualSize", () => {
            it("returns a zoom options to display the document at actual size.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomToActualSize();
                options = options.zoomToActualSize();
                expect(options.zoom).toBe(1);
                expect(options.fitToScreen).toBe(false);
            });
        });
        describe("#toggleFitToScreen", () => {
            it("returns a zoom options to fit the document to screen size.", () => {
                let options = ZoomOptions.createDefaultOptions();
                options = options.zoomToActualSize();
                options = options.toggleFitToScreen();
                expect(options.zoom).toBe(1);
                expect(options.fitToScreen).toBe(true);
            });
        });
    });
});
