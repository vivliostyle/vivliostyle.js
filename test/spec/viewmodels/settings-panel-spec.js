import SettingsPanel from "../../../src/js/viewmodels/settings-panel";

describe("SettingsPanel", function() {
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
});
