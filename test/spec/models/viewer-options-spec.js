import ViewerOptions from "../../../src/js/models/viewer-options";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("ViewerOptions", function() {
    var location;

    beforeEach(function() {
        location = urlParameters.location;
    });

    afterEach(function() {
        urlParameters.location = location;
    });

    describe("constructor", function() {
        it("retrieves parameters from URL", function() {
            urlParameters.location = {href: "http://example.com#spread=true"};
            var options = new ViewerOptions();

            expect(options.spreadView()).toBe(true);

            urlParameters.location = {href: "http://example.com#spread=false"};
            options = new ViewerOptions();

            expect(options.spreadView()).toBe(false);
        });

        it("copies parameters from the argument", function() {
            var other = new ViewerOptions();
            other.spreadView(false);
            other.fontSize(20);
            other.zoom(1.2);
            var options = new ViewerOptions(other);

            expect(options.spreadView()).toBe(false);
            expect(options.fontSize()).toBe(20);
            expect(options.zoom()).toBe(1.2);
        });
    });

    describe("copyFrom", function() {
        it("copies parameters from the argument to itself", function() {
            var options = new ViewerOptions();
            options.spreadView(true);
            options.fontSize(10);
            options.zoom(1.4);
            var other = new ViewerOptions();
            other.spreadView(false);
            other.fontSize(20);
            other.zoom(1.2);
            options.copyFrom(other);

            expect(options.spreadView()).toBe(false);
            expect(options.fontSize()).toBe(20);
            expect(options.zoom()).toBe(1.2);
        });
    });

    describe("toObject", function() {
        it("converts parameters to an object", function() {
            var options = new ViewerOptions();
            options.spreadView(true);
            options.fontSize(20);
            options.zoom(1.2);

            expect(options.toObject()).toEqual({
                fontSize: 20,
                spreadView: true,
                zoom: 1.2
            });
        });
    });
});
