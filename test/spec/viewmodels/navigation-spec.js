import ko from "knockout";
import ViewerOptions from "../../../src/js/models/viewer-options";
import Navigation from "../../../src/js/viewmodels/navigation";

describe("Navigation", function() {
    var navigation;
    var viewerOptions;
    var viewer;
    var settingsPanel;

    beforeEach(function() {
        viewerOptions = new ViewerOptions();
        viewer = {
            state: {navigatable: ko.observable(false)},
            navigateToPrevious: function() {},
            navigateToNext: function() {},
            navigateToLeft: function() {},
            navigateToRight: function() {},
            navigateToFirst: function() {},
            navigateToLast: function() {}
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
