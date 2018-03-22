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

import ko from "knockout";
import PageSize from "../../../src/js/models/page-size";
import DocumentOptions from "../../../src/js/models/document-options";
import ViewerOptions from "../../../src/js/models/viewer-options";
import PageViewMode from "../../../src/js/models/page-view-mode";
import SettingsPanel from "../../../src/js/viewmodels/settings-panel";

describe("SettingsPanel", function() {
    var documentOptions;
    var viewerOptions;
    var viewer;
    var messageDialog;

    var defaultSettingsPanelOptions = {
        disablePageSizeChange: false,
        disablePageViewModeChange: false
    };

    beforeEach(function() {
        documentOptions = new DocumentOptions();
        documentOptions.pageSize.customWidth("100mm");
        viewerOptions = new ViewerOptions();
        viewerOptions.pageViewMode(PageViewMode.SPREAD);
        viewerOptions.fontSize(10);
        viewer = {loadDocument: function() {}};
        messageDialog = {visible: ko.observable(false)};
    });

    function createSettingsPanel(options) {
        return new SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog,
            options || defaultSettingsPanelOptions);
    }

    describe("constructor", function() {
        it("stores the options to 'state' property", function() {
            var settingsPanel = createSettingsPanel();

            expect(settingsPanel.state.viewerOptions.pageViewMode()).toBe(PageViewMode.SPREAD);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
            expect(settingsPanel.state.pageSize.customWidth()).toBe("100mm");
        });
    });

    describe("toggle", function() {
        it("toggles 'opened' property", function() {
            var settingsPanel = createSettingsPanel();

            expect(settingsPanel.opened()).toBe(false);

            settingsPanel.toggle();

            expect(settingsPanel.opened()).toBe(true);

            settingsPanel.toggle();

            expect(settingsPanel.opened()).toBe(false);
        });
    });

    it("closes when the error dialog is visible", function() {
        var settingsPanel = createSettingsPanel();
        settingsPanel.toggle();

        expect(settingsPanel.opened()).toBe(true);

        messageDialog.visible(true);

        expect(settingsPanel.opened()).toBe(false);
    });

    describe("apply", function() {
        it("writes parameters from this.state.viewerOptions to the original ViewerOptions if the page size is not changed", function() {
            var settingsPanel = createSettingsPanel();
            settingsPanel.state.viewerOptions.pageViewMode(PageViewMode.SINGLE_PAGE);
            settingsPanel.state.viewerOptions.fontSize(20);

            expect(viewerOptions.pageViewMode()).toBe(PageViewMode.SPREAD);
            expect(viewerOptions.fontSize()).toBe(10);

            settingsPanel.apply();

            expect(viewerOptions.pageViewMode()).toBe(PageViewMode.SINGLE_PAGE);
            expect(viewerOptions.fontSize()).toBe(20);
        });

        it("writes parameters from this.state.pageSize to the original DocumentOptions and call viewer.loadDocument if the page size is changed", function() {
            var settingsPanel = createSettingsPanel();
            settingsPanel.state.viewerOptions.pageViewMode(PageViewMode.SINGLE_PAGE);
            settingsPanel.state.viewerOptions.fontSize(20);
            settingsPanel.state.pageSize.mode(PageSize.Mode.PRESET);

            expect(documentOptions.pageSize.mode()).toBe(PageSize.Mode.AUTO);

            spyOn(viewer, "loadDocument");
            settingsPanel.apply();

            expect(viewerOptions.pageViewMode()).toBe(PageViewMode.SPREAD);
            expect(viewerOptions.fontSize()).toBe(10);
            expect(documentOptions.pageSize.mode()).toBe(PageSize.Mode.PRESET);
            expect(viewer.loadDocument).toHaveBeenCalledWith(documentOptions, settingsPanel.state.viewerOptions);
        });
    });

    describe("reset", function() {
        it("writes parameters from the original ViewerOptions to this.state.viewerOptions", function() {
            var settingsPanel = createSettingsPanel();
            settingsPanel.state.viewerOptions.pageViewMode(PageViewMode.SINGLE_PAGE);
            settingsPanel.state.viewerOptions.fontSize(20);
            settingsPanel.state.pageSize.mode(PageSize.Mode.PRESET);

            settingsPanel.reset();

            expect(settingsPanel.state.viewerOptions.pageViewMode()).toBe(PageViewMode.SPREAD);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
            expect(settingsPanel.state.pageSize.mode()).toBe(PageSize.Mode.AUTO);
        });
    });

    describe("UI disabled flags", function() {
        it("all flags are false by default", function() {
            var settingsPanel = createSettingsPanel();

            expect(settingsPanel.isPageSizeChangeDisabled).toBe(false);
            expect(settingsPanel.isOverrideDocumentStyleSheetDisabled).toBe(false);
            expect(settingsPanel.isPageViewModeChangeDisabled).toBe(false);
        });

        it("page size change and 'override document style sheet' are disabled by disablePageSizeChange=true in settingsPanelOptions", function() {
            var settingsPanel = createSettingsPanel({disablePageSizeChange: true});

            expect(settingsPanel.isPageSizeChangeDisabled).toBe(true);
            expect(settingsPanel.isOverrideDocumentStyleSheetDisabled).toBe(true);
            expect(settingsPanel.isPageViewModeChangeDisabled).toBe(false);
        });

        it("page view mode change is disabled by disablePageViewModeChangeChange=true in settingsPanelOptions", function() {
            var settingsPanel = createSettingsPanel({disablePageViewModeChange: true});

            expect(settingsPanel.isPageSizeChangeDisabled).toBe(false);
            expect(settingsPanel.isOverrideDocumentStyleSheetDisabled).toBe(false);
            expect(settingsPanel.isPageViewModeChangeDisabled).toBe(true);
        });
    });
});
