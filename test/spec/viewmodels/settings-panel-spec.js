import ViewerOptions from "../../../src/js/models/viewer-options";
import SettingsPanel from "../../../src/js/viewmodels/settings-panel";

describe("SettingsPanel", function() {
    var options;
    var settingsPanel;

    beforeEach(function() {
        options = new ViewerOptions();
        options.spreadView(true);
        options.fontSize(10);
        settingsPanel = new SettingsPanel(options);
    });

    describe("constructor", function() {
        it("stores the options to 'state' property", function() {
            expect(settingsPanel.state.viewerOptions.spreadView()).toBe(true);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
        });
    });

    describe("toggle", function() {
        it("toggles 'opened' property", function() {
            var panel = new SettingsPanel();

            expect(panel.opened()).toBe(false);

            panel.toggle();

            expect(panel.opened()).toBe(true);

            panel.toggle();

            expect(panel.opened()).toBe(false);
        });
    });

    describe("apply", function() {
        it("writes parameters from this.state.viewerOptions to the original ViewerOptions", function() {
            settingsPanel.state.viewerOptions.spreadView(false);
            settingsPanel.state.viewerOptions.fontSize(20);

            expect(options.spreadView()).toBe(true);
            expect(options.fontSize()).toBe(10);

            settingsPanel.apply();

            expect(options.spreadView()).toBe(false);
            expect(options.fontSize()).toBe(20);
        });
    });

    describe("reset", function() {
        it("writes parameters from the original ViewerOptions to this.state.viewerOptions", function() {
            settingsPanel.state.viewerOptions.spreadView(false);
            settingsPanel.state.viewerOptions.fontSize(20);

            settingsPanel.reset();

            expect(settingsPanel.state.viewerOptions.spreadView()).toBe(true);
            expect(settingsPanel.state.viewerOptions.fontSize()).toBe(10);
        });
    });
});
