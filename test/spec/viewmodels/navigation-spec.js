import ko from "knockout";
import ViewerOptions from "../../../src/js/models/viewer-options";
import Navigation from "../../../src/js/viewmodels/navigation";

describe("Navigation", function() {
    describe("isDisabled", function() {
        it("is true iff viewer.state.navigatable is false", function() {
            var viewer = {state: {navigatable: ko.observable(false)}};
            var navigation = new Navigation(null, viewer);

            expect(navigation.isDisabled()).toBe(true);

            var isDisabled = true;
            navigation.isDisabled.subscribe(function(value) {
                isDisabled = value;
            });
            viewer.state.navigatable(true);

            expect(isDisabled).toBe(false);
        });
    });

    describe("increaseFontSize", function() {
        var navigation;
        var viewerOptions;

        beforeEach(function() {
            viewerOptions = new ViewerOptions();
            navigation = new Navigation(viewerOptions);
        });

        it("increases font size stored in ViewerOptions model", function() {
            var fontSize = viewerOptions.fontSize();
            navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25);

            navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25 * 1.25);
        });

        it("decreases font size stored in ViewerOptions model", function() {
            var fontSize = viewerOptions.fontSize();
            navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8);

            navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8 * 0.8);
        });
    })
});
