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

import PageSize from "../../../src/js/models/page-size";
import DocumentOptions from "../../../src/js/models/document-options";
import ViewerOptions from "../../../src/js/models/viewer-options";
import SettingsPanel from "../../../src/js/viewmodels/settings-panel";

describe("SettingsPanel", function() {
    var documentOptions;
    var viewerOptions;
    var viewer;
    var settingsPanel;

    beforeEach(function() {
        documentOptions = new DocumentOptions();
        documentOptions.pageSize.customWidth("100mm");
        viewerOptions = new ViewerOptions();
        viewerOptions.spreadView(true);
        viewerOptions.fontSize(10);
        viewer = {loadDocument: function() {}};

        settingsPanel = new SettingsPanel(viewerOptions, documentOptions, viewer);
    });

    describe("constructor", function() {
        it("stores the options to 'state' property", function() {
            expect(settingsPanel.state.viewerOptions.spreadView()).toBe(true);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
            expect(settingsPanel.state.pageSize.customWidth()).toBe("100mm");
        });
    });

    describe("toggle", function() {
        it("toggles 'opened' property", function() {
            expect(settingsPanel.opened()).toBe(false);

            settingsPanel.toggle();

            expect(settingsPanel.opened()).toBe(true);

            settingsPanel.toggle();

            expect(settingsPanel.opened()).toBe(false);
        });
    });

    describe("apply", function() {
        it("writes parameters from this.state.viewerOptions to the original ViewerOptions if the page size is not changed", function() {
            settingsPanel.state.viewerOptions.spreadView(false);
            settingsPanel.state.viewerOptions.fontSize(20);

            expect(viewerOptions.spreadView()).toBe(true);
            expect(viewerOptions.fontSize()).toBe(10);

            settingsPanel.apply();

            expect(viewerOptions.spreadView()).toBe(false);
            expect(viewerOptions.fontSize()).toBe(20);
        });

        it("writes parameters from this.state.pageSize to the original DocumentOptions and call viewer.loadDocument if the page size is changed", function() {
            settingsPanel.state.viewerOptions.spreadView(false);
            settingsPanel.state.viewerOptions.fontSize(20);
            settingsPanel.state.pageSize.mode(PageSize.Mode.PRESET);

            expect(documentOptions.pageSize.mode()).toBe(PageSize.Mode.AUTO);

            spyOn(viewer, "loadDocument");
            settingsPanel.apply();

            expect(viewerOptions.spreadView()).toBe(true);
            expect(viewerOptions.fontSize()).toBe(10);
            expect(documentOptions.pageSize.mode()).toBe(PageSize.Mode.PRESET);
            expect(viewer.loadDocument).toHaveBeenCalledWith(documentOptions, settingsPanel.state.viewerOptions);
        })
    });

    describe("reset", function() {
        it("writes parameters from the original ViewerOptions to this.state.viewerOptions", function() {
            settingsPanel.state.viewerOptions.spreadView(false);
            settingsPanel.state.viewerOptions.fontSize(20);
            settingsPanel.state.pageSize.mode(PageSize.Mode.PRESET);

            settingsPanel.reset();

            expect(settingsPanel.state.viewerOptions.spreadView()).toBe(true);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
            expect(settingsPanel.state.pageSize.mode()).toBe(PageSize.Mode.AUTO);
        });
    });
});
