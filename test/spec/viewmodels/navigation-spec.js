import ko from "knockout";
import ViewerOptions from "../../../src/js/models/viewer-options";
import Navigation from "../../../src/js/viewmodels/navigation";

describe("Navigation", function() {
    var navigation;
    var viewer;
    var viewerOptions;

    beforeEach(function() {
        viewer = {
            state: {navigatable: ko.observable(false)},
            navigateToLeft: function() {},
            navigateToRight: function() {}
        };
        viewerOptions = new ViewerOptions();
        navigation = new Navigation(viewerOptions, viewer);
    });

    function setDisabled(val) {
        viewer.state.navigatable(!val);
    }

    describe("isDisabled", function() {
        it("is true iff viewer.state.navigatable is false", function() {
            expect(navigation.isDisabled()).toBe(true);

            var isDisabled = true;
            navigation.isDisabled.subscribe(function(value) {
                isDisabled = value;
            });
            viewer.state.navigatable(true);

            expect(isDisabled).toBe(false);
        });
    });

    describe("navigateToLeft", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToLeft");
        });

        it("calls viewer's navigateToLeft", function() {
            setDisabled(false);
            navigation.navigateToLeft();

            expect(viewer.navigateToLeft).toHaveBeenCalled();
        });

        it("do nothing when navigation is disabled", function() {
            setDisabled(true);
            navigation.navigateToLeft();

            expect(viewer.navigateToLeft).not.toHaveBeenCalled();
        });
    });

    describe("navigateToRight", function() {
        beforeEach(function() {
            spyOn(viewer, "navigateToRight");
        });

        it("calls viewer's navigateToRight", function() {
            setDisabled(false);
            navigation.navigateToRight();

            expect(viewer.navigateToRight).toHaveBeenCalled();
        });

        it("do nothing when navigation is disabled", function() {
            setDisabled(true);
            navigation.navigateToRight();

            expect(viewer.navigateToRight).not.toHaveBeenCalled();
        });
    });

    describe("increaseFontSize", function() {
        it("increases font size stored in ViewerOptions model", function () {
            setDisabled(false);
            var fontSize = viewerOptions.fontSize();
            navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25);

            navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 1.25 * 1.25);
        });

        it("do nothing when navigation is disabled", function() {
            setDisabled(true);
            var fontSize = viewerOptions.fontSize();
            navigation.increaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
        });
    });

    describe("decreaseFontSize", function() {
        it("decreases font size stored in ViewerOptions model", function() {
            setDisabled(false);
            var fontSize = viewerOptions.fontSize();
            navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8);

            navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize * 0.8 * 0.8);
        });

        it("do nothing when navigation is disabled", function() {
            setDisabled(true);
            var fontSize = viewerOptions.fontSize();
            navigation.decreaseFontSize();

            expect(viewerOptions.fontSize()).toBe(fontSize);
        });
    })
});
