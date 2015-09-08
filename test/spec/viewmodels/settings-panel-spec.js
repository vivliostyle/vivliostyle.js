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
