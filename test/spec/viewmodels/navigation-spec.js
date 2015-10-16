/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import ko from "knockout";
import vivliostyle from "../../../src/js/models/vivliostyle";
import ViewerOptions from "../../../src/js/models/viewer-options";
import Navigation from "../../../src/js/viewmodels/navigation";
import vivliostyleMock from "../../mock/models/vivliostyle";

describe("Navigation", function() {
    var navigation;
    var viewerOptions;
    var viewer;
    var settingsPanel;

    vivliostyleMock();

    beforeEach(function() {
        viewerOptions = new ViewerOptions();
        viewer = {
            state: {navigatable: ko.observable(false)},
            navigateToPrevious: function() {},
            navigateToNext: function() {},
            navigateToLeft: function() {},
            navigateToRight: function() {},
            navigateToFirst: function() {},
            navigateToLast: function() {},
            queryZoomFactor: function() {}
        };
        settingsPanel = {opened: ko.observable(false)};
        navigation = new Navigation(viewerOptions, viewer, settingsPanel);
    });

    function setDisabled(val) {
        viewer.state.navigatable(!val);
    }

    describe("isDisabled", function() {
        it("is true if viewer.state.navigatable is false", function() {
            expect(navigation.isDisabled()).toBe(true);

            var isDisabled = true;
            navigation.isDisabled.subscribe(function(value) {
                isDisabled = value;
            });
            viewer.state.navigatable(true);

            expect(isDisabled).toBe(false);
        });

        it("is true if settingsPanel.opened is true", function() {
            viewer.state.navigatable(true);

            expect(navigation.isDisabled()).toBe(false);

            settingsPanel.opened(true);

            expect(navigation.isDisabled()).toBe(true);
        });
    });

    describe("navigateToPrevious", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToPrevious");
        });

        it("calls viewer's navigateToPrevious and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToPrevious();

            expect(viewer.navigateToPrevious).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToPrevious();

            expect(viewer.navigateToPrevious).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("navigateToNext", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToNext");
        });

        it("calls viewer's navigateToNext and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToNext();

            expect(viewer.navigateToNext).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToNext();

            expect(viewer.navigateToNext).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("navigateToLeft", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToLeft");
        });

        it("calls viewer's navigateToLeft and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToLeft();

            expect(viewer.navigateToLeft).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToLeft();

            expect(viewer.navigateToLeft).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("navigateToRight", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToRight");
        });

        it("calls viewer's navigateToRight and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToRight();

            expect(viewer.navigateToRight).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToRight();

            expect(viewer.navigateToRight).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("navigateToFirst", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToFirst");
        });

        it("calls viewer's navigateToFirst and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToFirst();

            expect(viewer.navigateToFirst).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToFirst();

            expect(viewer.navigateToFirst).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("navigateToLast", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToLast");
        });

        it("calls viewer's navigateToLast and returns true", function() {
            setDisabled(false);
            var ret = navigation.navigateToLast();

            expect(viewer.navigateToLast).toHaveBeenCalled();
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var ret = navigation.navigateToLast();

            expect(viewer.navigateToLast).not.toHaveBeenCalled();
            expect(ret).toBe(false);
        });
    });

    describe("zoomIn", function() {
        it("increases zoom factor stored in ViewerOptions model and returns true", function () {
            setDisabled(false);
            var zoom = viewerOptions.zoom();
            var ret = navigation.zoomIn();

            expect(viewerOptions.zoom()).toBe(zoom * 1.25);
            expect(ret).toBe(true);

            ret = navigation.zoomIn();

            expect(viewerOptions.zoom()).toBe(zoom * 1.25 * 1.25);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var zoom = viewerOptions.zoom();
            var ret = navigation.zoomIn();

            expect(viewerOptions.zoom()).toBe(zoom);
            expect(ret).toBe(false);
        });
    });

    describe("zoomOut", function() {
        it("decreases zoom factor stored in ViewerOptions model and returns true", function() {
            setDisabled(false);
            var zoom = viewerOptions.zoom();
            var ret = navigation.zoomOut();

            expect(viewerOptions.zoom()).toBe(zoom * 0.8);
            expect(ret).toBe(true);

            ret = navigation.zoomOut();

            expect(viewerOptions.zoom()).toBe(zoom * 0.8 * 0.8);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var zoom = viewerOptions.zoom();
            var ret = navigation.zoomOut();

            expect(viewerOptions.zoom()).toBe(zoom);
            expect(ret).toBe(false);
        });
    });

    describe("zoomDefault", function() {
        beforeEach(function() {
            spyOn(viewer, "queryZoomFactor").and.returnValue(1.2);
        });

        it("query zoom factor for 'fit inside viewport' to the viewer and set returned zoom factor in ViewerOptions model and returns true", function() {
            setDisabled(false);
            viewerOptions.zoom(1);
            var ret = navigation.zoomDefault();

            expect(viewer.queryZoomFactor).toHaveBeenCalledWith("fit inside viewport");
            expect(viewerOptions.zoom()).toBe(1.2);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            viewerOptions.zoom(1);
            var ret = navigation.zoomDefault();

            expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
            expect(viewerOptions.zoom()).toBe(1);
            expect(ret).toBe(false);
        });

        it("if force=true is specified, do the zoom even if navigation is disabled", function() {
            setDisabled(true);
            viewerOptions.zoom(1);

            // if the argument not equals to 'true' (compared using ===), do nothing
            var ret = navigation.zoomDefault({});

            expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
            expect(viewerOptions.zoom()).toBe(1);
            expect(ret).toBe(false);

            ret = navigation.zoomDefault(true);

            expect(viewer.queryZoomFactor).toHaveBeenCalledWith(vivliostyle.viewer.ZoomType.FIT_INSIDE_VIEWPORT);
            expect(viewerOptions.zoom()).toBe(1.2);
            expect(ret).toBe(true);
        });
    });

    describe("increaseFontSize", function() {
        it("increases font size stored in ViewerOptions model and returns true", function () {
            setDisabled(false);
            var fontSize = viewerOptions.fontSize();
            var ret = navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25);
            expect(ret).toBe(true);

            ret = navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25 * 1.25);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var fontSize = viewerOptions.fontSize();
            var ret = navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
            expect(ret).toBe(false);
        });
    });

    describe("decreaseFontSize", function() {
        it("decreases font size stored in ViewerOptions model and returns true", function() {
            setDisabled(false);
            var fontSize = viewerOptions.fontSize();
            var ret = navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8);
            expect(ret).toBe(true);

            ret = navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8 * 0.8);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var fontSize = viewerOptions.fontSize();
            var ret = navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
            expect(ret).toBe(false);
        });
    });

    describe("defaultFontSize", function() {
        it("set font size stored in ViewerOptions model to default and returns true", function() {
            setDisabled(false);
            var fontSize = ViewerOptions.getDefaultValues().fontSize;
            viewerOptions.fontSize(20);
            var ret = navigation.defaultFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
            expect(ret).toBe(true);

            viewerOptions.fontSize(20);
            ret = navigation.defaultFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
            expect(ret).toBe(true);
        });

        it("do nothing and returns false when navigation is disabled", function() {
            setDisabled(true);
            var fontSize = 20;
            viewerOptions.fontSize(20);
            var ret = navigation.defaultFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
            expect(ret).toBe(false);
        });
    });
});
